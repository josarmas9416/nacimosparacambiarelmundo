-- Run this in the Supabase SQL editor after settings.sql.
-- Creates atomic stock management functions used by the order API routes.

CREATE OR REPLACE FUNCTION decrement_stock(size_quantities JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock  JSONB;
  new_stock      JSONB;
  size_key       TEXT;
  requested_qty  INT;
  available_qty  INT;
BEGIN
  -- Lock the single settings row for the duration of this transaction
  SELECT stock INTO current_stock
  FROM settings
  WHERE id = 1
  FOR UPDATE;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Settings row not found';
  END IF;

  -- ── Pass 1: validate every requested size has enough stock ──────────────
  FOR size_key IN SELECT jsonb_object_keys(size_quantities) LOOP
    requested_qty := (size_quantities ->> size_key)::INT;
    available_qty := COALESCE((current_stock ->> size_key)::INT, 0);

    IF requested_qty > 0 AND available_qty < requested_qty THEN
      RAISE EXCEPTION 'STOCK_INSUFICIENTE:% disponible:% solicitado:%',
        size_key, available_qty, requested_qty;
    END IF;
  END LOOP;

  -- ── Pass 2: decrement ───────────────────────────────────────────────────
  new_stock := current_stock;
  FOR size_key IN SELECT jsonb_object_keys(size_quantities) LOOP
    requested_qty := (size_quantities ->> size_key)::INT;
    IF requested_qty > 0 THEN
      available_qty := (current_stock ->> size_key)::INT;
      new_stock := jsonb_set(
        new_stock,
        ARRAY[size_key],
        to_jsonb(available_qty - requested_qty)
      );
    END IF;
  END LOOP;

  UPDATE settings
  SET stock = new_stock, updated_at = now()
  WHERE id = 1;

  RETURN new_stock;
END;
$$;

-- Adds back stock for a cancelled order (no validation needed — just increment).
CREATE OR REPLACE FUNCTION restore_stock(size_quantities JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock JSONB;
  new_stock     JSONB;
  size_key      TEXT;
  qty           INT;
BEGIN
  SELECT stock INTO current_stock FROM settings WHERE id = 1 FOR UPDATE;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Settings row not found';
  END IF;

  new_stock := current_stock;
  FOR size_key IN SELECT jsonb_object_keys(size_quantities) LOOP
    qty := (size_quantities ->> size_key)::INT;
    IF qty > 0 THEN
      new_stock := jsonb_set(
        new_stock,
        ARRAY[size_key],
        to_jsonb(COALESCE((current_stock ->> size_key)::INT, 0) + qty)
      );
    END IF;
  END LOOP;

  UPDATE settings SET stock = new_stock, updated_at = now() WHERE id = 1;

  RETURN new_stock;
END;
$$;
