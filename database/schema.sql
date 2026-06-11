-- Run this in the Supabase SQL editor to create the orders table.

CREATE TABLE IF NOT EXISTS orders (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),

  -- Customer info
  nombre                   TEXT         NOT NULL,
  cedula                   TEXT,
  whatsapp                 TEXT         NOT NULL,
  correo                   TEXT,

  -- Shipping address
  pais                     TEXT         NOT NULL,
  provincia                TEXT,
  ciudad                   TEXT,
  direccion                TEXT,

  -- Order details
  sizes                    JSONB,         -- { "S": 0, "M": 2, "L": 0, "XL": 1, "2XL": 0 }
  total_units              INT,
  subtotal                 INT,           -- in centavos
  shipping_cost            INT,           -- in centavos
  total                    INT,           -- in centavos
  is_international         BOOLEAN        NOT NULL DEFAULT false,

  -- Status
  payment_status           TEXT           NOT NULL DEFAULT 'PENDIENTE',
    -- PENDIENTE | PAGADO | FALLIDO
  fulfillment_status       TEXT           NOT NULL DEFAULT 'EN PREPARACION',
    -- EN PREPARACION | ENVIADO | ENTREGADO | CANCELADO

  -- Payment
  payphone_transaction_id  TEXT,
  client_transaction_id    TEXT,

  -- Internal
  notes                    TEXT,

  CONSTRAINT chk_payment_status    CHECK (payment_status    IN ('PENDIENTE', 'PAGADO', 'FALLIDO')),
  CONSTRAINT chk_fulfillment_status CHECK (fulfillment_status IN ('EN PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO'))
);

-- Index for common admin queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at       ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status   ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders (fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_is_international ON orders (is_international);

-- Enable RLS (rows are only accessible via service role key from API routes)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- No public access — all reads/writes go through server-side API routes using the service role key.
