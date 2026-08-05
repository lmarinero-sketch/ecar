-- =============================================
-- ECAR ERP - Initial Schema Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== CORE ==========

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cuit TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operario' CHECK (role IN ('admin','operario')),
  allowed_modules JSONB DEFAULT '[]',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','suspended')),
  budget_ars NUMERIC DEFAULT 0,
  client_name TEXT,
  client_cuit TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== MOD 1: OBLIGACIONES ==========

CREATE TABLE IF NOT EXISTS obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_day_of_month INT DEFAULT 15,
  recurrence TEXT DEFAULT 'monthly' CHECK (recurrence IN ('monthly','quarterly','annual')),
  amount_ars NUMERIC DEFAULT 0,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','notified','paid','overdue')),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS obligation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id UUID REFERENCES obligations(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount_paid_ars NUMERIC NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  paid_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== MOD 2: FACTURACIÓN ==========

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('FA','FB','FC','FE','NCA','NCB','NCC','NDA','NDB','NDC')),
  point_of_sale TEXT DEFAULT '0001',
  invoice_number INT,
  issue_date DATE NOT NULL,
  receptor_name TEXT NOT NULL,
  receptor_cuit TEXT NOT NULL,
  receptor_tax_condition TEXT,
  net_amount_ars NUMERIC DEFAULT 0,
  iva_21_ars NUMERIC DEFAULT 0,
  iva_105_ars NUMERIC DEFAULT 0,
  iva_27_ars NUMERIC DEFAULT 0,
  other_taxes_ars NUMERIC DEFAULT 0,
  total_ars NUMERIC DEFAULT 0,
  cae_number TEXT,
  cae_expiration DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_cae','approved','rejected','cancelled')),
  pdf_url TEXT,
  afip_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'u',
  unit_price_ars NUMERIC DEFAULT 0,
  subtotal_ars NUMERIC DEFAULT 0,
  iva_rate NUMERIC DEFAULT 21
);

-- ========== MOD 3: GESTIÓN DOCUMENTAL ==========

CREATE TABLE IF NOT EXISTS document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  requester_name TEXT,
  requester_email TEXT,
  status TEXT DEFAULT 'gathering' CHECK (status IN ('gathering','ready','sent','responded')),
  notes TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  category TEXT DEFAULT 'other',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  document_request_id UUID REFERENCES document_requests(id),
  from_email TEXT,
  to_email TEXT NOT NULL,
  cc TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  attachment_doc_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== MOD 4: ASISTENCIA ==========

CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  tolerance_minutes INT DEFAULT 15
);

-- ========== MOD 5: LIQUIDACIÓN ==========

CREATE TABLE IF NOT EXISTS union_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hourly_rate_ars NUMERIC DEFAULT 0,
  daily_rate_ars NUMERIC DEFAULT 0,
  effective_from DATE,
  effective_to DATE,
  is_current BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== MOD 6: EMPLEADOS ==========

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cuil TEXT,
  dni TEXT,
  birth_date DATE,
  address TEXT,
  phone TEXT,
  emergency_contact TEXT,
  category_id UUID REFERENCES union_categories(id),
  current_project_id UUID REFERENCES projects(id),
  shift_id UUID REFERENCES shifts(id),
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active','suspended','terminated')),
  hire_date DATE,
  termination_date DATE,
  termination_reason TEXT,
  profile_photo_url TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  shift_id UUID REFERENCES shifts(id),
  record_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','vacation','medical')),
  worked_hours NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  source TEXT DEFAULT 'manual' CHECK (source IN ('biometric','manual','mobile')),
  biometric_device_id TEXT,
  notes TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  period_type TEXT DEFAULT 'biweekly' CHECK (period_type IN ('weekly','biweekly','monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','calculated','approved','exported')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  category_id UUID REFERENCES union_categories(id),
  regular_hours NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  gross_amount_ars NUMERIC DEFAULT 0,
  deductions_ars NUMERIC DEFAULT 0,
  net_amount_ars NUMERIC DEFAULT 0,
  deduction_details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'calculated' CHECK (status IN ('calculated','adjusted','approved'))
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_date DATE,
  expiry_date DATE,
  notes TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body_template TEXT NOT NULL,
  category TEXT DEFAULT 'notification',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accountant_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  accountant_name TEXT,
  accountant_email TEXT,
  permissions TEXT DEFAULT 'readonly_payroll',
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== MOD 7: COMPRAS ==========

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cuit TEXT,
  tax_condition TEXT DEFAULT 'RI',
  address TEXT,
  phone TEXT,
  email TEXT,
  bank_cbu TEXT,
  is_fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  project_id UUID REFERENCES projects(id),
  invoice_type TEXT,
  point_of_sale TEXT,
  invoice_number TEXT,
  issue_date DATE,
  net_amount_ars NUMERIC DEFAULT 0,
  iva_21_ars NUMERIC DEFAULT 0,
  iva_105_ars NUMERIC DEFAULT 0,
  iva_27_ars NUMERIC DEFAULT 0,
  exempt_ars NUMERIC DEFAULT 0,
  perceptions_iva_ars NUMERIC DEFAULT 0,
  perceptions_iibb_ars NUMERIC DEFAULT 0,
  total_ars NUMERIC DEFAULT 0,
  cae_number TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review','validated','rejected','exported')),
  original_file_url TEXT,
  ocr_raw_data JSONB,
  ocr_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== MOD 8: GASTOS Y CHEQUES ==========

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  service_type TEXT DEFAULT 'other',
  description TEXT,
  estimated_amount_ars NUMERIC DEFAULT 0,
  due_day_of_month INT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payment_date DATE NOT NULL,
  amount_ars NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'transfer',
  check_number TEXT,
  bank_name TEXT,
  receipt_url TEXT,
  notes TEXT,
  paid_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cheques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cheque_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account TEXT,
  type TEXT DEFAULT 'echeq' CHECK (type IN ('physical','echeq')),
  direction TEXT NOT NULL CHECK (direction IN ('payable','receivable')),
  beneficiary_or_issuer TEXT,
  amount_ars NUMERIC NOT NULL,
  issue_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','deposited','cashed','bounced','cancelled')),
  bounce_reason TEXT,
  linked_payment_id UUID REFERENCES payment_records(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== WBS (existing concept) ==========

CREATE TABLE IF NOT EXISTS wbs_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES wbs_elements(id),
  name TEXT NOT NULL,
  budget_cost_ars NUMERIC DEFAULT 0,
  budget_revenue_ars NUMERIC DEFAULT 0,
  committed_cost_ars NUMERIC DEFAULT 0,
  accrued_cost_ars NUMERIC DEFAULT 0,
  progress_pct NUMERIC DEFAULT 0,
  is_hard_stop BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id, employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_project ON employees(current_project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, record_date);
CREATE INDEX IF NOT EXISTS idx_attendance_project_date ON attendance_records(project_id, record_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_date ON invoices(tenant_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cheques_tenant_due ON cheques(tenant_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_period ON payroll_lines(payroll_period_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_obligations_tenant ON obligations(tenant_id, due_day_of_month);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wbs_project ON wbs_elements(project_id);
CREATE INDEX IF NOT EXISTS idx_employee_docs ON employee_documents(employee_id);

-- ========== RLS POLICIES ==========

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountant_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_elements ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Tenant isolation policies (applied to all tenant-scoped tables)
DROP POLICY IF EXISTS "tenant_isolation" ON profiles;
CREATE POLICY "tenant_isolation" ON profiles FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON projects;
CREATE POLICY "tenant_isolation" ON projects FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON employees;
CREATE POLICY "tenant_isolation" ON employees FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON obligations;
CREATE POLICY "tenant_isolation" ON obligations FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON obligation_payments;
CREATE POLICY "tenant_isolation" ON obligation_payments FOR ALL USING (obligation_id IN (SELECT id FROM obligations WHERE tenant_id = get_my_tenant_id()));
DROP POLICY IF EXISTS "tenant_isolation" ON invoices;
CREATE POLICY "tenant_isolation" ON invoices FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON invoice_items;
CREATE POLICY "tenant_isolation" ON invoice_items FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = get_my_tenant_id()));
DROP POLICY IF EXISTS "tenant_isolation" ON document_requests;
CREATE POLICY "tenant_isolation" ON document_requests FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON documents;
CREATE POLICY "tenant_isolation" ON documents FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON emails;
CREATE POLICY "tenant_isolation" ON emails FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON shifts;
CREATE POLICY "tenant_isolation" ON shifts FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON union_categories;
CREATE POLICY "tenant_isolation" ON union_categories FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON attendance_records;
CREATE POLICY "tenant_isolation" ON attendance_records FOR ALL USING (employee_id IN (SELECT id FROM employees WHERE tenant_id = get_my_tenant_id()));
DROP POLICY IF EXISTS "tenant_isolation" ON payroll_periods;
CREATE POLICY "tenant_isolation" ON payroll_periods FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON payroll_lines;
CREATE POLICY "tenant_isolation" ON payroll_lines FOR ALL USING (payroll_period_id IN (SELECT id FROM payroll_periods WHERE tenant_id = get_my_tenant_id()));
DROP POLICY IF EXISTS "tenant_isolation" ON employee_documents;
CREATE POLICY "tenant_isolation" ON employee_documents FOR ALL USING (employee_id IN (SELECT id FROM employees WHERE tenant_id = get_my_tenant_id()));
DROP POLICY IF EXISTS "tenant_isolation" ON letter_templates;
CREATE POLICY "tenant_isolation" ON letter_templates FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON accountant_access_tokens;
CREATE POLICY "tenant_isolation" ON accountant_access_tokens FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON suppliers;
CREATE POLICY "tenant_isolation" ON suppliers FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON purchase_invoices;
CREATE POLICY "tenant_isolation" ON purchase_invoices FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON fixed_expenses;
CREATE POLICY "tenant_isolation" ON fixed_expenses FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON payment_records;
CREATE POLICY "tenant_isolation" ON payment_records FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON cheques;
CREATE POLICY "tenant_isolation" ON cheques FOR ALL USING (tenant_id = get_my_tenant_id());
DROP POLICY IF EXISTS "tenant_isolation" ON wbs_elements;
CREATE POLICY "tenant_isolation" ON wbs_elements FOR ALL USING (project_id IN (SELECT id FROM projects WHERE tenant_id = get_my_tenant_id()));
DROP POLICY IF EXISTS "tenant_read" ON tenants;
CREATE POLICY "tenant_read" ON tenants FOR SELECT USING (id = get_my_tenant_id());

-- ========== SEED: Default Tenant ==========
INSERT INTO tenants (id, name, cuit) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'ECAR Constructora', '30-12345678-9');

-- ========== SEED: Default Shifts ==========
INSERT INTO shifts (tenant_id, name, start_time, end_time, tolerance_minutes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Turno Mañana', '07:00', '17:00', 15),
  ('a0000000-0000-0000-0000-000000000001', 'Turno Tarde', '13:00', '21:00', 15);

-- ========== SEED: UOCRA Categories ==========
INSERT INTO union_categories (tenant_id, name, hourly_rate_ars, daily_rate_ars, effective_from, is_current) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Oficial Especializado', 4500, 36000, '2026-04-01', true),
  ('a0000000-0000-0000-0000-000000000001', 'Oficial', 3800, 30400, '2026-04-01', true),
  ('a0000000-0000-0000-0000-000000000001', 'Medio Oficial', 3200, 25600, '2026-04-01', true),
  ('a0000000-0000-0000-0000-000000000001', 'Ayudante', 2700, 21600, '2026-04-01', true);

-- ========== SEED: Letter Templates ==========
INSERT INTO letter_templates (tenant_id, name, body_template, category) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Despido sin causa',
   'San Juan, {{fecha}}\n\nSr./Sra. {{nombre_empleado}}\nCUIL: {{cuil}}\n\nDe nuestra consideración:\n\nPor medio de la presente, le comunicamos que hemos decidido prescindir de sus servicios a partir del día de la fecha, sin invocación de causa alguna, en los términos del art. 245 de la Ley de Contrato de Trabajo.\n\nSe procederá a la liquidación final correspondiente.\n\nSin otro particular, lo/la saluda atentamente.\n\n{{nombre_empresa}}\nCUIT: {{cuit_empresa}}',
   'termination'),
  ('a0000000-0000-0000-0000-000000000001', 'Apercibimiento',
   'San Juan, {{fecha}}\n\nSr./Sra. {{nombre_empleado}}\nCUIL: {{cuil}}\n\nDe nuestra consideración:\n\nPor la presente le hacemos saber que se le aplica un APERCIBIMIENTO por {{motivo}}.\n\nLe informamos que la reiteración de esta conducta será pasible de sanciones más severas.\n\nSin otro particular.\n\n{{nombre_empresa}}',
   'disciplinary');
