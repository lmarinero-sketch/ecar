import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, TrendingDown, CreditCard, X, Camera, Edit3, Plus, Upload, FileText, Trash2, History, Pencil, CheckCircle2 } from 'lucide-react';
import { useCheques, useCreateCheque, useUpdateCheque, useDeleteCheque, useCreateChequeAuditLog, useChequeAuditLog, useFixedExpenses, usePaymentRecords, useCreatePaymentRecord, useBankAccounts, useInvoices, usePurchaseInvoices } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { InvoiceSearchSelector } from './InvoiceSearchSelector';
import { ChequeUploader } from './ChequeUploader';
import { ImageViewer } from './ImageViewer';
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
  const [deleteTarget, setDeleteTarget] = useState<Cheque | null>(null);
  const [auditChequeId, setAuditChequeId] = useState<string | null>(null);
  
  // Filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  
  const { data: paymentRecords = [], isLoading: isLoadingPayments } = usePaymentRecords();
  const createPaymentRecord = useCreatePaymentRecord();
  const { data: bankAccounts = [] } = useBankAccounts();

  const [activeTab, setActiveTab] = useState<'cheques' | 'receipts'>('cheques');
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

  const payable = cheques.filter(c => c.direction === 'payable' && c.status === 'pending');
  const receivable = cheques.filter(c => c.direction === 'receivable' && c.status === 'pending');
  const totalPayable = payable.reduce((a, c) => a + c.amount_ars, 0);
  const totalReceivable = receivable.reduce((a, c) => a + c.amount_ars, 0);
  
  const payableThisMonth = payable.filter(c => {
    const dStr = c.due_date || c.issue_date;
    if (!dStr) return false;
    const d = new Date(dStr + 'T12:00:00');
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const totalPayableThisMonth = payableThisMonth.reduce((a, c) => a + c.amount_ars, 0);
  const totalFixed = expenses.filter(e => e.status === 'active').reduce((a, e) => a + e.estimated_amount_ars, 0);

  const filteredCheques = React.useMemo(() => {
    return cheques.filter(ch => {
      if (!filterDate) return true;
      const dateStr = ch.due_date || ch.issue_date;
      if (!dateStr) return false;
      const d = new Date(dateStr + 'T12:00:00');
      const today = new Date();
      today.setHours(12,0,0,0);
      
      if (filterDate === 'today') {
        return d.toDateString() === today.toDateString();
      }
      if (filterDate === 'week') {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return d >= start && d <= end;
      }
      if (filterDate === 'month') {
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      }
      if (filterDate === 'next_month') {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        return d.getMonth() === nextMonth.getMonth() && d.getFullYear() === nextMonth.getFullYear();
      }
      if (filterDate === 'custom') {
        if (customStart && d < new Date(customStart + 'T12:00:00')) return false;
        if (customEnd && d > new Date(customEnd + 'T12:00:00')) return false;
        return true;
      }
      return true;
    });
  }, [cheques, filterDate, customStart, customEnd]);

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
        if (!window.confirm(`Posible cheque duplicado detectado (Nro ${form.cheque_number}, Banco ${form.bank_name}, Vto ${form.due_date}). ¿Desea cargarlo de todas formas?`)) {
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // Audit BEFORE delete
      await auditLog.mutateAsync({
        cheque_id: deleteTarget.id,
        action: 'deleted',
        user_id: profile?.id || null,
        user_name: profile?.full_name || 'Sistema',
        snapshot: deleteTarget as any,
      });
      await deleteCheque.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message || 'Error al eliminar');
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

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', deposited: 'bg-blue-100 text-blue-700',
    cashed: 'bg-green-100 text-green-700', bounced: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600',
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="light-card p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-50 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingDown size={16} className="text-red-500" /> Cheques a Pagar</div>
          <p className="text-2xl font-black text-red-600 font-mono">{formatARS(totalPayable)}</p>
          <div className="flex justify-between items-end mt-1 relative z-10">
            <p className="text-xs text-gray-400">{payable.length} pendientes en total</p>
            <div className="text-right">
              <p className="text-xs font-bold text-red-800">Este mes:</p>
              <p className="text-sm font-mono font-bold text-red-700">{formatARS(totalPayableThisMonth)} <span className="text-[10px] font-normal text-red-500">({payableThisMonth.length})</span></p>
            </div>
          </div>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingUp size={16} className="text-green-500" /> Cheques a Cobrar</div>
          <p className="text-2xl font-black text-green-600 font-mono">{formatARS(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">{receivable.length} pendientes</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><CreditCard size={16} className="text-ecar-blue" /> Gastos Fijos Mes</div>
          <p className="text-2xl font-black text-ecar-blue font-mono">{formatARS(totalFixed)}</p>
          <p className="text-xs text-gray-400 mt-1">{expenses.filter(e => e.status === 'active').length} activos</p>
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
      </div>

      {activeTab === 'cheques' && (
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setScanUrl(''); setMode('form'); }} disabled={!canWrite} title={!canWrite ? 'Sin permisos de edición' : ''} className={`btn-secondary ${!canWrite ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Edit3 size={16} /> Carga Manual
            </button>
            <button onClick={() => setMode('scan')} disabled={!canWrite} title={!canWrite ? 'Sin permisos de edición' : ''} className={`btn-primary ${!canWrite ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Camera size={16} /> Escanear Cheque
            </button>
          </div>

          {/* Scan modal */}
          {mode === 'scan' && (
            <ChequeUploader
              onExtracted={handleScanComplete}
              onCancel={() => setMode('idle')}
            />
          )}

          {/* Form modal (pre-filled from OCR or empty for manual) */}
          {mode === 'form' && (
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
          )}

          {/* Cheques table */}
          <div className="light-card overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-gray-800 shrink-0">Cartera de Cheques</h3>
              <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm overflow-x-auto max-w-full no-scrollbar">
                  {[
                    { id: '', label: 'Todos' },
                    { id: 'month', label: 'Este mes' },
                    { id: 'week', label: 'Esta semana' },
                    { id: 'today', label: 'Hoy' },
                    { id: 'custom', label: 'Personalizado' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterDate(filter.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        filterDate === filter.id 
                          ? 'bg-ecar-blue text-white shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {filterDate === 'custom' && (
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-1 py-1 text-xs outline-none bg-transparent" />
                    <span className="text-gray-400 text-xs">-</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-1 py-1 text-xs outline-none bg-transparent" />
                  </div>
                )}
              </div>
            </div>
            {filteredCheques.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">Sin cheques registrados. Escaneá o cargá el primero.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Nro</th>
                      <th className="px-4 py-3">Banco</th>
                      <th className="px-4 py-3">Dir.</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Beneficiario / Emisor</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3">Vto</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Scan</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCheques.map(ch => (
                      <tr key={ch.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{ch.cheque_number}</td>
                        <td className="px-4 py-3">{ch.bank_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${ch.direction === 'payable' ? 'text-red-500' : 'text-green-500'}`}>
                            {ch.direction === 'payable' ? '↑ Pagar' : '↓ Cobrar'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${ch.type === 'echeq' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {ch.type === 'echeq' ? '⚡ eCheq' : '📄 Físico'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {ch.direction === 'payable' ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{ch.beneficiary_or_issuer || '—'}</span>
                              {ch.issuer_company && <span className="text-xs text-gray-400">Emisor: {ch.issuer_company}</span>}
                              {ch.linked_purchase_invoice_id && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded w-max mt-1" title="Factura de Compra asociada">Factura Asoc.</span>}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{ch.beneficiary_or_issuer || '—'}</span>
                              {ch.linked_invoice_id && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded w-max mt-1" title="Factura de Venta asociada">Factura Asoc.</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{formatARS(ch.amount_ars)}</td>
                        <td className="px-4 py-3 text-xs">
                          {ch.due_date ? (
                            <div>
                              {isPostponed(ch.due_date) ? (
                                <>
                                  <span className="line-through text-gray-400">{ch.due_date}</span>
                                  <span className="block text-green-600 font-bold">→ {getNextBusinessDay(ch.due_date)}</span>
                                </>
                              ) : (
                                <span className="text-gray-500">{ch.due_date}</span>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[ch.status]}`}>{ch.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(ch as any).scan_url ? (
                            <button onClick={() => setViewerUrl((ch as any).scan_url)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors" title="Ver imagen"><Camera size={14} /></button>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {ch.status === 'pending' && (
                              <button
                                onClick={() => handleQuickStatus(ch, ch.direction === 'payable' ? 'cashed' : 'deposited')}
                                disabled={!canWrite}
                                className={`p-1.5 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors ${!canWrite ? 'opacity-40 cursor-not-allowed' : ''}`}
                                title={ch.direction === 'payable' ? 'Marcar como Pagado' : 'Marcar como Depositado'}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button onClick={() => handleEdit(ch)} disabled={!canWrite} className={`p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors ${!canWrite ? 'opacity-40 cursor-not-allowed' : ''}`} title={!canWrite ? 'Sin permisos de edición' : 'Editar'}><Pencil size={14} /></button>
                            <button onClick={() => setAuditChequeId(ch.id)} className="p-1.5 rounded-lg hover:bg-slate-50 text-gray-400 hover:text-ecar-blue transition-colors" title="Historial"><History size={14} /></button>
                            <button onClick={() => setDeleteTarget(ch)} disabled={!canDelete} className={`p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors ${!canDelete ? 'opacity-40 cursor-not-allowed' : ''}`} title={!canDelete ? 'Sin permisos de eliminación' : 'Eliminar'}><Trash2 size={14} /></button>
                          </div>
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

      {/* Upload Receipt Modal */}
      {showReceiptModal && (
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
      )}

      {/* Edit Cheque Modal */}
      {editingCheque && (
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
                  <option value="cashed">Cobrado</option>
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
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Eliminar Cheque</h3>
            <p className="text-sm text-gray-600">
              ¿Estás seguro de eliminar el cheque <span className="font-mono font-bold">#{deleteTarget.cheque_number}</span> de <span className="font-bold">{deleteTarget.bank_name}</span> por <span className="font-mono font-bold">{formatARS(deleteTarget.amount_ars)}</span>?
            </p>
            <p className="text-xs text-gray-400">Esta acción quedará registrada en el historial de auditoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Cancelar</button>
              <button onClick={handleDelete} disabled={deleteCheque.isPending} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 disabled:opacity-50">Eliminar</button>
            </div>
          </div>
        </div>
      )}

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

  return (
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
  );
};
