-- ==============================================================================
-- ECAR: NUEVO NÚCLEO DE GESTIÓN DE OBRA (ESTÁNDAR DE INGENIERÍA 5 FASES)
-- REEMPLAZO TOTAL DE ARQUITECTURA: Fases 1 a 5 con Jerarquía Estricta e Incidencias
-- ==============================================================================

-- 1. TRAMOS Y NODOS ESPACIALES
CREATE TABLE IF NOT EXISTS obra_tramos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nodo_inicio TEXT NOT NULL,
  nodo_fin TEXT NOT NULL,
  longitud_m NUMERIC NOT NULL DEFAULT 0,
  calle_pasaje TEXT,
  diametro_mm NUMERIC DEFAULT 75,
  tipo_red TEXT DEFAULT 'Red distribuidora',
  servicios_count INTEGER DEFAULT 0,
  hidrantes_count INTEGER DEFAULT 0,
  ancho_zanja_m NUMERIC DEFAULT 0.60,
  profundidad_media_m NUMERIC DEFAULT 1.20,
  observaciones TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_tramos_project ON obra_tramos(project_id);

ALTER TABLE obra_tramos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_tramos' AND policyname = 'obra_tramos_all') THEN
    CREATE POLICY "obra_tramos_all" ON obra_tramos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. JERARQUÍA WBS: RUBROS
CREATE TABLE IF NOT EXISTS obra_rubros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  incidencia_pct NUMERIC DEFAULT 0,
  monto_total_ars NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_rubros_project ON obra_rubros(project_id);

ALTER TABLE obra_rubros ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_rubros' AND policyname = 'obra_rubros_all') THEN
    CREATE POLICY "obra_rubros_all" ON obra_rubros FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. JERARQUÍA WBS: SUBRUBROS
CREATE TABLE IF NOT EXISTS obra_subrubros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rubro_id UUID NOT NULL REFERENCES obra_rubros(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  incidencia_rubro_pct NUMERIC DEFAULT 0,
  incidencia_obra_pct NUMERIC DEFAULT 0,
  monto_total_ars NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_subrubros_rubro ON obra_subrubros(rubro_id);
CREATE INDEX IF NOT EXISTS idx_obra_subrubros_project ON obra_subrubros(project_id);

ALTER TABLE obra_subrubros ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_subrubros' AND policyname = 'obra_subrubros_all') THEN
    CREATE POLICY "obra_subrubros_all" ON obra_subrubros FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. JERARQUÍA WBS: ÍTEMS CONTRACTUALES MEDIBLES
CREATE TABLE IF NOT EXISTS obra_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subrubro_id UUID NOT NULL REFERENCES obra_subrubros(id) ON DELETE CASCADE,
  codigo_item TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'ml',
  cantidad_contractual NUMERIC NOT NULL DEFAULT 0,
  precio_unitario_ars NUMERIC NOT NULL DEFAULT 0,
  importe_contractual_ars NUMERIC NOT NULL DEFAULT 0,
  incidencia_subrubro_pct NUMERIC DEFAULT 0,
  incidencia_obra_pct NUMERIC DEFAULT 0,
  rendimiento_base_dia NUMERIC DEFAULT 70,
  criterio_medicion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_items_subrubro ON obra_items(subrubro_id);
CREATE INDEX IF NOT EXISTS idx_obra_items_project ON obra_items(project_id);

ALTER TABLE obra_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_items' AND policyname = 'obra_items_all') THEN
    CREATE POLICY "obra_items_all" ON obra_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. MATRIZ FÍSICA: TRAMO x ÍTEM (CÓMPUTO, SALDO Y ESTADO)
CREATE TABLE IF NOT EXISTS obra_tramo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tramo_id UUID NOT NULL REFERENCES obra_tramos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES obra_items(id) ON DELETE CASCADE,
  cantidad_prevista NUMERIC NOT NULL DEFAULT 0,
  cantidad_ejecutada NUMERIC NOT NULL DEFAULT 0,
  progreso_pct NUMERIC DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'no_iniciada' CHECK (estado IN ('no_iniciada', 'para_programar', 'programada', 'en_ejecucion', 'terminada', 'bloqueada')),
  restriccion_observacion TEXT,
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  responsable TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tramo_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_obra_tramo_items_project ON obra_tramo_items(project_id);
CREATE INDEX IF NOT EXISTS idx_obra_tramo_items_tramo ON obra_tramo_items(tramo_id);
CREATE INDEX IF NOT EXISTS idx_obra_tramo_items_item ON obra_tramo_items(item_id);
CREATE INDEX IF NOT EXISTS idx_obra_tramo_items_estado ON obra_tramo_items(estado);

ALTER TABLE obra_tramo_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_tramo_items' AND policyname = 'obra_tramo_items_all') THEN
    CREATE POLICY "obra_tramo_items_all" ON obra_tramo_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. FASE 2: ÓRDENES DIARIAS DE TRABAJO (ODT)
CREATE TABLE IF NOT EXISTS obra_ordenes_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  numero_odt TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tramo_item_id UUID NOT NULL REFERENCES obra_tramo_items(id) ON DELETE CASCADE,
  tramo_id UUID NOT NULL REFERENCES obra_tramos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES obra_items(id) ON DELETE CASCADE,
  meta_cantidad NUMERIC NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'ml',
  cuadrilla_id UUID REFERENCES obra_cuadrillas(id) ON DELETE SET NULL,
  cuadrilla_nombre TEXT,
  responsable_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  responsable_nombre TEXT,
  equipo_asignado TEXT,
  materiales_requeridos TEXT,
  inicio_plan TIME DEFAULT '07:30',
  fin_plan TIME DEFAULT '16:00',
  instrucciones_calidad TEXT,
  estado TEXT NOT NULL DEFAULT 'emitida' CHECK (estado IN ('borrador', 'emitida', 'en_ejecucion', 'cumplida', 'parcial', 'anulada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_odt_project ON obra_ordenes_trabajo(project_id);
CREATE INDEX IF NOT EXISTS idx_obra_odt_fecha ON obra_ordenes_trabajo(fecha);
CREATE INDEX IF NOT EXISTS idx_obra_odt_estado ON obra_ordenes_trabajo(estado);

ALTER TABLE obra_ordenes_trabajo ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_ordenes_trabajo' AND policyname = 'obra_ordenes_trabajo_all') THEN
    CREATE POLICY "obra_ordenes_trabajo_all" ON obra_ordenes_trabajo FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 7. FASE 3: CARGA FÍSICA EN TERRENO (PARTES DIARIOS POR ÍTEM)
CREATE TABLE IF NOT EXISTS obra_parte_diario_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  odt_id UUID REFERENCES obra_ordenes_trabajo(id) ON DELETE SET NULL,
  tramo_item_id UUID NOT NULL REFERENCES obra_tramo_items(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cantidad_real NUMERIC NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'ml',
  cumplimiento_pct NUMERIC DEFAULT 0,
  hora_inicio_real TIME,
  hora_fin_real TIME,
  horas_trabajadas NUMERIC DEFAULT 8,
  personal_real_count INTEGER DEFAULT 1,
  personal_nombres TEXT[] DEFAULT '{}',
  equipo_usado TEXT,
  horometro_inicio NUMERIC,
  horometro_fin NUMERIC,
  minutos_parada NUMERIC DEFAULT 0,
  motivo_parada TEXT,
  novedades_interferencias TEXT,
  incidente_calidad TEXT,
  fotos_urls TEXT[] DEFAULT '{}',
  responsable_carga TEXT,
  estado TEXT DEFAULT 'cargado' CHECK (estado IN ('cargado', 'aprobado', 'rechazado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_pdi_project ON obra_parte_diario_items(project_id);
CREATE INDEX IF NOT EXISTS idx_obra_pdi_fecha ON obra_parte_diario_items(fecha);
CREATE INDEX IF NOT EXISTS idx_obra_pdi_odt ON obra_parte_diario_items(odt_id);

ALTER TABLE obra_parte_diario_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_parte_diario_items' AND policyname = 'obra_parte_diario_items_all') THEN
    CREATE POLICY "obra_parte_diario_items_all" ON obra_parte_diario_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 8. FASE 4: HITOS TÉCNICOS BINARIOS (0% o 100%)
CREATE TABLE IF NOT EXISTS obra_hitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tramo_id UUID REFERENCES obra_tramos(id) ON DELETE CASCADE,
  codigo_hito TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'inspeccion' CHECK (tipo IN ('inspeccion', 'laboratorio', 'prueba_hidraulica', 'aprobacion_ente', 'recepcion')),
  ente_regulador TEXT,
  estado_binario INTEGER NOT NULL DEFAULT 0 CHECK (estado_binario IN (0, 100)),
  fecha_inspeccion DATE,
  acta_numero TEXT,
  acta_url TEXT,
  inspector_nombre TEXT,
  bloquea_item_id UUID REFERENCES obra_items(id) ON DELETE SET NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_hitos_project ON obra_hitos(project_id);
CREATE INDEX IF NOT EXISTS idx_obra_hitos_tramo ON obra_hitos(tramo_id);

ALTER TABLE obra_hitos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_hitos' AND policyname = 'obra_hitos_all') THEN
    CREATE POLICY "obra_hitos_all" ON obra_hitos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 9. FASE 4: CERTIFICADOS DE OBRA CONTRACTUALES
CREATE TABLE IF NOT EXISTS obra_certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  numero_certificado INTEGER NOT NULL,
  periodo_desde DATE NOT NULL,
  periodo_hasta DATE NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  base_contractual_ars NUMERIC NOT NULL DEFAULT 0,
  anterior_sin_iva NUMERIC DEFAULT 0,
  presente_sin_iva NUMERIC DEFAULT 0,
  acumulado_sin_iva NUMERIC DEFAULT 0,
  saldo_sin_iva NUMERIC DEFAULT 0,
  avance_acumulado_pct NUMERIC DEFAULT 0,
  iva_presente NUMERIC DEFAULT 0,
  total_con_iva NUMERIC DEFAULT 0,
  fondo_reparo_retencion NUMERIC DEFAULT 0,
  amortizacion_anticipo NUMERIC DEFAULT 0,
  neto_a_cobrar NUMERIC DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'aprobado', 'cerrado', 'anulado')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_cert_project ON obra_certificados(project_id);
CREATE INDEX IF NOT EXISTS idx_obra_cert_numero ON obra_certificados(numero_certificado);

ALTER TABLE obra_certificados ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_certificados' AND policyname = 'obra_certificados_all') THEN
    CREATE POLICY "obra_certificados_all" ON obra_certificados FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10. DETALLE DE LÍNEAS DE CERTIFICADO (HISTORIAL INMUTABLE)
CREATE TABLE IF NOT EXISTS obra_certificado_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificado_id UUID NOT NULL REFERENCES obra_certificados(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES obra_items(id) ON DELETE RESTRICT,
  codigo_item TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  unidad TEXT NOT NULL,
  cantidad_contractual NUMERIC NOT NULL,
  precio_unitario_ars NUMERIC NOT NULL,
  importe_contractual_ars NUMERIC NOT NULL,
  cantidad_anterior NUMERIC NOT NULL DEFAULT 0,
  cantidad_presente NUMERIC NOT NULL DEFAULT 0,
  cantidad_acumulada NUMERIC NOT NULL DEFAULT 0,
  importe_anterior NUMERIC NOT NULL DEFAULT 0,
  importe_presente NUMERIC NOT NULL DEFAULT 0,
  importe_acumulado NUMERIC NOT NULL DEFAULT 0,
  saldo_importe NUMERIC NOT NULL DEFAULT 0,
  avance_acumulado_pct NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_cert_lineas_cert ON obra_certificado_lineas(certificado_id);

ALTER TABLE obra_certificado_lineas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_certificado_lineas' AND policyname = 'obra_certificado_lineas_all') THEN
    CREATE POLICY "obra_certificado_lineas_all" ON obra_certificado_lineas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 11. FASE 5: RETROALIMENTACIÓN Y LECCIONES APRENDIDAS
CREATE TABLE IF NOT EXISTS obra_lecciones_aprendidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id UUID REFERENCES obra_items(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('rendimiento', 'calidad', 'seguridad', 'interferencia_suelo', 'proveedor', 'maquinaria')),
  titulo TEXT NOT NULL,
  descripcion_problema TEXT NOT NULL,
  causa_raiz TEXT,
  accion_adoptada TEXT NOT NULL,
  rendimiento_cotizado NUMERIC,
  rendimiento_real_obtenido NUMERIC,
  impacto_costo_ars NUMERIC DEFAULT 0,
  recomendacion_futura TEXT NOT NULL,
  autor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_lecciones_project ON obra_lecciones_aprendidas(project_id);

ALTER TABLE obra_lecciones_aprendidas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_lecciones_aprendidas' AND policyname = 'obra_lecciones_aprendidas_all') THEN
    CREATE POLICY "obra_lecciones_aprendidas_all" ON obra_lecciones_aprendidas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
