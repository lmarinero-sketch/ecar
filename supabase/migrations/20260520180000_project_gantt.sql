-- =============================================
-- ECAR: Expansión WBS para Gestión de Proyectos con Gantt
-- MIGRACIÓN ADITIVA — NO MODIFICA NI ELIMINA DATOS EXISTENTES
-- Pilares: Planificación, Programación, Ejecución, Retroalimentación
-- =============================================

-- ─── Expandir wbs_elements con campos de Gantt (aditivo) ───────────────
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 1;
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS dependency_id uuid REFERENCES wbs_elements(id);
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES employees(id);
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS phase text DEFAULT 'planificacion';
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS actual_start_date date;
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS actual_end_date date;
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS priority text DEFAULT 'media';
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE wbs_elements ADD COLUMN IF NOT EXISTS description text;

CREATE INDEX IF NOT EXISTS idx_wbs_phase ON wbs_elements(phase);
CREATE INDEX IF NOT EXISTS idx_wbs_assigned ON wbs_elements(assigned_to);
CREATE INDEX IF NOT EXISTS idx_wbs_dates ON wbs_elements(start_date, end_date);

-- ─── Tabla de Retroalimentación (nueva) ────────────────────────────────
CREATE TABLE IF NOT EXISTS project_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  wbs_element_id uuid REFERENCES wbs_elements(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('desviacion','leccion','mejora','riesgo')),
  descripcion text NOT NULL,
  impacto text,
  accion_correctiva text,
  responsable text,
  estado text DEFAULT 'abierto' CHECK (estado IN ('abierto','en_proceso','resuelto')),
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_project ON project_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_wbs ON project_feedback(wbs_element_id);
CREATE INDEX IF NOT EXISTS idx_feedback_estado ON project_feedback(estado);

ALTER TABLE project_feedback ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_feedback' AND policyname = 'project_feedback_all') THEN
    DROP POLICY IF EXISTS "project_feedback_all" ON project_feedback;
CREATE POLICY "project_feedback_all" ON project_feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
