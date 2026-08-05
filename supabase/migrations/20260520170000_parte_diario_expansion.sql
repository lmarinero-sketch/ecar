-- =============================================
-- ECAR: Expansión Parte Diario de Obra
-- MIGRACIÓN ADITIVA — NO MODIFICA NI ELIMINA DATOS EXISTENTES
-- Solo agrega columnas, tablas, índices y policies nuevas
-- =============================================

-- ─── Nuevas columnas en parte_diario (no afecta datos existentes) ───────
ALTER TABLE parte_diario ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE parte_diario ADD COLUMN IF NOT EXISTS avance_porcentual numeric DEFAULT 0;
ALTER TABLE parte_diario ADD COLUMN IF NOT EXISTS tareas_realizadas jsonb DEFAULT '[]';

-- ─── 1. FOTOS DEL PARTE (tabla nueva) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS parte_diario_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id uuid NOT NULL REFERENCES parte_diario(id) ON DELETE CASCADE,
  foto_url text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'avance' CHECK (tipo IN ('avance','entrega','incidente','otro')),
  taken_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parte_fotos_parte ON parte_diario_fotos(parte_id);

ALTER TABLE parte_diario_fotos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parte_diario_fotos' AND policyname = 'parte_fotos_all') THEN
    DROP POLICY IF EXISTS "parte_fotos_all" ON parte_diario_fotos;
CREATE POLICY "parte_fotos_all" ON parte_diario_fotos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 2. SOLICITUDES DE MATERIALES DESDE PARTE (tabla nueva) ────────────
CREATE TABLE IF NOT EXISTS parte_diario_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  parte_id uuid NOT NULL REFERENCES parte_diario(id) ON DELETE CASCADE,
  item_id uuid REFERENCES inventory_items(id),
  descripcion text NOT NULL,
  cantidad numeric NOT NULL,
  unidad text DEFAULT 'unidad',
  urgencia text DEFAULT 'normal' CHECK (urgencia IN ('baja','normal','urgente')),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','entregada')),
  purchase_request_id uuid REFERENCES purchase_requests(id),
  aprobada_por text,
  aprobada_en timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parte_sol_parte ON parte_diario_solicitudes(parte_id);
CREATE INDEX IF NOT EXISTS idx_parte_sol_estado ON parte_diario_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_parte_sol_item ON parte_diario_solicitudes(item_id);

ALTER TABLE parte_diario_solicitudes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parte_diario_solicitudes' AND policyname = 'parte_solicitudes_all') THEN
    DROP POLICY IF EXISTS "parte_solicitudes_all" ON parte_diario_solicitudes;
CREATE POLICY "parte_solicitudes_all" ON parte_diario_solicitudes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 3. PERSONAL PRESENTE (tabla nueva) ────────────────────────────────
CREATE TABLE IF NOT EXISTS parte_diario_personal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id uuid NOT NULL REFERENCES parte_diario(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id),
  horas_trabajadas numeric DEFAULT 8,
  tarea text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parte_personal_parte ON parte_diario_personal(parte_id);
CREATE INDEX IF NOT EXISTS idx_parte_personal_employee ON parte_diario_personal(employee_id);

ALTER TABLE parte_diario_personal ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parte_diario_personal' AND policyname = 'parte_personal_all') THEN
    DROP POLICY IF EXISTS "parte_personal_all" ON parte_diario_personal;
CREATE POLICY "parte_personal_all" ON parte_diario_personal FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 4. EQUIPOS EN OBRA (tabla nueva) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS parte_diario_equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id uuid NOT NULL REFERENCES parte_diario(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES fuel_vehicles(id),
  horas_uso numeric DEFAULT 0,
  tarea text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parte_equipos_parte ON parte_diario_equipos(parte_id);
CREATE INDEX IF NOT EXISTS idx_parte_equipos_vehicle ON parte_diario_equipos(vehicle_id);

ALTER TABLE parte_diario_equipos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parte_diario_equipos' AND policyname = 'parte_equipos_all') THEN
    DROP POLICY IF EXISTS "parte_equipos_all" ON parte_diario_equipos;
CREATE POLICY "parte_equipos_all" ON parte_diario_equipos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 5. STORAGE BUCKET (idempotente) ───────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('parte-diario-fotos', 'parte-diario-fotos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'parte_fotos_upload') THEN
    DROP POLICY IF EXISTS "parte_fotos_upload" ON storage.objects;
CREATE POLICY "parte_fotos_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'parte-diario-fotos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'parte_fotos_read') THEN
    DROP POLICY IF EXISTS "parte_fotos_read" ON storage.objects;
CREATE POLICY "parte_fotos_read" ON storage.objects FOR SELECT USING (bucket_id = 'parte-diario-fotos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'parte_fotos_delete') THEN
    DROP POLICY IF EXISTS "parte_fotos_delete" ON storage.objects;
CREATE POLICY "parte_fotos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'parte-diario-fotos');
  END IF;
END $$;
