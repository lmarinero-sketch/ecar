import React, { useState, useMemo } from 'react';
import {
  Truck, Plus, Package, ShieldAlert,
  PackageCheck, FileText, Search, Wrench,
  Warehouse, TrendingUp, ShoppingCart
} from 'lucide-react';
import {
  useAllFuelVehicles, useProjects,
  useLogisticsDeliveries, useCreateLogisticsDelivery, useUpdateLogisticsDelivery,
  useEmployees
} from '../hooks/useData';
import { exportDispatchPdf } from '../lib/orderPdfExport';
import type { FuelVehicle, LogisticsDelivery } from '../lib/types';
import { useModalStore } from '../store/useModalStore';

type Tab = 'deliveries' | 'diagrams';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'badge-warning' },
  pendiente_autorizacion: { label: 'En Preparación', cls: 'bg-orange-100 text-orange-800' },
  aprobado: { label: 'Programado', cls: 'bg-purple-100 text-purple-800' },
  en_transito: { label: 'En Tránsito', cls: 'badge-info' },
  entregado: { label: 'Entregado en Obra', cls: 'badge-success' },
  cancelado: { label: 'Cancelado', cls: 'badge-neutral' },
  rechazado: { label: 'Rechazado', cls: 'bg-red-100 text-red-800' },
};

export const LogisticsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('deliveries');

  // Data from existing tables
  const { data: allVehicles = [] } = useAllFuelVehicles();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();

  // Logistics-own tables
  const { data: deliveries = [], isLoading: loadingDeliveries } = useLogisticsDeliveries();

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'deliveries', icon: Truck, label: 'Despachos y Entregas' },
    { id: 'diagrams', icon: FileText, label: 'Diagramas de Proceso' },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blueDark rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Truck size={160} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-sky-300 border border-white/20">
            <span>🚚</span> Gerencia de Logística · Despachos Físicos
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Despachos y Entregas a Obra
          </h1>
          <p className="text-gray-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            Gestión de traslados físicos desde Pañol Central a frentes de trabajo. Emisión de remitos oficiales REM-xxxx, asignación de chofer/vehículo y confirmación de recepción en destino.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 md:gap-6 px-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-ecar-blue text-ecar-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'deliveries' && (
          <DeliveriesTab deliveries={deliveries} loading={loadingDeliveries} projects={projects} allVehicles={allVehicles} employees={employees} />
        )}
        {activeTab === 'diagrams' && (
          <ProcessDiagramsTab />
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════ DELIVERIES TAB ═══════════════════════ */

export const DeliveriesTab: React.FC<{
  deliveries: LogisticsDelivery[];
  loading: boolean;
  projects: any[];
  allVehicles: FuelVehicle[];
  employees: any[];
  filterProjectId?: string;
}> = ({ deliveries, loading, projects, allVehicles, employees, filterProjectId }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const updateDelivery = useUpdateLogisticsDelivery();
  const createDelivery = useCreateLogisticsDelivery();

  const [receivingDelivery, setReceivingDelivery] = useState<any>(null);
  const [checklistValues, setChecklistValues] = useState<Record<string, { received: number; accepted: number; rejected: number; reason: string }>>({});

  // New Dispatch Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    project_id: filterProjectId || '',
    destination: '',
    delivery_date: new Date().toISOString().slice(0, 10),
    driver_name: '',
    vehicle_id: '',
    notes: '',
  });
  const [dispatchItems, setDispatchItems] = useState<Array<{ description: string; quantity: number; unit: string }>>([
    { description: '', quantity: 1, unit: 'un' },
  ]);

  const filtered = useMemo(() => {
    let list = deliveries;
    if (filterProjectId) list = list.filter(d => d.project_id === filterProjectId);
    if (filterStatus !== 'all') list = list.filter(d => d.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(d =>
        (d.destination || '').toLowerCase().includes(s) ||
        (d.driver_name || '').toLowerCase().includes(s) ||
        ((d.project as any)?.name || '').toLowerCase().includes(s) ||
        (d.dispatch_number || '').toLowerCase().includes(s) ||
        (d.remito_number || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [deliveries, filterProjectId, filterStatus, search]);

  const handleConfirmDeparture = async (d: LogisticsDelivery) => {
    const dispatchNo = d.dispatch_number || `DES-${d.id.slice(0, 6).toUpperCase()}`;
    const remitoNo = d.remito_number || `REM-${d.id.slice(0, 6).toUpperCase()}`;
    await updateDelivery.mutateAsync({
      id: d.id,
      status: 'en_transito',
      dispatch_number: dispatchNo,
      remito_number: remitoNo,
      departure_confirmed_at: new Date().toISOString(),
    } as any);
    useModalStore.getState().showAlert('Salida Confirmada', `Despacho ${dispatchNo} confirmado. Remito ${remitoNo} en tránsito a obra.`);
  };

  const handleReceiveDelivery = async () => {
    if (!receivingDelivery || updateDelivery.isPending) return;

    let hasDifferences = false;
    const diffNotes: string[] = [];

    for (const dItem of receivingDelivery.items || []) {
      const vals = checklistValues[dItem.id] || { received: dItem.quantity, accepted: dItem.quantity, rejected: 0, reason: '' };
      if (vals.rejected > 0 || vals.accepted < dItem.quantity) {
        hasDifferences = true;
        diffNotes.push(`${dItem.description}: Aceptados ${vals.accepted}/${dItem.quantity}${vals.rejected > 0 ? ` (Rechazados: ${vals.rejected} - ${vals.reason || 'S/M'})` : ''}`);
      }
    }

    const noteAddition = hasDifferences ? ` [Recepción con diferencias: ${diffNotes.join('; ')}]` : ' [Recepción conforme 100%]';
    await updateDelivery.mutateAsync({
      id: receivingDelivery.id,
      status: 'entregado',
      notes: (receivingDelivery.notes || '') + noteAddition,
    } as any);

    setReceivingDelivery(null);
    setChecklistValues({});
    useModalStore.getState().showAlert('Recepción Confirmada', hasDifferences ? 'Recepción registrada con diferencias asentadas en el acta.' : 'Recepción registrada conforme.');
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = dispatchItems.filter(i => i.description.trim() && i.quantity > 0);
    if (!validItems.length) {
      alert('Debés agregar al menos un ítem al despacho.');
      return;
    }

    const rnd = Math.random().toString(36).substring(2, 7).toUpperCase();
    await createDelivery.mutateAsync({
      project_id: newForm.project_id || null,
      destination: newForm.destination || null,
      delivery_date: newForm.delivery_date,
      driver_name: newForm.driver_name || null,
      vehicle_id: newForm.vehicle_id || null,
      notes: newForm.notes || null,
      dispatch_number: `DES-${rnd}`,
      remito_number: `REM-${rnd}`,
      status: 'pendiente',
      items: validItems,
    } as any);

    setShowNewModal(false);
    setNewForm({
      project_id: '',
      destination: '',
      delivery_date: new Date().toISOString().slice(0, 10),
      driver_name: '',
      vehicle_id: '',
      notes: '',
    });
    setDispatchItems([{ description: '', quantity: 1, unit: 'un' }]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Truck className="text-ecar-blue" /> Despachos y Entregas a Obra
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Control de salidas físicas, choferes, remitos oficiales y confirmación de recepción en destino.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar remito, obra, chofer..."
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-56 outline-none focus:ring-2 focus:ring-ecar-blue/20"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl text-sm px-3 py-2 outline-none font-medium">
            <option value="all">Todos los estados</option>
            <option value="en_transito">🚚 En Tránsito / En Camino</option>
            <option value="pendiente">🔵 Pendientes / En Preparación</option>
            <option value="entregado">✅ Entregados en Obra</option>
            <option value="cancelado">❌ Cancelados</option>
          </select>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary bg-ecar-blue hover:bg-ecar-blueDark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Programar Despacho
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin"></div></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Código / Remito</th>
                <th>Fecha Salida</th>
                <th>Obra / Destino</th>
                <th>Vehículo</th>
                <th>Chofer</th>
                <th className="text-center">Ítems</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const remitoCode = d.remito_number || `REM-${d.id.slice(0, 6).toUpperCase()}`;
                const dispatchCode = d.dispatch_number || `DES-${d.id.slice(0, 6).toUpperCase()}`;

                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td>
                      <div className="font-mono font-bold text-gray-800">{remitoCode}</div>
                      <span className="text-[10px] text-gray-400 font-mono">{dispatchCode}</span>
                    </td>
                    <td className="text-gray-500 font-medium">{new Date(d.delivery_date).toLocaleDateString('es-AR')}</td>
                    <td className="font-bold text-gray-800">{(d.project as any)?.name || d.destination || 'Obra'}</td>
                    <td className="text-gray-600">{(d.vehicle as any)?.code ? `${(d.vehicle as any).code}` : 'Flete ext.'}</td>
                    <td className="text-gray-700">{d.driver_name || 'Sin asignar'}</td>
                    <td className="text-center font-bold text-gray-700">{(d.items || []).length}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[d.status]?.cls}`}>
                        {STATUS_BADGE[d.status]?.label}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Confirmar salida */}
                        {(d.status === 'pendiente' || d.status === 'pendiente_autorizacion' || d.status === 'aprobado') && (
                          <button
                            onClick={() => handleConfirmDeparture(d)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                            title="Confirmar salida física del depósito (descuenta inventario y emite remito)"
                          >
                            <Truck size={13} /> Confirmar Salida
                          </button>
                        )}

                        {/* Recepcionar en obra */}
                        {d.status === 'en_transito' && (
                          <button
                            onClick={() => {
                              const initialChecklist: Record<string, { received: number; accepted: number; rejected: number; reason: string }> = {};
                              d.items?.forEach((i: any) => {
                                initialChecklist[i.id] = { received: i.quantity, accepted: i.quantity, rejected: 0, reason: '' };
                              });
                              setChecklistValues(initialChecklist);
                              setReceivingDelivery(d);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                            title="Registrar recepción en obra"
                          >
                            <PackageCheck size={13} /> Recepcionar
                          </button>
                        )}

                        {/* PDF Remito */}
                        <button
                          onClick={() => exportDispatchPdf(d as any)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                          title="Descargar Remito PDF"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 space-y-3">
          <Truck size={48} className="mx-auto opacity-20 text-ecar-blue" />
          <p className="font-bold text-gray-700 text-sm">No hay entregas registradas</p>
          <p className="text-xs text-gray-500">Programá una nueva entrega a obra usando el botón superior.</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary bg-ecar-blue hover:bg-ecar-blueDark text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus size={15} /> Programar Despacho
          </button>
        </div>
      )}

      {/* Modal Programar Despacho */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Truck size={18} className="text-ecar-blue" /> Programar Nuevo Despacho a Obra
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Obra / Destino *</label>
                <select
                  required
                  value={newForm.project_id}
                  onChange={e => setNewForm({ ...newForm, project_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">Seleccioná una obra...</option>
                  {(projects || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fecha Prevista *</label>
                  <input
                    type="date"
                    required
                    value={newForm.delivery_date}
                    onChange={e => setNewForm({ ...newForm, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Chofer / Responsable</label>
                  <select
                    value={newForm.driver_name}
                    onChange={e => setNewForm({ ...newForm, driver_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="">— Sin chofer asignado —</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehículo de Flota</label>
                <select
                  value={newForm.vehicle_id}
                  onChange={e => setNewForm({ ...newForm, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">— Flete externo / Retiro personal —</option>
                  {allVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.code} - {v.description} ({v.plate || 'S/P'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items a transportar */}
              <div className="space-y-2 border-t pt-3">
                <label className="font-bold text-gray-800 block">Artículos a Despachar</label>
                {dispatchItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      required
                      value={item.description}
                      onChange={e => {
                        const updated = [...dispatchItems];
                        updated[idx].description = e.target.value;
                        setDispatchItems(updated);
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-lg"
                      placeholder="Descripción del material..."
                    />
                    <input
                      type="number"
                      required
                      value={item.quantity}
                      onChange={e => {
                        const updated = [...dispatchItems];
                        updated[idx].quantity = Number(e.target.value);
                        setDispatchItems(updated);
                      }}
                      className="w-16 px-2 py-1.5 border rounded-lg text-center font-mono"
                    />
                    <input
                      value={item.unit}
                      onChange={e => {
                        const updated = [...dispatchItems];
                        updated[idx].unit = e.target.value;
                        setDispatchItems(updated);
                      }}
                      className="w-16 px-2 py-1.5 border rounded-lg text-center"
                    />
                    {dispatchItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDispatchItems(dispatchItems.filter((_, i) => i !== idx))}
                        className="text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDispatchItems([...dispatchItems, { description: '', quantity: 1, unit: 'un' }])}
                  className="text-ecar-blue font-bold hover:underline text-xs"
                >
                  + Agregar otro artículo
                </button>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createDelivery.isPending}
                  className="btn-primary bg-ecar-blue hover:bg-ecar-blueDark text-white px-4 py-2 rounded-xl font-bold shadow-sm"
                >
                  {createDelivery.isPending ? 'Guardando...' : 'Programar Despacho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Checklist de Recepción */}
      {receivingDelivery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-base flex items-center gap-2">
                <PackageCheck size={18} /> Recepción de Materiales en Obra
              </h2>
              <button onClick={() => setReceivingDelivery(null)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors font-bold">✕</button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-100 leading-relaxed">
                Confirmación de recepción en <strong>{(receivingDelivery.project as any)?.name || receivingDelivery.destination || 'Obra'}</strong>.
                <br /><span className="text-[11px] text-emerald-700 italic">Nota: La recepción registra lo llegado a obra. No vuelve a descontar el stock de Pañol Central.</span>
              </div>

              <div className="space-y-3">
                {(receivingDelivery.items || []).map((it: any) => {
                  const state = checklistValues[it.id] || { received: it.quantity, accepted: it.quantity, rejected: 0, reason: '' };

                  return (
                    <div key={it.id} className="p-3 border rounded-xl bg-slate-50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 text-sm">{it.description}</span>
                        <span className="text-gray-500 font-mono">Enviado: {it.quantity} {it.unit}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cant. Aceptada Conforme</label>
                          <input
                            type="number"
                            min="0"
                            max={it.quantity}
                            value={state.accepted}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setChecklistValues(prev => ({
                                ...prev,
                                [it.id]: { ...state, accepted: val, rejected: Math.max(0, it.quantity - val) }
                              }));
                            }}
                            className="w-full px-2 py-1.5 border rounded-lg bg-white font-mono text-center font-bold text-emerald-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cant. Rechazada / Faltante</label>
                          <input
                            type="number"
                            min="0"
                            value={state.rejected}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setChecklistValues(prev => ({
                                ...prev,
                                [it.id]: { ...state, rejected: val, accepted: Math.max(0, it.quantity - val) }
                              }));
                            }}
                            className="w-full px-2 py-1.5 border rounded-lg bg-white font-mono text-center font-bold text-red-800"
                          />
                        </div>
                      </div>
                      {state.rejected > 0 && (
                        <div>
                          <input
                            value={state.reason}
                            onChange={e => {
                              setChecklistValues(prev => ({
                                ...prev,
                                [it.id]: { ...state, reason: e.target.value }
                              }));
                            }}
                            placeholder="Motivo del rechazo / daño de material..."
                            className="w-full px-2 py-1 border border-red-300 rounded-lg bg-red-50 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setReceivingDelivery(null)} className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-slate-100">
                Cancelar
              </button>
              <button
                onClick={handleReceiveDelivery}
                disabled={updateDelivery.isPending}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold shadow-sm"
              >
                {updateDelivery.isPending ? 'Confirmando...' : 'Confirmar Recepción en Obra'}
              </button>
            </div>
          </div>
        </div>
      )}
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

