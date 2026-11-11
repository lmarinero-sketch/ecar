import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck, Wrench, Fuel, ArrowLeft, Plus, X, Save, AlertTriangle,
  Gauge, Shield, FileText, CheckCircle2, Clock, Bell, Edit2, ClipboardCheck,
  Trash2, Navigation, Users, QrCode, ChevronDown, ChevronRight, Search, Droplets
} from 'lucide-react';
import { useImplementationStore } from '../store/useImplementationStore';
import { FuelModule } from './FuelModule';
import { VehicleDailyReportModule } from './VehicleDailyReportModule';
import { VehicleExpandedData } from './VehicleExpandedData';
import {
  useFuelVehicles,
  useUpdateFuelVehicle,
  useCreateFuelVehicle,
  useDeleteFuelVehicle,
  useFleetMaintenanceOrders,
  useFuelBatanMovements
} from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';
import { ModalPortal } from './common/ModalPortal';
import type { FuelVehicle } from '../lib/types';
import {
  checkVehicleMaintenance,
  isBatanUnit,
  getVehicleExpiredDocuments
} from '../lib/vehicleMaintenance';
import { FleetTrackingMap } from './tracking/FleetTrackingMap';
import { DriversRegistryModule } from './DriversRegistryModule';
import { VehiclesRegistryModule } from './VehiclesRegistryModule';
import { WorkshopPanel, parseOtMetadata } from './WorkshopPanel';

type FleetView =
  | 'overview'
  | 'vehicles'
  | 'fuel'
  | 'maintenance'
  | 'daily_report'
  | 'tracking'
  | 'drivers'
  | 'vehicle_kpis';

export type VehicleListFilter = 'all' | 'mant_vencido' | 'docs_vencidos' | 'prox_7d' | 'mant_prog';

// 1.3 Feature flag: Ocultar módulo Choferes de la portada sin borrar datos ni código
const SHOW_DRIVERS_MODULE = false;

const VEHICLE_ICON: Record<string, string> = {
  camion: '🚛',
  camioneta: '🛻',
  auto: '🚗',
  maquinaria: '🏗️',
  moto: '🏍️',
  batan: '🛢️',
  Batán: '🛢️',
  otro: '🚐',
};

const FILTER_LABELS: Record<VehicleListFilter, string> = {
  all: 'Todos los vehículos',
  mant_vencido: 'Mantenimiento Vencido',
  docs_vencidos: 'Documentación Vencida (Seguro / VTV)',
  prox_7d: 'Próximos 7 días / 500 km / 50 hs',
  mant_prog: 'Con Mantenimiento Programado',
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

export const FleetModule: React.FC = () => {
  // Read initial filter from URL if present (?filtro=...)
  const getInitialFilterFromUrl = (): { initialView: FleetView; initialFilter: VehicleListFilter } => {
    try {
      const params = new URLSearchParams(window.location.search);
      const f = params.get('filtro') as VehicleListFilter | null;
      if (f && ['all', 'mant_vencido', 'docs_vencidos', 'prox_7d', 'mant_prog'].includes(f)) {
        return { initialView: 'vehicles', initialFilter: f };
      }
    } catch {
      // ignore
    }
    return { initialView: 'overview', initialFilter: 'all' };
  };

  const { initialView, initialFilter } = useMemo(() => getInitialFilterFromUrl(), []);
  const [view, setView] = useState<FleetView>(initialView);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleListFilter>(initialFilter);
  const [vehicleSearch, setVehicleSearch] = useState('');

  const { data: vehicles = [], isLoading } = useFuelVehicles();
  const { data: maintenanceOrders = [] } = useFleetMaintenanceOrders();
  const { data: batanMovements = [] } = useFuelBatanMovements();

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

  // 4.2 Sync sub-view with Layout global breadcrumb & back button
  useEffect(() => {
    const VIEW_LABELS: Record<FleetView, string | null> = {
      overview: null,
      vehicles: vehicleFilter === 'all' ? 'Total Vehículos' : `Vehículos · ${FILTER_LABELS[vehicleFilter]}`,
      maintenance: 'Taller y Mantenimiento',
      fuel: 'Combustible',
      daily_report: 'Parte Diario Vehicular',
      tracking: 'Mapa en Vivo',
      drivers: 'Choferes',
      vehicle_kpis: 'KPIs Flota',
    };
    const subLabel = VIEW_LABELS[view];
    if (subLabel) {
      window.dispatchEvent(
        new CustomEvent('ecar-subview-change', {
          detail: {
            label: subLabel,
            onBack: () => navigateToOverview(),
          },
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent('ecar-subview-change', { detail: { label: null } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('ecar-subview-change', { detail: { label: null } }));
    };
  }, [view, vehicleFilter]);

  const navigateToVehiclesWithFilter = (filter: VehicleListFilter) => {
    setVehicleFilter(filter);
    setView('vehicles');
    try {
      const url = new URL(window.location.href);
      if (filter === 'all') {
        url.searchParams.delete('filtro');
      } else {
        url.searchParams.set('filtro', filter);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  const navigateToOverview = () => {
    setView('overview');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('filtro');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Current Batán stock calculation for 4.4
  const currentBatanStockLiters = useMemo(() => {
    if (!batanMovements || batanMovements.length === 0) return 200;
    const sorted = [...batanMovements].sort((a, b) => {
      const dA = new Date(a.movement_date).getTime();
      const dB = new Date(b.movement_date).getTime();
      if (dA !== dB) return dA - dB;
      return new Date(a.created_at || a.movement_date).getTime() - new Date(b.created_at || b.movement_date).getTime();
    });
    let stock = 200;
    if (sorted.length > 0 && ((sorted[0].movement_type as string) === 'purchase' || (sorted[0].movement_type as string) === 'ingreso')) {
      stock = 0;
    }
    for (const m of sorted) {
      const t = (m.movement_type || '') as string;
      if (t === 'purchase' || t === 'ingreso') stock += Number(m.liters_loaded || 0);
      else if (t === 'discharge' || t === 'egreso') stock -= Number(m.liters_discharged || 0);
      else if (m.balance_after !== null && m.balance_after !== undefined) stock = Number(m.balance_after);
    }
    const last = sorted[sorted.length - 1];
    if (last && last.balance_after !== null && last.balance_after !== undefined && last.balance_after > 0) {
      return Number(last.balance_after);
    }
    return Math.max(0, Number(stock.toFixed(1)));
  }, [batanMovements]);

  const [editId, setEditId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNew, setShowNew] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FuelVehicle>>({});
  // 3.3 Eliminar pestaña Neumáticos: solo 'schedule' | 'workshop'
  const [maintenanceTab, setMaintenanceTab] = useState<'schedule' | 'workshop'>('schedule');
  const [otDraftVehicle, setOtDraftVehicle] = useState<FuelVehicle | null>(null);
  const [qrVehicle, setQrVehicle] = useState<FuelVehicle | null>(null);
  const [newForm, setNewForm] = useState({
    code: '',
    description: '',
    vehicle_type: 'camioneta',
    tracking_type: 'km' as 'km' | 'hours',
    brand: '',
    model: '',
    plate: '',
    year: '',
    preferred_fuel: 'diesel',
    tank_capacity_liters: '',
    area: '',
    default_driver: '',
  });

  // 3.2 Modal de Confirmación de Service Completado (sin salto de scroll)
  const [completeModalVehicle, setCompleteModalVehicle] = useState<FuelVehicle | null>(null);
  const [completeDate, setCompleteDate] = useState(today());
  const [completeCurrentReading, setCompleteCurrentReading] = useState('');
  const [completeNextReading, setCompleteNextReading] = useState('');
  const [completeNextDate, setCompleteNextDate] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

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

  // 4.4 Excluir batanes de KPIs de mantenimiento y vencimientos documentales
  const nonBatanVehicles = useMemo(() => vehicles.filter(v => !isBatanUnit(v)), [vehicles]);

  const maintenanceDue = useMemo(
    () => nonBatanVehicles.filter(v => checkVehicleMaintenance(v).isOverdue),
    [nonBatanVehicles]
  );
  const maintenanceSoon = useMemo(
    () => nonBatanVehicles.filter(v => checkVehicleMaintenance(v).isSoon),
    [nonBatanVehicles]
  );
  const docsDueVehicles = useMemo(
    () => nonBatanVehicles.filter(v => getVehicleExpiredDocuments(v).length > 0),
    [nonBatanVehicles]
  );
  const totalExpiredDocsCount = useMemo(
    () => nonBatanVehicles.reduce((sum, v) => sum + getVehicleExpiredDocuments(v).length, 0),
    [nonBatanVehicles]
  );
  const allMaintenance = useMemo(
    () =>
      nonBatanVehicles
        .filter(v => v.next_maintenance_date || v.next_maintenance_km != null || v.next_maintenance_hours != null)
        .sort((a, b) => {
          const checkA = checkVehicleMaintenance(a);
          const checkB = checkVehicleMaintenance(b);
          if (checkA.isOverdue && !checkB.isOverdue) return -1;
          if (!checkA.isOverdue && checkB.isOverdue) return 1;
          if (checkA.isSoon && !checkB.isSoon) return -1;
          if (!checkA.isSoon && checkB.isSoon) return 1;
          return (a.code || '').localeCompare(b.code || '');
        }),
    [nonBatanVehicles]
  );

  // Pending OTs count for badge on "Órdenes de Taller" tab
  const pendingOtCount = useMemo(() => {
    return maintenanceOrders.filter(o => {
      const meta = parseOtMetadata(o);
      return meta.comprasStatus !== 'cerrada' && o.status !== 'terminado';
    }).length;
  }, [maintenanceOrders]);

  // Filtered vehicles for 'vehicles' view (1.1 & 1.2)
  const filteredVehicles = useMemo(() => {
    let base = vehicles;
    if (vehicleFilter === 'mant_vencido') {
      base = maintenanceDue;
    } else if (vehicleFilter === 'docs_vencidos') {
      base = docsDueVehicles;
    } else if (vehicleFilter === 'prox_7d') {
      base = maintenanceSoon;
    } else if (vehicleFilter === 'mant_prog') {
      base = allMaintenance;
    }

    if (vehicleSearch.trim()) {
      const q = vehicleSearch.toLowerCase().trim();
      base = base.filter(
        v =>
          (v.code || '').toLowerCase().includes(q) ||
          (v.description || '').toLowerCase().includes(q) ||
          (v.plate || '').toLowerCase().includes(q) ||
          (v.brand || '').toLowerCase().includes(q) ||
          (v.default_driver || '').toLowerCase().includes(q)
      );
    }
    return base;
  }, [vehicles, vehicleFilter, vehicleSearch, maintenanceDue, docsDueVehicles, maintenanceSoon, allMaintenance]);

  const startEdit = (v: FuelVehicle) => {
    setEditId(v.id);
    setEditForm({
      code: v.code,
      description: v.description,
      vehicle_type: isBatanUnit(v) ? 'batan' : v.vehicle_type,
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
    const isBatan = isBatanUnit(editForm);
    await updateVehicle.mutateAsync({
      id: editId,
      ...editForm,
      ...(isBatan
        ? {
            current_km: null,
            current_hours: null,
            next_maintenance_date: null,
            next_maintenance_km: null,
            next_maintenance_hours: null,
            insurance_expiry: null,
            vtv_expiry: null,
          }
        : {}),
    });
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
    setNewForm({
      code: '',
      description: '',
      vehicle_type: 'camioneta',
      tracking_type: 'km',
      brand: '',
      model: '',
      plate: '',
      year: '',
      preferred_fuel: 'diesel',
      tank_capacity_liters: '',
      area: '',
      default_driver: '',
    });
  };

  // 3.2 Abrir modal de confirmación de service completado sin perder posición de scroll
  const openCompleteMaintenanceModal = (e: React.MouseEvent, v: FuelVehicle) => {
    e.preventDefault();
    e.stopPropagation();
    const isHours = v.tracking_type === 'hours';
    const currentReading = isHours ? (v.current_hours ?? 0) : (v.current_km ?? 0);
    const defaultInterval = isHours ? 250 : 10000;
    setCompleteModalVehicle(v);
    setCompleteDate(today());
    setCompleteCurrentReading(String(currentReading || ''));
    setCompleteNextReading(currentReading ? String(Number(currentReading) + defaultInterval) : '');
    setCompleteNextDate('');
    setCompleteNotes(v.maintenance_notes || 'Service preventivo realizado');
  };

  const handleConfirmCompleteMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalVehicle) return;
    const v = completeModalVehicle;
    const isHours = v.tracking_type === 'hours';
    const parsedCurrent = parseFloat(completeCurrentReading);
    const parsedNext = parseFloat(completeNextReading);

    try {
      await updateVehicle.mutateAsync({
        id: v.id,
        last_maintenance_date: completeDate || today(),
        current_km: !isHours && !isNaN(parsedCurrent) ? Math.round(parsedCurrent) : v.current_km,
        current_hours: isHours && !isNaN(parsedCurrent) ? parsedCurrent : v.current_hours,
        next_maintenance_km: !isHours ? (!isNaN(parsedNext) && parsedNext > 0 ? Math.round(parsedNext) : null) : v.next_maintenance_km,
        next_maintenance_hours: isHours ? (!isNaN(parsedNext) && parsedNext > 0 ? parsedNext : null) : v.next_maintenance_hours,
        next_maintenance_date: completeNextDate || null,
        maintenance_notes: completeNotes.trim() || null,
        vehicle_condition: 'operativo',
      });
      setCompleteModalVehicle(null);
      useModalStore.getState().showAlert(
        'Mantenimiento Registrado',
        `Se confirmó el service de ${v.code} con fecha ${completeDate} y la unidad quedó operativa.`
      );
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo actualizar el mantenimiento.');
    }
  };

  // 3.1 Abrir generador de OT vinculada a Compras
  const handleGenerateWorkOrder = (e: React.MouseEvent, v: FuelVehicle) => {
    e.preventDefault();
    e.stopPropagation();
    setOtDraftVehicle(v);
    setMaintenanceTab('workshop');
  };

  // Render reusable 5 clickable KPI cards (1.1)
  const renderClickableKpiCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
      <button
        type="button"
        onClick={() => navigateToVehiclesWithFilter('all')}
        className={`kpi-card text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
          view === 'vehicles' && vehicleFilter === 'all' ? 'ring-2 ring-ecar-blue !border-ecar-blue' : ''
        }`}
      >
        <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-2">
          <span className="flex items-center gap-2"><Truck size={16} className="text-slate-500" /> Total Vehículos</span>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
        <p className="text-2xl font-black text-slate-700 font-mono relative z-10">{vehicles.length}</p>
        <p className="text-[11px] text-gray-400 mt-1">Ver listado y ABM de unidades</p>
      </button>

      <button
        type="button"
        onClick={() => navigateToVehiclesWithFilter('mant_vencido')}
        className={`kpi-card text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
          maintenanceDue.length > 0 ? '!border-red-200 !bg-red-50/70' : ''
        } ${view === 'vehicles' && vehicleFilter === 'mant_vencido' ? 'ring-2 ring-red-500' : ''}`}
      >
        <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-2">
          <span className="flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Mant. Vencido</span>
          <ChevronRight size={14} className="text-red-400" />
        </div>
        <p className="text-2xl font-black text-red-600 font-mono relative z-10">{maintenanceDue.length}</p>
        <p className="text-[11px] text-red-500/80 mt-1">Filtrar unidades con service vencido</p>
      </button>

      <button
        type="button"
        onClick={() => navigateToVehiclesWithFilter('docs_vencidos')}
        className={`kpi-card text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
          docsDueVehicles.length > 0 ? '!border-red-200 !bg-red-50/70' : ''
        } ${view === 'vehicles' && vehicleFilter === 'docs_vencidos' ? 'ring-2 ring-red-500' : ''}`}
      >
        <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-2">
          <span className="flex items-center gap-2"><FileText size={16} className="text-red-500" /> Docs. Vencidos</span>
          <ChevronRight size={14} className="text-red-400" />
        </div>
        <p className="text-2xl font-black text-red-600 font-mono relative z-10">{totalExpiredDocsCount}</p>
        <p className="text-[11px] text-red-500/80 mt-1">
          {docsDueVehicles.length} {docsDueVehicles.length === 1 ? 'unidad' : 'unidades'} (Seguro / VTV)
        </p>
      </button>

      <button
        type="button"
        onClick={() => navigateToVehiclesWithFilter('prox_7d')}
        className={`kpi-card text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
          maintenanceSoon.length > 0 ? '!border-yellow-200 !bg-yellow-50/70' : ''
        } ${view === 'vehicles' && vehicleFilter === 'prox_7d' ? 'ring-2 ring-amber-500' : ''}`}
      >
        <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-2">
          <span className="flex items-center gap-2"><Clock size={16} className="text-yellow-500" /> Próx. 7 días</span>
          <ChevronRight size={14} className="text-yellow-500" />
        </div>
        <p className="text-2xl font-black text-yellow-600 font-mono relative z-10">{maintenanceSoon.length}</p>
        <p className="text-[11px] text-yellow-600/80 mt-1">Próximos por fecha, km u hs</p>
      </button>

      <button
        type="button"
        onClick={() => navigateToVehiclesWithFilter('mant_prog')}
        className={`kpi-card text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
          view === 'vehicles' && vehicleFilter === 'mant_prog' ? 'ring-2 ring-amber-500 !border-amber-400' : ''
        }`}
      >
        <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-2">
          <span className="flex items-center gap-2"><Wrench size={16} className="text-amber-500" /> Con Mant. Prog.</span>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
        <p className="text-2xl font-black text-amber-600 font-mono relative z-10">{allMaintenance.length}</p>
        <p className="text-[11px] text-gray-400 mt-1">Unidades con plan activo</p>
      </button>
    </div>
  );

  if (view === 'daily_report') {
    return <VehicleDailyReportModule onBack={navigateToOverview} />;
  }

  if (view === 'fuel') {
    return (
      <div className="space-y-4">
        <button onClick={navigateToOverview} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota y Maquinaria
        </button>
        <FuelModule />
      </div>
    );
  }

  if (view === 'tracking') {
    return (
      <div className="space-y-4 h-[calc(100vh-12rem)]">
        <button onClick={navigateToOverview} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota y Maquinaria
        </button>
        <FleetTrackingMap />
      </div>
    );
  }

  if (view === 'drivers') {
    return (
      <div className="space-y-4">
        <button onClick={navigateToOverview} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota y Maquinaria
        </button>
        <DriversRegistryModule />
      </div>
    );
  }

  if (view === 'vehicle_kpis') {
    return (
      <div className="space-y-4">
        <button onClick={navigateToOverview} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota y Maquinaria
        </button>
        <VehiclesRegistryModule />
      </div>
    );
  }

  if (view === 'maintenance') {
    return (
      <div className="space-y-4">
        <button onClick={navigateToOverview} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Flota y Maquinaria
        </button>

        {/* Header and Tabs (3.3 Sin pestaña Neumáticos) */}
        <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Wrench size={120} /></div>
          <div className="relative z-10">
            <h3 className="font-bold text-2xl flex items-center gap-2"><Wrench size={24} /> Taller y Mantenimiento</h3>
            <p className="text-ecar-blueLight text-sm mt-1">
              Control de service preventivo y órdenes de taller vinculadas a Compras
            </p>
          </div>

          <div className="flex gap-4 mt-6 border-b border-blue-400/50 relative z-10">
            <button
              type="button"
              onClick={() => setMaintenanceTab('schedule')}
              className={`pb-2 px-2 text-sm font-bold transition-colors cursor-pointer ${
                maintenanceTab === 'schedule' ? 'text-white border-b-2 border-white' : 'text-ecar-blueLight hover:text-white'
              }`}
            >
              Cronograma Service
            </button>
            <button
              type="button"
              onClick={() => setMaintenanceTab('workshop')}
              className={`pb-2 px-2 text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                maintenanceTab === 'workshop' ? 'text-white border-b-2 border-white' : 'text-ecar-blueLight hover:text-white'
              }`}
            >
              <span>Órdenes de Taller</span>
              {pendingOtCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-900">
                  {pendingOtCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {maintenanceTab === 'workshop' && (
          <WorkshopPanel
            initialVehicleDraft={otDraftVehicle}
            onClearInitialDraft={() => setOtDraftVehicle(null)}
          />
        )}

        {maintenanceTab === 'schedule' && (
          <div className="space-y-4">
            {/* Alerts Vencidos */}
            {maintenanceDue.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle size={16} /> Mantenimiento vencido o por kilometraje/horas excedidas ({maintenanceDue.length})
                </p>
                {maintenanceDue.map(v => {
                  const check = checkVehicleMaintenance(v);
                  return (
                    <div key={v.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span>
                        <div>
                          <p className="font-bold text-sm text-gray-800">{v.code} — {v.description}</p>
                          <p className="text-xs text-red-600 font-medium">
                            ⚠️ {check.summary} · {check.detail}
                          </p>
                          {v.maintenance_notes && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5">{v.maintenance_notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleGenerateWorkOrder(e, v)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Wrench size={13} /> Generar OT Taller
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openCompleteMaintenanceModal(e, v)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 size={13} /> Completado
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alerts Próximos */}
            {maintenanceSoon.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <Clock size={16} /> Próximos a vencer (a menos de 500 km, 50 hs o 7 días) ({maintenanceSoon.length})
                </p>
                {maintenanceSoon.map(v => {
                  const check = checkVehicleMaintenance(v);
                  return (
                    <div key={v.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span>
                        <div>
                          <p className="font-bold text-sm text-gray-800">{v.code} — {v.description}</p>
                          <p className="text-xs text-amber-700 font-medium">
                            🕒 {check.summary} · {check.detail}
                          </p>
                          {v.maintenance_notes && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5">{v.maintenance_notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleGenerateWorkOrder(e, v)}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Wrench size={13} /> Programar OT
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Calendario de Mantenimiento Preventivo</h3>
                <span className="text-xs text-gray-500">{allMaintenance.length} vehículos programados</span>
              </div>
              {allMaintenance.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Wrench size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No hay mantenimientos programados</p>
                  <p className="text-sm">Editá un vehículo para agendar su próximo service por km, horas o fecha</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Vehículo</th>
                        <th>Control</th>
                        <th>Próximo Service</th>
                        <th>Lectura Actual</th>
                        <th>Margen</th>
                        <th>Notas</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMaintenance.map(v => {
                        const check = checkVehicleMaintenance(v);
                        const isHours = v.tracking_type === 'hours';
                        const currentReading = isHours ? (v.current_hours ?? 0) : (v.current_km ?? 0);
                        const targetReading = isHours ? v.next_maintenance_hours : v.next_maintenance_km;

                        return (
                          <tr key={v.id} className={check.isOverdue ? 'bg-red-50/50' : check.isSoon ? 'bg-amber-50/40' : ''}>
                            <td className="font-medium">
                              <span className="mr-1">{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span>
                              {v.code} — <span className="text-gray-600 font-normal">{v.description}</span>
                            </td>
                            <td className="text-xs">
                              <span className="badge badge-neutral">
                                {isHours ? 'Horómetro (hs)' : 'Odómetro (km)'}
                              </span>
                            </td>
                            <td className="font-mono text-xs font-semibold">
                              {targetReading ? (isHours ? `${targetReading.toLocaleString()} hs` : `${targetReading.toLocaleString()} km`) : (v.next_maintenance_date || '—')}
                            </td>
                            <td className="font-mono text-xs text-gray-700">
                              {currentReading ? (isHours ? `${currentReading.toLocaleString()} hs` : `${currentReading.toLocaleString()} km`) : '0'}
                            </td>
                            <td className="text-xs font-medium">
                              <span className={check.isOverdue ? 'text-red-700 font-bold' : check.isSoon ? 'text-amber-700 font-bold' : 'text-emerald-700'}>
                                {check.detail}
                              </span>
                            </td>
                            <td className="text-xs text-gray-500 max-w-[200px] truncate" title={v.maintenance_notes || ''}>
                              {v.maintenance_notes || '—'}
                            </td>
                            <td>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${check.badgeClass}`}>
                                {check.isOverdue ? 'Vencido' : check.isSoon ? 'Próximo' : 'En término'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleGenerateWorkOrder(e, v)}
                                  title="Generar Orden de Trabajo en Taller"
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  <Wrench size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => openCompleteMaintenanceModal(e, v)}
                                  title="Marcar Mantenimiento Completado"
                                  className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
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
          </div>
        )}

        {/* 3.2 Modal de Confirmación de Service Completado */}
        <ModalPortal isOpen={!!completeModalVehicle} onClose={() => setCompleteModalVehicle(null)} maxWidth="max-w-lg">
          {completeModalVehicle && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 size={20} /> Confirmar Service Completado
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {completeModalVehicle.code} — {completeModalVehicle.description}
                  </p>
                </div>
                <button type="button" onClick={() => setCompleteModalVehicle(null)} className="text-white/70 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConfirmCompleteMaintenance} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Fecha de Realización *
                    </label>
                    <input
                      type="date"
                      value={completeDate}
                      onChange={e => setCompleteDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Lectura Actual ({completeModalVehicle.tracking_type === 'hours' ? 'Hs' : 'Km'}) *
                    </label>
                    <input
                      type="number"
                      step={completeModalVehicle.tracking_type === 'hours' ? '0.1' : '1'}
                      value={completeCurrentReading}
                      onChange={e => setCompleteCurrentReading(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Próximo Service ({completeModalVehicle.tracking_type === 'hours' ? 'Hs' : 'Km'})
                    </label>
                    <input
                      type="number"
                      step={completeModalVehicle.tracking_type === 'hours' ? '0.1' : '1'}
                      value={completeNextReading}
                      onChange={e => setCompleteNextReading(e.target.value)}
                      placeholder="Ej: +10.000 km / +250 hs"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Próxima Fecha Service (opcional)
                    </label>
                    <input
                      type="date"
                      value={completeNextDate}
                      onChange={e => setCompleteNextDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Observación / Trabajo Realizado
                  </label>
                  <textarea
                    rows={2}
                    value={completeNotes}
                    onChange={e => setCompleteNotes(e.target.value)}
                    placeholder="Ej: Cambio de aceite y filtros, revisión general..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCompleteModalVehicle(null)}
                    className="btn-secondary cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateVehicle.isPending}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Confirmar Service
                  </button>
                </div>
              </form>
            </div>
          )}
        </ModalPortal>
      </div>
    );
  }

  // ======== 1.1 & 1.2: DEDICATED VEHICLES LIST & ABM VIEW ('vehicles') ========
  if (view === 'vehicles') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={navigateToOverview}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a Portada de Flota
          </button>
        </div>

        {/* Clickable KPI Cards to switch filters in 1 click */}
        {renderClickableKpiCards()}

        {/* Vehicle List + ABM */}
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-gray-800 text-base">
                Vehículos Registrados ({filteredVehicles.length})
              </h3>
              {vehicleFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-ecar-blue text-white shadow-xs">
                  <span>Filtro: {FILTER_LABELS[vehicleFilter]}</span>
                  <button
                    type="button"
                    onClick={() => navigateToVehiclesWithFilter('all')}
                    className="hover:text-amber-300 cursor-pointer ml-1"
                    title="Quitar filtro"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={vehicleSearch}
                  onChange={e => setVehicleSearch(e.target.value)}
                  placeholder="Buscar código, patente, marca..."
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs bg-white w-56"
                />
              </div>
              <button onClick={() => setShowNew(true)} className="btn-primary cursor-pointer">
                <Plus size={16} /> Nuevo Vehículo
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Truck size={40} className="mx-auto mb-2 opacity-30" />
                <p className="font-medium">No hay unidades para el filtro seleccionado</p>
                {vehicleFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => navigateToVehiclesWithFilter('all')}
                    className="mt-2 text-xs font-bold text-ecar-blue hover:underline cursor-pointer"
                  >
                    Ver todos los vehículos ({vehicles.length})
                  </button>
                )}
              </div>
            ) : (
              filteredVehicles.map(v => {
                const isBatan = isBatanUnit(v);
                const maintCheck = checkVehicleMaintenance(v);
                const overdue = !isBatan && maintCheck.isOverdue;
                const soon = !isBatan && maintCheck.isSoon;
                const expiredDocs = getVehicleExpiredDocuments(v);
                const vtvOverdue = !isBatan && isDueOrOverdue(v.vtv_expiry);
                const insuranceOverdue = !isBatan && isDueOrOverdue(v.insurance_expiry);
                const isEditing = editId === v.id;
                const isExpanded = expandedIds.has(v.id);

                const toggleExpand = () => {
                  const newSet = new Set(expandedIds);
                  if (newSet.has(v.id)) newSet.delete(v.id);
                  else newSet.add(v.id);
                  setExpandedIds(newSet);
                };

                const batanCapacity = v.tank_capacity_liters || (v.code?.toUpperCase() === 'BT-001' ? 200 : 100);
                const batanStock = v.code?.toUpperCase() === 'BT-001' ? currentBatanStockLiters : (v.tank_capacity_liters || 0);

                return (
                  <div
                    key={v.id}
                    className={`p-4 transition-colors ${
                      overdue || vtvOverdue || insuranceOverdue ? 'bg-red-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button onClick={toggleExpand} className="mt-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <div
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 cursor-pointer"
                        onClick={toggleExpand}
                      >
                        {isBatan ? '🛢️' : VEHICLE_ICON[v.vehicle_type] || '🚐'}
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={toggleExpand}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-800">{v.code}</span>
                          <span className="text-sm text-gray-600">{v.description}</span>
                          {!isBatan && v.plate && (
                            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v.plate}</span>
                          )}
                          {isBatan && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                              <Droplets size={11} /> Recipiente de Combustible
                            </span>
                          )}
                          {overdue && (
                            <span className="badge badge-danger text-[10px] flex items-center gap-1">
                              <AlertTriangle size={10} /> Service vencido (
                              {maintCheck.primaryReason === 'hours'
                                ? 'Horas'
                                : maintCheck.primaryReason === 'km'
                                  ? 'Km'
                                  : 'Fecha'}
                              )
                            </span>
                          )}
                          {!overdue && soon && (
                            <span className="badge badge-warning text-[10px]">
                              Service próximo ({maintCheck.detail})
                            </span>
                          )}
                          {/* 1.1 Mostrar claramente qué documento está vencido y su fecha exacta */}
                          {expiredDocs.map(doc => (
                            <span
                              key={doc.type}
                              className="badge badge-danger text-[10px] flex items-center gap-1 font-bold"
                            >
                              {doc.type === 'Seguro' ? <Shield size={10} /> : <FileText size={10} />}
                              {doc.type} Vencido ({doc.expiryDate})
                            </span>
                          ))}

                          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-xs">
                            <IosToggleSwitch
                              size="sm"
                              checked={v.vehicle_condition === 'fuera_de_servicio'}
                              onChange={async (isFuera) => {
                                const newCondition = isFuera ? 'fuera_de_servicio' : 'operativo';
                                try {
                                  await updateVehicle.mutateAsync({ id: v.id, vehicle_condition: newCondition });
                                  useModalStore.getState().showAlert(
                                    'Estado de Unidad Actualizado',
                                    isFuera
                                      ? `🔴 La unidad ${v.code} fue marcada como FUERA DE SERVICIO.`
                                      : `🟢 La unidad ${v.code} se habilitó como OPERATIVA (En Servicio).`
                                  );
                                } catch (err: any) {
                                  useModalStore.getState().showAlert('Error', err?.message || 'No se pudo cambiar el estado.');
                                }
                              }}
                            />
                            <span
                              className={`text-[10px] font-extrabold ${
                                v.vehicle_condition === 'fuera_de_servicio' ? 'text-red-600' : 'text-emerald-700'
                              }`}
                            >
                              {v.vehicle_condition === 'fuera_de_servicio' ? '🔴 Fuera de servicio' : '🟢 En servicio'}
                            </span>
                          </div>
                        </div>

                        {/* 4.4 Batanes muestran Stock actual (L) y Capacidad (L) sin km ni service ni Seguro/VTV */}
                        {isBatan ? (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-600">
                            <span className="font-semibold text-sky-700 flex items-center gap-1">
                              <Droplets size={12} />
                              {v.code?.toUpperCase() === 'BT-001'
                                ? `Stock actual: ${batanStock} L · Capacidad: ${batanCapacity} L`
                                : `Capacidad: ${v.tank_capacity_liters ? `${v.tank_capacity_liters} L` : 'Recipiente auxiliar'}`}
                            </span>
                            {v.preferred_fuel && (
                              <span className="text-gray-500">Combustible: {v.preferred_fuel}</span>
                            )}
                            <span className="text-gray-400 italic">Sin odómetro / Sin service por km u hs</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                            {v.brand && <span>{v.brand} {v.model || ''}</span>}
                            {v.year && <span>Año {v.year}</span>}
                            <span className="flex items-center gap-1">
                              <Gauge size={10} />
                              {v.tracking_type === 'hours'
                                ? v.current_hours
                                  ? `${v.current_hours.toLocaleString()} hs`
                                  : 'Sin hs'
                                : v.current_km
                                  ? `${v.current_km.toLocaleString()} km`
                                  : 'Sin km'}
                            </span>
                            {maintCheck.summary && (
                              <span
                                className={`flex items-center gap-1 font-medium ${
                                  overdue ? 'text-red-600 font-bold' : soon ? 'text-amber-600 font-bold' : 'text-gray-500'
                                }`}
                              >
                                <Wrench size={10} /> Próx: {maintCheck.summary}
                              </span>
                            )}
                            {v.insurance_expiry && (
                              <span className={`flex items-center gap-1 ${insuranceOverdue ? 'text-red-600 font-bold' : ''}`}>
                                <Shield size={10} /> Seguro: {v.insurance_expiry}
                              </span>
                            )}
                            {v.vtv_expiry && (
                              <span className={`flex items-center gap-1 ${vtvOverdue ? 'text-red-600 font-bold' : ''}`}>
                                <FileText size={10} /> VTV: {v.vtv_expiry}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => (isEditing ? setEditId(null) : startEdit(v))}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
                            isEditing ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                          }`}
                          title="Editar unidad"
                        >
                          {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                        </button>
                        <button
                          onClick={() => setQrVehicle(v)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-500 transition-all cursor-pointer"
                          title="Imprimir QR para Parte Diario"
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                          title="Eliminar vehículo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Edit inline */}
                    {isEditing && (
                      <div className="mt-3 ml-14 bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                            editForm.vehicle_condition === 'fuera_de_servicio'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                              Estado Operativo de la Unidad
                            </span>
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
                                setEditForm(f => ({
                                  ...f,
                                  vehicle_condition: isFuera ? 'fuera_de_servicio' : 'operativo',
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Datos de la Unidad</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500">Código</label>
                            <input
                              value={editForm.code ?? ''}
                              onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500">Descripción</label>
                            <input
                              value={editForm.description ?? ''}
                              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500">Tipo</label>
                            <select
                              value={editForm.vehicle_type ?? ''}
                              onChange={e => {
                                const vt = e.target.value;
                                setEditForm({
                                  ...editForm,
                                  vehicle_type: vt,
                                  tracking_type: vt === 'maquinaria' ? 'hours' : editForm.tracking_type,
                                });
                              }}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                              <option value="camion">Camión</option>
                              <option value="camioneta">Camioneta</option>
                              <option value="auto">Auto</option>
                              <option value="maquinaria">Maquinaria</option>
                              <option value="moto">Moto</option>
                              <option value="batan">Batán / Recipiente de combustible</option>
                              <option value="otro">Otro</option>
                            </select>
                          </div>
                          {!isBatanUnit(editForm) && (
                            <>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Patente</label>
                                <input
                                  value={editForm.plate ?? ''}
                                  onChange={e => setEditForm({ ...editForm, plate: e.target.value || null })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono uppercase"
                                  placeholder="ABC123"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Marca</label>
                                <input
                                  value={editForm.brand ?? ''}
                                  onChange={e => setEditForm({ ...editForm, brand: e.target.value || null })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                                  placeholder="Toyota"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Modelo</label>
                                <input
                                  value={editForm.model ?? ''}
                                  onChange={e => setEditForm({ ...editForm, model: e.target.value || null })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                                  placeholder="Hilux 2.4"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Año</label>
                                <input
                                  type="number"
                                  value={editForm.year ?? ''}
                                  onChange={e => setEditForm({ ...editForm, year: parseInt(e.target.value) || null })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                                  placeholder="2024"
                                />
                              </div>
                            </>
                          )}
                          <div>
                            <label className="text-xs font-bold text-gray-500">Combustible</label>
                            <select
                              value={editForm.preferred_fuel ?? ''}
                              onChange={e => setEditForm({ ...editForm, preferred_fuel: e.target.value || null })}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                              <option value="diesel">Diesel</option>
                              <option value="nafta_super">Nafta Súper</option>
                              <option value="nafta_premium">Nafta Premium</option>
                              <option value="gnc">GNC</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500">Capacidad (L)</label>
                            <input
                              type="number"
                              value={editForm.tank_capacity_liters ?? ''}
                              onChange={e =>
                                setEditForm({ ...editForm, tank_capacity_liters: parseInt(e.target.value) || null })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500">Área</label>
                            <input
                              value={editForm.area ?? ''}
                              onChange={e => setEditForm({ ...editForm, area: e.target.value || null })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                              placeholder="Obra Norte"
                            />
                          </div>
                          {!isBatanUnit(editForm) && (
                            <div>
                              <label className="text-xs font-bold text-gray-500">Chofer Habitual</label>
                              <input
                                value={editForm.default_driver ?? ''}
                                onChange={e => setEditForm({ ...editForm, default_driver: e.target.value || null })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                                placeholder="Juan Pérez"
                              />
                            </div>
                          )}
                        </div>

                        {!isBatanUnit(editForm) && (
                          <div className="border-t border-gray-200 pt-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Mantenimiento y Documentación
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-500">Medición</label>
                                <select
                                  value={editForm.tracking_type || 'km'}
                                  onChange={e =>
                                    setEditForm({ ...editForm, tracking_type: e.target.value as 'km' | 'hours' })
                                  }
                                  className="w-full px-3 py-2 border rounded-xl text-sm"
                                >
                                  <option value="km">Kilómetros</option>
                                  <option value="hours">Horas (Maquinaria)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">
                                  {editForm.tracking_type === 'hours' ? 'Hs Actuales' : 'Km Actuales'}
                                </label>
                                {editForm.tracking_type === 'hours' ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editForm.current_hours ?? ''}
                                    onChange={e =>
                                      setEditForm({ ...editForm, current_hours: parseFloat(e.target.value) || 0 })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                                    placeholder="0"
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    value={editForm.current_km ?? ''}
                                    onChange={e =>
                                      setEditForm({ ...editForm, current_km: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                                    placeholder="0"
                                  />
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Próx. Mantenimiento</label>
                                <input
                                  type="date"
                                  value={editForm.next_maintenance_date ?? ''}
                                  onChange={e =>
                                    setEditForm({ ...editForm, next_maintenance_date: e.target.value || null })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">
                                  {editForm.tracking_type === 'hours' ? 'Hs Mantenimiento' : 'Km Mantenimiento'}
                                </label>
                                {editForm.tracking_type === 'hours' ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editForm.next_maintenance_hours ?? ''}
                                    onChange={e =>
                                      setEditForm({
                                        ...editForm,
                                        next_maintenance_hours: parseFloat(e.target.value) || null,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                                    placeholder="250"
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    value={editForm.next_maintenance_km ?? ''}
                                    onChange={e =>
                                      setEditForm({
                                        ...editForm,
                                        next_maintenance_km: parseInt(e.target.value) || null,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                                    placeholder="50000"
                                  />
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Venc. Seguro</label>
                                <input
                                  type="date"
                                  value={editForm.insurance_expiry ?? ''}
                                  onChange={e =>
                                    setEditForm({ ...editForm, insurance_expiry: e.target.value || null })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Venc. VTV</label>
                                <input
                                  type="date"
                                  value={editForm.vtv_expiry ?? ''}
                                  onChange={e => setEditForm({ ...editForm, vtv_expiry: e.target.value || null })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500">Notas Mantenimiento</label>
                                <input
                                  value={editForm.maintenance_notes ?? ''}
                                  onChange={e =>
                                    setEditForm({ ...editForm, maintenance_notes: e.target.value || null })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                                  placeholder="Cambio aceite + filtros"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={saveEdit}
                          disabled={updateVehicle.isPending}
                          className="btn-primary disabled:opacity-50 cursor-pointer"
                        >
                          {updateVehicle.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={16} /> Guardar Cambios
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Expanded View (QR and Fuel) */}
                    {isExpanded && !isEditing && <VehicleExpandedData vehicleId={v.id} />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Nuevo Vehículo */}
        <ModalPortal isOpen={showNew} onClose={() => setShowNew(false)} maxWidth="max-w-xl">
          <div className="bg-white rounded-xl shadow-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nuevo Vehículo / Unidad</h3>
              <button onClick={() => setShowNew(false)} className="cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Código *</label>
                  <input
                    value={newForm.code}
                    onChange={e => setNewForm({ ...newForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="C-002"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Tipo</label>
                  <select
                    value={newForm.vehicle_type}
                    onChange={e => {
                      const vt = e.target.value;
                      setNewForm({
                        ...newForm,
                        vehicle_type: vt,
                        tracking_type: vt === 'maquinaria' ? 'hours' : newForm.tracking_type,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="camion">Camión</option>
                    <option value="camioneta">Camioneta</option>
                    <option value="auto">Auto</option>
                    <option value="maquinaria">Maquinaria</option>
                    <option value="moto">Moto</option>
                    <option value="batan">Batán / Recipiente de combustible</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                {newForm.vehicle_type !== 'batan' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500">Medición Uso</label>
                    <select
                      value={newForm.tracking_type}
                      onChange={e => setNewForm({ ...newForm, tracking_type: e.target.value as 'km' | 'hours' })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="km">Kilómetros</option>
                      <option value="hours">Horas (Maquinaria)</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Descripción *</label>
                <input
                  value={newForm.description}
                  onChange={e => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  placeholder="Toyota Hilux 2.4 DX"
                  required
                />
              </div>
              {newForm.vehicle_type !== 'batan' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Marca</label>
                    <input
                      value={newForm.brand}
                      onChange={e => setNewForm({ ...newForm, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      placeholder="Toyota"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Modelo</label>
                    <input
                      value={newForm.model}
                      onChange={e => setNewForm({ ...newForm, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      placeholder="Hilux 2.4"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Año</label>
                    <input
                      type="number"
                      value={newForm.year}
                      onChange={e => setNewForm({ ...newForm, year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                      placeholder="2024"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {newForm.vehicle_type !== 'batan' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500">Patente</label>
                    <input
                      value={newForm.plate}
                      onChange={e => setNewForm({ ...newForm, plate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono uppercase"
                      placeholder="ABC123"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-500">Combustible</label>
                  <select
                    value={newForm.preferred_fuel}
                    onChange={e => setNewForm({ ...newForm, preferred_fuel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="nafta_super">Nafta Súper</option>
                    <option value="nafta_premium">Nafta Premium</option>
                    <option value="gnc">GNC</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Capacidad Tanque (L)</label>
                  <input
                    type="number"
                    value={newForm.tank_capacity_liters}
                    onChange={e => setNewForm({ ...newForm, tank_capacity_liters: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="80"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Área</label>
                  <input
                    value={newForm.area}
                    onChange={e => setNewForm({ ...newForm, area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    placeholder="Obra Norte"
                  />
                </div>
                {newForm.vehicle_type !== 'batan' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500">Chofer Habitual</label>
                    <input
                      value={newForm.default_driver}
                      onChange={e => setNewForm({ ...newForm, default_driver: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      placeholder="Juan Pérez"
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={createVehicle.isPending}
                className="btn-primary w-full justify-center disabled:opacity-50 cursor-pointer"
              >
                {createVehicle.isPending ? 'Creando...' : '🚛 Registrar Unidad'}
              </button>
            </form>
          </div>
        </ModalPortal>

        {/* QR Modal */}
        <ModalPortal isOpen={!!qrVehicle} onClose={() => setQrVehicle(null)} maxWidth="max-w-sm">
          {qrVehicle && (
            <div className="bg-white rounded-xl shadow-xl w-full overflow-hidden text-center p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-1">{qrVehicle.code}</h3>
              <p className="text-sm text-gray-500 mb-6">Escaneá este código para iniciar el Parte Diario.</p>
              <div className="bg-white p-4 inline-block border-4 border-ecar-blue rounded-xl mb-4" id="qr-print-area">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    window.location.origin + '/checkin/' + qrVehicle.id
                  )}`}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-xs text-blue-600 break-all bg-blue-50 p-2 rounded mb-6 font-mono border border-blue-100">
                {window.location.origin + '/checkin/' + qrVehicle.id}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setQrVehicle(null)} className="btn-secondary flex-1 cursor-pointer">
                  Cerrar
                </button>
                <button
                  onClick={() => window.open(window.location.origin + '/checkin/' + qrVehicle.id, '_blank')}
                  className="btn-primary flex-1 cursor-pointer"
                >
                  Ver Link
                </button>
              </div>
            </div>
          )}
        </ModalPortal>
      </div>
    );
  }

  // ======== 1.1, 1.2 & 1.3: PORTADA DE FLOTA ('overview') — SOLO KPIs + MÓDULOS ========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-slate-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Truck size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Truck size={24} /> Flota y Maquinaria</h3>
          <p className="text-ecar-blueLight text-sm mt-1">
            Doc PR-GL-01 §4.5 — Registro de vehículos, mantenimiento preventivo y consumo de combustible
          </p>
        </div>
      </div>

      {/* 1.1 Clickable KPI Cards (Drill-down to filtered vehicles list) */}
      {renderClickableKpiCards()}

      {/* 1.2 & 1.3 Sub-modules grid (sin listado inferior y ocultando Choferes por feature flag) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <button onClick={() => setView('maintenance')} className="light-card p-6 text-center group cursor-pointer relative">
          {maintenanceDue.length > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
              <Bell size={10} /> {maintenanceDue.length} HOY
            </span>
          )}
          <Wrench size={48} className="mx-auto mb-3 text-amber-400 group-hover:text-amber-500 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-amber-700 transition-colors relative z-10">Mantenimiento</h4>
          <p className="text-sm text-gray-500 relative z-10">Calendario y OTs de Taller</p>
        </button>

        <button onClick={() => setView('fuel')} className="light-card p-6 text-center group cursor-pointer relative">
          <Fuel size={48} className="mx-auto mb-3 text-sky-400 group-hover:text-sky-500 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-sky-700 transition-colors relative z-10">Combustible</h4>
          <p className="text-sm text-gray-500 relative z-10">Registro de cargas</p>
        </button>

        <button onClick={() => setView('daily_report')} className="light-card p-6 text-center group cursor-pointer relative">
          <ClipboardCheck size={48} className="mx-auto mb-3 text-ecar-blue group-hover:text-sky-500 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-ecar-blue transition-colors relative z-10">Parte Diario</h4>
          <p className="text-sm text-gray-500 relative z-10">Inspección con QR</p>
        </button>

        <button onClick={() => setView('tracking')} className="light-card p-6 text-center group cursor-pointer relative">
          <Navigation size={48} className="mx-auto mb-3 text-emerald-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors relative z-10">Mapa en Vivo</h4>
          <p className="text-sm text-gray-500 relative z-10">Rastreo satelital</p>
        </button>

        {SHOW_DRIVERS_MODULE && (
          <button onClick={() => setView('drivers')} className="light-card p-6 text-center group cursor-pointer relative">
            <Users size={48} className="mx-auto mb-3 text-blue-500 group-hover:text-blue-600 group-hover:scale-110 transition-all relative z-10" />
            <h4 className="font-bold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors relative z-10">Choferes</h4>
            <p className="text-sm text-gray-500 relative z-10">Desempeño y KPIs</p>
          </button>
        )}

        <button onClick={() => setView('vehicle_kpis')} className="light-card p-6 text-center group cursor-pointer relative">
          <Gauge size={48} className="mx-auto mb-3 text-indigo-500 group-hover:text-indigo-600 group-hover:scale-110 transition-all relative z-10" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-700 transition-colors relative z-10">KPIs Flota</h4>
          <p className="text-sm text-gray-500 relative z-10">Análisis de unidades</p>
        </button>
      </div>
    </div>
  );
};
