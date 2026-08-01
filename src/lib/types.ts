export type Profile = {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'colaborador' | 'panolero';
  allowed_modules: string[];
  avatar_url: string | null;
  dni?: string | null;
  signature_data?: string | null;
  created_at: string;
};

export type ModulePermission = {
  id: string;
  profile_id: string;
  module_id: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
};

export type PermissionLevel = 'read' | 'write' | 'delete';

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
  manager_id?: string | null;
  startup_folder_notes?: string | null;
  contract_amount?: number;
  advance_pct?: number;
  advance_amount?: number;
  advance_redetermination?: number;
  advance_deposit?: number;
  advance_redetermination_deposit?: number;
};

export type Employee = {
  id: string;
  tenant_id: string;
  legajo?: string | null;
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
  // New RRHH fields
  is_driver: boolean | null;
  driver_license_category: string | null;
  driver_license_expiry: string | null;
  employer_entity: string | null;
  bank_name: string | null;
  bank_alias_cbu: string | null;
  trial_start_date: string | null;
  digital_signature_url: string | null;
  obra_social: string | null;
  art_provider: string | null;
  modo_liquidacion: string | null;
  retribucion_pactada: number | null;
  // RRHH extended fields
  gender: 'masculino' | 'femenino' | 'otro' | null;
  marital_status: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'conviviente' | null;
  children_info: Array<{ edad: number }> | null;
  education_level: string | null;
  union_name: string | null;
  observations: string | null;
  debt_to_employee: number | null;
  debt_notes: string | null;
  does_overtime: boolean;
  overtime_rate: '50' | '100' | null;
  shirt_size: string | null;
  pants_size: string | null;
  shoe_size: string | null;
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
  metadata: Record<string, unknown> | null;
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

export interface LegalEntity {
  id: string;
  tenant_id: string;
  name: string;
  cuit: string | null;
  iibb_number: string | null;
  constancia_url: string | null;
  created_at: string;
}

export type Invoice = {
  id: string;
  tenant_id: string;
  legal_entity_id?: string | null;
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

export type PurchaseInvoiceAllocation = {
  id: string;
  tenant_id: string;
  invoice_id: string;
  project_id: string;
  percentage: number;
  amount_ars: number;
  created_at: string;
  project?: Project;
};

export type PurchaseInvoice = {
  id: string;
  tenant_id: string;
  legal_entity_id?: string | null;
  legal_entity?: LegalEntity | null;
  supplier_id: string | null;
  project_id: string | null; // Legacy, optional
  allocations?: PurchaseInvoiceAllocation[];
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
  gasto_item_id: string | null;
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
  issuer_company?: string | null;
  amount_ars: number;
  issue_date: string | null;
  due_date: string | null;
  status: 'pending' | 'deposited' | 'cashed' | 'bounced' | 'cancelled';
  bounce_reason: string | null;
  linked_payment_id: string | null;
  scan_url: string | null;
  created_at: string;
  linked_invoice_id?: string | null;
  linked_purchase_invoice_id?: string | null;
};

// ========== RRHH EXPANSION ==========
export type EmployeeAbsence = {
  id: string;
  tenant_id: string;
  employee_id: string;
  type: 'vacation' | 'medical' | 'suspension' | 'art_leave';
  start_date: string;
  end_date: string | null;
  days: number | null;
  reason: string | null;
  certificate_url: string | null;
  art_case_number: string | null;
  status: 'active' | 'closed';
  created_at: string;
  employee?: Employee;
};

export type EmployeeAdvance = {
  id: string;
  tenant_id: string;
  employee_id: string;
  amount_ars: number;
  advance_date: string;
  reason: string | null;
  deducted: boolean;
  deducted_from_period: string | null;
  created_at: string;
  employee?: Employee;
};

export type SalaryHistoryEntry = {
  id: string;
  tenant_id: string;
  employee_id: string;
  category_id: string | null;
  hourly_rate_ars: number | null;
  daily_rate_ars: number | null;
  effective_from: string;
  reason: string | null;
  created_at: string;
  category?: UnionCategory;
};

export type DailyTask = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'done';
  completed_at: string | null;
  created_by: string | null;
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

export interface EmployeePPEDelivery {
  id: string;
  tenant_id: string;
  employee_id: string;
  item_type: 'pantalon' | 'zapatos' | 'campera' | 'camisa' | 'remera' | 'otro';
  size: string;
  quantity: number;
  delivery_date: string;
  notes: string | null;
  signature_url: string | null;
  created_at: string;
}

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

export type ProjectDocument = {
  id: string;
  tenant_id: string;
  project_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number;
  category: string;
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
  description: string | null;
  budget_cost_ars: number;
  budget_revenue_ars: number;
  committed_cost_ars: number;
  accrued_cost_ars: number;
  progress_pct: number;
  is_hard_stop: boolean;
  start_date: string | null;
  end_date: string | null;
  duration_days: number;
  status?: string;
  assigned_to: string | null;
  phase: 'planificacion' | 'programacion' | 'ejecucion' | 'completado';
  actual_start_date: string | null;
  actual_end_date: string | null;
  priority: 'baja' | 'media' | 'alta' | 'critica';
  color: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  employee?: Employee;
};

export type ProjectFeedback = {
  id: string;
  tenant_id: string;
  project_id: string;
  wbs_element_id: string | null;
  tipo: 'desviacion' | 'leccion' | 'mejora' | 'riesgo';
  descripcion: string;
  impacto: string | null;
  accion_correctiva: string | null;
  responsable: string | null;
  estado: 'abierto' | 'en_proceso' | 'resuelto';
  created_by: string | null;
  created_at: string;
  wbs_element?: WbsElement;
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
  expense_breakdown: Record<string, any> | null;
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
  status: 'pending' | 'approved' | 'invoiced' | 'deposited' | 'rejected';
  photo_url?: string | null;
  created_at: string;
  project?: Project;
};

// ========== CONFIGURACIÓN DEL SISTEMA ==========

export type SystemSetting = {
  id: string;
  tenant_id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

export type PaymentRecord = {
  id: string;
  tenant_id: string;
  entity_type: 'supplier' | 'employee' | 'obligation' | 'general' | 'other' | null;
  entity_id: string | null;
  payment_date: string;
  amount_ars: number;
  payment_method: string;
  check_number: string | null;
  bank_name: string | null;
  receipt_url: string | null;
  notes: string | null;
  paid_by: string | null;
  created_at: string;
};

// ========== INVENTARIO / PAÑOL ==========

export type WarehouseShelf = {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  shelf_type: 'rack' | 'pallet' | 'cabinet' | 'floor' | 'wall';
  rows_count: number;
  columns_count: number;
  color: string;
  grid_row: number;
  grid_col: number;
  grid_width: number;
  grid_height: number;
  rotation: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  tenant_id: string;
  name: string;
  category: 'material' | 'herramienta' | 'consumible' | string;
  rubro: string | null;
  measure: string | null;
  notes: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  location: string;
  qr_code: string | null;
  barcode: string | null;
  unit_cost: number;
  is_tool: boolean;
  shelf_id: string | null;
  shelf_position: string | null;
  created_at: string;
  shelf?: WarehouseShelf;
};

// ========== LIQUIDACIÓN OBREROS ==========
export type WeeklyPayrollDetail = {
  id: string;
  tenant_id: string;
  weekly_payment_id: string;
  weekly_payment_item_id: string;
  employee_id: string;
  week_start: string;
  week_end: string;
  worked_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  base_amount: number;
  extra_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  // Joined
  employee?: Employee;
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
  budget_id: string | null;
  request_type: 'purchase' | 'quote' | 'logistics';
  requested_by: string | null;
  urgency: 'low' | 'normal' | 'urgent';
  urgency_reason?: string | null;
  status: 'pending' | 'approved' | 'consolidated' | 'ordered' | 'received' | 'rejected' | 'quoted' | 'returned';
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
  budget_item_id: string | null;
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
  created_by: string | null;
  avance_porcentual: number;
  tareas_realizadas: Array<{ wbs_element_id?: string; descripcion: string; avance_pct: number }> | null;
  created_at: string;
  updated_at: string;
  obra?: Project;
};

export type ParteDiarioFoto = {
  id: string;
  parte_id: string;
  foto_url: string;
  descripcion: string | null;
  tipo: 'avance' | 'entrega' | 'incidente' | 'otro';
  taken_at: string;
  created_at: string;
};

export type ParteDiarioSolicitud = {
  id: string;
  tenant_id: string;
  parte_id: string;
  item_id: string | null;
  descripcion: string;
  cantidad: number;
  unidad: string;
  urgencia: 'baja' | 'normal' | 'urgente';
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  purchase_request_id: string | null;
  aprobada_por: string | null;
  aprobada_en: string | null;
  created_at: string;
  item?: InventoryItem;
};

export type ParteDiarioPersonal = {
  id: string;
  parte_id: string;
  employee_id: string;
  horas_trabajadas: number;
  tarea: string | null;
  created_at: string;
  employee?: Employee;
};

export type ParteDiarioEquipo = {
  id: string;
  parte_id: string;
  vehicle_id: string;
  horas_uso: number;
  tarea: string | null;
  created_at: string;
  vehicle?: FuelVehicle;
};

export type FleetMaintenanceOrder = {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  title: string;
  description: string | null;
  mechanic_assigned: string | null;
  status: 'pendiente' | 'en_taller' | 'terminado';
  start_date: string | null;
  completion_date: string | null;
  cost_materials: number;
  cost_labor: number;
  total_cost: number;
  odometer_at_entry: number | null;
  created_at: string;
  created_by: string | null;
  vehicle?: FuelVehicle;
};

export type FleetTire = {
  id: string;
  tenant_id: string;
  vehicle_id: string | null;
  code: string;
  brand: string | null;
  model: string | null;
  size: string | null;
  position: string | null;
  status: 'en_uso' | 'en_recapado' | 'baja' | 'stock';
  km_installed: number | null;
  expected_lifespan_km: number | null;
  tread_depth_mm: number | null;
  created_at: string;
  created_by: string | null;
  vehicle?: FuelVehicle;
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
  alias_cbu: string | null;
  titular_cuenta: string | null;
  aclaraciones: string | null;
  importe_mensual_default: number | null;
  created_at: string;
};

export type GastoRegistro = {
  id: string;
  tenant_id: string;
  item_id: string;
  periodo: string; // 'YYYY-MM'
  monto: number;
  monto_pagado: number;
  pagado: boolean;
  fecha_pago: string | null;
  metodo_pago: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  item?: GastoItem;
};

// ========== PRESUPUESTOS DE OBRA ==========

export type BudgetResource = {
  id: string;
  tenant_id: string;
  code: string | null;
  name: string;
  resource_type: 'material' | 'mano_obra' | 'equipo' | 'subcontrato';
  category: string | null;
  unit: string;
  unit_price_ars: number;
  supplier_ref: string | null;
  notes: string | null;
  is_active: boolean;
  last_price_update: string;
  created_at: string;
};

// ========== PIPELINE DE OPORTUNIDADES (Doc 2 – GPP) ==========

export type OpportunityStage =
  | 'oportunidad'
  | 'relevamiento'
  | 'en_presupuesto'
  | 'propuesta_enviada'
  | 'negociacion'
  | 'adjudicada'
  | 'rechazada';

export type Opportunity = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  client_name: string;
  client_contact: string | null;
  description: string;
  work_type: 'obra_nueva' | 'adicional' | 'servicio' | 'mantenimiento' | 'licitacion' | 'cambio_alcance' | 'consulta';
  estimated_amount: number;
  stage: OpportunityStage;
  priority: 'baja' | 'media' | 'alta' | 'critica';
  risk_level: 'bajo' | 'medio' | 'alto';
  location: string | null;
  estimated_deadline: string | null;
  documentation_checklist: {
    planos: boolean;
    pliego: boolean;
    memoria_tecnica: boolean;
    visita_obra: boolean;
    fotos: boolean;
    mediciones: boolean;
    condiciones_pago: boolean;
  };
  assumptions: string | null;
  exclusions: string | null;
  assigned_to: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  project?: Project | null;
  versions?: BudgetVersion[];
  files?: OpportunityFile[];
};

export type OpportunityFile = {
  id: string;
  tenant_id: string;
  opportunity_id: string;
  file_url: string;
  title: string;
  category: string;
  file_type: string | null;
  file_size: number | null;
  observations: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type BudgetVersion = {
  id: string;
  opportunity_id: string;
  version_number: number;
  amount: number;
  margin_pct: number;
  sent_to: string | null;
  sent_date: string | null;
  status: 'borrador' | 'enviada' | 'aprobada_interna' | 'aprobada_cliente' | 'rechazada';
  conditions: string | null;
  validity_days: number | null;
  file_url: string | null;
  notes: string | null;
  created_at: string;
};

// ========== ÓRDENES DE COMPRA / TRABAJO (Doc 3 – Compras) ==========

export type PurchaseOrder = {
  id: string;
  tenant_id: string;
  po_number: string;
  request_id: string | null;
  project_id: string | null;
  supplier_id: string | null;
  supplier_name: string;
  order_type: 'compra' | 'servicio' | 'alquiler';
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    subtotal: number;
  }>;
  total_amount: number;
  payment_condition: string | null;
  delivery_date: string | null;
  delivery_location: string | null;
  status: 'borrador' | 'pendiente_aprobacion' | 'aprobada' | 'emitida' | 'entregada_parcial' | 'entregada' | 'cerrada' | 'cancelada';
  approval_status: 'no_requerida' | 'pendiente' | 'aprobada' | 'rechazada';
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  urgency: boolean;
  urgency_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  project?: Project | null;
  supplier?: Supplier | null;
  request?: PurchaseRequest | null;
};

export type QuotationComparison = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  request_id: string | null;
  description: string;
  quotations: Array<{
    supplier_name: string;
    price: number;
    delivery_days: number;
    validity_days: number;
    payment_condition: string;
    quality_notes: string;
    recommended: boolean;
  }>;
  selected_supplier: string | null;
  selection_reason: string | null;
  status: 'en_curso' | 'definida' | 'cancelada';
  created_by: string | null;
  created_at: string;
};

export type SupplierEvaluation = {
  id: string;
  tenant_id: string;
  supplier_id: string | null;
  supplier_name: string;
  period: string; // YYYY-MM
  score_delivery: number; // 1-5
  score_quality: number;
  score_price: number;
  score_documentation: number;
  score_response: number;
  overall_score: number;
  recommendation: 'recomendado' | 'condicional' | 'no_recomendado' | 'bloquear';
  nc_count: number;
  notes: string | null;
  evaluated_by: string | null;
  created_at: string;
};

// ========== NO CONFORMIDADES (Docs 1-5, Transversal) ==========

export type NonConformity = {
  id: string;
  tenant_id: string;
  nc_number: string;
  project_id: string | null;
  category: 'compra' | 'obra' | 'logistica' | 'proveedor' | 'documental' | 'seguridad';
  area: string;
  description: string;
  evidence_urls: string[];
  impact: 'bajo' | 'medio' | 'alto' | 'critico';
  root_cause: string | null;
  immediate_action: string | null;
  corrective_action: string | null;
  responsible: string | null;
  status: 'abierta' | 'en_analisis' | 'accion_correctiva' | 'verificacion' | 'cerrada';
  detected_by: string | null;
  detected_at: string;
  closed_at: string | null;
  lesson_learned: string | null;
  created_at: string;
  // Joined
  project?: Project | null;
};

// ========== CAMBIOS DE ALCANCE Y ADICIONALES (Docs 2/5) ==========

export type ScopeChange = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  opportunity_id: string | null;
  change_type: 'adicional' | 'cambio_alcance' | 'desvio' | 'interferencia';
  origin: 'cliente' | 'inspeccion' | 'obra' | 'interno';
  description: string;
  technical_impact: string | null;
  economic_impact: number | null;
  deadline_impact_days: number | null;
  status: 'detectado' | 'en_evaluacion' | 'aprobado' | 'rechazado' | 'ejecutado';
  approved_by: string | null;
  approved_at: string | null;
  evidence_urls: string[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  project?: Project | null;
};

export type BudgetWorkType = 'obra_nueva' | 'adicional' | 'servicio' | 'mantenimiento' | 'instalacion' | 'licitacion' | 'cambio_alcance' | 'consulta';

export type Budget = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  opportunity_id: string | null;
  name: string;
  description: string | null;
  version: number;
  status: 'draft' | 'approved' | 'revision' | 'closed';
  gastos_generales_pct: number;
  beneficio_pct: number;
  financieros_pct: number;
  impuestos_pct: number;
  iibb_pct: number;
  total_direct_ars: number;
  total_indirect_ars: number;
  total_final_ars: number;
  assumptions: string | null;
  exclusions: string | null;
  validity_days: number;
  entry_checklist: Record<string, any> | null;
  missing_info: string | null;
  risks: Array<any> | null;
  change_origin: string | null;
  change_cause: string | null;
  change_technical_impact: string | null;
  change_economic_impact: string | null;
  actual_cost_ars: number;
  cost_deviation_cause: string | null;
  lessons_learned: string | null;
  work_type: BudgetWorkType;
  approved_by: string | null;
  approved_at: string | null;
  parent_version_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  project?: Project | null;
  opportunity?: Opportunity | null;
};

export type BudgetSection = {
  id: string;
  budget_id: string;
  parent_id: string | null;
  ordinal: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  budget_id: string;
  section_id: string | null;
  resource_id: string | null;
  ordinal: string | null;
  description: string;
  unit: string;
  quantity: number;
  unit_price_ars: number;
  cost_type: 'material' | 'mano_obra' | 'equipo' | 'subcontrato' | 'gasto_general' | 'financiero';
  notes: string | null;
  sort_order: number;
  quote_status: 'none' | 'requested' | 'received';
  quote_requested_at: string | null;
  logistics_validation: boolean;
  created_at: string;
  // Joined
  section?: BudgetSection | null;
  resource?: BudgetResource | null;
};

export type BudgetFile = {
  id: string;
  budget_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type BudgetAPU = {
  id: string;
  tenant_id: string;
  name: string;
  unit: string;
  description: string | null;
  total_ars: number;
  is_template: boolean;
  created_at: string;
  // Virtual
  components?: BudgetAPUComponent[];
};

export type BudgetAPUComponent = {
  id: string;
  apu_id: string;
  resource_id: string | null;
  description: string;
  resource_type: string;
  unit: string;
  quantity: number;
  unit_price_ars: number;
  sort_order: number;
  created_at: string;
  // Joined
  resource?: BudgetResource | null;
};

// ========== PARTE DIARIO VEHICULAR ==========

export type VehicleChecklistItem = {
  item: string;
  estado: 'ok' | 'falla';
  nota?: string;
};

export type VehicleFuelLevel = 'vacio' | 'cuarto' | 'medio' | 'tres_cuartos' | 'lleno';
export type VehicleCondition = 'operativo' | 'con_observaciones' | 'fuera_de_servicio';

export type VehicleDailyReport = {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  report_date: string;
  report_time: string | null;
  driver_name: string;
  project_id: string | null;
  odometer_km: number | null;
  hourmeter?: number | null;
  fuel_level: VehicleFuelLevel;
  checklist: VehicleChecklistItem[];
  has_damage: boolean;
  damage_description: string | null;
  damage_photos: string[];
  observations: string | null;
  signed_by: string | null;
  vehicle_condition_after: VehicleCondition;
  source: 'qr' | 'web' | 'mobile';
  created_at: string;
  // Joined
  vehicle?: FuelVehicle | null;
  project?: Project | null;
};

// ========== COMBUSTIBLE ==========

export type FuelVehicle = {
  id: string;
  tenant_id: string;
  code: string;
  vehicle_type: string;
  description: string;
  brand: string | null;
  model: string | null;
  plate: string | null;
  year: number | null;
  preferred_fuel: string | null;
  tank_capacity_liters: number | null;
  area: string | null;
  default_driver: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  vehicle_condition: VehicleCondition;
  tracking_type?: 'km' | 'hours';
  current_km: number | null;
  current_hours?: number | null;
  next_maintenance_date: string | null;
  next_maintenance_km: number | null;
  next_maintenance_hours?: number | null;
  maintenance_notes: string | null;
  last_maintenance_date: string | null;
  insurance_expiry: string | null;
  vtv_expiry: string | null;
  created_at: string;
};

export type FuelLoad = {
  id: string;
  tenant_id: string;
  load_number: string;
  load_date: string;
  month: string | null;
  year: number | null;
  day_of_week: string | null;
  vehicle_id: string | null;
  vehicle_code: string | null;
  vehicle_description: string | null;
  plate: string | null;
  vehicle_type: string | null;
  driver_name: string | null;
  project_name: string | null;
  project_id: string | null;
  supplier: string | null;
  fuel_type: string | null;
  liters: number | null;
  price_per_liter: number | null;
  total_amount: number | null;
  odometer_km: number | null;
  hourmeter: number | null;
  km_since_last: number | null;
  hours_since_last: number | null;
  estimated_yield: number | null;
  payment_method: string | null;
  voucher_number: string | null;
  remito_number: string | null;
  observations: string | null;
  validation_status: 'pending' | 'ok' | 'observed';
  load_source: 'station' | 'batan';
  batan_load_id: string | null;
  batan_price_applied: number | null;
  batan_balance_after: number | null;
  created_at: string;
  created_by: string;
  workflow_status?: 'requested' | 'authorized' | 'completed' | 'rejected';
  requested_liters?: number | null;
  requested_by?: string | null;
  authorized_by?: string | null;
  authorized_at?: string | null;
  supervisor_signature?: string | null;
  ticket_photo_url?: string | null;
  // Joined
  vehicle?: FuelVehicle | null;
};

export type FuelBatanMovement = {
  id: string;
  tenant_id: string;
  movement_number: string;
  movement_date: string;
  batan_name: string;
  capacity_liters: number;
  movement_type: 'purchase' | 'discharge';
  supplier: string | null;
  fuel_type: string | null;
  liters_loaded: number | null;
  price_per_liter: number | null;
  total_amount: number | null;
  remito_number: string | null;
  voucher_number: string | null;
  vehicle_id: string | null;
  vehicle_code: string | null;
  liters_discharged: number | null;
  driver_name: string | null;
  project_name: string | null;
  balance_after: number | null;
  movement_status: 'available' | 'used' | 'reconciled';
  observations: string | null;
  created_at: string;
};

export type FuelMonthlyReconciliation = {
  id: string;
  tenant_id: string;
  year: number;
  month: number;
  month_name: string | null;
  total_loads: number;
  total_liters: number;
  total_amount_sheet: number;
  total_vouchers: number;
  avg_per_load: number;
  supplier_invoice_amount: number | null;
  supplier_invoice_number: string | null;
  difference: number | null;
  reconciliation_notes: string | null;
  status: 'pending' | 'controlled' | 'observed';
  created_at: string;
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
  'purchase_orders',
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
  'project_budget',
  'opportunities',
  'budget_landing',
  'fuel',
  'nonconformities',
  'supplier_eval',
  'guide',
  'manual',
  'implementation',
  'user_management',
  'user_activity',
  'communications',
  'weekly_report',
  'payments',
  'worker_payments',
  'scope_changes',
  'quality',

  'compras_intro',
  'logistics_intro',
  'obra_intro',
  'finanzas_intro',
  'rrhh_intro',
] as const;

export type ModuleId = typeof ALL_MODULES[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
  bi: 'Dashboard BI',
  liquidity: 'Tablero de Liquidez',
  monthly_report: 'Resumen Mensual',
  wbs: 'Planificación de Obra',
  invoicing: 'Facturación (ARCA)',
  purchases: 'Compras & Libro IVA',
  purchase_requests: 'Pedidos de Compra',
  purchase_orders: 'Órdenes de Compra / OT',
  finances: 'Gerencia de Administración y Finanzas',
  obligations: 'Alertas & Obligaciones',
  rrhh: 'Gerencia de RRHH',
  inventory: 'Inventario & Pañol',
  logistics: 'Entregas',
  fleet: 'Flota y Maquinaria',
  certifications: 'Certificaciones',
  field: 'Parte Diario de Obra',
  safety: 'Seguridad & Incidentes',
  inspections: 'Inspecciones & Calidad',
  rfi: 'Consultas de Obra',
  expenses: 'Gastos Operativos',
  documents: 'Documentos & Correo',
  project_budget: 'Presupuestos de Obra',
  opportunities: 'Pipeline Oportunidades',
  budget_landing: 'Introducción GPP',
  compras_intro: 'Introducción Compras',
  logistics_intro: 'Introducción Logística',
  obra_intro: 'Introducción Ger. Obra',
  finanzas_intro: 'Introducción Finanzas',
  rrhh_intro: 'Introducción RRHH',
  fuel: 'Combustible',
  nonconformities: 'No Conformidades',
  supplier_eval: 'Evaluación de Proveedores',
  guide: 'Guía de Uso',
  manual: 'Manual de Procedimientos',
  implementation: 'Implementación',
  user_management: 'Gestión de Usuarios',
  user_activity: 'Actividad de Usuarios',
  communications: 'Comunicaciones',
  weekly_report: 'Reporte Semanal GG',
  payments: 'Control de Pagos',
  worker_payments: 'Pagos a Trabajadores',
  scope_changes: 'Adicionales y Alcance',
  
  quality: 'Inspecciones de Calidad',
};


export type AuditLog = { id: string; tenant_id: string; user_id: string; user_name: string; action_type: string; module: string; details: any; duration_seconds: number; created_at: string; };

// ========== LOGISTICS MODULE ==========

export type LogisticsDelivery = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  delivery_date: string;
  status: 'pendiente' | 'pendiente_autorizacion' | 'aprobado' | 'rechazado' | 'en_transito' | 'entregado' | 'cancelado';
  vehicle_id: string | null;
  driver_name: string | null;
  destination: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  project?: Project | null;
  vehicle?: FuelVehicle | null;
  items?: LogisticsDeliveryItem[];
};

export type LogisticsDeliveryItem = {
  id: string;
  delivery_id: string;
  item_id: string | null;
  description: string;
  quantity: number;
  unit: string | null;
  delivered_quantity: number;
  status: 'pendiente' | 'parcial' | 'entregado';
  created_at: string;
  // Joined
  item?: InventoryItem | null;
};

export type LogisticsMaintenanceLog = {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  type: 'service' | 'vtv' | 'seguro' | 'reparacion' | 'neumaticos' | 'otro';
  date: string;
  km_hours: number | null;
  cost: number;
  provider: string | null;
  description: string | null;
  next_due_date: string | null;
  next_due_km: number | null;
  created_by: string | null;
  created_at: string;
  // Joined
  vehicle?: FuelVehicle | null;
};

// ========== SCOPE CHANGES & QUALITY ==========

export type QualityChecklistItem = {
  id?: string;
  description: string;
  status: string;
  notes?: string;
  checked?: boolean;
};

export type QualityChecklist = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  wbs_element_id: string | null;
  title: string;
  inspector_name: string | null;
  items: QualityChecklistItem[];
  score: number;
  status: 'draft' | 'approved' | 'rejected';
  signature_url: string | null;
  notes: string | null;
  created_at: string;
  project?: { name: string };
  wbs_element?: { id: string, name: string };
};

