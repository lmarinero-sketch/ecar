import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck, Wrench, Fuel, ArrowLeft, Plus, X, Save, AlertTriangle,
  Gauge, Shield, FileText, CheckCircle2, Clock, Bell, Edit2, ClipboardCheck, Trash2, Navigation
} from 'lucide-react';
import { useImplementationStore } from '../store/useImplementationStore';
import { FuelModule } from './FuelModule';
import { VehicleDailyReportModule } from './VehicleDailyReportModule';
import { useFuelVehicles, useUpdateFuelVehicle, useCreateFuelVehicle, useDeleteFuelVehicle } from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';
import type { FuelVehicle } from '../lib/types';
import { FleetTrackingMap } from './tracking/FleetTrackingMap';

type FleetView = 'overview' | 'fuel' | 'maintenance' | 'daily_report' | 'tracking';

const CONDITION_BADGE: Record<string, { icon: string; cls: string }> = {
  operativo: { icon: '🟢', cls: 'bg-green-100 text-green-700' },
  con_observaciones: { icon: '🟡', cls: 'bg-yellow-100 text-yellow-700' },
  fuera_de_servicio: { icon: '🔴', cls: 'bg-red-100 text-red-700' },
};

const VEHICLE_ICON: Record<string, string> = {
  camion: '🚛', camioneta: '🛻', auto: '🚗', maquinaria: '🏗️', moto: '🏍️', otro: '🚐',
};

const today = () => new Date().toISOString().slice(0, 10);

const isDueOrOverdue = (dateStr: string | null) => {
  if (!dateStr) return false;
  return dateStr <= today();
};

const isDueSoon = (dateStr: string | null, days = 7) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return d <= limit && d >= new Date(today());
};

export const FleetModule: React.FC = () => {
  const [view, setView] = useState<FleetView>('overview');
  const { data: vehicles = [], isLoading } = useFuelVehicles();
  const updateVehicle = useUpdateFuelVehicle();
  const createVehicle = useCreateFuelVehicle();
  const deleteVehicle = useDeleteFuelVehicle();

  useEffect(() => {
    useImplementationStore.getState().completeItem('e56');
  }, []);

  useEffect(() => {
    if (view === 'maintenance') {
      useImplementationStore.getState().completeItem('e57');
    }
  }, [view]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FuelVehicle>>({});
  const [showNew, setShowNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FuelVehicle | null>(null);
  const [newForm, setNewForm] = useState({ code: '', description: '', vehicle_type: 'camioneta', brand: '', model: '', plate: '', year: '', preferred_fuel: 'diesel', tank_capacity_liters: '', area: '', default_driver: '' });

  const maintenanceDue = useMemo(() =>
    vehicles.filter(v => isDueOrOverdue(v.next_maintenance_date)),
    [vehicles]
  );
  const maintenanceSoon = useMemo(() =>
    vehicles.filter(v => !isDueOrOverdue(v.next_maintenance_date) && isDueSoon(v.next_maintenance_date, 7)),
    [vehicles]
  );
  const allMaintenance = useMemo(() =>
    vehicles.filter(v => v.next_maintenance_date).sort((a, b) => (a.next_maintenance_date || '').localeCompare(b.next_maintenance_date || '')),
    [vehicles]
  );

  const startEdit = (v: FuelVehicle) => {
    setEditId(v.id);
    setEditForm({
      code: v.code,
      description: v.description,
      vehicle_type: v.vehicle_type,
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      year: v.year,
      preferred_fuel: v.preferred_fuel,
      tank_capacity_liters: v.tank_capacity_liters,
      area: v.area,
      default_driver: v.default_driver,
      current_km: v.current_km,
      next_maintenance_date: v.next_maintenance_date,
      next_maintenance_km: v.next_maintenance_km,
      maintenance_notes: v.maintenance_notes,
      insurance_expiry: v.insurance_expiry,
      vtv_expiry: v.vtv_expiry,
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    await updateVehicle.mutateAsync({ id: editId, ...editForm });
    setEditId(null);
    setEditForm({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.code.trim() || !newForm.description.trim()) return;
    await createVehicle.mutateAsync({
      code: newForm.code,
      description: newForm.description,
      vehicle_type: newForm.vehicle_type,
      brand: newForm.brand || null,
      model: newForm.model || null,
      plate: newForm.plate || null,
      year: newForm.year ? parseInt(newForm.year) : null,
      preferred_fuel: newForm.preferred_fuel || null,
      tank_capacity_liters: newForm.tank_capacity_liters ? parseInt(newForm.tank_capacity_liters) : null,
      area: newForm.area || null,
      default_driver: newForm.default_driver || null,
    });
    setShowNew(false);
    setNewForm({ code: '', description: '', vehicle_type: 'camioneta', brand: '', model: '', plate: '', year: '', preferred_fuel: 'diesel', tank_capacity_liters: '', area: '', default_driver: '' });
  };

  const completeMaintenance = async (v: FuelVehicle) => {
    await updateVehicle.mutateAsync({
      id: v.id,
      last_maintenance_date: today(),
      next_maintenance_date: null,
      next_maintenance_km: null,
      maintenance_notes: null,
    });
  };

  if (view === 'daily_report') {
    return <VehicleDailyReportModule onBack={() => setView('overview')} />;
  }

  if (view === 'fuel') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('overview')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota
        </button>
        <FuelModule />
      </div>
    );
  }

  if (view === 'tracking') {
    return (
      <div className="space-y-4 h-[calc(100vh-12rem)]">
        <button onClick={() => setView('overview')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota
        </button>
        <FleetTrackingMap />
      </div>
    );
  }

  if (view === 'maintenance') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('overview')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota
        </button>
        <div className="bg-gradient-to-r from-amber-700 to-amber-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Wrench size={120} /></div>
          <div className="relative z-10">
            <h3 className="font-bold text-2xl flex items-center gap-2"><Wrench size={24} /> Mantenimiento Programado</h3>
            <p className="text-amber-100 text-sm mt-1">Control de service y mantenimiento preventivo de la flota</p>
          </div>
        </div>

        {/* Alerts */}
        {maintenanceDue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-red-700 flex items-center gap-2"><AlertTriangle size={16} /> Mantenimiento vencido o para hoy</p>
            {maintenanceDue.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{v.code} — {v.description}</p>
                    <p className="text-xs text-red-600 font-mono">{v.next_maintenance_date} {v.maintenance_notes ? `· ${v.maintenance_notes}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => completeMaintenance(v)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all flex items-center gap-1">
                  <CheckCircle2 size={14} /> Completado
                </button>
              </div>
            ))}
          </div>
        )}

        {maintenanceSoon.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-yellow-700 flex items-center gap-2"><Clock size={16} /> Próximos 7 días</p>
            {maintenanceSoon.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{v.code} — {v.description}</p>
                    <p className="text-xs text-yellow-600 font-mono">{v.next_maintenance_date} {v.maintenance_notes ? `· ${v.maintenance_notes}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Calendario de Mantenimiento</h3></div>
          {allMaintenance.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Wrench size={40} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No hay mantenimientos programados</p><p className="text-sm">Editá un vehículo para agendar su próximo service</p></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr><th className="px-4 py-3">Vehículo</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Km</th><th className="px-4 py-3">Notas</th><th className="px-4 py-3">Estado</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allMaintenance.map(v => {
                  const overdue = isDueOrOverdue(v.next_maintenance_date);
                  const soon = isDueSoon(v.next_maintenance_date, 7);
                  return (
                    <tr key={v.id} className={overdue ? 'bg-red-50/50' : soon ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 font-medium">{VEHICLE_ICON[v.vehicle_type] || '🚐'} {v.code} — {v.description}</td>
                      <td className="px-4 py-3 font-mono text-xs">{v.next_maintenance_date}</td>
                      <td className="px-4 py-3 font-mono text-xs">{v.next_maintenance_km ? `${v.next_maintenance_km.toLocaleString()} km` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{v.maintenance_notes || '—'}</td>
                      <td className="px-4 py-3">
                        {overdue ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Vencido</span>
                          : soon ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Próximo</span>
                          : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Programado</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ======== OVERVIEW ========
  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-slate-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Truck size={120} /></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-slate-400" />
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Truck size={24} /> Flota y Maquinaria</h3>
          <p className="text-slate-300 text-sm mt-1">Doc PR-GL-01 §4.5 — Registro de vehículos, mantenimiento preventivo y consumo de combustible</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Truck size={16} className="text-slate-500" /> Total Vehículos</div>
          <p className="text-2xl font-black text-slate-600 font-mono">{vehicles.length}</p>
        </div>
        <div className={`bg-white border rounded-xl p-5 shadow-sm ${maintenanceDue.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Mant. Vencido</div>
          <p className="text-2xl font-black text-red-600 font-mono">{maintenanceDue.length}</p>
        </div>
        <div className={`bg-white border rounded-xl p-5 shadow-sm ${maintenanceSoon.length > 0 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Clock size={16} className="text-yellow-500" /> Próx. 7 días</div>
          <p className="text-2xl font-black text-yellow-600 font-mono">{maintenanceSoon.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-amber-500" /> Con Mant. Prog.</div>
          <p className="text-2xl font-black text-amber-600 font-mono">{allMaintenance.length}</p>
        </div>
      </div>

      {/* Sub-modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => setView('maintenance')} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:border-amber-300 hover:shadow-md hover:bg-amber-50/30 transition-all group cursor-pointer relative">
          {maintenanceDue.length > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
              <Bell size={10} /> {maintenanceDue.length} HOY
            </span>
          )}
          <Wrench size={48} className="mx-auto mb-3 text-amber-400 group-hover:text-amber-500 group-hover:scale-110 transition-all" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-amber-700 transition-colors">Mantenimiento</h4>
          <p className="text-sm text-gray-500">Calendario de service por equipo</p>
        </button>
        <button onClick={() => setView('fuel')} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:border-sky-300 hover:shadow-md hover:bg-sky-50/30 transition-all group cursor-pointer">
          <Fuel size={48} className="mx-auto mb-3 text-sky-400 group-hover:text-sky-500 group-hover:scale-110 transition-all" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-sky-700 transition-colors">Combustible</h4>
          <p className="text-sm text-gray-500">Registro de cargas y consumo por km.</p>
        </button>
        <button onClick={() => setView('daily_report')} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30 transition-all group cursor-pointer">
          <ClipboardCheck size={48} className="mx-auto mb-3 text-indigo-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-700 transition-colors">Parte Diario</h4>
          <p className="text-sm text-gray-500">Inspección diaria con QR y checklist.</p>
        </button>
        <button onClick={() => setView('tracking')} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50/30 transition-all group cursor-pointer">
          <Navigation size={48} className="mx-auto mb-3 text-emerald-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors">Mapa en Vivo</h4>
          <p className="text-sm text-gray-500">Rastreo satelital de vehículos activos.</p>
        </button>
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Vehículos Registrados</h3>
          <button onClick={() => setShowNew(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
            <Plus size={16} /> Nuevo Vehículo
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Truck size={40} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No hay vehículos</p></div>
          ) : vehicles.map(v => {
            const overdue = isDueOrOverdue(v.next_maintenance_date);
            const soon = isDueSoon(v.next_maintenance_date, 7);
            const isEditing = editId === v.id;
            return (
              <div key={v.id} className={`p-4 ${overdue ? 'bg-red-50/40' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">{VEHICLE_ICON[v.vehicle_type] || '🚐'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">{v.code}</span>
                      <span className="text-sm text-gray-600">{v.description}</span>
                      {v.plate && <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v.plate}</span>}
                      {overdue && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle size={10} /> Service vencido</span>}
                      {!overdue && soon && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">Service próximo</span>}
                      {v.vehicle_condition && CONDITION_BADGE[v.vehicle_condition] && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CONDITION_BADGE[v.vehicle_condition].cls}`}>
                          {CONDITION_BADGE[v.vehicle_condition].icon} {v.vehicle_condition === 'operativo' ? '' : v.vehicle_condition === 'con_observaciones' ? 'Observado' : 'Fuera de servicio'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      {v.brand && <span>{v.brand} {v.model || ''}</span>}
                      {v.year && <span>Año {v.year}</span>}
                      <span className="flex items-center gap-1"><Gauge size={10} /> {v.current_km ? `${v.current_km.toLocaleString()} km` : 'Sin km'}</span>
                      {v.next_maintenance_date && <span className="flex items-center gap-1"><Wrench size={10} /> Próx: {v.next_maintenance_date}</span>}
                      {v.insurance_expiry && <span className="flex items-center gap-1"><Shield size={10} /> Seguro: {v.insurance_expiry}</span>}
                      {v.vtv_expiry && <span className="flex items-center gap-1"><FileText size={10} /> VTV: {v.vtv_expiry}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => isEditing ? setEditId(null) : startEdit(v)} className={`p-2 rounded-lg transition-all ${isEditing ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
                      {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                    </button>
                    <button onClick={() => setDeleteTarget(v)} className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all" title="Eliminar vehículo">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Edit inline */}
                {isEditing && (
                  <div className="mt-3 ml-14 bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Datos del Vehículo</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Código</label>
                        <input value={editForm.code ?? ''} onChange={e => setEditForm({ ...editForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Descripción</label>
                        <input value={editForm.description ?? ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Tipo</label>
                        <select value={editForm.vehicle_type ?? ''} onChange={e => setEditForm({ ...editForm, vehicle_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                          <option value="camion">Camión</option><option value="camioneta">Camioneta</option><option value="auto">Auto</option><option value="maquinaria">Maquinaria</option><option value="moto">Moto</option><option value="otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Patente</label>
                        <input value={editForm.plate ?? ''} onChange={e => setEditForm({ ...editForm, plate: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono uppercase" placeholder="ABC123" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Marca</label>
                        <input value={editForm.brand ?? ''} onChange={e => setEditForm({ ...editForm, brand: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Toyota" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Modelo</label>
                        <input value={editForm.model ?? ''} onChange={e => setEditForm({ ...editForm, model: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Hilux 2.4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Año</label>
                        <input type="number" value={editForm.year ?? ''} onChange={e => setEditForm({ ...editForm, year: parseInt(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="2024" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Combustible</label>
                        <select value={editForm.preferred_fuel ?? ''} onChange={e => setEditForm({ ...editForm, preferred_fuel: e.target.value || null })} className="w-full px-3 py-2 border rounded-lg text-sm">
                          <option value="diesel">Diesel</option><option value="nafta_super">Nafta Súper</option><option value="nafta_premium">Nafta Premium</option><option value="gnc">GNC</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Capacidad Tanque (L)</label>
                        <input type="number" value={editForm.tank_capacity_liters ?? ''} onChange={e => setEditForm({ ...editForm, tank_capacity_liters: parseInt(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Área</label>
                        <input value={editForm.area ?? ''} onChange={e => setEditForm({ ...editForm, area: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Obra Norte" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Chofer Habitual</label>
                        <input value={editForm.default_driver ?? ''} onChange={e => setEditForm({ ...editForm, default_driver: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Juan Pérez" />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Mantenimiento y Documentación</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-500">Km Actuales</label>
                          <input type="number" value={editForm.current_km ?? ''} onChange={e => setEditForm({ ...editForm, current_km: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Próx. Mantenimiento</label>
                          <input type="date" value={editForm.next_maintenance_date ?? ''} onChange={e => setEditForm({ ...editForm, next_maintenance_date: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Km Mantenimiento</label>
                          <input type="number" value={editForm.next_maintenance_km ?? ''} onChange={e => setEditForm({ ...editForm, next_maintenance_km: parseInt(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="50000" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Venc. Seguro</label>
                          <input type="date" value={editForm.insurance_expiry ?? ''} onChange={e => setEditForm({ ...editForm, insurance_expiry: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Venc. VTV</label>
                          <input type="date" value={editForm.vtv_expiry ?? ''} onChange={e => setEditForm({ ...editForm, vtv_expiry: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Notas Mantenimiento</label>
                          <input value={editForm.maintenance_notes ?? ''} onChange={e => setEditForm({ ...editForm, maintenance_notes: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Cambio aceite + filtros" />
                        </div>
                      </div>
                    </div>
                    <button onClick={saveEdit} disabled={updateVehicle.isPending} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all disabled:opacity-50">
                      {updateVehicle.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Cambios</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Nuevo Vehículo */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Nuevo Vehículo</h3><button onClick={() => setShowNew(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Código *</label><input value={newForm.code} onChange={e => setNewForm({ ...newForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="C-002" required /></div>
                <div><label className="text-xs font-bold text-gray-500">Tipo</label><select value={newForm.vehicle_type} onChange={e => setNewForm({ ...newForm, vehicle_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="camion">Camión</option><option value="camioneta">Camioneta</option><option value="auto">Auto</option><option value="maquinaria">Maquinaria</option><option value="moto">Moto</option><option value="otro">Otro</option></select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Descripción *</label><input value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Toyota Hilux 2.4 DX" required /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Marca</label><input value={newForm.brand} onChange={e => setNewForm({ ...newForm, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Toyota" /></div>
                <div><label className="text-xs font-bold text-gray-500">Modelo</label><input value={newForm.model} onChange={e => setNewForm({ ...newForm, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Hilux 2.4" /></div>
                <div><label className="text-xs font-bold text-gray-500">Año</label><input type="number" value={newForm.year} onChange={e => setNewForm({ ...newForm, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="2024" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Patente</label><input value={newForm.plate} onChange={e => setNewForm({ ...newForm, plate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono uppercase" placeholder="ABC123" /></div>
                <div><label className="text-xs font-bold text-gray-500">Combustible</label><select value={newForm.preferred_fuel} onChange={e => setNewForm({ ...newForm, preferred_fuel: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="diesel">Diesel</option><option value="nafta_super">Nafta Súper</option><option value="nafta_premium">Nafta Premium</option><option value="gnc">GNC</option></select></div>
                <div><label className="text-xs font-bold text-gray-500">Tanque (L)</label><input type="number" value={newForm.tank_capacity_liters} onChange={e => setNewForm({ ...newForm, tank_capacity_liters: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="80" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Área</label><input value={newForm.area} onChange={e => setNewForm({ ...newForm, area: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Obra Norte" /></div>
                <div><label className="text-xs font-bold text-gray-500">Chofer Habitual</label><input value={newForm.default_driver} onChange={e => setNewForm({ ...newForm, default_driver: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Juan Pérez" /></div>
              </div>
              <button type="submit" disabled={createVehicle.isPending} className="w-full bg-slate-700 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all shadow-md disabled:opacity-50">
                {createVehicle.isPending ? 'Creando...' : '🚛 Registrar Vehículo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Eliminar Vehículo</h3>
            <p className="text-sm text-gray-600">
              ¿Eliminás <span className="font-bold">{deleteTarget.code} — {deleteTarget.description}</span>? El vehículo se desactivará y no aparecerá más en el listado.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Cancelar</button>
              <button
                onClick={async () => {
                  try { await deleteVehicle.mutateAsync(deleteTarget.id); setDeleteTarget(null); } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); }
                }}
                disabled={deleteVehicle.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 disabled:opacity-50"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
