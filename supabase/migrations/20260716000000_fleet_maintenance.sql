-- Fleet Maintenance Orders
CREATE TABLE IF NOT EXISTS fleet_maintenance_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  vehicle_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  mechanic_assigned TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_taller', 'terminado')),
  start_date DATE,
  completion_date DATE,
  cost_materials NUMERIC(10,2) DEFAULT 0,
  cost_labor NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (cost_materials + cost_labor) STORED,
  odometer_at_entry INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

ALTER TABLE fleet_maintenance_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fleet_maintenance_all" ON fleet_maintenance_orders;
CREATE POLICY "fleet_maintenance_all" ON fleet_maintenance_orders FOR ALL USING (true) WITH CHECK (true);

-- Fleet Tires
CREATE TABLE IF NOT EXISTS fleet_tires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  vehicle_id UUID,
  code VARCHAR(50) NOT NULL,
  brand VARCHAR(50),
  model VARCHAR(50),
  size VARCHAR(20),
  position VARCHAR(30), -- 'Eje Delantero Izq', 'Dual Trasero Der Int', etc.
  status TEXT DEFAULT 'en_uso' CHECK (status IN ('en_uso', 'en_recapado', 'baja', 'stock')),
  km_installed INTEGER,
  expected_lifespan_km INTEGER,
  tread_depth_mm NUMERIC(5,2), -- Profundidad del surco
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

ALTER TABLE fleet_tires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fleet_tires_all" ON fleet_tires;
CREATE POLICY "fleet_tires_all" ON fleet_tires FOR ALL USING (true) WITH CHECK (true);
