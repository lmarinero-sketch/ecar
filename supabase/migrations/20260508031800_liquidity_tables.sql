-- =============================================
-- FASE 1: Tablero de Liquidez — Tablas Nuevas
-- =============================================

-- 1. Cuentas bancarias / fuentes de liquidez
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'bank' CHECK (type IN ('cash','bank','investment')),
  bank_name TEXT,
  account_number TEXT,
  cbu TEXT,
  current_balance NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Movimientos de caja (cada ingreso/egreso)
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  amount NUMERIC NOT NULL,
  counterpart TEXT,
  payment_method TEXT DEFAULT 'transfer',
  linked_invoice_id UUID REFERENCES purchase_invoices(id),
  linked_cheque_id UUID REFERENCES cheques(id),
  linked_project_id UUID REFERENCES projects(id),
  is_pending BOOLEAN DEFAULT false,
  created_by TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Snapshots mensuales (para gráfico de evolución)
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  month DATE NOT NULL,
  opening_balance NUMERIC DEFAULT 0,
  total_income NUMERIC DEFAULT 0,
  other_income NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  projected_closing NUMERIC DEFAULT 0,
  real_closing NUMERIC DEFAULT 0,
  deviation NUMERIC DEFAULT 0,
  expense_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Certificaciones por obra
CREATE TABLE IF NOT EXISTS project_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  certificate_number INT NOT NULL,
  period_description TEXT,
  gross_amount NUMERIC DEFAULT 0,
  redetermination NUMERIC DEFAULT 0,
  total_certified NUMERIC DEFAULT 0,
  retention_iibb NUMERIC DEFAULT 0,
  retention_imp_cheque NUMERIC DEFAULT 0,
  other_retentions NUMERIC DEFAULT 0,
  net_deposit NUMERIC DEFAULT 0,
  deposit_date DATE,
  deposit_bank_account_id UUID REFERENCES bank_accounts(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','deposited','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Agregar campos de contrato a projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_amount NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_pct NUMERIC DEFAULT 30;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advance_redetermination NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contractor TEXT;

-- =============================================
-- Desactivar RLS para las tablas nuevas
-- (seguridad a nivel de función, como el resto del sistema)
-- =============================================
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for bank_accounts" ON bank_accounts;
CREATE POLICY "Allow all for bank_accounts" ON bank_accounts FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for cash_movements" ON cash_movements;
CREATE POLICY "Allow all for cash_movements" ON cash_movements FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for monthly_snapshots" ON monthly_snapshots;
CREATE POLICY "Allow all for monthly_snapshots" ON monthly_snapshots FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for project_certificates" ON project_certificates;
CREATE POLICY "Allow all for project_certificates" ON project_certificates FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- SEED: Datos iniciales de Abril 2026
-- =============================================

-- Cuentas bancarias (posición actual de Adolfo)
INSERT INTO bank_accounts (tenant_id, name, type, bank_name, current_balance)
SELECT t.id, 'Efectivo', 'cash', NULL, 975000 FROM tenants t LIMIT 1;

INSERT INTO bank_accounts (tenant_id, name, type, bank_name, current_balance)
SELECT t.id, 'Banco ECAR', 'bank', 'Santander', 3504828 FROM tenants t LIMIT 1;

INSERT INTO bank_accounts (tenant_id, name, type, bank_name, current_balance)
SELECT t.id, 'Inversiones Balanz', 'investment', 'Balanz', 103045454 FROM tenants t LIMIT 1;

-- Snapshots mensuales históricos (del Excel)
INSERT INTO monthly_snapshots (tenant_id, month, opening_balance, total_income, other_income, total_expenses, projected_closing, real_closing, deviation)
SELECT t.id, '2025-12-01', 0, 0, 0, 0, 0, 56350999, 0 FROM tenants t LIMIT 1;

INSERT INTO monthly_snapshots (tenant_id, month, opening_balance, total_income, other_income, total_expenses, projected_closing, real_closing, deviation)
SELECT t.id, '2026-01-01', 56350999, 28368833, 2225000, 57089334, 29855498, 31595386, 1739888 FROM tenants t LIMIT 1;

INSERT INTO monthly_snapshots (tenant_id, month, opening_balance, total_income, other_income, total_expenses, projected_closing, real_closing, deviation)
SELECT t.id, '2026-02-01', 31595386, 92343495, 0, 63355461, 60583419, 59437502, -1145917 FROM tenants t LIMIT 1;

INSERT INTO monthly_snapshots (tenant_id, month, opening_balance, total_income, other_income, total_expenses, projected_closing, real_closing, deviation)
SELECT t.id, '2026-03-01', 59437502, 37077453, 22800000, 41476134, 77838821, 79311350, 1472528 FROM tenants t LIMIT 1;

INSERT INTO monthly_snapshots (tenant_id, month, opening_balance, total_income, other_income, total_expenses, projected_closing, real_closing, deviation)
SELECT t.id, '2026-04-01', 79311350, 71976106, 0, 43572468, 107714988, 107525282, -189706 FROM tenants t LIMIT 1;
