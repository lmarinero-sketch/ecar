import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck, Wrench, Fuel, ArrowLeft, Plus, X, Save, AlertTriangle,
  Gauge, Shield, FileText, CheckCircle2, Clock, Bell, Edit2, ClipboardCheck, Trash2, Navigation, Users, QrCode, ChevronDown, ChevronRight
} from 'lucide-react';
import { useImplementationStore } from '../store/useImplementationStore';
import { FuelModule } from './FuelModule';
import { VehicleDailyReportModule } from './VehicleDailyReportModule';
import { VehicleExpandedData } from './VehicleExpandedData';
import { useFuelVehicles, useUpdateFuelVehicle, useCreateFuelVehicle, useDeleteFuelVehicle } from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';
import type { FuelVehicle } from '../lib/types';
import { FleetTrackingMap } from './tracking/FleetTrackingMap';
// const FleetTrackingMap = React.lazy(() => import('./tracking/FleetTrackingMap').then(m => ({ default: m.FleetTrackingMap })));

import { DriversRegistryModule } from './DriversRegistryModule';
import { VehiclesRegistryModule } from './VehiclesRegistryModule';
import { WorkshopPanel } from './WorkshopPanel';
import { TiresPanel } from './TiresPanel';
type FleetView = 'overview' | 'fuel' | 'maintenance' | 'daily_report' | 'tracking' | 'drivers' | 'vehicle_kpis';

const VEHICLE_ICON: Record<string, string> = {
  camion: '🚛', camioneta: '🛻', auto: '🚗', maquinaria: '🏗️', moto: '🏍️', otro: '🚐',
};

/* ── iOS Style Toggle Switch ── */
export const IosToggleSwitch: React.FC<{
  checked: boolean; // true = Fuera de Servicio, false = Operativo / En Servicio
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}> = ({ checked, onChange, disabled = false, size = 'md' }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-50 select-none shadow-inner ${
        size === 'sm' ? 'w-11 h-6' : 'w-14 h-7.5'
      } ${
        checked ? 'bg-red-500' : 'bg-emerald-500'
      }`}
      title={checked ? 'Fuera de Servicio (Hacé clic para cambiar a Operativo)' : 'En Servicio / Operativo (Hacé clic para pasar a Fuera de Servicio)'}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
          size === 'sm'
            ? `w-5 h-5 ${checked ? 'translate-x-5' : 'translate-x-0'}`
            : `w-6.5 h-6.5 ${checked ? 'translate-x-6.5' : 'translate-x-0'}`
        }`}
      />
    </button>
  );
};

const today = () => new Date().toISOString().slice(0, 10);

const isDueOrOverdue = (dateStr: string | null) => {
  if (!dateStr) return false;
  return dateStr <= today();
};

const isDueSoon = (dateStr: string | null, days = 7) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  t.setDate(t.getDate() + days);
  return d <= t && d >= new Date();
};

export const FleetModule: React.FC = () => {
  const [view, setView] = useState<FleetView>('overview');
  const { data: vehicles = [], isLoading } = useFuelVehicles();
  const createVehicle = useCreateFuelVehicle();
  const updateVehicle = useUpdateFuelVehicle();
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNew, setShowNew] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FuelVehicle>>({});
  const [maintenanceTab, setMaintenanceTab] = useState<'schedule' | 'workshop' | 'tires'>('schedule');
  const [qrVehicle, setQrVehicle] = useState<FuelVehicle | null>(null);
  const [newForm, setNewForm] = useState({ code: '', description: '', vehicle_type: 'camioneta', tracking_type: 'km' as 'km'|'hours', brand: '', model: '', plate: '', year: '', preferred_fuel: 'diesel', tank_capacity_liters: '', area: '', default_driver: '' });

  const handleDeleteVehicle = async (v: FuelVehicle) => {
    const confirmed = await useModalStore.getState().showConfirm(
      'Eliminar Vehículo',
      `¿Eliminás "${v.code} — ${v.description}"? El vehículo se desactivará y no aparecerá más en el listado.`
    );
    if (!confirmed) return;
    try {
      await deleteVehicle.mutateAsync(v.id);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message);
    }
  };

  const maintenanceDue = useMemo(() =>
    vehicles.filter(v => isDueOrOverdue(v.next_maintenance_date)),
    [vehicles]
  );
  const maintenanceSoon = useMemo(() =>
    vehicles.filter(v => !isDueOrOverdue(v.next_maintenance_date) && isDueSoon(v.next_maintenance_date, 7)),
    [vehicles]
  );
  const vtvDue = useMemo(() => vehicles.filter(v => isDueOrOverdue(v.vtv_expiry)), [vehicles]);
  const insuranceDue = useMemo(() => vehicles.filter(v => isDueOrOverdue(v.insurance_expiry)), [vehicles]);
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
      tracking_type: v.tracking_type || 'km',
      current_km: v.current_km,
      current_hours: v.current_hours,
      next_maintenance_date: v.next_maintenance_date,
      next_maintenance_km: v.next_maintenance_km,
      next_maintenance_hours: v.next_maintenance_hours,
      maintenance_notes: v.maintenance_notes,
      insurance_expiry: v.insurance_expiry,
      vtv_expiry: v.vtv_expiry,
      vehicle_condition: v.vehicle_condition || 'operativo',
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
      tracking_type: newForm.tracking_type,
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
    setNewForm({ code: '', description: '', vehicle_type: 'camioneta', tracking_type: 'km', brand: '', model: '', plate: '', year: '', preferred_fuel: 'diesel', tank_capacity_liters: '', area: '', default_driver: '' });
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

  if (view === 'drivers') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('overview')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota
        </button>
        <DriversRegistryModule />
      </div>
    );
  }

  if (view === 'vehicle_kpis') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('overview')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota
        </button>
        <VehiclesRegistryModule />
      </div>
    );
  }

  if (view === 'maintenance') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('overview')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota
        </button>

        {/* Header and Tabs */}
        <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Wrench size={120} /></div>
          <div className="relative z-10">
            <h3 className="font-bold text-2xl flex items-center gap-2"><Wrench size={24} /> Taller y Mantenimiento</h3>
            <p className="text-ecar-blueLight text-sm mt-1">Control de service, taller interno y neumáticos</p>
          </div>
          
          <div className="flex gap-4 mt-6 border-b border-blue-400/50 relative z-10">
            <button 
              onClick={() => setMaintenanceTab('schedule')} 
              className={`pb-2 px-2 text-sm font-bold transition-colors ${maintenanceTab === 'schedule' ? 'text-white border-b-2 border-white' : 'text-ecar-blueLight hover:text-white'}`}
            >
              Cronograma Service
            </button>
            <button 
              onClick={() => setMaintenanceTab('workshop')} 
              className={`pb-2 px-2 text-sm font-bold transition-colors ${maintenanceTab === 'workshop' ? 'text-white border-b-2 border-white' : 'text-ecar-blueLight hover:text-white'}`}
            >
              Órdenes de Taller
            </button>
            <button 
              onClick={() => setMaintenanceTab('tires')} 
              className={`pb-2 px-2 text-sm font-bold transition-colors ${maintenanceTab === 'tires' ? 'text-white border-b-2 border-white' : 'text-ecar-blueLight hover:text-white'}`}
            >
              Neumáticos
            </button>
          </div>
        </div>

        {maintenanceTab === 'workshop' && <WorkshopPanel />}
        {maintenanceTab === 'tires' && <TiresPanel />}

        {maintenanceTab === 'schedule' && (
          <div className="space-y-4">
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
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Calendario de Mantenimiento</h3></div>
              {allMaintenance.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><Wrench size={40} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No hay mantenimientos programados</p><p className="text-sm">Editá un vehículo para agendar su próximo service</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Vehículo</th><th>Fecha</th><th>Km</th><th>Notas</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {allMaintenance.map(v => {
                      const overdue = isDueOrOverdue(v.next_maintenance_date);
                      const soon = isDueSoon(v.next_maintenance_date, 7);
                      return (
                        <tr key={v.id} className={overdue ? 'bg-red-50/50' : soon ? 'bg-yellow-50/50' : ''}>
                          <td className="font-medium">{VEHICLE_ICON[v.vehicle_type] || '🚐'} {v.code} — {v.description}</td>
                          <td className="font-mono text-xs">{v.next_maintenance_date}</td>
                          <td className="font-mono text-xs">{v.next_maintenance_km ? `${v.next_maintenance_km.toLocaleString()} km` : '—'}</td>
                      <td className="text-xs text-gray-500">{v.maintenance_notes || '—'}</td>
                      <td>
                        {overdue ? <span className="badge badge-danger">Vencido</span>
                          : soon ? <span className="badge badge-warning">Próximo</span>
                          : <span className="badge badge-success">Programado</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
        )}
      </div>
    );
  }

  // ======== OVERVIEW ========
  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-slate-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Truck size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Truck size={24} /> Flota y Maquinaria</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Doc PR-GL-01 §4.5 — Registro de vehículos, mantenimiento preventivo y consumo de combustible</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Truck size={16} className="text-slate-500" /> Total Vehículos</div>
          <p className="text-2xl font-black text-slate-600 font-mono relative z-10">{vehicles.length}</p>
        </div>
        <div className={`kpi-card ${maintenanceDue.length > 0 ? '!border-red-200 !bg-red-50/70' : ''}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Mant. Vencido</div>
          <p className="text-2xl font-black text-red-600 font-mono relative z-10">{maintenanceDue.length}</p>
        </div>
        <div className={`kpi-card ${(vtvDue.length > 0 || insuranceDue.length > 0) ? '!border-red-200 !bg-red-50/70' : ''}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><FileText size={16} className="text-red-500" /> Docs. Vencidos</div>
          <p className="text-2xl font-black text-red-600 font-mono relative z-10">{vtvDue.length + insuranceDue.length}</p>
        </div>
        <div className={`kpi-card ${maintenanceSoon.length > 0 ? '!border-yellow-200 !bg-yellow-50/70' : ''}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Clock size={16} className="text-yellow-500" /> Próx. 7 días</div>
          <p className="text-2xl font-black text-yellow-600 font-mono relative z-10">{maintenanceSoon.length}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-amber-500" /> Con Mant. Prog.</div>
          <p className="text-2xl font-black text-amber-600 font-mono relative z-10">{allMaintenance.length}</p>
        </div>
      </div>

      {/* Sub-modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <button onClick={() => setView('maintenance')} className="light-card p-6 text-center group cursor-pointer relative">
          {maintenanceDue.length > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
              <Bell size={10} /> {maintenanceDue.length} HOY
            </span>
          )}
          <Wrench size={48} className="mx-auto mb-3 text-amber-400 group-hover:text-amber-500 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-amber-700 transition-colors relative z-10">Mantenimiento</h4>
          <p className="text-sm text-gray-500 relative z-10">Calendario de service</p>
        </button>
        <button onClick={() => setView('fuel')} className="light-card p-6 text-center group cursor-pointer relative">
          <Fuel size={48} className="mx-auto mb-3 text-sky-400 group-hover:text-sky-500 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-sky-700 transition-colors relative z-10">Combustible</h4>
          <p className="text-sm text-gray-500 relative z-10">Registro de cargas</p>
        </button>
        <button onClick={() => setView('daily_report')} className="light-card p-6 text-center group cursor-pointer relative">
          <ClipboardCheck size={48} className="mx-auto mb-3 text-ecar-blue group-hover:text-ecar-blue group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-ecar-blue transition-colors relative z-10">Parte Diario</h4>
          <p className="text-sm text-gray-500 relative z-10">Inspección con QR</p>
        </button>
        <button onClick={() => setView('tracking')} className="light-card p-6 text-center group cursor-pointer relative">
          <Navigation size={48} className="mx-auto mb-3 text-emerald-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors relative z-10">Mapa en Vivo</h4>
          <p className="text-sm text-gray-500 relative z-10">Rastreo satelital</p>
        </button>
        <button onClick={() => setView('drivers')} className="light-card p-6 text-center group cursor-pointer relative">
          <Users size={48} className="mx-auto mb-3 text-blue-500 group-hover:text-blue-600 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors relative z-10">Choferes</h4>
          <p className="text-sm text-gray-500 relative z-10">Desempeño y KPIs</p>
        </button>
        <button onClick={() => setView('vehicle_kpis')} className="light-card p-6 text-center group cursor-pointer relative">
          <Gauge size={48} className="mx-auto mb-3 text-indigo-500 group-hover:text-indigo-600 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-700 transition-colors relative z-10">KPIs Flota</h4>
          <p className="text-sm text-gray-500 relative z-10">Análisis de unidades</p>
        </button>
      </div>

      {/* Vehicle List */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-white/40 bg-white/40 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 relative z-10">Vehículos Registrados</h3>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus size={16} /> Nuevo Vehículo
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Truck size={40} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No hay vehículos</p></div>
          ) : vehicles.map(v => {
            const overdue = isDueOrOverdue(v.next_maintenance_date);
            const soon = isDueSoon(v.next_maintenance_date, 7);
            const vtvOverdue = isDueOrOverdue(v.vtv_expiry);
            const insuranceOverdue = isDueOrOverdue(v.insurance_expiry);
            const isEditing = editId === v.id;
            const isExpanded = expandedIds.has(v.id);

            const toggleExpand = () => {
              const newSet = new Set(expandedIds);
              if (newSet.has(v.id)) newSet.delete(v.id);
              else newSet.add(v.id);
              setExpandedIds(newSet);
            };

            return (
              <div key={v.id} className={`p-4 transition-colors ${overdue || vtvOverdue || insuranceOverdue ? 'bg-red-50/40' : 'hover:bg-slate-50'}`}>
                <div className="flex items-start gap-4">
                  <button onClick={toggleExpand} className="mt-2 text-gray-400 hover:text-gray-600 transition-colors">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 cursor-pointer" onClick={toggleExpand}>
                    {VEHICLE_ICON[v.vehicle_type] || '🚐'}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={toggleExpand}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">{v.code}</span>
                      <span className="text-sm text-gray-600">{v.description}</span>
                      {v.plate && <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v.plate}</span>}
                      {overdue && <span className="badge badge-danger text-[10px] flex items-center gap-1"><AlertTriangle size={10} /> Service vencido</span>}
                      {!overdue && soon && <span className="badge badge-warning text-[10px]">Service próximo</span>}
                      {vtvOverdue && <span className="badge badge-danger text-[10px] flex items-center gap-1"><FileText size={10} /> VTV Vencida</span>}
                      {insuranceOverdue && <span className="badge badge-danger text-[10px] flex items-center gap-1"><Shield size={10} /> Seguro Vencido</span>}
                      <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-xs">
                        <IosToggleSwitch
                          size="sm"
                          checked={v.vehicle_condition === 'fuera_de_servicio'}
                          onChange={async (isFuera) => {
                            const newCondition = isFuera ? 'fuera_de_servicio' : 'operativo';
                            try {
                              await updateVehicle.mutateAsync({ id: v.id, vehicle_condition: newCondition });
                              useModalStore.getState().showAlert(
                                'Estado de Vehículo Actualizado',
                                isFuera 
                                  ? `🔴 El vehículo ${v.code} fue marcado como FUERA DE SERVICIO.`
                                  : `🟢 El vehículo ${v.code} se habilitó como OPERATIVO (En Servicio).`
                              );
                            } catch (err: any) {
                              useModalStore.getState().showAlert('Error', err?.message || 'No se pudo cambiar el estado.');
                            }
                          }}
                        />
                        <span className={`text-[10px] font-extrabold ${v.vehicle_condition === 'fuera_de_servicio' ? 'text-red-600' : 'text-emerald-700'}`}>
                          {v.vehicle_condition === 'fuera_de_servicio' ? '🔴 Fuera de servicio' : '🟢 En servicio'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      {v.brand && <span>{v.brand} {v.model || ''}</span>}
                      {v.year && <span>Año {v.year}</span>}
                      <span className="flex items-center gap-1">
                        <Gauge size={10} /> 
                        {v.tracking_type === 'hours' 
                          ? (v.current_hours ? `${v.current_hours.toLocaleString()} hs` : 'Sin hs')
                          : (v.current_km ? `${v.current_km.toLocaleString()} km` : 'Sin km')}
                      </span>
                      {v.next_maintenance_date && <span className="flex items-center gap-1"><Wrench size={10} /> Próx: {v.next_maintenance_date}</span>}
                      {v.insurance_expiry && <span className="flex items-center gap-1"><Shield size={10} /> Seguro: {v.insurance_expiry}</span>}
                      {v.vtv_expiry && <span className="flex items-center gap-1"><FileText size={10} /> VTV: {v.vtv_expiry}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => isEditing ? setEditId(null) : startEdit(v)} className={`p-2 rounded-lg transition-all ${isEditing ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
                      {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                    </button>
                    <button onClick={() => setQrVehicle(v)} className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-500 transition-all" title="Imprimir QR para Parte Diario">
                      <QrCode size={16} />
                    </button>
                    <button onClick={() => handleDeleteVehicle(v)} className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all" title="Eliminar vehículo">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Edit inline */}
                {isEditing && (
                  <div className="mt-3 ml-14 bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
                    <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${editForm.vehicle_condition === 'fuera_de_servicio' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-700 block">Estado Operativo del Vehículo</span>
                        <span className="text-xs font-semibold text-gray-600">
                          {editForm.vehicle_condition === 'fuera_de_servicio' 
                            ? '🔴 Unidad declarada FUERA DE SERVICIO' 
                            : '🟢 Unidad habilitada OPERATIVA (En Servicio)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">
                          {editForm.vehicle_condition === 'fuera_de_servicio' ? 'Fuera de servicio' : 'En servicio'}
                        </span>
                        <IosToggleSwitch
                          size="md"
                          checked={editForm.vehicle_condition === 'fuera_de_servicio'}
                          onChange={(isFuera) => {
                            setEditForm(f => ({ ...f, vehicle_condition: isFuera ? 'fuera_de_servicio' : 'operativo' }));
                          }}
                        />
                      </div>
                    </div>
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
                          <label className="text-xs font-bold text-gray-500">Medición</label>
                          <select value={editForm.tracking_type || 'km'} onChange={e => setEditForm({ ...editForm, tracking_type: e.target.value as 'km'|'hours' })} className="w-full px-3 py-2 border rounded-xl text-sm">
                            <option value="km">Kilómetros</option>
                            <option value="hours">Horas (Maquinaria)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">{editForm.tracking_type === 'hours' ? 'Hs Actuales' : 'Km Actuales'}</label>
                          {editForm.tracking_type === 'hours' ? (
                            <input type="number" step="0.1" value={editForm.current_hours ?? ''} onChange={e => setEditForm({ ...editForm, current_hours: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="0" />
                          ) : (
                            <input type="number" value={editForm.current_km ?? ''} onChange={e => setEditForm({ ...editForm, current_km: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="0" />
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Próx. Mantenimiento</label>
                          <input type="date" value={editForm.next_maintenance_date ?? ''} onChange={e => setEditForm({ ...editForm, next_maintenance_date: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">{editForm.tracking_type === 'hours' ? 'Hs Mantenimiento' : 'Km Mantenimiento'}</label>
                          {editForm.tracking_type === 'hours' ? (
                            <input type="number" step="0.1" value={editForm.next_maintenance_hours ?? ''} onChange={e => setEditForm({ ...editForm, next_maintenance_hours: parseFloat(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="250" />
                          ) : (
                            <input type="number" value={editForm.next_maintenance_km ?? ''} onChange={e => setEditForm({ ...editForm, next_maintenance_km: parseInt(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="50000" />
                          )}
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
                    <button onClick={saveEdit} disabled={updateVehicle.isPending} className="btn-primary disabled:opacity-50">
                      {updateVehicle.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Cambios</>}
                    </button>
                  </div>
                )}

                {/* Expanded View (QR and Fuel) */}
                {isExpanded && !isEditing && (
                  <VehicleExpandedData vehicleId={v.id} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Código *</label><input value={newForm.code} onChange={e => setNewForm({ ...newForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="C-002" required /></div>
                <div><label className="text-xs font-bold text-gray-500">Tipo</label><select value={newForm.vehicle_type} onChange={e => setNewForm({ ...newForm, vehicle_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="camion">Camión</option><option value="camioneta">Camioneta</option><option value="auto">Auto</option><option value="maquinaria">Maquinaria</option><option value="moto">Moto</option><option value="otro">Otro</option></select></div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Medición Uso</label>
                  <select value={newForm.tracking_type} onChange={e => setNewForm({ ...newForm, tracking_type: e.target.value as 'km'|'hours' })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="km">Kilómetros</option>
                    <option value="hours">Horas (Maquinaria)</option>
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Descripción *</label><input value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Toyota Hilux 2.4 DX" required /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Marca</label><input value={newForm.brand} onChange={e => setNewForm({ ...newForm, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Toyota" /></div>
                <div><label className="text-xs font-bold text-gray-500">Modelo</label><input value={newForm.model} onChange={e => setNewForm({ ...newForm, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Hilux 2.4" /></div>
                <div><label className="text-xs font-bold text-gray-500">Año</label><input type="number" value={newForm.year} onChange={e => setNewForm({ ...newForm, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="2024" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Patente</label><input value={newForm.plate} onChange={e => setNewForm({ ...newForm, plate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono uppercase" placeholder="ABC123" /></div>
                <div><label className="text-xs font-bold text-gray-500">Combustible</label><select value={newForm.preferred_fuel} onChange={e => setNewForm({ ...newForm, preferred_fuel: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="diesel">Diesel</option><option value="nafta_super">Nafta Súper</option><option value="nafta_premium">Nafta Premium</option><option value="gnc">GNC</option></select></div>
                <div><label className="text-xs font-bold text-gray-500">Tanque (L)</label><input type="number" value={newForm.tank_capacity_liters} onChange={e => setNewForm({ ...newForm, tank_capacity_liters: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="80" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Área</label><input value={newForm.area} onChange={e => setNewForm({ ...newForm, area: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Obra Norte" /></div>
                <div><label className="text-xs font-bold text-gray-500">Chofer Habitual</label><input value={newForm.default_driver} onChange={e => setNewForm({ ...newForm, default_driver: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Juan Pérez" /></div>
              </div>
              <button type="submit" disabled={createVehicle.isPending} className="btn-primary w-full justify-center disabled:opacity-50">
                {createVehicle.isPending ? 'Creando...' : '🚛 Registrar Vehículo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrVehicle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6">
            <h3 className="font-bold text-xl text-gray-800 mb-1">{qrVehicle.code}</h3>
            <p className="text-sm text-gray-500 mb-6">Escaneá este código para iniciar el Parte Diario.</p>
            <div className="bg-white p-4 inline-block border-4 border-ecar-blue rounded-xl mb-4" id="qr-print-area">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/checkin/' + qrVehicle.id)}`} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-xs text-blue-600 break-all bg-blue-50 p-2 rounded mb-6 font-mono border border-blue-100">
              {window.location.origin + '/checkin/' + qrVehicle.id}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setQrVehicle(null)} className="btn-secondary flex-1">Cerrar</button>
              <button onClick={() => window.open(window.location.origin + '/checkin/' + qrVehicle.id, '_blank')} className="btn-primary flex-1">Ver Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
