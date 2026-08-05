-- Alter wbs_elements to support execution assignment
ALTER TABLE wbs_elements
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendiente';

-- Update quality_checklists to link to WBS instead of Work Orders
ALTER TABLE quality_checklists
DROP COLUMN IF EXISTS work_order_id,
ADD COLUMN IF NOT EXISTS wbs_element_id UUID REFERENCES wbs_elements(id) ON DELETE CASCADE;

-- Drop work_orders table
DROP TABLE IF EXISTS work_orders CASCADE;
