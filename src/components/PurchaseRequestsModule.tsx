import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag, Plus, X, Check, XCircle, Clock, AlertTriangle,
  Building2, Package, Smartphone, Shield, Save, CheckCircle2
} from 'lucide-react';
import {
  usePurchaseRequests, useCreatePurchaseRequest, useUpdatePurchaseRequest, useProjects,
  useSystemSetting, useUpsertSystemSetting, useInventoryItems, useUpdatePurchaseRequestItems
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
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
  quoted: { label: 'Cotizado', color: 'bg-teal-100 text-teal-700' },
};

const formatPhone = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const cc = clean.slice(0, clean.length - 10);
    const area = clean.slice(-10, -7);
    const rest = clean.slice(-7, -4) + '-' + clean.slice(-4);
    return `+${cc} ${area} ${rest}`;
  }
  return phone;
};

export const PurchaseRequestsModule: React.FC = () => {
  const { user } = useAuth();
  const { data: requests, isLoading } = usePurchaseRequests();
  const { data: projects } = useProjects();
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: whatsappSetting } = useSystemSetting('whatsapp_purchase_phone');
  const createRequest = useCreatePurchaseRequest();
  const updateRequest = useUpdatePurchaseRequest();
  const upsertSetting = useUpsertSystemSetting();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  const [showNew, setShowNew] = useState(false);
  const [showWhatsappConfig, setShowWhatsappConfig] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'obra' | 'quote'>('obra');
  const [form, setForm] = useState({ project_id: '', urgency: 'normal', requested_by: '', notes: '' });
  const [formItems, setFormItems] = useState<{ description: string; quantity: string; unit: string; inventoryItemId: string; searchText: string; showDropdown: boolean }[]>([{ description: '', quantity: '1', unit: 'unidad', inventoryItemId: '', searchText: '', showDropdown: false }]);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});

  const updateQuoteItems = useUpdatePurchaseRequestItems();

  useEffect(() => {
    if (whatsappSetting?.value !== undefined) {
      setWhatsappPhone(whatsappSetting.value);
    }
  }, [whatsappSetting]);

  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter(r => {
      const typeMatch = activeTab === 'quote' ? r.request_type === 'quote' : (r.request_type === 'purchase' || !r.request_type);
      return typeMatch && (!filterStatus || r.status === filterStatus);
    });
  }, [requests, filterStatus, activeTab]);

  const pendingCount = useMemo(() => (requests || []).filter(r => r.status === 'pending' && (r.request_type === 'purchase' || !r.request_type)).length, [requests]);
  const urgentCount = useMemo(() => (requests || []).filter(r => r.urgency === 'urgent' && r.status === 'pending' && (r.request_type === 'purchase' || !r.request_type)).length, [requests]);

  const addItem = () => setFormItems([...formItems, { description: '', quantity: '1', unit: 'unidad', inventoryItemId: '', searchText: '', showDropdown: false }]);
  const removeItem = (i: number) => setFormItems(formItems.filter((_, idx) => idx !== i));
  const updateItemField = (i: number, field: string, value: string) => setFormItems(formItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const selectInventoryItem = (i: number, invItem: { id: string; name: string; unit: string; category?: string }) => {
    setFormItems(formItems.map((item, idx) => idx === i ? {
      ...item,
      description: invItem.name,
      unit: invItem.unit || 'unidad',
      inventoryItemId: invItem.id,
      searchText: invItem.name,
      showDropdown: false,
    } : item));
  };

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
    setFormItems([{ description: '', quantity: '1', unit: 'unidad', inventoryItemId: '', searchText: '', showDropdown: false }]);
  };

  const handleSavePhone = async () => {
    const clean = whatsappPhone.replace(/\D/g, '');
    await upsertSetting.mutateAsync({
      key: 'whatsapp_purchase_phone',
      value: clean,
      description: 'Número de WhatsApp autorizado para pedidos de insumos',
    });
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 3000);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin" /></div>;

  const phoneConfigured = !!(whatsappSetting?.value);

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

      {/* WhatsApp Authorization Card */}
      <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${phoneConfigured ? 'border-green-200' : 'border-orange-200'}`}>
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phoneConfigured ? 'bg-green-100' : 'bg-orange-100'}`}>
              <Smartphone size={20} className={phoneConfigured ? 'text-green-600' : 'text-orange-600'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-gray-800">WhatsApp Autorizado para Pedidos</p>
                {phoneConfigured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Activo</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">No configurado</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {phoneConfigured
                  ? <>Solo el número <span className="font-mono font-bold text-gray-600">{formatPhone(whatsappSetting!.value)}</span> puede hacer pedidos por WhatsApp</>
                  : 'Configurá un número para que el encargado de obra pueda pedir insumos desde WhatsApp'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowWhatsappConfig(!showWhatsappConfig)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${showWhatsappConfig ? 'bg-gray-100 text-gray-600' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
            {showWhatsappConfig ? <><X size={14} /> Cerrar</> : <><Shield size={14} /> Configurar</>}
          </button>
        </div>

        {/* Expanded config */}
        {showWhatsappConfig && (
          <div className="px-4 pb-4 pt-0 border-t border-gray-100">
            <div className="bg-gray-50 rounded-xl p-4 mt-3 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Número de WhatsApp Autorizado</label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={whatsappPhone}
                      onChange={e => { setWhatsappPhone(e.target.value); setPhoneSaved(false); }}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                      placeholder="Ej: 5492641234567"
                    />
                  </div>
                  <button
                    onClick={handleSavePhone}
                    disabled={upsertSetting.isPending}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${phoneSaved ? 'bg-green-500 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'} disabled:opacity-50`}
                  >
                    {upsertSetting.isPending ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                    ) : phoneSaved ? (
                      <><CheckCircle2 size={16} /> ¡Guardado!</>
                    ) : (
                      <><Save size={16} /> Guardar</>
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                <p className="text-xs text-violet-700 font-medium flex items-center gap-1.5">
                  <Shield size={14} /> <span className="font-bold">¿Cómo funciona?</span>
                </p>
                <ul className="text-xs text-violet-600 mt-1.5 space-y-1 ml-5">
                  <li>• Solo este número podrá crear pedidos de compra vía WhatsApp con Rombo</li>
                  <li>• El encargado manda un mensaje como <span className="font-mono bg-violet-100 px-1 rounded">"necesito 50 bolsas de cemento urgente"</span></li>
                  <li>• Rombo crea automáticamente el pedido en el sistema</li>
                  <li>• Si otro número intenta hacer un pedido, será rechazado</li>
                  <li>• Dejá el campo vacío para deshabilitar pedidos por WhatsApp</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => { setActiveTab('obra'); setFilterStatus(''); }} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'obra' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Pedidos de Obra</button>
        <button onClick={() => { setActiveTab('quote'); setFilterStatus(''); }} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'quote' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Cotizaciones de Presupuestos</button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex-1" />
        {activeTab === 'obra' && (
          <button onClick={() => setShowNew(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
            <Plus size={16} /> Nuevo Pedido
          </button>
        )}
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
                {req.status === 'pending' && activeTab === 'obra' && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'approved', approved_at: new Date().toISOString() })} className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-all" title="Aprobar"><Check size={16} className="text-green-700" /></button>
                    <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'rejected' })} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-all" title="Rechazar"><XCircle size={16} className="text-red-700" /></button>
                  </div>
                )}
                {req.status === 'approved' && activeTab === 'obra' && (
                  <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'ordered' })} className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold hover:bg-purple-200 transition-all">Marcar Pedido</button>
                )}
                {req.status === 'ordered' && activeTab === 'obra' && (
                  <button onClick={() => updateRequest.mutateAsync({ id: req.id, status: 'received' })} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-all">Recibido ✅</button>
                )}
                
                {/* Quote Actions */}
                {activeTab === 'quote' && req.status === 'pending' && editingQuoteId !== req.id && (
                  <button onClick={() => {
                    const initialPrices: Record<string, number> = {};
                    items.forEach(i => { initialPrices[i.id] = i.estimated_unit_cost || 0; });
                    setQuotePrices(initialPrices);
                    setEditingQuoteId(req.id);
                  }} className="px-4 py-2 rounded-lg bg-teal-100 text-teal-700 text-xs font-bold hover:bg-teal-200 transition-all">Cotizar</button>
                )}
              </div>
              
              {/* Quote Editing UI */}
              {editingQuoteId === req.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Ingresar Precios Unitarios (ARS)</h4>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 bg-white p-2 border border-gray-200 rounded-lg">
                        <div className="flex-1 text-sm">{item.description}</div>
                        <div className="w-24 text-right text-xs text-gray-500">{item.quantity} {item.unit}</div>
                        <div className="w-32 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">$</span>
                          <input 
                            type="number" 
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            value={quotePrices[item.id] || ''} 
                            onChange={e => setQuotePrices({...quotePrices, [item.id]: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setEditingQuoteId(null)} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>
                    <button 
                      onClick={async () => {
                        const itemsToUpdate = items.map(i => ({ id: i.id, estimated_unit_cost: quotePrices[i.id] || 0, budget_item_id: i.budget_item_id }));
                        await updateQuoteItems.mutateAsync(itemsToUpdate);
                        await updateRequest.mutateAsync({ id: req.id, status: 'quoted' });
                        setEditingQuoteId(null);
                      }} 
                      disabled={updateQuoteItems.isPending || updateRequest.isPending}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      {(updateQuoteItems.isPending || updateRequest.isPending) ? 'Guardando...' : 'Enviar Cotización a Presupuestos'}
                    </button>
                  </div>
                </div>
              )}
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
              <div><label className="text-xs font-bold text-gray-500">Solicitado por</label><input value={form.requested_by || userName} onChange={e => setForm({ ...form, requested_by: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-gray-50" readOnly /></div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Materiales / Herramientas Solicitados</label>
                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
                  <Package size={10} /> Solo se pueden solicitar ítems registrados en el inventario
                </p>
                {formItems.map((item, i) => {
                  const q = (item.searchText || '').toLowerCase();
                  const filtered = inventoryItems
                    .filter(inv =>
                      inv.name.toLowerCase().includes(q) ||
                      (inv.category || '').toLowerCase().includes(q)
                    )
                    .sort((a, b) => {
                      // Prioritize herramientas
                      const aIsTool = (a.category || '').toLowerCase().includes('herramienta') ? 0 : 1;
                      const bIsTool = (b.category || '').toLowerCase().includes('herramienta') ? 0 : 1;
                      if (aIsTool !== bIsTool) return aIsTool - bIsTool;
                      return a.name.localeCompare(b.name);
                    });
                  return (
                    <div key={i} className="flex gap-2 mb-2 relative">
                      <div className="flex-1 relative">
                        <input
                          value={item.searchText}
                          onChange={e => {
                            const newItems = [...formItems];
                            newItems[i] = { ...newItems[i], searchText: e.target.value, showDropdown: true, description: '', inventoryItemId: '' };
                            setFormItems(newItems);
                          }}
                          onFocus={() => {
                            const newItems = [...formItems];
                            newItems[i] = { ...newItems[i], showDropdown: true };
                            setFormItems(newItems);
                          }}
                          onBlur={() => setTimeout(() => {
                            const newItems = [...formItems];
                            newItems[i] = { ...newItems[i], showDropdown: false };
                            setFormItems(newItems);
                          }, 200)}
                          className={`w-full px-3 py-2 border rounded-xl text-sm transition-all ${
                            item.inventoryItemId
                              ? 'border-green-300 bg-green-50/50 focus:ring-green-500/30 focus:border-green-500'
                              : 'border-gray-300 focus:ring-ecar-blue/30 focus:border-ecar-blue'
                          } focus:outline-none focus:ring-2`}
                          placeholder="Buscá en el inventario..."
                        />
                        {item.inventoryItemId && (
                          <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                        )}
                        {item.showDropdown && !item.inventoryItemId && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                            {filtered.length === 0 ? (
                              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                                {q ? `No se encontró "${item.searchText}" en inventario` : 'Escribí para buscar...'}
                              </div>
                            ) : (
                              filtered.slice(0, 12).map(inv => {
                                const isTool = (inv.category || '').toLowerCase().includes('herramienta');
                                return (
                                  <button
                                    key={inv.id}
                                    type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => selectInventoryItem(i, inv)}
                                    className="w-full text-left px-3 py-2 hover:bg-violet-50 flex items-center gap-2 text-sm transition-colors border-b border-gray-50 last:border-0"
                                  >
                                    <Package size={14} className={isTool ? 'text-amber-500' : 'text-violet-400'} />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-gray-800 truncate block">{inv.name}</span>
                                      <span className="text-[10px] text-gray-400">
                                        {isTool && '🔧 '}{inv.category || 'Sin categoría'} · {inv.unit}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                                      Stock: {inv.current_stock ?? '—'}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                      <input type="number" value={item.quantity} onChange={e => updateItemField(i, 'quantity', e.target.value)} className="w-16 px-2 py-2 border border-gray-300 rounded-xl text-sm font-mono text-center" />
                      <input value={item.unit} readOnly className="w-20 px-2 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" title="Unidad del inventario" />
                      {formItems.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>}
                    </div>
                  );
                })}
                <button type="button" onClick={addItem} className="text-xs text-ecar-blue font-bold hover:underline">+ Agregar otro material</button>
              </div>

              <div><label className="text-xs font-bold text-gray-500">Notas</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" rows={2} placeholder="Notas adicionales" /></div>

              <button type="submit" disabled={createRequest.isPending || !formItems.some(fi => fi.inventoryItemId)} className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-violet-700 transition-all shadow-md disabled:opacity-50">
                {createRequest.isPending ? 'Creando...' : '🛒 Crear Pedido de Compra'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
