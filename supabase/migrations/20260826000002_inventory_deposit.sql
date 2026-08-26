-- Migration: Add deposit column to inventory_items
-- Date: 2026-08-26

ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS deposit TEXT DEFAULT 'DEPOSITO RAWSON';

-- Backfill data based on the old "location" column string matches
UPDATE inventory_items 
SET deposit = 'ALMACEN CENTRAL' 
WHERE location ILIKE '%almacen%' OR location ILIKE '%central%';

UPDATE inventory_items 
SET deposit = 'DEPOSITO RAWSON' 
WHERE deposit IS NULL OR (location ILIKE '%rawson%' OR location ILIKE '%panol%' OR location ILIKE '%pañol%');
