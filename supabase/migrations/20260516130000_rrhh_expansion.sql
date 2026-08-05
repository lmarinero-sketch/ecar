-- ============================================
-- ECAR RRHH Expansion Migration
-- 2026-05-16
-- ============================================

-- 1. Nuevos campos en employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_alias_cbu text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS trial_start_date date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS digital_signature_url text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS obra_social text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS art_provider text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS modo_liquidacion text; -- quincenal, mensual
ALTER TABLE employees ADD COLUMN IF NOT EXISTS retribucion_pactada numeric(12,2);

-- 2. Tabla de ausencias (vacaciones, enfermedades, suspensiones, ART)
CREATE TABLE IF NOT EXISTS employee_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('vacation', 'medical', 'suspension', 'art_leave')),
  start_date date NOT NULL,
  end_date date,
  days int,
  reason text,
  certificate_url text,
  art_case_number text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- 3. Tabla de adelantos
CREATE TABLE IF NOT EXISTS employee_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount_ars numeric(12,2) NOT NULL,
  advance_date date NOT NULL,
  reason text,
  deducted boolean DEFAULT false,
  deducted_from_period text,
  created_at timestamptz DEFAULT now()
);

-- 4. Historial salarial
CREATE TABLE IF NOT EXISTS salary_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  category_id uuid REFERENCES union_categories(id),
  hourly_rate_ars numeric(10,2),
  daily_rate_ars numeric(10,2),
  effective_from date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- 5. Tareas diarias (to-do para obligaciones)
CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  title text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 6. RLS Policies
ALTER TABLE employee_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON employee_absences;
CREATE POLICY "Allow all for authenticated" ON employee_absences FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for authenticated" ON employee_advances;
CREATE POLICY "Allow all for authenticated" ON employee_advances FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for authenticated" ON salary_history;
CREATE POLICY "Allow all for authenticated" ON salary_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for authenticated" ON daily_tasks;
CREATE POLICY "Allow all for authenticated" ON daily_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_absences_employee ON employee_absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_advances_employee ON employee_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_employee ON salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status, due_date);
