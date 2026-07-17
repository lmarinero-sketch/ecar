-- Add new fields for warehouse inventory integration based on Excel import
ALTER TABLE inventory_items 
  ADD COLUMN IF NOT EXISTS rubro TEXT,
  ADD COLUMN IF NOT EXISTS measure TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
