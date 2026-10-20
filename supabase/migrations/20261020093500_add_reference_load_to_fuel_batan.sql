-- Add reference_load and unit_price to fuel_batan_movements
ALTER TABLE fuel_batan_movements 
ADD COLUMN IF NOT EXISTS reference_load VARCHAR(50);

ALTER TABLE fuel_batan_movements 
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_fuel_batan_reference_load ON fuel_batan_movements(reference_load);
