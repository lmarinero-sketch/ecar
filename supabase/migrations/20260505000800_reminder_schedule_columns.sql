-- Add scheduling columns to notification_reminders
-- Supports: specific days of week, time of day, and date range

ALTER TABLE notification_reminders 
  ADD COLUMN IF NOT EXISTS schedule_days INTEGER[] DEFAULT '{}', -- 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
  ADD COLUMN IF NOT EXISTS schedule_time TIME DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS date_from DATE,
  ADD COLUMN IF NOT EXISTS date_until DATE,
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ;
