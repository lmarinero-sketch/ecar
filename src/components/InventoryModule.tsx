import React, { useState, useMemo, useEffect } from 'react';
import {
  Package, Wrench, Search, Plus, X, ArrowDownToLine,
  RotateCcw, AlertTriangle, Boxes, User, Barcode,
  LayoutGrid, Trash2, Edit3, ShoppingBag,
  CheckCircle2, ChevronDown, History, Zap, ArrowUpRight,
  TrendingUp, TrendingDown, Filter, Download, RefreshCw,
  Eye, Truck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  useInventoryItems, useCreateInventoryItem, useInventoryMovements,
  useCreateInventoryMovement, useDeleteInventoryMovement, useToolAssignments, useCreateToolAssignment,
  useUpdateToolAssignment, useUpdateInventoryItem, useProjects, useEmployees,
  useWarehouseShelves, useCreateWarehouseShelf, useUpdateWarehouseShelf, useDeleteWarehouseShelf,
  useCreatePurchaseRequest, useDeleteInventoryItem, useCreateProject,
  useInventoryDeposits, useCreateDeposit, useUpdateDeposit, useDeleteDeposit,
  usePurchaseRequests,
  useAllPriceHistories
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { exportDispatchPdf } from '../lib/orderPdfExport';
import { useModalStore } from '../store/useModalStore';
import { createPortal } from 'react-dom';
import type { InventoryItem, WarehouseShelf, ToolAssignment, InventoryDeposit } from '../lib/types';
import { BarcodeLabel } from './BarcodeLabel';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { WebGLWarehouseGrid } from './WebGLWarehouseGrid';
import { WarehouseExcelImporter } from './warehouse/WarehouseExcelImporter';
import { ShelfFrontView } from './warehouse/ShelfFrontView';
import { PPEDeliveriesPanel } from './PPEDeliveriesPanel';
import { ItemPriceHistoryModal } from './inventory/ItemPriceHistoryModal';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

type Tab = 'stock' | 'movements' | 'reserved' | 'price_history' | 'deposits' | 'tools' | 'shelves' | 'epp';
type RepoItem = { name: string; quantity: number; unit: string; unit_cost: number; id: string; current_stock: number; min_stock: number };

const SHELF_TYPES: Record<WarehouseShelf['shelf_type'], { label: string, icon: string }> = {
  rack: { label: 'Rack / Estantería', icon: '🗄️' },
  pallet: { label: 'Zona Pallets', icon: '📦' },
  cabinet: { label: 'Gabinete / Armario', icon: '🔒' },
  floor: { label: 'Piso Abierto', icon: '⬜' },
  wall: { label: 'Pared / Perchero', icon: '🪝' },
};

const SHELF_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#6B7280'];

const formatShelfPosition = (shelfCode?: string, position?: string | null) => {
  if (!position) return shelfCode || '—';
  const pos = position.replace(/^N(\d+)-C(\d+)$/, '$1-$2');
  if (shelfCode) {
    if (pos.startsWith(`${shelfCode}-`)) return pos;
    if (pos.startsWith(shelfCode)) return pos;
    return `${shelfCode}-${pos}`;
  }
  return pos;
};

const parseShelfPosition = (shelfPos?: string | null): { level: string; bin: string } => {
  if (!shelfPos) return { level: '1', bin: '1' };
  const clean = shelfPos.trim().toUpperCase();
  
  // Format 1: "C-2-12", "C-1-10", "EST-01-2-12", "A-1-1"
  const parts = clean.split('-');
  if (parts.length >= 3) {
    const lvl = parts[parts.length - 2].replace(/\D/g, '');
    const bin = parts[parts.length - 1].replace(/\D/g, '');
    if (lvl && bin) return { level: lvl, bin: bin };
  } else if (parts.length === 2) {
    const lvl = parts[0].replace(/\D/g, '');
    const bin = parts[1].replace(/\D/g, '');
    if (lvl && bin) return { level: lvl, bin: bin };
  }

  // Format 2: "N2-C12" or "N2-B12" or "N2-12"
  const matchN = clean.match(/N?(\d+)[-_\s]*[CB]?(\d+)/i);
  if (matchN) {
    return { level: matchN[1], bin: matchN[2] };
  }

  return { level: '1', bin: '1' };
};

interface ItemMovementsAccordionProps {
  item: InventoryItem;
  projects: any[];
}

const ItemMovementsAccordion: React.FC<ItemMovementsAccordionProps> = ({ item, projects }) => {
  const { data: itemMovements, isLoading } = useInventoryMovements(item.id);
  const createMovement = useCreateInventoryMovement();
  const deleteMovement = useDeleteInventoryMovement();

  const [quickType, setQuickType] = useState<'in' | 'out'>('in');
  const [quickQty, setQuickQty] = useState('1');
  const [quickNotes, setQuickNotes] = useState('');
  const [quickProjectId, setQuickProjectId] = useState('');
  const [quickAssignedTo, setQuickAssignedTo] = useState('');

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(quickQty);
    if (isNaN(q) || q <= 0) {
      useModalStore.getState().showAlert('Atención', 'Ingresa una cantidad válida.');
      return;
    }

    try {
      await createMovement.mutateAsync({
        item_id: item.id,
        movement_type: quickType,
        quantity: q,
        project_id: quickProjectId || null,
        delivered_to_text: quickAssignedTo || null,
        notes: quickNotes || (quickType === 'in' ? 'Ingreso rápido de stock' : 'Egreso rápido de stock'),
      });

      useModalStore.getState().showAlert('Éxito', `Movimiento de ${quickType === 'in' ? 'Ingreso' : 'Egreso'} registrado.`);
      setQuickQty('1');
      setQuickNotes('');
      setQuickAssignedTo('');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo registrar el movimiento.');
    }
  };

  return (
    <div className="bg-slate-100/90 border-2 border-slate-300 rounded-2xl shadow-inner p-4 text-slate-800 space-y-4 my-1">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ecar-blue text-white flex items-center justify-center font-bold shadow-sm">
            <History size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              Histórico & Movimiento Rápido: <span className="text-ecar-blue font-black">{item.name}</span>
            </h4>
            <p className="text-xs text-slate-500">Kardex de transacciones y registro inmediato de stock.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
          <span className="text-slate-500">Stock Actual:</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{item.current_stock} {item.unit}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Movement Form */}
        <div className="lg:col-span-1 bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            <span>Registrar Movimiento Rápido</span>
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            {/* Tipo switch */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-200/60 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setQuickType('in')}
                className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  quickType === 'in'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownToLine size={14} /> + Ingreso
              </button>
              <button
                type="button"
                onClick={() => setQuickType('out')}
                className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  quickType === 'out'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight size={14} /> - Egreso
              </button>
            </div>

            {/* Cantidad & Obra */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Cantidad ({item.unit})</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quickQty}
                  onChange={e => setQuickQty(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ecar-blue focus:outline-none"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Obra / Proyecto</label>
                <select
                  value={quickProjectId}
                  onChange={e => setQuickProjectId(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ecar-blue focus:outline-none bg-white"
                >
                  <option value="">(Sin asignar / Pañol)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Asignado a */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Entregado a (Empleado/Chofer)</label>
              <input
                type="text"
                value={quickAssignedTo}
                onChange={e => setQuickAssignedTo(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ecar-blue focus:outline-none"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            {/* Nota */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Nota / Motivo</label>
              <input
                type="text"
                value={quickNotes}
                onChange={e => setQuickNotes(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ecar-blue focus:outline-none"
                placeholder={quickType === 'in' ? 'Ej. Ingreso inicial de stock' : 'Ej. Consumo directo en obra'}
              />
            </div>

            <button
              type="submit"
              disabled={createMovement.isPending}
              className={`w-full py-2 px-3 text-xs font-bold text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${
                quickType === 'in'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Zap size={14} />
              {createMovement.isPending ? 'Procesando...' : `Confirmar ${quickType === 'in' ? 'Ingreso' : 'Egreso'}`}
            </button>
          </form>
        </div>

        {/* Movements History Table */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <History size={14} className="text-ecar-blue" />
              Movimientos Recientes en Kardex
            </span>
            <span className="text-[11px] text-slate-400 font-normal normal-case">Histórico exclusivo de este ítem</span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-400 animate-pulse">Cargando Kardex...</div>
          ) : !itemMovements || itemMovements.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-400 text-xs">
              No hay movimientos registrados para este artículo aún.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3 text-right">Cant.</th>
                    <th className="py-2 px-3">Obra / Destinatario</th>
                    <th className="py-2 px-3">Notas</th>
                    <th className="py-2 px-3">Registrado Por</th>
                    <th className="py-2 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {itemMovements.map((m: any) => {
                    const isIngreso = m.movement_type === 'in' || m.movement_type === 'ingreso' || m.movement_type === 'purchase' || m.movement_type === 'return';
                    const isAjuste = m.movement_type === 'adjustment' || m.movement_type === 'ajuste';
                    const isAnnulled = (m.notes || '').includes('[ANULADO]');

                    return (
                      <tr 
                        key={m.id} 
                        className={`transition-colors ${
                          isAnnulled 
                            ? 'opacity-40 bg-slate-100/70 select-none' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {m.created_at ? new Date(m.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-2 px-3">
                          {isAnnulled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 border border-slate-300">
                              🚫 MOVIMIENTO ANULADO
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isAjuste ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              isIngreso ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {isAjuste ? '🔧 Ajuste' : isIngreso ? '📥 Ingreso' : '📤 Egreso'}
                            </span>
                          )}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${
                          isAnnulled ? 'line-through text-slate-400' : isIngreso ? 'text-emerald-600' : isAjuste ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {isIngreso ? `+${m.quantity}` : isAjuste ? m.quantity : `-${m.quantity}`} {item.unit}
                        </td>
                        <td className={`py-2 px-3 text-slate-700 text-[11px] truncate max-w-[120px] ${isAnnulled ? 'line-through text-slate-400' : ''}`}>
                          <div className="flex flex-col">
                            <span>{m.project?.name || '-'}</span>
                            {m.assigned_to && <span className="text-[9px] text-ecar-blue font-semibold uppercase">👤 {m.assigned_to}</span>}
                          </div>
                        </td>
                        <td className={`py-2 px-3 text-slate-500 text-[11px] truncate max-w-[180px] ${isAnnulled ? 'line-through italic text-slate-400' : ''}`} title={m.notes || ''}>
                          {m.notes || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[10px]">
                          {m.created_by || 'Web'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isAnnulled ? (
                            <span className="text-[10px] text-slate-400 font-semibold uppercase italic">Anulado</span>
                          ) : (
                            <button
                              onClick={async () => {
                                const actionName = isIngreso ? `Ingreso (+${m.quantity} ${item.unit})` : `Egreso (-${m.quantity} ${item.unit})`;
                                const newStockCalc = isIngreso ? Math.max(0, item.current_stock - m.quantity) : item.current_stock + m.quantity;
                                const confirmMsg = `¿Anular este movimiento de ${actionName}? El stock cambiará de ${item.current_stock} a ${newStockCalc}. El registro se conservará de forma transparente.`;
                                if (await useModalStore.getState().showConfirm('Confirmar Anulación de Kardex', confirmMsg)) {
                                  try {
                                    await deleteMovement.mutateAsync({
                                      movementId: m.id,
                                      itemId: item.id,
                                      movementType: m.movement_type,
                                      quantity: m.quantity,
                                      notes: m.notes
                                    });
                                    useModalStore.getState().showAlert('Éxito', 'Movimiento anulado correctamente y stock revertido.');
                                  } catch (err: any) {
                                    useModalStore.getState().showAlert('Error', err?.message || 'No se pudo anular el movimiento.');
                                  }
                                }
                              }}
                              disabled={deleteMovement.isPending}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                              title="Anular movimiento y revertir stock"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Modal de Devolución de Herramientas con Novedades ── */
const ReturnToolModal: React.FC<{
  assignment: ToolAssignment;
  onClose: () => void;
  onConfirm: (data: { status: 'returned' | 'damaged'; notes: string }) => Promise<void>;
}> = ({ assignment, onClose, onConfirm }) => {
  const [returnType, setReturnType] = useState<'normal' | 'damaged'>('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnType === 'damaged' && !notes.trim()) {
      useModalStore.getState().showAlert('Atención', 'Por favor explicá el detalle de la novedad o rotura de la herramienta.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        status: returnType === 'damaged' ? 'damaged' : 'returned',
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo registrar la devolución.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue p-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 p-4"><RotateCcw size={80} /></div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <RotateCcw size={20} className="text-emerald-400" /> Devolución de Herramienta a Pañol
            </h3>
            <p className="text-xs text-ecar-blueLight mt-0.5">Control de estado físico y registro de novedades al devolver</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors relative z-10"><X size={20} /></button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Item details card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Herramienta</span>
              <span className="font-mono text-ecar-blue font-bold">{(assignment.item as any)?.barcode || 'SIN-CÓDIGO'}</span>
            </div>
            <p className="text-sm font-black text-gray-800">{(assignment.item as any)?.name || 'Herramienta Pañol'}</p>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-gray-600">
              <div><span className="text-gray-400 font-semibold">Devuelve:</span> <span className="font-bold text-gray-800">{(assignment.employee as any)?.full_name || 'Sin especificar'}</span></div>
              <div><span className="text-gray-400 font-semibold">Obra Destino:</span> <span className="font-bold text-gray-800">{(assignment.project as any)?.name || 'Uso General'}</span></div>
            </div>
          </div>

          {/* Condition Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
              Estado Físico al Entregar <span className="text-ecar-red">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReturnType('normal')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                  returnType === 'normal'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm ring-2 ring-emerald-400/30'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">🟢</span>
                  {returnType === 'normal' && <CheckCircle2 size={16} className="text-emerald-600" />}
                </div>
                <div>
                  <span className="font-bold text-xs block">En Buen Estado</span>
                  <span className="text-[10px] text-gray-500 font-medium">Reingresa al stock operativo normalmente.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReturnType('damaged')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                  returnType === 'damaged'
                    ? 'border-red-500 bg-red-50/80 text-red-900 shadow-sm ring-2 ring-red-400/30'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">🔴</span>
                  {returnType === 'damaged' && <AlertTriangle size={16} className="text-red-600" />}
                </div>
                <div>
                  <span className="font-bold text-xs block text-red-700">Con Novedad / Rota</span>
                  <span className="text-[10px] text-gray-500 font-medium">Bloquea la máquina y la pasa a Mantenimiento.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Observations / Novedad detail */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block flex items-center justify-between">
              <span>Observaciones / Novedad {returnType === 'damaged' && <span className="text-red-600 font-bold">*</span>}</span>
              <span className="text-[10px] text-gray-400 font-normal">Detallá cualquier rotura o desperfecto</span>
            </label>
            <textarea
              rows={3}
              required={returnType === 'damaged'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={returnType === 'damaged' ? "Ej: Máquina rota, se quemó el inducido y no enciende..." : "Ej: Devolución normal en pañol..."}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2.5">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`text-xs font-bold px-5 py-2.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                returnType === 'damaged' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting ? 'Guardando...' : returnType === 'damaged' ? '🔴 Registrar Devolución con Novedad' : '🟢 Registrar Devolución Normal'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const InventoryModule: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  const isPanolero = profile?.role === 'panolero';
  const { data: items, isLoading } = useInventoryItems();
  const { data: movements } = useInventoryMovements();
  const { data: assignments } = useToolAssignments();
  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();
  const { data: shelves } = useWarehouseShelves();
  const { data: deposits } = useInventoryDeposits();
  const { data: purchaseRequests } = usePurchaseRequests();
  const createItem = useCreateInventoryItem();
  const createMovement = useCreateInventoryMovement();
  const createAssignment = useCreateToolAssignment();
  const updateAssignment = useUpdateToolAssignment();
  const updateItem = useUpdateInventoryItem();
  const createShelf = useCreateWarehouseShelf();
  const updateShelf = useUpdateWarehouseShelf();
  const deleteShelf = useDeleteWarehouseShelf();
  const createPurchaseReq = useCreatePurchaseRequest();
  const deleteItem = useDeleteInventoryItem();
  const createProject = useCreateProject();
  const createDeposit = useCreateDeposit();
  const updateDeposit = useUpdateDeposit();
  const deleteDeposit = useDeleteDeposit();

  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [filterCat] = useState<string>('');
  const [filterShelf, setFilterShelf] = useState<string>('');
  const [showNewItem, setShowNewItem] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showMovement, setShowMovement] = useState<InventoryItem | null>(null);
  const [showAssign, setShowAssign] = useState<InventoryItem | null>(null);
  const [showBarcode, setShowBarcode] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  // Item Form state with Location/Bin coding [Letra]-[Estante]-[Bin]
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'material' as 'material' | 'herramienta' | 'consumible',
    unit: 'unidad',
    current_stock: '',
    min_stock: '',
    unit_cost: '',
    is_tool: false,
    barcode: '',
    location: '',
    deposit: 'DEPOSITO RAWSON',
    shelf_id: '',
    shelf_position: '',
    measure: '',
    tool_status: 'operativa' as 'operativa' | 'mantenimiento' | 'no_funciona'
  });
  
  const [shelfLevel, setShelfLevel] = useState('1');
  const [shelfBin, setShelfBin] = useState('1');

  const [movForm, setMovForm] = useState({ movement_type: 'out' as 'in' | 'out' | 'return' | 'adjustment', quantity: '', notes: '', project_id: '' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', project_id: '', notes: '' });
  const [showNewShelf, setShowNewShelf] = useState(false);
  const [editingShelf, setEditingShelf] = useState<WarehouseShelf | null>(null);
  const [shelfForm, setShelfForm] = useState({ code: '', name: '', shelf_type: 'rack', rows_count: '4', columns_count: '3', color: '#3B82F6', notes: '', rotation: '0' });
  const [assignShelfItem, setAssignShelfItem] = useState<InventoryItem | null>(null);
  const [shelfAssignForm, setShelfAssignForm] = useState({ shelf_id: '', shelf_position: '' });
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<InventoryDeposit | null>(null);
  const [depositForm, setDepositForm] = useState({ name: '', location: '' });
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoProjectId, setRepoProjectId] = useState<string>('');
  const [repoItems, setRepoItems] = useState<RepoItem[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [viewingShelf, setViewingShelf] = useState<WarehouseShelf | null>(null);

  const { data: allPriceHistories = [] } = useAllPriceHistories();

  // Advanced Filters (Matching Image 2)
  const [filterDeposit, setFilterDeposit] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterMeasure, setFilterMeasure] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('TODOS');

  // Modals state
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InventoryItem | null>(null);
  const [showQuickAdjustment, setShowQuickAdjustment] = useState<InventoryItem | null>(null);
  const [quickAdjQty, setQuickAdjQty] = useState('');
  const [quickAdjNotes, setQuickAdjNotes] = useState('');

  // Reserve Stock State
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveForm, setReserveForm] = useState({ itemId: '', quantity: '' });

  // Dispatch Cart State
  const [showDispatchCart, setShowDispatchCart] = useState(false);
  const [dispatchCartItems, setDispatchCartItems] = useState<{item: InventoryItem, qty: string}[]>(() => {
    try {
      const saved = localStorage.getItem('ecar_dispatch_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [dispatchProject, setDispatchProject] = useState(() => localStorage.getItem('ecar_dispatch_cart_project') || '');
  const [dispatchEmployee, setDispatchEmployee] = useState(() => localStorage.getItem('ecar_dispatch_cart_employee') || '');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatchSearch, setDispatchSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('ecar_dispatch_cart_items', JSON.stringify(dispatchCartItems));
  }, [dispatchCartItems]);
  useEffect(() => {
    localStorage.setItem('ecar_dispatch_cart_project', dispatchProject);
  }, [dispatchProject]);
  useEffect(() => {
    localStorage.setItem('ecar_dispatch_cart_employee', dispatchEmployee);
  }, [dispatchEmployee]);

  // EPP Form State

  const selectedShelfCode = useMemo(() => {
    const s = (shelves || []).find(x => x.id === newItem.shelf_id);
    return s ? s.code : '';
  }, [shelves, newItem.shelf_id]);

  const openRepoModal = (items: RepoItem[]) => {
    setRepoItems(items);
    setRepoProjectId('');
    setShowRepoModal(true);
  };

  const handleRepoSubmit = async () => {
    try {
      await createPurchaseReq.mutateAsync({
        project_id: repoProjectId || null,
        urgency: repoItems.some(i => i.current_stock === 0) ? 'urgent' as const : 'normal' as const,
        urgency_reason: repoItems.some(i => i.current_stock === 0) ? `Stock agotado de ${repoItems.filter(i => i.current_stock === 0).map(i => i.name).join(', ')}` : undefined,
        status: 'pending',
        requested_by: 'Logística (Reposición)',
        notes: `Reposición de ${repoItems.length} ítem(s). ${repoProjectId ? 'Asignado a proyecto/centro de costo.' : 'Sin proyecto asignado.'}`,
        items: repoItems.map(i => ({
          description: i.name,
          quantity: Math.max(i.min_stock * 2 - i.current_stock, i.min_stock),
          unit: i.unit || 'unidad',
          estimated_unit_cost: i.unit_cost || 0,
          inventory_item_id: i.id,
        }))
      });
      useModalStore.getState().showAlert('Éxito', `Solicitud de reposición enviada a Compras con ${repoItems.length} ítems.`);
      setShowRepoModal(false);
    } catch {
      useModalStore.getState().showAlert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  const seedDefaultShelves = async () => {
    const defaultShelves = [
      { code: 'A', name: 'Herramientas eléctricas', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#115C9C', grid_row: 30, grid_col: 40, grid_width: 220, grid_height: 120, notes: 'Taladros, amoladoras, sierras, cargadores y accesorios eléctricos.' },
      { code: 'B', name: 'Electricidad', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#0A3B66', grid_row: 30, grid_col: 300, grid_width: 220, grid_height: 120, notes: 'Cables, llaves térmicas, tomas, cajas, materiales de instalación eléctrica.' },
      { code: 'C', name: 'Gas', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#1E40AF', grid_row: 30, grid_col: 560, grid_width: 220, grid_height: 120, notes: 'Cañerías, llaves de paso, accesorios y materiales para instalaciones de gas.' },
      { code: 'D', name: 'Agua y Cloaca', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#0369A1', grid_row: 260, grid_col: 100, grid_width: 260, grid_height: 130, notes: 'Caños, accesorios sanitarios, materiales de agua y desagüe cloacal en conjunto.' },
      { code: 'E', name: 'EPP / Ferretería', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#0F766E', grid_row: 260, grid_col: 460, grid_width: 260, grid_height: 130, notes: 'Elementos de protección personal (cascos, guantes, arneses) junto con ferretería general (tornillos, bulones, varios).' }
    ];

    try {
      for (const s of defaultShelves) {
        const exists = (shelves || []).find(ex => ex.code === s.code);
        if (!exists) {
          await createShelf.mutateAsync(s);
        } else {
          await updateShelf.mutateAsync({ id: exists.id, ...s });
        }
      }
    } catch (err: any) {
      console.warn('Auto-seed warning:', err);
    }
  };

  useEffect(() => {
    if (shelves && shelves.length === 0) {
      seedDefaultShelves();
    }
  }, [shelves]);

  const generateRandomBarcode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewItem(prev => ({ ...prev, barcode: `ECAR-${result}` }));
  };

  const printTempBarcode = () => {
    if (!newItem.barcode) return;
    setShowBarcode({
      id: 'temp',
      tenant_id: '',
      name: newItem.name || 'Nuevo Ítem',
      barcode: newItem.barcode,
      category: newItem.category || 'material',
      location: newItem.location || 'Depósito',
      deposit: newItem.deposit || 'DEPOSITO RAWSON',
      shelf_id: newItem.shelf_id || null,
      current_stock: parseFloat(newItem.current_stock) || 0,
      unit: newItem.unit || 'unidad',
      is_tool: newItem.category === 'herramienta',
      min_stock: parseFloat(newItem.min_stock) || 0,
      unit_cost: parseFloat(newItem.unit_cost) || 0,
      qr_code: '',
      shelf_position: null,
      rubro: null,
      measure: null,
      notes: null,
      created_at: new Date().toISOString()
    });
  };

  const uniqueRubros = useMemo(() => {
    const set = new Set<string>();
    (items || []).forEach(i => {
      if (i.rubro) set.add(i.rubro);
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return (items || []).filter(i => {
      // General search or specific search
      const q = search ? search.toLowerCase().trim() : '';
      if (q) {
        const shelfName = i.shelf_id ? (shelves || []).find(s => s.id === i.shelf_id)?.name?.toLowerCase() : '';
        const matchSearch = 
          i.name.toLowerCase().includes(q) || 
          (i.item_code && i.item_code.toLowerCase().includes(q)) ||
          (i.barcode && i.barcode.toLowerCase().includes(q)) || 
          (i.shelf_position && i.shelf_position.toLowerCase().includes(q)) ||
          (i.location && i.location.toLowerCase().includes(q)) ||
          (shelfName && shelfName.includes(q));
        if (!matchSearch) return false;
      }

      // Filter by Deposit / Location
      if (filterDeposit) {
        if (i.deposit !== filterDeposit && i.deposit_id !== filterDeposit) return false;
      }
      if (filterShelf) {
        if (i.shelf_id !== filterShelf) return false;
      }

      // Filter by Code
      if (filterCode.trim()) {
        const c = filterCode.toLowerCase().trim();
        const itmCode = (i.item_code || i.barcode || '').toLowerCase();
        if (!itmCode.includes(c)) return false;
      }

      // Filter by Product Name
      if (filterProduct.trim()) {
        const p = filterProduct.toLowerCase().trim();
        if (!i.name.toLowerCase().includes(p)) return false;
      }

      // Filter by Measure / Talla
      if (filterMeasure.trim()) {
        const m = filterMeasure.toLowerCase().trim();
        if (!(i.measure || '').toLowerCase().includes(m)) return false;
      }

      // Filter by Rubro
      if (filterRubro) {
        const r = (i.rubro || i.category || '').toLowerCase();
        if (!r.includes(filterRubro.toLowerCase())) return false;
      }

      // Filter by Supplier
      if (filterSupplier) {
        const supMatch = (i.last_supplier?.name || '').toLowerCase().includes(filterSupplier.toLowerCase());
        if (!supMatch) return false;
      }

      // Filter by Stock Status (Matching Image 2)
      if (filterStockStatus === 'CON_STOCK' && i.current_stock <= 0) return false;
      if (filterStockStatus === 'SIN_STOCK' && i.current_stock > 0) return false;
      if (filterStockStatus === 'BAJO_MINIMO' && (i.current_stock > i.min_stock || i.min_stock === 0)) return false;
      if (filterStockStatus === 'CON_RESERVA' && (!i.reserved_stock || i.reserved_stock <= 0)) return false;

      // Filter category
      if (filterCat && i.category !== filterCat) return false;

      if (tab === 'tools' && !i.is_tool) return false;
      return true;
    });
  }, [items, search, filterCat, filterDeposit, filterShelf, filterCode, filterProduct, filterMeasure, filterRubro, filterSupplier, filterStockStatus, tab, shelves]);

  const exportStockExcel = () => {
    const data = filtered.map(item => ({
      'Código Producto': item.item_code || item.barcode || 'S/C',
      'Producto': item.name,
      'Talle / Medida': item.measure || '-',
      'Rubro / Categoría': item.rubro || item.category || '-',
      'Stock Real': item.current_stock,
      'Stock Reservado': item.reserved_stock || 0,
      'Stock Disponible': (item.current_stock || 0) - (item.reserved_stock || 0),
      'Stock Mínimo': item.min_stock || 0,
      'Stock Ideal': item.ideal_stock || 0,
      'Último Costo ($)': item.unit_cost || 0,
      'Ubicación / Estante': item.shelf_position || item.location || '-',
      'Unidad': item.unit || 'unidad'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consulta_Stock");
    XLSX.writeFile(wb, `Consulta_Stock_ECAR_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const lowStockItems = useMemo(() => (items || []).filter(i => i.current_stock <= i.min_stock && i.min_stock > 0), [items]);
  const totalValue = useMemo(() => (items || []).reduce((s, i) => s + i.current_stock * i.unit_cost, 0), [items]);
  const activeAssignments = useMemo(() => (assignments || []).filter(a => a.status === 'assigned'), [assignments]);
  const returnedAssignments = useMemo(() => (assignments || []).filter(a => a.status === 'returned' || a.status === 'damaged'), [assignments]);
  const [returningAssignment, setReturningAssignment] = useState<ToolAssignment | null>(null);

  const handleReturnWithNovelty = async (data: { status: 'returned' | 'damaged'; notes: string }) => {
    if (!returningAssignment) return;
    const assignment = returningAssignment;
    const isDamaged = data.status === 'damaged';
    const returnDate = new Date().toISOString().split('T')[0];

    try {
      await updateAssignment.mutateAsync({
        id: assignment.id,
        status: data.status,
        returned_date: returnDate,
        notes: data.notes || (isDamaged ? 'Devuelta con novedad / dañada' : 'Devolución normal')
      });

      await createMovement.mutateAsync({
        item_id: assignment.item_id,
        project_id: assignment.project_id,
        movement_type: 'return',
        quantity: 1,
        notes: `Devolución ${isDamaged ? 'CON NOVEDAD (ROTA)' : 'NORMAL'}: ${data.notes || 'Sin notas'} (Empleado: ${(assignment.employee as any)?.full_name || '—'})`,
        created_by: profile?.full_name || 'Pañol Central'
      });

      if (isDamaged && assignment.item_id) {
        await updateItem.mutateAsync({
          id: assignment.item_id,
          tool_status: 'mantenimiento',
        });
        useModalStore.getState().showAlert(
          'Novedad Registrada',
          `🔴 Se registró la devolución con novedad para ${(assignment.item as any)?.name}. La máquina fue marcada en MANTENIMIENTO y deshabilitada para nuevos préstamos.`
        );
      } else {
        useModalStore.getState().showAlert(
          'Devolución Exitosa',
          `🟢 La herramienta ${(assignment.item as any)?.name} fue devuelta en buen estado a Pañol.`
        );
      }
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo completar la devolución.');
    }
  };

  const handleNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newItem.name.trim()) {
        useModalStore.getState().showAlert('Atención', 'Por favor ingrese el nombre del ítem.');
        return;
      }

      // Format location code [Letra]-[Estante]-[Bin] (e.g. C-3-2)
      const computedPos = selectedShelfCode ? `${selectedShelfCode}-${shelfLevel}-${shelfBin}` : (newItem.shelf_position || null);

      const payload: any = {
        name: newItem.name.trim(),
        category: newItem.category,
        unit: newItem.unit,
        measure: newItem.measure ? newItem.measure.trim() : null,
        current_stock: newItem.current_stock !== '' ? parseFloat(newItem.current_stock) || 0 : 0,
        min_stock: newItem.min_stock !== '' ? parseFloat(newItem.min_stock) || 0 : 0,
        unit_cost: newItem.unit_cost !== '' ? parseFloat(newItem.unit_cost) || 0 : 0,
        is_tool: newItem.is_tool || newItem.category === 'herramienta',
        barcode: newItem.barcode ? newItem.barcode.trim() : null,
        location: computedPos ? `Ubicación ${computedPos}` : (newItem.location || 'Depósito'),
        deposit: newItem.deposit || 'DEPOSITO RAWSON',
        shelf_id: newItem.shelf_id || null,
        shelf_position: computedPos || null,
      };

      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...payload });
        useModalStore.getState().showAlert('Éxito', 'Ítem actualizado correctamente.');
      } else {
        const created: any = await createItem.mutateAsync({ ...payload, current_stock: 0 });
        // Create initial stock movement if stock > 0
        if (payload.current_stock > 0 && (created?.id || (Array.isArray(created) && created[0]?.id))) {
          const itemId = created?.id || created[0]?.id;
          try {
            await createMovement.mutateAsync({
              item_id: itemId,
              movement_type: 'in',
              quantity: payload.current_stock,
              notes: 'Ingreso Inicial de Stock',
              project_id: null
            });
          } catch (mErr) {
            console.warn('No se pudo registrar el movimiento inicial de stock:', mErr);
          }
        }
        useModalStore.getState().showAlert('Éxito', 'Ítem creado correctamente.');
      }

      setShowNewItem(false);
      setEditingItem(null);
      setNewItem({
        name: '',
        category: 'material',
        unit: 'unidad',
        measure: '',
        current_stock: '',
        min_stock: '',
        unit_cost: '',
        is_tool: false,
        barcode: '',
        location: '',
        deposit: 'DEPOSITO RAWSON',
        shelf_id: '',
        shelf_position: '',
        tool_status: 'operativa'
      });
    } catch (err: any) {
      console.error('Error al guardar ítem:', err);
      useModalStore.getState().showAlert('Error al Guardar', err?.message || 'No se pudo guardar el ítem.');
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovement) return;
    try {
      await createMovement.mutateAsync({
        item_id: showMovement.id,
        movement_type: movForm.movement_type,
        quantity: parseFloat(movForm.quantity),
        project_id: movForm.project_id || null,
        notes: movForm.notes || null,
      });
      useModalStore.getState().showAlert('Éxito', 'Movimiento registrado en Kardex.');
      setShowMovement(null);
      setMovForm({ movement_type: 'out', quantity: '', notes: '', project_id: '' });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo registrar el movimiento.');
    }
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveForm.itemId || !reserveForm.quantity) return;
    
    const qty = parseFloat(reserveForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      useModalStore.getState().showAlert('Error', 'La cantidad a reservar debe ser mayor a cero.');
      return;
    }

    const item = items.find(i => i.id === reserveForm.itemId);
    if (!item) return;

    if (qty > (item.current_stock || 0) - (item.reserved_stock || 0)) {
      const confirm = await useModalStore.getState().showConfirm('Stock Insuficiente', 'La cantidad a reservar supera el stock disponible. ¿Deseas continuar?');
      if (!confirm) return;
    }

    try {
      await updateItem.mutateAsync({
        id: item.id,
        reserved_stock: (item.reserved_stock || 0) + qty
      } as any);
      useModalStore.getState().showAlert('Éxito', 'Stock reservado correctamente.');
      setShowReserveModal(false);
      setReserveForm({ itemId: '', quantity: '' });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message || 'Error al reservar stock.');
    }
  };

  const handleDispatchCartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dispatchCartItems.length === 0) {
      useModalStore.getState().showAlert('Error', 'No hay ítems en el remito.');
      return;
    }
    
    // Check if any quantity is invalid or exceeds stock (block negative stock strictly as requested)
    if (dispatchCartItems.some(i => parseFloat(i.qty) <= 0 || isNaN(parseFloat(i.qty)))) {
      useModalStore.getState().showAlert('Error', 'Asegurate de que todos los ítems tengan una cantidad mayor a 0.');
      return;
    }

    const exceedsStock = dispatchCartItems.find(i => parseFloat(i.qty) > i.item.current_stock);
    if (exceedsStock) {
      const confirm = await useModalStore.getState().showConfirm('Stock Negativo', `La cantidad a despachar de "${exceedsStock.item.name}" (${exceedsStock.qty}) supera el stock actual (${exceedsStock.item.current_stock}). El stock quedará en negativo. ¿Deseas continuar de todos modos?`);
      if (!confirm) return;
    }

    try {
      // Loop over items and create an OUT movement for each
      for (const cartItem of dispatchCartItems) {
        await createMovement.mutateAsync({
          item_id: cartItem.item.id,
          movement_type: 'out',
          quantity: parseFloat(cartItem.qty),
          project_id: dispatchProject || null,
          assigned_to: null,
          delivered_to_text: dispatchEmployee || null,
          notes: dispatchNotes || 'Despacho múltiple a obra / Remito',
        });
      }

      useModalStore.getState().showAlert('Éxito', `Se registraron ${dispatchCartItems.length} salidas hacia la obra correctamente.`);
      
      // Reset state
      setShowDispatchCart(false);
      setDispatchCartItems([]);
      setDispatchProject('');
      setDispatchEmployee('');
      setDispatchNotes('');
      setDispatchSearch('');
      localStorage.removeItem('ecar_dispatch_cart_items');
      localStorage.removeItem('ecar_dispatch_cart_project');
      localStorage.removeItem('ecar_dispatch_cart_employee');

    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'Hubo un problema al procesar el remito múltiple.');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssign) return;
    try {
      const emp = (employees || []).find(x => x.id === assignForm.employee_id);
      await createAssignment.mutateAsync({
        item_id: showAssign.id,
        employee_id: assignForm.employee_id,
        project_id: assignForm.project_id || null,
        notes: assignForm.notes || null,
      });

      // Record Kardex 'out' movement for assigned tool to balance return (+1) movement and prevent stock inflation
      await createMovement.mutateAsync({
        item_id: showAssign.id,
        movement_type: 'out',
        quantity: 1,
        project_id: assignForm.project_id || null,
        notes: `Préstamo de herramienta a ${emp?.full_name || 'colaborador'}. ${assignForm.notes || ''}`.trim(),
      });

      useModalStore.getState().showAlert('Éxito', 'Herramienta asignada al colaborador.');
      setShowAssign(null);
      setAssignForm({ employee_id: '', project_id: '', notes: '' });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo asignar la herramienta.');
    }
  };

  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDeposit) {
        await updateDeposit.mutateAsync({ id: editingDeposit.id, ...depositForm });
        useModalStore.getState().showAlert('Éxito', 'Depósito actualizado correctamente.');
      } else {
        await createDeposit.mutateAsync(depositForm);
        useModalStore.getState().showAlert('Éxito', 'Depósito creado correctamente.');
      }
      setShowDepositModal(false);
      setEditingDeposit(null);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo guardar el depósito.');
    }
  };

  const handleDeleteDeposit = async (id: string) => {
    const confirm = await useModalStore.getState().showConfirm('Eliminar Depósito', '¿Está seguro de eliminar este depósito?');
    if (!confirm) return;
    try {
      await deleteDeposit.mutateAsync(id);
      useModalStore.getState().showAlert('Éxito', 'Depósito eliminado.');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar el depósito.');
    }
  };

  const handleSaveShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: shelfForm.code.trim(),
        name: shelfForm.name.trim(),
        shelf_type: shelfForm.shelf_type as any,
        rows_count: parseInt(shelfForm.rows_count) || 4,
        columns_count: parseInt(shelfForm.columns_count) || 3,
        color: shelfForm.color,
        notes: shelfForm.notes || null,
        rotation: parseInt(shelfForm.rotation) || 0,
      };

      if (editingShelf) {
        await updateShelf.mutateAsync({ id: editingShelf.id, ...payload });
        useModalStore.getState().showAlert('Éxito', 'Estantería actualizada.');
      } else {
        await createShelf.mutateAsync({
          ...payload,
          grid_row: 50,
          grid_col: 50,
          grid_width: 220,
          grid_height: 120
        });
        useModalStore.getState().showAlert('Éxito', 'Nueva estantería creada.');
      }
      setShowNewShelf(false);
      setEditingShelf(null);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo guardar la estantería.');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Boxes size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <Package size={24} /> Depósito & Inventario Pañol ECAR
          </h3>
          <p className="text-ecar-blueLight text-sm mt-1 max-w-2xl">
            Doc PR-GL-01 §4.3 — Control de materiales, herramientas eléctricas, estanterías A-E y entregas de EPP
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Boxes size={16} className="text-blue-500" /> Ítems Registrados</div>
          <p className="text-2xl font-black text-blue-600 font-mono">{(items || []).length}</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-ecar-blue" /> Herramientas Asignadas</div>
          <p className="text-2xl font-black text-ecar-blue font-mono">{activeAssignments.length}</p>
        </div>
        <div className={`light-card p-5 ${lowStockItems.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Stock Bajo</div>
          <p className="text-2xl font-black text-red-600 font-mono">{lowStockItems.length}</p>
          {lowStockItems.length > 0 && (
            <button
              onClick={() => openRepoModal(lowStockItems.map(i => ({ name: i.name, quantity: i.current_stock, unit: i.unit, unit_cost: i.unit_cost, id: i.id, current_stock: i.current_stock, min_stock: i.min_stock })))}
              className="mt-2 w-full px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShoppingBag size={12} /> Solicitar Reposición
            </button>
          )}
        </div>
        {!isPanolero && (
          <div className="light-card p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Package size={16} className="text-emerald-500" /> Valor Total Depósito</div>
            <p className="text-2xl font-black text-emerald-600 font-mono">{fmt(totalValue)}</p>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl overflow-x-auto shadow-inner">
        {([
          ['stock', '📊 Stock'],
          ['movements', '📋 Movimientos'],
          ['reserved', '🔒 Stock Reservado'],
          ['price_history', '📈 Historial de Precios'],
          ['deposits', '🏢 Depósitos'],
          ['shelves', '🗄️ Estanterías Almacén (A-E)'],
          ['tools', '⚡ Herramientas Eléctricas'],
          ['epp', '🦺 Entrega de EPP']
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${tab === id ? 'bg-white text-ecar-blue shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stock tab - CONSULTA DE STOCK (Inspirada en Imagen 2) */}
      {tab === 'stock' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS AVANZADA (Imagen 2) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-ecar-blue" />
                <span className="font-bold text-sm text-slate-800 uppercase tracking-wider">Filtros de Búsqueda</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterDeposit('');
                    setFilterShelf('');
                    setFilterCode('');
                    setFilterProduct('');
                    setFilterMeasure('');
                    setFilterRubro('');
                    setFilterSupplier('');
                    setFilterStockStatus('TODOS');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={13} /> Limpiar Filtros
                </button>
                <button
                  onClick={exportStockExcel}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Download size={14} /> Exportar Excel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Depósito */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Depósito:</label>
                <select
                  value={filterDeposit}
                  onChange={e => setFilterDeposit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                >
                  <option value="">TODOS LOS DEPÓSITOS</option>
                  {(deposits || []).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  <option value="DEPOSITO RAWSON">DEPOSITO RAWSON (Legado)</option>
                  <option value="ALMACEN CENTRAL">ALMACEN CENTRAL (Legado)</option>
                </select>
              </div>

              {/* Estantería */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Estantería:</label>
                <select
                  value={filterShelf}
                  onChange={e => setFilterShelf(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                >
                  <option value="">TODAS LAS ESTANTERÍAS</option>
                  {(shelves || []).map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Código */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Código / SKU:</label>
                <input
                  type="text"
                  placeholder="Ej. 005, 1000..."
                  value={filterCode}
                  onChange={e => setFilterCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                />
              </div>

              {/* Producto */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Producto:</label>
                <input
                  type="text"
                  placeholder="Nombre o descripción..."
                  value={filterProduct}
                  onChange={e => setFilterProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white font-medium"
                />
              </div>

              {/* Talla / Medida */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Talle / Medida:</label>
                <input
                  type="text"
                  placeholder="Ej. 1/2, 110mm, XL..."
                  value={filterMeasure}
                  onChange={e => setFilterMeasure(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                />
              </div>

              {/* Rubro */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Rubro / Categoría:</label>
                <select
                  value={filterRubro}
                  onChange={e => setFilterRubro(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                >
                  <option value="">TODOS LOS RUBROS</option>
                  {uniqueRubros.map(r => (
                    <option key={r} value={r}>{r.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Proveedor */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Proveedor:</label>
                <input
                  type="text"
                  placeholder="Nombre de proveedor..."
                  value={filterSupplier}
                  onChange={e => setFilterSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                />
              </div>

              {/* Estado de Stock */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Estado Stock:</label>
                <select
                  value={filterStockStatus}
                  onChange={e => setFilterStockStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                >
                  <option value="TODOS">TODOS</option>
                  <option value="CON_STOCK">🟢 Con Stock ({">"}0)</option>
                  <option value="SIN_STOCK">🔴 Sin Stock (=0)</option>
                  <option value="BAJO_MINIMO">⚠️ Bajo Mínimo ({"<="} Mín)</option>
                  <option value="CON_RESERVA">🔒 Con Stock Reservado</option>
                </select>
              </div>

              {/* Botón de Carga y Acciones Rápidas */}
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2 mt-4 md:mt-0 col-span-1 sm:col-span-2 md:col-span-4">
                <button
                  onClick={() => setShowDispatchCart(true)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Truck size={18} /> Despachar a Obra (Remito)
                </button>
                {isAdmin && (
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => {
                        setShowNewItem(true);
                        setEditingItem(null);
                        setNewItem({
                          name: '',
                          category: 'material',
                          unit: 'unidad',
                          measure: '',
                          current_stock: '',
                          min_stock: '',
                          unit_cost: '',
                          is_tool: false,
                          barcode: '',
                          location: '',
                          deposit: 'DEPOSITO RAWSON',
                          shelf_id: '',
                          shelf_position: '',
                          tool_status: 'operativa'
                        });
                        setShelfLevel('1');
                        setShelfBin('1');
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={15} /> Nuevo Ítem
                    </button>

                    <button
                      onClick={() => setShowImporter(true)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      title="Importar catálogo desde Excel"
                    >
                      <ArrowDownToLine size={15} />
                    </button>

                    <button
                      onClick={() => setShowScanner(true)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      title="Escanear código de barras"
                    >
                      <Barcode size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLA "CONSULTA STOCK" (Imagen 2) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Boxes size={16} className="text-ecar-blue" />
                Stock ({filtered.length} artículos)
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Sin Stock / Bajo Mínimo
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Stock Normal
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-8"></th>
                    <th className="py-3 px-3">Código Producto</th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3">Talle / Medida</th>
                    <th className="py-3 px-3">Rubro</th>
                    <th className="py-3 px-3 text-center bg-slate-200/50">Stock Real</th>
                    <th className="py-3 px-3 text-center">Stock Reservado</th>
                    <th className="py-3 px-3 text-center font-bold">Stock Disponible</th>
                    <th className="py-3 px-3 text-center">Stock Mínimo</th>
                    <th className="py-3 px-3 text-center">Stock Ideal</th>
                    {!isPanolero && <th className="py-3 px-3 text-right">Último Costo</th>}
                    {!isPanolero && <th className="py-3 px-3 text-right text-emerald-700">Total ($)</th>}
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map(item => {
                    const isExpanded = expandedItemId === item.id;
                    const isOutOfStock = Number(item.current_stock) === 0;
                    const isLowStock = Number(item.current_stock) <= Number(item.min_stock) && Number(item.min_stock) > 0;
                    const reserved = Number(item.reserved_stock) || 0;
                    const available = Math.max(0, Number(item.current_stock) - reserved);
                    const ideal = Number(item.ideal_stock) || 0;

                    return (
                      <React.Fragment key={item.id}>
                        <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                          <td className="text-center px-1 py-2.5">
                            <button
                              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                              className={`p-1 rounded-lg transition-transform ${isExpanded ? 'bg-ecar-blue text-white rotate-180' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                              title={isExpanded ? "Ocultar Kardex" : "Desplegar movimientos y carga rápida"}
                            >
                              <ChevronDown size={15} />
                            </button>
                          </td>

                          {/* Código Producto */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            {item.item_code || item.barcode || '—'}
                          </td>

                          {/* Producto */}
                          <td className="py-2.5 px-3 font-bold text-slate-900 cursor-pointer" onClick={() => setExpandedItemId(isExpanded ? null : item.id)}>
                            <div className="flex items-center gap-2">
                              <span>{item.name}</span>
                              {item.shelf_position && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  📍 {formatShelfPosition((item.shelf as any)?.code, item.shelf_position)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Talle / Medida */}
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {item.measure || '—'}
                          </td>

                          {/* Rubro */}
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {item.rubro || item.category || 'General'}
                            </span>
                          </td>

                          {/* Stock Real (Red Highlight like Image 2 when out of stock or low) */}
                          <td className={`py-2.5 px-3 text-center ${isOutOfStock ? 'bg-red-500 text-white font-black' : isLowStock ? 'bg-amber-400 text-slate-900 font-black' : 'bg-slate-50 font-bold text-slate-800'}`}>
                            <span className="font-mono text-xs">
                              {(Number(item.current_stock) || 0).toFixed(2)}
                            </span>
                          </td>

                          {/* Stock Reservado */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                            {reserved.toFixed(2)}
                          </td>

                          {/* Stock Disponible */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            {available.toFixed(2)}
                          </td>

                          {/* Stock Mínimo */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {(Number(item.min_stock) || 0).toFixed(2)}
                          </td>

                          {/* Stock Ideal */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {ideal.toFixed(2)}
                          </td>

                          {/* Último Costo */}
                          {!isPanolero && (
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                              {fmt(item.unit_cost)}
                            </td>
                          )}

                          {/* Total Valorizado */}
                          {!isPanolero && (
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50/30">
                              {fmt((Number(item.current_stock) || 0) * (Number(item.unit_cost) || 0))}
                            </td>
                          )}

                          {/* Acciones */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Historial de Precios Button */}
                              <button
                                onClick={() => setSelectedHistoryItem(item)}
                                className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                                title="Ver Historial de Precios y Variaciones ($ y %)"
                              >
                                <TrendingUp size={15} />
                              </button>

                              {/* Kardex Movements Toggle */}
                              <button
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-ecar-blue text-white' : 'hover:bg-slate-100 text-slate-500'}`}
                                title="Ver Movimientos / Kardex"
                              >
                                <History size={15} />
                              </button>

                              {/* Ajuste Rápido de Stock */}
                              <button
                                onClick={() => {
                                  setShowQuickAdjustment(item);
                                  setQuickAdjQty(String(item.current_stock));
                                  setQuickAdjNotes('');
                                }}
                                className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                                title="Ajuste rápido de existencias"
                              >
                                <Plus size={15} />
                              </button>

                              {/* Editar */}
                              <button
                                onClick={() => {
                                  const { level, bin } = parseShelfPosition(item.shelf_position);
                                  setShelfLevel(level);
                                  setShelfBin(bin);

                                  let detectedShelfId = item.shelf_id || '';
                                  if (!detectedShelfId && item.shelf_position) {
                                    const codeMatch = item.shelf_position.trim().toUpperCase().split('-')[0];
                                    const matchingShelf = (shelves || []).find(s => s.code === codeMatch || s.code === `EST-${codeMatch}`);
                                    if (matchingShelf) {
                                      detectedShelfId = matchingShelf.id;
                                    }
                                  }

                                  setEditingItem(item);
                                  setNewItem({
                                    name: item.name,
                                    category: item.category as any,
                                    unit: item.unit,
                                    measure: item.measure || '',
                                    current_stock: String(item.current_stock),
                                    min_stock: String(item.min_stock),
                                    unit_cost: String(item.unit_cost),
                                    is_tool: item.is_tool,
                                    barcode: item.barcode || '',
                                    location: item.location || '',
                                    deposit: item.deposit || 'DEPOSITO RAWSON',
                                    shelf_id: detectedShelfId,
                                    shelf_position: item.shelf_position || '',
                                    tool_status: 'operativa'
                                  });
                                  setShowNewItem(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                                title="Editar producto"
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Código de Barras */}
                              <button
                                onClick={() => setShowBarcode(item)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                                title="Imprimir código de barras"
                              >
                                <Barcode size={15} />
                              </button>

                              {/* Eliminar (Admin) */}
                              {isAdmin && (
                                <button
                                  onClick={async () => {
                                    if (await useModalStore.getState().showConfirm('Confirmar', `¿Eliminar "${item.name}" del inventario?`)) {
                                      deleteItem.mutateAsync(item.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                  title="Eliminar ítem"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Accordion Kardex Details */}
                        {isExpanded && (
                          <tr className="bg-slate-100/90 border-b-2 border-slate-300 shadow-inner">
                            <td colSpan={isPanolero ? 11 : 12} className="p-4 bg-slate-100/90">
                              <ItemMovementsAccordion item={item} projects={projects || []} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <Package size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">No se encontraron artículos con los filtros seleccionados</p>
                        <p className="text-xs text-slate-400 mt-1">Prueba limpiando los filtros o agregando nuevos ítems.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stock Reservado */}
      {tab === 'reserved' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-amber-500" />
                  Materiales con Stock Reservado / Asignado
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control de stock físico comprometido en órdenes de trabajo, despachos pendientes y reservas para obras activas.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReserveModal(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={14} /> Nueva Reserva
                </button>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs">
                  {(items || []).filter(i => (i.reserved_stock || 0) > 0).length} artículos comprometidos
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3">Medida</th>
                    <th className="py-3 px-3">Rubro</th>
                    <th className="py-3 px-3 text-center">Stock Real (Físico)</th>
                    <th className="py-3 px-3 text-center font-bold text-amber-600 bg-amber-50">Stock Reservado</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-600 bg-emerald-50">Stock Disponible</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(items || []).filter(i => (i.reserved_stock || 0) > 0).map(item => {
                    const real = Number(item.current_stock) || 0;
                    const reserved = Number(item.reserved_stock) || 0;
                    const available = Math.max(0, real - reserved);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{item.item_code || item.barcode || '—'}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-3 text-slate-600">{item.measure || '—'}</td>
                        <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase text-[10px] font-semibold">{item.rubro || item.category || 'General'}</span></td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">{real.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/50">{reserved.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">{available.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setShowMovement(item);
                              setMovForm({ movement_type: 'out', quantity: String(reserved), notes: 'Despacho de stock reservado', project_id: '' });
                            }}
                            className="px-3 py-1 bg-ecar-blue hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <ArrowDownToLine size={13} /> Despachar
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {(items || []).filter(i => (i.reserved_stock || 0) > 0).length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <ShoppingBag size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">No hay stock reservado actualmente</p>
                        <p className="text-xs text-slate-400 mt-1">Todo el stock físico registrado está 100% disponible para operaciones.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Truck size={18} className="text-orange-500" />
                  Despachos en Camino (Pendientes de Recepción)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trazabilidad de materiales que ya salieron de pañol y están viajando hacia la obra.
                </p>
              </div>
              <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full font-bold text-xs">
                {(purchaseRequests || []).filter(r => r.status === 'ordered').length} despachos en tránsito
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Fecha Despacho</th>
                    <th className="py-3 px-3">Destino (Obra)</th>
                    <th className="py-3 px-3">Solicitante</th>
                    <th className="py-3 px-3">Despachó</th>
                    <th className="py-3 px-3">Detalle de Ítems</th>
                    <th className="py-3 px-3 text-center">Remito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(purchaseRequests || []).filter(r => r.status === 'ordered').map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {req.dispatched_at ? new Date(req.dispatched_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">{req.project?.name || 'Stock General'}</td>
                      <td className="py-3 px-3 text-slate-700">{req.requested_by || '—'}</td>
                      <td className="py-3 px-3 text-slate-700">{req.dispatched_by || '—'}</td>
                      <td className="py-3 px-3 text-xs text-slate-600">
                        <ul className="list-disc list-inside">
                          {(req.items || []).map(i => (
                            <li key={i.id}>{i.quantity_sent || i.quantity}x {i.description}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => exportDispatchPdf(req)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-bold text-xs inline-flex flex-col items-center gap-1"
                          title="Descargar Remito PDF"
                        >
                          <ArrowDownToLine size={16} /> Remito
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(purchaseRequests || []).filter(r => r.status === 'ordered').length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Truck size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">No hay despachos en tránsito</p>
                        <p className="text-xs text-slate-400 mt-1">Todos los envíos han sido recibidos en sus respectivas obras.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Historial Global de Precios y Modificaciones */}
      {tab === 'price_history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <TrendingUp size={18} className="text-ecar-blue" />
                  Historial y Auditoría de Precios de Compra
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trazabilidad de variaciones de costos registrados factura por factura, con cálculo automático de diferencia en $ y porcentaje (%).
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-xs">
                {allPriceHistories.length} registros de precios
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Comprobante</th>
                    <th className="py-3 px-3">Proveedor</th>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3 text-right">Precio Anterior</th>
                    <th className="py-3 px-3 text-right font-bold">Precio Nuevo</th>
                    <th className="py-3 px-3 text-right">Diferencia ($)</th>
                    <th className="py-3 px-3 text-center font-bold">Variación (%)</th>
                    <th className="py-3 px-3 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {allPriceHistories.map(h => {
                    const isIncrease = (h.price_diff_ars || 0) > 0;
                    const isDecrease = (h.price_diff_ars || 0) < 0;
                    const invoiceLabel = h.invoice_number 
                      ? `${h.invoice_type || 'FC'} ${h.invoice_number}`
                      : 'Ajuste Manual';
                    const supplierLabel = h.supplier_name || h.supplier?.name || h.item?.last_supplier?.name || '—';

                    return (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {new Date(h.created_at).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {invoiceLabel}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {supplierLabel}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {h.item?.item_code || h.item?.barcode || '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {h.item?.name || 'Artículo'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {fmt(h.old_price || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {fmt(h.new_price || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={isIncrease ? 'text-red-600' : isDecrease ? 'text-emerald-600' : 'text-slate-500'}>
                            {isIncrease ? '+' : ''}{fmt(h.price_diff_ars || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-flex items-center gap-1 ${isIncrease ? 'bg-red-50 text-red-700 border border-red-200' : isDecrease ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                            {isIncrease && <TrendingUp size={12} className="text-red-600" />}
                            {isDecrease && <TrendingDown size={12} className="text-emerald-600" />}
                            {isIncrease ? '+' : ''}{(h.price_diff_pct || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {h.item && (
                            <button
                              onClick={() => setSelectedHistoryItem(h.item as any)}
                              className="p-1 hover:bg-slate-100 rounded text-ecar-blue transition-colors"
                              title="Ver bitácora completa del producto"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {allPriceHistories.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <TrendingUp size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">No hay modificaciones de precios registradas</p>
                        <p className="text-xs text-slate-400 mt-1">A medida que cargues facturas de compras con nuevos precios, se registrará el historial aquí automáticamente.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tools tab (Herramientas Eléctricas & Prestamos) */}
      {tab === 'tools' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">⚡ Gestión de Herramientas Eléctricas (Estantería A)</h3>
              <p className="text-xs text-slate-300">Control individual con código único, estado físico (Operativa / Mantenimiento / No Funciona) y trazabilidad de préstamos.</p>
            </div>
            <button
              onClick={() => {
                setShowNewItem(true);
                setEditingItem(null);
                setNewItem({
                  name: '',
                  category: 'herramienta',
                  unit: 'unidad',
                  measure: '',
                  current_stock: '1',
                  min_stock: '1',
                  unit_cost: '',
                  is_tool: true,
                  barcode: '',
                  location: 'Estantería A - Herramientas Eléctricas',
                  deposit: 'DEPOSITO RAWSON',
                  shelf_id: (shelves || []).find(s => s.code === 'A')?.id || '',
                  shelf_position: 'A-1-1',
                  tool_status: 'operativa'
                });
              }}
              className="btn-primary"
            >
              <Plus size={16} /> Registrar Herramienta
            </button>
          </div>

          <div className="light-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código Único / Serie</th>
                  <th>Herramienta</th>
                  <th>Ubicación Estantería A</th>
                  <th className="text-center">Estado Físico</th>
                  <th className="text-center">Stock</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs font-bold text-ecar-blue">{item.barcode || 'SIN-CÓDIGO'}</td>
                    <td className="font-medium text-gray-800">{item.name}</td>
                    <td className="font-mono text-xs text-gray-600">
                      📍 {item.shelf_position || 'Estantería A'}
                    </td>
                    <td className="text-center">
                      <span className="badge badge-success flex items-center gap-1 justify-center mx-auto">
                        <CheckCircle2 size={12} /> Operativa
                      </span>
                    </td>
                    <td className="text-center font-mono font-bold">{item.current_stock} {item.unit}</td>
                    <td className="text-center">
                      <button onClick={() => setShowAssign(item)} className="btn-secondary text-xs px-2.5 py-1 py-0.5">
                        <User size={12} /> Asignar / Préstamo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Active Tool Assignments */}
          <div className="light-card overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={16} /> Préstamos Diarios Activos</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">{activeAssignments.length} prestadas</span>
            </div>
            {activeAssignments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Herramienta</th>
                    <th>Empleado (Retiró)</th>
                    <th>Obra / Destino</th>
                    <th>Fecha Retiro</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssignments.map(a => (
                    <tr key={a.id}>
                      <td className="font-medium text-gray-900">{(a.item as any)?.name || '—'}</td>
                      <td>{(a.employee as any)?.full_name || 'Sin asignar'}</td>
                      <td>{(a.project as any)?.name || 'Sin obra'}</td>
                      <td className="font-mono text-xs text-gray-500">{new Date(a.assigned_date).toLocaleDateString('es-AR')}</td>
                      <td className="text-center">
                        <button
                          onClick={() => setReturningAssignment(a)}
                          className="badge badge-success hover:bg-emerald-600 cursor-pointer shadow-2xs font-bold text-xs py-1.5 px-3"
                          title="Registrar devolución normal o con novedad/rotura"
                        >
                          <RotateCcw size={13} /> Registrar Devolución
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400"><Wrench size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Todas las herramientas están guardadas en pañol</p></div>
            )}
          </div>

          {/* Returned Tool Assignments History & Novelties */}
          <div className="light-card overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-100 bg-slate-100/80 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <History size={16} className="text-ecar-blue" /> Historial de Devoluciones y Registro de Novedades
                </h3>
                <p className="text-xs text-gray-500">Auditoría completa de herramientas devueltas, roturas reportadas y estado físico de entrega.</p>
              </div>
              <span className="text-xs font-bold text-gray-700 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-2xs">
                {returnedAssignments.length} devoluciones
              </span>
            </div>
            {returnedAssignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Herramienta</th>
                      <th>Empleado (Retiró)</th>
                      <th>Obra / Destino</th>
                      <th>Fecha Retiro</th>
                      <th>Fecha Devolución</th>
                      <th className="text-center">Estado Entrega</th>
                      <th>Novedad / Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnedAssignments.map(a => {
                      const isDamaged = a.status === 'damaged';
                      return (
                        <tr key={a.id} className={isDamaged ? 'bg-red-50/50' : ''}>
                          <td className="font-medium text-gray-900">{(a.item as any)?.name || '—'}</td>
                          <td className="text-gray-800 font-medium">{(a.employee as any)?.full_name || 'Sin asignar'}</td>
                          <td className="text-gray-600 font-medium">{(a.project as any)?.name || 'Sin obra'}</td>
                          <td className="font-mono text-xs text-gray-500">{new Date(a.assigned_date).toLocaleDateString('es-AR')}</td>
                          <td className="font-mono text-xs text-gray-500 font-bold">{a.returned_date ? new Date(a.returned_date).toLocaleDateString('es-AR') : '-'}</td>
                          <td className="text-center">
                            <span className={`badge ${isDamaged ? 'badge-danger' : 'badge-success'}`}>
                              {isDamaged ? '🔴 Con Novedad (Rota)' : '🟢 En Buen Estado'}
                            </span>
                          </td>
                          <td className="text-xs text-gray-700 font-medium">
                            {a.notes ? (
                              <span className={`p-1.5 rounded-md inline-block font-semibold ${isDamaged ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-700'}`}>
                                {a.notes}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Sin novedades</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400"><History size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">No hay historial de devoluciones aún</p></div>
            )}
          </div>
        </div>
      )}

      {/* Movements tab */}
      {tab === 'movements' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>📦</span> Kardex General de Movimientos y Registro de Pañol
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Auditoría completa de entradas, salidas por despacho a obras y ajustes de stock.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-lg text-sky-300">
              {(movements || []).length} registros
            </span>
          </div>
          {(movements || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Ítem / Material</th>
                    <th>Tipo Operación</th>
                    <th className="text-center">Cantidad</th>
                    <th>Obra Destino</th>
                    <th>Responsable Pañol</th>
                    <th>Detalle / Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {(movements || []).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-mono text-xs text-gray-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="font-bold text-gray-800">{(m.item as any)?.name || '—'}</td>
                      <td>
                        <span className={`badge ${m.movement_type === 'in' ? 'badge-success' : m.movement_type === 'out' ? 'badge-danger' : m.movement_type === 'return' ? 'badge-info' : 'badge-neutral'}`}>
                          {m.movement_type === 'in' ? '🟢 Ingreso Stock' : m.movement_type === 'out' ? '🔴 Egreso / Despacho' : m.movement_type === 'return' ? '🔵 Devolución' : '⚙️ Ajuste'}
                        </span>
                      </td>
                      <td className="text-center font-mono font-bold text-sm text-gray-900">{m.quantity}</td>
                      <td className="text-gray-700 font-medium">{(m.project as any)?.name || '—'}</td>
                      <td className="text-gray-800 font-bold text-xs bg-slate-100 px-2 py-1 rounded-md inline-block my-1">
                        👤 {m.created_by || 'Pañol Central'}
                      </td>
                      <td className="text-gray-600 text-xs italic">{m.notes || 'Sin observaciones'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400"><ArrowDownToLine size={48} className="mx-auto mb-3 opacity-30" /><p>Sin movimientos aún</p></div>
          )}
        </div>
      )}

      {/* Deposits tab */}
      {tab === 'deposits' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Boxes className="text-ecar-blue" size={24} /> Gestión de Depósitos
            </h2>
            <button
              onClick={() => {
                setEditingDeposit(null);
                setDepositForm({ name: '', location: '' });
                setShowDepositModal(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Plus size={16} /> Nuevo Depósito
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-4 font-bold uppercase text-xs tracking-wider">Nombre</th>
                    <th className="p-4 font-bold uppercase text-xs tracking-wider">Ubicación / Detalles</th>
                    <th className="p-4 font-bold uppercase text-xs tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(deposits || []).map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{d.name}</td>
                      <td className="p-4 text-slate-600">{d.location || '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingDeposit(d);
                              setDepositForm({ name: d.name, location: d.location || '' });
                              setShowDepositModal(true);
                            }}
                            className="p-2 text-ecar-blue hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDeposit(d.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {deposits?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500 text-sm">
                        No hay depósitos creados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Shelves tab (Plano de distribución A-E) */}
      {tab === 'shelves' && (() => {
        const shelfList = shelves || [];
        const itemsByShelf = (items || []).reduce((acc, item) => {
          if (item.shelf_id) acc[item.shelf_id] = (acc[item.shelf_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return (
          <div className="space-y-6">
            {/* Diagrama Visual del Depósito */}
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <LayoutGrid size={18} /> Plano Orientativo Almacén Pequeño — 50 m² (10 m x 5 m)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Ubicación estandarizada de las 5 estanterías (A-E) con pasillo central de circulación y entrada.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={seedDefaultShelves} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5">
                    🗺️ Cargar Distribución A-E (50m²)
                  </button>
                  <button onClick={() => setShowImporter(true)} className="btn-secondary text-xs">
                    <ArrowDownToLine size={14} /> Importar Excel
                  </button>
                  <button onClick={() => { setShowNewShelf(true); setEditingShelf(null); setShelfForm({ code: '', name: '', shelf_type: 'rack', rows_count: '4', columns_count: '3', color: '#3B82F6', notes: '', rotation: '0' }); }} className="btn-primary text-xs">
                    <Plus size={14} /> Nueva Estantería
                  </button>
                </div>
              </div>

              {/* Warehouse Layout Map 10m x 5m */}
              <div className="p-6 bg-slate-50">
                <div className="relative border-2 border-slate-300 rounded-2xl p-6 bg-white shadow-xl max-w-5xl mx-auto overflow-hidden">
                  
                  {/* Top Header Label */}
                  <div className="text-center font-black text-sm tracking-wider uppercase bg-gradient-to-r from-ecar-blueDark to-ecar-blue text-white py-2.5 rounded-xl mb-6 shadow-md border border-white/20">
                    ALMACÉN PEQUEÑO — 50 m² (10 m x 5 m)
                  </div>

                  {/* 3D Moving Mesh decorative background */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <WebGLWarehouseGrid />
                  </div>

                  {/* Shelves Layout Canvas */}
                  <div className="relative z-10 space-y-8 py-4">
                    
                    {/* Top Row: A, B, C */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { letter: 'A', name: 'Herramientas eléctricas', desc: 'Taladros, amoladoras, sierras, cargadores', color: '#115C9C' },
                        { letter: 'B', name: 'Electricidad', desc: 'Cables, llaves térmicas, tomas, cajas', color: '#0A3B66' },
                        { letter: 'C', name: 'Gas', desc: 'Cañerías, llaves de paso, accesorios', color: '#1E40AF' }
                      ].map(cfg => {
                        const sh = shelfList.find(s => s.code === cfg.letter);
                        return (
                          <div
                            key={cfg.letter}
                            onClick={() => sh && setViewingShelf(sh)}
                            className="bg-white border-2 border-slate-200 hover:border-ecar-blue rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="w-9 h-9 rounded-xl font-black text-white flex items-center justify-center text-base shadow bg-ecar-blue">
                                {cfg.letter}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-ecar-blueLight text-ecar-blue border border-ecar-blue/20">
                                {itemsByShelf[sh?.id || ''] || 0} ítems
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{cfg.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1">{cfg.desc}</p>
                            <div className="mt-4 text-[10px] font-mono text-slate-400 flex justify-between border-t border-slate-100 pt-2.5">
                              <span>Formato Bin: {cfg.letter}-[Nº]-[Bin]</span>
                              <span className="text-ecar-blue font-bold group-hover:underline">Ver Niveles →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pasillo Central */}
                    <div className="bg-slate-100/90 border-2 border-dashed border-slate-300 rounded-xl py-3.5 text-center flex items-center justify-center gap-3 shadow-inner">
                      <span className="text-ecar-blue font-bold">⬆️</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-700">Pasillo Central de Circulación</span>
                      <span className="text-ecar-blue font-bold">⬇️</span>
                    </div>

                    {/* Bottom Row: D, E */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                      {[
                        { letter: 'D', name: 'Agua y Cloaca', desc: 'Caños, accesorios sanitarios, agua y desagüe', color: '#0369A1' },
                        { letter: 'E', name: 'EPP / Ferretería', desc: 'Protección personal, tornillos, bulones', color: '#0F766E' }
                      ].map(cfg => {
                        const sh = shelfList.find(s => s.code === cfg.letter);
                        return (
                          <div
                            key={cfg.letter}
                            onClick={() => sh && setViewingShelf(sh)}
                            className="bg-white border-2 border-slate-200 hover:border-ecar-blue rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="w-9 h-9 rounded-xl font-black text-white flex items-center justify-center text-base shadow bg-ecar-blue">
                                {cfg.letter}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-ecar-blueLight text-ecar-blue border border-ecar-blue/20">
                                {itemsByShelf[sh?.id || ''] || 0} ítems
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{cfg.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1">{cfg.desc}</p>
                            <div className="mt-4 text-[10px] font-mono text-slate-400 flex justify-between border-t border-slate-100 pt-2.5">
                              <span>Formato Bin: {cfg.letter}-[Nº]-[Bin]</span>
                              <span className="text-ecar-blue font-bold group-hover:underline">Ver Niveles →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ENTRADA Door Indicator at Bottom */}
                    <div className="flex justify-center pt-2">
                      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue text-white font-black text-xs px-8 py-2.5 rounded-xl shadow-md border-2 border-white flex items-center gap-2">
                        <span>🚪</span> ENTRADA ALMACÉN (10 m)
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Inspector Front View */}
              {viewingShelf && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: viewingShelf.color }} />
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">{viewingShelf.name} (Estantería {viewingShelf.code})</h3>
                          <p className="text-xs text-gray-500 font-mono">Formato de ubicación bin: {viewingShelf.code}-[Nº Estante]-[Nº Bin]</p>
                        </div>
                      </div>
                      <button onClick={() => setViewingShelf(null)} className="btn-secondary text-xs"><X size={14} /> Cerrar Vista</button>
                    </div>
                    <ShelfFrontView shelf={viewingShelf} items={(items || []).filter(i => i.shelf_id === viewingShelf.id)} />
                  </div>
                </div>
              )}
            </div>

            {/* Lista de estanterías */}
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800">Detalle de Estanterías A-E</h3>
              </div>
              {shelfList.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre Estantería</th>
                      <th>Tipo</th>
                      <th className="text-center">Niveles / Bins</th>
                      <th className="text-center">Ítems Asignados</th>
                      <th>Descripción / Contenido</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shelfList.map(s => (
                      <tr key={s.id}>
                        <td><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} /><span className="font-bold font-mono text-sm">{s.code}</span></div></td>
                        <td className="font-medium text-gray-900">{s.name}</td>
                        <td><span className="badge badge-neutral">{SHELF_TYPES[s.shelf_type]?.icon} {SHELF_TYPES[s.shelf_type]?.label}</span></td>
                        <td className="text-center font-mono">{s.rows_count} Niveles × {s.columns_count} Bins</td>
                        <td className="text-center"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{itemsByShelf[s.id] || 0}</span></td>
                      <td className="text-gray-500 text-xs">{s.notes || '—'}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setViewingShelf(s)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Ver niveles y bins"><Search size={14} className="text-gray-600" /></button>
                            <button onClick={() => { setEditingShelf(s); setShelfForm({ code: s.code, name: s.name, shelf_type: s.shelf_type, rows_count: String(s.rows_count), columns_count: String(s.columns_count), color: s.color, notes: s.notes || '', rotation: String(s.rotation || 0) }); setShowNewShelf(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit3 size={14} className="text-blue-600" /></button>
                            {isAdmin && <button onClick={async () => { if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar estantería?')) deleteShelf.mutateAsync(s.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      {/* EPP Tab */}
      {tab === 'epp' && (
        <div className="space-y-6">
          <PPEDeliveriesPanel />
        </div>
      )}

      {/* Modal Nuevo / Editar Ítem */}
      {showNewItem && createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingItem ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}</h3>
              <button onClick={() => setShowNewItem(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleNewItem} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Nombre del Ítem *</label>
                  <input
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30"
                    placeholder="Ej: Codo termofusion 20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Medida / Dimensión</label>
                  <input
                    value={newItem.measure}
                    onChange={e => setNewItem({ ...newItem, measure: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30"
                    placeholder="Ej: 20, 1/2&quot;, 110mm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Código Único / Barras / QR (Opcional)</label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    value={newItem.barcode}
                    onChange={e => setNewItem({ ...newItem, barcode: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30"
                    placeholder="Ej: ECAR-A1B2C3D4"
                  />
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 shrink-0"
                    title="Generar código aleatorio"
                  >
                    ⚡ Generar
                  </button>
                  <button
                    type="button"
                    disabled={!newItem.barcode}
                    onClick={printTempBarcode}
                    className="btn-primary shrink-0"
                    title="Imprimir"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Categoría</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="material">📦 Material</option>
                    <option value="herramienta">🔧 Herramienta</option>
                    <option value="consumible">🔩 Consumible</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Unidad de Medida</label>
                  <select
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="unidad">Unidad (un)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="tn">Toneladas (tn)</option>
                    <option value="l">Litros (l)</option>
                    <option value="m">Metros (m)</option>
                    <option value="m2">Metros Cuadrados (m2)</option>
                    <option value="m3">Metros Cúbicos (m3)</option>
                    <option value="bl">Bolsa (bl)</option>
                    <option value="cj">Caja (cj)</option>
                    <option value="par">Par</option>
                    <option value="juego">Juego</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Depósito</label>
                  <select
                    value={newItem.deposit}
                    onChange={e => setNewItem({ ...newItem, deposit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white"
                  >
                    {(deposits || []).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                    <option value="DEPOSITO RAWSON">DEPOSITO RAWSON (Legado)</option>
                    <option value="ALMACEN CENTRAL">ALMACEN CENTRAL (Legado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Observación de Ubicación Antigua</label>
                  <input
                    type="text"
                    placeholder="Ej. Estante 3, Pasillo B..."
                    value={newItem.location}
                    onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                    className="input-standard"
                  />
                </div>
              </div>

              {/* Codificación interna: estantería A-E, estante (nivel) y bin (cajón) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">📍 Ubicación en Almacén: Estantería, Estante (Nivel) y Bin (Cajón)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Estantería A-E</label>
                    <select
                      value={newItem.shelf_id}
                      onChange={e => setNewItem({ ...newItem, shelf_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="">Sin asignar</option>
                      {(shelves || []).map(s => (
                        <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Estante / Nivel</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={shelfLevel}
                      onChange={e => setShelfLevel(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                      placeholder="Ej: 3"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Bin / Cajón</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={shelfBin}
                      onChange={e => setShelfBin(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                      placeholder="Ej: 2"
                    />
                  </div>
                </div>
                {selectedShelfCode && (
                  <div className="text-xs font-mono font-bold text-ecar-blue flex items-center gap-1.5 pt-1">
                    <span>Código Ubicación:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                      {selectedShelfCode}-{shelfLevel}-{shelfBin}
                    </span>
                    <span className="text-gray-400 font-normal text-[10px]">(Estantería {selectedShelfCode}, Estante {shelfLevel}, Bin {shelfBin})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Stock Actual</label>
                  <input
                    type="number"
                    value={newItem.current_stock}
                    onChange={e => setNewItem({ ...newItem, current_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Stock Mínimo</label>
                  <input
                    type="number"
                    value={newItem.min_stock}
                    onChange={e => setNewItem({ ...newItem, min_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Costo Unit. ($)</label>
                  <input
                    type="number"
                    value={newItem.unit_cost}
                    onChange={e => setNewItem({ ...newItem, unit_cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createItem.isPending || updateItem.isPending}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50"
              >
                {(createItem.isPending || updateItem.isPending) ? 'Guardando...' : editingItem ? '✅ Guardar Cambios' : '✅ Crear Ítem'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Movimiento */}
      {showMovement && createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Movimiento: {showMovement.name}</h3><button onClick={() => setShowMovement(null)}><X size={20} className="text-gray-400" /></button></div>
            <p className="text-sm text-gray-500">Stock actual: <span className="font-mono font-bold">{showMovement.current_stock} {showMovement.unit}</span></p>
            <form onSubmit={handleMovement} className="space-y-3">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['in', 'out', 'return', 'adjustment'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setMovForm({ ...movForm, movement_type: t })} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${movForm.movement_type === t ? 'bg-white shadow-sm text-orange-700' : 'text-gray-500'}`}>
                    {t === 'in' ? '📥 Ingreso' : t === 'out' ? '📤 Egreso' : t === 'return' ? '🔄 Devolución' : '⚙️ Ajuste'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Cantidad *</label><input type="number" value={movForm.quantity} onChange={e => setMovForm({ ...movForm, quantity: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-xs font-bold text-gray-500">Obra</label><select value={movForm.project_id} onChange={e => {
                  if (e.target.value === 'NEW_PROJECT') {
                    const name = prompt('Ingrese el nombre de la nueva obra/proyecto:');
                    if (name && name.trim()) {
                      createProject.mutate({ name: name.trim(), status: 'active', budget_ars: 0, client_name: '', client_cuit: '', location: '', start_date: new Date().toISOString().split('T')[0], end_date: null }, {
                        onSuccess: (newProject) => {
                          setMovForm(prev => ({ ...prev, project_id: newProject.id }));
                        }
                      });
                    }
                  } else {
                    setMovForm({ ...movForm, project_id: e.target.value });
                  }
                }} className="w-full px-3 py-2 border rounded-lg text-sm bg-white"><option value="">Sin asignar</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="NEW_PROJECT" className="font-bold text-ecar-blue">+ Agregar nueva obra...</option></select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Notas</label><input value={movForm.notes} onChange={e => setMovForm({ ...movForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Detalle del movimiento" /></div>
              <button type="submit" disabled={createMovement.isPending} className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50">
                {createMovement.isPending ? 'Registrando...' : '✅ Registrar'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Asignar Herramienta */}
      {showAssign && createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Asignar / Préstamo: {showAssign.name}</h3><button onClick={() => setShowAssign(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleAssign} className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Empleado *</label><select value={assignForm.employee_id} onChange={e => setAssignForm({ ...assignForm, employee_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white"><option value="">Seleccioná empleado...</option>{(employees || []).map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Obra / Destino *</label><select value={assignForm.project_id} onChange={e => setAssignForm({ ...assignForm, project_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white"><option value="">Seleccioná obra...</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Observaciones</label><input value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Opcional..." /></div>
              <button type="submit" disabled={createAssignment.isPending} className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50">
                {createAssignment.isPending ? 'Asignando...' : '👤 Confirmar Préstamo'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Depósito */}
      {showDepositModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Boxes size={20} className="text-ecar-blue" /> {editingDeposit ? 'Editar' : 'Nuevo'} Depósito
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-1.5 rounded-lg shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveDeposit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Depósito *</label>
                <input
                  required
                  value={depositForm.name}
                  onChange={e => setDepositForm({ ...depositForm, name: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white transition-all"
                  placeholder="Ej. DEPÓSITO CENTRAL"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ubicación / Notas</label>
                <input
                  value={depositForm.location}
                  onChange={e => setDepositForm({ ...depositForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:bg-white transition-all"
                  placeholder="Ej. Nave 1, Sector Norte..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowDepositModal(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={createDeposit.isPending || updateDeposit.isPending} className="flex-1 py-3 bg-ecar-blue hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <CheckCircle2 size={18} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Nueva/Editar Estantería */}
      {showNewShelf && createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{editingShelf ? 'Editar' : 'Nueva'} Estantería</h3><button onClick={() => { setShowNewShelf(false); setEditingShelf(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSaveShelf} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Código (Letra A-E) *</label><input value={shelfForm.code} onChange={e => setShelfForm({ ...shelfForm, code: e.target.value.toUpperCase() })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="A, B, C, D o E" /></div>
                <div><label className="text-xs font-bold text-gray-500">Nombre *</label><input value={shelfForm.name} onChange={e => setShelfForm({ ...shelfForm, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Herramientas eléctricas" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Tipo</label><select value={shelfForm.shelf_type} onChange={e => setShelfForm({ ...shelfForm, shelf_type: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">{Object.entries(SHELF_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500">Niveles</label><input type="number" min="1" max="10" value={shelfForm.rows_count} onChange={e => setShelfForm({ ...shelfForm, rows_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-xs font-bold text-gray-500">Bins / Cajones</label><input type="number" min="1" max="10" value={shelfForm.columns_count} onChange={e => setShelfForm({ ...shelfForm, columns_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Rotación</label>
                  <div className="flex items-center gap-2">
                      <input type="range" min="0" max="360" value={shelfForm.rotation} onChange={e => setShelfForm({ ...shelfForm, rotation: e.target.value })} className="w-full" />
                      <span className="text-xs font-mono w-8">{shelfForm.rotation}º</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Color Identificador</label>
                <div className="flex gap-2 mt-1">{SHELF_COLORS.map(c => <button key={c} type="button" onClick={() => setShelfForm({ ...shelfForm, color: c })} className={`w-7 h-7 rounded-full border-2 transition-all ${shelfForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Notas / Categorías asignadas</label><input value={shelfForm.notes} onChange={e => setShelfForm({ ...shelfForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Descripción del contenido..." /></div>
              <button type="submit" disabled={createShelf.isPending || updateShelf.isPending} className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50">
                {(createShelf.isPending || updateShelf.isPending) ? 'Guardando...' : editingShelf ? '💾 Guardar Cambios' : '✅ Crear Estantería'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Asignar Ubicación Bin */}
      {assignShelfItem && createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">📍 Ubicación: {assignShelfItem.name}</h3><button onClick={() => setAssignShelfItem(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const sel = (shelves || []).find(s => s.id === shelfAssignForm.shelf_id);
              const pos = shelfAssignForm.shelf_position ? shelfAssignForm.shelf_position.toUpperCase() : null;
              const locationStr = sel ? `Ubicación ${sel.code}${pos ? `-${pos}` : ''}` : null;
              await updateItem.mutateAsync({ id: assignShelfItem.id, shelf_id: shelfAssignForm.shelf_id || null, shelf_position: pos, location: locationStr } as any);
              useModalStore.getState().showAlert('Éxito', 'Ubicación asignada correctamente.');
              setAssignShelfItem(null);
            }} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Estantería *</label>
                <select value={shelfAssignForm.shelf_id} onChange={e => setShelfAssignForm({ ...shelfAssignForm, shelf_id: e.target.value })} required className="w-full px-3 py-2 border rounded-xl text-sm bg-white font-medium">
                  <option value="">Seleccioná estantería...</option>
                  {(shelves || []).map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Código de Ubicación [Estantería]-[Estante]-[Bin]</label>
                <input value={shelfAssignForm.shelf_position} onChange={e => setShelfAssignForm({ ...shelfAssignForm, shelf_position: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="Ej: C-3-2 (Estantería C, Estante 3, Bin 2)" />
              </div>
              <div className="flex gap-2 pt-2">
                {assignShelfItem.shelf_id && <button type="button" onClick={async () => { await updateItem.mutateAsync({ id: assignShelfItem.id, shelf_id: null, shelf_position: null } as any); setAssignShelfItem(null); }} className="badge badge-danger">Quitar ubicación</button>}
                <button type="submit" disabled={updateItem.isPending} className="btn-primary flex-1 py-2.5 text-xs">
                  {updateItem.isPending ? 'Guardando...' : '📍 Asignar Ubicación'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showScanner && (
        <BarcodeScannerModal
          items={items || []}
          onClose={() => setShowScanner(false)}
          onNewItemRequest={(code) => {
            setNewItem(prev => ({ ...prev, barcode: code }));
            setShowNewItem(true);
          }}
        />
      )}

      {showBarcode && createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-gray-900">Etiqueta de Código de Barras</h4>
              <button onClick={() => setShowBarcode(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <BarcodeLabel item={showBarcode} onClose={() => setShowBarcode(null)} />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Solicitar Reposición a Compras */}
      {showRepoModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={20} /> Solicitar Reposición a Compras</h2>
              <button onClick={() => setShowRepoModal(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  🏗️ Centro de Costo (Proyecto / Obra)
                </label>
                <select
                  value={repoProjectId}
                  onChange={e => {
                    if (e.target.value === 'NEW_PROJECT') {
                      const name = prompt('Ingrese el nombre de la nueva obra/proyecto:');
                      if (name && name.trim()) {
                        createProject.mutate({ name: name.trim(), status: 'active', budget_ars: 0, client_name: '', client_cuit: '', location: '', start_date: new Date().toISOString().split('T')[0], end_date: null }, {
                          onSuccess: (newProject) => {
                            setRepoProjectId(newProject.id);
                          }
                        });
                      }
                    } else {
                      setRepoProjectId(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
                >
                  <option value="">— Sin asignar (stock general) —</option>
                  {(projects || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="NEW_PROJECT" className="font-bold text-blue-600">+ Agregar nueva obra...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ítems a reponer ({repoItems.length})</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-2">
                  {repoItems.map(item => {
                    const qty = Math.max(item.min_stock * 2 - item.current_stock, item.min_stock);
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-gray-700">{item.name}</span>
                          <span className="text-gray-400 ml-2">Stock: {item.current_stock} / Mín: {item.min_stock}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-bold text-orange-700">{qty} {item.unit}</span>
                          {item.current_stock === 0 && <span className="badge badge-danger">SIN STOCK</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800">
                <strong>Resumen:</strong> Se enviará un pedido de compra con {repoItems.length} ítem{repoItems.length > 1 ? 's' : ''} 
                {repoProjectId ? ` imputado al proyecto "${(projects || []).find(p => p.id === repoProjectId)?.name}"` : ' sin centro de costo asignado'}.
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowRepoModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                  Cancelar
                </button>
                <button
                  onClick={handleRepoSubmit}
                  disabled={createPurchaseReq.isPending}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-xl font-bold text-sm hover:from-red-700 hover:to-orange-700 transition-all shadow-md disabled:opacity-50"
                >
                  {createPurchaseReq.isPending ? 'Enviando...' : '📤 Enviar a Compras'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Excel Importer Modal */}
      {showImporter && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl relative">
            <button onClick={() => setShowImporter(false)} className="absolute -top-12 right-0 text-white hover:text-slate-200"><X size={24} /></button>
            <WarehouseExcelImporter existingShelves={shelves || []} onComplete={() => { setShowImporter(false); window.location.reload(); }} />
          </div>
        </div>,
        document.body
      )}

      {/* Return Tool Modal */}
      {returningAssignment && (
        <ReturnToolModal
          assignment={returningAssignment}
          onClose={() => setReturningAssignment(null)}
          onConfirm={handleReturnWithNovelty}
        />
      )}

      {/* Quick Stock Adjustment Modal */}
      {showQuickAdjustment && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-ecar-blue p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Boxes size={18} /> Ajuste Rápido de Stock
              </h3>
              <button onClick={() => setShowQuickAdjustment(null)} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!showQuickAdjustment) return;
              const val = parseFloat(quickAdjQty);
              if (isNaN(val) || val < 0) {
                useModalStore.getState().showAlert('Error', 'Ingrese una cantidad válida.');
                return;
              }
              const oldStock = showQuickAdjustment.current_stock;
              const diff = val - oldStock;

              try {
                await updateItem.mutateAsync({
                  id: showQuickAdjustment.id,
                  current_stock: val
                });

                await createMovement.mutateAsync({
                  item_id: showQuickAdjustment.id,
                  movement_type: diff >= 0 ? 'in' : 'out',
                  quantity: Math.abs(diff),
                  notes: `Ajuste manual de stock (${oldStock} -> ${val}). ${quickAdjNotes || ''}`.trim(),
                  created_by: profile?.full_name || 'Pañol Central'
                });

                useModalStore.getState().showAlert('Éxito', `Stock de "${showQuickAdjustment.name}" actualizado a ${val} ${showQuickAdjustment.unit}.`);
                setShowQuickAdjustment(null);
              } catch (err: any) {
                useModalStore.getState().showAlert('Error', err?.message || 'No se pudo actualizar el stock.');
              }
            }} className="p-5 space-y-4">
              <div>
                <p className="font-bold text-sm text-slate-800">{showQuickAdjustment.name}</p>
                <p className="text-xs text-slate-400 font-mono">Código: {showQuickAdjustment.item_code || showQuickAdjustment.barcode || 'S/C'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold">Stock Actual:</span>
                <span className="text-sm font-mono font-bold text-slate-800">{showQuickAdjustment.current_stock} {showQuickAdjustment.unit}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nuevo Stock Real ({showQuickAdjustment.unit}):</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={quickAdjQty}
                  onChange={e => setQuickAdjQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-ecar-blue/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Motivo / Observaciones:</label>
                <input
                  type="text"
                  placeholder="Ej. Conteo físico de inventario, merma..."
                  value={quickAdjNotes}
                  onChange={e => setQuickAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-ecar-blue/30 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowQuickAdjustment(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-ecar-blue text-white text-xs font-bold hover:bg-blue-700 shadow-xs">
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Item Price History Modal */}
      {selectedHistoryItem && (
        <ItemPriceHistoryModal
          item={selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
        />
      )}

      {/* Dispatch Cart Modal (Remito) */}
      {showDispatchCart && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-5 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 p-2"><Truck size={100} /></div>
              <div className="relative z-10">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Truck size={20} /> Despacho de Materiales a Obra (Remito Interno)
                </h3>
                <p className="text-xs text-orange-100 mt-0.5">Asigna múltiples productos a un proyecto y destinatario de una sola vez.</p>
              </div>
              <button onClick={() => setShowDispatchCart(false)} className="text-white/70 hover:text-white transition-colors relative z-10"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Info Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Obra / Proyecto Destino *</label>
                  <select
                    value={dispatchProject}
                    onChange={e => setDispatchProject(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="">— Seleccionar Obra —</option>
                    {(projects || []).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Entregado a (Retira) *</label>
                  <input
                    type="text"
                    required
                    value={dispatchEmployee}
                    onChange={e => setDispatchEmployee(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nota del Remito</label>
                  <input
                    type="text"
                    value={dispatchNotes}
                    onChange={e => setDispatchNotes(e.target.value)}
                    placeholder="Ej. Para armar 3 servicios de agua"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Layout for Search and Cart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Search and Add Items */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Search size={16} className="text-orange-600" /> Buscar Productos
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={dispatchSearch}
                    onChange={e => setDispatchSearch(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-orange-200 focus:border-orange-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                  />
                  <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl shadow-inner bg-white divide-y divide-slate-100">
                    {items?.filter(i => {
                        if (!dispatchSearch) return false;
                        const s = dispatchSearch.toLowerCase();
                        return i.name.toLowerCase().includes(s) || (i.item_code || '').toLowerCase().includes(s) || (i.barcode || '').toLowerCase().includes(s);
                      }).slice(0, 20).map(item => (
                        <div key={item.id} className="p-3 hover:bg-orange-50/50 flex justify-between items-center transition-colors">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                            <p className="text-xs text-slate-500 font-mono">Stock actual: <span className="font-bold text-slate-700">{item.current_stock} {item.unit}</span> | Cód: {item.item_code || item.barcode || 'S/C'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (item.current_stock <= 0) {
                                const confirm = await useModalStore.getState().showConfirm('Sin Stock', `El artículo "${item.name}" no tiene stock disponible para despachar. ¿Deseas agregarlo de todos modos?`);
                                if (!confirm) return;
                              }
                              if (!dispatchCartItems.find(i => i.item.id === item.id)) {
                                setDispatchCartItems([...dispatchCartItems, { item, qty: '1' }]);
                              }
                              setDispatchSearch('');
                            }}
                            className="bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            + Añadir
                          </button>
                        </div>
                    ))}
                    {dispatchSearch && items?.filter(i => i.name.toLowerCase().includes(dispatchSearch.toLowerCase()) || (i.item_code || '').toLowerCase().includes(dispatchSearch.toLowerCase()) || (i.barcode || '').toLowerCase().includes(dispatchSearch.toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-slate-500 text-sm">No se encontraron productos.</div>
                    )}
                    {!dispatchSearch && (
                      <div className="p-4 text-center text-slate-400 text-xs italic">Ingresá el nombre o código para buscar un producto.</div>
                    )}
                  </div>
                </div>

                {/* Right Side: Cart Items */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-emerald-600" /> Ítems en el Remito ({dispatchCartItems.length})
                  </label>
                  <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-2">
                    {dispatchCartItems.length === 0 ? (
                      <div className="h-full min-h-48 flex flex-col items-center justify-center text-slate-400">
                        <ShoppingBag size={32} className="mb-2 opacity-30" />
                        <p className="text-sm font-semibold">El carrito está vacío</p>
                        <p className="text-xs">Buscá y agregá ítems desde el panel izquierdo.</p>
                      </div>
                    ) : (
                      dispatchCartItems.map((cartItem, idx) => {
                        const remaining = cartItem.item.current_stock - (parseFloat(cartItem.qty) || 0);
                        const isWarning = remaining < 0;
                        return (
                          <div key={cartItem.item.id} className={`bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between gap-3 ${isWarning ? 'border-red-300' : 'border-slate-200'}`}>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{cartItem.item.name}</p>
                              <p className={`text-[10px] font-mono mt-0.5 ${isWarning ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                Quedarían en stock: {remaining} {cartItem.item.unit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={cartItem.qty}
                                onChange={(e) => {
                                  const newCart = [...dispatchCartItems];
                                  newCart[idx].qty = e.target.value;
                                  setDispatchCartItems(newCart);
                                }}
                                className={`w-20 px-2 py-1.5 border rounded-lg text-sm font-mono font-bold text-right focus:outline-none focus:ring-2 ${isWarning ? 'border-red-300 focus:ring-red-500/50 bg-red-50' : 'border-slate-300 focus:ring-orange-500 bg-slate-50'}`}
                              />
                              <span className="text-xs text-slate-500 font-bold w-6">{cartItem.item.unit}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCart = [...dispatchCartItems];
                                  newCart.splice(idx, 1);
                                  setDispatchCartItems(newCart);
                                }}
                                className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors ml-1"
                                title="Quitar del carrito"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowDispatchCart(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={dispatchCartItems.length === 0 || !dispatchProject || !dispatchEmployee || createMovement.isPending}
                onClick={handleDispatchCartSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMovement.isPending ? 'Procesando Remito...' : '🚚 Confirmar Despacho Múltiple'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL NUEVA RESERVA */}
      {showReserveModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={22} /> Nueva Reserva de Stock
              </h3>
              <button onClick={() => setShowReserveModal(false)} className="text-white/70 hover:text-white transition-colors relative z-10">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReserveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Seleccionar Material</label>
                <select
                  required
                  value={reserveForm.itemId}
                  onChange={e => setReserveForm({ ...reserveForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Buscar o seleccionar ítem...</option>
                  {(items || []).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.item_code ? `[${i.item_code}] ` : ''}{i.name} - Disp: {(i.current_stock || 0) - (i.reserved_stock || 0)} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cantidad a Reservar</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  value={reserveForm.quantity}
                  onChange={e => setReserveForm({ ...reserveForm, quantity: e.target.value })}
                  placeholder="Ej. 5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateItem.isPending}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {updateItem.isPending ? 'Guardando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
