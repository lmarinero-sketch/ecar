-- Migration: Add unauthorized_load flag to fuel_loads
ALTER TABLE fuel_loads
ADD COLUMN IF NOT EXISTS unauthorized_load BOOLEAN DEFAULT FALSE;
