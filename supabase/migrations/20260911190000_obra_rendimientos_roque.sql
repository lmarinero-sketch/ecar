-- =========================================================
-- ECAR: MÓDULO DE CONTROL DE TAREAS Y RENDIMIENTOS (ROQUE)
-- MIGRACIÓN ADITIVA: NO ELIMINA NI MODIFICA TABLAS EXISTENTES
-- CONEXIÓN INTEGRAL CON: OBRAS, WBS, PRESUPUESTOS Y PEDIDOS
-- =========================================================

-- 1. Sectores / Tramos configurables por Proyecto
CREATE TABLE IF NOT EXISTS obra_sectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  manzana TEXT,
  nodos_tramo TEXT,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_sectores_project ON obra_sectores(project_id);

ALTER TABLE obra_sectores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_sectores' AND policyname = 'obra_sectores_all') THEN
    CREATE POLICY "obra_sectores_all" ON obra_sectores FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Matriz de Control de Tareas y Rendimientos
CREATE TABLE IF NOT EXISTS obra_control_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES obra_sectores(id) ON DELETE SET NULL,
  wbs_element_id UUID REFERENCES wbs_elements(id) ON DELETE SET NULL,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,
  parte_diario_id UUID REFERENCES parte_diario(id) ON DELETE SET NULL,
  
  -- Identificación y Fechas
  codigo_tarea TEXT NOT NULL,
  fecha_plan DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre DATE,
  
  -- Ubicación y Actividad
  sector_nombre TEXT,
  manzana TEXT,
  nodos_tramo TEXT,
  diametro_mm TEXT,
  actividad TEXT NOT NULL,
  unidad_medida TEXT DEFAULT 'm',
  
  -- Planificación
  cantidad_plan NUMERIC NOT NULL DEFAULT 0,
  rendimiento_objetivo_h NUMERIC DEFAULT 0,
  hora_inicio_plan TIME DEFAULT '07:30',
  hora_fin_plan TIME DEFAULT '15:30',
  cuadrilla_nombre TEXT,
  responsable_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  responsable_nombre TEXT,
  personal_plan_count NUMERIC DEFAULT 1,
  equipo_asignado TEXT,
  materiales_requeridos TEXT,
  epp_requerido TEXT,
  
  -- Ejecución Real
  hora_inicio_real TIME,
  hora_fin_real TIME,
  horas_reales NUMERIC DEFAULT 0,
  minutos_parada NUMERIC DEFAULT 0,
  horas_productivas NUMERIC DEFAULT 0,
  cantidad_real NUMERIC DEFAULT 0,
  personal_real_count NUMERIC DEFAULT 1,
  equipo_real TEXT,
  
  -- Fórmulas y KPIs Roque
  hh_plan NUMERIC DEFAULT 0,
  hh_real NUMERIC DEFAULT 0,
  cumplimiento_pct NUMERIC DEFAULT 0,
  rendimiento_real_h NUMERIC DEFAULT 0,
  hh_por_unidad NUMERIC DEFAULT 0,
  utilizacion_tiempo_pct NUMERIC DEFAULT 100,
  indice_productividad NUMERIC DEFAULT 0,
  desvio_horas NUMERIC DEFAULT 0,
  
  -- Gestión de Paradas y Causa Raíz
  motivo_desvio TEXT,
  observaciones TEXT,
  accion_correctiva TEXT,
  responsable_accion TEXT,
  fecha_compromiso_accion DATE,
  estado_accion TEXT DEFAULT 'abierta',
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_control_tareas_project ON obra_control_tareas(project_id);
CREATE INDEX IF NOT EXISTS idx_obra_control_tareas_estado ON obra_control_tareas(estado);
CREATE INDEX IF NOT EXISTS idx_obra_control_tareas_fecha ON obra_control_tareas(fecha_plan);
CREATE INDEX IF NOT EXISTS idx_obra_control_tareas_wbs ON obra_control_tareas(wbs_element_id);
CREATE INDEX IF NOT EXISTS idx_obra_control_tareas_budget ON obra_control_tareas(budget_item_id);

ALTER TABLE obra_control_tareas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_control_tareas' AND policyname = 'obra_control_tareas_all') THEN
    CREATE POLICY "obra_control_tareas_all" ON obra_control_tareas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Registro detallado de Paradas y Tiempos Muertos
CREATE TABLE IF NOT EXISTS obra_registro_paradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  tarea_id UUID NOT NULL REFERENCES obra_control_tareas(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio TIME,
  hora_fin TIME,
  duracion_minutos NUMERIC NOT NULL DEFAULT 0,
  motivo_parada TEXT NOT NULL,
  submotivo TEXT,
  impacto_hh NUMERIC DEFAULT 0,
  costo_estimado_ars NUMERIC DEFAULT 0,
  accion_inmediata TEXT,
  responsable TEXT,
  purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_paradas_tarea ON obra_registro_paradas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_obra_paradas_project ON obra_registro_paradas(project_id);

ALTER TABLE obra_registro_paradas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_registro_paradas' AND policyname = 'obra_registro_paradas_all') THEN
    CREATE POLICY "obra_registro_paradas_all" ON obra_registro_paradas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
