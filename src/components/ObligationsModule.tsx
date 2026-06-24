import React, { useState } from 'react';
import { Bell, Plus, Upload, CheckCircle, X, MessageSquare, Pencil, Trash2, DollarSign, Eye } from 'lucide-react';
import { useObligations, useCreateObligation, useUpdateObligation, useDeleteObligation } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { useModalStore } from '../store/useModalStore';
import { NotificationPanel } from './NotificationPanel';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const ObligationsModule: React.FC = () => {
  const { data: obligations = [], isLoading, refetch } = useObligations();
  const createObligation = useCreateObligation();
  const updateObligation = useUpdateObligation();
  const deleteObligation = useDeleteObligation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', due_day_of_month: 15, amount_ars: 0, recurrence: 'monthly' as const });
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [editingObl, setEditingObl] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [payingObl, setPayingObl] = useState<any>(null);
  const [payMonth, setPayMonth] = useState(new Date().getMonth());
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payAmount, setPayAmount] = useState('');
  const [viewPayments, setViewPayments] = useState<string | null>(null);

  const today = new Date().getDate();



  const statusLabel: Record<string, string> = { pending: 'Pendiente', notified: 'Notificado', paid: 'Pagado', overdue: 'Vencido' };
  const statusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    notified: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  };

  const handleCreate = async () => {
    await createObligation.mutateAsync(form);
    setShowForm(false);
    setForm({ name: '', description: '', due_day_of_month: 15, amount_ars: 0, recurrence: 'monthly' });
  };

  const handleUploadReceipt = async (obligationId: string, file: File) => {
    setUploadFeedback(null);
    try {
      const path = `receipts/${obligationId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('obligation-docs').upload(path, file);
      if (error) {
        setUploadFeedback({ type: 'error', msg: `Error al subir: ${error.message}` });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('obligation-docs').getPublicUrl(path);
      await supabase.from('obligation_payments').insert({
        obligation_id: obligationId,
        payment_date: new Date().toISOString().split('T')[0],
        amount_paid_ars: 0,
        receipt_url: publicUrl,
      });
      await supabase.from('obligations').update({ status: 'paid' }).eq('id', obligationId);
      setUploadFeedback({ type: 'success', msg: '✅ Comprobante subido correctamente. Estado actualizado a "Pagado".' });
      refetch();
    } catch (err: any) {
      setUploadFeedback({ type: 'error', msg: `Error: ${err.message || 'No se pudo subir el comprobante'}` });
    }
  };

  const handlePayMonth = async () => {
    if (!payingObl) return;
    try {
      const period = `${payYear}-${String(payMonth + 1).padStart(2, '0')}`;
      await supabase.from('obligation_payments').insert({
        obligation_id: payingObl.id,
        payment_date: new Date().toISOString().split('T')[0],
        amount_paid_ars: parseFloat(payAmount) || payingObl.amount_ars,
        notes: `Pago ${MONTHS[payMonth]} ${payYear}`,
        period_month: period,
      });
      setPayingObl(null);
      setPayAmount('');
      refetch();
    } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); }
  };

  const formatARS = (v: number) => `$ ${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando obligaciones...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Bell size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Bell size={24} /> Alertas y Obligaciones</h3>
          <p className="text-amber-100 text-sm mt-1">Vencimientos mensuales (IERIC, FODECO) con recordatorios automáticos. Día actual: {today}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-ecar-blueDark transition-colors">
          <Plus size={16} /> Nueva Obligación
        </button>
      </div>

      {/* Upload feedback */}
      {uploadFeedback && (
        <div className={`rounded-xl p-4 flex justify-between items-center ${uploadFeedback.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm font-bold ${uploadFeedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{uploadFeedback.msg}</p>
          <button onClick={() => setUploadFeedback(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nueva Obligación</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <input placeholder="Nombre (ej: IERIC)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Día de vencimiento</label>
                <input type="number" min={1} max={31} value={form.due_day_of_month} onChange={e => setForm({ ...form, due_day_of_month: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Monto ARS</label>
                <input type="number" value={form.amount_ars} onChange={e => setForm({ ...form, amount_ars: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <button onClick={handleCreate} disabled={!form.name || createObligation.isPending} className="w-full bg-ecar-blue text-white py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {createObligation.isPending ? 'Creando...' : 'Crear Obligación'}
            </button>
          </div>
        </div>
      )}

      {/* Obligations grid */}
      {obligations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay obligaciones registradas</p>
          <p className="text-sm">Creá una nueva obligación para comenzar a recibir recordatorios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {obligations.map(obl => {
            const payments = (obl as any).payments || [];
            return (
              <div key={obl.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900">{obl.name}</h4>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[obl.status]}`}>
                        {statusLabel[obl.status]}
                      </span>
                    </div>
                  </div>
                  {obl.description && <p className="text-sm text-gray-500 mb-3">{obl.description}</p>}
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-gray-900 font-mono">{formatARS(obl.amount_ars)}</span>
                    <span className="text-sm text-gray-500">Vence el <strong>{obl.due_day_of_month}</strong> de cada mes</span>
                  </div>
                  {payments.length > 0 && (
                    <p className="text-xs text-green-600 font-bold mt-2">{payments.length} pago(s) registrado(s)</p>
                  )}
                </div>
                <div className="bg-gray-50 p-3 border-t border-gray-100 flex flex-wrap gap-1.5 items-center justify-between">
                  <div className="flex gap-1">
                    <button onClick={() => { setPayingObl(obl); setPayAmount(String(obl.amount_ars)); }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1">
                      <DollarSign size={12} /> Pagar Mes
                    </button>
                    <label className="bg-ecar-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-ecar-blueDark transition-colors flex items-center gap-1">
                      <Upload size={12} /> Comprobante
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => e.target.files?.[0] && handleUploadReceipt(obl.id, e.target.files[0])} />
                    </label>
                  </div>
                  <div className="flex gap-1">
                    {payments.length > 0 && (
                      <button onClick={() => setViewPayments(viewPayments === obl.id ? null : obl.id)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Ver pagos"><Eye size={14} /></button>
                    )}
                    <button onClick={() => { setEditingObl(obl); setEditForm({ name: obl.name, description: obl.description || '', due_day_of_month: obl.due_day_of_month, amount_ars: obl.amount_ars, status: obl.status }); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(obl)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </div>
                {/* Payments History */}
                {viewPayments === obl.id && payments.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Historial de Pagos</p>
                    <div className="space-y-1.5">
                      {payments.sort((a: any, b: any) => (b.payment_date || '').localeCompare(a.payment_date || '')).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-green-500" />
                            <span className="font-mono text-gray-600">{p.payment_date}</span>
                            {p.notes && <span className="text-gray-400">— {p.notes}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{formatARS(p.amount_paid_ars || 0)}</span>
                            {p.receipt_url && <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Month Modal */}
      {payingObl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Registrar Pago — {payingObl.name}</h3>
              <button onClick={() => setPayingObl(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Mes</label>
                <select value={payMonth} onChange={e => setPayMonth(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-sm">
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Año</label>
                <select value={payYear} onChange={e => setPayYear(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-sm">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Monto Pagado ($)</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              Se registrará el pago de <strong>{payingObl.name}</strong> correspondiente a <strong>{MONTHS[payMonth]} {payYear}</strong> por <strong>{formatARS(parseFloat(payAmount) || 0)}</strong>.
            </div>
            <button onClick={handlePayMonth} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors">
              ✓ Registrar Pago
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingObl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Editar Obligación</h3>
              <button onClick={() => setEditingObl(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Nombre" />
            <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Descripción" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Día Vencimiento</label>
                <input type="number" min={1} max={31} value={editForm.due_day_of_month} onChange={e => setEditForm({ ...editForm, due_day_of_month: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Monto ($)</label>
                <input type="number" value={editForm.amount_ars} onChange={e => setEditForm({ ...editForm, amount_ars: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Estado</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="overdue">Vencido</option>
                <option value="notified">Notificado</option>
              </select>
            </div>
            <button
              onClick={async () => {
                try { await updateObligation.mutateAsync({ id: editingObl.id, ...editForm }); setEditingObl(null); } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); }
              }}
              disabled={updateObligation.isPending || !editForm.name}
              className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-ecar-blueDark transition-colors"
            >
              {updateObligation.isPending ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Eliminar Obligación</h3>
            <p className="text-sm text-gray-600">
              ¿Eliminás <span className="font-bold">{deleteTarget.name}</span>? Se borrarán también los pagos asociados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Cancelar</button>
              <button
                onClick={async () => { try { await deleteObligation.mutateAsync(deleteTarget.id); setDeleteTarget(null); } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); } }}
                disabled={deleteObligation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 disabled:opacity-50"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification System */}
      <div className="border-t border-gray-200 pt-6">
        <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 p-6 opacity-10"><MessageSquare size={120} /></div>
          <div className="relative z-10">
            <h3 className="font-bold text-2xl flex items-center gap-2"><MessageSquare size={24} /> Notificaciones WhatsApp</h3>
            <p className="text-green-100 text-sm mt-1">Configurá recordatorios y enviá alertas automáticas a tus contactos.</p>
          </div>
        </div>
        <NotificationPanel />
      </div>
    </div>
  );
};
