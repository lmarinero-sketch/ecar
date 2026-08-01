import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag, Plus, X, AlertTriangle, Clock,
  Building2, Package, Smartphone, Shield, Save, CheckCircle2,
  Truck, FileText, Download
} from 'lucide-react';
import {
  usePurchaseRequests, useCreatePurchaseRequest, useUpdatePurchaseRequest, useProjects,
  useSystemSetting, useUpsertSystemSetting, useInventoryItems, useUpdatePurchaseRequestItems,
  useDispatchPurchaseRequest, useReceivePurchaseRequest
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import type { PurchaseRequest, PurchaseRequestItem } from '../lib/types';
import { exportRequestPdf, exportDispatchPdf, exportThreeWayComparisonPdf } from '../lib/orderPdfExport';

const URGENCY_LABEL: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  consolidated: { label: 'Consolidado', color: 'bg-blue-100 text-blue-700' },
  ordered: { label: 'Pedido', color: 'bg-ecar-blueLight text-ecar-blue' },
  received: { label: 'Recibido', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  quoted: { label: 'Cotizado', color: 'bg-ecar-blueLight text-ecar-blue' },
  returned: { label: 'Devuelto', color: 'bg-orange-100 text-orange-700' },
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
  const [form, setForm] = useState({ project_id: '', urgency: 'normal', urgency_reason: '', requested_by: '', notes: '' });
  const [formItems, setFormItems] = useState<{ description: string; quantity: string; unit: string; inventoryItemId: string; searchText: string; showDropdown: boolean }[]>([{ description: '', quantity: '1', unit: 'unidad', inventoryItemId: '', searchText: '', showDropdown: false }]);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});

  const updateQuoteItems = useUpdatePurchaseRequestItems();
  const dispatchMutation = useDispatchPurchaseRequest();
  const receiveMutation = useReceivePurchaseRequest();

  // Modals for 3-way tracking
  const [dispatchModalReq, setDispatchModalReq] = useState<PurchaseRequest | null>(null);
  const [dispatchItemsState, setDispatchItemsState] = useState<Record<string, { quantity_sent: number; notes: string }>>({});
  const [dispatchedBy, setDispatchedBy] = useState('');

  const [receptionModalReq, setReceptionModalReq] = useState<PurchaseRequest | null>(null);
  const [receptionItemsState, setReceptionItemsState] = useState<Record<string, { quantity_received: number; notes: string }>>({});
  const [receivedBy, setReceivedBy] = useState('');

  const openDispatchModal = (req: PurchaseRequest) => {
    const initial: Record<string, { quantity_sent: number; notes: string }> = {};
    (req.items || []).forEach((it: any) => {
      initial[it.id] = {
        quantity_sent: it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : it.quantity,
        notes: it.dispatch_notes || ''
      };
    });
    setDispatchItemsState(initial);
    setDispatchedBy(userName || 'Pañol Central');
    setDispatchModalReq(req);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalReq) return;
    const items = Object.entries(dispatchItemsState).map(([id, val]: [string, any]) => ({
      id,
      quantity_sent: Number(val.quantity_sent) || 0,
      dispatch_notes: val.notes
    }));

    await dispatchMutation.mutateAsync({
      requestId: dispatchModalReq.id,
      dispatchedBy,
      items
    });

    const updatedReq: PurchaseRequest = {
      ...dispatchModalReq,
      dispatched_by: dispatchedBy,
      dispatched_at: new Date().toISOString(),
      status: 'ordered',
      items: (dispatchModalReq.items || []).map((it: any) => ({
        ...it,
        quantity_sent: dispatchItemsState[it.id]?.quantity_sent ?? it.quantity,
        dispatch_notes: dispatchItemsState[it.id]?.notes
      }))
    };

    await exportDispatchPdf(updatedReq);
    setDispatchModalReq(null);
  };

  const openReceptionModal = (req: PurchaseRequest) => {
    const initial: Record<string, { quantity_received: number; notes: string }> = {};
    (req.items || []).forEach((it: any) => {
      const sent = it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : it.quantity;
      initial[it.id] = {
        quantity_received: it.quantity_received !== undefined && it.quantity_received !== null ? it.quantity_received : sent,
        notes: it.reception_notes || ''
      };
    });
    setReceptionItemsState(initial);
    setReceivedBy(userName || 'Receptor Obra');
    setReceptionModalReq(req);
  };

  const handleConfirmReception = async () => {
    if (!receptionModalReq) return;
    const items = Object.entries(receptionItemsState).map(([id, val]: [string, any]) => ({
      id,
      quantity_received: Number(val.quantity_received) || 0,
      reception_notes: val.notes
    }));

    await receiveMutation.mutateAsync({
      requestId: receptionModalReq.id,
      receivedBy,
      items
    });

    const updatedReq: PurchaseRequest = {
      ...receptionModalReq,
      received_by: receivedBy,
      received_at: new Date().toISOString(),
      status: 'received',
      items: (receptionModalReq.items || []).map((it: any) => ({
        ...it,
        quantity_received: receptionItemsState[it.id]?.quantity_received ?? (it.quantity_sent ?? it.quantity),
        reception_notes: receptionItemsState[it.id]?.notes
      }))
    };

    await exportThreeWayComparisonPdf(updatedReq);
    setReceptionModalReq(null);
  };

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
      urgency_reason: form.urgency === 'urgent' ? form.urgency_reason : null,
      requested_by: form.requested_by || null,
      notes: form.notes || null,
      items: validItems.map(i => ({ description: i.description, quantity: parseFloat(i.quantity) || 1, unit: i.unit })),
    } as any);
    setShowNew(false);
    setForm({ project_id: '', urgency: 'normal', urgency_reason: '', requested_by: '', notes: '' });
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

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin" /></div>;

  const phoneConfigured = !!(whatsappSetting?.value);

  return (
    <div className="space-y-6">
      {/* Descriptive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blueDark rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10 text-white">
          <ShoppingBag size={80} className="md:w-[120px] md:h-[120px]" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-sky-300 border border-white/20">
            <span>📦</span> Gerencia de Logística & Pañol
          </div>
          <h3 className="font-bold text-xl md:text-2xl flex items-center gap-2 text-white pt-1">
            <ShoppingBag size={24} className="md:w-7 md:h-7 text-sky-400" /> Pedidos de Obra y Requerimientos
          </h3>
          <p className="text-gray-300 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
            Recepción centralizada de requerimientos de materiales enviados por las obras. Verificación de stock disponible en pañol central, despacho a frentes de trabajo o derivación a compras por insumos faltantes.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`light-card p-5 ${pendingCount > 0 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Clock size={16} className="text-yellow-500" /> Pendientes</div>
          <p className="text-2xl font-black text-yellow-600 font-mono">{pendingCount}</p>
        </div>
        <div className={`light-card p-5 ${urgentCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Urgentes</div>
          <p className="text-2xl font-black text-red-600 font-mono">{urgentCount}</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><ShoppingBag size={16} className="text-ecar-blue" /> Total Pedidos</div>
          <p className="text-2xl font-black text-ecar-blue font-mono">{(requests || []).length}</p>
        </div>
      </div>

      {/* WhatsApp Authorization Card */}
      <div className={`light-card overflow-hidden transition-all ${phoneConfigured ? 'border-green-200' : 'border-orange-200'}`}>
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phoneConfigured ? 'bg-green-100' : 'bg-orange-100'}`}>
              <Smartphone size={20} className={phoneConfigured ? 'text-green-600' : 'text-orange-600'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-gray-800">WhatsApp Autorizado para Pedidos</p>
                {phoneConfigured ? (
                  <span className="badge badge-success"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Activo</span>
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
          <button onClick={() => setShowWhatsappConfig(!showWhatsappConfig)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${showWhatsappConfig ? 'bg-gray-100 text-gray-600' : 'bg-ecar-blueLight text-ecar-blue hover:bg-ecar-blueLight'}`}>
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
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all"
                      placeholder="Ej: 5492641234567"
                    />
                  </div>
                  <button
                    onClick={handleSavePhone}
                    disabled={upsertSetting.isPending}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${phoneSaved ? 'bg-green-500 text-white' : 'bg-ecar-blue text-white hover:bg-ecar-blue'} disabled:opacity-50`}
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
              <div className="bg-slate-50 rounded-lg p-3 border border-ecar-blueLight">
                <p className="text-xs text-ecar-blue font-medium flex items-center gap-1.5">
                  <Shield size={14} /> <span className="font-bold">¿Cómo funciona?</span>
                </p>
                <ul className="text-xs text-ecar-blue mt-1.5 space-y-1 ml-5">
                  <li>• Solo este número podrá crear pedidos de compra vía WhatsApp con Rombo</li>
                  <li>• El encargado manda un mensaje como <span className="font-mono bg-ecar-blueLight px-1 rounded">"necesito 50 bolsas de cemento urgente"</span></li>
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
        <button onClick={() => { setActiveTab('obra'); setFilterStatus(''); }} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'obra' ? 'border-ecar-blue text-ecar-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Pedidos de Obra</button>
        <button onClick={() => { setActiveTab('quote'); setFilterStatus(''); }} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'quote' ? 'border-ecar-blue text-ecar-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Cotizaciones de Presupuestos</button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex-1" />
        {activeTab === 'obra' && (
          <button onClick={() => setShowNew(true)} className="btn-primary">
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
            <div key={req.id} className="light-card overflow-hidden">
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stat.color}`}>{stat.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${urg.color}`}>{urg.label}</span>
                    {req.project && (
                      <span className="text-xs text-gray-700 font-bold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Building2 size={12} className="text-ecar-blue" /> {(req.project as any)?.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Solicitado por: <span className="font-bold text-gray-700">{req.requested_by || 'Jefe de Obra'}</span> · {new Date(req.created_at).toLocaleDateString('es-AR')}
                    {req.dispatched_by && <span> · Despachado por: <span className="font-bold text-sky-700">{req.dispatched_by}</span> ({req.dispatched_at ? new Date(req.dispatched_at).toLocaleDateString('es-AR') : ''})</span>}
                    {req.received_by && <span> · Recepcionado por: <span className="font-bold text-emerald-700">{req.received_by}</span> ({req.received_at ? new Date(req.received_at).toLocaleDateString('es-AR') : ''})</span>}
                  </p>
                  {req.urgency === 'urgent' && req.urgency_reason && (
                    <p className="text-xs text-red-600 font-medium mt-1 bg-red-50 p-2 rounded-md border border-red-100">
                      Motivo de urgencia: {req.urgency_reason}
                    </p>
                  )}
                  {req.notes && <p className="text-xs text-gray-600 mt-1 italic">"{req.notes}"</p>}
                </div>

                {/* Main Workflow Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeTab === 'obra' && (
                    <>
                      {(req.status === 'pending' || req.status === 'approved') && (
                        <button
                          onClick={() => openDispatchModal(req)}
                          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          title="Ingresar las cantidades despachadas por Pañol Central"
                        >
                          <Truck size={15} /> Declarar Despacho / Pañol
                        </button>
                      )}

                      {req.status === 'ordered' && (
                        <button
                          onClick={() => openReceptionModal(req)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          title="Confirmar la recepción efectiva de los materiales en el frente de obra"
                        >
                          <CheckCircle2 size={15} /> Recepcionar en Obra
                        </button>
                      )}

                      {req.status === 'received' && (
                        <button
                          onClick={() => exportThreeWayComparisonPdf(req)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-ecar-blue text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Download size={15} /> Descargar Acta Final PDF
                        </button>
                      )}

                      {/* PDF Direct Actions */}
                      <button
                        onClick={() => exportRequestPdf(req)}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        title="Descargar Solicitud de Pedido de Obra PDF"
                      >
                        <FileText size={14} className="text-ecar-blue" /> PDF Solicitud
                      </button>
                      {req.dispatched_at && (
                        <button
                          onClick={() => exportDispatchPdf(req)}
                          className="px-2.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          title="Descargar Remito de Pañol PDF"
                        >
                          <Truck size={14} /> PDF Remito
                        </button>
                      )}
                    </>
                  )}

                  {/* Quote Tab Actions */}
                  {activeTab === 'quote' && req.status === 'pending' && editingQuoteId !== req.id && (
                    <button
                      onClick={() => {
                        const initialPrices: Record<string, number> = {};
                        items.forEach(i => { initialPrices[i.id] = i.estimated_unit_cost || 0; });
                        setQuotePrices(initialPrices);
                        setEditingQuoteId(req.id);
                      }}
                      className="badge badge-info"
                    >
                      Cotizar
                    </button>
                  )}
                </div>
              </div>

              {/* ─── 3-WAY COMPARISON & TRACEABILITY TABLE ─── */}
              {items.length > 0 && (
                <div className="p-4 bg-slate-50/50">
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Package size={15} className="text-sky-400" />
                        <span>Tabla de Trazabilidad Tripartita (Obra ➔ Pañol ➔ Recepción)</span>
                      </div>
                      <span className="text-[11px] font-normal text-slate-300">
                        {items.length} ítem(s) registrados
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {items.map((it) => {
                        const requested = it.quantity || 0;
                        const sent = it.quantity_sent;
                        const received = it.quantity_received;

                        let statusText = '⏳ Pendiente Despacho Pañol';
                        let statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                        if (sent !== undefined && sent !== null) {
                          if (sent < requested) {
                            statusText = `⚠️ Despacho Parcial (${requested - sent} faltantes)`;
                            statusBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                          } else if (received !== undefined && received !== null) {
                            if (received === requested) {
                              statusText = '✅ Recibido 100% Conforme';
                              statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            } else {
                              statusText = `⚠️ Diferencia en Obra (${sent - received} dif.)`;
                              statusBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                            }
                          } else {
                            statusText = '🚚 En Tránsito a Obra';
                            statusBadgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
                          }
                        }

                        return (
                          <div key={it.id} className="p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">{it.description}</span>
                                {it.budget_item_id && <span className="text-blue-500 text-xs" title="Vinculado al Presupuesto Oficial">🔗 Presupuestado</span>}
                              </div>
                              {it.dispatch_notes && <p className="text-[11px] text-sky-600 italic mt-0.5">Nota Pañol: {it.dispatch_notes}</p>}
                              {it.reception_notes && <p className="text-[11px] text-emerald-600 italic mt-0.5">Nota Recepción: {it.reception_notes}</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center min-w-[310px]">
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-[9px] font-bold text-gray-400 block tracking-wider uppercase">1. SOLICITADO</span>
                                <span className="font-mono font-bold text-gray-800 text-xs">{requested} {it.unit}</span>
                              </div>
                              <div className="bg-sky-50/70 p-2 rounded-lg border border-sky-100">
                                <span className="text-[9px] font-bold text-sky-600 block tracking-wider uppercase">2. ENVIADO PAÑOL</span>
                                <span className="font-mono font-bold text-sky-800 text-xs">{sent !== null && sent !== undefined ? `${sent} ${it.unit}` : '—'}</span>
                              </div>
                              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                                <span className="text-[9px] font-bold text-emerald-600 block tracking-wider uppercase">3. RECIBIDO OBRA</span>
                                <span className="font-mono font-bold text-emerald-800 text-xs">{received !== null && received !== undefined ? `${received} ${it.unit}` : '—'}</span>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <span className={`inline-block px-3 py-1 rounded-full font-bold border text-[11px] ${statusBadgeClass}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
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
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-ecar-blue focus:border-ecar-blue"
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
                      className="px-4 py-2 bg-ecar-blue text-white text-sm font-bold rounded-lg hover:bg-ecar-blue disabled:opacity-50"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Obra *</label><select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Seleccioná...</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500">Urgencia *</label><select required value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="low">Baja</option><option value="normal">Normal</option><option value="urgent">Urgente</option></select></div>
              </div>
              {form.urgency === 'urgent' && (
                <div><label className="text-xs font-bold text-red-500">Motivo de Urgencia (Impacto si no se compra) *</label><input required value={form.urgency_reason} onChange={e => setForm({ ...form, urgency_reason: e.target.value })} className="w-full px-3 py-2 border border-red-300 rounded-xl text-sm bg-red-50 focus:ring-red-500" placeholder="Ej: Obra frenada por falta de material" /></div>
              )}
              <div><label className="text-xs font-bold text-gray-500">Solicitado por *</label><input required value={form.requested_by || userName} onChange={e => setForm({ ...form, requested_by: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-gray-50" readOnly /></div>

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
                          <div className="absolute top-full left-0 right-0 mt-1 light-card shadow-lg z-50 max-h-48 overflow-y-auto">
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
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm transition-colors border-b border-gray-50 last:border-0"
                                  >
                                    <Package size={14} className={isTool ? 'text-amber-500' : 'text-ecar-blue'} />
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

              <button type="submit" disabled={createRequest.isPending || !formItems.some(fi => fi.inventoryItemId)} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm hover:bg-ecar-blue transition-all shadow-md disabled:opacity-50">
                {createRequest.isPending ? 'Creando...' : '🛒 Crear Pedido de Compra'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal Declarar Despacho / Pañol */}
      {dispatchModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Declaración de Despacho desde Pañol</span>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mt-0.5">
                  <Truck size={20} className="text-sky-600" /> Pedido PED-{dispatchModalReq.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setDispatchModalReq(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Responsable Despachante (Pañol Central)</label>
                <input
                  type="text"
                  value={dispatchedBy}
                  onChange={e => setDispatchedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
                  placeholder="Nombre de pañolero"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">Conformación de Materiales Despachados</label>
                <div className="space-y-3">
                  {(dispatchModalReq.items || []).map((it) => {
                    const current = dispatchItemsState[it.id] || { quantity_sent: it.quantity, notes: '' };
                    const isPartial = current.quantity_sent < it.quantity;

                    return (
                      <div key={it.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-gray-800 text-sm">{it.description}</span>
                          <span className="text-xs text-gray-500">Solicitado: <strong className="text-gray-800">{it.quantity} {it.unit}</strong></span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[11px] font-bold text-sky-700 block mb-1">Cantidad a Enviar ({it.unit})</label>
                            <input
                              type="number"
                              step="any"
                              value={current.quantity_sent}
                              onChange={e => setDispatchItemsState({
                                ...dispatchItemsState,
                                [it.id]: { ...current, quantity_sent: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full px-3 py-1.5 border border-sky-300 rounded-lg text-sm font-mono font-bold bg-white focus:ring-2 focus:ring-sky-500/30"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">Observación de Despacho (Opcional)</label>
                            <input
                              type="text"
                              value={current.notes}
                              onChange={e => setDispatchItemsState({
                                ...dispatchItemsState,
                                [it.id]: { ...current, notes: e.target.value }
                              })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                              placeholder="Ej: Stock parcial en pañol..."
                            />
                          </div>
                        </div>

                        {isPartial && (
                          <p className="text-[11px] text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                            <AlertTriangle size={13} /> Faltan {it.quantity - current.quantity_sent} {it.unit} por cubrir. El saldo faltante quedará registrado para compras.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDispatchModalReq(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDispatch}
                  disabled={dispatchMutation.isPending}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {dispatchMutation.isPending ? 'Confirmando...' : '📄 Confirmar Despacho & Generar Remito PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Declarar Recepción en Obra */}
      {receptionModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Constancia de Recepción en Obra</span>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mt-0.5">
                  <CheckCircle2 size={20} className="text-emerald-600" /> Pedido PED-{receptionModalReq.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setReceptionModalReq(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Receptor de Campo / Obra</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                  placeholder="Nombre de receptor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">Conformidad de Recepción de Materiales</label>
                <div className="space-y-3">
                  {(receptionModalReq.items || []).map((it) => {
                    const current = receptionItemsState[it.id] || { quantity_received: it.quantity_sent ?? it.quantity, notes: '' };
                    const sentQty = it.quantity_sent ?? it.quantity;

                    return (
                      <div key={it.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-gray-800 text-sm">{it.description}</span>
                          <span className="text-xs text-sky-700 font-bold">Enviado por Pañol: {sentQty} {it.unit}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[11px] font-bold text-emerald-700 block mb-1">Cantidad Recibida Real ({it.unit})</label>
                            <input
                              type="number"
                              step="any"
                              value={current.quantity_received}
                              onChange={e => setReceptionItemsState({
                                ...receptionItemsState,
                                [it.id]: { ...current, quantity_received: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-mono font-bold bg-white focus:ring-2 focus:ring-emerald-500/30"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">Observaciones / Conformidad</label>
                            <input
                              type="text"
                              value={current.notes}
                              onChange={e => setReceptionItemsState({
                                ...receptionItemsState,
                                [it.id]: { ...current, notes: e.target.value }
                              })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                              placeholder="Ej: Conforme 100%, empaque impecable"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setReceptionModalReq(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReception}
                  disabled={receiveMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {receiveMutation.isPending ? 'Confirmando...' : '📋 Confirmar Recepción & Generar Acta PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
