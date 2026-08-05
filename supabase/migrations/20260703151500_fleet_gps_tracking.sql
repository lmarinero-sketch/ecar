-- ================================================================
-- MÓDULO DE FLOTAS — TRACKING GPS
-- Tablas: vehicle_tracking_sessions, vehicle_tracking_points
-- ================================================================

-- ═══════════════ 1. SESIONES DE TRACKING ═══════════════
CREATE TABLE IF NOT EXISTS vehicle_tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  vehicle_id UUID REFERENCES fuel_vehicles(id) NOT NULL,
  driver_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_lat NUMERIC(10,7),
  last_lng NUMERIC(10,7),
  last_heading NUMERIC(5,1),
  last_speed NUMERIC(6,2),
  last_accuracy NUMERIC(6,1),
  last_update_at TIMESTAMPTZ,
  total_distance_km NUMERIC(10,2) DEFAULT 0
);

-- Solo puede haber una sesión activa por vehículo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session ON vehicle_tracking_sessions(vehicle_id) WHERE is_active = true;

-- ═══════════════ 2. PUNTOS HISTÓRICOS ═══════════════
CREATE TABLE IF NOT EXISTS vehicle_tracking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES vehicle_tracking_sessions(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES fuel_vehicles(id),
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  heading NUMERIC(5,1),
  speed NUMERIC(6,2),
  accuracy NUMERIC(6,1),
  altitude NUMERIC(8,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar consultas de históricos
CREATE INDEX IF NOT EXISTS idx_tracking_points_session ON vehicle_tracking_points(session_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_points_vehicle ON vehicle_tracking_points(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_active ON vehicle_tracking_sessions(is_active) WHERE is_active = true;

-- ═══════════════ 3. RLS POLICIES ═══════════════

ALTER TABLE vehicle_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tracking_points ENABLE ROW LEVEL SECURITY;

-- Permitir lectura general y anónima
DROP POLICY IF EXISTS "allow_authenticated_read" ON vehicle_tracking_sessions;
CREATE POLICY "allow_authenticated_read" ON vehicle_tracking_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_anon_read" ON vehicle_tracking_sessions;
CREATE POLICY "allow_anon_read" ON vehicle_tracking_sessions FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "allow_authenticated_read" ON vehicle_tracking_points;
CREATE POLICY "allow_authenticated_read" ON vehicle_tracking_points FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_anon_read" ON vehicle_tracking_points;
CREATE POLICY "allow_anon_read" ON vehicle_tracking_points FOR SELECT TO anon USING (true);

-- Permitir inserts y updates al rol anónimo (usado por el PWA sin login)
DROP POLICY IF EXISTS "allow_anon_insert" ON vehicle_tracking_sessions;
CREATE POLICY "allow_anon_insert" ON vehicle_tracking_sessions FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "allow_anon_update" ON vehicle_tracking_sessions;
CREATE POLICY "allow_anon_update" ON vehicle_tracking_sessions FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "allow_anon_insert" ON vehicle_tracking_points;
CREATE POLICY "allow_anon_insert" ON vehicle_tracking_points FOR INSERT TO anon WITH CHECK (true);

-- Políticas RLS tradicionales con tenant isolation
DROP POLICY IF EXISTS "tenant_isolation_all" ON vehicle_tracking_sessions;
CREATE POLICY "tenant_isolation_all" ON vehicle_tracking_sessions FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation_all_pts" ON vehicle_tracking_points;
CREATE POLICY "tenant_isolation_all_pts" ON vehicle_tracking_points FOR ALL USING (
  session_id IN (SELECT id FROM vehicle_tracking_sessions WHERE tenant_id = get_my_tenant_id())
);

-- Habilitar REPLICA IDENTITY para Realtime (solo si queremos escuchar en la DB, aunque usaremos Broadcast Channels)
ALTER TABLE vehicle_tracking_sessions REPLICA IDENTITY FULL;
