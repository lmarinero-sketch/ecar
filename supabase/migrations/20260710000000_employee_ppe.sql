CREATE TABLE IF NOT EXISTS employee_ppe_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('pantalon', 'zapatos', 'campera', 'camisa', 'remera', 'otro')),
  size TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  delivery_date DATE NOT NULL,
  notes TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE employee_ppe_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their tenant's PPE deliveries" ON employee_ppe_deliveries;
CREATE POLICY "Users can read their tenant's PPE deliveries" ON employee_ppe_deliveries FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert PPE deliveries in their tenant" ON employee_ppe_deliveries;
CREATE POLICY "Users can insert PPE deliveries in their tenant" ON employee_ppe_deliveries FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update PPE deliveries in their tenant" ON employee_ppe_deliveries;
CREATE POLICY "Users can update PPE deliveries in their tenant" ON employee_ppe_deliveries FOR UPDATE
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete PPE deliveries in their tenant" ON employee_ppe_deliveries;
CREATE POLICY "Users can delete PPE deliveries in their tenant" ON employee_ppe_deliveries FOR DELETE
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
