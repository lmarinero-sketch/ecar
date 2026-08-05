-- =============================================
-- FASES 2-5: Inventario, Pañol, Pedidos de Compra
-- =============================================

-- 1. Inventario / Pañol
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'material' CHECK (category IN ('material','herramienta','consumible')),
  unit TEXT DEFAULT 'unidad',
  current_stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  location TEXT DEFAULT 'panol',
  qr_code TEXT,
  barcode TEXT,
  unit_cost NUMERIC DEFAULT 0,
  is_tool BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','return','adjustment')),
  quantity NUMERIC NOT NULL,
  project_id UUID REFERENCES projects(id),
  assigned_to UUID REFERENCES employees(id),
  notes TEXT,
  created_by TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tool_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  returned_date DATE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','returned','lost','damaged')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Pedidos de Compra desde Obra
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  requested_by TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low','normal','urgent')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','consolidated','ordered','received','rejected')),
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unidad',
  estimated_unit_cost NUMERIC DEFAULT 0,
  inventory_item_id UUID REFERENCES inventory_items(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for inventory_items" ON inventory_items;
CREATE POLICY "Allow all for inventory_items" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for inventory_movements" ON inventory_movements;
CREATE POLICY "Allow all for inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for tool_assignments" ON tool_assignments;
CREATE POLICY "Allow all for tool_assignments" ON tool_assignments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for purchase_requests" ON purchase_requests;
CREATE POLICY "Allow all for purchase_requests" ON purchase_requests FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for purchase_request_items" ON purchase_request_items;
CREATE POLICY "Allow all for purchase_request_items" ON purchase_request_items FOR ALL USING (true) WITH CHECK (true);

-- Add 'inventory' and 'purchase_requests' modules to admin profiles
UPDATE profiles
SET allowed_modules = allowed_modules || '["inventory"]'::jsonb
WHERE role = 'admin' AND NOT (allowed_modules ? 'inventory');

UPDATE profiles
SET allowed_modules = allowed_modules || '["purchase_requests"]'::jsonb
WHERE role = 'admin' AND NOT (allowed_modules ? 'purchase_requests');

-- Seed: Herramientas comunes de una constructora
INSERT INTO inventory_items (tenant_id, name, category, unit, current_stock, min_stock, is_tool, unit_cost)
SELECT t.id, item.name, item.cat, item.unit, item.stock, item.min_s, item.is_t, item.cost
FROM tenants t,
(VALUES
  ('Amoladora Bosch 7"',      'herramienta', 'unidad', 3, 2, true, 85000),
  ('Taladro percutor Dewalt', 'herramienta', 'unidad', 2, 1, true, 120000),
  ('Rotomartillo Hilti',      'herramienta', 'unidad', 1, 1, true, 450000),
  ('Sierra circular 7 1/4',   'herramienta', 'unidad', 2, 1, true, 95000),
  ('Nivel láser Bosch',       'herramienta', 'unidad', 1, 1, true, 180000),
  ('Cemite bolsa 50kg',       'material',    'bolsa',  45, 20, false, 8500),
  ('Hierro 10mm x 12m',       'material',    'barra',  80, 30, false, 12000),
  ('Hierro 8mm x 12m',        'material',    'barra',  120, 40, false, 9500),
  ('Placas yeso 1.20x2.40',   'material',    'unidad', 24, 10, false, 15000),
  ('Arena gruesa',             'material',    'm3',     8, 5, false, 35000),
  ('Piedra partida',           'material',    'm3',     6, 3, false, 42000),
  ('Caño PVC 110mm x 4m',     'material',    'unidad', 15, 5, false, 18000),
  ('Cable 2.5mm rollo 100m',  'consumible',  'rollo',  4, 2, false, 65000),
  ('Discos corte 7"',         'consumible',  'unidad', 30, 15, false, 3500),
  ('Clavos 2.5"',             'consumible',  'kg',     25, 10, false, 4200)
) AS item(name, cat, unit, stock, min_s, is_t, cost)
LIMIT 1;
