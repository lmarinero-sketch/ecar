import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Package, Plus, X, AlertTriangle, Clock,
  Building2, CheckCircle2,
  Truck, FileText, Trash2, ShoppingBag,
  Layers, Calendar, MapPin, Search
} from 'lucide-react';
import {
  usePurchaseRequests, useCreatePurchaseRequest, useUpdatePurchaseRequest, useProjects,
  useInventoryItems,
  useDispatchPurchaseRequest, useReceivePurchaseRequest, useCreatePurchaseOrder,
  useEmployees, useAllFuelVehicles, useCreateLogisticsDelivery
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import type { PurchaseRequest, PurchaseRequestItem, InventoryItem } from '../lib/types';
import { exportRequestPdf, exportDispatchPdf, exportThreeWayComparisonPdf } from '../lib/orderPdfExport';
import { RequestFlowDiagram3D } from './tracking/RequestFlowDiagram3D';
import { useModalStore } from '../store/useModalStore';

const URGENCY_LABEL: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'En Logística / Pañol', color: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Aprobado (Con Reserva)', color: 'bg-blue-100 text-blue-800' },
  consolidated: { label: 'En Compras', color: 'bg-indigo-100 text-indigo-800' },
  ordered: { label: 'En Despacho / Tránsito', color: 'bg-sky-100 text-sky-800' },
  received: { label: 'Atendido (Recibido)', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Cancelado / Rechazado', color: 'bg-red-100 text-red-800' },
  quoted: { label: 'Cotizado', color: 'bg-blue-100 text-blue-800' },
  returned: { label: 'Devuelto', color: 'bg-orange-100 text-orange-800' },
};

interface FormItemState {
  itemType: 'catalogo' | 'no_registrado';
  description: string;
  specification: string;
  quantity: string;
  unit: string;
  inventoryItemId: string;
  searchText: string;
  showDropdown: boolean;
}

export const PurchaseRequestsModule: React.FC<{ initialProjectId?: string }> = ({ initialProjectId }) => {
  const { user } = useAuth();
  const { data: requests, isLoading } = usePurchaseRequests();
  const { data: projects } = useProjects();
  const { data: inventoryItems = [] } = useInventoryItems();
  const createRequest = useCreatePurchaseRequest();
  const updateRequest = useUpdatePurchaseRequest();
  const createPO = useCreatePurchaseOrder();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState(initialProjectId || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [form, setForm] = useState({
    project_id: initialProjectId || '',
    urgency: 'normal',
    urgency_reason: '',
    needed_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    delivery_location: '',
    receptor_contact: '',
    requested_by: '',
    notes: '',
  });

  useEffect(() => {
    if (initialProjectId) {
      setFilterProject(initialProjectId);
      setForm(prev => ({ ...prev, project_id: initialProjectId }));
    }
  }, [initialProjectId]);

  const [formItems, setFormItems] = useState<FormItemState[]>([
    {
      itemType: 'catalogo',
      description: '',
      specification: '',
      quantity: '1',
      unit: 'unidad',
      inventoryItemId: '',
      searchText: '',
      showDropdown: false,
    },
  ]);

  const dispatchMutation = useDispatchPurchaseRequest();
  const receiveMutation = useReceivePurchaseRequest();
  const createLogisticsDelivery = useCreateLogisticsDelivery();
  const { data: employees = [] } = useEmployees();
  const { data: allVehicles = [] } = useAllFuelVehicles();

  // Modals
  const [dispatchModalReq, setDispatchModalReq] = useState<PurchaseRequest | null>(null);
  const [dispatchItemsState, setDispatchItemsState] = useState<Record<string, { quantity_sent: number; notes: string }>>({});
  const [dispatchedBy, setDispatchedBy] = useState('');
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchVehicleId, setDispatchVehicleId] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);

  const [receptionModalReq, setReceptionModalReq] = useState<PurchaseRequest | null>(null);
  const [viewFlowReq, setViewFlowReq] = useState<PurchaseRequest | null>(null);
  const [receptionItemsState, setReceptionItemsState] = useState<Record<string, { quantity_received: number; notes: string }>>({});
  const [receivedBy, setReceivedBy] = useState('');

  // Resolution Matrix Modal (GROWLABS P03 / Caso 10-6-4)
  const [evaluatingReq, setEvaluatingReq] = useState<PurchaseRequest | null>(null);

  // Derive to Purchases Modal
  const [deriveModalReq, setDeriveModalReq] = useState<PurchaseRequest | null>(null);
  const [deriveItems, setDeriveItems] = useState<{ description: string; quantity: number; unit: string; subtotal: number; unit_price: number }[]>([]);

  // Cancel Request Modal
  const [cancelModalReq, setCancelModalReq] = useState<PurchaseRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ─── Filtered Requests ───
  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter(r => {
      const matchStatus = !filterStatus || r.status === filterStatus;
      const matchProject = !filterProject || r.project_id === filterProject;
      const matchSearch = !searchTerm || 
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.items || []).some(it => it.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStatus && matchProject && matchSearch;
    });
  }, [requests, filterStatus, filterProject, searchTerm]);

  const pendingCount = useMemo(() => (requests || []).filter(r => r.status === 'pending').length, [requests]);
  const urgentCount = useMemo(() => (requests || []).filter(r => r.urgency === 'urgent' && r.status === 'pending').length, [requests]);

  // Add Item to Form
  const addItem = () => {
    setFormItems([
      ...formItems,
      {
        itemType: 'catalogo',
        description: '',
        specification: '',
        quantity: '1',
        unit: 'unidad',
        inventoryItemId: '',
        searchText: '',
        showDropdown: false,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const updateItemField = (idx: number, field: keyof FormItemState, value: any) => {
    const updated = [...formItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormItems(updated);
  };

  const selectInventoryItem = (idx: number, invItem: InventoryItem) => {
    setFormItems(formItems.map((item, i) => i === idx ? {
      ...item,
      inventoryItemId: invItem.id,
      description: invItem.name,
      unit: invItem.unit || 'unidad',
      searchText: invItem.name,
      showDropdown: false,
    } : item));
  };

  // Create Request (Decisión 2 & 3: Necesidad operativa + artículo no registrado)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formItems.filter(i => i.description.trim());
    if (!validItems.length) {
      useModalStore.getState().showAlert('Atención', 'Debés ingresar al menos un artículo en el pedido.');
      return;
    }
    if (form.urgency === 'urgent' && !form.urgency_reason.trim()) {
      useModalStore.getState().showAlert('Atención', 'Para pedidos urgentes es obligatorio justificar el motivo de urgencia.');
      return;
    }

    try {
      await createRequest.mutateAsync({
        project_id: form.project_id || null,
        urgency: form.urgency as any,
        urgency_reason: form.urgency === 'urgent' ? form.urgency_reason : null,
        needed_date: form.needed_date || null,
        delivery_location: form.delivery_location || null,
        receptor_contact: form.receptor_contact || null,
        requested_by: form.requested_by || userName || 'Jefe de Obra',
        notes: form.notes || null,
        status: 'pending',
        items: validItems.map(i => ({
          description: i.description,
          specification: i.specification || null,
          item_type: i.itemType,
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit || 'unidad',
          inventory_item_id: i.itemType === 'catalogo' ? (i.inventoryItemId || null) : null,
        })),
      } as any);

      setShowNew(false);
      setForm({
        project_id: '',
        urgency: 'normal',
        urgency_reason: '',
        needed_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        delivery_location: '',
        receptor_contact: '',
        requested_by: '',
        notes: '',
      });
      setFormItems([{
        itemType: 'catalogo',
        description: '',
        specification: '',
        quantity: '1',
        unit: 'unidad',
        inventoryItemId: '',
        searchText: '',
        showDropdown: false,
      }]);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', 'No se pudo crear el pedido: ' + err.message);
    }
  };

  // Open Dispatch Modal
  const openDispatchModal = (req: PurchaseRequest) => {
    const initial: Record<string, { quantity_sent: number; notes: string }> = {};
    (req.items || []).forEach((it: any) => {
      initial[it.id] = {
        quantity_sent: it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : it.quantity,
        notes: it.dispatch_notes || '',
      };
    });
    setDispatchItemsState(initial);
    setDispatchedBy(userName || 'Pañol Central');
    setDispatchDriverName('');
    setDispatchVehicleId('');
    setDispatchDate(new Date().toISOString().split('T')[0]);
    setDispatchModalReq(req);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalReq || dispatchMutation.isPending) return;
    const items = Object.entries(dispatchItemsState).map(([id, val]: [string, any]) => ({
      id,
      quantity_sent: Number(val.quantity_sent) || 0,
      dispatch_notes: val.notes,
    }));

    await dispatchMutation.mutateAsync({
      requestId: dispatchModalReq.id,
      dispatchedBy,
      items,
    });

    // Auto-create logistics delivery for tracking
    try {
      const itemsSent = (dispatchModalReq.items || []).map((it: any) => ({
        description: it.description,
        quantity: dispatchItemsState[it.id]?.quantity_sent ?? it.quantity,
        unit: it.unit || 'un',
      })).filter(i => i.quantity > 0);

      await createLogisticsDelivery.mutateAsync({
        project_id: dispatchModalReq.project_id || null,
        vehicle_id: dispatchVehicleId || null,
        driver_name: dispatchDriverName || null,
        delivery_date: dispatchDate || new Date().toISOString().split('T')[0],
        status: 'en_transito',
        notes: `Despacho de Pedido PED-${dispatchModalReq.id.slice(0, 8).toUpperCase()}`,
        items: itemsSent,
      } as any);
    } catch (e) {
      console.error('Error auto-creating delivery:', e);
    }

    const updatedReq: PurchaseRequest = {
      ...dispatchModalReq,
      dispatched_by: dispatchedBy,
      dispatched_at: new Date().toISOString(),
      status: 'ordered',
      items: (dispatchModalReq.items || []).map((it: any) => ({
        ...it,
        quantity_sent: dispatchItemsState[it.id]?.quantity_sent ?? it.quantity,
        dispatch_notes: dispatchItemsState[it.id]?.notes,
      })),
    };

    await exportDispatchPdf(updatedReq);
    setDispatchModalReq(null);
  };

  // Reception Modal
  const openReceptionModal = (req: PurchaseRequest) => {
    const initial: Record<string, { quantity_received: number; notes: string }> = {};
    (req.items || []).forEach((it: any) => {
      const sent = it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : it.quantity;
      initial[it.id] = {
        quantity_received: it.quantity_received !== undefined && it.quantity_received !== null ? it.quantity_received : sent,
        notes: it.reception_notes || '',
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
      reception_notes: val.notes,
    }));

    await receiveMutation.mutateAsync({
      requestId: receptionModalReq.id,
      receivedBy,
      items,
    });

    const updatedReq: PurchaseRequest = {
      ...receptionModalReq,
      received_by: receivedBy,
      received_at: new Date().toISOString(),
      status: 'received',
      items: (receptionModalReq.items || []).map((it: any) => ({
        ...it,
        quantity_received: receptionItemsState[it.id]?.quantity_received ?? (it.quantity_sent ?? it.quantity),
        reception_notes: receptionItemsState[it.id]?.notes,
      })),
    };

    await exportThreeWayComparisonPdf(updatedReq);
    setReceptionModalReq(null);
  };

  // Open Derive Modal (P07: Derivar SOLO saldos faltantes sin duplicar)
  const openDeriveModal = (req: PurchaseRequest) => {
    setDeriveModalReq(req);
    const missingItems = (req.items || []).map(it => {
      const sent = it.quantity_sent || 0;
      const missing = Math.max(0, it.quantity - sent);
      return {
        description: it.description,
        quantity: missing > 0 ? missing : it.quantity,
        unit: it.unit || 'un',
        unit_price: 0,
        subtotal: 0,
      };
    }).filter(it => it.quantity > 0);

    setDeriveItems(missingItems.length ? missingItems : [{ description: '', quantity: 1, unit: 'un', unit_price: 0, subtotal: 0 }]);
  };

  const submitDeriveToPurchases = async () => {
    if (!deriveModalReq) return;

    try {
      await createPO.mutateAsync({
        request_id: deriveModalReq.id,
        project_id: deriveModalReq.project_id,
        supplier_name: 'A Definir',
        po_number: `PO-${deriveModalReq.id.slice(0, 5).toUpperCase()}`,
        order_type: 'compra',
        status: 'borrador',
        approval_status: 'no_requerida',
        total_amount: 0,
        urgency: deriveModalReq.urgency === 'urgent',
        urgency_reason: deriveModalReq.urgency_reason || null,
        items: deriveItems.filter(it => it.description.trim() !== ''),
      } as any);

      await updateRequest.mutateAsync({
        id: deriveModalReq.id,
        status: 'consolidated',
      } as any);

      useModalStore.getState().showAlert('Éxito', 'Faltantes derivados a Compras exitosamente. Podrán verse en el módulo de Órdenes de Compra.');
      setDeriveModalReq(null);
    } catch (e: any) {
      useModalStore.getState().showAlert('Error', `Error al derivar: ${e.message}`);
    }
  };

  // Cancel Request Handler
  const handleCancelRequest = async () => {
    if (!cancelModalReq) return;
    try {
      await updateRequest.mutateAsync({
        id: cancelModalReq.id,
        status: 'rejected',
        notes: `${cancelModalReq.notes || ''}\n[Cancelado]: ${cancelReason}`,
      } as any);
      setCancelModalReq(null);
      setCancelReason('');
    } catch (e: any) {
      useModalStore.getState().showAlert('Error', e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Descriptive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blueDark rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 text-white pointer-events-none">
          <Package size={160} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-sky-300 border border-white/20">
            <span>📋</span> Gerencia de Logística · Necesidades de Obra
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Pedidos de Obra
          </h1>
          <p className="text-gray-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Recepción y resolución de necesidades operativas de obra. Evaluación por ítem (10/6/4): reserva de existencias disponibles en Pañol Central y derivación de saldos faltantes a Compras sin doble carga.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`bg-white rounded-2xl p-5 border shadow-sm ${pendingCount > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Por Evaluar</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{pendingCount}</p>
          <span className="text-[11px] text-gray-400">requerimientos pendientes de revisión</span>
        </div>

        <div className={`bg-white rounded-2xl p-5 border shadow-sm ${urgentCount > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Urgentes</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 font-mono">{urgentCount}</p>
          <span className="text-[11px] text-gray-400">prioridad alta con justificación</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pedidos</span>
            <Package size={16} className="text-ecar-blue" />
          </div>
          <p className="text-2xl font-black text-ecar-blue font-mono">{(requests || []).length}</p>
          <span className="text-[11px] text-gray-400">historial consolidado</span>
        </div>
      </div>

      {/* Toolbar / Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, ítem, obra..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-ecar-blue/30 outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="">Todas las obras</option>
            {(projects || []).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowNew(true)}
          className="btn-primary bg-ecar-blue hover:bg-ecar-blueDark text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shrink-0"
        >
          <Plus size={16} /> Enviar Pedido a Logística
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
            <Package size={48} className="mx-auto text-gray-300" />
            <h4 className="font-bold text-gray-700">No hay pedidos registrados</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Podés registrar un requerimiento desde el botón superior o capturarlo desde los frentes de obra.
            </p>
          </div>
        ) : (
          filtered.map(req => {
            const items = (req.items || []) as PurchaseRequestItem[];
            const urg = URGENCY_LABEL[req.urgency] || URGENCY_LABEL.normal;
            const stat = STATUS_LABEL[req.status] || STATUS_LABEL.pending;

            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all">
                {/* Header Pedido */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 bg-slate-50/40">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                        PED-{req.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stat.color}`}>
                        {stat.label}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${urg.color}`}>
                        {urg.label}
                      </span>
                      {req.project && (
                        <span className="text-xs text-gray-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                          <Building2 size={13} className="text-ecar-blue" /> {(req.project as any)?.name}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span>Solicitante: <strong className="text-gray-800">{req.requested_by || 'Jefe de Obra'}</strong></span>
                      <span>Fecha solicitud: <strong>{new Date(req.created_at).toLocaleDateString('es-AR')}</strong></span>
                      {req.needed_date && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                          <Calendar size={12} /> Necesario para: <strong>{req.needed_date}</strong>
                        </span>
                      )}
                      {req.delivery_location && (
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin size={12} /> Destino: <strong>{req.delivery_location}</strong>
                        </span>
                      )}
                    </div>

                    {req.urgency === 'urgent' && req.urgency_reason && (
                      <p className="text-xs text-red-700 bg-red-50 p-2 rounded-xl border border-red-200">
                        <strong>Motivo de Urgencia:</strong> {req.urgency_reason}
                      </p>
                    )}

                    {req.notes && (
                      <p className="text-xs text-gray-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  {/* Acciones del Pedido */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                    {/* Botón Resolución por Ítem GROWLABS (10/6/4) */}
                    <button
                      onClick={() => setEvaluatingReq(req)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-ecar-blue text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      title="Evaluar cobertura de stock por ítem (reserva y faltantes)"
                    >
                      <Layers size={15} /> Evaluar Resolución (10/6/4)
                    </button>

                    {/* Despacho Pañol */}
                    {(req.status === 'pending' || req.status === 'approved') && (
                      <button
                        onClick={() => openDispatchModal(req)}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Registrar cantidades enviadas desde Pañol"
                      >
                        <Truck size={15} /> Despachar
                      </button>
                    )}

                    {/* Derivar Saldo a Compras */}
                    {(req.status === 'pending' || req.status === 'approved' || req.status === 'ordered') && (
                      <button
                        onClick={() => openDeriveModal(req)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Derivar saldos faltantes a Compras"
                      >
                        <ShoppingBag size={15} /> Derivar a Compras
                      </button>
                    )}

                    {/* Recepcionar en Obra */}
                    {req.status === 'ordered' && (
                      <button
                        onClick={() => openReceptionModal(req)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 size={15} /> Recepcionar en Obra
                      </button>
                    )}

                    {/* PDFs */}
                    <button
                      onClick={() => exportRequestPdf(req)}
                      className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      title="Descargar Solicitud PDF"
                    >
                      <FileText size={15} />
                    </button>

                    {/* Trazabilidad 3D */}
                    <button
                      onClick={() => setViewFlowReq(req)}
                      className="px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
                      title="Ver Trazabilidad y Flujo 3D"
                    >
                      Trazabilidad
                    </button>

                    {/* Cancelar / Anular con motivo */}
                    <button
                      onClick={() => {
                        setCancelModalReq(req);
                        setCancelReason('');
                      }}
                      className="p-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all"
                      title="Cancelar pedido con motivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Lista de Ítems del Pedido */}
                <div className="p-4 space-y-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-2">
                    Artículos Solicitados ({items.length})
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map(it => {
                      const sent = it.quantity_sent || 0;
                      const received = it.quantity_received || 0;
                      const isUnregistered = it.item_type === 'no_registrado' || !it.inventory_item_id;

                      return (
                        <div key={it.id} className="py-2.5 px-2 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-xs">{it.description}</span>
                              {isUnregistered && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  No Registrado
                                </span>
                              )}
                            </div>
                            {it.specification && (
                              <p className="text-[11px] text-gray-500">
                                <strong>Esp. técnica:</strong> {it.specification}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center min-w-[280px] text-xs">
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <span className="text-[9px] font-bold text-gray-400 block uppercase">1. Solicitado</span>
                              <span className="font-mono font-bold text-gray-900">{it.quantity} {it.unit}</span>
                            </div>
                            <div className="bg-sky-50/70 p-2 rounded-xl border border-sky-100">
                              <span className="text-[9px] font-bold text-sky-600 block uppercase">2. Despachado</span>
                              <span className="font-mono font-bold text-sky-800">{sent > 0 ? `${sent} ${it.unit}` : '—'}</span>
                            </div>
                            <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                              <span className="text-[9px] font-bold text-emerald-600 block uppercase">3. Recibido</span>
                              <span className="font-mono font-bold text-emerald-800">{received > 0 ? `${received} ${it.unit}` : '—'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Modal Nuevo Pedido (Artículos de Catálogo y No Registrados) ─── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-bold text-ecar-blue uppercase tracking-wider">Requerimiento de Obra</span>
                <h3 className="font-extrabold text-lg text-gray-900">Nuevo Pedido de Materiales / Herramientas</h3>
              </div>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Obra / Destino *</label>
                  <select
                    required
                    value={form.project_id}
                    onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="">Seleccioná una obra...</option>
                    {(projects || []).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Prioridad *</label>
                  <select
                    required
                    value={form.urgency}
                    onChange={e => setForm({ ...form, urgency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgente</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>

              {form.urgency === 'urgent' && (
                <div>
                  <label className="font-bold text-red-600 block mb-1">Motivo de Urgencia (Obligatorio si es urgente) *</label>
                  <input
                    required
                    value={form.urgency_reason}
                    onChange={e => setForm({ ...form, urgency_reason: e.target.value })}
                    className="w-full px-3 py-2 border border-red-300 rounded-xl bg-red-50 focus:ring-red-500"
                    placeholder="Ej: Frente de trabajo paralizado por falta de tuberías"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fecha Necesaria en Obra *</label>
                  <input
                    type="date"
                    required
                    value={form.needed_date}
                    onChange={e => setForm({ ...form, needed_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Lugar de Entrega / Frente</label>
                  <input
                    value={form.delivery_location}
                    onChange={e => setForm({ ...form, delivery_location: e.target.value })}
                    placeholder="Ej: Sector 2 - Torre B"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Contacto Receptor</label>
                  <input
                    value={form.receptor_contact}
                    onChange={e => setForm({ ...form, receptor_contact: e.target.value })}
                    placeholder="Ej: Capataz Juan Pérez"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-800 text-sm">Materiales y Herramientas</label>
                  <span className="text-[11px] text-gray-400">Podés solicitar artículos del catálogo o no registrados</span>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, idx) => {
                    const q = (item.searchText || '').toLowerCase();
                    const filteredCat = inventoryItems.filter(inv =>
                      inv.name.toLowerCase().includes(q) ||
                      (inv.category || '').toLowerCase().includes(q)
                    );

                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-500 text-xs">Ítem #{idx + 1}</span>
                            {/* Toggle Catálogo / No Registrado */}
                            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white text-[11px]">
                              <button
                                type="button"
                                onClick={() => updateItemField(idx, 'itemType', 'catalogo')}
                                className={`px-2 py-0.5 rounded font-bold transition-all ${
                                  item.itemType === 'catalogo' ? 'bg-ecar-blue text-white shadow-xs' : 'text-gray-500'
                                }`}
                              >
                                Catálogo
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItemField(idx, 'itemType', 'no_registrado')}
                                className={`px-2 py-0.5 rounded font-bold transition-all ${
                                  item.itemType === 'no_registrado' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-500'
                                }`}
                              >
                                No Registrado
                              </button>
                            </div>
                          </div>

                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕ Quitar
                            </button>
                          )}
                        </div>

                        {item.itemType === 'catalogo' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-2 relative">
                              <input
                                value={item.searchText}
                                onChange={e => {
                                  updateItemField(idx, 'searchText', e.target.value);
                                  updateItemField(idx, 'showDropdown', true);
                                }}
                                onFocus={() => updateItemField(idx, 'showDropdown', true)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white"
                                placeholder="Buscar en catálogo..."
                              />
                              {item.showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto divide-y">
                                  {filteredCat.slice(0, 10).map(inv => (
                                    <button
                                      key={inv.id}
                                      type="button"
                                      onMouseDown={e => e.preventDefault()}
                                      onClick={() => selectInventoryItem(idx, inv)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex justify-between"
                                    >
                                      <span className="font-medium text-gray-800 truncate">{inv.name}</span>
                                      <span className="text-gray-400 font-mono">Stock: {inv.current_stock}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <input
                                type="number"
                                required
                                value={item.quantity}
                                onChange={e => updateItemField(idx, 'quantity', e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white text-center font-mono"
                                placeholder="Cant."
                              />
                            </div>
                            <div>
                              <input
                                readOnly
                                value={item.unit}
                                className="w-full px-3 py-1.5 border rounded-lg bg-slate-100 text-gray-500 text-center"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-2">
                              <input
                                required
                                value={item.description}
                                onChange={e => updateItemField(idx, 'description', e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white"
                                placeholder="Descripción del artículo..."
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                required
                                value={item.quantity}
                                onChange={e => updateItemField(idx, 'quantity', e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white text-center font-mono"
                                placeholder="Cant."
                              />
                            </div>
                            <div>
                              <input
                                required
                                value={item.unit}
                                onChange={e => updateItemField(idx, 'unit', e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white text-center"
                                placeholder="Unidad (u, m, kg)"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <input
                                value={item.specification}
                                onChange={e => updateItemField(idx, 'specification', e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white"
                                placeholder="Especificación técnica / marca sugerida (opcional)..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addItem}
                    className="text-ecar-blue font-bold hover:underline text-xs flex items-center gap-1"
                  >
                    + Agregar otro artículo al pedido
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notas u Observaciones Generales</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Detalles de acceso a obra, horarios o instrucciones..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createRequest.isPending}
                  className="btn-primary bg-ecar-blue hover:bg-ecar-blueDark text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  {createRequest.isPending ? 'Enviando...' : '📋 Enviar Pedido a Logística'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Matriz de Resolución Logística por Ítem (Caso 10 / 6 / 4) ─── */}
      {evaluatingReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-bold text-ecar-blue uppercase tracking-wider">Matriz de Cobertura GROWLABS</span>
                <h3 className="font-extrabold text-lg text-gray-900">
                  Resolución Logística: PED-{evaluatingReq.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setEvaluatingReq(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-xl text-xs text-blue-900 border border-blue-100">
              <strong>Regla 10 / 6 / 4:</strong> Evalúa el stock disponible para cada ítem. Si hay cobertura parcial, reserva lo disponible y deriva a Compras únicamente el saldo faltante sin duplicar compras.
            </div>

            <div className="space-y-3">
              {(evaluatingReq.items || []).map(it => {
                const invItem = inventoryItems.find(inv => inv.id === it.inventory_item_id || inv.name.toLowerCase() === it.description.toLowerCase());
                const solicitado = it.quantity;
                const fisico = invItem?.current_stock || 0;
                const reservado = invItem?.reserved_stock || 0;
                const disponible = Math.max(0, fisico - reservado);
                const aReservar = Math.min(solicitado, disponible);
                const saldoFaltante = Math.max(0, solicitado - aReservar);

                let badge = { label: 'Cobertura Total', cls: 'bg-emerald-100 text-emerald-800' };
                if (aReservar === 0) {
                  badge = { label: 'Sin Stock (Requiere Compra)', cls: 'bg-red-100 text-red-800' };
                } else if (saldoFaltante > 0) {
                  badge = { label: 'Cobertura Parcial', cls: 'bg-amber-100 text-amber-800' };
                }

                return (
                  <div key={it.id} className="p-4 bg-slate-50 border rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-gray-900">{it.description}</span>
                        <span className="text-gray-400 block text-[11px]">{invItem ? `Código: ${invItem.item_code || 'S/C'}` : 'Artículo no catalogado'}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                      <div className="bg-white p-2 rounded-xl border">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Solicitado</span>
                        <span className="font-bold font-mono text-gray-900">{solicitado} {it.unit}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Físico Pañol</span>
                        <span className="font-bold font-mono text-gray-700">{fisico} {it.unit}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Disponible</span>
                        <span className="font-bold font-mono text-blue-700">{disponible} {it.unit}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-600 block uppercase">A Reservar</span>
                        <span className="font-bold font-mono text-emerald-800">{aReservar} {it.unit}</span>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-600 block uppercase">Saldo a Compras</span>
                        <span className="font-bold font-mono text-amber-800">{saldoFaltante} {it.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                onClick={() => setEvaluatingReq(null)}
                className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-slate-100 text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const req = evaluatingReq;
                  setEvaluatingReq(null);
                  openDispatchModal(req);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                📦 Preparar Despacho de Stock
              </button>
              <button
                onClick={() => {
                  const req = evaluatingReq;
                  setEvaluatingReq(null);
                  openDeriveModal(req);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                🛒 Derivar Saldos a Compras
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Despacho desde Pañol ─── */}
      {dispatchModalReq && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-100 relative">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Pañolero Despachante</label>
                  <input
                    type="text"
                    value={dispatchedBy}
                    onChange={e => setDispatchedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
                    placeholder="Nombre de pañolero"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Chofer / Responsable</label>
                  <select
                    value={dispatchDriverName}
                    onChange={e => setDispatchDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
                  >
                    <option value="">— Seleccionar chofer —</option>
                    {employees.map((e: any) => (
                      <option key={e.id} value={`${e.first_name} ${e.last_name}`}>{e.first_name} {e.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Vehículo de Flota</label>
                  <select
                    value={dispatchVehicleId}
                    onChange={e => setDispatchVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
                  >
                    <option value="">— Seleccionar vehículo —</option>
                    {allVehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.code} - {v.description} ({v.plate || 'S/P'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">Cantidades a Despachar</label>
                <div className="space-y-2">
                  {(dispatchModalReq.items || []).map((it: any) => (
                    <div key={it.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-gray-800 text-sm block truncate">{it.description}</span>
                        <span className="text-xs text-gray-500">Solicitado: <strong>{it.quantity} {it.unit}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">A enviar:</span>
                        <input
                          type="number"
                          value={dispatchItemsState[it.id]?.quantity_sent ?? it.quantity}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setDispatchItemsState(prev => ({
                              ...prev,
                              [it.id]: { ...prev[it.id], quantity_sent: val }
                            }));
                          }}
                          className="w-20 px-2 py-1.5 border border-sky-300 rounded-lg text-sm font-mono text-center font-bold bg-white"
                        />
                        <span className="text-xs text-gray-600 font-medium">{it.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button onClick={() => setDispatchModalReq(null)} className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-slate-100 text-xs">
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDispatch}
                  disabled={dispatchMutation.isPending}
                  className="btn-primary bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md"
                >
                  {dispatchMutation.isPending ? 'Guardando...' : 'Confirmar Despacho'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Modal Recepción en Obra ─── */}
      {receptionModalReq && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Recepción de Materiales en Obra</span>
                <h3 className="font-bold text-lg text-gray-800">Pedido PED-{receptionModalReq.id.slice(0, 8).toUpperCase()}</h3>
              </div>
              <button onClick={() => setReceptionModalReq(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Receptor en Obra *</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="Nombre de quien recibe"
                />
              </div>

              <div className="space-y-2">
                {(receptionModalReq.items || []).map((it: any) => (
                  <div key={it.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="font-bold text-gray-800 text-sm block">{it.description}</span>
                      <span className="text-xs text-gray-500">Despachado: <strong>{it.quantity_sent ?? it.quantity} {it.unit}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700">Recibido:</span>
                      <input
                        type="number"
                        value={receptionItemsState[it.id]?.quantity_received ?? (it.quantity_sent ?? it.quantity)}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setReceptionItemsState(prev => ({
                            ...prev,
                            [it.id]: { ...prev[it.id], quantity_received: val }
                          }));
                        }}
                        className="w-20 px-2 py-1.5 border border-emerald-300 rounded-lg text-sm font-mono text-center font-bold bg-white"
                      />
                      <span className="text-xs text-gray-600">{it.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button onClick={() => setReceptionModalReq(null)} className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-slate-100 text-xs">
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReception}
                  disabled={receiveMutation.isPending}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md"
                >
                  {receiveMutation.isPending ? 'Confirmando...' : 'Confirmar Recepción Conforme'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Modal Derivar Saldos a Compras ─── */}
      {deriveModalReq && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Solicitud de Abastecimiento</span>
                <h3 className="font-bold text-base text-gray-900">Derivar Saldos a Compras</h3>
              </div>
              <button onClick={() => setDeriveModalReq(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <p className="text-xs text-gray-500">
              Se creará un requerimiento en Compras por los saldos no disponibles en Pañol Central para este pedido.
            </p>

            <div className="space-y-2">
              {deriveItems.map((it, idx) => (
                <div key={idx} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{it.description}</span>
                  <span className="font-mono font-bold text-amber-800">{it.quantity} {it.unit}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setDeriveModalReq(null)} className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-slate-100 text-xs">
                Cancelar
              </button>
              <button
                onClick={submitDeriveToPurchases}
                disabled={createPO.isPending}
                className="btn-primary bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md"
              >
                {createPO.isPending ? 'Derivando...' : 'Confirmar Derivación a Compras'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Modal Cancelar Pedido con Motivo ─── */}
      {cancelModalReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" /> Cancelar Pedido de Obra
            </h3>
            <p className="text-xs text-gray-500">
              Para asegurar la trazabilidad, se registrará el motivo de la anulación y se liberarán las reservas pendientes sin eliminar el histórico.
            </p>
            <div>
              <label className="font-bold text-gray-700 block text-xs mb-1">Motivo de Cancelación *</label>
              <textarea
                required
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs"
                rows={3}
                placeholder="Ej: Modificación del plano de obra, ya no se requiere el insumo..."
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button onClick={() => setCancelModalReq(null)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-slate-100">
                Volver
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Flujo 3D / Trazabilidad ─── */}
      {viewFlowReq && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">
                  Trazabilidad del Pedido #{viewFlowReq.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(viewFlowReq.project as any)?.name || 'Obra'} · Solicitado por {viewFlowReq.requested_by}
                </p>
              </div>
              <button
                onClick={() => setViewFlowReq(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <RequestFlowDiagram3D
              currentStatus={
                viewFlowReq.status === 'received' ? 'recepcion' :
                viewFlowReq.status === 'ordered' ? 'despacho' :
                viewFlowReq.status === 'approved' ? 'logistica' :
                (viewFlowReq.status as string) === 'reviewed' ? 'pañol' : 'pending'
              }
              hasDerivation={(viewFlowReq.items || []).some((i: any) => i.coverage_status === 'derivado_compras' || (i.purchased_quantity || 0) > 0)}
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewFlowReq(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
