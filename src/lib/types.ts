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

// ========== NOTIFICATION SYSTEM ==========

export type NotificationContact = {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type NotificationReminder = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  trigger_type: 'manual' | 'cheque_due' | 'obligation_due' | 'custom_date';
  trigger_days_before: number;
  trigger_date: string | null;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  contact_ids: string[];
  message_template: string;
  schedule_days: number[] | null;
  schedule_time: string | null;
  date_from: string | null;
  date_until: string | null;
  next_run_at: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
};

export type NotificationLog = {
  id: string;
  tenant_id: string;
  reminder_id: string | null;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  message_content: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
  contact?: NotificationContact;
  reminder?: NotificationReminder;
};

// ========== LIQUIDITY / FINANCE ==========


export type BankAccount = {
  id: string;
  tenant_id: string;
  name: string;
  type: 'cash' | 'bank' | 'investment';
  bank_name: string | null;
  account_number: string | null;
  cbu: string | null;
  current_balance: number;
  last_updated: string;
  created_at: string;
};

export type CashMovement = {
  id: string;
  tenant_id: string;
  bank_account_id: string | null;
  movement_date: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  subcategory: string | null;
  description: string | null;
  amount: number;
  counterpart: string | null;
  payment_method: string | null;
  linked_invoice_id: string | null;
  linked_cheque_id: string | null;
  linked_project_id: string | null;
  is_pending: boolean;
  created_by: string;
  created_at: string;
  bank_account?: BankAccount;
};

export type MonthlySnapshot = {
  id: string;
  tenant_id: string;
  month: string;
  opening_balance: number;
  total_income: number;
  other_income: number;
  total_expenses: number;
  projected_closing: number;
  real_closing: number;
  deviation: number;
  expense_breakdown: Record<string, number> | null;
  created_at: string;
};

export type ProjectCertificate = {
  id: string;
  tenant_id: string;
  project_id: string;
  certificate_number: number;
  period_description: string | null;
  gross_amount: number;
  redetermination: number;
  total_certified: number;
  retention_iibb: number;
  retention_imp_cheque: number;
  other_retentions: number;
  net_deposit: number;
  deposit_date: string | null;
  deposit_bank_account_id: string | null;
  status: 'pending' | 'approved' | 'deposited' | 'rejected';
  created_at: string;
  project?: Project;
};

// ========== INVENTARIO / PAÑOL ==========

export type InventoryItem = {
  id: string;
  tenant_id: string;
  name: string;
  category: 'material' | 'herramienta' | 'consumible';
  unit: string;
  current_stock: number;
  min_stock: number;
  location: string;
  qr_code: string | null;
  barcode: string | null;
  unit_cost: number;
  is_tool: boolean;
  created_at: string;
};

export type InventoryMovement = {
  id: string;
  tenant_id: string;
  item_id: string;
  movement_type: 'in' | 'out' | 'return' | 'adjustment';
  quantity: number;
  project_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  item?: InventoryItem;
  project?: Project;
  employee?: Employee;
};

export type ToolAssignment = {
  id: string;
  tenant_id: string;
  item_id: string;
  employee_id: string;
  project_id: string | null;
  assigned_date: string;
  returned_date: string | null;
  status: 'assigned' | 'returned' | 'lost' | 'damaged';
  notes: string | null;
  created_at: string;
  item?: InventoryItem;
  employee?: Employee;
  project?: Project;
};

// ========== PEDIDOS DE COMPRA ==========

export type PurchaseRequest = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  requested_by: string | null;
  urgency: 'low' | 'normal' | 'urgent';
  status: 'pending' | 'approved' | 'consolidated' | 'ordered' | 'received' | 'rejected';
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  project?: Project;
  items?: PurchaseRequestItem[];
};

export type PurchaseRequestItem = {
  id: string;
  request_id: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_cost: number;
  inventory_item_id: string | null;
  created_at: string;
};

// ========== PARTE DIARIO DE OBRA ==========

export type ParteDiario = {
  id: string;
  tenant_id: string;
  obra_id: string | null;
  fecha: string;
  clima: 'despejado' | 'nublado' | 'lluvia' | 'tormenta' | 'nieve' | 'ventoso' | null;
  temperatura_min: number | null;
  temperatura_max: number | null;
  trabajo_realizado: string;
  personal_presente: Array<{ nombre: string; categoria?: string }> | null;
  equipos_en_obra: Array<{ equipo: string; horas?: number }> | null;
  materiales_usados: Array<{ material: string; cantidad?: number; unidad?: string }> | null;
  entregas: string | null;
  incidentes: string | null;
  horas_trabajadas: number;
  fotos: string[];
  notas: string | null;
  firmado_por: string | null;
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado';
  aprobado_por: string | null;
  aprobado_en: string | null;
  created_at: string;
  updated_at: string;
  obra?: Project;
};

// ========== SEGURIDAD E INCIDENTES ==========

export type SeguridadIncidente = {
  id: string;
  tenant_id: string;
  obra_id: string | null;
  fecha: string;
  hora: string | null;
  tipo: 'accidente' | 'incidente' | 'cuasi_accidente' | 'enfermedad_laboral';
  gravedad: 'leve' | 'moderado' | 'grave' | 'fatal';
  ubicacion: string | null;
  descripcion: string;
  persona_afectada: string | null;
  persona_afectada_dni: string | null;
  testigos: string | null;
  tratamiento: 'primeros_auxilios' | 'medico' | 'hospital' | 'ninguno' | null;
  dias_perdidos: number;
  causa_raiz: string | null;
  acciones_correctivas: string | null;
  responsable_accion: string | null;
  fecha_cierre_accion: string | null;
  estado: 'abierto' | 'en_investigacion' | 'cerrado';
  reportado_a_art: boolean;
  fotos: string[];
  created_at: string;
  updated_at: string;
  obra?: Project;
};

export type SeguridadObservacion = {
  id: string;
  tenant_id: string;
  obra_id: string | null;
  fecha: string;
  observador: string;
  categoria: 'epp' | 'orden_limpieza' | 'senalizacion' | 'electrico' | 'altura' | 'excavacion' | 'vehicular' | 'incendio' | 'otros' | null;
  descripcion: string;
  severidad: number;
  probabilidad: number;
  riesgo_score: number;
  accion_sugerida: string | null;
  estado: 'abierta' | 'en_correccion' | 'resuelta';
  fotos: string[];
  created_at: string;
  obra?: Project;
};

// ========== INSPECCIONES + PUNCH LIST ==========

export type Inspeccion = {
  id: string;
  tenant_id: string;
  obra_id: string | null;
  fecha: string;
  tipo: 'estructura' | 'electrica' | 'sanitaria' | 'gas' | 'seguridad_contra_incendio' | 'terminaciones' | 'general';
  inspector: string;
  ubicacion: string | null;
  checklist: Array<{ item: string; estado: 'ok' | 'falla' | 'na'; nota?: string }> | null;
  resultado: 'pendiente' | 'aprobada' | 'aprobada_con_observaciones' | 'rechazada';
  observaciones: string | null;
  fotos: string[];
  created_at: string;
  updated_at: string;
  obra?: Project;
  punch_items?: PunchListItem[];
};

export type PunchListItem = {
  id: string;
  tenant_id: string;
  obra_id: string | null;
  inspeccion_id: string | null;
  numero: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  asignado_a: string | null;
  estado: 'abierto' | 'en_correccion' | 'corregido' | 'verificado' | 'cerrado';
  fecha_limite: string | null;
  foto_antes: string | null;
  foto_despues: string | null;
  verificado_por: string | null;
  verificado_en: string | null;
  created_at: string;
  updated_at: string;
  obra?: Project;
  inspeccion?: Inspeccion;
};

// ========== CONSULTAS DE OBRA (RFI) ==========

export type ConsultaObra = {
  id: string;
  tenant_id: string;
  obra_id: string | null;
  numero: number;
  asunto: string;
  pregunta: string;
  consultado_por: string;
  asignado_a: string | null;
  estado: 'borrador' | 'abierta' | 'respondida' | 'cerrada';
  respuesta_oficial: string | null;
  respondido_por: string | null;
  respondido_en: string | null;
  impacto_costo: boolean;
  impacto_costo_monto: number;
  impacto_cronograma: boolean;
  impacto_cronograma_dias: number;
  fecha_requerida: string | null;
  fecha_limite_respuesta: string | null;
  fotos: string[];
  created_at: string;
  updated_at: string;
  obra?: Project;
};

// ─── GASTOS OPERATIVOS ───
export type GastoItemCategoria = 'personal' | 'seguros' | 'servicios' | 'impuestos' | 'gremios' | 'combustibles' | 'terceros' | 'servicios_contratados' | 'viandas' | 'varios';

export type GastoItem = {
  id: string;
  tenant_id: string;
  categoria: GastoItemCategoria;
  descripcion: string;
  orden: number;
  activo: boolean;
  created_at: string;
};

export type GastoRegistro = {
  id: string;
  tenant_id: string;
  item_id: string;
  periodo: string; // 'YYYY-MM'
  monto: number;
  pagado: boolean;
  fecha_pago: string | null;
  metodo_pago: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  item?: GastoItem;
};

// All modules available in the system
export const ALL_MODULES = [
  'bi',
  'liquidity',
  'monthly_report',
  'wbs',
  'invoicing',
  'purchases',
  'purchase_requests',
  'finances',
  'obligations',
  'rrhh',
  'inventory',
  'logistics',
  'fleet',
  'certifications',
  'field',
  'safety',
  'inspections',
  'rfi',
  'expenses',
  'documents',
] as const;

export type ModuleId = typeof ALL_MODULES[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
  bi: 'Dashboard BI',
  liquidity: 'Tablero de Liquidez',
  monthly_report: 'Resumen Mensual',
  wbs: 'Planificación WBS',
  invoicing: 'Facturación (ARCA)',
  purchases: 'Compras & Libro IVA',
  purchase_requests: 'Pedidos de Compra',
  finances: 'Finanzas & Tesorería',
  obligations: 'Alertas & Obligaciones',
  rrhh: 'RRHH & Legajos',
  inventory: 'Depósito & Inventario',
  logistics: 'Acopios & Logística',
  fleet: 'Flota y Maquinaria',
  certifications: 'Certificaciones / ICC',
  field: 'Parte Diario de Obra',
  safety: 'Seguridad & Incidentes',
  inspections: 'Inspecciones & Calidad',
  rfi: 'Consultas de Obra',
  expenses: 'Gastos Operativos',
  documents: 'Documentos & Correo',
};
