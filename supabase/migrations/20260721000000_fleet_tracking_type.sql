-- Add tracking type and hours for machinery support
ALTER TABLE fuel_vehicles 
ADD COLUMN IF NOT EXISTS tracking_type VARCHAR(10) DEFAULT 'km',
ADD COLUMN IF NOT EXISTS current_hours NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS next_maintenance_hours NUMERIC(10,2);

ALTER TABLE vehicle_daily_reports
ADD COLUMN IF NOT EXISTS hourmeter NUMERIC(10,2);
