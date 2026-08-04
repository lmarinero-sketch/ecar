import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import type {
  Employee, Project, UnionCategory, Shift, AttendanceRecord,
  Obligation, Invoice, Supplier, PurchaseInvoice, Cheque,
  PayrollPeriod, FixedExpense, EmployeeDocument, ProjectDocument, LetterTemplate,
  WbsElement, DocumentRequest, Profile, ProjectFeedback,
  NotificationContact, NotificationReminder, NotificationLog,
  BankAccount, CashMovement, MonthlySnapshot, ProjectCertificate, SystemSetting, PaymentRecord,
  InventoryItem, InventoryMovement, ToolAssignment, WarehouseShelf,
  PurchaseRequest, PurchaseRequestItem,
  ParteDiario, ParteDiarioFoto, ParteDiarioSolicitud, ParteDiarioPersonal, ParteDiarioEquipo,
  SeguridadIncidente, SeguridadObservacion,
  Inspeccion, PunchListItem, ConsultaObra,
  GastoItem, GastoRegistro,
  EmployeeAbsence, EmployeeAdvance, SalaryHistoryEntry, DailyTask,
  BudgetResource, Budget, BudgetSection, BudgetItem, BudgetFile,
  FuelVehicle, FuelLoad, FuelBatanMovement, FuelMonthlyReconciliation,
  VehicleDailyReport,
  Opportunity, PurchaseOrder, SupplierEvaluation, NonConformity, ScopeChange,
  
  LogisticsDelivery, LogisticsDeliveryItem, LogisticsMaintenanceLog,
  EmployeePPEDelivery, LegalEntity,
  FleetMaintenanceOrder, FleetTire,
  QualityChecklist
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

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string, updates: Partial<Project> }) => {
      const { data, error } = await supabase.from('projects').update(params.updates).eq('id', params.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['wbs_elements'] });
    },
  });
}

// ========== EMPLOYEES
export function useDriverKpis() {
  return useQuery({
    queryKey: ['driver_kpis'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_drivers_kpis');
      if (error) throw error;
      return data as { driver_name: string; safety_score: number; efficiency_km_l: number }[];
    },
  });
}

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

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').update({ employment_status: 'terminated', termination_date: new Date().toISOString().split('T')[0] }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

// ========== EMPLOYEE PPE DELIVERIES ==========
export function useEmployeePPE(employeeId: string | null) {
  return useQuery({
    queryKey: ['employee_ppe_deliveries', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('employee_ppe_deliveries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('delivery_date', { ascending: false });
      if (error) throw error;
      return data as EmployeePPEDelivery[];
    },
    enabled: !!employeeId,
  });
}

export function useCreateEmployeePPE() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ppe: Partial<EmployeePPEDelivery>) => {
      const { data, error } = await supabase
        .from('employee_ppe_deliveries')
        .insert({ ...ppe, tenant_id: ECAR_TENANT_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['employee_ppe_deliveries', variables.employee_id] });
    },
  });
}

export function useDeleteEmployeePPE() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string, employee_id: string }) => {
      const { error } = await supabase.from('employee_ppe_deliveries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['employee_ppe_deliveries', variables.employee_id] }),
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

export function useAllCategoriesHistory() {
  return useQuery({
    queryKey: ['categories_history'],
    queryFn: async () => {
      const { data, error } = await supabase.from('union_categories').select('*').order('name').order('effective_from', { ascending: false });
      if (error) throw error;
      return data as UnionCategory[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: { name: string; hourly_rate_ars: number; daily_rate_ars: number }) => {
      const { data, error } = await supabase.from('union_categories').insert({
        ...cat, tenant_id: ECAR_TENANT_ID, is_current: true,
        effective_from: new Date().toISOString().split('T')[0],
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); qc.invalidateQueries({ queryKey: ['categories_history'] }); },
  });
}

export function useUpdateCategoryRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hourly_rate_ars, daily_rate_ars }: { id: string; hourly_rate_ars: number; daily_rate_ars: number }) => {
      // 1. Get old category
      const { data: old, error: fetchErr } = await supabase.from('union_categories').select('*').eq('id', id).single();
      if (fetchErr) throw fetchErr;
      const today = new Date().toISOString().split('T')[0];
      // 2. Archive old (set effective_to, is_current=false)
      const { error: archiveErr } = await supabase.from('union_categories').update({ is_current: false, effective_to: today, updated_at: new Date().toISOString() }).eq('id', id);
      if (archiveErr) throw archiveErr;
      // 3. Create new version
      const { error: createErr } = await supabase.from('union_categories').insert({
        tenant_id: old.tenant_id, name: old.name,
        hourly_rate_ars, daily_rate_ars,
        effective_from: today, is_current: true,
      });
      if (createErr) throw createErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); qc.invalidateQueries({ queryKey: ['categories_history'] }); },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('union_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); qc.invalidateQueries({ queryKey: ['categories_history'] }); },
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

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AttendanceRecord> & { id: string }) => {
      const { error } = await supabase.from('attendance_records').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useBulkCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, checkoutTime, ids }: { date: string, checkoutTime: string, ids: string[] }) => {
      const { error } = await supabase.from('attendance_records')
        .update({ clock_out: checkoutTime })
        .in('id', ids)
        .eq('record_date', date)
        .is('clock_out', null);
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

export function useUpdateObligation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Obligation> & { id: string }) => {
      const { error } = await supabase.from('obligations').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });
}

export function useDeleteObligation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('obligations').delete().eq('id', id);
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

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

// ========== LEGAL ENTITIES ==========
export function useLegalEntities() {
  return useQuery({
    queryKey: ['legal_entities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('legal_entities').select('*').order('name');
      if (error) throw error;
      return data as LegalEntity[];
    },
  });
}

export function useCreateLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entity: Partial<LegalEntity>) => {
      const { data, error } = await supabase.from('legal_entities').insert({ ...entity, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal_entities'] }),
  });
}

export function useUpdateLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LegalEntity> & { id: string }) => {
      const { error } = await supabase.from('legal_entities').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal_entities'] }),
  });
}

export function useDeleteLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('legal_entities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal_entities'] }),
  });
}

// ========== PURCHASE INVOICES ==========
export function usePurchaseInvoices() {
  return useQuery({
    queryKey: ['purchase_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_invoices').select('*, supplier:suppliers(*), allocations:purchase_invoice_allocations(*), legal_entity:legal_entities(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseInvoice[];
    },
  });
}

export function useUpdateInvoiceAllocations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoice_id, allocations }: { invoice_id: string; allocations: any[] }) => {
      // Delete old allocations for this invoice
      const { error: deleteErr } = await supabase.from('purchase_invoice_allocations').delete().eq('invoice_id', invoice_id);
      if (deleteErr) throw deleteErr;

      // Insert new allocations
      if (allocations.length > 0) {
        const { error: insertErr } = await supabase.from('purchase_invoice_allocations').insert(allocations);
        if (insertErr) throw insertErr;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] }),
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

export function useUpdateCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cheque> & { id: string }) => {
      const { data, error } = await supabase.from('cheques').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cheques'] }),
  });
}

export function useDeleteCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cheques').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cheques'] }),
  });
}

export function useCreateChequeAuditLog() {
  return useMutation({
    mutationFn: async (log: {
      cheque_id: string | null;
      action: 'created' | 'updated' | 'deleted' | 'status_changed';
      user_id: string | null;
      user_name: string;
      changes?: Record<string, { old: unknown; new: unknown }>;
      snapshot?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from('cheque_audit_log').insert({
        tenant_id: ECAR_TENANT_ID,
        ...log,
      });
      if (error) throw error;
    },
  });
}

export function useChequeAuditLog(chequeId: string | null) {
  return useQuery({
    queryKey: ['cheque_audit_log', chequeId],
    enabled: !!chequeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cheque_audit_log')
        .select('*')
        .eq('cheque_id', chequeId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
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

      // 2. Get signed URL (works even if bucket is not public)
      const { data: signedData, error: signedError } = await supabase.storage.from('legajos').createSignedUrl(filePath, 31536000); // 1 year
      const fileUrl = signedError ? supabase.storage.from('legajos').getPublicUrl(filePath).data.publicUrl : signedData.signedUrl;

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

// ========== PROJECT DOCUMENTS ==========
export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ['project_documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectDocument[];
    },
    enabled: !!projectId,
  });
}

export function useUploadProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, file, category }: { projectId: string; file: File; category: string }) => {
      const filePath = `${projectId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('project-documents').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('project_documents').insert({
        project_id: projectId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type || null,
        file_size: file.size,
        category,
        tenant_id: ECAR_TENANT_ID
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_documents'] }),
  });
}

export function useDeleteProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      const { error: storageError } = await supabase.storage.from('project-documents').remove([filePath]);
      if (storageError) throw storageError;

      const { error } = await supabase.from('project_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_documents'] }),
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
      let q = supabase.from('wbs_elements').select('*, employee:employees(id, full_name)').order('sort_order').order('name');
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as WbsElement[];
    },
  });
}

export function useCreateWbsElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (el: Partial<WbsElement>) => {
      const { data, error } = await supabase.from('wbs_elements').insert(el).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbs'] }),
  });
}

export function useUpdateWbsElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WbsElement> & { id: string }) => {
      const { error } = await supabase.from('wbs_elements').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbs'] }),
  });
}

export function useDeleteWbsElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wbs_elements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbs'] }),
  });
}

// ========== PROJECT FEEDBACK ==========
export function useProjectFeedback(projectId?: string) {
  return useQuery({
    queryKey: ['project_feedback', projectId],
    queryFn: async () => {
      let q = supabase.from('project_feedback').select('*, wbs_element:wbs_elements(id, name)').order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as ProjectFeedback[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fb: Partial<ProjectFeedback>) => {
      const { data, error } = await supabase.from('project_feedback').insert({ ...fb, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_feedback'] }),
  });
}

export function useUpdateProjectFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectFeedback> & { id: string }) => {
      const { error } = await supabase.from('project_feedback').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_feedback'] }),
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

// Needed for TypeScript â€” re-export for invoice items
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

export function useUpsertMonthlySnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (snap: Partial<MonthlySnapshot> & { month: string }) => {
      const { data: exist } = await supabase.from('monthly_snapshots').select('id').eq('month', snap.month).maybeSingle();
      const payload = { ...snap, tenant_id: ECAR_TENANT_ID };
      if (exist?.id) {
        const { data, error } = await supabase.from('monthly_snapshots').update(payload).eq('id', exist.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('monthly_snapshots').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monthly_snapshots'] });
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

export function useUpdateProjectCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectCertificate> & { id: string }) => {
      const { error } = await supabase.from('project_certificates').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_certificates'] }),
  });
}

export function useDeleteProjectCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_certificates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_certificates'] }),
  });
}

// ========== PAYMENT RECORDS ==========
export function usePaymentRecords() {
  return useQuery({
    queryKey: ['payment_records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data as PaymentRecord[];
    },
  });
}

// ========== WAREHOUSE SHELVES ==========
export function useWarehouseShelves() {
  return useQuery({
    queryKey: ['warehouse_shelves'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouse_shelves').select('*').order('code');
      if (error) throw error;
      return data as WarehouseShelf[];
    },
  });
}

export function useCreateWarehouseShelf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shelf: Partial<WarehouseShelf>) => {
      const { data, error } = await supabase.from('warehouse_shelves').insert({ ...shelf, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouse_shelves'] }),
  });
}

export function useUpdateWarehouseShelf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WarehouseShelf> & { id: string }) => {
      const { error } = await supabase.from('warehouse_shelves').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouse_shelves'] }),
  });
}

export function useDeleteWarehouseShelf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('warehouse_shelves').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouse_shelves'] }),
  });
}

// ========== SYSTEM SETTINGS ==========
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('*').order('key');
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ['system_settings', key],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('*').eq('key', key).maybeSingle();
      if (error) throw error;
      return data as SystemSetting | null;
    },
  });
}

export function useUpsertSystemSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      const { data, error } = await supabase.from('system_settings').upsert({ tenant_id: ECAR_TENANT_ID, key, value, description: description || null, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,key' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_settings'] }),
  });
}

export function useCreatePaymentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Partial<PaymentRecord>) => {
      const { data, error } = await supabase
        .from('payment_records')
        .insert({ ...record, tenant_id: ECAR_TENANT_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_records'] }),
  });
}

// ========== INVENTORY ==========
export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('*, shelf:warehouse_shelves(id, code, name, color, shelf_type)').order('category').order('name');
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<InventoryItem>) => {
      const { data, error } = await supabase.from('inventory_items').insert({ ...item, tenant_id: ECAR_TENANT_ID }).select();
      if (error) throw error;
      return data?.[0] || data;
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

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_items'] }),
  });
}

export function useDeleteAllInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await supabase.from('inventory_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('tool_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error: itemsErr } = await supabase.from('inventory_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (itemsErr) throw itemsErr;
      const { error: shelvesErr } = await supabase.from('warehouse_shelves').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (shelvesErr) throw shelvesErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items'] });
      qc.invalidateQueries({ queryKey: ['warehouse_shelves'] });
      qc.invalidateQueries({ queryKey: ['tool_assignments'] });
      qc.invalidateQueries({ queryKey: ['inventory_movements'] });
    },
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
      qc.invalidateQueries({ queryKey: ['project_inventory_movements'] });
    },
  });
}

export function useToolAssignments() {
  return useQuery({
    queryKey: ['tool_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tool_assignments').select('*, item:inventory_items(id, name), employee:employees(id, full_name), project:projects(id, name)').order('assigned_date', { ascending: false });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tool_assignments'] });
      qc.invalidateQueries({ queryKey: ['project_tool_assignments'] });
    },
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
      qc.invalidateQueries({ queryKey: ['project_tool_assignments'] });
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
    mutationFn: async ({ items, ...req }: Omit<Partial<PurchaseRequest>, 'items'> & { items: Partial<PurchaseRequestItem>[] }) => {
      const { data: request, error } = await supabase.from('purchase_requests').insert({ ...req, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('purchase_request_items').insert(items.map(i => ({ ...i, request_id: request.id })));
        if (itemsError) throw itemsError;
      }
      return request;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
      qc.invalidateQueries({ queryKey: ['project_purchase_requests'] });
    },
  });
}

export function useUpdatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseRequest> & { id: string }) => {
      const { error } = await supabase.from('purchase_requests').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
      qc.invalidateQueries({ queryKey: ['project_purchase_requests'] });
    },
  });
}

export function useUpdatePurchaseRequestItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; estimated_unit_cost?: number; quantity_sent?: number | null; quantity_received?: number | null; dispatch_notes?: string | null; reception_notes?: string | null; budget_item_id?: string | null }[]) => {
      for (const item of items) {
        const updates: any = {};
        if (item.estimated_unit_cost !== undefined) updates.estimated_unit_cost = item.estimated_unit_cost;
        if (item.quantity_sent !== undefined) updates.quantity_sent = item.quantity_sent;
        if (item.quantity_received !== undefined) updates.quantity_received = item.quantity_received;
        if (item.dispatch_notes !== undefined) updates.dispatch_notes = item.dispatch_notes;
        if (item.reception_notes !== undefined) updates.reception_notes = item.reception_notes;

        const { error } = await supabase.from('purchase_request_items').update(updates).eq('id', item.id);
        if (error) throw error;

        if (item.budget_item_id && item.estimated_unit_cost !== undefined) {
          const { error: budgetError } = await supabase.from('budget_items').update({ unit_price_ars: item.estimated_unit_cost, quote_status: 'received' }).eq('id', item.budget_item_id);
          if (budgetError) throw budgetError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
      qc.invalidateQueries({ queryKey: ['project_purchase_requests'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget_items'] });
    },
  });
}

export function useDispatchPurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      dispatchedBy,
      items
    }: {
      requestId: string;
      dispatchedBy: string;
      items: { id: string; quantity_sent: number; dispatch_notes?: string }[];
    }) => {
      // 1. Fetch purchase_requests to get project_id
      const { data: reqData } = await supabase
        .from('purchase_requests')
        .select('project_id, project:projects(name)')
        .eq('id', requestId)
        .maybeSingle();

      // 2. Fetch purchase_request_items to inspect inventory_item_id
      const { data: reqItems } = await supabase
        .from('purchase_request_items')
        .select('id, inventory_item_id, description, quantity')
        .eq('request_id', requestId);

      const itemsMap = new Map((reqItems || []).map(i => [i.id, i]));

      // 3. Update purchase_requests status to 'ordered' and set dispatch info
      const { error: reqErr } = await supabase
        .from('purchase_requests')
        .update({
          status: 'ordered',
          dispatched_at: new Date().toISOString(),
          dispatched_by: dispatchedBy
        })
        .eq('id', requestId);

      if (reqErr) throw reqErr;

      // 4. Update item quantities sent + Deduct inventory stock & record kardex movement
      for (const item of items) {
        const originalItem = itemsMap.get(item.id);

        const { error: itemErr } = await supabase
          .from('purchase_request_items')
          .update({
            quantity_sent: item.quantity_sent,
            dispatch_notes: item.dispatch_notes || null
          })
          .eq('id', item.id);

        if (itemErr) throw itemErr;

        // AUTOMATIC STOCK DEDUCTION & KARDEX MOVEMENT LOGGING
        if (item.quantity_sent > 0 && originalItem?.inventory_item_id) {
          const invId = originalItem.inventory_item_id;

          // a. Get current stock
          const { data: inv } = await supabase
            .from('inventory_items')
            .select('current_stock, name')
            .eq('id', invId)
            .maybeSingle();

          if (inv) {
            const currentStock = Number(inv.current_stock) || 0;
            const newStock = Math.max(0, currentStock - item.quantity_sent);

            // b. Update stock in inventory
            await supabase
              .from('inventory_items')
              .update({ current_stock: newStock })
              .eq('id', invId);

            // c. Log Kardex movement
            const projectName = (reqData as any)?.project?.name || 'Obra';
            const noteText = `Egreso por Despacho a ${projectName} (Pedido PED-${requestId.slice(0, 8).toUpperCase()}). ${item.dispatch_notes || ''}`.trim();

            await supabase.from('inventory_movements').insert({
              tenant_id: ECAR_TENANT_ID,
              item_id: invId,
              movement_type: 'out',
              quantity: item.quantity_sent,
              project_id: reqData?.project_id || null,
              notes: noteText,
              created_by: dispatchedBy
            });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
      qc.invalidateQueries({ queryKey: ['project_purchase_requests'] });
      qc.invalidateQueries({ queryKey: ['inventory_items'] });
      qc.invalidateQueries({ queryKey: ['inventory_movements'] });
    },
  });
}

export function useReceivePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      receivedBy,
      items
    }: {
      requestId: string;
      receivedBy: string;
      items: { id: string; quantity_received: number; reception_notes?: string }[];
    }) => {
      // 1. Update purchase_requests status to 'received' and set reception info
      const { error: reqErr } = await supabase
        .from('purchase_requests')
        .update({
          status: 'received',
          received_at: new Date().toISOString(),
          received_by: receivedBy
        })
        .eq('id', requestId);

      if (reqErr) throw reqErr;

      // 2. Update item quantities received
      for (const item of items) {
        const { error: itemErr } = await supabase
          .from('purchase_request_items')
          .update({
            quantity_received: item.quantity_received,
            reception_notes: item.reception_notes || null
          })
          .eq('id', item.id);

        if (itemErr) throw itemErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
      qc.invalidateQueries({ queryKey: ['project_purchase_requests'] });
    },
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

// ========== PARTE DIARIO: FOTOS ==========
export function useParteFotos(parteId?: string) {
  return useQuery({
    queryKey: ['parte_fotos', parteId],
    queryFn: async () => {
      const { data, error } = await supabase.from('parte_diario_fotos').select('*').eq('parte_id', parteId!).order('taken_at', { ascending: false });
      if (error) throw error;
      return data as ParteDiarioFoto[];
    },
    enabled: !!parteId,
  });
}

export function useCreateParteFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (foto: Partial<ParteDiarioFoto>) => {
      const { data, error } = await supabase.from('parte_diario_fotos').insert(foto).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_fotos'] }),
  });
}

export function useDeleteParteFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parte_diario_fotos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_fotos'] }),
  });
}

// ========== PARTE DIARIO: SOLICITUDES DE MATERIALES ==========
export function useParteSolicitudes(parteId?: string) {
  return useQuery({
    queryKey: ['parte_solicitudes', parteId],
    queryFn: async () => {
      const { data, error } = await supabase.from('parte_diario_solicitudes').select('*, item:inventory_items(id, name, unit, category)').eq('parte_id', parteId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data as ParteDiarioSolicitud[];
    },
    enabled: !!parteId,
  });
}

export function useCreateParteSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sol: Partial<ParteDiarioSolicitud>) => {
      const { data, error } = await supabase.from('parte_diario_solicitudes').insert({ ...sol, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_solicitudes'] }),
  });
}

export function useUpdateParteSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ParteDiarioSolicitud> & { id: string }) => {
      const { error } = await supabase.from('parte_diario_solicitudes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_solicitudes'] }),
  });
}

// ========== PARTE DIARIO: PERSONAL PRESENTE ==========
export function usePartePersonal(parteId?: string) {
  return useQuery({
    queryKey: ['parte_personal', parteId],
    queryFn: async () => {
      const { data, error } = await supabase.from('parte_diario_personal').select('*, employee:employees(id, full_name, dni)').eq('parte_id', parteId!).order('created_at');
      if (error) throw error;
      return data as ParteDiarioPersonal[];
    },
    enabled: !!parteId,
  });
}

export function useCreatePartePersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<ParteDiarioPersonal>) => {
      const { data, error } = await supabase.from('parte_diario_personal').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_personal'] }),
  });
}

export function useDeletePartePersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parte_diario_personal').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_personal'] }),
  });
}

// ========== PARTE DIARIO: EQUIPOS EN OBRA ==========
export function useParteEquipos(parteId?: string) {
  return useQuery({
    queryKey: ['parte_equipos', parteId],
    queryFn: async () => {
      const { data, error } = await supabase.from('parte_diario_equipos').select('*, vehicle:fuel_vehicles(id, code, description, vehicle_type)').eq('parte_id', parteId!).order('created_at');
      if (error) throw error;
      return data as ParteDiarioEquipo[];
    },
    enabled: !!parteId,
  });
}

export function useCreateParteEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Partial<ParteDiarioEquipo>) => {
      const { data, error } = await supabase.from('parte_diario_equipos').insert(e).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_equipos'] }),
  });
}

export function useDeleteParteEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parte_diario_equipos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parte_equipos'] }),
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

export function useGastosRegistrosByItem(itemId?: string) {
  return useQuery({
    queryKey: ['gastos_registros_item', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const { data, error } = await supabase.from('gastos_registros').select('*').eq('item_id', itemId).order('periodo', { ascending: false });
      if (error) throw error;
      return data as GastoRegistro[];
    },
    enabled: !!itemId,
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

// ========== EMPLOYEE ABSENCES ==========
export function useEmployeeAbsences(employeeId?: string) {
  return useQuery({
    queryKey: ['employee_absences', employeeId],
    queryFn: async () => {
      let q = supabase.from('employee_absences').select('*, employee:employees(id, full_name)').order('start_date', { ascending: false });
      if (employeeId) q = q.eq('employee_id', employeeId);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data as EmployeeAbsence[];
    },
    enabled: employeeId ? !!employeeId : true,
  });
}

export function useCreateEmployeeAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (absence: Partial<EmployeeAbsence>) => {
      const { error } = await supabase.from('employee_absences').insert({ ...absence, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee_absences'] }),
  });
}

export function useUpdateEmployeeAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmployeeAbsence> & { id: string }) => {
      const { error } = await supabase.from('employee_absences').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee_absences'] }),
  });
}

export function useDeleteEmployeeAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_absences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee_absences'] }),
  });
}

// ========== EMPLOYEE ADVANCES ==========
export function useEmployeeAdvances(employeeId?: string) {
  return useQuery({
    queryKey: ['employee_advances', employeeId],
    queryFn: async () => {
      let q = supabase.from('employee_advances').select('*, employee:employees(id, full_name)').order('advance_date', { ascending: false });
      if (employeeId) q = q.eq('employee_id', employeeId);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data as EmployeeAdvance[];
    },
    enabled: employeeId ? !!employeeId : true,
  });
}

export function useCreateEmployeeAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (advance: Partial<EmployeeAdvance>) => {
      const { error } = await supabase.from('employee_advances').insert({ ...advance, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee_advances'] }),
  });
}

export function useDeleteEmployeeAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_advances').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee_advances'] }),
  });
}

// ========== SALARY HISTORY ==========
export function useSalaryHistory(employeeId?: string) {
  return useQuery({
    queryKey: ['salary_history', employeeId],
    queryFn: async () => {
      let q = supabase.from('salary_history').select('*, category:union_categories(id, name)').order('effective_from', { ascending: false });
      if (employeeId) q = q.eq('employee_id', employeeId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as SalaryHistoryEntry[];
    },
    enabled: employeeId ? !!employeeId : true,
  });
}

export function useCreateSalaryHistoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Partial<SalaryHistoryEntry>) => {
      const { error } = await supabase.from('salary_history').insert({ ...entry, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary_history'] }),
  });
}

// ========== DAILY TASKS ==========
export function useDailyTasks(date?: string) {
  return useQuery({
    queryKey: ['daily_tasks', date],
    queryFn: async () => {
      let q = supabase.from('daily_tasks').select('*').order('created_at', { ascending: false });
      if (date) q = q.eq('due_date', date);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data as DailyTask[];
    },
  });
}

export function useCreateDailyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<DailyTask>) => {
      const { error } = await supabase.from('daily_tasks').insert({ ...task, tenant_id: ECAR_TENANT_ID });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily_tasks'] }),
  });
}

export function useUpdateDailyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DailyTask> & { id: string }) => {
      const { error } = await supabase.from('daily_tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily_tasks'] }),
  });
}

export function useDeleteDailyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily_tasks'] }),
  });
}

// ========== PRESUPUESTOS DE OBRA ==========
export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, project:projects(id, name), opportunity:opportunities(id, client_name, description)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
  });
}

export function useOpportunityBudgets(opportunityId?: string) {
  return useQuery({
    queryKey: ['budgets', 'opportunity', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, project:projects(id, name), opportunity:opportunities(id, client_name, description)')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!opportunityId,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (budget: Partial<Budget>) => {
      const { data, error } = await supabase.from('budgets').insert({ ...budget, tenant_id: ECAR_TENANT_ID, created_by: budget.created_by || 'Colaborador' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Budget> & { id: string }) => {
      const { error } = await supabase.from('budgets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useBudgetSections(budgetId?: string) {
  return useQuery({
    queryKey: ['budget_sections', budgetId],
    queryFn: async () => {
      let q = supabase.from('budget_sections').select('*').order('sort_order');
      if (budgetId) q = q.eq('budget_id', budgetId);
      const { data, error } = await q;
      if (error) throw error;
      return data as BudgetSection[];
    },
    enabled: !!budgetId,
  });
}

export function useCreateBudgetSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (section: Partial<BudgetSection>) => {
      const { data, error } = await supabase.from('budget_sections').insert(section).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_sections'] }),
  });
}

export function useBudgetItems(budgetId?: string) {
  return useQuery({
    queryKey: ['budget_items', budgetId],
    queryFn: async () => {
      let q = supabase.from('budget_items').select('*, section:budget_sections(id, ordinal, name)').order('sort_order');
      if (budgetId) q = q.eq('budget_id', budgetId);
      const { data, error } = await q;
      if (error) throw error;
      return data as BudgetItem[];
    },
    enabled: !!budgetId,
  });
}

export function useCreateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<BudgetItem>) => {
      const { data, error } = await supabase.from('budget_items').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget_items'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget_items'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useBudgetResources() {
  return useQuery({
    queryKey: ['budget_resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_resources')
        .select('*')
        .eq('is_active', true)
        .order('resource_type')
        .order('name');
      if (error) throw error;
      return data as BudgetResource[];
    },
  });
}

export function useCreateBudgetResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resource: Partial<BudgetResource>) => {
      const { data, error } = await supabase.from('budget_resources').insert({ ...resource, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_resources'] }),
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetItem> & { id: string }) => {
      const { error } = await supabase.from('budget_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget_items'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudgetSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetSection> & { id: string }) => {
      const { error } = await supabase.from('budget_sections').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_sections'] }),
  });
}

export function useDeleteBudgetSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // First reassign items in this section to no section
      await supabase.from('budget_items').update({ section_id: null }).eq('section_id', id);
      const { error } = await supabase.from('budget_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget_sections'] });
      qc.invalidateQueries({ queryKey: ['budget_items'] });
    },
  });
}

export function useDuplicateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourceBudgetId: string) => {
      // 1. Fetch source budget
      const { data: source, error: e1 } = await supabase.from('budgets').select('*').eq('id', sourceBudgetId).single();
      if (e1 || !source) throw e1 || new Error('Budget not found');

      // 2. Count existing versions with same name or parent chain
      const { count } = await supabase.from('budgets').select('id', { count: 'exact', head: true })
        .or(`id.eq.${sourceBudgetId},parent_version_id.eq.${sourceBudgetId},parent_version_id.eq.${source.parent_version_id || sourceBudgetId}`);
      const nextVersion = (count || source.version) + 1;

      // 3. Create new budget
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = source;
      const { data: newBudget, error: e2 } = await supabase.from('budgets').insert({
        ...rest,
        version: nextVersion,
        status: 'draft',
        parent_version_id: sourceBudgetId,
        approved_by: null,
        approved_at: null,
      }).select().single();
      if (e2 || !newBudget) throw e2 || new Error('Failed to create budget');

      // 4. Duplicate sections
      const { data: srcSections } = await supabase.from('budget_sections').select('*').eq('budget_id', sourceBudgetId).order('sort_order');
      const sectionMap: Record<string, string> = {};
      if (srcSections) {
        for (const sec of srcSections) {
          const { id: _sid, created_at: _sca, budget_id: _sbid, ...secRest } = sec;
          const { data: newSec } = await supabase.from('budget_sections').insert({ ...secRest, budget_id: newBudget.id }).select().single();
          if (newSec) sectionMap[sec.id] = newSec.id;
        }
      }

      // 5. Duplicate items
      const { data: srcItems } = await supabase.from('budget_items').select('*').eq('budget_id', sourceBudgetId).order('sort_order');
      if (srcItems) {
        for (const item of srcItems) {
          const { id: _iid, created_at: _ica, budget_id: _ibid, ...itemRest } = item;
          await supabase.from('budget_items').insert({
            ...itemRest,
            budget_id: newBudget.id,
            section_id: item.section_id ? (sectionMap[item.section_id] || null) : null,
          });
        }
      }

      return newBudget;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget_sections'] });
      qc.invalidateQueries({ queryKey: ['budget_items'] });
    },
  });
}

export function useUpdateBudgetResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetResource> & { id: string }) => {
      const { error } = await supabase.from('budget_resources').update({ ...updates, last_price_update: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_resources'] }),
  });
}

export function useDeleteBudgetResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_resources').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_resources'] }),
  });
}

// ========== BUDGET FILES ==========
export function useBudgetFiles(budgetId?: string) {
  return useQuery({
    queryKey: ['budget_files', budgetId],
    queryFn: async () => {
      let q = supabase.from('budget_files').select('*').order('created_at', { ascending: false });
      if (budgetId) q = q.eq('budget_id', budgetId);
      const { data, error } = await q;
      if (error) throw error;
      return data as BudgetFile[];
    },
    enabled: !!budgetId,
  });
}

export function useUploadBudgetFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ budgetId, file, title, category }: { budgetId: string; file: File; title: string; category?: string }) => {
      // 1. Upload file to Storage (project-files)
      const filePath = `budgets/${budgetId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      // 2. Get signed/public URL (depends on if bucket is public, we assume signed if private)
      const { data: signedData, error: signedError } = await supabase.storage.from('project-files').createSignedUrl(filePath, 31536000); // 1 year
      const fileUrl = signedError ? supabase.storage.from('project-files').getPublicUrl(filePath).data.publicUrl : signedData.signedUrl;

      // 3. Create document record
      const { error: dbError } = await supabase.from('budget_files').insert({
        budget_id: budgetId,
        file_name: title,
        file_path: fileUrl, // we store the url in file_path
        file_type: category || 'General',
        file_size: file.size,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_files'] }),
  });
}

export function useDeleteBudgetFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // we could also delete from storage but usually we just delete the db record or mark inactive
      const { error } = await supabase.from('budget_files').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_files'] }),
  });
}

export function useCopyOpportunityFilesToBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, budgetId }: { opportunityId: string, budgetId: string }) => {
      // Fetch opportunity files
      const { data: oppFiles, error: fetchError } = await supabase
        .from('opportunity_files')
        .select('*')
        .eq('opportunity_id', opportunityId);
      
      if (fetchError) throw fetchError;
      if (!oppFiles || oppFiles.length === 0) return;

      // Prepare payload for budget files
      const payload = oppFiles.map(f => ({
        budget_id: budgetId,
        file_name: f.file_name,
        file_path: f.file_path, // Reuse existing URL
        file_type: 'Oportunidad (Adjunto original)',
        file_size: f.file_size
      }));

      const { error: insertError } = await supabase.from('budget_files').insert(payload);
      if (insertError) throw insertError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget_files'] }),
  });
}

// ========== BUDGET DICTIONARIES (autocomplete) ==========
export function useItemDictionary() {
  return useQuery({
    queryKey: ['budget_item_dictionary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_items')
        .select('description, unit, unit_price_ars, cost_type')
        .order('description');
      if (error) throw error;
      // Deduplicate by description (keep latest price)
      const map = new Map<string, { description: string; unit: string; unit_price_ars: number; cost_type: string }>();
      (data || []).forEach((item: any) => {
        if (item.description && !map.has(item.description)) {
          map.set(item.description, item);
        }
      });
      return Array.from(map.values());
    },
    staleTime: 60_000,
  });
}

export function useSectionDictionary() {
  return useQuery({
    queryKey: ['budget_section_dictionary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_sections')
        .select('name, ordinal')
        .order('name');
      if (error) throw error;
      // Deduplicate by name
      const map = new Map<string, { name: string; ordinal: string }>();
      (data || []).forEach((s: any) => {
        if (s.name && !map.has(s.name)) {
          map.set(s.name, s);
        }
      });
      return Array.from(map.values());
    },
    staleTime: 60_000,
  });
}

export function useFuelVehicles() {
  return useQuery({
    queryKey: ['fuel_vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fuel_vehicles').select('*').eq('status', 'active').order('code');
      if (error) throw error;
      return data as FuelVehicle[];
    },
  });
}

export function useCreateFuelVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Partial<FuelVehicle>) => {
      const { data, error } = await supabase.from('fuel_vehicles').insert({ ...vehicle, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel_vehicles'] }),
  });
}

export function useUpdateFuelVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FuelVehicle> & { id: string }) => {
      const { error } = await supabase.from('fuel_vehicles').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel_vehicles'] }),
  });
}

export function useDeleteFuelVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fuel_vehicles').update({ status: 'inactive' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel_vehicles'] }),
  });
}

export function useFuelLoads() {
  return useQuery({
    queryKey: ['fuel_loads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fuel_loads').select('*').order('load_date', { ascending: false }).limit(200);
      if (error) throw error;
      return data as FuelLoad[];
    },
  });
}

export function useCreateFuelLoad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (load: Partial<FuelLoad>) => {
      const { data, error } = await supabase.from('fuel_loads').insert({ ...load, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      
      if (load.vehicle_id) {
        const vehicleUpdates: Record<string, number> = {};
        if (load.odometer_km) vehicleUpdates.current_km = load.odometer_km;
        if (load.hourmeter) vehicleUpdates.current_hours = load.hourmeter;
        if (Object.keys(vehicleUpdates).length > 0) {
          await supabase.from('fuel_vehicles').update(vehicleUpdates).eq('id', load.vehicle_id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuel_loads'] });
      qc.invalidateQueries({ queryKey: ['fuel_vehicles'] });
    },
  });
}

export function useUpdateFuelLoad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FuelLoad> & { id: string }) => {
      const { error } = await supabase.from('fuel_loads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel_loads'] }),
  });
}

export function useFuelBatanMovements() {
  return useQuery({
    queryKey: ['fuel_batan_movements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fuel_batan_movements').select('*').order('movement_date', { ascending: false }).limit(100);
      if (error) throw error;
      return data as FuelBatanMovement[];
    },
  });
}

export function useCreateFuelBatanMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mov: Partial<FuelBatanMovement>) => {
      const { data, error } = await supabase.from('fuel_batan_movements').insert({ ...mov, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel_batan_movements'] }),
  });
}

export function useFuelReconciliation() {
  return useQuery({
    queryKey: ['fuel_reconciliation'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fuel_monthly_reconciliation').select('*').order('year', { ascending: false }).order('month', { ascending: false });
      if (error) throw error;
      return data as FuelMonthlyReconciliation[];
    },
  });
}

export function useUpdateFuelReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FuelMonthlyReconciliation> & { id: string }) => {
      const { error } = await supabase.from('fuel_monthly_reconciliation').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel_reconciliation'] }),
  });
}

// ========== VEHICLE DAILY REPORTS ==========
export function useVehicleDailyReports(vehicleId?: string) {
  return useQuery({
    queryKey: ['vehicle_daily_reports', vehicleId],
    queryFn: async () => {
      let q = supabase
        .from('vehicle_daily_reports')
        .select('*, vehicle:fuel_vehicles(id, code, description, plate, vehicle_type), project:projects(id, name)')
        .order('report_date', { ascending: false })
        .limit(100);
      if (vehicleId) q = q.eq('vehicle_id', vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      return data as VehicleDailyReport[];
    },
  });
}

export function useCreateVehicleDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Partial<VehicleDailyReport>) => {
      // 1. Insert the report
      const { data, error } = await supabase
        .from('vehicle_daily_reports')
        .insert({ ...report, tenant_id: ECAR_TENANT_ID })
        .select()
        .single();
      if (error) throw error;

      // 2. Update vehicle: km + condition
      if (report.vehicle_id) {
        const vehicleUpdates: Record<string, unknown> = {
          vehicle_condition: report.vehicle_condition_after || 'operativo',
        };
        if (report.odometer_km) {
          vehicleUpdates.current_km = report.odometer_km;
        }
        // 3. If damage â†’ set maintenance
        if (report.has_damage && report.damage_description) {
          const today = new Date().toISOString().slice(0, 10);
          vehicleUpdates.next_maintenance_date = today;
          vehicleUpdates.maintenance_notes = `[REPORTE] ${report.damage_description.substring(0, 200)}`;
        }
        await supabase.from('fuel_vehicles').update(vehicleUpdates).eq('id', report.vehicle_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle_daily_reports'] });
      qc.invalidateQueries({ queryKey: ['fuel_vehicles'] });
    },
  });
}

// ========== PROJECT HUB: FILTERED HOOKS ==========

export function useProjectEmployees(projectId?: string) {
  return useQuery({
    queryKey: ['project_employees', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, category:union_categories(id, name, daily_rate_ars)')
        .eq('current_project_id', projectId!)
        .eq('employment_status', 'active')
        .order('full_name');
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!projectId,
  });
}

export function useProjectInventoryMovements(projectId?: string) {
  return useQuery({
    queryKey: ['project_inventory_movements', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, item:inventory_items(id, name, unit, category)')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as InventoryMovement[];
    },
    enabled: !!projectId,
  });
}

export function useProjectToolAssignments(projectId?: string) {
  return useQuery({
    queryKey: ['project_tool_assignments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_assignments')
        .select('*, item:inventory_items(id, name), employee:employees(id, full_name)')
        .eq('project_id', projectId!)
        .order('assigned_date', { ascending: false });
      if (error) throw error;
      return data as ToolAssignment[];
    },
    enabled: !!projectId,
  });
}

export function useProjectFuelLoads(projectId?: string) {
  return useQuery({
    queryKey: ['project_fuel_loads', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_loads')
        .select('*')
        .eq('project_id', projectId!)
        .order('load_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as FuelLoad[];
    },
    enabled: !!projectId,
  });
}

export function useProjectPurchaseRequests(projectId?: string) {
  return useQuery({
    queryKey: ['project_purchase_requests', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*, items:purchase_request_items(*)')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseRequest[];
    },
    enabled: !!projectId,
  });
}

export function useProjectBudgets(projectId?: string) {
  return useQuery({
    queryKey: ['project_budgets', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId!)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!projectId,
  });
}

// ========== PIPELINE DE OPORTUNIDADES ==========
export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, project:projects(id, name), files:opportunity_files(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Opportunity[];
    },
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opp: Partial<Opportunity>) => {
      const { data, error } = await supabase.from('opportunities').insert({ ...opp, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Opportunity> & { id: string }) => {
      const { error } = await supabase.from('opportunities').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  });
}

export function useDeleteOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Eliminar archivos asociados en la base de datos para evitar FK conflict
      await supabase.from('opportunity_files').delete().eq('opportunity_id', id);
      
      // 2. Desvincular presupuestos asociados (setear a null)
      await supabase.from('budgets').update({ opportunity_id: null }).eq('opportunity_id', id);

      // 3. Eliminar la oportunidad
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  });
}

export function useUploadOpportunityFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, file, title, category, observations, uploadedBy }: { opportunityId: string; file: File; title: string; category: string; observations: string; uploadedBy: string }) => {
      // 1. Upload to storage
      const ext = file.name.split('.').pop() || '';
      const filePath = `${opportunityId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('opportunity-files').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage.from('opportunity-files').getPublicUrl(filePath);
      const fileUrl = publicUrlData.publicUrl;

      // 3. Create DB record
      const { error: dbError } = await supabase.from('opportunity_files').insert({
        tenant_id: ECAR_TENANT_ID,
        opportunity_id: opportunityId,
        title,
        category,
        file_url: fileUrl,
        file_type: ext.toLowerCase(),
        file_size: file.size,
        observations,
        uploaded_by: uploadedBy
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  });
}

export function useDeleteOpportunityFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunity_files').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  });
}

// ========== Ã“RDENES DE COMPRA ==========
export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, project:projects(id, name), supplier:suppliers(id, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (po: Partial<PurchaseOrder>) => {
      const { data, error } = await supabase.from('purchase_orders').insert({ ...po, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrder> & { id: string }) => {
      const { error } = await supabase.from('purchase_orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  });
}

// ========== NO CONFORMIDADES ==========
export function useNonConformities() {
  return useQuery({
    queryKey: ['nonconformities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nonconformities')
        .select('*, project:projects(id, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NonConformity[];
    },
  });
}

export function useCreateNonConformity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nc: Partial<NonConformity>) => {
      const { data, error } = await supabase.from('nonconformities').insert({ ...nc, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nonconformities'] }),
  });
}

export function useUpdateNonConformity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NonConformity> & { id: string }) => {
      const { error } = await supabase.from('nonconformities').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nonconformities'] }),
  });
}

// ========== CAMBIOS DE ALCANCE Y ADICIONALES ==========
export function useScopeChanges(projectId?: string) {
  return useQuery({
    queryKey: ['scope_changes', projectId],
    queryFn: async () => {
      let q = supabase.from('scope_changes').select('*, project:projects(id, name)').order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ScopeChange[];
    },
  });
}

export function useCreateScopeChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sc: Partial<ScopeChange>) => {
      const { data, error } = await supabase.from('scope_changes').insert({ ...sc, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scope_changes'] }),
  });
}

export function useUpdateScopeChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScopeChange> & { id: string }) => {
      const { error } = await supabase.from('scope_changes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scope_changes'] }),
  });
}

// ========== SUPPLIER EVALUATION ==========
export function useSupplierEvaluations() {
  return useQuery({
    queryKey: ['supplier_evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_evaluations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupplierEvaluation[];
    },
  });
}

export function useCreateSupplierEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ev: Partial<SupplierEvaluation>) => {
      const { data, error } = await supabase.from('supplier_evaluations').insert({ ...ev, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier_evaluations'] }),
  });
}

/* â”€â”€ WhatsApp Conversations (CRM) â”€â”€ */
export function useWhatsappConversations() {
  return useQuery({
    queryKey: ['whatsapp_conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as { id: string; phone: string; messages: { role: string; content: string; timestamp?: string }[]; last_intent: string | null; pending_data: any; updated_at: string; created_at: string }[];
    },
    refetchInterval: 15000, // Auto-refresh every 15s
  });
}



// â”€â”€â”€ Weekly Payments â”€â”€â”€
export function useWeeklyPayments() {
  return useQuery({
    queryKey: ['weekly_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWeeklyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { payment_date: string; responsible: string; notes?: string }) => {
      const { data, error } = await supabase.from('weekly_payments').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_payments'] }),
  });
}

export function useUpdateWeeklyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('weekly_payments').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_payments'] }),
  });
}

export function useDeleteWeeklyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekly_payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_payments'] }),
  });
}

export function useWeeklyPaymentItems(paymentId: string | null) {
  return useQuery({
    queryKey: ['weekly_payment_items', paymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_payment_items')
        .select('*')
        .eq('payment_id', paymentId!)
        .order('orden', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!paymentId,
  });
}

export function useCreateWeeklyPaymentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.from('weekly_payment_items').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['weekly_payment_items', v.payment_id] }),
  });
}

export function useUpdateWeeklyPaymentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; payment_id: string; [key: string]: any }) => {
      const { error } = await supabase.from('weekly_payment_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['weekly_payment_items', v.payment_id] }),
  });
}

export function useDeleteWeeklyPaymentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payment_id: _payment_id }: { id: string; payment_id: string }) => {
      const { error } = await supabase.from('weekly_payment_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v: any) => qc.invalidateQueries({ queryKey: ['weekly_payment_items', v.payment_id] }),
  });
}

// ─── All Worker Payment Items (for metrics) ───
export function useAllWorkerPaymentItems() {
  return useQuery({
    queryKey: ['worker_payment_items_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_payment_items')
        .select('*, payment:weekly_payments(payment_date)')
        .eq('source_type', 'sueldos_obreros')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string; concepto: string; monto: number; alias_cbu: string;
        titular_cuenta: string; observaciones: string; pagado: boolean;
        created_at: string; payment: { payment_date: string } | null;
      }>;
    },
  });
}

// ─── Weekly Payroll Details ───
export function useWeeklyPayrollDetails(weeklyPaymentItemId: string | null) {
  return useQuery({
    queryKey: ['weekly_payroll_details', weeklyPaymentItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_payroll_details')
        .select('*, employee:employees(*)')
        .eq('weekly_payment_item_id', weeklyPaymentItemId!);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!weeklyPaymentItemId,
  });
}

export function useCreateWeeklyPayrollDetail() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.from('weekly_payroll_details').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateWeeklyPayrollDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('weekly_payroll_details').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v: any) => {
      if (v.weekly_payment_item_id) {
        qc.invalidateQueries({ queryKey: ['weekly_payroll_details', v.weekly_payment_item_id] });
      }
    },
  });
}

export function useDeleteWeeklyPayrollDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekly_payroll_details').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v: any) => {
      if (v.weekly_payment_item_id) {
        qc.invalidateQueries({ queryKey: ['weekly_payroll_details', v.weekly_payment_item_id] });
      }
    },
  });
}

// ========== LOGISTICS MODULE ==========

// ========== AUDIT LOGS ==========
export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateAuditLog() {
  return useMutation({
    mutationFn: async (payload: { user_id: string; user_name: string; action_type: string; module: string; duration_seconds?: number; details?: any }) => {
      const { error } = await supabase.from('audit_logs').insert({ ...payload, tenant_id: ECAR_TENANT_ID });
      if (error) console.error('Audit log failed:', error);
    }
  });
}



// ========== LOGISTICS MODULE ==========

export function useAllFuelVehicles() {
  return useQuery({
    queryKey: ['all_fuel_vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fuel_vehicles').select('*').order('code');
      if (error) throw error;
      return data as FuelVehicle[];
    },
  });
}

export function useLogisticsDeliveries() {
  return useQuery({
    queryKey: ['logistics_deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_deliveries')
        .select('*, project:projects(id, name), vehicle:fuel_vehicles(id, code, description, plate), items:logistics_delivery_items(*)')
        .order('delivery_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as LogisticsDelivery[];
    },
  });
}

export function useCreateLogisticsDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ...delivery }: Partial<LogisticsDelivery> & { items?: Partial<LogisticsDeliveryItem>[] }) => {
      const { data, error } = await supabase
        .from('logistics_deliveries')
        .insert({ ...delivery, tenant_id: ECAR_TENANT_ID })
        .select()
        .single();
      if (error) throw error;
      if (items?.length) {
        const { error: itemErr } = await supabase
          .from('logistics_delivery_items')
          .insert(items.map(i => ({ ...i, delivery_id: data.id })));
        if (itemErr) throw itemErr;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistics_deliveries'] }),
  });
}

export function useUpdateLogisticsDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LogisticsDelivery> & { id: string }) => {
      const { error } = await supabase.from('logistics_deliveries').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistics_deliveries'] }),
  });
}

export function useDeleteLogisticsDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('logistics_deliveries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistics_deliveries'] }),
  });
}

export function useLogisticsMaintenanceLog() {
  return useQuery({
    queryKey: ['logistics_maintenance_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_maintenance_log')
        .select('*, vehicle:fuel_vehicles(id, code, description, plate)')
        .order('date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as LogisticsMaintenanceLog[];
    },
  });
}

export function useCreateLogisticsMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<LogisticsMaintenanceLog>) => {
      const { data, error } = await supabase
        .from('logistics_maintenance_log')
        .insert({ ...log, tenant_id: ECAR_TENANT_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistics_maintenance_log'] }),
  });
}

export function useUpdateLogisticsMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LogisticsMaintenanceLog> & { id: string }) => {
      const { error } = await supabase.from('logistics_maintenance_log').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistics_maintenance_log'] }),
  });
}

export function useAITokenUsage() {
  return useQuery({
    queryKey: ['ai_token_usage'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_token_usage').select('total_tokens, prompt_tokens, completion_tokens');
      if (error) throw error;
      const total = data?.reduce((acc, curr) => acc + curr.total_tokens, 0) || 0;
      const prompt = data?.reduce((acc, curr) => acc + curr.prompt_tokens, 0) || 0;
      const completion = data?.reduce((acc, curr) => acc + curr.completion_tokens, 0) || 0;
      const costUsd = (prompt / 1000000) * 0.15 + (completion / 1000000) * 0.60;
      return { total, prompt, completion, costUsd };
    },
    refetchInterval: 30000
  });
}

// ── Fleet Maintenance & Tires ──

export function useFleetMaintenanceOrders() {
  return useQuery({
    queryKey: ['fleet_maintenance_orders', ECAR_TENANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fleet_maintenance_orders')
        .select('*, vehicle:fuel_vehicles(*)')
        .eq('tenant_id', ECAR_TENANT_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FleetMaintenanceOrder[];
    },
  });
}

export function useCreateFleetMaintenanceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FleetMaintenanceOrder>) => {
      const { data, error } = await supabase.from('fleet_maintenance_orders').insert([{ ...payload, tenant_id: payload.tenant_id || ECAR_TENANT_ID }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['fleet_maintenance_orders', data.tenant_id] }),
  });
}

export function useUpdateFleetMaintenanceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<FleetMaintenanceOrder> & { id: string }) => {
      const { data, error } = await supabase.from('fleet_maintenance_orders').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['fleet_maintenance_orders', data.tenant_id] }),
  });
}

export function useFleetTires() {
  return useQuery({
    queryKey: ['fleet_tires', ECAR_TENANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fleet_tires')
        .select('*, vehicle:fuel_vehicles(*)')
        .eq('tenant_id', ECAR_TENANT_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FleetTire[];
    },
  });
}

export function useCreateFleetTire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FleetTire>) => {
      const { data, error } = await supabase.from('fleet_tires').insert([{ ...payload, tenant_id: payload.tenant_id || ECAR_TENANT_ID }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['fleet_tires', data.tenant_id] }),
  });
}

export function useUpdateFleetTire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<FleetTire> & { id: string }) => {
      const { data, error } = await supabase.from('fleet_tires').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['fleet_tires', data.tenant_id] }),
  });
}


// ========== QUALITY ==========

export function useQualityChecklists(projectId?: string) {
  return useQuery({
    queryKey: ['quality_checklists', projectId],
    queryFn: async () => {
      let q = supabase.from('quality_checklists').select('*, project:projects(name), work_order:work_orders(id, code)');
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data as QualityChecklist[];
    },
  });
}

export function useCreateQualityChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<QualityChecklist>) => {
      const { data, error } = await supabase.from('quality_checklists').insert({ ...payload, tenant_id: ECAR_TENANT_ID }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quality_checklists'] }),
  });
}

export function useUpdateQualityChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QualityChecklist> & { id: string }) => {
      const { error } = await supabase.from('quality_checklists').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quality_checklists'] }),
  });
}
