-- Run in the Supabase SQL editor to add store toggle + notice to the settings table.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS store_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS store_notice TEXT    NOT NULL DEFAULT '';
