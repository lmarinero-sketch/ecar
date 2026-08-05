-- Migración para Adicionales y Cambios de Alcance (PR-GO-01 / PR-GPP-01)
CREATE TABLE IF NOT EXISTS project_scope_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending_budget' CHECK (status IN ('pending_budget', 'pending_approval', 'approved', 'rejected')),
  economic_impact NUMERIC(14,2) DEFAULT 0,
  delay_days INTEGER DEFAULT 0,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_scope_changes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_scope_changes_all" ON project_scope_changes;
CREATE POLICY "project_scope_changes_all" ON project_scope_changes FOR ALL USING (true) WITH CHECK (true);

-- Migración para Checklist de Calidad (PR-GO-01)
CREATE TABLE IF NOT EXISTS quality_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  work_order_id UUID REFERENCES work_orders(id),
  title TEXT NOT NULL,
  inspector_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quality_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quality_checklists_all" ON quality_checklists;
CREATE POLICY "quality_checklists_all" ON quality_checklists FOR ALL USING (true) WITH CHECK (true);
