-- =============================================
-- Certificaciones: campos de contrato en projects + seed
-- =============================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_amount NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_pct NUMERIC DEFAULT 30;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_redetermination NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contractor TEXT;

-- Seed: Datos reales de Barrio San Martín
UPDATE projects
SET contract_amount = 172600000,
    advance_pct = 30,
    advance_amount = 51780000,
    contractor = 'Gobierno de San Juan'
WHERE id = (SELECT id FROM projects WHERE name ILIKE '%san mart%' LIMIT 1);

-- Si no existe el proyecto, lo creamos
INSERT INTO projects (tenant_id, name, contract_amount, advance_pct, advance_amount, contractor, status)
SELECT t.id, 'Barrio San Martín', 172600000, 30, 51780000, 'Gobierno de San Juan', 'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name ILIKE '%san mart%');

-- Seed: Certificados de Barrio San Martín
INSERT INTO project_certificates (tenant_id, project_id, certificate_number, gross_amount, redetermination, total_certified, retention_iibb, retention_imp_cheque, net_deposit, status, deposit_date)
SELECT t.id, p.id, c.cert_num, c.gross, c.redet, c.total, c.ret_iibb, c.ret_cheq, c.net_dep,
  CASE WHEN c.net_dep > 0 THEN 'deposited' ELSE 'approved' END,
  c.dep_date
FROM tenants t
CROSS JOIN projects p
CROSS JOIN (VALUES
  (1, 30400000, 5900000, 36300000, 900000, 800000, 34600000, '2025-09-15'::date),
  (2, 19500000, 4800000, 24300000, 600000, 500000, 23200000, '2025-10-15'::date),
  (3, 38000000, 7000000, 45000000, 1100000, 1000000, 42900000, '2025-11-15'::date),
  (4, 2500000, 500000, 3000000, 75000, 65000, 2860000, '2025-12-15'::date),
  (5, 12000000, 3200000, 15200000, 380000, 320000, 14500000, '2026-01-15'::date),
  (6, 4500000, 900000, 5400000, 135000, 115000, 5150000, NULL)
) AS c(cert_num, gross, redet, total, ret_iibb, ret_cheq, net_dep, dep_date)
WHERE p.name ILIKE '%san mart%';

-- Segundo proyecto: Almafuerte
INSERT INTO projects (tenant_id, name, contract_amount, advance_pct, advance_amount, contractor, status)
SELECT t.id, 'Viviendas Almafuerte', 95000000, 30, 28500000, 'Gobierno de San Juan', 'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name ILIKE '%almafuerte%');
