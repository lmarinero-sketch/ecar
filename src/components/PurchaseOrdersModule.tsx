import React, { useState, useMemo } from 'react';
import {
  FileSignature, Search, Plus, X, Save, Eye, Trash2,
  Clock, DollarSign, AlertTriangle, Package, BarChart3,
} from 'lucide-react';
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrder, useProjects, useSuppliers, usePurchaseRequests } from '../hooks/useData';
import type { PurchaseOrder } from '../lib/types';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const PO_STATUSES: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  pendiente_aprobacion: { label: 'Pend. Aprobación', color: 'bg-yellow-100 text-yellow-700' },
  aprobada: { label: 'Aprobada', color: 'bg-blue-100 text-blue-700' },
  emitida: { label: 'Emitida', color: 'bg-indigo-100 text-indigo-700' },
  entregada_parcial: { label: 'Entrega Parcial', color: 'bg-orange-100 text-orange-700' },
  entregada: { label: 'Entregada', color: 'bg-green-100 text-green-700' },
  cerrada: { label: 'Cerrada', color: 'bg-emerald-100 text-emerald-700' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

const ORDER_TYPES: Record<string, string> = {
  compra: 'Compra',
  servicio: 'Servicio / OT',
  alquiler: 'Alquiler',
};

type LineItem = { description: string; quantity: number; unit: string; unit_price: number; subtotal: number };

export const PurchaseOrdersModule: React.FC = () => {
  const { data: orders, isLoading } = usePurchaseOrders();
  const { data: projects } = useProjects();
  const { data: suppliers } = useSuppliers();
  const { data: purchaseRequests } = usePurchaseRequests();
  const createPO = useCreatePurchaseOrder();
  const updatePO = useUpdatePurchaseOrder();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({
    po_number: '',
    supplier_name: '',
    supplier_id: '',
    project_id: '',
    request_id: '',
    order_type: 'compra' as PurchaseOrder['order_type'],
    items: [{ description: '', quantity: 1, unit: 'un', unit_price: 0, subtotal: 0 }] as LineItem[],
    total_amount: 0,
    payment_condition: '',
    delivery_date: '',
    delivery_location: '',
    status: 'borrador' as PurchaseOrder['status'],
    urgency: false,
    urgency_reason: '',
    notes: '',
  });

  const filtered = useMemo(() => {
    if (!orders) return [];
    let result = orders;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(po => po.po_number.toLowerCase().includes(s) || po.supplier_name.toLowerCase().includes(s));
    }
    if (filterStatus !== 'all') result = result.filter(po => po.status === filterStatus);
    return result;
  }, [orders, search, filterStatus]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, abiertas: 0, montoTotal: 0, urgentes: 0 };
    const abiertas = orders.filter(po => !['cerrada', 'cancelada'].includes(po.status));
    return {
      total: orders.length,
      abiertas: abiertas.length,
      montoTotal: abiertas.reduce((s, po) => s + po.total_amount, 0),
      urgentes: orders.filter(po => po.urgency).length,
    };
  }, [orders]);

  const nextPONumber = useMemo(() => {
    if (!orders || orders.length === 0) return 'OC-0001';
    const maxNum = orders.reduce((max, po) => {
      const match = po.po_number.match(/OC-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `OC-${String(maxNum + 1).padStart(4, '0')}`;
  }, [orders]);

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...form.items];
    (newItems[index] as Record<string, unknown>)[field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price;
    }
    const total = newItems.reduce((s, i) => s + i.subtotal, 0);
    setForm({ ...form, items: newItems, total_amount: total });
  };

  const addLineItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit: 'un', unit_price: 0, subtotal: 0 }] });
  };

  const removeLineItem = (index: number) => {
    if (form.items.length <= 1) return;
    const newItems = form.items.filter((_, i) => i !== index);
    const total = newItems.reduce((s, i) => s + i.subtotal, 0);
    setForm({ ...form, items: newItems, total_amount: total });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        po_number: form.po_number || nextPONumber,
        project_id: form.project_id || null,
        supplier_id: form.supplier_id || null,
        request_id: form.request_id || null,
        approval_status: form.total_amount > 5000000 ? 'pendiente' as const : 'no_requerida' as const,
        status: form.total_amount > 5000000 && !selectedPO ? 'pendiente_aprobacion' : form.status,
      };
      if (selectedPO) {
        await updatePO.mutateAsync({ id: selectedPO.id, ...payload });
      } else {
        await createPO.mutateAsync(payload);
      }
      setShowForm(false);
      setSelectedPO(null);
      resetForm();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setForm({
      po_number: '', supplier_name: '', supplier_id: '', project_id: '', request_id: '', order_type: 'compra',
      items: [{ description: '', quantity: 1, unit: 'un', unit_price: 0, subtotal: 0 }],
      total_amount: 0, payment_condition: '', delivery_date: '', delivery_location: '',
      status: 'borrador', urgency: false, urgency_reason: '', notes: '',
    });
  };

  const openEdit = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setForm({
      po_number: po.po_number, supplier_name: po.supplier_name,
      supplier_id: po.supplier_id || '', project_id: po.project_id || '', request_id: po.request_id || '',
      order_type: po.order_type,
      items: (po.items && po.items.length > 0) ? po.items : [{ description: '', quantity: 1, unit: 'un', unit_price: 0, subtotal: 0 }],
      total_amount: po.total_amount, payment_condition: po.payment_condition || '',
      delivery_date: po.delivery_date || '', delivery_location: po.delivery_location || '',
      status: po.status, urgency: po.urgency, urgency_reason: po.urgency_reason || '',
      notes: po.notes || '',
    });
    setShowForm(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-violet-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-ecar-blue rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 text-ecar-blue"><FileSignature size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-gray-900"><FileSignature size={24} className="text-ecar-blue" /> Órdenes de Compra / Trabajo</h3>
          <p className="text-gray-500 text-sm mt-1">Gerencia de Compras — Doc PR-GC-01</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total OC/OT', value: stats.total, icon: <FileSignature size={16} />, color: 'text-gray-700' },
          { label: 'Abiertas', value: stats.abiertas, icon: <Clock size={16} />, color: 'text-blue-600' },
          { label: 'Monto Abierto', value: fmt(stats.montoTotal), icon: <DollarSign size={16} />, color: 'text-emerald-600' },
          { label: 'Urgentes', value: stats.urgentes, icon: <AlertTriangle size={16} />, color: 'text-red-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${kpi.color} mb-1`}>{kpi.icon} {kpi.label}</div>
            <div className="text-xl font-bold text-gray-800">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por número o proveedor..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="all">Todos los estados</option>
            {Object.entries(PO_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => { resetForm(); setSelectedPO(null); setForm(f => ({ ...f, po_number: nextPONumber })); setShowForm(true); }}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-violet-700 transition-all">
            <Plus size={16} /> Nueva OC / OT
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="light-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">OC #</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(po => (
              <tr key={po.id} className={`hover:bg-gray-50 ${po.urgency ? 'border-l-4 border-l-red-500' : ''}`}>
                <td className="px-4 py-3 font-mono font-bold text-gray-800">
                  <div className="flex items-center gap-1.5">
                    {po.urgency && <AlertTriangle size={14} className="text-red-500" />}
                    {po.po_number}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{po.supplier_name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{ORDER_TYPES[po.order_type] || po.order_type}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{po.project?.name || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PO_STATUSES[po.status]?.color || 'bg-gray-100'}`}>
                    {PO_STATUSES[po.status]?.label || po.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{fmt(po.total_amount)}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEdit(po)} className="text-violet-600 hover:text-violet-800 p-1"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay órdenes de compra</p>
                <p className="text-sm">Hacé clic en "Nueva OC / OT" para emitir una.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileSignature size={20} className="text-violet-600" />
                {selectedPO ? `Editar ${form.po_number}` : 'Nueva Orden de Compra / Trabajo'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Número OC</label>
                  <input value={form.po_number} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tipo</label>
                  <select value={form.order_type} onChange={e => setForm({ ...form, order_type: e.target.value as PurchaseOrder['order_type'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(ORDER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PurchaseOrder['status'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(PO_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 bg-red-50 rounded-lg p-2.5 cursor-pointer w-full border border-red-200">
                    <input type="checkbox" checked={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.checked })} className="rounded border-gray-300 text-red-600" />
                    <span className="text-sm font-bold text-red-700">🚨 Urgente</span>
                  </label>
                </div>
              </div>

              {/* Supplier + Project + Request */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Proveedor *</label>
                  <select value={form.supplier_id} onChange={e => {
                    const sup = (suppliers || []).find(s => s.id === e.target.value);
                    setForm({ ...form, supplier_id: e.target.value, supplier_name: sup?.name || form.supplier_name });
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleccionar o escribir abajo</option>
                    {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="O escribir nombre del proveedor" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Proyecto (Opcional)</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Uso General / Sin Proyecto</option>
                    {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Solicitud Origen (Trazabilidad)</label>
                  <select value={form.request_id} onChange={e => setForm({ ...form, request_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-violet-700 bg-violet-50 focus:border-violet-300 focus:ring-violet-300">
                    <option value="">Sin solicitud vinculada</option>
                    {(purchaseRequests || []).filter(r => r.status === 'approved' || r.id === form.request_id).map(r => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.created_at).toLocaleDateString('es-AR')} - {r.items?.[0]?.description} {r.items && r.items.length > 1 ? `(+${r.items.length - 1} más)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-700">Ítems de la Orden</h4>
                  <button onClick={addLineItem} className="text-violet-600 hover:text-violet-800 text-xs font-bold flex items-center gap-1">
                    <Plus size={14} /> Agregar Ítem
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 px-1">
                    <div className="col-span-5">Descripción</div>
                    <div className="col-span-1">Cant.</div>
                    <div className="col-span-1">Unidad</div>
                    <div className="col-span-2">Precio Unit.</div>
                    <div className="col-span-2">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)}
                        className="col-span-5 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Material o servicio" />
                      <input type="number" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))}
                        className="col-span-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center" />
                      <input value={item.unit} onChange={e => updateLineItem(i, 'unit', e.target.value)}
                        className="col-span-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center" />
                      <input type="number" value={item.unit_price} onChange={e => updateLineItem(i, 'unit_price', Number(e.target.value))}
                        className="col-span-2 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right" />
                      <div className="col-span-2 text-right font-mono font-bold text-sm text-gray-800">{fmt(item.subtotal)}</div>
                      <button onClick={() => removeLineItem(i)} className="col-span-1 text-red-400 hover:text-red-600 p-1 flex justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <div className="text-right">
                      <span className="text-xs text-gray-500 mr-3">TOTAL</span>
                      <span className="font-mono font-bold text-lg text-gray-800">{fmt(form.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery + Payment */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Fecha de Entrega</label>
                  <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Lugar de Entrega</label>
                  <input value={form.delivery_location} onChange={e => setForm({ ...form, delivery_location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Depósito / Obra" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Condición de Pago</label>
                  <input value={form.payment_condition} onChange={e => setForm({ ...form, payment_condition: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Contado / 30 días / etc." />
                </div>
              </div>

              {form.urgency && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Motivo de Urgencia</label>
                  <input value={form.urgency_reason} onChange={e => setForm({ ...form, urgency_reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm border-red-300" placeholder="¿Por qué es urgente?" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Notas</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Observaciones..." />
              </div>

              {/* Cuadro Comparativo (PR-GC-01 §4.5) */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <BarChart3 size={16} className="text-violet-500" /> Cuadro Comparativo de Cotizaciones
                </h4>
                <p className="text-[10px] text-gray-400 mb-3">Documentar al menos 3 cotizaciones para compras {'>'} $500.000 (PR-GC-01 §4.5)</p>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
                      <p className="text-xs font-bold text-gray-600">Cotización #{n}</p>
                      <input className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs" placeholder={`Proveedor ${n}`} />
                      <input type="number" className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs font-mono" placeholder="Monto $" />
                      <input className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs" placeholder="Plazo / Condiciones" />
                    </div>
                  ))}
                </div>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs mt-2" rows={2} placeholder="Justificación de elección: precio, calidad, plazo, experiencia previa..." />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
              <div className="pt-2 flex items-center justify-between">
                {form.total_amount > 5000000 && !selectedPO && (
                  <div className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                    ⚠️ Esta OC superará el umbral ($5,000,000) y requerirá Aprobación de GG.
                  </div>
                )}
                {!form.total_amount || (form.total_amount <= 5000000 || selectedPO) ? <div /> : null}
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold text-sm transition-all">Cancelar</button>
                  <button onClick={handleSubmit} disabled={createPO.isPending || updatePO.isPending}
                    className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-violet-700 shadow-md transition-all disabled:opacity-50">
                    {createPO.isPending || updatePO.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando</> : <><Save size={16} /> Guardar OC</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
