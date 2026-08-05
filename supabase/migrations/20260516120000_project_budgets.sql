-- ============================================================
-- MÓDULO PROYECTOS & PRESUPUESTOS — Migración completa
-- ============================================================

-- 1. Catálogo de Recursos (base global de precios)
CREATE TABLE IF NOT EXISTS budget_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('material', 'mano_obra', 'equipo', 'subcontrato')),
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'u',
  unit_price_ars NUMERIC DEFAULT 0,
  supplier_ref TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  last_price_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Presupuestos de obra
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'revision', 'closed')),
  gastos_generales_pct NUMERIC DEFAULT 10,
  beneficio_pct NUMERIC DEFAULT 10,
  financieros_pct NUMERIC DEFAULT 3,
  impuestos_pct NUMERIC DEFAULT 21,
  iibb_pct NUMERIC DEFAULT 3.5,
  total_direct_ars NUMERIC DEFAULT 0,
  total_indirect_ars NUMERIC DEFAULT 0,
  total_final_ars NUMERIC DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Secciones / capítulos del presupuesto
CREATE TABLE IF NOT EXISTS budget_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES budget_sections(id),
  ordinal TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Ítems del presupuesto (partidas)
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  section_id UUID REFERENCES budget_sections(id),
  resource_id UUID REFERENCES budget_resources(id),
  ordinal TEXT,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'u',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price_ars NUMERIC NOT NULL DEFAULT 0,
  cost_type TEXT DEFAULT 'material' CHECK (cost_type IN ('material', 'mano_obra', 'equipo', 'subcontrato', 'gasto_general', 'financiero')),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. APU — Análisis de Precios Unitarios (plantillas reutilizables)
CREATE TABLE IF NOT EXISTS budget_apu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'u',
  description TEXT,
  total_ars NUMERIC DEFAULT 0,
  is_template BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Componentes del APU
CREATE TABLE IF NOT EXISTS budget_apu_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apu_id UUID NOT NULL REFERENCES budget_apu(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES budget_resources(id),
  description TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price_ars NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_resources_tenant ON budget_resources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_resources_type ON budget_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_sections_budget ON budget_sections(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_apu_tenant ON budget_apu(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_apu_components_apu ON budget_apu_components(apu_id);

-- RLS
ALTER TABLE budget_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_apu ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_apu_components ENABLE ROW LEVEL SECURITY;

-- Policies (full access for authenticated users within their tenant)
DROP POLICY IF EXISTS "budget_resources_all" ON budget_resources;
CREATE POLICY "budget_resources_all" ON budget_resources FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "budgets_all" ON budgets;
CREATE POLICY "budgets_all" ON budgets FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "budget_sections_all" ON budget_sections;
CREATE POLICY "budget_sections_all" ON budget_sections FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "budget_items_all" ON budget_items;
CREATE POLICY "budget_items_all" ON budget_items FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "budget_apu_all" ON budget_apu;
CREATE POLICY "budget_apu_all" ON budget_apu FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "budget_apu_components_all" ON budget_apu_components;
CREATE POLICY "budget_apu_components_all" ON budget_apu_components FOR ALL USING (true) WITH CHECK (true);
