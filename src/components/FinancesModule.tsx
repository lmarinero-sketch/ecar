import React, { useState } from 'react';
import { Landmark, TrendingUp, TrendingDown, CreditCard, X, Camera, Edit3, Plus, Upload, FileText } from 'lucide-react';
import { useCheques, useCreateCheque, useFixedExpenses, usePaymentRecords, useCreatePaymentRecord, useBankAccounts } from '../hooks/useData';
import { ChequeUploader } from './ChequeUploader';
import { ImageViewer } from './ImageViewer';
import { supabase } from '../lib/supabase';

export const FinancesModule: React.FC = () => {
  const { data: cheques = [], isLoading } = useCheques();
  const { data: expenses = [] } = useFixedExpenses();
  const createCheque = useCreateCheque();
  
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
    amount_ars: 0, due_date: '', issue_date: '', scan_url: '',
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
  const totalFixed = expenses.filter(e => e.status === 'active').reduce((a, e) => a + e.estimated_amount_ars, 0);

  const [ocrData, setOcrData] = useState<any | null>(null);

  const handleScanComplete = (data: any, url: string) => {
    setScanUrl(url);
    setOcrData(data);
    setForm({
      cheque_number: data.cheque_number || '',
      bank_name: data.bank_name || '',
      type: data.type === 'echeq' ? 'echeq' : 'physical',
      direction: 'receivable',
      beneficiary_or_issuer: data.issuer_name || '',
      amount_ars: data.amount || 0,
      due_date: data.due_date || data.issue_date || '',
      issue_date: data.issue_date || '',
      scan_url: url,
    });
    setMode('form');
  };

  const handleCreate = async () => {
    try {
      await createCheque.mutateAsync({ ...form, scan_url: scanUrl || undefined } as any);
      setMode('idle');
      setOcrData(null);
      setScanUrl('');
      setForm({ cheque_number: '', bank_name: '', type: 'physical', direction: 'receivable', beneficiary_or_issuer: '', amount_ars: 0, due_date: '', issue_date: '', scan_url: '' });
    } catch (err: any) {
      alert(err.message || 'Error al registrar el cheque');
    }
  };

  const handleCancelForm = () => {
    setMode('idle');
    setOcrData(null);
    setScanUrl('');
    setForm({ cheque_number: '', bank_name: '', type: 'physical', direction: 'receivable', beneficiary_or_issuer: '', amount_ars: 0, due_date: '', issue_date: '', scan_url: '' });
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', deposited: 'bg-blue-100 text-blue-700',
    cashed: 'bg-green-100 text-green-700', bounced: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600',
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando finanzas...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Landmark size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Landmark size={24} /> Finanzas & Tesorería</h3>
          <p className="text-emerald-100 text-sm mt-1">Cartera de cheques, gastos fijos y flujo de caja operativo.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingDown size={16} className="text-red-500" /> Cheques a Pagar</div>
          <p className="text-2xl font-black text-red-600 font-mono">{formatARS(totalPayable)}</p>
          <p className="text-xs text-gray-400 mt-1">{payable.length} pendientes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingUp size={16} className="text-green-500" /> Cheques a Cobrar</div>
          <p className="text-2xl font-black text-green-600 font-mono">{formatARS(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">{receivable.length} pendientes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><CreditCard size={16} className="text-purple-500" /> Gastos Fijos Mes</div>
          <p className="text-2xl font-black text-purple-700 font-mono">{formatARS(totalFixed)}</p>
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
            <button onClick={() => { setScanUrl(''); setMode('form'); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border hover:bg-gray-200">
              <Edit3 size={16} /> Carga Manual
            </button>
            <button onClick={() => setMode('scan')} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
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

                <div className="grid grid-cols-2 gap-3">
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
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500">
                      {form.direction === 'receivable' ? 'Emisor / Librador' : 'Beneficiario'}
                    </label>
                    <input value={form.beneficiary_or_issuer} onChange={e => setForm({ ...form, beneficiary_or_issuer: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Monto ARS</label>
                    <input type="number" value={form.amount_ars || ''} onChange={e => setForm({ ...form, amount_ars: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono font-bold text-lg" />
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Cartera de Cheques</h3></div>
            {cheques.length === 0 ? (
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cheques.map(ch => (
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
                        <td className="px-4 py-3 text-gray-600">{ch.beneficiary_or_issuer || '—'}</td>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                alert('El monto debe ser mayor a 0');
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
                  alert('Error al subir el archivo: ' + uploadError.message);
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
                alert('Error al guardar el comprobante: ' + err.message);
              } finally {
                setIsUploadingReceipt(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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

      {/* Image Viewer */}
      {viewerUrl && <ImageViewer src={viewerUrl} alt="Cheque escaneado" onClose={() => setViewerUrl(null)} />}
    </div>
  );
};
