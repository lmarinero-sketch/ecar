-- Migration to add is_driver flag to employees

ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_employees_is_driver ON employees(is_driver) WHERE is_driver = true;
