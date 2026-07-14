-- Add clothing sizes to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shirt_size TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pants_size TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shoe_size TEXT;
