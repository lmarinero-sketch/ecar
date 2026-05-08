-- Fix: Seed de inventario completo (el anterior solo insertó 1 item por el LIMIT en el cross join)
INSERT INTO inventory_items (tenant_id, name, category, unit, current_stock, min_stock, is_tool, unit_cost)
SELECT t.id, v.name, v.cat, v.unit, v.stock, v.min_s, v.is_t, v.cost
FROM tenants t
CROSS JOIN (VALUES
  ('Taladro percutor Dewalt',  'herramienta', 'unidad', 2, 1, true, 120000),
  ('Rotomartillo Hilti',       'herramienta', 'unidad', 1, 1, true, 450000),
  ('Sierra circular 7 1/4',    'herramienta', 'unidad', 2, 1, true, 95000),
  ('Nivel láser Bosch',        'herramienta', 'unidad', 1, 1, true, 180000),
  ('Cemento bolsa 50kg',       'material',    'bolsa',  45, 20, false, 8500),
  ('Hierro 10mm x 12m',        'material',    'barra',  80, 30, false, 12000),
  ('Hierro 8mm x 12m',         'material',    'barra',  120, 40, false, 9500),
  ('Placas yeso 1.20x2.40',    'material',    'unidad', 24, 10, false, 15000),
  ('Arena gruesa',              'material',    'm3',     8, 5, false, 35000),
  ('Piedra partida',            'material',    'm3',     6, 3, false, 42000),
  ('Caño PVC 110mm x 4m',      'material',    'unidad', 15, 5, false, 18000),
  ('Cable 2.5mm rollo 100m',   'consumible',  'rollo',  4, 2, false, 65000),
  ('Discos corte 7"',          'consumible',  'unidad', 30, 15, false, 3500),
  ('Clavos 2.5"',              'consumible',  'kg',     25, 10, false, 4200)
) AS v(name, cat, unit, stock, min_s, is_t, cost);

-- Fix: Seed de cash_movements completo para Abril 2026
INSERT INTO cash_movements (tenant_id, movement_date, type, category, subcategory, description, amount, counterpart, payment_method, is_pending, created_by)
SELECT t.id, d.fecha, 'expense', d.cat, d.subcat, d.descr, d.monto, d.contra, 'transfer', false, 'seed-excel'
FROM tenants t
CROSS JOIN (VALUES
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 1', 1773760, 'Personal Obrero'),
  ('2026-04-08'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 2', 2034760, 'Personal Obrero'),
  ('2026-04-15'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 3', 1499520, 'Personal Obrero'),
  ('2026-04-22'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 4', 1596800, 'Personal Obrero'),
  ('2026-04-29'::date, 'Sueldos/Honorarios', 'sueldos_obreros', 'Sueldos Obreros Semana 5', 1700480, 'Personal Obrero'),
  ('2026-04-05'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Gustavo Regalado', 3500000, 'Gustavo Regalado'),
  ('2026-04-05'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Adolfo', 2500000, 'Adolfo'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Fernando Ortiz (DPRG)', 500000, 'Fernando Ortiz'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Elio', 960000, 'Elio'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Gabriela', 500000, 'Gabriela'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Honorarios Enrico', 500000, 'Enrico'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Débora Rec. HyS Albardón', 300000, 'Débora'),
  ('2026-04-01'::date, 'Sueldos/Honorarios', 'honorarios', 'Bruno Guevara', 1000000, 'Bruno Guevara'),
  ('2026-04-10'::date, 'Seguros', 'seguros', 'Seguros Liderar + Acc. Personales', 713500, 'Liderar Seguros'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Naturgy Almafuerte', 88009, 'Naturgy'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Naturgy Córdoba', 44166, 'Naturgy'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Telefonía Adolfo', 51695, 'Telefonía'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Telefonía Gustavo', 65965, 'Telefonía'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Telefonía Gabriela', 68128, 'Telefonía'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Expensas Córdoba', 91637, 'Expensas'),
  ('2026-04-01'::date, 'Servicios', 'servicios', 'Internet Oficina', 49839, 'Internet'),
  ('2026-04-15'::date, 'Impuestos ARCA', 'form_931', 'FORM 931 - Cargas Sociales', 3322810, 'ARCA'),
  ('2026-04-15'::date, 'Impuestos ARCA', 'autonomos', 'Autónomos', 132778, 'ARCA'),
  ('2026-04-20'::date, 'Impuestos ARCA', 'iva', 'IVA Mensual', 2823525, 'ARCA'),
  ('2026-04-20'::date, 'Impuestos ARCA', 'plan_pago', 'Plan de Pago AFIP', 101731, 'ARCA'),
  ('2026-04-10'::date, 'Gremios', 'ieric', 'IERIC y FODECO (1%)', 11889, 'IERIC/UOCRA'),
  ('2026-04-01'::date, 'Cheques/Echeqs', 'cheques', 'Cheques/Echeq emitidos Abril', 12169563, 'Varios Proveedores'),
  ('2026-04-01'::date, 'Viandas', 'viandas', 'Tanquito', 49190, 'Tanquito'),
  ('2026-04-01'::date, 'Varios', 'varios', 'Arreglos menores, materiales, tarjeta VISA', 7370820, 'Varios')
) AS d(fecha, cat, subcat, descr, monto, contra);

-- Ingresos Abril (no duplicar el que ya existe del seed anterior)
-- Ya se insertó en la migración anterior
