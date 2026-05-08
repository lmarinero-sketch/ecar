-- =============================================
-- Seed: Datos financieros reales del Excel de Adolfo
-- Gastos fijos mensuales + Resúmenes mensuales
-- =============================================

-- Actualizar monthly_snapshots con datos reales completos del Excel
UPDATE monthly_snapshots
SET
  opening_balance = 56350999,
  total_income = 28368833.97,
  other_income = 2225000,
  total_expenses = 57089334.66,
  projected_closing = 29855498.31,
  real_closing = 31595386,
  deviation = 31595386 - 29855498.31,
  expense_breakdown = '{
    "personal_sueldos": 14907836,
    "personal_honorarios": 6885000,
    "seguros": 407600,
    "servicios": 523773.51,
    "impuestos_arca": 15237495.66,
    "gremios": 15120.70,
    "combustibles": 0,
    "cheques_echeq": 28576345.29,
    "pagos_terceros": 5200000,
    "servicios_contratados": 302500,
    "viandas": 49190.08,
    "varios": 3882550.62
  }'::jsonb
WHERE month = '2026-01-01';

UPDATE monthly_snapshots
SET
  opening_balance = 31595386,
  total_income = 92343495.21,
  other_income = 0,
  total_expenses = 63355461.26,
  projected_closing = 60583419.95,
  real_closing = 59437502,
  deviation = 59437502 - 60583419.95,
  expense_breakdown = '{
    "personal_sueldos": 12591785.32,
    "personal_honorarios": 6440000,
    "seguros": 407600,
    "servicios": 540637.26,
    "impuestos_arca": 14003539.25,
    "gremios": 916.84,
    "combustibles": 0,
    "cheques_echeq": 27594762.33,
    "pagos_terceros": 1072600,
    "servicios_contratados": 381500,
    "viandas": 145500,
    "varios": 4512967.51
  }'::jsonb
WHERE month = '2026-02-01';

UPDATE monthly_snapshots
SET
  opening_balance = 59437502,
  total_income = 37077453.16,
  other_income = 22800000,
  total_expenses = 41476134.12,
  projected_closing = 77838821.04,
  real_closing = 79311350,
  deviation = 79311350 - 77838821.04,
  expense_breakdown = '{
    "personal_sueldos": 14047250.60,
    "personal_honorarios": 3980000,
    "seguros": 447600,
    "servicios": 340589.91,
    "impuestos_arca": 8501446.83,
    "gremios": 8001.88,
    "combustibles": 0,
    "cheques_echeq": 12472478.34,
    "pagos_terceros": 0,
    "servicios_contratados": 72600,
    "viandas": 0,
    "varios": 7627567.46
  }'::jsonb
WHERE month = '2026-03-01';

UPDATE monthly_snapshots
SET
  opening_balance = 79311350,
  total_income = 71976106.96,
  other_income = 0,
  total_expenses = 43572468.07,
  projected_closing = 107714988.89,
  real_closing = 107525282,
  deviation = 107525282 - 107714988.89,
  expense_breakdown = '{
    "personal_sueldos": 15931820,
    "personal_honorarios": 5960000,
    "seguros": 713500,
    "servicios": 473428.21,
    "impuestos_arca": 5390220.08,
    "gremios": 11889.12,
    "combustibles": 0,
    "cheques_echeq": 12169563.54,
    "pagos_terceros": 0,
    "servicios_contratados": 49190,
    "viandas": 0,
    "varios": 7370820.98
  }'::jsonb
WHERE month = '2026-04-01';

-- Seed: Gastos fijos recurrentes mensuales (Abril 2026 como referencia)
-- Estos van a cash_movements para que aparezcan en el historial
INSERT INTO cash_movements (tenant_id, movement_date, type, category, subcategory, description, amount, counterpart, payment_method, is_pending, created_by)
SELECT t.id, d.fecha, 'expense', d.categoria, d.subcategoria, d.descripcion, d.monto, d.contraparte, 'transfer', false, 'seed-excel'
FROM tenants t,
(VALUES
  -- PERSONAL - SUELDOS OBREROS (Abril 2026)
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 1', 1773760, 'Personal Obrero'),
  ('2026-04-08'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 2', 2034760, 'Personal Obrero'),
  ('2026-04-15'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 3', 1499520, 'Personal Obrero'),
  ('2026-04-22'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 4', 1596800, 'Personal Obrero'),
  ('2026-04-29'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 5', 1700480, 'Personal Obrero'),
  -- PERSONAL - HONORARIOS
  ('2026-04-05'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Gustavo Regalado', 3500000, 'Gustavo Regalado'),
  ('2026-04-05'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Adolfo', 2500000, 'Adolfo'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Fernando Ortiz (DPRG)', 500000, 'Fernando Ortiz'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Elio', 960000, 'Elio'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Gabriela', 500000, 'Gabriela'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Enrico', 500000, 'Enrico'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Débora Rec. HyS Albardón', 300000, 'Débora'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Bruno Guevara', 1000000, 'Bruno Guevara'),
  -- SEGUROS
  ('2026-04-10'::date, 'Seguros', 'seguros', 'Seguros Liderar + Acc. Personales', 713500, 'Liderar Seguros'),
  -- SERVICIOS (más relevantes)
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Naturgy Almafuerte', 88009, 'Naturgy'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Naturgy Córdoba', 44166, 'Naturgy'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Telefonía Adolfo', 51695, 'Telefonía'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Telefonía Gustavo', 65965, 'Telefonía'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Telefonía Gabriela', 68128, 'Telefonía'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Expensas Córdoba', 91637, 'Expensas'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Internet Oficina', 49839, 'Internet'),
  -- IMPUESTOS ARCA / PROVINCIA
  ('2026-04-15'::date, 'Impuestos ARCA', 'form_931', 'FORM 931 - Cargas Sociales', 3322810, 'ARCA'),
  ('2026-04-15'::date, 'Impuestos ARCA', 'autonomos', 'Autónomos', 132778, 'ARCA'),
  ('2026-04-20'::date, 'Impuestos ARCA', 'iva', 'IVA Mensual', 2823525, 'ARCA'),
  ('2026-04-20'::date, 'Impuestos ARCA', 'plan_pago', 'Plan de Pago AFIP', 101731, 'ARCA'),
  -- GREMIOS
  ('2026-04-10'::date, 'Gremios', 'ieric', 'IERIC y FODECO (1%)', 11889, 'IERIC/UOCRA'),
  -- CHEQUES/ECHEQ
  ('2026-04-01'::date, 'Cheques/Echeqs', 'cheques', 'Cheques/Echeq emitidos Abril', 12169563, 'Varios Proveedores'),
  -- VIANDAS
  ('2026-04-01'::date, 'Viandas', 'viandas', 'Tanquito', 49190, 'Tanquito'),
  -- VARIOS
  ('2026-04-01'::date, 'Varios', 'varios', 'Arreglos menores, materiales, tarjeta VISA, etc.', 7370820, 'Varios')
) AS d(fecha, categoria, subcategoria, descripcion, monto, contraparte)
LIMIT 1;

-- Seed: Ingresos Abril 2026 (Certificaciones cobradas)
INSERT INTO cash_movements (tenant_id, movement_date, type, category, description, amount, counterpart, payment_method, is_pending, created_by)
SELECT t.id, '2026-04-15'::date, 'income', 'Cobro certificado', 'Facturación ventas obras Abril 2026', 71976106.96, 'Certificaciones Abril', 'transfer', false, 'seed-excel'
FROM tenants t
LIMIT 1;
