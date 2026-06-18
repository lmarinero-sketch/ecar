-- Add handoff checklist to budgets for tracking readiness to hand off to Obras
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS handoff_checklist jsonb DEFAULT '{}'::jsonb;
-- Track when it was handed off
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS handed_off_at timestamptz;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS handed_off_by uuid REFERENCES auth.users(id);
