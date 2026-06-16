-- Run in Supabase SQL editor.
-- Renames payphone_transaction_id → payment_reference.

ALTER TABLE orders RENAME COLUMN payphone_transaction_id TO payment_reference;
