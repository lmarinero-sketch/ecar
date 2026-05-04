// Database types matching Supabase schema
export type Profile = {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'operario';
  allowed_modules: string[];
  avatar_url: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  tenant_id: string;
  name: string;
  status: 'active' | 'completed' | 'suspended';
  budget_ars: number;
  client_name: string | null;
  client_cuit: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type Employee = {
  id: string;
  tenant_id: string;
  full_name: string;
  cuil: string | null;
  dni: string | null;
  birth_date: string | null;
  address: string | null;
  phone: string | null;
  emergency_contact: string | null;
  category_id: string | null;
  current_project_id: string | null;
  shift_id: string | null;
  employment_status: 'active' | 'suspended' | 'terminated';
  hire_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  profile_photo_url: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  // Joined
  category?: UnionCategory | null;
  project?: Project | null;
};

export type UnionCategory = {
  id: string;
  tenant_id: string;
  name: string;
  hourly_rate_ars: number;
  daily_rate_ars: number;
  effective_from: string | null;
  effective_to: string | null;
  is_current: boolean;
  updated_at: string;
};

export type Shift = {
  id: string;
  tenant_id: string;
  name: string;
  start_time: string;
  end_time: string;
  tolerance_minutes: number;
};

export type AttendanceRecord = {
  id: string;
  employee_id: string;
  project_id: string | null;
  shift_id: string | null;
  record_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'vacation' | 'medical';
  worked_hours: number;
  overtime_hours: number;
  source: 'biometric' | 'manual' | 'mobile';
  notes: string | null;
  approved: boolean;
  approved_by: string | null;
  created_at: string;
  employee?: Employee;
};

export type Obligation = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  due_day_of_month: number;
  recurrence: 'monthly' | 'quarterly' | 'annual';
  amount_ars: number;
  assigned_to: string | null;
  status: 'pending' | 'notified' | 'paid' | 'overdue';
  document_url: string | null;
  created_at: string;
  payments?: ObligationPayment[];
};

export type ObligationPayment = {
  id: string;
  obligation_id: string;
  payment_date: string;
  amount_paid_ars: number;
  receipt_url: string | null;
  notes: string | null;
  paid_by: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  invoice_type: string;
  point_of_sale: string;
  invoice_number: number | null;
  issue_date: string;
  receptor_name: string;
  receptor_cuit: string;
  receptor_tax_condition: string | null;
  net_amount_ars: number;
  iva_21_ars: number;
  iva_105_ars: number;
  iva_27_ars: number;
  other_taxes_ars: number;
  total_ars: number;
  cae_number: string | null;
  cae_expiration: string | null;
  status: 'draft' | 'pending_cae' | 'approved' | 'rejected' | 'cancelled';
  pdf_url: string | null;
  afip_response: Record<string, unknown> | null;
  created_at: string;
  items?: InvoiceItem[];
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_ars: number;
  subtotal_ars: number;
  iva_rate: number;
};

export type Supplier = {
  id: string;
  tenant_id: string;
  name: string;
  cuit: string | null;
  tax_condition: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  bank_cbu: string | null;
  is_fixed: boolean;
  created_at: string;
};

export type PurchaseInvoice = {
  id: string;
  tenant_id: string;
  supplier_id: string | null;
  project_id: string | null;
  invoice_type: string | null;
  point_of_sale: string | null;
  invoice_number: string | null;
  issue_date: string | null;
  net_amount_ars: number;
  iva_21_ars: number;
  iva_105_ars: number;
  iva_27_ars: number;
  exempt_ars: number;
  perceptions_iva_ars: number;
  perceptions_iibb_ars: number;
  total_ars: number;
  cae_number: string | null;
  status: 'pending_review' | 'validated' | 'rejected' | 'exported';
  original_file_url: string | null;
  ocr_raw_data: Record<string, unknown> | null;
  ocr_validated: boolean;
  created_at: string;
  supplier?: Supplier;
};

export type Cheque = {
  id: string;
  tenant_id: string;
  cheque_number: string;
  bank_name: string;
  bank_account: string | null;
  type: 'physical' | 'echeq';
  direction: 'payable' | 'receivable';
  beneficiary_or_issuer: string | null;
  amount_ars: number;
  issue_date: string | null;
  due_date: string | null;
  status: 'pending' | 'deposited' | 'cashed' | 'bounced' | 'cancelled';
  bounce_reason: string | null;
  linked_payment_id: string | null;
  created_at: string;
};

export type PayrollPeriod = {
  id: string;
  tenant_id: string;
  period_type: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date: string;
  status: 'open' | 'calculated' | 'approved' | 'exported';
  created_at: string;
  lines?: PayrollLine[];
};

export type PayrollLine = {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  category_id: string | null;
  regular_hours: number;
  overtime_hours: number;
  gross_amount_ars: number;
  deductions_ars: number;
  net_amount_ars: number;
  deduction_details: Record<string, number>;
  status: 'calculated' | 'adjusted' | 'approved';
  employee?: Employee;
};

export type FixedExpense = {
  id: string;
  tenant_id: string;
  supplier_id: string | null;
  service_type: string;
  description: string | null;
  estimated_amount_ars: number;
  due_day_of_month: number | null;
  status: 'active' | 'paused' | 'cancelled';
  created_at: string;
  supplier?: Supplier;
};

export type EmployeeDocument = {
  id: string;
  employee_id: string;
  doc_type: string;
  title: string;
  file_url: string;
  document_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type LetterTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  body_template: string;
  category: string;
  created_at: string;
};

export type WbsElement = {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  budget_cost_ars: number;
  budget_revenue_ars: number;
  committed_cost_ars: number;
  accrued_cost_ars: number;
  progress_pct: number;
  is_hard_stop: boolean;
  created_at: string;
};

export type DocumentRequest = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  title: string;
  requester_name: string | null;
  requester_email: string | null;
  status: 'gathering' | 'ready' | 'sent' | 'responded';
  notes: string | null;
  due_date: string | null;
  created_at: string;
};

// All modules available in the system
export const ALL_MODULES = [
  'bi',
  'wbs',
  'invoicing',
  'purchases',
  'finances',
  'obligations',
  'rrhh',
  'logistics',
  'fleet',
  'certifications',
  'field',
  'documents',
] as const;

export type ModuleId = typeof ALL_MODULES[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
  bi: 'Dashboard BI',
  wbs: 'Planificación WBS',
  invoicing: 'Facturación (ARCA)',
  purchases: 'Compras & Libro IVA',
  finances: 'Finanzas & Tesorería',
  obligations: 'Alertas & Obligaciones',
  rrhh: 'RRHH & Legajos',
  logistics: 'Acopios & Logística',
  fleet: 'Flota y Maquinaria',
  certifications: 'Certificaciones / ICC',
  field: 'Parte Diario',
  documents: 'Documentos & Correo',
};
