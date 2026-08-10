-- Migration: Add station_name column to fuel_loads
ALTER TABLE fuel_loads
ADD COLUMN IF NOT EXISTS station_name VARCHAR(100);
