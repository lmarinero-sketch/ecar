import React, { useState, useMemo } from 'react';
import {
  Warehouse, Truck, Repeat, Wrench, Plus, ChevronDown, ChevronUp, Package, Clock,
  ShieldAlert, AlertTriangle, ArrowRight, X, Save, Calendar, MapPin,
  CheckCircle2, PackageCheck, FileText, TrendingUp, Search, ShoppingCart
} from 'lucide-react';
import {
  useAllFuelVehicles, useInventoryItems, useToolAssignments, useProjects,
  useLogisticsDeliveries, useCreateLogisticsDelivery, useUpdateLogisticsDelivery,
   useCreateLogisticsMaintenanceLog,
  useUpdateInventoryItem, useCreateInventoryMovement,
  usePurchaseRequests, useUpdatePurchaseRequest, useEmployees
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useStore';
import { createPortal } from 'react-dom';
import { exportDispatchPdf } from '../lib/orderPdfExport';
import type { FuelVehicle, LogisticsDelivery, LogisticsMaintenanceLog } from '../lib/types';

type Tab = 'dashboard' | 'obra_requests' | 'deliveries' | 'diagrams';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'badge-warning' },
  pendiente_autorizacion: { label: 'Pendiente Aut.', cls: 'bg-orange-100 text-orange-800' },
  aprobado: { label: 'Aprobado', cls: 'bg-purple-100 text-purple-800' },
  en_transito: { label: 'En Tránsito', cls: 'badge-info' },
  entregado: { label: 'Entregado', cls: 'badge-success' },
  cancelado: { label: 'Cancelado', cls: 'badge-neutral' },
  rechazado: { label: 'Rechazado', cls: 'bg-red-100 text-red-800' },
};

const MAINT_TYPE_LABEL: Record<string, string> = {
  service: 'Service', vtv: 'VTV', seguro: 'Seguro', reparacion: 'Reparación',
  neumaticos: 'Neumáticos', otro: 'Otro',
};

const VEHICLE_ICON: Record<string, string> = {
  camion: '🚛', camioneta: '🛻', auto: '🚗', maquinaria: '🏗️', moto: '🏍️', otro: '🚐',
};

const CONDITION_CLS: Record<string, string> = {
  operativo: 'badge-success',
  con_observaciones: 'badge-warning',
  fuera_de_servicio: 'badge-danger',
};

export const LogisticsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showIntro, setShowIntro] = useState(false);

  // Data from existing tables
  const { data: allVehicles = [] } = useAllFuelVehicles();
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: toolAssignments = [] } = useToolAssignments();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();

  // Logistics-own tables
  const { data: deliveries = [], isLoading: loadingDeliveries } = useLogisticsDeliveries();
  const { data: purchaseRequests = [] } = usePurchaseRequests();
  const updatePurchaseRequest = useUpdatePurchaseRequest();

  // Todos los pedidos que vienen desde las obras
  const obraRequests = purchaseRequests;

  // KPIs computed from real data
  const kpis = useMemo(() => {
    const criticalStock = (inventoryItems || []).filter(i => i.current_stock <= i.min_stock).length;
    const overdueTools = (toolAssignments || []).filter(t => t.status === 'assigned' && !t.returned_date).length;
    const activeVehicles = allVehicles.filter(v => v.status === 'active');
    const nextMaint = activeVehicles.filter(v => {
      if (!v.next_maintenance_date) return false;
      const d = new Date(v.next_maintenance_date);
      const limit = new Date();
      limit.setDate(limit.getDate() + 15);
      return d <= limit;
    }).length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'pendiente' || d.status === 'en_transito').length;
    return { criticalStock, overdueTools, nextMaint, activeVehicles: activeVehicles.length, totalVehicles: allVehicles.length, pendingDeliveries };
  }, [inventoryItems, toolAssignments, allVehicles, deliveries]);

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: ShieldAlert, label: 'Dashboard' },
    { id: 'obra_requests', icon: Package, label: 'Pedidos de Obra' },
    { id: 'deliveries', icon: Repeat, label: 'Logística y Entregas' },
    { id: 'diagrams', icon: FileText, label: 'Procesos y Diagramas' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Warehouse size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <Warehouse size={24} /> Gerencia de Logística
          </h3>
          <p className="text-ecar-blueLight text-sm mt-1 max-w-2xl">
            Aseguramos que cada obra cuente con los recursos físicos necesarios en tiempo y forma.
            Administramos inventarios, pañol, herramientas y la flota para evitar interrupciones operativas.
          </p>
        </div>
      </div>

      {/* Intro Accordion */}
      <div className="light-card overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowIntro(!showIntro)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ecar-blueLight flex items-center justify-center text-ecar-blue shrink-0">
              <PackageCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">¿Cómo funciona Logística en ECAR?</h4>
              <p className="text-xs text-gray-500 mt-0.5">Stock crítico, Trazabilidad, Mantenimiento preventivo y Entregas a obra.</p>
            </div>
          </div>
          <div className="text-gray-400">
            {showIntro ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>
        {showIntro && (
          <div className="p-4 md:p-6 border-t border-gray-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <h5 className="font-bold text-ecar-blue text-sm flex items-center gap-2"><Package size={16} /> 1. Depósito & Stock</h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Logística debe conocer exactamente qué tenemos, dónde está y su estado.
                  Definimos <span className="font-semibold text-gray-800">Alertas de Reposición</span> antes de que el material se agote.
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-ecar-blue text-sm flex items-center gap-2"><Repeat size={16} /> 2. Despachos</h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Cada salida tiene un responsable y una fecha de devolución.
                  La trazabilidad previene pérdidas económicas.
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-ecar-blue text-sm flex items-center gap-2"><Truck size={16} /> 3. Flota</h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Control de horas y km nos permite anticipar mantenimientos preventivos, services y VTV.
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-ecar-blue text-sm flex items-center gap-2"><MapPin size={16} /> 4. Entregas a Obra</h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Programamos qué materiales y herramientas van a cada obra, con qué vehículo y quién es el responsable.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-500">¿Querés ver el flujo paso a paso con los diagramas interactivos de Pedidos, Compras y Flota?</span>
              <button
                onClick={() => setActiveTab('diagrams')}
                className="px-4 py-2 bg-ecar-blue text-white text-xs font-bold rounded-lg hover:bg-ecar-blueDark transition-colors flex items-center gap-2 shadow-sm"
              >
                <FileText size={14} /> Abrir Diagramas de Procesos completos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 md:gap-6 px-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-ecar-blue text-ecar-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="light-card min-h-[400px]">
        {activeTab === 'dashboard' && (
          <DashboardTab kpis={kpis} deliveries={deliveries} allVehicles={allVehicles} inventoryItems={inventoryItems} />
        )}
        {activeTab === 'obra_requests' && (
          <ObraRequestsTab
            requests={obraRequests}
            updateRequest={updatePurchaseRequest}
            employees={employees}
            allVehicles={allVehicles}
            onGoToDeliveries={() => setActiveTab('deliveries')}
          />
        )}
        {activeTab === 'deliveries' && (
          <DeliveriesTab deliveries={deliveries} loading={loadingDeliveries} projects={projects} allVehicles={allVehicles} inventoryItems={inventoryItems} employees={employees} />
        )}
        {activeTab === 'diagrams' && (
          <ProcessDiagramsTab />
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════ OBRA REQUESTS TAB ═══════════════════════ */

const ObraRequestsTab: React.FC<{
  requests: any[];
  updateRequest: any;
  employees: any[];
  allVehicles: any[];
  onGoToDeliveries: () => void;
}> = ({ requests, updateRequest, employees, allVehicles, onGoToDeliveries }) => {
  const { setActiveModule } = useAppStore();
  const { profile } = useAuth();
  const createDelivery = useCreateLogisticsDelivery();
  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  const [dispatchModalReq, setDispatchModalReq] = useState<any | null>(null);
  const [dispatchItemsState, setDispatchItemsState] = useState<Record<string, { quantity_sent: number; notes: string }>>({});
  const [dispatchedBy, setDispatchedBy] = useState('');
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchVehicleId, setDispatchVehicleId] = useState('');
  const [dispatchDate, setDispatchDate] = useState(today());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeriveToPurchases = async (reqId: string) => {
    if (confirm('¿Derivar este pedido a Compras de forma definitiva?')) {
      await updateRequest.mutateAsync({ id: reqId, request_type: 'purchase', status: 'pending' });
    }
  };

  const openDispatchModal = (req: any) => {
    const initial: Record<string, { quantity_sent: number; notes: string }> = {};
    (req.items || []).forEach((it: any) => {
      initial[it.id] = {
        quantity_sent: it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : it.quantity,
        notes: it.dispatch_notes || ''
      };
    });
    setDispatchItemsState(initial);
    setDispatchedBy(profile?.full_name || 'Pañol Central');
    setDispatchDriverName('');
    setDispatchVehicleId('');
    setDispatchDate(today());
    setDispatchModalReq(req);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalReq) return;
    setIsSubmitting(true);
    try {
      // 1. Update purchase request status to 'ordered'
      await updateRequest.mutateAsync({
        id: dispatchModalReq.id,
        status: 'ordered',
        dispatched_by: dispatchedBy,
        dispatched_at: new Date().toISOString()
      });

      // 2. Auto-create logistics delivery
      const itemsSent = (dispatchModalReq.items || []).map((it: any) => ({
        description: it.description,
        quantity: dispatchItemsState[it.id]?.quantity_sent ?? it.quantity,
        unit: it.unit || 'un'
      })).filter((i: any) => i.quantity > 0);

      await createDelivery.mutateAsync({
        project_id: dispatchModalReq.project_id || null,
        vehicle_id: dispatchVehicleId || null,
        driver_name: dispatchDriverName || null,
        delivery_date: dispatchDate || today(),
        status: 'en_transito',
        notes: `Despacho de Pedido PED-${dispatchModalReq.id.slice(0, 8).toUpperCase()}`,
        items: itemsSent
      } as any);

      // 3. Export PDF
      const updatedReq = {
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
      await exportDispatchPdf(updatedReq as any);

      setDispatchModalReq(null);
      onGoToDeliveries();
    } catch (err: any) {
      alert(`Error al declarar despacho: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base md:text-lg">
            <Package size={20} className="text-ecar-blue" /> Pedidos Recibidos desde Obra
          </h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Logística evalúa los pedidos de Obra. Si hay stock en Pañol, lo resuelve enviándolo. Si no hay stock, lo deriva a Compras.
          </p>
        </div>
        <button
          onClick={() => setActiveModule('purchase_requests')}
          className="px-4 py-2 bg-slate-900 hover:bg-ecar-blue text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0 shadow-sm"
        >
          <span>Abrir Gestor Completo de Pedidos →</span>
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <PackageCheck size={48} className="mx-auto mb-3 text-emerald-400 opacity-50" />
          <p className="font-bold text-gray-700">No hay pedidos pendientes</p>
          <p className="text-sm text-gray-500">Todo el material solicitado ha sido procesado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Obra: <span className="text-ecar-blue font-semibold">{r.project?.name || 'S/D'}</span>
                </p>
                <div className="space-y-2 mt-3">
                  {r.items?.map((it: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-ecar-blue block" />
                      {it.quantity} {it.unit} - {it.description}
                    </div>
                  ))}
                </div>
                {r.notes && <p className="text-xs text-gray-500 mt-3 italic text-orange-600 bg-orange-50 p-2 rounded">Nota: {r.notes}</p>}
                {r.urgency === 'urgent' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold mt-2"><AlertTriangle size={12} /> Urgente</span>}
              </div>
              <div className="flex flex-col gap-2 min-w-[220px] w-full md:w-auto">
                <button onClick={() => openDispatchModal(r)} className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Truck size={16} /> Declarar Despacho / Pañol
                </button>
                <button onClick={() => handleDeriveToPurchases(r.id)} className="bg-white border-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                  <ShoppingCart size={16} /> Derivar a Compras
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-bold text-gray-700 text-sm mb-4">Pedidos Procesados Recientemente</h4>
          <div className="space-y-3">
            {processed.slice(0, 10).map(r => (
              <div key={r.id} className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between opacity-70">
                <span className="font-bold">{r.project?.name}</span>
                <span className="truncate flex-1 px-4">{r.items?.map((i:any) => i.description).join(', ')}</span>
                <span className="font-mono text-gray-400">{r.created_at.split('T')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatch Modal inside Logistics */}
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
                    {employees.filter(e => e.status === 'active').map(e => (
                      <option key={e.id} value={e.full_name}>{e.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Vehículo Asignado</label>
                  <select
                    value={dispatchVehicleId}
                    onChange={e => setDispatchVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
                  >
                    <option value="">— Seleccionar vehículo —</option>
                    {allVehicles.filter(v => v.status === 'active').map(v => (
                      <option key={v.id} value={v.id}>{v.code} - {v.description} {v.plate ? `(${v.plate})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">Conformación de Materiales Despachados</label>
                <div className="space-y-3">
                  {(dispatchModalReq.items || []).map((it: any) => {
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
                            <AlertTriangle size={13} /> Faltan {it.quantity - current.quantity_sent} {it.unit} por cubrir. El saldo faltante quedará registrado.
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
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Confirmando...' : '📄 Confirmar Despacho & Generar Remito PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/* ═══════════════════════ DASHBOARD TAB ═══════════════════════ */

const DashboardTab: React.FC<{
  kpis: { criticalStock: number; overdueTools: number; nextMaint: number; activeVehicles: number; totalVehicles: number; pendingDeliveries: number };
  deliveries: LogisticsDelivery[];
  allVehicles: FuelVehicle[];
  inventoryItems: any[];
}> = ({ kpis, deliveries, allVehicles, inventoryItems }) => {
  const upcomingDeliveries = deliveries.filter(d => d.status === 'pendiente' || d.status === 'en_transito').slice(0, 5);
  const criticalItems = (inventoryItems || []).filter((i: any) => i.current_stock <= i.min_stock).slice(0, 5);
  const vehiclesNeedingMaint = allVehicles.filter(v => {
    if (!v.next_maintenance_date) return false;
    const d = new Date(v.next_maintenance_date);
    const limit = new Date();
    limit.setDate(limit.getDate() + 15);
    return d <= limit;
  }).slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
        <TrendingUp className="text-ecar-blue" /> Panel de Control Logístico
      </h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Stock Crítico" subtitle="Bajo mínimo" value={kpis.criticalStock}
          gradient="from-red-50 to-red-100" border="border-red-200" text="text-red-700" valueText="text-red-800" subtitleText="text-red-600"
          icon={<AlertTriangle size={18} />} />
        <KpiCard title="Herramientas" subtitle="Sin devolver" value={kpis.overdueTools}
          gradient="from-amber-50 to-amber-100" border="border-amber-200" text="text-amber-700" valueText="text-amber-800" subtitleText="text-amber-600"
          icon={<Clock size={18} />} />
        <KpiCard title="Mantenimiento" subtitle="Próximos 15 días" value={kpis.nextMaint}
          gradient="from-blue-50 to-blue-100" border="border-blue-200" text="text-blue-700" valueText="text-blue-800" subtitleText="text-blue-600"
          icon={<Wrench size={18} />} />
        <KpiCard title="Flota Activa" subtitle={`de ${kpis.totalVehicles} total`} value={kpis.activeVehicles}
          gradient="from-emerald-50 to-emerald-100" border="border-emerald-200" text="text-emerald-700" valueText="text-emerald-800" subtitleText="text-emerald-600"
          icon={<Truck size={18} />} />
        <KpiCard title="Entregas" subtitle="Pendientes" value={kpis.pendingDeliveries}
          gradient="from-slate-50 to-ecar-blueLight" border="border-ecar-blueLight" text="text-ecar-blue" valueText="text-ecar-blueDark" subtitleText="text-ecar-blue"
          icon={<Package size={18} />} />
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas entregas */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Repeat size={14} /> Próximas Entregas</h4>
          {upcomingDeliveries.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 text-sm">Sin entregas pendientes</div>
          ) : (
            <div className="space-y-2">
              {upcomingDeliveries.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{(d.project as any)?.name || d.destination || 'Sin destino'}</p>
                    <p className="text-xs text-gray-500">{new Date(d.delivery_date).toLocaleDateString('es-AR')} · {d.driver_name || 'Sin chofer'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[d.status]?.cls}`}>{STATUS_BADGE[d.status]?.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock crítico */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /> Stock Crítico</h4>
          {criticalItems.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 text-sm">Todo el stock por encima del mínimo 👍</div>
          ) : (
            <div className="space-y-2">
              {criticalItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.location || 'Pañol'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-700">{item.current_stock} / {item.min_stock}</p>
                    <p className="text-xs text-red-500">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mantenimientos próximos */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Wrench size={14} className="text-blue-500" /> Mantenimientos Próximos</h4>
          {vehiclesNeedingMaint.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 text-sm">Sin mantenimientos próximos</div>
          ) : (
            <div className="space-y-2">
              {vehiclesNeedingMaint.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <span>{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{v.code} - {v.description}</p>
                      <p className="text-xs text-gray-500">{v.plate || 'Sin patente'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-700">{v.next_maintenance_date ? new Date(v.next_maintenance_date).toLocaleDateString('es-AR') : '-'}</p>
                    {v.next_maintenance_km && <p className="text-xs text-blue-500">{v.next_maintenance_km.toLocaleString()} km</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string; subtitle: string; value: number; gradient: string; border: string; text: string; valueText: string; subtitleText: string; icon: React.ReactNode }> = (
  { title, subtitle, value, gradient, border, text, valueText, subtitleText, icon }
) => (
  <div className={`bg-gradient-to-br ${gradient} border ${border} rounded-xl p-4`}>
    <h4 className={`${text} text-xs font-bold flex items-center gap-1.5`}>{icon} {title}</h4>
    <p className={`text-3xl font-black ${valueText} mt-2`}>{value}</p>
    <p className={`text-xs ${subtitleText} mt-1`}>{subtitle}</p>
  </div>
);

/* ═══════════════════════ DELIVERIES TAB ═══════════════════════ */

const DeliveriesTab: React.FC<{
  deliveries: LogisticsDelivery[];
  loading: boolean;
  projects: any[];
  allVehicles: FuelVehicle[];
  inventoryItems: any[];
  employees: any[];
}> = ({ deliveries, loading, inventoryItems }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const updateDelivery = useUpdateLogisticsDelivery();
  const { profile } = useAuth();

  const [receivingDelivery, setReceivingDelivery] = useState<any>(null);
  const [checklistValues, setChecklistValues] = useState<Record<string, number>>({});
  const updateItem = useUpdateInventoryItem();
  const createMovement = useCreateInventoryMovement();

  const filtered = useMemo(() => {
    let list = deliveries;
    if (filterStatus !== 'all') list = list.filter(d => d.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(d =>
        (d.destination || '').toLowerCase().includes(s) ||
        (d.driver_name || '').toLowerCase().includes(s) ||
        ((d.project as any)?.name || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [deliveries, filterStatus, search]);

  const changeStatus = async (id: string, status: string, reason?: string) => {
    await updateDelivery.mutateAsync({ id, status, rejection_reason: reason || null } as any);
  };

  const handleReceiveDelivery = async () => {
    if (!receivingDelivery || updateDelivery.isPending) return;
    
    let isPartial = false;
    let missingNotes = [];

    for (const dItem of receivingDelivery.items || []) {
      const receivedQty = checklistValues[dItem.id] || 0;
      if (receivedQty < dItem.quantity) {
        isPartial = true;
        missingNotes.push(`Faltaron ${dItem.quantity - receivedQty} de ${dItem.description}`);
      }

      if (dItem.item_id && receivedQty > 0) {
        // NOTE: We do NOT deduct stock here. 
        // Stock is already deducted centrally when the Pañolero dispatches the request (useDispatchPurchaseRequest).
        // Deducting stock again here causes duplicate stock deductions.
      }
    }
    
    const notes = isPartial ? `Recepción parcial. ${missingNotes.join(', ')}` : '';
    await updateDelivery.mutateAsync({ id: receivingDelivery.id, status: 'entregado', notes: receivingDelivery.notes ? receivingDelivery.notes + '. ' + notes : notes } as any);
    setReceivingDelivery(null);
    setChecklistValues({});
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Repeat className="text-ecar-blue" /> Trazabilidad de Entregas y Envíos</h3>
          <p className="text-xs text-gray-500 mt-0.5">Control de despachos en camino, choferes asignados y entregas confirmadas en obra.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar obra, chofer..."
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-48 outline-none focus:ring-2 focus:ring-ecar-blue/20"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl text-sm px-3 py-2 outline-none font-medium">
            <option value="all">Todos los estados</option>
            <option value="en_transito">🚚 En Tránsito / En Camino</option>
            <option value="pendiente">🔵 Pendientes</option>
            <option value="entregado">✅ Entregados en Obra</option>
            <option value="cancelado">❌ Cancelados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin"></div></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Obra / Destino</th>
                <th>Vehículo</th>
                <th>Chofer</th>
                <th className="text-center">Ítems</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td className="text-gray-500 text-xs">{new Date(d.delivery_date).toLocaleDateString('es-AR')}</td>
                  <td className="font-medium text-gray-800">{(d.project as any)?.name || d.destination || '-'}</td>
                  <td className="text-gray-600 text-xs">{(d.vehicle as any)?.code ? `${(d.vehicle as any).code} ${(d.vehicle as any).plate ? `(${(d.vehicle as any).plate})` : ''}` : '-'}</td>
                  <td className="text-gray-700">{d.driver_name || '-'}</td>
                  <td className="text-center font-bold text-gray-700">{(d.items || []).length}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[d.status]?.cls}`}>
                      {STATUS_BADGE[d.status]?.label}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {(d.status === 'pendiente' || d.status === 'pendiente_autorizacion') && (
                        <>
                          <button onClick={() => changeStatus(d.id, 'aprobado')} className="text-purple-600 hover:bg-purple-50 p-1 rounded" title="Autorizar Entrega">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => {
                            const reason = prompt('Motivo del rechazo:');
                            if (reason !== null && reason.trim() !== '') {
                              changeStatus(d.id, 'rechazado', reason);
                            } else if (reason === '') {
                              alert('Debes ingresar un motivo para rechazar.');
                            }
                          }} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Rechazar Entrega">
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {d.status === 'aprobado' && (
                        <button onClick={() => changeStatus(d.id, 'en_transito')} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Despachar a obra">
                          <ArrowRight size={16} />
                        </button>
                      )}
                      {d.status === 'en_transito' && (
                        <>
                          <button onClick={() => {
                            // En un entorno real se usaría window.location o un store setter para cambiar el módulo.
                            // Por ahora simulamos un link global a "tracking" si existe.
                            window.location.hash = '#tracking';
                          }} className="text-blue-400 hover:bg-blue-50 p-1 rounded" title="Ver Mapa en Vivo">
                            <MapPin size={16} />
                          </button>
                          <button onClick={() => {
                            const initialChecklist: Record<string, number> = {};
                            d.items?.forEach((i: any) => initialChecklist[i.id] = i.quantity);
                            setChecklistValues(initialChecklist);
                            setReceivingDelivery(d);
                          }} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="Recepción en obra">
                            <PackageCheck size={16} />
                          </button>
                        </>
                      )}
                      {(d.status === 'pendiente' || d.status === 'pendiente_autorizacion' || d.status === 'aprobado' || d.status === 'en_transito' || d.status === 'rechazado') && (
                        <button onClick={() => changeStatus(d.id, 'cancelado')} className="text-gray-400 hover:bg-gray-50 p-1 rounded" title="Cancelar definitivamente">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Repeat size={48} className="mx-auto mb-3 opacity-20" />
          <p>No hay entregas registradas.</p>
          <p className="text-xs mt-1">Programá una nueva entrega a obra usando el botón superior.</p>
        </div>
      )}

      {/* Modal de Checklist de Recepción */}
      {receivingDelivery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2"><PackageCheck size={20} /> Checklist de Recepción en Obra</h2>
              <button onClick={() => setReceivingDelivery(null)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm mb-4">
                Por favor, confirmá la recepción de los siguientes materiales/herramientas en <strong>{(receivingDelivery.project as any)?.name || receivingDelivery.destination || 'Obra'}</strong>. Al confirmar, se descontarán del stock.
              </div>
              
              <div className="space-y-2">
                {(receivingDelivery.items || []).map((it: any) => (
                  <div key={it.id} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{it.description}</div>
                      <div className="text-sm text-gray-500">Esperado: {it.quantity} {it.unit}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">Recibido:</span>
                      <input 
                        type="number" 
                        min="0"
                        max={it.quantity}
                        className="w-20 border rounded-lg px-2 py-1 text-center"
                        value={checklistValues[it.id] !== undefined ? checklistValues[it.id] : it.quantity}
                        onChange={(e) => setChecklistValues({...checklistValues, [it.id]: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setReceivingDelivery(null)} className="btn-secondary px-5 py-2">Cancelar</button>
              <button 
                onClick={handleReceiveDelivery} 
                disabled={updateDelivery.isPending || (receivingDelivery.items || []).some((it: any) => !checklistValues[it.id])} 
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none px-5 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={18} /> Confirmar Recepción Completa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════ FLEET TAB ═══════════════════════ */

export const FleetTab: React.FC<{ vehicles: FuelVehicle[]; loading: boolean }> = ({ vehicles, loading }) => {
  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = vehicles;
    if (filterCondition !== 'all') list = list.filter(v => v.vehicle_condition === filterCondition);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(v =>
        v.code.toLowerCase().includes(s) ||
        v.description.toLowerCase().includes(s) ||
        (v.plate || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [vehicles, filterCondition, search]);

  const summary = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    inactive: vehicles.filter(v => v.status === 'inactive').length,
    operativo: vehicles.filter(v => v.vehicle_condition === 'operativo').length,
    con_obs: vehicles.filter(v => v.vehicle_condition === 'con_observaciones').length,
    fuera: vehicles.filter(v => v.vehicle_condition === 'fuera_de_servicio').length,
  }), [vehicles]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Truck className="text-ecar-blue" /> Flota y Maquinaria</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 pr-3 py-2 border rounded-lg text-sm w-40" />
          </div>
          <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)} className="border rounded-lg text-sm px-3 py-2">
            <option value="all">Todos</option>
            <option value="operativo">Operativos</option>
            <option value="con_observaciones">Con Observaciones</option>
            <option value="fuera_de_servicio">Fuera de Servicio</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center border"><p className="text-2xl font-black text-gray-800">{summary.total}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100"><p className="text-2xl font-black text-emerald-700">{summary.active}</p><p className="text-xs text-emerald-600">Activos</p></div>
        <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100"><p className="text-2xl font-black text-amber-700">{summary.maintenance}</p><p className="text-xs text-amber-600">Mantenimiento</p></div>
        <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100"><p className="text-2xl font-black text-green-700">{summary.operativo}</p><p className="text-xs text-green-600">Operativos</p></div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-100"><p className="text-2xl font-black text-yellow-700">{summary.con_obs}</p><p className="text-xs text-yellow-600">c/ Obs.</p></div>
        <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100"><p className="text-2xl font-black text-red-700">{summary.fuera}</p><p className="text-xs text-red-600">Fuera Serv.</p></div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin"></div></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Vehículo</th>
                <th>Patente</th>
                <th className="text-center">Km Actual</th>
                <th>Próx. Mant.</th>
                <th>VTV</th>
                <th>Seguro</th>
                <th>Condición</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const vtvExpired = v.vtv_expiry && v.vtv_expiry <= today();
                const insExpired = v.insurance_expiry && v.insurance_expiry <= today();
                const maintSoon = v.next_maintenance_date && v.next_maintenance_date <= today();
                return (
                  <tr key={v.id}>
                    <td className="font-mono text-xs text-gray-500 flex items-center gap-2">
                      <span>{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span> {v.code}
                    </td>
                    <td className="font-medium text-gray-800">{v.description} {v.brand ? <span className="text-gray-400 font-normal ml-1">({v.brand})</span> : null}</td>
                    <td className="text-gray-600">{v.plate || '-'}</td>
                    <td className="text-center font-bold">{v.current_km?.toLocaleString() || '-'}</td>
                    <td className={`text-xs ${maintSoon ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      {v.next_maintenance_date ? new Date(v.next_maintenance_date).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className={`text-xs ${vtvExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      {v.vtv_expiry ? new Date(v.vtv_expiry).toLocaleDateString('es-AR') : '-'}
                      {vtvExpired && <span className="ml-1">⚠️</span>}
                    </td>
                    <td className={`text-xs ${insExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      {v.insurance_expiry ? new Date(v.insurance_expiry).toLocaleDateString('es-AR') : '-'}
                      {insExpired && <span className="ml-1">⚠️</span>}
                    </td>
                    <td>
                      <span className={`badge ${CONDITION_CLS[v.vehicle_condition] || 'badge-neutral'}`}>
                        {v.vehicle_condition === 'operativo' ? 'Operativo' : v.vehicle_condition === 'con_observaciones' ? 'c/ Obs.' : 'F/S'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Truck size={48} className="mx-auto mb-3 opacity-20" />
          <p>No hay vehículos registrados.</p>
        </div>
      )}
    </div>
  );
};



/* ═══════════════════════ MAINTENANCE TAB ═══════════════════════ */

export const MaintenanceTab: React.FC<{
  logs: LogisticsMaintenanceLog[];
  loading: boolean;
  allVehicles: FuelVehicle[];
}> = ({ logs, loading, allVehicles }) => {
  const [showForm, setShowForm] = useState(false);
  const createLog = useCreateLogisticsMaintenanceLog();
  const { profile } = useAuth();

  const [form, setForm] = useState({
    vehicle_id: '', type: 'service' as LogisticsMaintenanceLog['type'], date: today(),
    km_hours: '', cost: '', provider: '', description: '', next_due_date: '', next_due_km: '',
  });

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.date) return;
    await createLog.mutateAsync({
      vehicle_id: form.vehicle_id,
      type: form.type,
      date: form.date,
      km_hours: form.km_hours ? Number(form.km_hours) : null,
      cost: form.cost ? Number(form.cost) : 0,
      provider: form.provider || null,
      description: form.description || null,
      next_due_date: form.next_due_date || null,
      next_due_km: form.next_due_km ? Number(form.next_due_km) : null,
      created_by: profile?.full_name || null,
    });
    setForm({ vehicle_id: '', type: 'service', date: today(), km_hours: '', cost: '', provider: '', description: '', next_due_date: '', next_due_km: '' });
    setShowForm(false);
  };

  // Upcoming events from vehicles
  const upcoming = useMemo(() => {
    const events: { type: string; vehicle: FuelVehicle; date: string; label: string }[] = [];
    allVehicles.forEach(v => {
      if (v.next_maintenance_date) events.push({ type: 'service', vehicle: v, date: v.next_maintenance_date, label: 'Service' });
      if (v.vtv_expiry) events.push({ type: 'vtv', vehicle: v, date: v.vtv_expiry, label: 'VTV' });
      if (v.insurance_expiry) events.push({ type: 'seguro', vehicle: v, date: v.insurance_expiry, label: 'Seguro' });
    });
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events.filter(e => {
      const d = new Date(e.date);
      const limit = new Date();
      limit.setDate(limit.getDate() + 60);
      return d <= limit;
    });
  }, [allVehicles]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Wrench className="text-ecar-blue" /> Mantenimiento</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2 px-4 py-2">
          <Plus size={16} /> Registrar Mantenimiento
        </button>
      </div>

      {/* Calendar: upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-3"><Calendar size={16} /> Próximos Vencimientos (60 días)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {upcoming.slice(0, 9).map((e, idx) => {
              const isOverdue = e.date <= today();
              return (
                <div key={idx} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-blue-100'}`}>
                  <div className="flex items-center gap-2">
                    <span>{VEHICLE_ICON[e.vehicle.vehicle_type] || '🚐'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.vehicle.code}</p>
                      <p className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>{e.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>{new Date(e.date).toLocaleDateString('es-AR')}</p>
                    {isOverdue && <p className="text-xs text-red-500">VENCIDO</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {upcoming.length > 9 && <p className="text-xs text-blue-600 mt-2">...y {upcoming.length - 9} más</p>}
        </div>
      )}

      {/* New Maintenance Form */}
      {showForm && (
        <div className="bg-slate-50 border border-ecar-blueLight rounded-xl p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-ecar-blueDark text-sm">Registrar Service / Mantenimiento</h4>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Vehículo / Máquina *</label>
              <select value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">— Seleccionar —</option>
                {allVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.code} - {v.description} {v.plate ? `(${v.plate})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {Object.entries(MAINT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Fecha *</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Km / Horas al momento</label>
              <input type="number" value={form.km_hours} onChange={e => setForm({ ...form, km_hours: e.target.value })} placeholder="Ej: 45000" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Costo ($)</label>
              <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Proveedor / Taller</label>
              <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="Nombre del taller" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-600 block mb-1">Descripción del trabajo</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalle de lo realizado" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Próximo vencimiento</label>
              <input type="date" value={form.next_due_date} onChange={e => setForm({ ...form, next_due_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={createLog.isPending} className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
              <Save size={16} /> {createLog.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* Maintenance History */}
      <div>
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2"><FileText size={14} /> Historial de Mantenimientos</h4>
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin"></div></div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Proveedor</th>
                  <th className="text-right">Costo</th>
                  <th>Km/Hrs</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="text-gray-500 text-xs">{new Date(l.date).toLocaleDateString('es-AR')}</td>
                    <td className="font-medium text-gray-800">{(l.vehicle as any)?.code || '-'} {(l.vehicle as any)?.plate ? <span className="text-gray-400">({(l.vehicle as any).plate})</span> : ''}</td>
                    <td>
                      <span className="badge badge-neutral">{MAINT_TYPE_LABEL[l.type] || l.type}</span>
                    </td>
                    <td className="text-gray-600 text-xs max-w-xs truncate">{l.description || '-'}</td>
                    <td className="text-gray-600 text-xs">{l.provider || '-'}</td>
                    <td className="text-right font-bold text-gray-700">{l.cost ? fmt(l.cost) : '-'}</td>
                    <td className="text-gray-500 text-xs">{l.km_hours?.toLocaleString() || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <Wrench size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay registros de mantenimiento.</p>
            <p className="text-xs mt-1">Registrá un service o reparación con el botón superior.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════ PROCESS DIAGRAMS TAB ═══════════════════════ */

const ProcessDiagramsTab: React.FC = () => {
  const [activeDiagram, setActiveDiagram] = useState<'pedidos' | 'flota' | 'panol'>('pedidos');

  return (
    <div className="space-y-6">
      {/* Header and Subtabs */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-ecar-blue/30 text-ecar-blueLight rounded-full text-xs font-semibold mb-2">
              <PackageCheck size={14} /> Guía Visual de Procesos
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Diagramas de Trabajo: Logística, Flota y Compras
            </h3>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Visualizá el recorrido extremo a extremo de los insumos, la maquinaria, las órdenes de compra y las entregas a obra.
            </p>
          </div>

          {/* Subtab Selector */}
          <div className="flex bg-slate-800 p-1.5 rounded-xl gap-1 border border-slate-700">
            <button
              onClick={() => setActiveDiagram('pedidos')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeDiagram === 'pedidos' ? 'bg-ecar-blue text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Package size={14} /> 1. Obra ➔ Pañol ➔ Compras
            </button>
            <button
              onClick={() => setActiveDiagram('flota')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeDiagram === 'flota' ? 'bg-ecar-blue text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Truck size={14} /> 2. Flota & Parte Diario
            </button>
            <button
              onClick={() => setActiveDiagram('panol')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeDiagram === 'panol' ? 'bg-ecar-blue text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wrench size={14} /> 3. Pañol & Herramientas
            </button>
          </div>
        </div>
      </div>

      {/* DIAGRAM 1: PEDIDOS OBRA -> LOGISTICA -> COMPRAS */}
      {activeDiagram === 'pedidos' && (
        <div className="space-y-6">
          <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 flex items-center gap-3 text-xs text-blue-900">
            <ShieldAlert size={20} className="text-ecar-blue shrink-0" />
            <div>
              <span className="font-bold">Regla de Negocio Core:</span> Todo pedido originado en Obra ingresa primero a Logística para ser cubierto con stock existente en Pañol. Solamente si el stock es insuficiente o es un ítem especial, se deriva automáticamente a Compras.
            </div>
          </div>

          {/* Process Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-ecar-blue font-bold flex items-center justify-center text-xs mb-3">
                  1
                </div>
                <h5 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Package size={16} className="text-ecar-blue" /> Solicitud en Obra
                </h5>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  El Capataz o Jefe de Obra carga la lista de insumos indicando la obra, fecha límite y nivel de urgencia.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-semibold text-gray-400">
                Rol: Responsable de Obra
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs mb-3">
                  2
                </div>
                <h5 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Warehouse size={16} className="text-indigo-600" /> Control en Pañol
                </h5>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Logística evalúa existencias en inventario y reserva los materiales físicamente disponibles.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-semibold text-gray-400">
                Rol: Pañolero / Logística
              </div>
            </div>

            {/* Step 3 (Decision) */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-gray-300 p-4 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs mb-3">
                  3
                </div>
                <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-slate-700" /> Evaluación de Stock
                </h5>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                    🟢 <strong>Hay Stock:</strong> Pasa a Despacho Directo.
                  </div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                    🔴 <strong>Sin Stock:</strong> Deriva a Compras.
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] font-semibold text-gray-500">
                Filtro Automático / Manual
              </div>
            </div>

            {/* Step 4A (If Stock) */}
            <div className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-4 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs mb-3">
                  4A
                </div>
                <h5 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                  <Truck size={16} className="text-emerald-600" /> Despacho a Obra
                </h5>
                <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                  Se genera la Hoja de Ruta, se asigna transporte y chofer. Al llegar a obra se firma la recepción y se descuenta stock.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] font-bold text-emerald-700">
                Camino Verde: Pañol
              </div>
            </div>

            {/* Step 4B (If No Stock) */}
            <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-4 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs mb-3">
                  4B
                </div>
                <h5 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <ShoppingCart size={16} className="text-amber-600" /> Circuito Compras
                </h5>
                <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                  Compras solicita cotizaciones a proveedores, aprueba la OC y coordina entrega directa o ingreso a pañol.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200/60 text-[11px] font-bold text-amber-700">
                Camino Naranja: Compras
              </div>
            </div>
          </div>

          {/* Extended Flowchart Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <FileText size={16} className="text-ecar-blue" /> Detalle Informativo de los Estados del Pedido
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px]">PENDIENTE</span>
                <p className="text-gray-600 mt-1">El pedido fue creado desde la obra y está a la espera de ser revisado por el equipo logístico.</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[10px]">EN TRÁNSITO</span>
                <p className="text-gray-600 mt-1">El pedido fue preparado en pañol y se encuentra viajando hacia la obra con chofer asignado.</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">ENTREGADO</span>
                <p className="text-gray-600 mt-1">El receptor en obra confirmó la llegada física con checklist y firma. Se actualizó el stock real.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIAGRAM 2: CICLO DE FLOTA Y PARTE DIARIO */}
      {activeDiagram === 'flota' && (
        <div className="space-y-6">
          <div className="border border-purple-100 bg-purple-50/50 rounded-xl p-4 flex items-center gap-3 text-xs text-purple-900">
            <Truck size={20} className="text-purple-600 shrink-0" />
            <div>
              <span className="font-bold">Circuito Integral de Flotas & Maquinaria:</span> Desde el escaneo del código QR en la cabina del vehículo hasta la actualización del Odómetro/Horómetro, alertas preventivas de Service/VTV y seguimiento por GPS.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: QR & Parte Diario */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h5 className="font-bold text-gray-800 text-sm">📱 Escaneo QR & Parte Diario</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                El chofer u operador escanea el código QR adherido al vehículo desde su teléfono móvil al iniciar o finalizar la jornada.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc pl-4">
                <td>Ingreso de Km o Horas de uso.</td>
                <td>Litros y monto de combustible cargado.</td>
                <td>Adjunto de comprobantes / fotos de estado.</td>
              </ul>
            </div>

            {/* Step 2: Impacto Automático */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h5 className="font-bold text-gray-800 text-sm">⚡ Actualización de Perfil</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                El kilometraje cargado impacta de inmediato en la ficha técnica unificada del vehículo, recalculando los remanentes para el próximo mantenimiento.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc pl-4">
                <td>Actualización de odómetro real.</td>
                <td>Cálculo de costo/km de combustible.</td>
              </ul>
            </div>

            {/* Step 3: Evaluación de Estado */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h5 className="font-bold text-gray-800 text-sm">🛠️ Mantenimiento & Tickets</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Si el reporte indica una falla o faltan menos de 15 días para el service/VTV:
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-1.5 bg-yellow-50 text-yellow-800 rounded font-medium border border-yellow-200">
                  🟡 <strong>Daño Leve:</strong> Crea Ticket "Con Observaciones" (sigue operativo).
                </div>
                <div className="p-1.5 bg-red-50 text-red-800 rounded font-medium border border-red-200">
                  🔴 <strong>Falla Crítica:</strong> Pasa a "Fuera de Servicio".
                </div>
              </div>
            </div>

            {/* Step 4: Tracking & Salida Taller */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h5 className="font-bold text-gray-800 text-sm">📡 Tracking GPS & Alta</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Logística visualiza en el Mapa en Vivo las unidades activas y coordinan el turno en taller. Tras el service, el vehículo retorna a estado Operativo.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc pl-4">
                <td>Verificación en mapa GPS en vivo.</td>
                <td>Cierre del ticket de taller con costo real.</td>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DIAGRAM 3: GESTION DE PAÑOL Y HERRAMIENTAS */}
      {activeDiagram === 'panol' && (
        <div className="space-y-6">
          <div className="border border-emerald-100 bg-emerald-50/50 rounded-xl p-4 flex items-center gap-3 text-xs text-emerald-900">
            <Wrench size={20} className="text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Control Físico del Pañol:</span> Evitamos extravíos de herramientas de alto valor mediante firmas de asignación a operarios y control por posiciones de estantería.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-xs">
                PASO 1
              </div>
              <h5 className="font-bold text-gray-800 text-sm">🏷️ Registro y Ubicación Física</h5>
              <p className="text-xs text-gray-500 leading-relaxed">
                Cada herramienta (amoladora, rotomartillo, nivel) o material posee una ubicación codificada en estantería (ej: <code>E1-N3-C2</code>) y unidad de medida estandarizada.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-xs">
                PASO 2
              </div>
              <h5 className="font-bold text-gray-800 text-sm">✍️ Asignación a Operario (Checkout)</h5>
              <p className="text-xs text-gray-500 leading-relaxed">
                Al retirar una herramienta, el pañolero genera la asignación a nombre del trabajador indicando la fecha estimada de devolución y la obra asociada.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-xs">
                PASO 3
              </div>
              <h5 className="font-bold text-gray-800 text-sm">🔄 Retorno & Control de Estado (Checkin)</h5>
              <p className="text-xs text-gray-500 leading-relaxed">
                Al devolver el equipo, se revisa la condición funcional. Si está en óptimas condiciones, reingresa al pañol; si presenta roturas, se envía a reparación.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

