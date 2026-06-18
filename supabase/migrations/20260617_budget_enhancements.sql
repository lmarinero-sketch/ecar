-- ============================================================
-- MEJORAS MÓDULO PRESUPUESTOS — Campos adicionales PR-GPP-01
-- ============================================================

-- Nuevos campos en tabla budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS assumptions TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS exclusions TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 15;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT 'obra_nueva'
  CHECK (work_type IN ('obra_nueva', 'adicional', 'servicio', 'mantenimiento', 'instalacion', 'licitacion', 'cambio_alcance', 'consulta'));
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES budgets(id);
