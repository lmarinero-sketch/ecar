-- ============================================================
-- ALINEACIÓN GPP (PR-GPP-01) — Campos adicionales para trazabilidad
-- ============================================================

-- 1. Nuevos campos en la tabla budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS entry_checklist JSONB DEFAULT '{}'::jsonb;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS missing_info TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS risks JSONB DEFAULT '[]'::jsonb;

-- Campos para "Adicional" o "Cambio de Alcance"
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS change_origin TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS change_cause TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS change_technical_impact TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS change_economic_impact TEXT;

-- Campos para Cierre Post-Obra (Presupuesto vs Real)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS actual_cost_ars NUMERIC DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS cost_deviation_cause TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- 2. Nuevos campos en la tabla budget_items
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'none' CHECK (quote_status IN ('none', 'requested', 'received'));
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS quote_requested_at TIMESTAMPTZ;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS logistics_validation BOOLEAN DEFAULT false;

-- 3. Nueva tabla para archivos adjuntos del presupuesto
CREATE TABLE IF NOT EXISTS budget_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_files_budget ON budget_files(budget_id);

ALTER TABLE budget_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_files_all" ON budget_files FOR ALL USING (true) WITH CHECK (true);

-- Ensure a bucket exists for project-files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage
CREATE POLICY "budget_files_select" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "budget_files_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "budget_files_update" ON storage.objects FOR UPDATE USING (bucket_id = 'project-files');
CREATE POLICY "budget_files_delete" ON storage.objects FOR DELETE USING (bucket_id = 'project-files');
