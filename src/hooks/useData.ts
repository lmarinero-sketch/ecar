import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import type {
  Employee, Project, UnionCategory, Shift, AttendanceRecord,
  Obligation, Invoice, Supplier, PurchaseInvoice, Cheque,
  PayrollPeriod, FixedExpense, EmployeeDocument, LetterTemplate,
  WbsElement, DocumentRequest, Profile,
  NotificationContact, NotificationReminder, NotificationLog
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

