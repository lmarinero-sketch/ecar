import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import type {
  Employee, Project, UnionCategory, Shift, AttendanceRecord,
  Obligation, Invoice, Supplier, PurchaseInvoice, Cheque,
  PayrollPeriod, FixedExpense, EmployeeDocument, LetterTemplate,
  WbsElement, DocumentRequest, Profile,
  NotificationContact, NotificationReminder, NotificationLog,
  BankAccount, CashMovement, MonthlySnapshot, ProjectCertificate,
  InventoryItem, InventoryMovement, ToolAssignment,
  PurchaseRequest, PurchaseRequestItem,
  ParteDiario, SeguridadIncidente, SeguridadObservacion,
  Inspeccion, PunchListItem, ConsultaObra,
  GastoItem, GastoRegistro
} from '../lib/types';

// ========== PROJECTS ==========
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const { data, error } = await supabase.from('projects').insert({ ...project, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// ========== EMPLOYEES ==========
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, category:union_categories(*), project:projects(*)')
        .order('full_name');
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emp: Partial<Employee>) => {
      const { data, error } = await supabase.from('employees').insert({ ...emp, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase.from('employees').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

// ========== UNION CATEGORIES ==========
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('union_categories').select('*').eq('is_current', true).order('name');
      if (error) throw error;
      return data as UnionCategory[];
    },
  });
}

// ========== SHIFTS ==========
export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shifts').select('*').order('start_time');
      if (error) throw error;
      return data as Shift[];
    },
  });
}

// ========== ATTENDANCE ==========
export function useAttendance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['attendance', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, employee:employees(id, full_name, cuil)')
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date');
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Partial<AttendanceRecord>) => {
      const { error } = await supabase.from('attendance_records').insert(record);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

// ========== OBLIGATIONS ==========
export function useObligations() {
  return useQuery({
    queryKey: ['obligations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligations')
        .select('*, payments:obligation_payments(*)')
        .order('due_day_of_month');
      if (error) throw error;
      return data as Obligation[];
    },
  });
}

export function useCreateObligation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (obl: Partial<Obligation>) => {
      const { error } = await supabase.from('obligations').insert({ ...obl, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });
}

// ========== INVOICES ==========
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, items:invoice_items(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ...invoice }: Partial<Invoice> & { items?: Partial<InvoiceItem>[] }) => {
      const { data, error } = await supabase.from('invoices').insert({ ...invoice, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      if (items?.length) {
        const { error: itemError } = await supabase.from('invoice_items').insert(items.map(i => ({ ...i, invoice_id: data.id })));
        if (itemError) throw itemError;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

// ========== SUPPLIERS ==========
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sup: Partial<Supplier>) => {
      const { error } = await supabase.from('suppliers').insert({ ...sup, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

// ========== PURCHASE INVOICES ==========
export function usePurchaseInvoices() {
  return useQuery({
    queryKey: ['purchase_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_invoices').select('*, supplier:suppliers(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseInvoice[];
    },
  });
}

// ========== CHEQUES ==========
export function useCheques() {
  return useQuery({
    queryKey: ['cheques'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cheques').select('*').order('due_date');
      if (error) throw error;
      return data as Cheque[];
    },
  });
}

export function useCreateCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cheque: Partial<Cheque>) => {
      const { error } = await supabase.from('cheques').insert({ ...cheque, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cheques'] }),
  });
}

// ========== PAYROLL ==========
export function usePayrollPeriods() {
  return useQuery({
    queryKey: ['payroll_periods'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payroll_periods').select('*, lines:payroll_lines(*, employee:employees(id, full_name))').order('start_date', { ascending: false });
      if (error) throw error;
      return data as PayrollPeriod[];
    },
  });
}

// ========== FIXED EXPENSES ==========
export function useFixedExpenses() {
  return useQuery({
    queryKey: ['fixed_expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fixed_expenses').select('*, supplier:suppliers(*)').order('service_type');
      if (error) throw error;
      return data as FixedExpense[];
    },
  });
}

// ========== EMPLOYEE DOCUMENTS ==========
export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: ['employee_documents', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('employee_documents').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as EmployeeDocument[];
    },
    enabled: !!employeeId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, file, docType, title }: { employeeId: string; file: File; docType: string; title: string }) => {
      // 1. Upload file to Storage

      const filePath = `${employeeId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('legajos').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage.from('legajos').getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      // 3. Create document record
      const { error: dbError } = await supabase.from('employee_documents').insert({
        employee_id: employeeId,
        doc_type: docType,
        title,
        file_url: fileUrl,
        document_date: new Date().toISOString().split('T')[0],
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee_documents'] }),
  });
}

// ========== LETTER TEMPLATES ==========
export function useLetterTemplates() {
  return useQuery({
    queryKey: ['letter_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('letter_templates').select('*').order('name');
      if (error) throw error;
      return data as LetterTemplate[];
    },
  });
}

// ========== WBS ==========
export function useWbsElements(projectId?: string) {
  return useQuery({
    queryKey: ['wbs', projectId],
    queryFn: async () => {
      let q = supabase.from('wbs_elements').select('*').order('name');
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as WbsElement[];
    },
  });
}

// ========== DOCUMENT REQUESTS ==========
export function useDocumentRequests() {
  return useQuery({
    queryKey: ['document_requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as DocumentRequest[];
    },
  });
}

// ========== PROFILES (admin: manage users) ==========
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

// Needed for TypeScript — re-export for invoice items
type InvoiceItem = {
  description: string;
  quantity: number;
  unit: string;
  unit_price_ars: number;
  subtotal_ars: number;
  iva_rate: number;
};

// ========== NOTIFICATION CONTACTS ==========
export function useNotificationContacts() {
  return useQuery({
    queryKey: ['notification_contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_contacts').select('*').order('name');
      if (error) throw error;
      return data as NotificationContact[];
    },
  });
}

export function useCreateNotificationContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Partial<NotificationContact>) => {
      const { data, error } = await supabase.from('notification_contacts').insert({ ...contact, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_contacts'] }),
  });
}

export function useUpdateNotificationContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotificationContact> & { id: string }) => {
      const { error } = await supabase.from('notification_contacts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_contacts'] }),
  });
}

export function useDeleteNotificationContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_contacts'] }),
  });
}

// ========== NOTIFICATION REMINDERS ==========
export function useNotificationReminders() {
  return useQuery({
    queryKey: ['notification_reminders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_reminders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as NotificationReminder[];
    },
  });
}

export function useCreateNotificationReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: Partial<NotificationReminder>) => {
      const { data, error } = await supabase.from('notification_reminders').insert({ ...reminder, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_reminders'] }),
  });
}

export function useUpdateNotificationReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotificationReminder> & { id: string }) => {
      const { error } = await supabase.from('notification_reminders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_reminders'] }),
  });
}

export function useDeleteNotificationReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_reminders'] }),
  });
}

// ========== NOTIFICATION LOG ==========
export function useNotificationLog() {
  return useQuery({
    queryKey: ['notification_log'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_log').select('*').order('sent_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data as NotificationLog[];
    },
  });
}

export function useCreateNotificationLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<NotificationLog>) => {
      const { data, error } = await supabase.from('notification_log').insert({ ...log, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_log'] }),
  });
}

// ========== BANK ACCOUNTS ==========
export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bank_accounts').select('*').order('type');
      if (error) throw error;
      return data as BankAccount[];
    },
  });
}

export function useUpdateBankBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, current_balance }: { id: string; current_balance: number }) => {
      const { error } = await supabase.from('bank_accounts').update({ current_balance, last_updated: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_accounts'] }),
  });
}

// ========== CASH MOVEMENTS ==========
export function useCashMovements(month?: string) {
  return useQuery({
    queryKey: ['cash_movements', month],
    queryFn: async () => {
      let q = supabase.from('cash_movements').select('*, bank_account:bank_accounts(id, name, type)').order('movement_date', { ascending: false });
      if (month) {
        q = q.gte('movement_date', `${month}-01`).lte('movement_date', `${month}-31`);
      }
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data as CashMovement[];
    },
  });
}

export function useCreateCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mov: Partial<CashMovement>) => {
      const { data, error } = await supabase.from('cash_movements').insert({ ...mov, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash_movements'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
    },
  });
}

// ========== MONTHLY SNAPSHOTS ==========
export function useMonthlySnapshots() {
  return useQuery({
    queryKey: ['monthly_snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase.from('monthly_snapshots').select('*').order('month');
      if (error) throw error;
      return data as MonthlySnapshot[];
    },
  });
}

// ========== PROJECT CERTIFICATES ==========
export function useProjectCertificates(projectId?: string) {
  return useQuery({
    queryKey: ['project_certificates', projectId],
    queryFn: async () => {
      let q = supabase.from('project_certificates').select('*, project:projects(id, name)').order('certificate_number');
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProjectCertificate[];
    },
  });
}

export function useCreateProjectCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cert: Partial<ProjectCertificate>) => {
      const { data, error } = await supabase.from('project_certificates').insert({ ...cert, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_certificates'] }),
  });
}

// ========== INVENTORY ==========
export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('*').order('category').order('name');
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<InventoryItem>) => {
      const { data, error } = await supabase.from('inventory_items').insert({ ...item, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_items'] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { error } = await supabase.from('inventory_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_items'] }),
  });
}

export function useInventoryMovements(itemId?: string) {
  return useQuery({
    queryKey: ['inventory_movements', itemId],
    queryFn: async () => {
      let q = supabase.from('inventory_movements').select('*, item:inventory_items(id, name), project:projects(id, name)').order('created_at', { ascending: false });
      if (itemId) q = q.eq('item_id', itemId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as InventoryMovement[];
    },
  });
}

export function useCreateInventoryMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mov: Partial<InventoryMovement>) => {
      const { data, error } = await supabase.from('inventory_movements').insert({ ...mov, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_movements'] });
      qc.invalidateQueries({ queryKey: ['inventory_items'] });
    },
  });
}

export function useToolAssignments() {
  return useQuery({
    queryKey: ['tool_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tool_assignments').select('*, item:inventory_items(id, name), employee:employees(id, first_name, last_name), project:projects(id, name)').order('assigned_date', { ascending: false });
      if (error) throw error;
      return data as ToolAssignment[];
    },
  });
}

export function useCreateToolAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Partial<ToolAssignment>) => {
      const { data, error } = await supabase.from('tool_assignments').insert({ ...a, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tool_assignments'] }),
  });
}

export function useUpdateToolAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ToolAssignment> & { id: string }) => {
      const { error } = await supabase.from('tool_assignments').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tool_assignments'] });
      qc.invalidateQueries({ queryKey: ['inventory_items'] });
    },
  });
}

// ========== PURCHASE REQUESTS ==========
export function usePurchaseRequests() {
  return useQuery({
    queryKey: ['purchase_requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_requests').select('*, project:projects(id, name), items:purchase_request_items(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseRequest[];
    },
  });
}

export function useCreatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ...req }: Partial<PurchaseRequest> & { items: Partial<PurchaseRequestItem>[] }) => {
      const { data: request, error } = await supabase.from('purchase_requests').insert({ ...req, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('purchase_request_items').insert(items.map(i => ({ ...i, request_id: request.id })));
        if (itemsError) throw itemsError;
      }
      return request;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_requests'] }),
  });
}

export function useUpdatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseRequest> & { id: string }) => {
      const { error } = await supabase.from('purchase_requests').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_requests'] }),
  });
}

// ========== PARTE DIARIO DE OBRA ==========
export function usePartesDiarios(obraId?: string) {
  return useQuery({
    queryKey: ['partes_diarios', obraId],
    queryFn: async () => {
      let q = supabase.from('parte_diario').select('*, obra:projects(id, name)').order('fecha', { ascending: false });
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.limit(60);
      if (error) throw error;
      return data as ParteDiario[];
    },
  });
}

export function useCreateParteDiario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (parte: Partial<ParteDiario>) => {
      const { data, error } = await supabase.from('parte_diario').insert({ ...parte, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partes_diarios'] }),
  });
}

export function useUpdateParteDiario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ParteDiario> & { id: string }) => {
      const { error } = await supabase.from('parte_diario').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partes_diarios'] }),
  });
}

// ========== SEGURIDAD E INCIDENTES ==========
export function useSeguridadIncidentes(obraId?: string) {
  return useQuery({
    queryKey: ['seguridad_incidentes', obraId],
    queryFn: async () => {
      let q = supabase.from('seguridad_incidentes').select('*, obra:projects(id, name)').order('fecha', { ascending: false });
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as SeguridadIncidente[];
    },
  });
}

export function useCreateSeguridadIncidente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inc: Partial<SeguridadIncidente>) => {
      const { data, error } = await supabase.from('seguridad_incidentes').insert({ ...inc, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seguridad_incidentes'] }),
  });
}

export function useUpdateSeguridadIncidente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SeguridadIncidente> & { id: string }) => {
      const { error } = await supabase.from('seguridad_incidentes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seguridad_incidentes'] }),
  });
}

export function useSeguridadObservaciones(obraId?: string) {
  return useQuery({
    queryKey: ['seguridad_observaciones', obraId],
    queryFn: async () => {
      let q = supabase.from('seguridad_observaciones').select('*, obra:projects(id, name)').order('fecha', { ascending: false });
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as SeguridadObservacion[];
    },
  });
}

export function useCreateSeguridadObservacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (obs: Partial<SeguridadObservacion>) => {
      const { data, error } = await supabase.from('seguridad_observaciones').insert({ ...obs, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seguridad_observaciones'] }),
  });
}

// ========== INSPECCIONES ==========
export function useInspecciones(obraId?: string) {
  return useQuery({
    queryKey: ['inspecciones', obraId],
    queryFn: async () => {
      let q = supabase.from('inspecciones').select('*, obra:projects(id, name)').order('fecha', { ascending: false });
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as Inspeccion[];
    },
  });
}

export function useCreateInspeccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (insp: Partial<Inspeccion>) => {
      const { data, error } = await supabase.from('inspecciones').insert({ ...insp, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspecciones'] }),
  });
}

export function useUpdateInspeccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Inspeccion> & { id: string }) => {
      const { error } = await supabase.from('inspecciones').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspecciones'] }),
  });
}

// ========== PUNCH LIST ==========
export function usePunchList(obraId?: string) {
  return useQuery({
    queryKey: ['punch_list', obraId],
    queryFn: async () => {
      let q = supabase.from('punch_list').select('*, obra:projects(id, name)').order('created_at', { ascending: false });
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data as PunchListItem[];
    },
  });
}

export function useCreatePunchItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<PunchListItem>) => {
      const { data, error } = await supabase.from('punch_list').insert({ ...item, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['punch_list'] }),
  });
}

export function useUpdatePunchItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PunchListItem> & { id: string }) => {
      const { error } = await supabase.from('punch_list').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['punch_list'] }),
  });
}

// ========== CONSULTAS DE OBRA (RFI) ==========
export function useConsultasObra(obraId?: string) {
  return useQuery({
    queryKey: ['consultas_obra', obraId],
    queryFn: async () => {
      let q = supabase.from('consultas_obra').select('*, obra:projects(id, name)').order('created_at', { ascending: false });
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as ConsultaObra[];
    },
  });
}

export function useCreateConsultaObra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (consulta: Partial<ConsultaObra>) => {
      const { data, error } = await supabase.from('consultas_obra').insert({ ...consulta, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultas_obra'] }),
  });
}

export function useUpdateConsultaObra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConsultaObra> & { id: string }) => {
      const { error } = await supabase.from('consultas_obra').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultas_obra'] }),
  });
}

// ========== GASTOS OPERATIVOS ==========
export function useGastosItems() {
  return useQuery({
    queryKey: ['gastos_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gastos_items').select('*').eq('activo', true).order('categoria').order('orden');
      if (error) throw error;
      return data as GastoItem[];
    },
  });
}

export function useCreateGastoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<GastoItem>) => {
      const { error } = await supabase.from('gastos_items').insert({ ...item, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gastos_items'] }),
  });
}

export function useUpdateGastoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GastoItem> & { id: string }) => {
      const { error } = await supabase.from('gastos_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gastos_items'] }),
  });
}

export function useDeleteGastoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gastos_items').update({ activo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos_items'] });
      qc.invalidateQueries({ queryKey: ['gastos_registros'] });
    },
  });
}

export function useGastosRegistros(periodo?: string) {
  return useQuery({
    queryKey: ['gastos_registros', periodo],
    queryFn: async () => {
      let q = supabase.from('gastos_registros').select('*, item:gastos_items(*)');
      if (periodo) q = q.eq('periodo', periodo);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data as GastoRegistro[];
    },
  });
}

export function useGastosRegistrosByRange(periodos: string[]) {
  return useQuery({
    queryKey: ['gastos_registros_range', periodos],
    queryFn: async () => {
      if (!periodos.length) return [];
      const { data, error } = await supabase.from('gastos_registros').select('*, item:gastos_items(*)').in('periodo', periodos).order('periodo');
      if (error) throw error;
      return data as GastoRegistro[];
    },
    enabled: periodos.length > 0,
  });
}

export function useUpsertGastoRegistro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reg: { item_id: string; periodo: string; monto: number; pagado?: boolean; metodo_pago?: string; notas?: string }) => {
      const { error } = await supabase.from('gastos_registros').upsert(
        { ...reg, tenant_id: ECAR_TENANT_ID },
        { onConflict: 'item_id,periodo' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos_registros'] });
      qc.invalidateQueries({ queryKey: ['gastos_registros_range'] });
    },
  });
}
