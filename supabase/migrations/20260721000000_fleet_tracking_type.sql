-- Add tracking type and hours for machinery support
ALTER TABLE fuel_vehicles 
ADD COLUMN tracking_type VARCHAR(10) DEFAULT 'km',
ADD COLUMN current_hours NUMERIC(10,2),
ADD COLUMN next_maintenance_hours NUMERIC(10,2);

ALTER TABLE vehicle_daily_reports
ADD COLUMN hourmeter NUMERIC(10,2);
