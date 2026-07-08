import React, { useState, useMemo } from 'react';
import {
  Warehouse, Truck, Repeat, Wrench, Plus, ChevronDown, ChevronUp, Package, Clock,
  ShieldAlert, AlertTriangle, ArrowRight, X, Save, Calendar, MapPin,
  CheckCircle2, PackageCheck, FileText, TrendingUp, Search
} from 'lucide-react';
import {
  useAllFuelVehicles, useInventoryItems, useToolAssignments, useProjects,
  useLogisticsDeliveries, useCreateLogisticsDelivery, useUpdateLogisticsDelivery,
  useLogisticsMaintenanceLog, useCreateLogisticsMaintenanceLog
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import type { FuelVehicle, LogisticsDelivery, LogisticsMaintenanceLog } from '../lib/types';

type Tab = 'dashboard' | 'deliveries' | 'fleet' | 'stock' | 'maintenance';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  en_transito: { label: 'En Tránsito', cls: 'bg-blue-100 text-blue-700' },
  entregado: { label: 'Entregado', cls: 'bg-emerald-100 text-emerald-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-500' },
};

const MAINT_TYPE_LABEL: Record<string, string> = {
  service: 'Service', vtv: 'VTV', seguro: 'Seguro', reparacion: 'Reparación',
  neumaticos: 'Neumáticos', otro: 'Otro',
};

const VEHICLE_ICON: Record<string, string> = {
  camion: '🚛', camioneta: '🛻', auto: '🚗', maquinaria: '🏗️', moto: '🏍️', otro: '🚐',
};

const CONDITION_CLS: Record<string, string> = {
  operativo: 'bg-emerald-100 text-emerald-700',
  con_observaciones: 'bg-amber-100 text-amber-700',
  fuera_de_servicio: 'bg-red-100 text-red-700',
};

export const LogisticsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showIntro, setShowIntro] = useState(false);

  // Data from existing tables
  const { data: allVehicles = [], isLoading: loadingVehicles } = useAllFuelVehicles();
  const { data: inventoryItems = [], isLoading: loadingInventory } = useInventoryItems();
  const { data: toolAssignments = [] } = useToolAssignments();
  const { data: projects = [] } = useProjects();

  // Logistics-own tables
  const { data: deliveries = [], isLoading: loadingDeliveries } = useLogisticsDeliveries();
  const { data: maintenanceLogs = [], isLoading: loadingMaintenance } = useLogisticsMaintenanceLog();

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
    { id: 'deliveries', icon: Repeat, label: 'Acopios & Entregas' },
    { id: 'fleet', icon: Truck, label: 'Flota & Máquinas' },
    { id: 'stock', icon: Package, label: 'Pañol & Stock' },
    { id: 'maintenance', icon: Wrench, label: 'Mantenimiento' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-xl p-4 md:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10">
          <Warehouse size={80} className="md:w-[120px] md:h-[120px]" />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-xl md:text-2xl flex items-center gap-2">
            <Warehouse size={24} className="md:w-7 md:h-7" /> Gerencia de Logística
          </h3>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl">
            Aseguramos que cada obra cuente con los recursos físicos necesarios en tiempo y forma.
            Administramos inventarios, pañol, herramientas y la flota para evitar interrupciones operativas.
          </p>
        </div>
      </div>

      {/* Intro Accordion */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowIntro(!showIntro)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
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
          <div className="p-4 md:p-6 border-t border-gray-100 bg-white grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <h5 className="font-bold text-teal-700 text-sm flex items-center gap-2"><Package size={16} /> 1. Depósito & Stock</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Logística debe conocer exactamente qué tenemos, dónde está y su estado.
                Definimos <span className="font-semibold text-gray-800">Alertas de Reposición</span> antes de que el material se agote.
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-teal-700 text-sm flex items-center gap-2"><Repeat size={16} /> 2. Despachos</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cada salida tiene un responsable y una fecha de devolución.
                La trazabilidad previene pérdidas económicas.
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-teal-700 text-sm flex items-center gap-2"><Truck size={16} /> 3. Flota</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Control de horas y km nos permite anticipar mantenimientos preventivos, services y VTV.
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-teal-700 text-sm flex items-center gap-2"><MapPin size={16} /> 4. Entregas a Obra</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Programamos qué materiales y herramientas van a cada obra, con qué vehículo y quién es el responsable.
              </p>
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
            className={`pb-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
        {activeTab === 'dashboard' && (
          <DashboardTab kpis={kpis} deliveries={deliveries} allVehicles={allVehicles} inventoryItems={inventoryItems} maintenanceLogs={maintenanceLogs} />
        )}
        {activeTab === 'deliveries' && (
          <DeliveriesTab deliveries={deliveries} loading={loadingDeliveries} projects={projects} allVehicles={allVehicles} />
        )}
        {activeTab === 'fleet' && (
          <FleetTab vehicles={allVehicles} loading={loadingVehicles} />
        )}
        {activeTab === 'stock' && (
          <StockTab items={inventoryItems} loading={loadingInventory} toolAssignments={toolAssignments} />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceTab logs={maintenanceLogs} loading={loadingMaintenance} allVehicles={allVehicles} />
        )}
      </div>
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
        <TrendingUp className="text-teal-600" /> Panel de Control Logístico
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
          gradient="from-violet-50 to-violet-100" border="border-violet-200" text="text-violet-700" valueText="text-violet-800" subtitleText="text-violet-600"
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
}> = ({ deliveries, loading, projects, allVehicles }) => {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const createDelivery = useCreateLogisticsDelivery();
  const updateDelivery = useUpdateLogisticsDelivery();
  const { profile } = useAuth();

  const [form, setForm] = useState({
    project_id: '', vehicle_id: '', delivery_date: today(), driver_name: '', destination: '', notes: '',
    items: [{ description: '', quantity: 1, unit: 'u' }] as { description: string; quantity: number; unit: string }[],
  });

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

  const handleSubmit = async () => {
    if (!form.delivery_date || form.items.filter(i => i.description.trim()).length === 0) return;
    await createDelivery.mutateAsync({
      project_id: form.project_id || null,
      vehicle_id: form.vehicle_id || null,
      delivery_date: form.delivery_date,
      driver_name: form.driver_name || null,
      destination: form.destination || null,
      notes: form.notes || null,
      created_by: profile?.full_name || null,
      items: form.items.filter(i => i.description.trim()).map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
      })),
    } as any);
    setForm({ project_id: '', vehicle_id: '', delivery_date: today(), driver_name: '', destination: '', notes: '', items: [{ description: '', quantity: 1, unit: 'u' }] });
    setShowForm(false);
  };

  const changeStatus = async (id: string, status: string) => {
    await updateDelivery.mutateAsync({ id, status } as any);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Repeat className="text-teal-600" /> Acopios & Entregas a Obra</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-2 border rounded-lg text-sm w-40"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg text-sm px-3 py-2">
            <option value="all">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_transito">En Tránsito</option>
            <option value="entregado">Entregados</option>
            <option value="cancelado">Cancelados</option>
          </select>
          <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <Plus size={16} /> Nueva Entrega
          </button>
        </div>
      </div>

      {/* New Delivery Form */}
      {showForm && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 md:p-6 mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-teal-800 text-sm">Programar Entrega a Obra</h4>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Obra destino</label>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">— Seleccionar obra —</option>
                {projects.filter((p: any) => p.status === 'active').map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Fecha de entrega</label>
              <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Chofer / Responsable</label>
              <input value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} placeholder="Nombre del chofer" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Vehículo</label>
              <select value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">— Seleccionar vehículo —</option>
                {allVehicles.filter(v => v.status === 'active').map(v => (
                  <option key={v.id} value={v.id}>{v.code} - {v.description} {v.plate ? `(${v.plate})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Destino (si no es obra)</label>
              <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Ej: Depósito zona norte" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Notas</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-2">Materiales / Herramientas a enviar</label>
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  value={item.description}
                  onChange={e => { const items = [...form.items]; items[idx].description = e.target.value; setForm({ ...form, items }); }}
                  placeholder="Descripción del ítem"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={e => { const items = [...form.items]; items[idx].quantity = Number(e.target.value); setForm({ ...form, items }); }}
                  className="w-20 border rounded-lg px-3 py-2 text-sm text-center"
                  min={1}
                />
                <input
                  value={item.unit}
                  onChange={e => { const items = [...form.items]; items[idx].unit = e.target.value; setForm({ ...form, items }); }}
                  className="w-16 border rounded-lg px-3 py-2 text-sm text-center"
                  placeholder="u"
                />
                {form.items.length > 1 && (
                  <button onClick={() => { const items = form.items.filter((_, i) => i !== idx); setForm({ ...form, items }); }} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit: 'u' }] })} className="text-teal-600 text-xs font-bold hover:underline flex items-center gap-1 mt-1">
              <Plus size={14} /> Agregar ítem
            </button>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={createDelivery.isPending} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
              <Save size={16} /> {createDelivery.isPending ? 'Guardando...' : 'Programar Entrega'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold">Fecha</th>
                <th className="px-4 py-3 font-bold">Obra / Destino</th>
                <th className="px-4 py-3 font-bold">Vehículo</th>
                <th className="px-4 py-3 font-bold">Chofer</th>
                <th className="px-4 py-3 font-bold text-center">Ítems</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.delivery_date).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{(d.project as any)?.name || d.destination || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{(d.vehicle as any)?.code ? `${(d.vehicle as any).code} ${(d.vehicle as any).plate ? `(${(d.vehicle as any).plate})` : ''}` : '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{d.driver_name || '-'}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{(d.items || []).length}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[d.status]?.cls}`}>
                      {STATUS_BADGE[d.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {d.status === 'pendiente' && (
                        <button onClick={() => changeStatus(d.id, 'en_transito')} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Marcar en tránsito">
                          <ArrowRight size={16} />
                        </button>
                      )}
                      {d.status === 'en_transito' && (
                        <button onClick={() => changeStatus(d.id, 'entregado')} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="Marcar entregado">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {(d.status === 'pendiente' || d.status === 'en_transito') && (
                        <button onClick={() => changeStatus(d.id, 'cancelado')} className="text-red-400 hover:bg-red-50 p-1 rounded" title="Cancelar">
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
    </div>
  );
};

/* ═══════════════════════ FLEET TAB ═══════════════════════ */

const FleetTab: React.FC<{ vehicles: FuelVehicle[]; loading: boolean }> = ({ vehicles, loading }) => {
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
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Truck className="text-teal-600" /> Flota y Maquinaria</h3>
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
        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold">Vehículo</th>
                <th className="px-4 py-3 font-bold">Patente</th>
                <th className="px-4 py-3 font-bold text-center">Km Actual</th>
                <th className="px-4 py-3 font-bold">Próx. Mant.</th>
                <th className="px-4 py-3 font-bold">VTV</th>
                <th className="px-4 py-3 font-bold">Seguro</th>
                <th className="px-4 py-3 font-bold">Condición</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => {
                const vtvExpired = v.vtv_expiry && v.vtv_expiry <= today();
                const insExpired = v.insurance_expiry && v.insurance_expiry <= today();
                const maintSoon = v.next_maintenance_date && v.next_maintenance_date <= today();
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 flex items-center gap-2">
                      <span>{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span> {v.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{v.description} {v.brand ? <span className="text-gray-400 font-normal ml-1">({v.brand})</span> : null}</td>
                    <td className="px-4 py-3 text-gray-600">{v.plate || '-'}</td>
                    <td className="px-4 py-3 text-center font-bold">{v.current_km?.toLocaleString() || '-'}</td>
                    <td className={`px-4 py-3 text-xs ${maintSoon ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      {v.next_maintenance_date ? new Date(v.next_maintenance_date).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className={`px-4 py-3 text-xs ${vtvExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      {v.vtv_expiry ? new Date(v.vtv_expiry).toLocaleDateString('es-AR') : '-'}
                      {vtvExpired && <span className="ml-1">⚠️</span>}
                    </td>
                    <td className={`px-4 py-3 text-xs ${insExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      {v.insurance_expiry ? new Date(v.insurance_expiry).toLocaleDateString('es-AR') : '-'}
                      {insExpired && <span className="ml-1">⚠️</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${CONDITION_CLS[v.vehicle_condition] || 'bg-gray-100 text-gray-500'}`}>
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

/* ═══════════════════════ STOCK TAB ═══════════════════════ */

const StockTab: React.FC<{ items: any[]; loading: boolean; toolAssignments: any[] }> = ({ items, loading, toolAssignments }) => {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);

  const filtered = useMemo(() => {
    let list = items || [];
    if (filterCat !== 'all') list = list.filter(i => i.category === filterCat);
    if (showOnlyCritical) list = list.filter(i => i.current_stock <= i.min_stock);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(s) || (i.location || '').toLowerCase().includes(s));
    }
    return list;
  }, [items, filterCat, showOnlyCritical, search]);

  const overdueTools = (toolAssignments || []).filter((t: any) => t.status === 'assigned' && !t.returned_date);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Package className="text-teal-600" /> Pañol & Stock</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 pr-3 py-2 border rounded-lg text-sm w-40" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border rounded-lg text-sm px-3 py-2">
            <option value="all">Todas las categorías</option>
            <option value="material">Material</option>
            <option value="herramienta">Herramienta</option>
            <option value="consumible">Consumible</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showOnlyCritical} onChange={e => setShowOnlyCritical(e.target.checked)} className="rounded" />
            Solo críticos
          </label>
        </div>
      </div>

      {/* Overdue tools alert */}
      {overdueTools.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-2"><Clock size={16} /> {overdueTools.length} Herramienta{overdueTools.length > 1 ? 's' : ''} sin devolver</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {overdueTools.slice(0, 6).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.item?.name || 'Herramienta'}</p>
                  <p className="text-xs text-gray-500">{t.employee?.full_name || '-'} · {t.project?.name || '-'}</p>
                </div>
                <p className="text-xs text-amber-600 font-bold">{new Date(t.assigned_date).toLocaleDateString('es-AR')}</p>
              </div>
            ))}
          </div>
          {overdueTools.length > 6 && <p className="text-xs text-amber-600 mt-2">...y {overdueTools.length - 6} más</p>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold">Ítem</th>
                <th className="px-4 py-3 font-bold">Categoría</th>
                <th className="px-4 py-3 font-bold">Ubicación</th>
                <th className="px-4 py-3 font-bold text-center">Stock</th>
                <th className="px-4 py-3 font-bold text-center">Mínimo</th>
                <th className="px-4 py-3 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((i: any) => {
                const isCritical = i.current_stock <= i.min_stock;
                return (
                  <tr key={i.id} className={`hover:bg-gray-50 ${isCritical ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs capitalize">{i.category}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{i.location || '-'}</td>
                    <td className={`px-4 py-3 text-center font-bold ${isCritical ? 'text-red-700' : 'text-gray-700'}`}>{i.current_stock} {i.unit}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{i.min_stock} {i.unit}</td>
                    <td className="px-4 py-3">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold"><AlertTriangle size={12} /> Crítico</span>
                      ) : (
                        <span className="inline-flex items-center bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-20" />
          <p>No hay ítems de inventario{showOnlyCritical ? ' en estado crítico' : ''}.</p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════ MAINTENANCE TAB ═══════════════════════ */

const MaintenanceTab: React.FC<{
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
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Wrench className="text-teal-600" /> Mantenimiento</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
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
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-teal-800 text-sm">Registrar Service / Mantenimiento</h4>
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
            <button onClick={handleSubmit} disabled={createLog.isPending} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
              <Save size={16} /> {createLog.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* Maintenance History */}
      <div>
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2"><FileText size={14} /> Historial de Mantenimientos</h4>
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">Fecha</th>
                  <th className="px-4 py-3 font-bold">Vehículo</th>
                  <th className="px-4 py-3 font-bold">Tipo</th>
                  <th className="px-4 py-3 font-bold">Descripción</th>
                  <th className="px-4 py-3 font-bold">Proveedor</th>
                  <th className="px-4 py-3 font-bold text-right">Costo</th>
                  <th className="px-4 py-3 font-bold">Km/Hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.date).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{(l.vehicle as any)?.code || '-'} {(l.vehicle as any)?.plate ? <span className="text-gray-400">({(l.vehicle as any).plate})</span> : ''}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{MAINT_TYPE_LABEL[l.type] || l.type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{l.description || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{l.provider || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-700">{l.cost ? fmt(l.cost) : '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{l.km_hours?.toLocaleString() || '-'}</td>
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
