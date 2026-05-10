-- =============================================
-- GASTOS OPERATIVOS — Estructura de gastos mensuales ECAR
-- Replica la planilla Excel "RESUMEN GASTOS MESUALES"
-- =============================================

-- Tabla maestra de items de gasto (la "plantilla")
CREATE TABLE gastos_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  categoria text NOT NULL, -- personal, seguros, servicios, impuestos, gremios, combustibles, terceros, servicios_contratados, viandas, varios
  descripcion text NOT NULL, -- ej: "NATURGY CORDOBA", "TELEFONIA GUSTAVO"
  orden int DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Registros mensuales de gasto (cada fila = 1 item + 1 mes)
CREATE TABLE gastos_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  item_id uuid REFERENCES gastos_items(id) ON DELETE CASCADE,
  periodo text NOT NULL, -- 'YYYY-MM' (ej: '2026-01')
  monto numeric(15,2) NOT NULL DEFAULT 0,
  pagado boolean DEFAULT false,
  fecha_pago date,
  metodo_pago text, -- efectivo, transferencia, cheque, echeq, tarjeta
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(item_id, periodo)
);

-- RLS
ALTER TABLE gastos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gastos_items_all" ON gastos_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "gastos_registros_all" ON gastos_registros FOR ALL USING (true) WITH CHECK (true);

-- Indices
CREATE INDEX idx_gastos_items_cat ON gastos_items(categoria);
CREATE INDEX idx_gastos_registros_periodo ON gastos_registros(periodo);
CREATE INDEX idx_gastos_registros_item ON gastos_registros(item_id);

-- =============================================
-- SEED: Categorías e items de la planilla ECAR
-- =============================================
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM tenants LIMIT 1;
  IF tid IS NULL THEN RETURN; END IF;

  -- PERSONAL ECAR - HONORARIOS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'personal', 'SUELDOS OBREROS', 1),
    (tid, 'personal', 'GUSTAVO REGALADO', 2),
    (tid, 'personal', 'ADOLFO', 3),
    (tid, 'personal', 'FERNANDO ORTIZ (DPRG)', 4),
    (tid, 'personal', 'ELIO', 5),
    (tid, 'personal', 'GABRIELA', 6),
    (tid, 'personal', 'ENRICO', 7),
    (tid, 'personal', 'DEBORA REC. HYS ALBARDON', 8),
    (tid, 'personal', 'BRUNO GUEVARA', 9),
    (tid, 'personal', 'ESTUDIO CONTABLE (HONORARIOS)', 10);

  -- SEGUROS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'seguros', 'ACCID. PERSONALES', 1),
    (tid, 'seguros', 'SEGUROS LIDERAR', 2);

  -- SERVICIOS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'servicios', 'OSSE ALMAFUERTE Y SANTA FE', 1),
    (tid, 'servicios', 'NATURGY ALMAFUERTE', 2),
    (tid, 'servicios', 'NATURGY CORDOBA', 3),
    (tid, 'servicios', 'NATURGY Bº RIVADAVIA', 4),
    (tid, 'servicios', 'NATURGY ORO', 5),
    (tid, 'servicios', 'GAS CORDOBA', 6),
    (tid, 'servicios', 'GAS Bº RIVADAVIA', 7),
    (tid, 'servicios', 'GAS ORO', 8),
    (tid, 'servicios', 'EXPENSAS CORDOBA', 9),
    (tid, 'servicios', 'EXPENSAS ORO', 10),
    (tid, 'servicios', 'TELEFONIA GUSTAVO', 11),
    (tid, 'servicios', 'TELEFONIA ADOLFO', 12),
    (tid, 'servicios', 'TELEFONIA GABRIELA', 13),
    (tid, 'servicios', 'INTERNET DEPO', 14),
    (tid, 'servicios', 'INTERNET OFICINA', 15);

  -- IMPUESTOS ARCA / PROVINCIA
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'impuestos', 'FORM. 931', 1),
    (tid, 'impuestos', 'AUTONOMOS', 2),
    (tid, 'impuestos', 'IVA', 3),
    (tid, 'impuestos', 'PLAN DE PAGO AFIP', 4),
    (tid, 'impuestos', 'AUTOMOTORES', 5),
    (tid, 'impuestos', 'INMOBILIARIO Vº AMERICA', 6),
    (tid, 'impuestos', 'INMOBILIARIO SUTYAGIF', 7),
    (tid, 'impuestos', 'IIBB', 8);

  -- GREMIOS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'gremios', 'IERIC Y FODECO (1%)', 1),
    (tid, 'gremios', 'UOCRA', 2);

  -- COMBUSTIBLES
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'combustibles', 'COMBUSTIBLES', 1);

  -- PAGOS A TERCEROS / PRÉSTAMOS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'terceros', 'CHEQUE / ECHEQ EMITIDOS', 1),
    (tid, 'terceros', 'GUSTAVO REGALADO', 2),
    (tid, 'terceros', 'EDUARDO PADILLA', 3);

  -- SERVICIOS HYS CONTRATADOS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'servicios_contratados', 'BAÑOS QUIMICOS', 1),
    (tid, 'servicios_contratados', 'CONTEINER', 2),
    (tid, 'servicios_contratados', 'LIMPIEZA OFICINA', 3),
    (tid, 'servicios_contratados', 'TANQUITO', 4);

  -- VIANDAS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'viandas', 'VIANDAS ECAR', 1);

  -- VARIOS
  INSERT INTO gastos_items (tenant_id, categoria, descripcion, orden) VALUES
    (tid, 'varios', 'ARREGLOS MENORES MAQUINA, MATERIALES MENORES, COMPRAS MENORES TARJETA VISA, ETC', 1);

END $$;
