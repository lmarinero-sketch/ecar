-- ================================================================
-- PARTE DIARIO DE VEHÍCULO — ECAR ERP
-- Tabla: vehicle_daily_reports
-- Extensión: campo vehicle_condition en fuel_vehicles
-- ================================================================

-- ═══════════════ 1. EXTENDER MAESTRO DE FLOTA ═══════════════
ALTER TABLE fuel_vehicles ADD COLUMN IF NOT EXISTS vehicle_condition VARCHAR(30) DEFAULT 'operativo';
-- Valores: 'operativo', 'con_observaciones', 'fuera_de_servicio'

-- ═══════════════ 2. TABLA DE PARTES DIARIOS VEHICULARES ═══════════════
CREATE TABLE IF NOT EXISTS vehicle_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  vehicle_id UUID NOT NULL REFERENCES fuel_vehicles(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_time TIME DEFAULT CURRENT_TIME,
  driver_name VARCHAR(100) NOT NULL,
  project_id UUID REFERENCES projects(id),
  odometer_km INTEGER,
  fuel_level VARCHAR(20) DEFAULT 'medio',
  -- Valores: 'vacio', 'cuarto', 'medio', 'tres_cuartos', 'lleno'
  checklist JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"item": "Luces", "estado": "ok", "nota": ""}, ...]
  has_damage BOOLEAN DEFAULT false,
  damage_description TEXT,
  damage_photos TEXT[] DEFAULT '{}',
  observations TEXT,
  signed_by VARCHAR(100),
  vehicle_condition_after VARCHAR(30) DEFAULT 'operativo',
  -- Estado resultante del vehículo después de la inspección
  source VARCHAR(20) DEFAULT 'web',
  -- Valores: 'qr', 'web', 'mobile'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 3. RLS ═══════════════
ALTER TABLE vehicle_daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vehicle_daily_reports_all" ON vehicle_daily_reports;
CREATE POLICY "vehicle_daily_reports_all" ON vehicle_daily_reports FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════ 4. INDICES ═══════════════
DROP INDEX IF EXISTS idx_vdr_vehicle;
CREATE INDEX idx_vdr_vehicle ON vehicle_daily_reports(vehicle_id);

DROP INDEX IF EXISTS idx_vdr_date;
CREATE INDEX idx_vdr_date ON vehicle_daily_reports(report_date);

DROP INDEX IF EXISTS idx_vdr_project;
CREATE INDEX idx_vdr_project ON vehicle_daily_reports(project_id);

DROP INDEX IF EXISTS idx_vdr_damage;
CREATE INDEX idx_vdr_damage ON vehicle_daily_reports(has_damage) WHERE has_damage = true;
