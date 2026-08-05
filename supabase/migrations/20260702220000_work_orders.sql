-- Orden de Trabajo Interna (OTI) — PR-GO-01
-- Define qué se ejecuta, quién responde y con qué criterio

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT, -- nombre del encargado/cuadrilla
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baja', 'normal', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_ejecucion', 'completada', 'cancelada')),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_orders_all" ON work_orders;
CREATE POLICY "work_orders_all" ON work_orders FOR ALL USING (true) WITH CHECK (true);
