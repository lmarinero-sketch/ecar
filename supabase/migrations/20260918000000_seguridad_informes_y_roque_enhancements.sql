-- =========================================================
-- ECAR: INFORMES SEMANALES DE HIGIENE Y SEGURIDAD (ENTREGABLES)
-- + ENHANCEMENTS DE RENDIMIENTOS Y CUADRILLAS (ROQUE)
-- MIGRACIÓN ADITIVA: NO ELIMINA TABLAS NI DATOS PREEXISTENTES
-- =========================================================

-- 1. Catálogo Estándar de Actividades Roque (Redes de Agua PEAD)
CREATE TABLE IF NOT EXISTS obra_actividades_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  codigo TEXT NOT NULL UNIQUE,
  actividad TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'ml',
  rendimiento_base_dia NUMERIC NOT NULL DEFAULT 70,
  equipo_sugerido TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE obra_actividades_catalogo ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_actividades_catalogo' AND policyname = 'obra_actividades_catalogo_all') THEN
    CREATE POLICY "obra_actividades_catalogo_all" ON obra_actividades_catalogo FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Poblado inicial con las 12 actividades estándar de Roque
INSERT INTO obra_actividades_catalogo (codigo, actividad, unidad, rendimiento_base_dia, equipo_sugerido)
VALUES
  ('AG-REP', 'Replanteo y marcación de traza', 'ml', 80, 'Herramientas / topografía'),
  ('AG-EXC', 'Excavación de zanja', 'ml', 70, 'Retropala'),
  ('AG-FON', 'Nivelación y conformación del fondo', 'ml', 80, 'Herramientas manuales'),
  ('AG-CAM', 'Cama de asiento compactada', 'ml', 80, 'Compactador'),
  ('AG-TUB', 'Instalación de cañería PEAD', 'ml', 65, 'Equipo PEAD / electrofusión'),
  ('AG-PAQ', 'Paquete estructural de 30 cm', 'ml', 70, 'Retropala'),
  ('AG-COMP', 'Compactación paquete estructural', 'ml', 70, 'Compactadores'),
  ('AG-C060', 'Capa cota -0,60 compactada', 'ml', 80, 'Compactadores'),
  ('AG-C030', 'Capa cota -0,30 compactada', 'ml', 80, 'Compactadores'),
  ('AG-CON', 'Conexiones domiciliarias', 'un', 4, 'Herramientas / electrofusión'),
  ('AG-ESP', 'Válvulas, hidrantes y especiales', 'un', 3, 'Herramientas / electrofusión'),
  ('AG-PRU', 'Pruebas, terminaciones y cierre', 'gl', 1, 'Bomba / manómetro / herramientas')
ON CONFLICT (codigo) DO UPDATE 
SET actividad = EXCLUDED.actividad,
    unidad = EXCLUDED.unidad,
    rendimiento_base_dia = EXCLUDED.rendimiento_base_dia,
    equipo_sugerido = EXCLUDED.equipo_sugerido;

-- 2. Estructura de Cuadrillas de Obra
CREATE TABLE IF NOT EXISTS obra_cuadrillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  responsable_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  responsable_nombre TEXT,
  integrantes_nombres TEXT[] DEFAULT '{}',
  equipo_principal TEXT,
  equipo_apoyo TEXT,
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_cuadrillas_project ON obra_cuadrillas(project_id);

ALTER TABLE obra_cuadrillas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obra_cuadrillas' AND policyname = 'obra_cuadrillas_all') THEN
    CREATE POLICY "obra_cuadrillas_all" ON obra_cuadrillas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Poblado de cuadrillas típicas de Roque
INSERT INTO obra_cuadrillas (codigo, nombre, responsable_nombre, integrantes_nombres, equipo_principal, observaciones)
VALUES
  ('C-01', 'Cuadrilla 1 - Excavaciones', 'B. Guevara', ARRAY['D. Pereyra', 'F. Flores', 'D. Gonzales'], 'Retropala HMK', 'Excavaciones y movimiento de suelo'),
  ('C-02', 'Cuadrilla 2 - Zanjas y Tapadas', 'B. Guevara', ARRAY['M. Nieva', 'J. Olmedo'], 'Retropala Maxion', 'Excavaciones y relleno de zanjas'),
  ('C-03', 'Cuadrilla 3 - Fusión y Pruebas', 'B. Guevara', ARRAY['A. Aguirre', 'J. Almagro', 'D. Castro'], 'Equipo PEAD / Bomba', 'Pruebas hidráulicas y armado de servicios')
ON CONFLICT DO NOTHING;

-- 3. Informes Semanales de Higiene y Seguridad (Entregables Oficiales)
CREATE TABLE IF NOT EXISTS seguridad_informes_semanales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Encabezado y Metadatos
  numero_informe TEXT NOT NULL,
  periodo_desde DATE NOT NULL,
  periodo_hasta DATE NOT NULL,
  titulo TEXT NOT NULL DEFAULT 'INFORME SEMANAL DE HIGIENE Y SEGURIDAD',
  tipo_informe TEXT NOT NULL DEFAULT 'Informe semanal de relevamiento',
  empresa TEXT NOT NULL DEFAULT 'ECAR SAS',
  comitente TEXT DEFAULT 'VALDIVIESO GROUP S.R.L.',
  sintesis_ejecutiva TEXT,
  
  -- Secciones Técnicas
  alcance TEXT,
  actividades_realizadas TEXT,
  situaciones_detectadas JSONB DEFAULT '[]'::jsonb,
  medidas_correctivas JSONB DEFAULT '[]'::jsonb,
  pendientes_seguimiento JSONB DEFAULT '[]'::jsonb,
  observacion_general TEXT,
  
  -- Firmas y Responsables
  responsable_hys_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  responsable_hys_nombre TEXT,
  matricula_hys TEXT,
  responsable_obra_nombre TEXT,
  
  -- Registro Fotográfico con Evidencias
  registro_fotografico JSONB DEFAULT '[]'::jsonb,
  
  -- Estado y Auditoría
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'emitido', 'entregado')),
  fecha_emision DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seg_inf_project ON seguridad_informes_semanales(project_id);
CREATE INDEX IF NOT EXISTS idx_seg_inf_periodo ON seguridad_informes_semanales(periodo_desde, periodo_hasta);

ALTER TABLE seguridad_informes_semanales ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seguridad_informes_semanales' AND policyname = 'seguridad_informes_semanales_all') THEN
    CREATE POLICY "seguridad_informes_semanales_all" ON seguridad_informes_semanales FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
