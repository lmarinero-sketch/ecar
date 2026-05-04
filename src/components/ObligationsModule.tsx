import React, { useState } from 'react';
import { Bell, Plus, Upload, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { useObligations, useCreateObligation } from '../hooks/useData';
import { supabase } from '../lib/supabase';

export const ObligationsModule: React.FC = () => {
  const { data: obligations = [], isLoading } = useObligations();
  const createObligation = useCreateObligation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', due_day_of_month: 15, amount_ars: 0, recurrence: 'monthly' as const });

  const today = new Date().getDate();

  const statusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} className="text-green-500" />;
      case 'overdue': return <AlertTriangle size={16} className="text-red-500" />;
      case 'notified': return <Bell size={16} className="text-yellow-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

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
    const path = `receipts/${obligationId}/${file.name}`;
    const { error } = await supabase.storage.from('obligation-docs').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('obligation-docs').getPublicUrl(path);
      await supabase.from('obligation_payments').insert({
        obligation_id: obligationId,
        payment_date: new Date().toISOString().split('T')[0],
        amount_paid_ars: 0,
        receipt_url: publicUrl,
      });
      await supabase.from('obligations').update({ status: 'paid' }).eq('id', obligationId);
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando obligaciones...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Bell size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Bell size={24} /> Alertas y Obligaciones</h3>
          <p className="text-amber-100 text-sm mt-1">Vencimientos mensuales (Yeric, Fodeco) con recordatorios automáticos. Día actual: {today}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-ecar-blueDark transition-colors">
          <Plus size={16} /> Nueva Obligación
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nueva Obligación</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <input placeholder="Nombre (ej: Yeric)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
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
          {obligations.map(obl => (
            <div key={obl.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900">{obl.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[obl.status]}`}>
                    {statusIcon(obl.status)} {statusLabel[obl.status]}
                  </span>
                </div>
                {obl.description && <p className="text-sm text-gray-500 mb-3">{obl.description}</p>}
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-gray-900 font-mono">A$ {obl.amount_ars.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">Vence el <strong>{obl.due_day_of_month}</strong> de cada mes</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase font-bold">{obl.recurrence}</span>
                <label className="bg-ecar-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-ecar-blueDark transition-colors flex items-center gap-1">
                  <Upload size={14} /> Subir comprobante
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => e.target.files?.[0] && handleUploadReceipt(obl.id, e.target.files[0])} />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
