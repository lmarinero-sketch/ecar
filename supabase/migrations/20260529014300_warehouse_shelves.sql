-- =============================================
-- ESTANTERÍAS DEL DEPÓSITO
-- Configuración visual de la disposición de estanterías
-- =============================================

CREATE TABLE IF NOT EXISTS warehouse_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  code TEXT NOT NULL,            -- Ej: EST-01, EST-02, A, B
  name TEXT NOT NULL,            -- Ej: "Estantería Principal", "Rack Herramientas"
  shelf_type TEXT DEFAULT 'rack' CHECK (shelf_type IN ('rack', 'pallet', 'cabinet', 'floor', 'wall')),
  rows_count INT DEFAULT 4,     -- Cantidad de niveles/estantes
  columns_count INT DEFAULT 3,  -- Cantidad de divisiones por nivel
  color TEXT DEFAULT '#3B82F6',  -- Color para el diagrama
  grid_row INT DEFAULT 0,       -- Posición en la grilla del diagrama (fila)
  grid_col INT DEFAULT 0,       -- Posición en la grilla del diagrama (columna)
  grid_width INT DEFAULT 1,     -- Ancho en la grilla
  grid_height INT DEFAULT 1,    -- Alto en la grilla
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE warehouse_shelves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for warehouse_shelves" ON warehouse_shelves FOR ALL USING (true) WITH CHECK (true);

-- Agregar campo shelf_id a inventory_items para link directo
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS shelf_id UUID REFERENCES warehouse_shelves(id);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS shelf_position TEXT; -- Ej: "N2-C1" (Nivel 2, Columna 1)

-- Seed: Estanterías de ejemplo para una constructora
INSERT INTO warehouse_shelves (tenant_id, code, name, shelf_type, rows_count, columns_count, color, grid_row, grid_col, grid_width, grid_height, notes)
SELECT t.id, s.code, s.name, s.stype, s.rows_c, s.cols_c, s.color, s.gr, s.gc, s.gw, s.gh, s.notes
FROM tenants t,
(VALUES
  ('EST-01', 'Estantería Principal',    'rack',    5, 4, '#3B82F6', 0, 0, 2, 1, 'Materiales de obra generales'),
  ('EST-02', 'Rack Herramientas',       'cabinet', 3, 3, '#8B5CF6', 0, 2, 1, 1, 'Herramientas eléctricas y manuales'),
  ('EST-03', 'Estantería Consumibles',  'rack',    4, 3, '#F59E0B', 0, 3, 1, 1, 'Discos, clavos, tornillos, cables'),
  ('PAL-01', 'Zona Pallets',            'pallet',  1, 4, '#10B981', 1, 0, 2, 1, 'Bolsas de cemite, arena, piedra'),
  ('PIR-01', 'Piso Abierto',            'floor',   1, 1, '#6B7280', 1, 2, 2, 1, 'Hierros, caños, materiales largos')
) AS s(code, name, stype, rows_c, cols_c, color, gr, gc, gw, gh, notes)
LIMIT 1;
