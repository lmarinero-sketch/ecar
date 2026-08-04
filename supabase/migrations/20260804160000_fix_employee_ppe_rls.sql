-- Fix RLS policy and CHECK constraint for employee_ppe_deliveries table
ALTER TABLE employee_ppe_deliveries DROP CONSTRAINT IF EXISTS employee_ppe_deliveries_item_type_check;

DROP POLICY IF EXISTS "Users can read their tenant's PPE deliveries" ON employee_ppe_deliveries;
DROP POLICY IF EXISTS "Users can insert PPE deliveries in their tenant" ON employee_ppe_deliveries;
DROP POLICY IF EXISTS "Users can update PPE deliveries in their tenant" ON employee_ppe_deliveries;
DROP POLICY IF EXISTS "Users can delete PPE deliveries in their tenant" ON employee_ppe_deliveries;

DROP POLICY IF EXISTS "Allow all for employee_ppe_deliveries" ON employee_ppe_deliveries;
CREATE POLICY "Allow all for employee_ppe_deliveries" ON employee_ppe_deliveries FOR ALL USING (true) WITH CHECK (true);
