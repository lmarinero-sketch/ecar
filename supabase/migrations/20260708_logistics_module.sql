-- ============================================================
-- Logistics Module Tables
-- Entregas programadas a obra (acopios) y mantenimiento log
-- ============================================================

-- 1. Entregas programadas a obra
CREATE TABLE IF NOT EXISTS logistics_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente','en_transito','entregado','cancelado')),
  vehicle_id UUID REFERENCES fuel_vehicles(id),
  driver_name TEXT,
  destination TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Items de cada entrega
CREATE TABLE IF NOT EXISTS logistics_delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES logistics_deliveries(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id),
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  delivered_quantity NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente','parcial','entregado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Log de mantenimientos (complementa fuel_vehicles)
CREATE TABLE IF NOT EXISTS logistics_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  vehicle_id UUID NOT NULL REFERENCES fuel_vehicles(id),
  type TEXT NOT NULL DEFAULT 'service'
    CHECK (type IN ('service','vtv','seguro','reparacion','neumaticos','otro')),
  date DATE NOT NULL,
  km_hours NUMERIC,
  cost NUMERIC DEFAULT 0,
  provider TEXT,
  description TEXT,
  next_due_date DATE,
  next_due_km NUMERIC,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== RLS Policies ==========

ALTER TABLE logistics_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_maintenance_log ENABLE ROW LEVEL SECURITY;

-- logistics_deliveries
CREATE POLICY "logistics_deliveries_select" ON logistics_deliveries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "logistics_deliveries_insert" ON logistics_deliveries
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "logistics_deliveries_update" ON logistics_deliveries
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logistics_deliveries_delete" ON logistics_deliveries
  FOR DELETE TO authenticated USING (true);

-- logistics_delivery_items
CREATE POLICY "logistics_delivery_items_select" ON logistics_delivery_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "logistics_delivery_items_insert" ON logistics_delivery_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "logistics_delivery_items_update" ON logistics_delivery_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logistics_delivery_items_delete" ON logistics_delivery_items
  FOR DELETE TO authenticated USING (true);

-- logistics_maintenance_log
CREATE POLICY "logistics_maintenance_log_select" ON logistics_maintenance_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "logistics_maintenance_log_insert" ON logistics_maintenance_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "logistics_maintenance_log_update" ON logistics_maintenance_log
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logistics_maintenance_log_delete" ON logistics_maintenance_log
  FOR DELETE TO authenticated USING (true);
