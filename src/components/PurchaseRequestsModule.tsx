import React, { useState, useMemo } from 'react';
import {
  ShoppingBag, Plus, X, Check, XCircle, Clock, AlertTriangle,
  Building2, Package
} from 'lucide-react';
import {
  usePurchaseRequests, useCreatePurchaseRequest, useUpdatePurchaseRequest, useProjects
} from '../hooks/useData';
import type { PurchaseRequestItem } from '../lib/types';

const URGENCY_LABEL: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  consolidated: { label: 'Consolidado', color: 'bg-blue-100 text-blue-700' },
  ordered: { label: 'Pedido', color: 'bg-purple-100 text-purple-700' },
  received: { label: 'Recibido', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
};

export const PurchaseRequestsModule: React.FC = () => {
  const { data: requests, isLoading } = usePurchaseRequests();
  const { data: projects } = useProjects();
  const createRequest = useCreatePurchaseRequest();
  const updateRequest = useUpdatePurchaseRequest();

  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ project_id: '', urgency: 'normal', requested_by: '', notes: '' });
  const [formItems, setFormItems] = useState<{ description: string; quantity: string; unit: string }[]>([{ description: '', quantity: '1', unit: 'unidad' }]);

  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter(r => !filterStatus || r.status === filterStatus);
  }, [requests, filterStatus]);

  const pendingCount = useMemo(() => (requests || []).filter(r => r.status === 'pending').length, [requests]);
  const urgentCount = useMemo(() => (requests || []).filter(r => r.urgency === 'urgent' && r.status === 'pending').length, [requests]);

  const addItem = () => setFormItems([...formItems, { description: '', quantity: '1', unit: 'unidad' }]);
  const removeItem = (i: number) => setFormItems(formItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => setFormItems(formItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formItems.filter(i => i.description.trim());
    if (!validItems.length) return;
    await createRequest.mutateAsync({
      project_id: form.project_id || null,
      urgency: form.urgency as any,
      requested_by: form.requested_by || null,
      notes: form.notes || null,
      items: validItems.map(i => ({ description: i.description, quantity: parseFloat(i.quantity) || 1, unit: i.unit })),
    } as any);
    setShowNew(false);
    setForm({ project_id: '', urgency: 'normal', requested_by: '', notes: '' });
    setFormItems([{ description: '', quantity: '1', unit: 'unidad' }]);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-800 to-violet-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ShoppingBag size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ShoppingBag size={24} /> Pedidos de Compra</h3>
          <p className="text-violet-100 text-sm mt-1">Consolidación de pedidos desde obra para negociar mejores precios</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-white border rounded-xl p-5 shadow-sm ${pendingCount > 0 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Clock size={16} className="text-yellow-500" /> Pendientes</div>
          <p className="text-2xl font-black text-yellow-600 font-mono">{pendingCount}</p>
        </div>
        <div className={`bg-white border rounded-xl p-5 shadow-sm ${urgentCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Urgentes</div>
          <p className="text-2xl font-black text-red-600 font-mono">{urgentCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><ShoppingBag size={16} className="text-violet-500" /> Total Pedidos</div>
          <p className="text-2xl font-black text-violet-600 font-mono">{(requests || []).length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowNew(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
          <Plus size={16} /> Nuevo Pedido
        </button>
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400"><ShoppingBag size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No hay pedidos de compra</p><p className="text-sm">Los pedidos se pueden crear desde acá o por WhatsApp con Rombo</p></div>
        )}
        {filtered.map(req => {
          const items = (req.items || []) as PurchaseRequestItem[];
          const urg = URGENCY_LABEL[req.urgency] || URGENCY_LABEL.normal;
          const stat = STATUS_LABEL[req.status] || STATUS_LABEL.pending;
          return (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stat.color}`}>{stat.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${urg.color}`}>{urg.label}</span>
                    {req.project && <span className="text-xs text-gray-500 flex items-center gap-1"><Building2 size={12} /> {(req.project as any)?.name}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Por: {req.requested_by || '—'} · {new Date(req.created_at).toLocaleDateString('es-AR')}</p>
                  {req.notes && <p className="text-sm text-gray-500 mt-1">{req.notes}</p>}
                  {items.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {items.map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs">
                          <Package size={12} className="text-gray-400" />
                          {item.quantity} {item.unit} — {item.description}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'approved', approved_at: new Date().toISOString() })} className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-all" title="Aprobar"><Check size={16} className="text-green-700" /></button>
                    <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'rejected' })} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-all" title="Rechazar"><XCircle size={16} className="text-red-700" /></button>
                  </div>
                )}
                {req.status === 'approved' && (
                  <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'ordered' })} className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold hover:bg-purple-200 transition-all">Marcar Pedido</button>
                )}
                {req.status === 'ordered' && (
                  <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'received' })} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-all">Recibido ✅</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo Pedido */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Nuevo Pedido de Compra</h3><button onClick={() => setShowNew(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Obra</label><select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Seleccioná...</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500">Urgencia</label><select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="low">Baja</option><option value="normal">Normal</option><option value="urgent">Urgente</option></select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Solicitado por</label><input value={form.requested_by} onChange={e => setForm({ ...form, requested_by: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Nombre del capataz" /></div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Materiales Solicitados</label>
                {formItems.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Descripción material" />
                    <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className="w-16 px-2 py-2 border border-gray-300 rounded-xl text-sm font-mono text-center" />
                    <input value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="w-20 px-2 py-2 border border-gray-300 rounded-xl text-sm" />
                    {formItems.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>}
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-xs text-ecar-blue font-bold hover:underline">+ Agregar otro material</button>
              </div>

              <div><label className="text-xs font-bold text-gray-500">Notas</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" rows={2} placeholder="Notas adicionales" /></div>

              <button type="submit" disabled={createRequest.isPending} className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-violet-700 transition-all shadow-md disabled:opacity-50">
                {createRequest.isPending ? 'Creando...' : '🛒 Crear Pedido de Compra'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
