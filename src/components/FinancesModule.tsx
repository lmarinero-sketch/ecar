import { createPortal } from 'react-dom';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark, TrendingUp, X, Camera, Edit3, Plus,
  Upload, FileText, Trash2, History, Pencil, CheckCircle2, Search,
  CheckCircle, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, CheckCheck, Undo2,
  FileSpreadsheet, RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCheques, useCreateCheque, useUpdateCheque, useDeleteCheque, useCreateChequeAuditLog, useChequeAuditLog, useFixedExpenses, usePaymentRecords, useCreatePaymentRecord, useBankAccounts, useInvoices, usePurchaseInvoices } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { InvoiceSearchSelector } from './InvoiceSearchSelector';
import { ChequeUploader } from './ChequeUploader';
import { ImageViewer } from './ImageViewer';
import { BcraCreditInfo } from './BcraCreditInfo';
import { supabase } from '../lib/supabase';
import { useModalStore } from '../store/useModalStore';
import type { Cheque } from '../lib/types';
import { useImplementationStore } from '../store/useImplementationStore';

export const FinancesModule: React.FC = () => {
  const { profile, hasPermission } = useAuth();
  const canWrite = hasPermission('finances', 'write');
  const canDelete = hasPermission('finances', 'delete');

  useEffect(() => {
    useImplementationStore.getState().completeItem('e2-1');
  }, []);
  const { data: cheques = [], isLoading } = useCheques();
  const { data: expenses = [] } = useFixedExpenses();
  const createCheque = useCreateCheque();
  const updateCheque = useUpdateCheque();
  const deleteCheque = useDeleteCheque();
  const auditLog = useCreateChequeAuditLog();

  const { data: invoices = [] } = useInvoices();
  const { data: purchaseInvoices = [] } = usePurchaseInvoices();

  // Edit/Delete state
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [auditChequeId, setAuditChequeId] = useState<string | null>(null);

  const handleDeleteCheque = async (ch: Cheque) => {
    if (!canDelete) return;
    const confirmed = await useModalStore.getState().showConfirm(
      'Eliminar Cheque',
      `¿Estás seguro de eliminar el cheque #${ch.cheque_number} de "${ch.bank_name}" por ${formatARS(ch.amount_ars)}? Esta acción quedará registrada en el historial de auditoría.`
    );
    if (!confirmed) return;

    try {
      await auditLog.mutateAsync({
        cheque_id: ch.id,
        action: 'deleted',
        user_id: profile?.id || null,
        user_name: profile?.full_name || 'Sistema',
        snapshot: ch as any,
      });
      await deleteCheque.mutateAsync(ch.id);
      useModalStore.getState().showAlert('Cheque Eliminado', `El cheque #${ch.cheque_number} fue eliminado con éxito.`);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message || 'Error al eliminar');
    }
  };
  
  // Filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [searchCheque, setSearchCheque] = useState<string>('');
  const [filterBeneficiary, setFilterBeneficiary] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [chequeViewMode, setChequeViewMode] = useState<'all' | 'payable' | 'receivable' | 'paid' | 'pending'>('all');
  
  const { data: paymentRecords = [], isLoading: isLoadingPayments } = usePaymentRecords();
  const createPaymentRecord = useCreatePaymentRecord();
  const { data: bankAccounts = [] } = useBankAccounts();

  const [activeTab, setActiveTab] = useState<'cheques' | 'receipts' | 'bcra'>('cheques');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount_ars: 0,
    payment_method: 'transfer',
    bank_name: '',
    check_number: '',
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const [mode, setMode] = useState<'idle' | 'scan' | 'form'>('idle');
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState('');
  const [form, setForm] = useState({
    cheque_number: '', bank_name: '', type: 'physical' as 'physical' | 'echeq',
    direction: 'receivable' as 'receivable' | 'payable', beneficiary_or_issuer: '',
    issuer_company: 'ECAR SAS', amount_ars: 0, due_date: '', issue_date: '', scan_url: '',
    linked_invoice_id: null as string | null,
    linked_purchase_invoice_id: null as string | null,
  });

  const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  // Argentine holidays 2026 (national)
  const FERIADOS_2026 = [
    '2026-01-01','2026-02-16','2026-02-17','2026-03-24','2026-04-02','2026-04-03','2026-04-04',
    '2026-05-01','2026-05-25','2026-06-15','2026-06-20','2026-07-09','2026-08-17','2026-10-12',
    '2026-11-20','2026-11-23','2026-12-08','2026-12-25',
  ];

  const getNextBusinessDay = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    let d = new Date(dateStr + 'T12:00:00');
    let iso = d.toISOString().split('T')[0];
    while (d.getDay() === 0 || d.getDay() === 6 || FERIADOS_2026.includes(iso)) {
      d.setDate(d.getDate() + 1);
      iso = d.toISOString().split('T')[0];
    }
    return iso;
  };

  const isPostponed = (original: string | null): boolean => {
    if (!original) return false;
    return getNextBusinessDay(original) !== original;
  };

  // --- CHEQUE METRICS & SEGMENTATION ---
  const isDateInFilter = (dateStr: string | null, filter: string, customStart: string, customEnd: string) => {
    if (!filter) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    if (filter === 'today') {
      return d.toDateString() === today.toDateString();
    }
    if (filter === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return d >= start && d <= end;
    }
    if (filter === 'month') {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
    if (filter === 'last_month') {
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }
    if (filter === 'next_month') {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      return d.getMonth() === nextMonth.getMonth() && d.getFullYear() === nextMonth.getFullYear();
    }
    if (filter === 'custom') {
      if (customStart && d < new Date(customStart + 'T12:00:00')) return false;
      if (customEnd && d > new Date(customEnd + 'T12:00:00')) return false;
      return true;
    }
    return true;
  };

  const paidPayable = useMemo(() => cheques.filter(c => c.direction === 'payable' && c.status === 'cashed' && isDateInFilter(c.due_date || c.issue_date, filterDate, customStart, customEnd)), [cheques, filterDate, customStart, customEnd]);
  const paidReceivable = useMemo(() => cheques.filter(c => c.direction === 'receivable' && (c.status === 'deposited' || c.status === 'cashed') && isDateInFilter(c.due_date || c.issue_date, filterDate, customStart, customEnd)), [cheques, filterDate, customStart, customEnd]);
  const pendingPayable = useMemo(() => cheques.filter(c => c.direction === 'payable' && c.status === 'pending' && isDateInFilter(c.due_date || c.issue_date, filterDate, customStart, customEnd)), [cheques, filterDate, customStart, customEnd]);
  const pendingReceivable = useMemo(() => cheques.filter(c => c.direction === 'receivable' && c.status === 'pending' && isDateInFilter(c.due_date || c.issue_date, filterDate, customStart, customEnd)), [cheques, filterDate, customStart, customEnd]);
  const allPaidCheques = useMemo(() => cheques.filter(c => (c.status === 'cashed' || c.status === 'deposited') && isDateInFilter(c.due_date || c.issue_date, filterDate, customStart, customEnd)), [cheques, filterDate, customStart, customEnd]);
  const allPendingCheques = useMemo(() => cheques.filter(c => c.status === 'pending' && isDateInFilter(c.due_date || c.issue_date, filterDate, customStart, customEnd)), [cheques, filterDate, customStart, customEnd]);

  const totalPaidPayable = paidPayable.reduce((a, c) => a + c.amount_ars, 0);
  const totalPaidReceivable = paidReceivable.reduce((a, c) => a + c.amount_ars, 0);
  const totalPendingPayable = pendingPayable.reduce((a, c) => a + c.amount_ars, 0);
  const totalPendingReceivable = pendingReceivable.reduce((a, c) => a + c.amount_ars, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const paidPayableThisMonth = useMemo(() => {
    return paidPayable.filter(c => {
      const dStr = c.due_date || c.issue_date;
      if (!dStr) return false;
      const d = new Date(dStr + 'T12:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [paidPayable, currentMonth, currentYear]);

  const totalPaidPayableThisMonth = paidPayableThisMonth.reduce((a, c) => a + c.amount_ars, 0);

  const paidReceivableThisMonth = useMemo(() => {
    return paidReceivable.filter(c => {
      const dStr = c.due_date || c.issue_date;
      if (!dStr) return false;
      const d = new Date(dStr + 'T12:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [paidReceivable, currentMonth, currentYear]);

  const totalPaidReceivableThisMonth = paidReceivableThisMonth.reduce((a, c) => a + c.amount_ars, 0);

  const payableThisMonth = useMemo(() => {
    return pendingPayable.filter(c => {
      const dStr = c.due_date || c.issue_date;
      if (!dStr) return false;
      const d = new Date(dStr + 'T12:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [pendingPayable, currentMonth, currentYear]);

  const totalPayableThisMonth = payableThisMonth.reduce((a, c) => a + c.amount_ars, 0);
  const totalFixed = expenses.filter(e => e.status === 'active').reduce((a, e) => a + e.estimated_amount_ars, 0);

  // List of unique beneficiaries with count
  const uniqueBeneficiaries = useMemo(() => {
    const map = new Map<string, number>();
    cheques.forEach(c => {
      const name = c.beneficiary_or_issuer?.trim();
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [cheques]);

  // Overdue count check
  const overduePendingCheques = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return cheques.filter(c => {
      const d = c.due_date || c.issue_date;
      return d && d < todayStr && c.status === 'pending';
    });
  }, [cheques]);

  const filteredCheques = useMemo(() => {
    return cheques.filter(ch => {
      // Free text search
      if (searchCheque.trim() !== '') {
        const search = searchCheque.toLowerCase().trim();
        const fieldsToSearch = [
          ch.cheque_number,
          ch.bank_name,
          ch.beneficiary_or_issuer,
          ch.issuer_company,
          ch.amount_ars?.toString(),
        ].filter(Boolean).map(s => String(s).toLowerCase());
        
        const matchesSearch = fieldsToSearch.some(f => f.includes(search));
        if (!matchesSearch) return false;
      }

      // Filter by Quick View mode tab
      if (chequeViewMode === 'payable' && ch.direction !== 'payable') return false;
      if (chequeViewMode === 'receivable' && ch.direction !== 'receivable') return false;
      if (chequeViewMode === 'paid' && ch.status !== 'cashed' && ch.status !== 'deposited') return false;
      if (chequeViewMode === 'pending' && ch.status !== 'pending') return false;

      // Filter by Direction
      if (filterDirection !== 'all' && ch.direction !== filterDirection) return false;

      // Filter by Status
      if (filterStatus === 'paid' && ch.status !== 'cashed' && ch.status !== 'deposited') return false;
      if (filterStatus === 'pending' && ch.status !== 'pending') return false;
      if (filterStatus === 'bounced' && ch.status !== 'bounced') return false;
      if (filterStatus === 'cancelled' && ch.status !== 'cancelled') return false;

      // Filter by Beneficiary
      if (filterBeneficiary.trim() !== '') {
        const b = (ch.beneficiary_or_issuer || '').toLowerCase();
        if (!b.includes(filterBeneficiary.toLowerCase().trim())) return false;
      }

      // Filter by Type
      if (filterType !== 'all' && ch.type !== filterType) return false;

      // Filter by Date
      if (!isDateInFilter(ch.due_date || ch.issue_date, filterDate, customStart, customEnd)) return false;

      return true;
    });
  }, [cheques, searchCheque, chequeViewMode, filterDirection, filterStatus, filterBeneficiary, filterType, filterDate, customStart, customEnd]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredCheques.length === 0) {
      useModalStore.getState().showAlert('Atención', 'No hay cheques para exportar con los filtros seleccionados.');
      return;
    }
    const data = filteredCheques.map(ch => ({
      'Nro Cheque': ch.cheque_number,
      'Banco': ch.bank_name,
      'Dirección': ch.direction === 'payable' ? 'A Pagar (Emitido)' : 'A Cobrar (Recibido)',
      'Tipo': ch.type === 'echeq' ? 'eCheq' : 'Físico',
      'Beneficiario / Emisor': ch.beneficiary_or_issuer || 'Sin especificar',
      'Razón Social Emisora': ch.issuer_company || '-',
      'Monto ($)': ch.amount_ars,
      'Fecha Emisión': ch.issue_date || '-',
      'Fecha Vencimiento': ch.due_date || '-',
      'Estado': ch.status === 'cashed' ? (ch.direction === 'payable' ? 'PAGADO (Debitado)' : 'COBRADO') : ch.status === 'deposited' ? 'DEPOSITADO / COBRADO' : ch.status === 'pending' ? 'PENDIENTE' : ch.status === 'bounced' ? 'RECHAZADO' : 'ANULADO',
      'Factura Asociada': ch.linked_purchase_invoice_id ? 'Factura Compra' : ch.linked_invoice_id ? 'Factura Venta' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cartera_Cheques");
    XLSX.writeFile(wb, `Cartera_Cheques_ECAR_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Batch update overdue cheques to paid
  const handleMarkAllOverdueAsPaid = async () => {
    if (!canWrite) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const overduePending = cheques.filter(ch => {
      const d = ch.due_date || ch.issue_date;
      return d && d < todayStr && ch.status === 'pending';
    });

    if (overduePending.length === 0) {
      useModalStore.getState().showAlert('Cheques al Día', 'Todos los cheques vencidos a la fecha ya están marcados como pagados/cobrados.');
      return;
    }

    const confirm = await useModalStore.getState().showConfirm(
      'Actualizar Cheques Vencidos a Pagados',
      `Se encontraron ${overduePending.length} cheque(s) con fecha de vencimiento anterior a hoy en estado pendiente.\n\n¿Deseas marcarlos a todos como PAGADOS (Emitidos) / DEPOSITADOS (Recibidos)?`
    );
    if (!confirm) return;

    try {
      for (const ch of overduePending) {
        const nextStatus = ch.direction === 'payable' ? 'cashed' : 'deposited';
        await updateCheque.mutateAsync({ id: ch.id, status: nextStatus });
        auditLog.mutate({
          cheque_id: ch.id,
          action: 'status_changed',
          user_id: profile?.id || null,
          user_name: profile?.full_name || 'Sistema',
          changes: { status: { old: ch.status, new: nextStatus } },
          snapshot: { ...ch, status: nextStatus },
        });
      }
      useModalStore.getState().showAlert(
        'Actualización Exitosa',
        `Se actualizaron ${overduePending.length} cheques vencidos a estado Pagado/Cobrado.`
      );
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'Error al actualizar cheques.');
    }
  };

  // Revert status to pending
  const handleRevertToPending = async (ch: Cheque) => {
    if (!canWrite) return;
    const confirm = await useModalStore.getState().showConfirm(
      'Revertir Estado',
      `¿Deseas volver a marcar el cheque #${ch.cheque_number} como PENDIENTE?`
    );
    if (!confirm) return;
    try {
      await updateCheque.mutateAsync({ id: ch.id, status: 'pending' });
      auditLog.mutate({
        cheque_id: ch.id,
        action: 'status_changed',
        user_id: profile?.id || null,
        user_name: profile?.full_name || 'Sistema',
        changes: { status: { old: ch.status, new: 'pending' } },
        snapshot: { ...ch, status: 'pending' },
      });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'Error al revertir estado');
    }
  };

  const handleResetFilters = () => {
    setSearchCheque('');
    setFilterBeneficiary('');
    setFilterStatus('all');
    setFilterDirection('all');
    setFilterType('all');
    setFilterDate('');
    setCustomStart('');
    setCustomEnd('');
    setChequeViewMode('all');
  };

  const [ocrData, setOcrData] = useState<any | null>(null);

  const handleScanComplete = (data: any, url: string) => {
    setScanUrl(url);
    setOcrData(data);
    setForm({
      cheque_number: data.cheque_number || '',
      bank_name: data.bank_name || '',
      type: data.type === 'echeq' ? 'echeq' : 'physical',
      direction: data.direction || 'receivable',
      beneficiary_or_issuer: data.direction === 'payable' ? (data.beneficiary || data.issuer_name || '') : (data.issuer_name || ''),
      issuer_company: 'ECAR SAS',
      amount_ars: data.amount || 0,
      due_date: data.due_date || data.issue_date || '',
      issue_date: data.issue_date || '',
      scan_url: url,
      linked_invoice_id: null,
      linked_purchase_invoice_id: null,
    });
    setMode('form');
  };

  const handleCreate = async () => {
    try {
      const isDuplicate = cheques.find(c => 
        c.cheque_number === form.cheque_number && 
        c.bank_name === form.bank_name && 
        c.due_date === form.due_date
      );
      if (isDuplicate) {
        if (!(await useModalStore.getState().showConfirm('Duplicado Detectado', `Posible cheque duplicado detectado (Nro ${form.cheque_number}, Banco ${form.bank_name}, Vto ${form.due_date}). ¿Desea cargarlo de todas formas?`))) {
          return;
        }
      }

      const result = await createCheque.mutateAsync({ 
        ...form, 
        issuer_company: form.direction === 'payable' ? form.issuer_company : null,
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        scan_url: scanUrl || undefined,
        linked_invoice_id: form.direction === 'receivable' ? form.linked_invoice_id : null,
        linked_purchase_invoice_id: form.direction === 'payable' ? form.linked_purchase_invoice_id : null
      } as any);
      // Audit: created
      auditLog.mutate({
        cheque_id: (result as any)?.id || null,
        action: 'created',
        user_id: profile?.id || null,
        user_name: profile?.full_name || 'Sistema',
        snapshot: { ...form, scan_url: scanUrl },
      });

      // Complete checklist items
      if (scanUrl || form.scan_url) {
        useImplementationStore.getState().completeItem('e2-3');
      } else {
        useImplementationStore.getState().completeItem('e2-2');
      }
      useImplementationStore.getState().completeItem('c2-1');

      setMode('idle');
      setOcrData(null);
      setScanUrl('');
      setForm({ cheque_number: '', bank_name: '', type: 'physical', direction: 'receivable', beneficiary_or_issuer: '', issuer_company: 'ECAR SAS', amount_ars: 0, due_date: '', issue_date: '', scan_url: '', linked_invoice_id: null, linked_purchase_invoice_id: null });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message || 'Error al registrar el cheque');
    }
  };

  const handleEdit = (ch: Cheque) => {
    setEditingCheque(ch);
    setEditForm({
      cheque_number: ch.cheque_number,
      bank_name: ch.bank_name,
      type: ch.type,
      direction: ch.direction,
      beneficiary_or_issuer: ch.beneficiary_or_issuer || '',
      issuer_company: ch.issuer_company || 'ECAR SAS',
      amount_ars: ch.amount_ars,
      due_date: ch.due_date || '',
      issue_date: ch.issue_date || '',
      status: ch.status,
      linked_invoice_id: ch.linked_invoice_id || null,
      linked_purchase_invoice_id: ch.linked_purchase_invoice_id || null,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCheque) return;
    try {
      // Calculate changes for audit
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      const fields = ['cheque_number','bank_name','type','direction','beneficiary_or_issuer','issuer_company','amount_ars','due_date','issue_date','status','linked_invoice_id','linked_purchase_invoice_id'] as const;
      for (const f of fields) {
        const oldVal = (editingCheque as any)[f];
        const newVal = (editForm as any)[f];
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          changes[f] = { old: oldVal, new: newVal };
        }
      }
      await updateCheque.mutateAsync({ 
        id: editingCheque.id, 
        ...editForm,
        issuer_company: editForm.direction === 'payable' ? editForm.issuer_company : null,
        issue_date: editForm.issue_date || null,
        due_date: editForm.due_date || null,
        linked_invoice_id: editForm.direction === 'receivable' ? editForm.linked_invoice_id : null,
        linked_purchase_invoice_id: editForm.direction === 'payable' ? editForm.linked_purchase_invoice_id : null
      });
      // Audit: updated
      const statusChanged = Object.keys(changes).includes('status');
      auditLog.mutate({
        cheque_id: editingCheque.id,
        action: statusChanged ? 'status_changed' : 'updated',
        user_id: profile?.id || null,
        user_name: profile?.full_name || 'Sistema',
        changes,
        snapshot: { ...editingCheque, ...editForm },
      });

      if (statusChanged) {
        useImplementationStore.getState().completeItem('e2-4');
        useImplementationStore.getState().completeItem('c2-2');
      }

      setEditingCheque(null);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message || 'Error al actualizar');
    }
  };

  const handleQuickStatus = async (ch: Cheque, newStatus: "pending" | "cancelled" | "deposited" | "cashed" | "bounced") => {
    if (!canWrite) return;
    try {
      await updateCheque.mutateAsync({ id: ch.id, status: newStatus });
      auditLog.mutate({
        cheque_id: ch.id,
        action: 'status_changed',
        user_id: profile?.id || null,
        user_name: profile?.full_name || 'Sistema',
        changes: { status: { old: ch.status, new: newStatus } },
        snapshot: { ...ch, status: newStatus },
      });
      useImplementationStore.getState().completeItem('e2-4');
      useImplementationStore.getState().completeItem('c2-2');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message || 'Error al actualizar estado');
    }
  };

  const handleCancelForm = () => {
    setMode('idle');
    setOcrData(null);
    setScanUrl('');
    setForm({ cheque_number: '', bank_name: '', type: 'physical', direction: 'receivable', beneficiary_or_issuer: '', issuer_company: 'ECAR SAS', amount_ars: 0, due_date: '', issue_date: '', scan_url: '', linked_invoice_id: null, linked_purchase_invoice_id: null });
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando finanzas...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="clinical-module-header">
        <div className="absolute top-0 right-0 p-6 opacity-5 text-ecar-blue"><Landmark size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-gray-900"><Landmark size={24} className="text-ecar-blue" /> Gerencia de Administración y Finanzas</h3>
          <p className="text-gray-500 text-sm mt-1">Cartera de cheques, gastos fijos y flujo de caja operativo.</p>
        </div>
      </div>

      {/* ⚠️ ALERTA: Cheques que vencen esta semana */}
      {(() => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // domingo
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // sábado

        const dueThisWeek = cheques.filter(ch => {
          if (ch.status !== 'pending') return false;
          const dateStr = ch.due_date || ch.issue_date;
          if (!dateStr) return false;
          const d = new Date(dateStr + 'T12:00:00');
          // Incluir los que vencen esta semana y los que YA vencieron (d <= endOfWeek)
          return d <= endOfWeek;
        });

        const toPay = dueThisWeek.filter(c => c.direction === 'payable').reduce((s, c) => s + c.amount_ars, 0);
        const toReceive = dueThisWeek.filter(c => c.direction === 'receivable').reduce((s, c) => s + c.amount_ars, 0);
        const netAmount = toReceive - toPay;

        if (dueThisWeek.length === 0) return null;

        return (
          <div className="relative bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-xl p-4 md:p-5 shadow-lg text-white overflow-hidden animate-pulse-subtle">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-4 text-6xl">⚠️</div>
              <div className="absolute bottom-2 left-4 text-6xl">🔔</div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-xl animate-bounce" style={{ animationDuration: '2s' }}>
                    🔔
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight">¡{dueThisWeek.length} cheque{dueThisWeek.length > 1 ? 's' : ''} vencido{dueThisWeek.length > 1 ? 's' : ''} o por vencer!</h4>
                    <p className="text-white/80 text-xs">Incluye vencidos y hasta el {endOfWeek.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-end">
                  {toReceive > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-white/70 font-bold tracking-wider">A COBRAR</p>
                      <p className="text-base font-bold font-mono tracking-tight text-green-100">+{formatARS(toReceive)}</p>
                    </div>
                  )}
                  {toPay > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-white/70 font-bold tracking-wider">A PAGAR</p>
                      <p className="text-base font-bold font-mono tracking-tight text-red-100">-{formatARS(toPay)}</p>
                    </div>
                  )}
                  <div className="text-right border-l border-white/20 pl-4 sm:pl-6 ml-2">
                    <p className="text-xs text-white/70 font-bold">{netAmount >= 0 ? 'SALDO A FAVOR' : 'DÉFICIT A CUBRIR'}</p>
                    <p className="text-2xl font-black font-mono tracking-tight">{formatARS(Math.abs(netAmount))}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {dueThisWeek.map(ch => {
                  const dueDate = ch.due_date || ch.issue_date || '';
                  const isPagar = ch.direction === 'payable';
                  return (
                    <div key={ch.id} className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between border border-white/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isPagar ? 'bg-red-900/50 text-red-100' : 'bg-green-900/50 text-green-100'}`}>
                          {isPagar ? '↑ Pagar' : '↓ Cobrar'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">
                            {isPagar 
                              ? (ch.issuer_company ? `${ch.beneficiary_or_issuer || 'Sin beneficiario'} (${ch.issuer_company})` : ch.beneficiary_or_issuer || 'Sin beneficiario')
                              : ch.beneficiary_or_issuer || 'Sin beneficiario'}
                          </p>
                          <p className="text-xs text-white/60">#{ch.cheque_number} · {ch.bank_name} · Vto: {new Date(dueDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-sm whitespace-nowrap ml-2">{formatARS(ch.amount_ars)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setFilterDate('week')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors border border-white/30"
                >
                  Ver solo esta semana →
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* KPIs DE CHEQUES Y LIQUIDEZ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cheques Pagados (Emitidos debitados) */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-emerald-50/60 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <CheckCircle size={16} className="text-emerald-600" />
              Cheques Pagados (Emitidos)
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {paidPayable.length} cheques
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
            {formatARS(totalPaidPayable)}
          </p>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-50 text-xs">
            <span className="text-slate-500 font-medium">Debitado este mes:</span>
            <span className="font-mono font-bold text-emerald-800">{formatARS(totalPaidPayableThisMonth)}</span>
          </div>
        </div>

        {/* Card 2: Cheques Cobrados / Depositados (Recibidos) */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider">
              <ArrowDownRight size={16} className="text-blue-600" />
              Cobrados / Depositados
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {paidReceivable.length} cheques
            </span>
          </div>
          <p className="text-2xl font-black text-blue-700 font-mono tracking-tight">
            {formatARS(totalPaidReceivable)}
          </p>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-50 text-xs">
            <span className="text-slate-500 font-medium">Acreditado este mes:</span>
            <span className="font-mono font-bold text-blue-800">{formatARS(totalPaidReceivableThisMonth)}</span>
          </div>
        </div>

        {/* Card 3: Cheques Pendientes a Pagar */}
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-rose-50/60 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <Clock size={16} className="text-rose-600" />
              Pendientes a Pagar
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pendingPayable.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
              {pendingPayable.length} pendientes
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono tracking-tight">
            {formatARS(totalPendingPayable)}
          </p>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-rose-50 text-xs">
            <span className="text-slate-500 font-medium">A vencer este mes:</span>
            <span className="font-mono font-bold text-rose-700">
              {formatARS(totalPayableThisMonth)} <span className="text-[10px] font-normal text-rose-500">({payableThisMonth.length})</span>
            </span>
          </div>
        </div>

        {/* Card 4: En Cartera / Gastos Fijos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <TrendingUp size={16} className="text-ecar-blue" />
              En Cartera a Cobrar
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              {pendingReceivable.length} cheques
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">
            {formatARS(totalPendingReceivable)}
          </p>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Gastos Fijos Mes:</span>
            <span className="font-mono font-bold text-ecar-blue">{formatARS(totalFixed)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('cheques')}
          className={`py-2.5 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'cheques'
              ? 'border-ecar-blue text-ecar-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Cartera de Cheques
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`py-2.5 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'receipts'
              ? 'border-ecar-blue text-ecar-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Comprobantes de Pago
        </button>
        <button
          onClick={() => setActiveTab('bcra')}
          className={`py-2.5 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'bcra'
              ? 'border-ecar-blue text-ecar-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Información Crediticia
        </button>
      </div>

      {activeTab === 'cheques' && (
        <div className="space-y-5">
          {/* Action Header & Quick View Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick View Modes */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setChequeViewMode('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chequeViewMode === 'all'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Todos ({cheques.length})
              </button>

              <button
                onClick={() => setChequeViewMode('paid')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chequeViewMode === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 size={13} />
                Pagados / Cobrados ({allPaidCheques.length})
              </button>

              <button
                onClick={() => setChequeViewMode('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chequeViewMode === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                <Clock size={13} />
                Pendientes ({allPendingCheques.length})
              </button>

              <button
                onClick={() => setChequeViewMode('payable')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chequeViewMode === 'payable'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
                }`}
              >
                <ArrowUpRight size={13} />
                Emitidos (A Pagar) ({cheques.filter(c => c.direction === 'payable').length})
              </button>

              <button
                onClick={() => setChequeViewMode('receivable')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chequeViewMode === 'receivable'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
                }`}
              >
                <ArrowDownRight size={13} />
                Recibidos (A Cobrar) ({cheques.filter(c => c.direction === 'receivable').length})
              </button>
            </div>

            {/* Top Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {overduePendingCheques.length > 0 && (
                <button
                  onClick={handleMarkAllOverdueAsPaid}
                  disabled={!canWrite}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 animate-pulse-subtle"
                  title="Marcar todos los cheques cuya fecha de cobro es anterior a hoy como Pagados"
                >
                  <CheckCheck size={15} />
                  Pasar Vencidos a Pagados ({overduePendingCheques.length})
                </button>
              )}

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5"
                title="Exportar vista actual a Excel"
              >
                <FileSpreadsheet size={15} className="text-emerald-600" />
                Exportar Excel
              </button>

              <button
                onClick={() => { setScanUrl(''); setMode('form'); }}
                disabled={!canWrite}
                className={`px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 ${!canWrite ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Edit3 size={15} className="text-ecar-blue" />
                Carga Manual
              </button>

              <button
                onClick={() => setMode('scan')}
                disabled={!canWrite}
                className={`px-4 py-2 bg-ecar-blue hover:bg-ecar-blueDark text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 ${!canWrite ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Camera size={15} />
                Escanear Cheque
              </button>
            </div>
          </div>

          {/* Advanced Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Buscador de texto libre */}
              <div className="lg:col-span-2 relative">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Búsqueda General
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar cheque, banco o monto..."
                    value={searchCheque}
                    onChange={e => setSearchCheque(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue"
                  />
                </div>
              </div>

              {/* Filtro por Beneficiario / Emisor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Beneficiario / Emisor
                </label>
                <select
                  value={filterBeneficiary}
                  onChange={e => setFilterBeneficiary(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-ecar-blue font-medium text-slate-700"
                >
                  <option value="">Todos los Beneficiarios ({uniqueBeneficiaries.length})</option>
                  {uniqueBeneficiaries.map(({ name, count }) => (
                    <option key={name} value={name}>
                      {name} ({count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Estado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-ecar-blue font-medium text-slate-700"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="paid">🟢 Pagados / Cobrados</option>
                  <option value="pending">⏳ Pendientes</option>
                  <option value="bounced">🔴 Rechazados</option>
                  <option value="cancelled">⚪ Anulados</option>
                </select>
              </div>

              {/* Filtro por Dirección */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Dirección
                </label>
                <select
                  value={filterDirection}
                  onChange={e => setFilterDirection(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-ecar-blue font-medium text-slate-700"
                >
                  <option value="all">Todas las Direcciones</option>
                  <option value="payable">↑ A Pagar (Emitidos)</option>
                  <option value="receivable">↓ A Cobrar (Recibidos)</option>
                </select>
              </div>

              {/* Filtro por Período / Fecha */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Período Fecha Vto
                </label>
                <select
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-ecar-blue font-medium text-slate-700"
                >
                  <option value="">Histórico Completo</option>
                  <option value="today">Hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                  <option value="last_month">Mes anterior</option>
                  <option value="next_month">Próximo mes</option>
                  <option value="custom">Rango personalizado</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range & Reset Button */}
            {(filterDate === 'custom' || searchCheque || filterBeneficiary || filterStatus !== 'all' || filterDirection !== 'all' || filterType !== 'all') && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                {filterDate === 'custom' ? (
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-600">Desde:</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      className="bg-white border rounded px-2 py-0.5 text-xs"
                    />
                    <span className="font-bold text-slate-600">Hasta:</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      className="bg-white border rounded px-2 py-0.5 text-xs"
                    />
                  </div>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">
                    Mostrando <strong className="text-slate-800">{filteredCheques.length}</strong> de {cheques.length} cheques
                  </span>
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw size={12} />
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scan modal */}
          {mode === 'scan' && (
            <ChequeUploader
              onExtracted={handleScanComplete}
              onCancel={() => setMode('idle')}
            />
          )}

          {/* Form modal (pre-filled from OCR or empty for manual) */}
          {mode === 'form' && createPortal(
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{scanUrl ? '✅ Datos extraídos — Revisá y confirmá' : 'Registro Manual'}</h3>
                  <button onClick={handleCancelForm}><X size={20} className="text-gray-400" /></button>
                </div>

                {scanUrl && (
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-xs font-bold text-gray-500 mb-2">Imagen del cheque:</p>
                    <img src={scanUrl} alt="Cheque escaneado" className="max-h-32 rounded border mx-auto" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={form.direction}
                    onChange={e => {
                      const newDir = e.target.value as 'receivable' | 'payable';
                      let defaultVal = form.beneficiary_or_issuer;
                      if (ocrData) {
                        defaultVal = newDir === 'receivable' ? (ocrData.issuer_name || '') : (ocrData.beneficiary || '');
                      }
                      setForm({ ...form, direction: newDir, beneficiary_or_issuer: defaultVal });
                    }}
                    className="px-3 py-2 border rounded-lg text-sm col-span-2 font-medium"
                  >
                    <option value="receivable">↓ A Cobrar (recibido)</option>
                    <option value="payable">↑ A Pagar (emitido)</option>
                  </select>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Nro. Cheque</label>
                    <input value={form.cheque_number} onChange={e => setForm({ ...form, cheque_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Banco</label>
                    <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  {form.direction === 'payable' && (
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-500">Razón Social Emisora</label>
                      <select value={form.issuer_company} onChange={e => setForm({ ...form, issuer_company: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="ECAR SAS">ECAR SAS</option>
                        <option value="CARLOS ADOLFO REGALADO">CARLOS ADOLFO REGALADO</option>
                      </select>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500">
                      {form.direction === 'receivable' ? 'Emisor / Librador' : 'Beneficiario'} <span className="text-gray-300 font-normal">(opcional)</span>
                    </label>
                    <input value={form.beneficiary_or_issuer} onChange={e => setForm({ ...form, beneficiary_or_issuer: e.target.value })} placeholder="Podés dejarlo vacío" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500">
                      Asociar a Factura (Opcional)
                    </label>
                    <InvoiceSearchSelector
                      type={form.direction === 'payable' ? 'purchase_invoice' : 'invoice'}
                      invoices={form.direction === 'payable' ? purchaseInvoices : invoices as any}
                      value={form.direction === 'payable' ? form.linked_purchase_invoice_id : form.linked_invoice_id}
                      onChange={(id) => {
                        if (form.direction === 'payable') {
                          setForm({ ...form, linked_purchase_invoice_id: id });
                        } else {
                          setForm({ ...form, linked_invoice_id: id });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Monto ARS</label>
                    <input type="number" value={form.amount_ars || ''} onChange={e => setForm({ ...form, amount_ars: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Tipo</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="physical">Físico</option>
                      <option value="echeq">eCheq</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Fecha Emisión</label>
                    <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Vencimiento</label>
                    <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>

                <button onClick={handleCreate} disabled={!form.cheque_number || !form.bank_name || createCheque.isPending} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-emerald-700 transition-colors">
                  {createCheque.isPending ? 'Guardando...' : '✓ Confirmar y Registrar Cheque'}
                </button>
              </div>
            </div>
          , document.body)}

          {/* Cheques table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">Listado Detallado de Cheques</h3>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                  {filteredCheques.length} registros
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Total en vista: <strong className="text-slate-900 font-bold">{formatARS(filteredCheques.reduce((s, c) => s + c.amount_ars, 0))}</strong>
              </div>
            </div>

            {filteredCheques.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm space-y-2">
                <p className="font-medium">No se encontraron cheques con los filtros seleccionados.</p>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-ecar-blue hover:underline font-bold"
                >
                  Restablecer todos los filtros
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nro Cheque</th>
                      <th className="px-4 py-3">Banco</th>
                      <th className="px-4 py-3">Dirección</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Beneficiario / Emisor</th>
                      <th className="px-4 py-3 text-right">Monto ($)</th>
                      <th className="px-4 py-3">Fecha Vto</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Scan</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCheques.map(ch => {
                      const isPayable = ch.direction === 'payable';
                      const isPaid = ch.status === 'cashed' || ch.status === 'deposited';
                      const isPending = ch.status === 'pending';
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isOverdue = isPending && ((ch.due_date && ch.due_date < todayStr) || (!ch.due_date && ch.issue_date && ch.issue_date < todayStr));

                      return (
                        <tr
                          key={ch.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isPaid ? 'bg-emerald-50/20' : isOverdue ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Nro Cheque */}
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              #{ch.cheque_number}
                            </span>
                          </td>

                          {/* Banco */}
                          <td className="px-4 py-3.5 font-medium text-slate-800">
                            {ch.bank_name}
                          </td>

                          {/* Dirección */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                              isPayable ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isPayable ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {isPayable ? 'Emitido (Pagar)' : 'Recibido (Cobrar)'}
                            </span>
                          </td>

                          {/* Tipo */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              ch.type === 'echeq' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {ch.type === 'echeq' ? '⚡ eCheq' : '📄 Físico'}
                            </span>
                          </td>

                          {/* Beneficiario / Emisor */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">
                                {ch.beneficiary_or_issuer || '—'}
                              </span>
                              {ch.issuer_company && (
                                <span className="text-[11px] text-slate-400">
                                  Emisor: {ch.issuer_company}
                                </span>
                              )}
                              {ch.linked_purchase_invoice_id && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded w-max mt-0.5 font-medium">
                                  Factura Compra Asoc.
                                </span>
                              )}
                              {ch.linked_invoice_id && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded w-max mt-0.5 font-medium">
                                  Factura Venta Asoc.
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Monto */}
                          <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 text-sm">
                            {formatARS(ch.amount_ars)}
                          </td>

                          {/* Vencimiento */}
                          <td className="px-4 py-3.5 text-xs">
                            {ch.due_date ? (
                              <div className="space-y-0.5">
                                {isPostponed(ch.due_date) ? (
                                  <>
                                    <span className="line-through text-slate-400 block">{ch.due_date}</span>
                                    <span className="text-emerald-700 font-bold block">→ {getNextBusinessDay(ch.due_date)}</span>
                                  </>
                                ) : (
                                  <span className="text-slate-700 font-medium">{ch.due_date}</span>
                                )}
                                {isPaid && (
                                  <span className="inline-block text-[10px] text-emerald-700 font-bold">
                                    ✓ Efectivizado
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="inline-block text-[10px] text-rose-700 font-bold bg-rose-100 px-1 rounded">
                                    ⚠️ Vencido
                                  </span>
                                )}
                              </div>
                            ) : '—'}
                          </td>

                          {/* Estado con Badge Claro */}
                          <td className="px-4 py-3.5 text-center">
                            {ch.status === 'cashed' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                {isPayable ? 'PAGADO' : 'COBRADO'}
                              </span>
                            ) : ch.status === 'deposited' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                <CheckCircle2 size={13} className="text-blue-600" />
                                DEPOSITADO
                              </span>
                            ) : ch.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock size={13} className="text-amber-600" />
                                PENDIENTE
                              </span>
                            ) : ch.status === 'bounced' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle size={13} className="text-rose-600" />
                                RECHAZADO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                ANULADO
                              </span>
                            )}
                          </td>

                          {/* Scan */}
                          <td className="px-4 py-3.5 text-center">
                            {(ch as any).scan_url ? (
                              <button
                                onClick={() => setViewerUrl((ch as any).scan_url)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg transition-colors inline-block"
                                title="Ver imagen del cheque"
                              >
                                <Camera size={15} />
                              </button>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Botón rápido: Marcar como Pagado / Cobrado */}
                              {isPending && (
                                <button
                                  onClick={() => handleQuickStatus(ch, isPayable ? 'cashed' : 'deposited')}
                                  disabled={!canWrite}
                                  className={`p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all ${!canWrite ? 'opacity-40 cursor-not-allowed' : ''}`}
                                  title={isPayable ? 'Marcar como Pagado (Debitado)' : 'Marcar como Depositado / Cobrado'}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}

                              {/* Botón rápido: Revertir a Pendiente si ya fue pagado */}
                              {isPaid && (
                                <button
                                  onClick={() => handleRevertToPending(ch)}
                                  disabled={!canWrite}
                                  className={`p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-700 transition-all ${!canWrite ? 'opacity-40 cursor-not-allowed' : ''}`}
                                  title="Revertir estado a Pendiente"
                                >
                                  <Undo2 size={15} />
                                </button>
                              )}

                              {/* Editar */}
                              <button
                                onClick={() => handleEdit(ch)}
                                disabled={!canWrite}
                                className={`p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors ${!canWrite ? 'opacity-40 cursor-not-allowed' : ''}`}
                                title={!canWrite ? 'Sin permisos de edición' : 'Editar Cheque'}
                              >
                                <Pencil size={14} />
                              </button>

                              {/* Historial Auditoría */}
                              <button
                                onClick={() => setAuditChequeId(ch.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-ecar-blue transition-colors"
                                title="Historial de Auditoría"
                              >
                                <History size={14} />
                              </button>

                              {/* Eliminar */}
                              <button
                                onClick={() => handleDeleteCheque(ch)}
                                disabled={!canDelete}
                                className={`p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors ${!canDelete ? 'opacity-40 cursor-not-allowed' : ''}`}
                                title={!canDelete ? 'Sin permisos de eliminación' : 'Eliminar Cheque'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Historial de Comprobantes de Pago</h3>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="bg-ecar-blue hover:bg-ecar-blueDark text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} /> Cargar Comprobante
            </button>
          </div>

          {/* Receipts Table */}
          <div className="light-card overflow-hidden">
            {isLoadingPayments ? (
              <div className="text-center py-12 text-gray-400 text-sm">Cargando comprobantes...</div>
            ) : paymentRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No se encontraron comprobantes de pago registrados.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Concepto / Nota</th>
                      <th className="px-4 py-3">Medio de Pago</th>
                      <th className="px-4 py-3">Banco / Caja</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-xs">{rec.payment_date}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{rec.notes || 'Sin descripción'}</td>
                        <td className="px-4 py-3">
                          <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                            {rec.payment_method === 'transfer' ? '⚡ Transferencia' :
                             rec.payment_method === 'cash' ? '💵 Efectivo' :
                             rec.payment_method === 'check' ? '📄 Cheque' :
                             `Otro (${rec.payment_method})`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{rec.bank_name || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{formatARS(rec.amount_ars)}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {rec.receipt_url ? (
                            <a
                              href={rec.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-ecar-blue hover:text-ecar-blueDark font-bold text-xs bg-ecar-blueLight hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                            >
                              <FileText size={14} /> Ver Archivo
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bcra' && (
        <BcraCreditInfo />
      )}

      {/* Upload Receipt Modal */}
      {showReceiptModal && createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Cargar Comprobante de Pago</h3>
              <button onClick={() => setShowReceiptModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (receiptForm.amount_ars <= 0) {
                useModalStore.getState().showAlert('Error', 'El monto debe ser mayor a 0');
                return;
              }
              
              let receiptUrl = '';
              if (receiptFile) {
                setIsUploadingReceipt(true);
                const fileExt = receiptFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `general/${fileName}`;
                const { error: uploadError } = await supabase.storage
                  .from('payment-receipts')
                  .upload(filePath, receiptFile);
                
                if (uploadError) {
                  useModalStore.getState().showAlert('Error', 'Error al subir el archivo: ' + uploadError.message);
                  setIsUploadingReceipt(false);
                  return;
                }

                const { data: urlData } = supabase.storage
                  .from('payment-receipts')
                  .getPublicUrl(filePath);
                receiptUrl = urlData.publicUrl;
              }

              try {
                await createPaymentRecord.mutateAsync({
                  payment_date: receiptForm.payment_date,
                  amount_ars: receiptForm.amount_ars,
                  payment_method: receiptForm.payment_method,
                  bank_name: (receiptForm.payment_method === 'transfer' || receiptForm.payment_method === 'check') ? receiptForm.bank_name : null,
                  check_number: receiptForm.payment_method === 'check' ? receiptForm.check_number : null,
                  notes: receiptForm.notes || null,
                  receipt_url: receiptUrl || null,
                  entity_type: 'general',
                  entity_id: null,
                });
                setShowReceiptModal(false);
                setReceiptFile(null);
                setReceiptForm({
                  payment_date: new Date().toISOString().split('T')[0],
                  amount_ars: 0,
                  payment_method: 'transfer',
                  bank_name: '',
                  check_number: '',
                  notes: '',
                });
              } catch (err: any) {
                useModalStore.getState().showAlert('Error', 'Error al guardar el comprobante: ' + err.message);
              } finally {
                setIsUploadingReceipt(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">Concepto / Nota</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pago de alquiler mayo, Compra de herramientas, etc."
                    value={receiptForm.notes}
                    onChange={e => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Fecha de Pago</label>
                  <input
                    type="date"
                    required
                    value={receiptForm.payment_date}
                    onChange={e => setReceiptForm({ ...receiptForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Monto (ARS)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={receiptForm.amount_ars || ''}
                    onChange={e => setReceiptForm({ ...receiptForm, amount_ars: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Medio de Pago</label>
                  <select
                    value={receiptForm.payment_method}
                    onChange={e => setReceiptForm({ ...receiptForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="transfer">⚡ Transferencia</option>
                    <option value="cash">💵 Efectivo</option>
                    <option value="check">📄 Cheque</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {(receiptForm.payment_method === 'transfer' || receiptForm.payment_method === 'check') && (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 block mb-1">Banco / Caja Origen</label>
                    <select
                      value={receiptForm.bank_name}
                      onChange={e => setReceiptForm({ ...receiptForm, bank_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                )}

                {receiptForm.payment_method === 'check' && (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 block mb-1">Nro. de Cheque</label>
                    <input
                      type="text"
                      placeholder="Nro. Cheque"
                      value={receiptForm.check_number}
                      onChange={e => setReceiptForm({ ...receiptForm, check_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                      required
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">Archivo Comprobante (PDF o Imagen)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setReceiptFile(file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                    <p className="text-xs text-gray-500 font-medium">
                      {receiptFile ? `Archivo seleccionado: ${receiptFile.name}` : 'Hacé clic o arrastrá para subir'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Soporta JPG, PNG, PDF de hasta 20MB</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploadingReceipt || createPaymentRecord.isPending}
                className="w-full bg-ecar-blue hover:bg-ecar-blueDark text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors mt-2"
              >
                {isUploadingReceipt ? 'Subiendo archivo...' : createPaymentRecord.isPending ? 'Guardando...' : '✓ Confirmar y Registrar'}
              </button>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Edit Cheque Modal */}
      {editingCheque && createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Editar Cheque #{editForm.cheque_number}</h3>
              <button onClick={() => setEditingCheque(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={editForm.direction} onChange={e => setEditForm({ ...editForm, direction: e.target.value })} className="px-3 py-2 border rounded-lg text-sm col-span-2 font-medium">
                <option value="receivable">↓ A Cobrar</option>
                <option value="payable">↑ A Pagar</option>
              </select>
              <div>
                <label className="text-xs font-bold text-gray-500">Nro. Cheque</label>
                <input value={editForm.cheque_number} onChange={e => setEditForm({ ...editForm, cheque_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Banco</label>
                <input value={editForm.bank_name} onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {editForm.direction === 'payable' && (
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500">Razón Social Emisora</label>
                  <select value={editForm.issuer_company} onChange={e => setEditForm({ ...editForm, issuer_company: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="ECAR SAS">ECAR SAS</option>
                    <option value="CARLOS ADOLFO REGALADO">CARLOS ADOLFO REGALADO</option>
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">{editForm.direction === 'receivable' ? 'Emisor / Librador' : 'Beneficiario'} <span className="text-gray-300 font-normal">(opcional)</span></label>
                <input value={editForm.beneficiary_or_issuer} onChange={e => setEditForm({ ...editForm, beneficiary_or_issuer: e.target.value })} placeholder="Podés dejarlo vacío" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">Asociar a Factura (Opcional)</label>
                <InvoiceSearchSelector
                  type={editForm.direction === 'payable' ? 'purchase_invoice' : 'invoice'}
                  invoices={editForm.direction === 'payable' ? purchaseInvoices : invoices as any}
                  value={editForm.direction === 'payable' ? editForm.linked_purchase_invoice_id : editForm.linked_invoice_id}
                  onChange={(id) => {
                    if (editForm.direction === 'payable') {
                      setEditForm({ ...editForm, linked_purchase_invoice_id: id });
                    } else {
                      setEditForm({ ...editForm, linked_invoice_id: id });
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Monto ARS</label>
                <input type="number" value={editForm.amount_ars || ''} onChange={e => setEditForm({ ...editForm, amount_ars: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Tipo</label>
                <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="physical">Físico</option>
                  <option value="echeq">eCheq</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Fecha Emisión</label>
                <input type="date" value={editForm.issue_date} onChange={e => setEditForm({ ...editForm, issue_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Vencimiento</label>
                <input type="date" value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">Estado</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="pending">Pendiente</option>
                  <option value="deposited">Depositado</option>
                  <option value="cashed">{editForm.direction === 'payable' ? 'Pagado' : 'Cobrado'}</option>
                  <option value="bounced">Rechazado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
            <button onClick={handleSaveEdit} disabled={updateCheque.isPending} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-ecar-blueDark transition-colors">
              {updateCheque.isPending ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </div>
      , document.body)}

      {/* Audit Log Modal */}
      {auditChequeId && <ChequeAuditModal chequeId={auditChequeId} onClose={() => setAuditChequeId(null)} />}

      {/* Image Viewer */}
      {viewerUrl && <ImageViewer src={viewerUrl} alt="Cheque escaneado" onClose={() => setViewerUrl(null)} />}
    </div>
  );
};

// ─── Audit Log Sub-Component ───
const ChequeAuditModal: React.FC<{ chequeId: string; onClose: () => void }> = ({ chequeId, onClose }) => {
  const { data: logs = [], isLoading } = useChequeAuditLog(chequeId);
  const actionLabels: Record<string, { label: string; color: string }> = {
    created: { label: 'Creado', color: 'bg-green-100 text-green-700' },
    updated: { label: 'Editado', color: 'bg-blue-100 text-blue-700' },
    deleted: { label: 'Eliminado', color: 'bg-red-100 text-red-700' },
    status_changed: { label: 'Estado cambiado', color: 'bg-yellow-100 text-yellow-700' },
  };

  const fieldLabels: Record<string, string> = {
    cheque_number: 'Nro. Cheque', bank_name: 'Banco', type: 'Tipo', direction: 'Dirección',
    beneficiary_or_issuer: 'Beneficiario/Emisor', amount_ars: 'Monto', due_date: 'Vencimiento',
    issue_date: 'Fecha emisión', status: 'Estado',
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><History size={18} className="text-ecar-blue" /> Historial de Cambios</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {isLoading ? (
          <div className="text-center py-8"><div className="w-6 h-6 border-2 border-gray-200 border-t-ecar-blue rounded-full animate-spin mx-auto" /></div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Sin registros de auditoría</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log: any) => {
              const act = actionLabels[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={log.id} className="border border-gray-100 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${act.color}`}>{act.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{new Date(log.created_at).toLocaleString('es-AR')}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    por <span className="font-bold text-gray-800">{log.user_name}</span>
                  </p>
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="bg-gray-50 rounded p-2 space-y-1">
                      {Object.entries(log.changes).map(([field, vals]: [string, any]) => (
                        <div key={field} className="text-[11px]">
                          <span className="font-bold text-gray-500">{fieldLabels[field] || field}:</span>{' '}
                          <span className="text-red-500 line-through">{String(vals.old || '—')}</span>{' → '}
                          <span className="text-green-600 font-bold">{String(vals.new || '—')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  , document.body);
};
