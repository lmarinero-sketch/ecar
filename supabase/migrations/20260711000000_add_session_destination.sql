-- Migration to add destination coordinates to vehicle_tracking_sessions
ALTER TABLE vehicle_tracking_sessions
ADD COLUMN IF NOT EXISTS destination_lat NUMERIC(10,7),
ADD COLUMN IF NOT EXISTS destination_lng NUMERIC(10,7);
