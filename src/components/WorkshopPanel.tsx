import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Plus, CheckCircle2, Send, XCircle, Eye, FileText,
  ShoppingBag, Trash2, Paperclip, MessageSquare, Check, X, Edit2
} from 'lucide-react';
import {
  useFleetMaintenanceOrders,
  useCreateFleetMaintenanceOrder,
  useUpdateFleetMaintenanceOrder,
  useFuelVehicles,
  useCreatePurchaseRequest
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useModalStore } from '../store/useModalStore';
import { ModalPortal } from './common/ModalPortal';
import type { FleetMaintenanceOrder, FuelVehicle } from '../lib/types';
import { checkVehicleMaintenance, isBatanUnit } from '../lib/vehicleMaintenance';

export type OtCategory = 'service' | 'repuestos' | 'neumáticos' | 'otros';

export type OtComprasStatus =
  | 'borrador'
  | 'enviada_compras'
  | 'aprobada'
  | 'rechazada'
  | 'compra_realizada'
  | 'cerrada';

export interface OtLineItem {
  id: string;
  type: 'repuesto' | 'servicio';
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface OtAuditEntry {
  timestamp: string;
  user: string;
  fromStatus: string;
  toStatus: string;
  comment?: string;
}

export interface OtRichMetadata {
  __ecar_ot_v1: true;
  otNumber: string;
  motivo: string;
  category: OtCategory;
  supplierSuggested: string;
  applicant: string;
  attachmentUrl: string;
  items: OtLineItem[];
  comprasStatus: OtComprasStatus;
  approverName?: string | null;
  approvalDate?: string | null;
  approvalComment?: string | null;
  purchaseRequestId?: string | null;
  notes?: string;
  auditLog: OtAuditEntry[];
}

export function parseOtMetadata(order: FleetMaintenanceOrder, indexFallback = 1): OtRichMetadata {
  const defaultOtNum = `OT-${String(indexFallback).padStart(4, '0')}`;
  if (order.description && order.description.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(order.description);
      if (parsed && parsed.__ecar_ot_v1) {
        return {
          __ecar_ot_v1: true,
          otNumber: parsed.otNumber || defaultOtNum,
          motivo: parsed.motivo || order.title || 'Mantenimiento',
          category: parsed.category || 'service',
          supplierSuggested: parsed.supplierSuggested || '',
          applicant: parsed.applicant || order.created_by || 'Taller',
          attachmentUrl: parsed.attachmentUrl || '',
          items: Array.isArray(parsed.items) ? parsed.items : [],
          comprasStatus: parsed.comprasStatus || (order.status === 'terminado' ? 'cerrada' : 'enviada_compras'),
          approverName: parsed.approverName || null,
          approvalDate: parsed.approvalDate || null,
          approvalComment: parsed.approvalComment || null,
          purchaseRequestId: parsed.purchaseRequestId || null,
          notes: parsed.notes || '',
          auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
        };
      }
    } catch {
      // Fallback to legacy plain text description
    }
  }

  const totalEst = Number(order.total_cost || (Number(order.cost_materials || 0) + Number(order.cost_labor || 0)) || 0);
  return {
    __ecar_ot_v1: true,
    otNumber: defaultOtNum,
    motivo: order.title || 'Service / Mantenimiento',
    category: 'service',
    supplierSuggested: order.mechanic_assigned || '',
    applicant: order.created_by || 'Panel Flota',
    attachmentUrl: '',
    items: totalEst > 0
      ? [{ id: 'legacy-1', type: 'servicio', description: order.title, quantity: 1, unitPrice: totalEst }]
      : [],
    comprasStatus: order.status === 'terminado' ? 'cerrada' : 'enviada_compras',
    approverName: null,
    approvalDate: null,
    approvalComment: null,
    purchaseRequestId: null,
    notes: order.description || '',
    auditLog: [
      {
        timestamp: order.created_at || new Date().toISOString(),
        user: order.created_by || 'Sistema',
        fromStatus: '-',
        toStatus: 'enviada_compras',
        comment: 'Orden registrada en Taller',
      },
    ],
  };
}

const CATEGORY_BADGES: Record<OtCategory, { label: string; className: string }> = {
  service: { label: 'service', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  repuestos: { label: 'repuestos', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  'neumáticos': { label: 'neumáticos', className: 'bg-amber-50 text-amber-800 border border-amber-200' },
  otros: { label: 'otros', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

const COMPRAS_STATUS_CONFIG: Record<OtComprasStatus, { label: string; badgeClass: string }> = {
  borrador: {
    label: 'Borrador',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
  },
  enviada_compras: {
    label: 'Enviada a Compras',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300',
  },
  aprobada: {
    label: 'Aprobada',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
  },
  rechazada: {
    label: 'Rechazada',
    badgeClass: 'bg-red-50 text-red-700 border border-red-300',
  },
  compra_realizada: {
    label: 'Compra realizada',
    badgeClass: 'bg-sky-50 text-sky-700 border border-sky-300',
  },
  cerrada: {
    label: 'Cerrada',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  },
};

function formatARS(val: number) {
  return `$ ${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface WorkshopPanelProps {
  initialVehicleDraft?: FuelVehicle | null;
  onClearInitialDraft?: () => void;
}

export const WorkshopPanel: React.FC<WorkshopPanelProps> = ({
  initialVehicleDraft,
  onClearInitialDraft,
}) => {
  const { profile } = useAuth();
  const { data: orders = [], isLoading } = useFleetMaintenanceOrders();
  const { data: allVehicles = [] } = useFuelVehicles();
  const vehicles = useMemo(() => allVehicles.filter(v => !isBatanUnit(v)), [allVehicles]);

  const createOrder = useCreateFleetMaintenanceOrder();
  const updateOrder = useUpdateFleetMaintenanceOrder();
  const createPurchaseRequest = useCreatePurchaseRequest();

  const currentUserName = profile?.full_name || profile?.email || 'Gerencia';

  // Enrich orders with parsed metadata & chronological OT numbering
  const enrichedOrders = useMemo(() => {
    const total = orders.length;
    return orders.map((order, idx) => {
      const seqNum = total - idx;
      const meta = parseOtMetadata(order, seqNum);
      const itemsTotal = meta.items.reduce((acc, it) => acc + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
      const estimatedTotal = itemsTotal > 0 ? itemsTotal : Number(order.total_cost || 0);
      return { order, meta, estimatedTotal };
    });
  }, [orders]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | OtComprasStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | OtCategory>('all');

  // Create / Edit OT Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [category, setCategory] = useState<OtCategory>('service');
  const [supplierSuggested, setSupplierSuggested] = useState('');
  const [applicant, setApplicant] = useState(currentUserName);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OtLineItem[]>([
    { id: 'item-1', type: 'servicio', description: '', quantity: 1, unitPrice: 0 },
  ]);

  // Detail & Approval Modal state
  const [detailTarget, setDetailTarget] = useState<{ order: FleetMaintenanceOrder; meta: OtRichMetadata; estimatedTotal: number } | null>(null);
  const [decisionAction, setDecisionAction] = useState<'aprobada' | 'rechazada' | 'compra_realizada' | 'cerrada' | null>(null);
  const [decisionComment, setDecisionComment] = useState('');

  const nextOtCode = useMemo(() => {
    return `OT-${String(orders.length + 1).padStart(4, '0')}`;
  }, [orders.length]);

  // Open pre-filled modal when triggered from "Generar OT Taller" in Cronograma Service
  useEffect(() => {
    if (initialVehicleDraft) {
      const check = checkVehicleMaintenance(initialVehicleDraft);
      setEditingOrderId(null);
      setVehicleId(initialVehicleDraft.id);
      setMotivo(check.summary || `Service preventivo — ${initialVehicleDraft.code}`);
      setCategory('service');
      setSupplierSuggested('');
      setApplicant(currentUserName);
      setAttachmentUrl('');
      setNotes(
        `${check.detail || ''}${initialVehicleDraft.maintenance_notes ? ` · ${initialVehicleDraft.maintenance_notes}` : ''}`.trim()
      );
      setItems([
        {
          id: `item-${Date.now()}`,
          type: 'servicio',
          description: initialVehicleDraft.maintenance_notes || `Service preventivo ${initialVehicleDraft.code}`,
          quantity: 1,
          unitPrice: 0,
        },
      ]);
      setShowModal(true);
      onClearInitialDraft?.();
    }
  }, [initialVehicleDraft, currentUserName, onClearInitialDraft]);

  const openNewModal = () => {
    setEditingOrderId(null);
    setVehicleId('');
    setMotivo('');
    setCategory('service');
    setSupplierSuggested('');
    setApplicant(currentUserName);
    setAttachmentUrl('');
    setNotes('');
    setItems([{ id: `item-${Date.now()}`, type: 'servicio', description: '', quantity: 1, unitPrice: 0 }]);
    setShowModal(true);
  };

  const openEditModal = (entry: { order: FleetMaintenanceOrder; meta: OtRichMetadata }) => {
    setEditingOrderId(entry.order.id);
    setVehicleId(entry.order.vehicle_id || '');
    setMotivo(entry.meta.motivo);
    setCategory(entry.meta.category);
    setSupplierSuggested(entry.meta.supplierSuggested);
    setApplicant(entry.meta.applicant || currentUserName);
    setAttachmentUrl(entry.meta.attachmentUrl || '');
    setNotes(entry.meta.notes || '');
    setItems(
      entry.meta.items.length > 0
        ? entry.meta.items
        : [{ id: `item-${Date.now()}`, type: 'servicio', description: entry.meta.motivo, quantity: 1, unitPrice: 0 }]
    );
    setShowModal(true);
  };

  const addLineItem = () => {
    setItems(prev => [
      ...prev,
      { id: `item-${Date.now()}-${prev.length}`, type: 'repuesto', description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const updateLineItem = (id: string, patch: Partial<OtLineItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeLineItem = (id: string) => {
    setItems(prev => (prev.length > 1 ? prev.filter(it => it.id !== id) : prev));
  };

  const formTotals = useMemo(() => {
    let materials = 0;
    let labor = 0;
    for (const it of items) {
      const sub = Number(it.quantity || 0) * Number(it.unitPrice || 0);
      if (it.type === 'repuesto') materials += sub;
      else labor += sub;
    }
    return { materials, labor, total: materials + labor };
  }, [items]);

  const handleSaveOt = async (targetComprasStatus: 'borrador' | 'enviada_compras') => {
    if (!vehicleId || !motivo.trim()) {
      useModalStore.getState().showAlert('Campos requeridos', 'Seleccioná el vehículo e indicá el motivo de la OT.');
      return;
    }

    const cleanItems = items.filter(i => i.description.trim() !== '');
    if (targetComprasStatus === 'enviada_compras' && cleanItems.length === 0) {
      useModalStore.getState().showAlert('Ítems requeridos', 'Agregá al menos un ítem (repuesto o servicio) con su importe estimado para enviar la solicitud a Compras.');
      return;
    }

    const selectedVehicle = allVehicles.find(v => v.id === vehicleId);
    const existingEntry = editingOrderId ? enrichedOrders.find(e => e.order.id === editingOrderId) : null;
    const otNumber = existingEntry ? existingEntry.meta.otNumber : nextOtCode;

    let purchaseRequestId = existingEntry?.meta.purchaseRequestId || null;

    try {
      // If sending to Compras and not yet linked to a purchase_request, create one so Gerencia de Compras gets notified
      if (targetComprasStatus === 'enviada_compras' && !purchaseRequestId) {
        try {
          const prItems = cleanItems.map(it => ({
            description: `[${otNumber} · ${selectedVehicle?.code || 'Flota'}] ${it.description}`,
            quantity: Number(it.quantity || 1),
            unit: it.type === 'servicio' ? 'serv' : 'u',
            notes: `Proveedor sug.: ${supplierSuggested || 'A definir'} · Est. unit.: ${formatARS(it.unitPrice)}`,
          }));
          const createdPr = await createPurchaseRequest.mutateAsync({
            requested_by: applicant || currentUserName,
            urgency: 'urgent',
            status: 'pending',
            request_type: 'purchase',
            notes: `[${otNumber}] Solicitud de Gasto de Taller — Unidad ${selectedVehicle?.code || ''} (${selectedVehicle?.description || ''}) · Categoría: ${category.toUpperCase()} · Motivo: ${motivo.trim()} · Total Est.: ${formatARS(formTotals.total)}`,
            items: prItems,
          });
          if (createdPr?.id) {
            purchaseRequestId = createdPr.id;
          }
        } catch (prErr) {
          console.warn('Could not sync purchase_request row, continuing with OT persistence:', prErr);
        }
      }

      const nowIso = new Date().toISOString();
      const prevLog = existingEntry?.meta.auditLog || [];
      const newAuditEntry: OtAuditEntry = {
        timestamp: nowIso,
        user: currentUserName,
        fromStatus: existingEntry?.meta.comprasStatus || '-',
        toStatus: targetComprasStatus,
        comment:
          targetComprasStatus === 'enviada_compras'
            ? `Solicitud enviada a Gerencia de Compras (${formatARS(formTotals.total)})`
            : 'Guardada como borrador en Taller',
      };

      const metadata: OtRichMetadata = {
        __ecar_ot_v1: true,
        otNumber,
        motivo: motivo.trim(),
        category,
        supplierSuggested: supplierSuggested.trim(),
        applicant: applicant.trim() || currentUserName,
        attachmentUrl: attachmentUrl.trim(),
        items: cleanItems,
        comprasStatus: targetComprasStatus,
        approverName: existingEntry?.meta.approverName || null,
        approvalDate: existingEntry?.meta.approvalDate || null,
        approvalComment: existingEntry?.meta.approvalComment || null,
        purchaseRequestId,
        notes: notes.trim(),
        auditLog: [...prevLog, newAuditEntry],
      };

      const odometerReading =
        selectedVehicle?.tracking_type === 'hours'
          ? Math.round(selectedVehicle?.current_hours || 0)
          : (selectedVehicle?.current_km || null);

      if (editingOrderId) {
        await updateOrder.mutateAsync({
          id: editingOrderId,
          vehicle_id: vehicleId,
          title: `${otNumber} · ${motivo.trim()}`,
          description: JSON.stringify(metadata),
          mechanic_assigned: supplierSuggested.trim() || null,
          cost_materials: formTotals.materials,
          cost_labor: formTotals.labor,
        });
      } else {
        await createOrder.mutateAsync({
          vehicle_id: vehicleId,
          title: `${otNumber} · ${motivo.trim()}`,
          description: JSON.stringify(metadata),
          mechanic_assigned: supplierSuggested.trim() || null,
          status: 'pendiente',
          start_date: nowIso.slice(0, 10),
          cost_materials: formTotals.materials,
          cost_labor: formTotals.labor,
          odometer_at_entry: odometerReading,
          created_by: applicant.trim() || currentUserName,
        });
      }

      setShowModal(false);
      useModalStore.getState().showAlert(
        targetComprasStatus === 'enviada_compras' ? 'OT Enviada a Compras' : 'Borrador Guardado',
        targetComprasStatus === 'enviada_compras'
          ? `La orden ${otNumber} fue enviada a Gerencia de Compras por un total estimado de ${formatARS(formTotals.total)}.`
          : `La orden ${otNumber} quedó guardada como borrador.`
      );
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo guardar la Orden de Taller.');
    }
  };

  const handleTransitionStatus = async () => {
    if (!detailTarget || !decisionAction) return;
    if (decisionAction === 'rechazada' && !decisionComment.trim()) {
      useModalStore.getState().showAlert('Motivo requerido', 'Ingresá el motivo o comentario del rechazo.');
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedAudit: OtAuditEntry = {
      timestamp: nowIso,
      user: currentUserName,
      fromStatus: detailTarget.meta.comprasStatus,
      toStatus: decisionAction,
      comment: decisionComment.trim() || undefined,
    };

    const updatedMeta: OtRichMetadata = {
      ...detailTarget.meta,
      comprasStatus: decisionAction,
      approverName:
        decisionAction === 'aprobada' || decisionAction === 'rechazada'
          ? currentUserName
          : detailTarget.meta.approverName,
      approvalDate:
        decisionAction === 'aprobada' || decisionAction === 'rechazada'
          ? nowIso
          : detailTarget.meta.approvalDate,
      approvalComment: decisionComment.trim() || detailTarget.meta.approvalComment || null,
      auditLog: [...detailTarget.meta.auditLog, updatedAudit],
    };

    const nextFleetStatus: FleetMaintenanceOrder['status'] =
      decisionAction === 'cerrada'
        ? 'terminado'
        : decisionAction === 'aprobada' || decisionAction === 'compra_realizada'
          ? 'en_taller'
          : 'pendiente';

    try {
      await updateOrder.mutateAsync({
        id: detailTarget.order.id,
        description: JSON.stringify(updatedMeta),
        status: nextFleetStatus,
        completion_date: decisionAction === 'cerrada' ? nowIso.slice(0, 10) : detailTarget.order.completion_date,
      });

      setDetailTarget({
        ...detailTarget,
        order: { ...detailTarget.order, status: nextFleetStatus, description: JSON.stringify(updatedMeta) },
        meta: updatedMeta,
      });
      setDecisionAction(null);
      setDecisionComment('');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo actualizar el estado de la OT.');
    }
  };

  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter(entry => {
      if (statusFilter !== 'all' && entry.meta.comprasStatus !== statusFilter) return false;
      if (categoryFilter !== 'all' && entry.meta.category !== categoryFilter) return false;
      return true;
    });
  }, [enrichedOrders, statusFilter, categoryFilter]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando Órdenes de Taller...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Wrench className="text-amber-600" size={20} /> Órdenes de Taller vinculadas a Compras
          </h3>
          <p className="text-xs text-gray-500">
            Toda OT que requiera compra de repuestos, neumáticos o servicios externos se aprueba en Gerencia de Compras.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewModal}
          className="btn-primary flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> + Nueva OT
        </button>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 mr-1">Estado Compras:</span>
          {(
            [
              { id: 'all', label: `Todas (${enrichedOrders.length})` },
              { id: 'borrador', label: 'Borrador' },
              { id: 'enviada_compras', label: 'Enviada a Compras' },
              { id: 'aprobada', label: 'Aprobada' },
              { id: 'rechazada', label: 'Rechazada' },
              { id: 'compra_realizada', label: 'Compra realizada' },
              { id: 'cerrada', label: 'Cerrada' },
            ] as const
          ).map(pill => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-ecar-blue text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500">Categoría:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as 'all' | OtCategory)}
            className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-semibold bg-gray-50"
          >
            <option value="all">Todas las categorías</option>
            <option value="service">Service</option>
            <option value="repuestos">Repuestos</option>
            <option value="neumáticos">Neumáticos</option>
            <option value="otros">Otros</option>
          </select>
        </div>
      </div>

      {/* Main OT Table matching PDF Spec */}
      <div className="light-card overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Wrench size={40} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No hay Órdenes de Taller para el filtro seleccionado</p>
            <p className="text-xs mt-1">Usá "+ Nueva OT" o "Generar OT Taller" desde el Cronograma de Service.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>OT</th>
                  <th>Vehículo</th>
                  <th>Motivo</th>
                  <th>Categoría</th>
                  <th className="text-right">Total est.</th>
                  <th>Compras</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(entry => {
                  const { order, meta, estimatedTotal } = entry;
                  const catBadge = CATEGORY_BADGES[meta.category] || CATEGORY_BADGES.otros;
                  const compStatus = COMPRAS_STATUS_CONFIG[meta.comprasStatus] || COMPRAS_STATUS_CONFIG.enviada_compras;
                  const vehicleLabel = order.vehicle
                    ? `${order.vehicle.code} — ${order.vehicle.description}`
                    : allVehicles.find(v => v.id === order.vehicle_id)?.code || 'Unidad';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-mono font-bold text-xs text-slate-800 whitespace-nowrap">
                        {meta.otNumber}
                        <div className="text-[10px] font-normal text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('es-AR')}
                        </div>
                      </td>
                      <td className="font-semibold text-gray-800">
                        {vehicleLabel}
                      </td>
                      <td>
                        <div className="font-medium text-gray-800">{meta.motivo}</div>
                        {meta.supplierSuggested && (
                          <div className="text-[11px] text-gray-500">Prov. sug.: {meta.supplierSuggested}</div>
                        )}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${catBadge.className}`}>
                          {catBadge.label}
                        </span>
                      </td>
                      <td className="text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {formatARS(estimatedTotal)}
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${compStatus.badgeClass}`}>
                            {compStatus.label}
                          </span>
                          {meta.approverName && meta.comprasStatus === 'aprobada' && (
                            <span className="text-xs text-gray-500">por {meta.approverName}</span>
                          )}
                          {meta.approvalComment && (
                            <button
                              type="button"
                              onClick={() => {
                                setDetailTarget(entry);
                                setDecisionAction(null);
                              }}
                              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare size={12} /> ver comentario
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailTarget(entry);
                              setDecisionAction(null);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Ver detalle / Aprobar en Compras"
                          >
                            <Eye size={15} />
                          </button>
                          {(meta.comprasStatus === 'borrador' || meta.comprasStatus === 'rechazada') && (
                            <button
                              type="button"
                              onClick={() => openEditModal(entry)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                              title="Editar OT y Reenviar a Compras"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
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

      {/* Create / Edit OT Modal */}
      <ModalPortal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-5 bg-gradient-to-r from-ecar-blueDark to-ecar-blue text-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Wrench size={20} /> {editingOrderId ? 'Editar Orden de Taller' : `Nueva Orden de Taller (${nextOtCode})`}
              </h3>
              <p className="text-xs text-ecar-blueLight mt-0.5">
                Solicitud de gasto vinculada a Gerencia de Compras
              </p>
            </div>
            <button type="button" onClick={() => setShowModal(false)} className="text-white/70 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehículo / Unidad *</label>
                <select
                  value={vehicleId}
                  onChange={e => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:bg-white"
                  required
                >
                  <option value="">Seleccionar unidad...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.code} — {v.description} {v.plate ? `(${v.plate})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as OtCategory)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:bg-white font-semibold"
                >
                  <option value="service">Service preventivo</option>
                  <option value="repuestos">Repuestos</option>
                  <option value="neumáticos">Neumáticos</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo de la OT *</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Ej: Service vencido (+1.216 km) / Cambio 2 cubiertas delanteras"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor Sugerido</label>
                <input
                  type="text"
                  value={supplierSuggested}
                  onChange={e => setSupplierSuggested(e.target.value)}
                  placeholder="Ej: Cuyo Parts / Gomalar SRL"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Ítems Solicitados (Repuestos / Servicios) *
                </label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-xs font-bold text-ecar-blue hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Agregar ítem
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase">
                    <tr>
                      <th className="p-2.5 text-left w-28">Tipo</th>
                      <th className="p-2.5 text-left">Descripción de Repuesto o Servicio</th>
                      <th className="p-2.5 text-right w-20">Cant.</th>
                      <th className="p-2.5 text-right w-32">Unitario Est. ($)</th>
                      <th className="p-2.5 text-right w-28">Subtotal</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(it => (
                      <tr key={it.id}>
                        <td className="p-2">
                          <select
                            value={it.type}
                            onChange={e => updateLineItem(it.id, { type: e.target.value as 'repuesto' | 'servicio' })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="repuesto">Repuesto</option>
                            <option value="servicio">Servicio</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={it.description}
                            onChange={e => updateLineItem(it.id, { description: e.target.value })}
                            placeholder="Ej: Filtro de aceite + mano de obra / Cubierta 265/65 R17"
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={1}
                            step="1"
                            value={it.quantity}
                            onChange={e => updateLineItem(it.id, { quantity: Math.max(1, parseFloat(e.target.value) || 1) })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            step="100"
                            value={it.unitPrice || ''}
                            onChange={e => updateLineItem(it.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-gray-800">
                          {formatARS(Number(it.quantity || 0) * Number(it.unitPrice || 0))}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(it.id)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                            title="Quitar ítem"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-gray-200">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right text-gray-600 uppercase">
                        Total Estimado Solicitud:
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm text-ecar-blue">
                        {formatARS(formTotals.total)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Solicitante</label>
                <input
                  type="text"
                  value={applicant}
                  onChange={e => setApplicant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Adjunto / Link de Presupuesto (opcional)
                </label>
                <div className="relative">
                  <Paperclip size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={attachmentUrl}
                    onChange={e => setAttachmentUrl(e.target.value)}
                    placeholder="URL o referencia de presupuesto PDF..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas adicionales / Observaciones</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalle técnico adicional para Gerencia de Compras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-gray-200 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSaveOt('borrador')}
              disabled={createOrder.isPending || updateOrder.isPending}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-bold transition-all cursor-pointer"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              onClick={() => handleSaveOt('enviada_compras')}
              disabled={createOrder.isPending || updateOrder.isPending}
              className="btn-primary flex items-center gap-2 cursor-pointer"
            >
              <Send size={15} /> Enviar Solicitud a Compras
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Detail, Approval & Audit Log Modal */}
      <ModalPortal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} maxWidth="max-w-2xl">
        {detailTarget && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-amber-400">{detailTarget.meta.otNumber}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${COMPRAS_STATUS_CONFIG[detailTarget.meta.comprasStatus].badgeClass}`}>
                    {COMPRAS_STATUS_CONFIG[detailTarget.meta.comprasStatus].label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mt-1">{detailTarget.meta.motivo}</p>
              </div>
              <button type="button" onClick={() => setDetailTarget(null)} className="text-white/70 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Vehículo</span>
                  <span className="font-bold text-gray-800">
                    {detailTarget.order.vehicle?.code || 'Unidad'} — {detailTarget.order.vehicle?.description || ''}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Categoría</span>
                  <span className="font-bold text-gray-800 uppercase">{detailTarget.meta.category}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Proveedor Sugerido</span>
                  <span className="font-bold text-gray-800">{detailTarget.meta.supplierSuggested || 'A definir'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Solicitante</span>
                  <span className="font-bold text-gray-800">{detailTarget.meta.applicant}</span>
                </div>
              </div>

              {/* Approval Banner / Rejection Comment */}
              {detailTarget.meta.approvalComment && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    detailTarget.meta.comprasStatus === 'rechazada'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <p className="font-bold mb-0.5">
                    Comentario de Gerencia de Compras {detailTarget.meta.approverName ? `(${detailTarget.meta.approverName})` : ''}:
                  </p>
                  <p>{detailTarget.meta.approvalComment}</p>
                </div>
              )}

              {/* Items breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Detalle de Ítems Solicitados</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase">
                      <tr>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-left">Descripción</th>
                        <th className="p-2 text-right">Cant.</th>
                        <th className="p-2 text-right">Unitario</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailTarget.meta.items.map(it => (
                        <tr key={it.id}>
                          <td className="p-2 uppercase font-semibold text-gray-500">{it.type}</td>
                          <td className="p-2 font-medium text-gray-800">{it.description}</td>
                          <td className="p-2 text-right font-mono">{it.quantity}</td>
                          <td className="p-2 text-right font-mono">{formatARS(it.unitPrice)}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {formatARS(Number(it.quantity || 0) * Number(it.unitPrice || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-gray-200">
                      <tr>
                        <td colSpan={4} className="p-2 text-right uppercase">Total Estimado:</td>
                        <td className="p-2 text-right font-mono text-sm text-ecar-blue">
                          {formatARS(detailTarget.estimatedTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {detailTarget.meta.attachmentUrl && (
                <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 p-2.5 rounded-lg border border-blue-200">
                  <FileText size={14} />
                  <span className="font-bold">Presupuesto adjunto:</span>
                  <span className="truncate font-mono">{detailTarget.meta.attachmentUrl}</span>
                </div>
              )}

              {/* Workflow Actions for Gerencia de Compras / Taller */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Gestión de Aprobación (Gerencia de Compras)</h4>
                <div className="flex flex-wrap gap-2">
                  {detailTarget.meta.comprasStatus === 'enviada_compras' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setDecisionAction('aprobada')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} /> Aprobar Gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionAction('rechazada')}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle size={14} /> Rechazar con Comentario
                      </button>
                    </>
                  )}
                  {detailTarget.meta.comprasStatus === 'aprobada' && (
                    <button
                      type="button"
                      onClick={() => setDecisionAction('compra_realizada')}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag size={14} /> Marcar Compra Realizada
                    </button>
                  )}
                  {(detailTarget.meta.comprasStatus === 'compra_realizada' || detailTarget.meta.comprasStatus === 'aprobada') && (
                    <button
                      type="button"
                      onClick={() => setDecisionAction('cerrada')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Cerrar OT de Taller
                    </button>
                  )}
                </div>

                {decisionAction && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-bold text-gray-700">
                      {decisionAction === 'rechazada'
                        ? 'Motivo del rechazo (obligatorio) *'
                        : `Comentario / Observación para pasar a "${COMPRAS_STATUS_CONFIG[decisionAction].label}"`}
                    </label>
                    <input
                      type="text"
                      value={decisionComment}
                      onChange={e => setDecisionComment(e.target.value)}
                      placeholder="Ej: Autorizado según presupuesto adjunto / Pedir 2do presupuesto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDecisionAction(null);
                          setDecisionComment('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleTransitionStatus}
                        disabled={updateOrder.isPending}
                        className="px-4 py-1.5 rounded-lg bg-ecar-blue text-white text-xs font-bold hover:opacity-90 cursor-pointer"
                      >
                        Confirmar Cambio de Estado
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Audit History */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Historial de Auditoría de la OT</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {detailTarget.meta.auditLog.map((log, i) => (
                    <div key={i} className="text-[11px] flex items-start justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-bold text-gray-800">{log.user}</span>{' '}
                        <span className="text-gray-500">→</span>{' '}
                        <span className="font-semibold text-ecar-blue">
                          {COMPRAS_STATUS_CONFIG[log.toStatus as OtComprasStatus]?.label || log.toStatus}
                        </span>
                        {log.comment && <p className="text-gray-600 italic mt-0.5">"{log.comment}"</p>}
                      </div>
                      <span className="text-gray-400 font-mono shrink-0 ml-2">
                        {new Date(log.timestamp).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};
