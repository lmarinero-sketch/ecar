-- Migration: Sync vehicle km from daily report
-- Date: 2026-08-25
-- Description: Creates a trigger that automatically updates the fuel_vehicles.current_km when a vehicle_daily_report is created.

CREATE OR REPLACE FUNCTION sync_vehicle_km_from_daily_report()
RETURNS trigger AS $$
BEGIN
  IF NEW.odometer_km IS NOT NULL THEN
    UPDATE fuel_vehicles 
    SET current_km = NEW.odometer_km 
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_vehicle_km ON vehicle_daily_reports;
CREATE TRIGGER trg_sync_vehicle_km
AFTER INSERT ON vehicle_daily_reports
FOR EACH ROW
EXECUTE FUNCTION sync_vehicle_km_from_daily_report();
