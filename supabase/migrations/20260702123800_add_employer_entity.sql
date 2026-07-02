ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employer_entity text DEFAULT 'ECAR SAS';
