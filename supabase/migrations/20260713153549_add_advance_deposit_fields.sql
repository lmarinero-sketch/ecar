ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_deposit numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_redetermination_deposit numeric DEFAULT 0;
