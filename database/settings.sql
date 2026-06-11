-- Run after schema.sql in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS settings (
  id           SMALLINT PRIMARY KEY DEFAULT 1,
  tshirt_price INT      NOT NULL DEFAULT 4999,   -- in centavos
  stock        JSONB    NOT NULL DEFAULT '{"S": 100, "M": 100, "L": 100, "XL": 100, "2XL": 100}'::jsonb,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the single settings row (safe to run multiple times)
INSERT INTO settings (id, tshirt_price, stock)
VALUES (
  1,
  4999,
  '{"S": 100, "M": 100, "L": 100, "XL": 100, "2XL": 100}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- RLS: only service role can read/write (all access goes through API routes)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
