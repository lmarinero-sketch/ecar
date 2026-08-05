-- Add metadata JSONB column to attendance_records
-- Stores device information (OS, browser, screen resolution, etc.) from QR check-in scans
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
