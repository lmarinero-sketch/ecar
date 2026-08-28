import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Fuel, Plus, Truck, BarChart3, FileCheck, Droplets, Calendar, X, Check, Pencil, ClipboardCheck, Camera, PieChart, Info, Download, Trash2, Users, DollarSign, TrendingUp, Image as ImageIcon, Search, Eye, Gauge, Sliders, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useFuelVehicles, useFuelLoads, useCreateFuelLoad, useUpdateFuelLoad, useDeleteFuelLoad, useFuelBatanMovements, useCreateFuelBatanMovement, useProjects } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useStore';
import { useModalStore } from '../store/useModalStore';
import type { FuelVehicle, FuelLoad } from '../lib/types';
import { useImplementationStore } from '../store/useImplementationStore';
import { generateFuelValePdf } from '../lib/generateFuelValePdf';
import { FuelTicketScannerModal } from './FuelTicketScannerModal';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const STATIONS = ['YPF', 'Shell', 'Axion', 'Puma', 'YPF Agro', 'Shell Agro', 'Batán Interno', 'Estación Obra', 'Otro'];
const FUEL_TYPES = [
  'Diesel 500 / Ultradiesel',
  'Diesel Premium / V-Power',
  'Diesel EVOLUX',
  'Nafta Súper',
  'Nafta Premium',
  'Aceite / Lubricante',
  'Otro'
];

const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCurrency = (n: number) => `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Tab = 'loads' | 'requests' | 'batan' | 'fleet' | 'dashboard';

export const FuelModule: React.FC = () => {
  const [tab, setTab] = useState<Tab>('loads');

  useEffect(() => {
    if (tab === 'loads') {
      useImplementationStore.getState().completeItem('e60');
    } else if (tab === 'batan') {
      useImplementationStore.getState().completeItem('e61');
    }
  }, [tab]);

  const [showForm, setShowForm] = useState(false);
  const { data: vehicles = [] } = useFuelVehicles();
  const { data: loads = [] } = useFuelLoads();
  const { data: batanMovements = [] } = useFuelBatanMovements();
  const { data: projects = [] } = useProjects();
  const createLoad = useCreateFuelLoad();
  const updateLoad = useUpdateFuelLoad();
  const createBatan = useCreateFuelBatanMovement();

  const now = new Date();
  const currentMonth = MONTHS_ES[now.getMonth()];
  const monthLoads = useMemo(() => loads.filter(l => l.month === currentMonth && l.year === now.getFullYear()), [loads, currentMonth]);
  const totalLiters = monthLoads.reduce((s, l) => s + (l.liters || 0), 0);
  const totalAmount = monthLoads.reduce((s, l) => s + (l.total_amount || 0), 0);

  // Robust Batán movement calculations & running stock tracking
  const enrichedBatanMovements = useMemo(() => {
    if (!batanMovements || batanMovements.length === 0) return [];
    
    // Sort chronologically (oldest first)
    const sorted = [...batanMovements].sort((a, b) => {
      const dateA = new Date(a.movement_date || a.created_at).getTime();
      const dateB = new Date(b.movement_date || b.created_at).getTime();
      return dateA - dateB;
    });

    let runningStock = 200; // Nominal initial stock
    if (sorted.length > 0 && ((sorted[0].movement_type as string) === 'purchase' || (sorted[0].movement_type as string) === 'ingreso')) {
      runningStock = 0;
    }

    const result = sorted.map(m => {
      const typeStr = (m.movement_type || '') as string;
      const isPurchase = typeStr === 'purchase' || typeStr === 'ingreso';
      const isDischarge = typeStr === 'discharge' || typeStr === 'egreso';
      const isAdjustment = typeStr === 'adjustment' || typeStr === 'ajuste';

      // Retroactive resolution for vehicle_code, driver_name, project_name if null on past records
      let resolvedVehicleCode: string | null = m.vehicle_code || null;
      let resolvedDriverName: string | null = m.driver_name || null;
      let resolvedProjectName: string | null = m.project_name || null;

      const refLoad = (m as any).reference_load;

      if (!resolvedVehicleCode && isDischarge) {
        const matchedLoad = loads.find(l => {
          if (refLoad && l.load_number === refLoad) return true;
          if (m.observations && l.load_number && m.observations.includes(l.load_number)) return true;
          if (l.load_date === m.movement_date && Math.abs((l.liters || 0) - (m.liters_discharged || 0)) < 0.05) return true;
          return false;
        });

        if (matchedLoad) {
          resolvedVehicleCode = matchedLoad.vehicle_code || null;
          resolvedDriverName = resolvedDriverName || matchedLoad.driver_name || matchedLoad.requested_by || null;
          resolvedProjectName = resolvedProjectName || matchedLoad.project_name || null;
        } else if (m.observations) {
          const match = m.observations.match(/\(([^)]+)\)/);
          if (match && match[1]) {
            resolvedVehicleCode = match[1].trim();
          }
        }
      }

      if (isPurchase) {
        runningStock += (m.liters_loaded || 0);
      } else if (isDischarge) {
        runningStock -= (m.liters_discharged || 0);
      } else if (isAdjustment) {
        if (m.balance_after !== null && m.balance_after !== undefined) {
          runningStock = Number(m.balance_after);
        } else if (m.liters_loaded !== null && m.liters_loaded !== undefined) {
          runningStock = Number(m.liters_loaded);
        }
      }

      const calcBal = (m.balance_after !== null && m.balance_after !== undefined && m.balance_after > 0)
        ? Number(m.balance_after)
        : Math.max(0, Number(runningStock.toFixed(2)));

      return {
        ...m,
        vehicle_code: resolvedVehicleCode,
        driver_name: resolvedDriverName,
        project_name: resolvedProjectName,
        computed_balance: calcBal
      };
    });

    return result.reverse();
  }, [batanMovements, loads]);

  const currentBatanStock = enrichedBatanMovements.length > 0 
    ? enrichedBatanMovements[0].computed_balance 
    : 200;

  const batanBalance = currentBatanStock;

  const { seenFuelRequests, markFuelRequestsSeen } = useAppStore();
  
  const pendingRequestsIds = useMemo(() => loads.filter(l => l.workflow_status === 'requested' || (l.workflow_status === 'completed' && l.unauthorized_load)).map(l => l.id), [loads]);
  const unseenRequestsCount = useMemo(() => pendingRequestsIds.filter(id => !seenFuelRequests.includes(id)).length, [pendingRequestsIds, seenFuelRequests]);

  useEffect(() => {
    if (tab === 'requests' && unseenRequestsCount > 0) {
      const unseenIds = pendingRequestsIds.filter(id => !seenFuelRequests.includes(id));
      if (unseenIds.length > 0) {
        markFuelRequestsSeen(unseenIds);
      }
    }
  }, [tab, unseenRequestsCount, pendingRequestsIds, seenFuelRequests, markFuelRequestsSeen]);

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'requests', label: 'Autorizaciones', icon: ClipboardCheck, badge: unseenRequestsCount },
    { id: 'loads', label: 'Cargas Realizadas', icon: Fuel },
    { id: 'dashboard', label: 'Dashboard & Analítica', icon: PieChart },
    { id: 'batan', label: 'Batán', icon: Droplets },
    { id: 'fleet', label: 'Flota', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Fuel size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Fuel size={24} /> Control de Combustible</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Gestión de vales, estaciones de servicio, consumo por vehículo y métricas de gasto</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 items-start">
        <div className="w-full space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI icon={Fuel} label={`Litros ${currentMonth}`} value={`${fmt(totalLiters)} L`} color="sky" />
            <KPI icon={BarChart3} label={`Importe ${currentMonth}`} value={totalAmount > 0 ? fmtCurrency(totalAmount) : 'Sin precio'} color="emerald" />
            <KPI icon={Calendar} label="Cargas del mes" value={String(monthLoads.length)} color="violet" />
            <KPI icon={Droplets} label="Saldo Batán" value={`${fmt(batanBalance)} L`} color="amber" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === t.id ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <t.icon size={16} /> 
                {t.label}
                {(t.badge || 0) > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === 'requests' && <RequestsTab loads={loads} vehicles={vehicles} updateLoad={updateLoad} createLoad={createLoad} projects={projects} createBatan={createBatan} />}
          {tab === 'loads' && <LoadsTab loads={loads} vehicles={vehicles} projects={projects} showForm={showForm} setShowForm={setShowForm} createLoad={createLoad} createBatan={createBatan} />}
          {tab === 'dashboard' && <FleetDashboardTab loads={loads} vehicles={vehicles} />}
          {tab === 'batan' && <BatanTab movements={enrichedBatanMovements} vehicles={vehicles} createBatan={createBatan} currentStock={currentBatanStock} />}
          {tab === 'fleet' && <FleetTab vehicles={vehicles} />}
        </div>
      </div>
    </div>
  );
};

/* ── KPI Card ── */
const KPI: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="light-card p-5">
    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Icon size={16} className={`text-${color}-500`} /> {label}</div>
    <p className={`text-xl font-black text-${color}-600 font-mono`}>{value}</p>
  </div>
);

/* ── Loads Tab ── */
const LoadsTab: React.FC<{ loads: FuelLoad[]; vehicles: FuelVehicle[]; projects: any[]; showForm: boolean; setShowForm: (v: boolean) => void; createLoad: any; createBatan: any }> = ({ loads, vehicles, projects, showForm, setShowForm, createLoad, createBatan }) => {
  const { user, isAdmin } = useAuth();
  const [viewingTicket, setViewingTicket] = useState<string | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Search & Filter state for global historical lookup
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterStation, setFilterStation] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');

  const [form, setForm] = useState<Partial<FuelLoad> & { fuel_source?: 'station' | 'batan'; custom_station?: string }>(() => {
    const d = new Date();
    return {
      load_date: d.toISOString().split('T')[0],
      month: MONTHS_ES[d.getMonth()],
      year: d.getFullYear(),
      day_of_week: DAYS_ES[d.getDay()],
      driver_name: user?.email || '',
      fuel_source: 'station',
      supplier: 'YPF',
      station_name: 'YPF',
      fuel_type: 'Diesel Premium / V-Power'
    };
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ liters: number; price_per_liter: number; total_amount: number; supplier: string; fuel_type: string }>({ liters: 0, price_per_liter: 0, total_amount: 0, supplier: 'YPF', fuel_type: 'Diesel Premium / V-Power' });
  const updateLoad = useUpdateFuelLoad();
  const deleteLoad = useDeleteFuelLoad();
  const userEmail = user?.email?.toLowerCase() || '';
  const canDelete = isAdmin || userEmail.includes('gustavo') || userEmail.includes('lucas');

  const isFormBatan = form.fuel_source === 'batan' || form.supplier === 'Batán Interno' || form.station_name === 'Batán Interno';

  // Multi-month & Multi-term filtering logic
  const filteredLoads = useMemo(() => {
    let list = loads;
    if (filterYear !== 'all') {
      list = list.filter(l => l.year === Number(filterYear) || (l.load_date && l.load_date.startsWith(filterYear)));
    }
    if (filterMonth !== 'all') {
      list = list.filter(l => l.month === filterMonth);
    }
    if (filterStation !== 'all') {
      list = list.filter(l => (l.supplier || l.station_name) === filterStation);
    }
    if (filterVehicle !== 'all') {
      list = list.filter(l => l.vehicle_code === filterVehicle || l.vehicle_id === filterVehicle);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(l =>
        (l.remito_number && l.remito_number.toLowerCase().includes(term)) ||
        (l.voucher_number && l.voucher_number.toLowerCase().includes(term)) ||
        (l.plate && l.plate.toLowerCase().includes(term)) ||
        (l.driver_name && l.driver_name.toLowerCase().includes(term)) ||
        (l.vehicle_code && l.vehicle_code.toLowerCase().includes(term)) ||
        (l.vehicle_description && l.vehicle_description.toLowerCase().includes(term)) ||
        (l.load_number && l.load_number.toLowerCase().includes(term)) ||
        (l.supplier && l.supplier.toLowerCase().includes(term)) ||
        (l.load_date && l.load_date.includes(term)) ||
        (l.liters && String(l.liters).includes(term))
      );
    }
    return list;
  }, [loads, filterYear, filterMonth, filterStation, filterVehicle, searchTerm]);

  const handleConfirmLoadFromScanner = (extracted: Partial<FuelLoad>) => {
    setForm(f => ({
      ...f,
      ...extracted,
      load_date: extracted.load_date || f.load_date,
      vehicle_code: extracted.vehicle_code || f.vehicle_code,
      vehicle_id: extracted.vehicle_id || f.vehicle_id,
      vehicle_description: extracted.vehicle_description || f.vehicle_description,
      plate: extracted.plate || f.plate,
      supplier: extracted.supplier || f.supplier,
      station_name: extracted.supplier || f.station_name,
      fuel_type: extracted.fuel_type || f.fuel_type,
      liters: extracted.liters || f.liters,
      price_per_liter: extracted.price_per_liter || f.price_per_liter,
      total_amount: extracted.total_amount || f.total_amount,
      driver_name: extracted.driver_name || f.driver_name,
      remito_number: extracted.remito_number || f.remito_number,
      voucher_number: extracted.voucher_number || f.voucher_number,
    }));
    setShowScannerModal(false);
    setShowForm(true);
  };

  const handleVehicleCode = (code: string) => {
    const v = vehicles.find(x => x.code === code);
    if (v) {
      setForm(f => ({ ...f, vehicle_code: code, vehicle_id: v.id, vehicle_description: v.description, plate: v.plate || '', vehicle_type: v.vehicle_type, fuel_type: v.preferred_fuel || f.fuel_type || 'Diesel Premium / V-Power' }));
    } else {
      setForm(f => ({ ...f, vehicle_code: code }));
    }
  };

  const handleDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    setForm(f => ({ ...f, load_date: dateStr, month: MONTHS_ES[dateObj.getMonth()], year: dateObj.getFullYear(), day_of_week: DAYS_ES[dateObj.getDay()] }));
  };

  const handleSubmit = async () => {
    const isBatan = form.fuel_source === 'batan' || form.supplier === 'Batán Interno' || form.station_name === 'Batán Interno';
    if (!form.load_date || !form.vehicle_code || !form.liters) {
      useModalStore.getState().showAlert("Atención", "Por favor, complete los datos básicos (Fecha, Vehículo, Litros).");
      return;
    }
    if (!isBatan && (!form.total_amount && !form.price_per_liter)) {
      useModalStore.getState().showAlert("Atención", "Por favor, ingrese el Importe Total o el Precio por Litro facturado.");
      return;
    }
    
    try {
      const nextNum = loads.length + 1;
      const finalAmount = isBatan ? 0 : (form.total_amount || 0);
      const finalPrice = isBatan ? 0 : (form.price_per_liter || (form.liters ? finalAmount / form.liters : 0));
      const finalSupplier = isBatan ? 'Batán Interno' : (form.supplier === 'Otro' ? (form.custom_station || 'Otro') : form.supplier);

      const { fuel_source, custom_station, ...validForm } = form;

      await createLoad.mutateAsync({
        ...validForm,
        load_number: `CARGA-${String(nextNum).padStart(4, '0')}`,
        validation_status: 'pending',
        load_source: isBatan ? 'batan' : (form.fuel_source || 'station'),
        created_by: 'web',
        supplier: finalSupplier,
        station_name: finalSupplier,
        total_amount: finalAmount,
        price_per_liter: finalPrice
      });

      if (isBatan) {
        await createBatan.mutateAsync({
          movement_number: `DESCARGA-${String(Date.now()).slice(-6)}`,
          movement_date: form.load_date,
          movement_type: 'discharge',
          fuel_type: form.fuel_type || 'Diesel Premium / V-Power',
          liters_discharged: form.liters,
          movement_status: 'completed',
          observations: `Consumo asociado a la carga: CARGA-${String(nextNum).padStart(4, '0')} (${form.vehicle_code})`
        });
      }

      useModalStore.getState().showAlert(
        'Carga Registrada', 
        isBatan 
          ? `✅ Carga a Batán Interno de ${form.liters} L registrada correctamente. Se descontaron ${form.liters} L del stock de Batán y el importe se guardó en $0.`
          : `✅ Carga de ${form.liters} L registrada correctamente.`
      );

      setForm({ fuel_source: 'station', supplier: 'YPF', station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power' });
      setShowForm(false);
    } catch (err: any) {
      console.error("Error al registrar carga:", err);
      useModalStore.getState().showAlert("Error al Guardar", err?.message || 'Error desconocido al registrar la carga.');
    }
  };

  const startEdit = (l: FuelLoad) => {
    setEditingId(l.id);
    setEditForm({
      liters: l.liters || 0,
      price_per_liter: l.price_per_liter || 0,
      total_amount: l.total_amount || 0,
      supplier: l.station_name || l.supplier || 'YPF',
      fuel_type: l.fuel_type || 'Diesel Premium / V-Power'
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateLoad.mutateAsync({
        id: editingId,
        liters: editForm.liters,
        price_per_liter: editForm.price_per_liter,
        total_amount: editForm.total_amount,
        supplier: editForm.supplier,
        station_name: editForm.supplier,
        fuel_type: editForm.fuel_type
      });
      setEditingId(null);
      useModalStore.getState().showAlert("Éxito", "Edición guardada correctamente.");
    } catch (err: any) {
      useModalStore.getState().showAlert("Error al Guardar", err.message || 'Error desconocido');
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Modal */}
      {showScannerModal && (
        <FuelTicketScannerModal
          vehicles={vehicles}
          onClose={() => setShowScannerModal(false)}
          onConfirmLoad={handleConfirmLoadFromScanner}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Fuel size={20} className="text-ecar-blue" />
          Registro de Cargas Realizadas
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-ecar-blue text-white font-bold text-xs shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2"
          >
            <Camera size={16} /> Escanear / Verificar Ticket IA
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancelar' : 'Nueva Carga'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="light-card p-5 space-y-4 border-2 border-sky-200">
          <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
            <Fuel size={18} className="text-sky-600" /> Registrar Carga de Combustible
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Fecha *</label>
              <input type="date" value={form.load_date || ''} onChange={e => handleDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Día</label>
              <input readOnly value={form.day_of_week || ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Mes</label>
              <input readOnly value={form.month || ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Año</label>
              <input readOnly value={form.year || ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Origen de Carga</label>
              <select value={form.fuel_source || (isFormBatan ? 'batan' : 'station')} onChange={e => {
                const s = e.target.value as 'station' | 'batan';
                if (s === 'batan') setForm(f => ({ ...f, fuel_source: s, price_per_liter: 0, total_amount: 0, supplier: 'Batán Interno', station_name: 'Batán Interno' }));
                else setForm(f => ({ ...f, fuel_source: s, supplier: 'YPF', station_name: 'YPF' }));
              }} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50 font-bold text-blue-700">
                <option value="station">Estación de Servicio</option>
                <option value="batan">Batán Interno</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Código Interno *</label>
              <select value={form.vehicle_code || ''} onChange={e => handleVehicleCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccioná vehículo...</option>
                {vehicles.map(v => <option key={v.id} value={v.code}>{v.code} — {v.description}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Vehículo</label>
              <input readOnly value={form.vehicle_description || ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Patente</label>
              <input readOnly value={form.plate || ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Tipo Unidad</label>
              <input readOnly value={form.vehicle_type || ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Responsable / Chofer</label>
              <input value={form.driver_name || ''} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} placeholder="Nombre del chofer" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Obra / Centro Costo</label>
              <select value={form.project_name || ''} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccioná...</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                <option value="Movimientos Internos">Movimientos Internos</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Estación de Servicio *</label>
              <select 
                disabled={isFormBatan}
                value={isFormBatan ? 'Batán Interno' : (form.supplier || 'YPF')} 
                onChange={e => {
                  const s = e.target.value;
                  if (s === 'Batán Interno') {
                    setForm(f => ({ ...f, fuel_source: 'batan', supplier: s, station_name: s, price_per_liter: 0, total_amount: 0 }));
                  } else {
                    setForm(f => ({ ...f, supplier: s, station_name: s }));
                  }
                }} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:opacity-80"
              >
                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {form.supplier === 'Otro' && (
                <input 
                  type="text" 
                  placeholder="Escribir nombre de estación..." 
                  value={form.custom_station || ''} 
                  onChange={e => setForm(f => ({ ...f, custom_station: e.target.value }))}
                  className="w-full mt-1.5 px-3 py-1.5 border border-sky-300 rounded-lg text-xs" 
                />
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Tipo de Combustible *</label>
              <select value={form.fuel_type || ''} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium">
                <option value="">Seleccioná...</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-sky-50/60 p-3 rounded-xl border border-sky-100">
            <div>
              <label className="text-xs font-bold text-sky-800">Litros Cargados *</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Ej: 50"
                value={form.liters || ''} 
                onChange={e => { 
                  const l = parseFloat(e.target.value) || 0; 
                  setForm(f => ({ ...f, liters: l, total_amount: isFormBatan ? 0 : l * (f.price_per_liter || 0) })); 
                }} 
                className="w-full px-3 py-2 border border-sky-300 rounded-xl text-sm font-mono font-bold bg-white" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-sky-800">$/Litro (Precio Unitario) *</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder={isFormBatan ? "0.00 (Interno)" : "Ej: 1250"}
                value={isFormBatan ? 0 : (form.price_per_liter || '')} 
                disabled={isFormBatan} 
                onChange={e => { 
                  const p = parseFloat(e.target.value) || 0; 
                  setForm(f => ({ ...f, price_per_liter: p, total_amount: (f.liters || 0) * p })); 
                }} 
                className="w-full px-3 py-2 border border-sky-300 rounded-xl text-sm font-mono font-bold text-gray-700 bg-gray-100/90 disabled:opacity-80" 
              />
              {isFormBatan && <span className="text-[10px] text-amber-700 font-bold block mt-0.5">🔒 $0 (Consumo Interno)</span>}
            </div>
            <div>
              <label className="text-xs font-bold text-sky-800">Importe Total ($) *</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder={isFormBatan ? "0.00 (Interno)" : "Ej: 62500"}
                value={isFormBatan ? 0 : (form.total_amount || '')} 
                disabled={isFormBatan} 
                onChange={e => { 
                  const t = parseFloat(e.target.value) || 0; 
                  setForm(f => ({ ...f, total_amount: t, price_per_liter: f.liters ? t / f.liters : f.price_per_liter })); 
                }} 
                className="w-full px-3 py-2 border border-sky-300 rounded-xl text-sm font-mono font-black text-sky-900 bg-gray-100/90 disabled:opacity-80" 
              />
              {isFormBatan && <span className="text-[10px] text-amber-700 font-bold block mt-0.5">🔒 $0 (Sin Factura Externa)</span>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">N° Vale / Comprobante</label>
              <input value={form.voucher_number || ''} onChange={e => setForm(f => ({ ...f, voucher_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">N° Remito / Factura</label>
              <input value={form.remito_number || ''} onChange={e => setForm(f => ({ ...f, remito_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Observaciones</label>
            <input value={form.observations || ''} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Observaciones opcionales..." />
          </div>

          <button onClick={handleSubmit} disabled={createLoad.isPending || !form.load_date || !form.vehicle_code || !form.liters || (!isFormBatan && !form.total_amount && !form.price_per_liter)} className="btn-primary disabled:opacity-50">
            <Check size={16} /> {createLoad.isPending ? 'Guardando...' : 'Registrar Carga'}
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="light-card p-4 space-y-3 bg-white border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° Remito (ej: 0014-00004686), Vale, Patente, Chofer, Litros..."
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-ecar-blueLight focus:border-ecar-blue font-medium"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Year Filter */}
          <div className="w-28">
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium"
            >
              <option value="all">Todos los años</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="w-36">
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium"
            >
              <option value="all">Todos los meses</option>
              {MONTHS_ES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Station Filter */}
          <div className="w-36">
            <select
              value={filterStation}
              onChange={e => setFilterStation(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium"
            >
              <option value="all">Todas las estaciones</option>
              {STATIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Filter */}
          <div className="w-36">
            <select
              value={filterVehicle}
              onChange={e => setFilterVehicle(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium"
            >
              <option value="all">Todos los vehículos</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.code}>{v.code} — {v.plate || v.description}</option>
              ))}
            </select>
          </div>

          {(searchTerm || filterMonth !== 'all' || filterStation !== 'all' || filterVehicle !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterMonth('all'); setFilterStation('all'); setFilterVehicle('all'); }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 py-1 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
          <span>Mostrando <strong>{filteredLoads.length}</strong> de <strong>{loads.length}</strong> cargas históricas</span>
          {searchTerm && <span className="text-ecar-blue font-semibold">🔍 Filtrado por: "{searchTerm}"</span>}
        </div>
      </div>

      {/* Table */}
      <div className="light-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID / Remito</th>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Estación</th>
              <th>Combustible</th>
              <th>Litros</th>
              <th>$/L</th>
              <th>Importe Total</th>
              <th>Chofer / Vale</th>
              <th>Estado</th>
              <th className="text-center">Editar / Borrar</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoads.length === 0 ? (
              <tr><td colSpan={11} className="text-center text-gray-400 py-12"><Fuel size={40} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No se encontraron cargas con los filtros seleccionados</p></td></tr>
            ) : filteredLoads.map(l => (
              <tr key={l.id} className={`${editingId === l.id ? 'bg-blue-50/50' : ''}`}>
                <td className="font-mono text-xs text-gray-500">
                  <span className="font-bold text-gray-800">{l.load_number}</span>
                  {l.remito_number && <span className="block text-[10px] text-blue-700 font-bold">R: {l.remito_number}</span>}
                </td>
                <td className="text-xs whitespace-nowrap">{l.load_date}</td>
                <td className="font-medium">
                  {l.vehicle_description} <span className="text-gray-400 text-xs">({l.vehicle_code})</span>
                  {l.plate && <span className="block text-[10px] text-gray-400 font-mono">{l.plate}</span>}
                </td>
                {editingId === l.id ? (
                  <>
                    <td>
                      <select value={editForm.supplier} onChange={e => setEditForm(f => ({ ...f, supplier: e.target.value }))} className="px-2 py-1 border rounded text-xs">
                        {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={editForm.fuel_type} onChange={e => setEditForm(f => ({ ...f, fuel_type: e.target.value }))} className="px-2 py-1 border rounded text-xs">
                        {FUEL_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                      </select>
                    </td>
                    <td><input type="number" step="0.01" value={editForm.liters} onChange={e => { const lit = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, liters: lit, total_amount: lit * f.price_per_liter })); }} className="w-20 px-2 py-1 border rounded text-xs font-mono" /></td>
                    <td><input type="number" step="0.01" value={editForm.price_per_liter} onChange={e => { const p = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, price_per_liter: p, total_amount: f.liters * p })); }} className="w-20 px-2 py-1 border rounded text-xs font-mono" /></td>
                    <td><input type="number" step="0.01" value={editForm.total_amount} onChange={e => { const t = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, total_amount: t, price_per_liter: f.liters ? t / f.liters : f.price_per_liter })); }} className="w-24 px-2 py-1 border rounded text-xs font-mono font-bold" /></td>
                  </>
                ) : (
                  <>
                    <td><span className="badge badge-neutral text-[11px]">{l.station_name || l.supplier || 'YPF'}</span></td>
                    <td className="text-xs text-gray-600">{l.fuel_type || '—'}</td>
                    <td className="font-mono font-bold text-sky-700">{l.liters} L</td>
                    <td className="font-mono text-xs">{l.price_per_liter ? `$ ${fmt(l.price_per_liter)}` : <span className="text-gray-300">—</span>}</td>
                    <td className="font-mono font-bold text-emerald-700">{l.total_amount ? fmtCurrency(l.total_amount) : <span className="text-gray-300">Sin precio</span>}</td>
                  </>
                )}
                <td className="text-xs">
                  <div className="font-medium text-gray-700">{l.driver_name || '—'}</div>
                  {l.remito_number && <div className="text-[10px] text-blue-700 font-mono font-bold">Remito: {l.remito_number}</div>}
                  {l.voucher_number && <div className="text-[10px] text-gray-400 font-mono">Vale: {l.voucher_number}</div>}
                </td>
                <td>
                  <select
                    value={l.validation_status || 'pending'}
                    onChange={async (e) => {
                      const newStatus = e.target.value as 'pending' | 'ok' | 'observed';
                      try {
                        await updateLoad.mutateAsync({ id: l.id, validation_status: newStatus });
                        useModalStore.getState().showAlert(
                          'Estado de Auditoría Actualizado', 
                          `La carga cambio a estado: ${newStatus === 'ok' ? '✅ OK (Validada)' : newStatus === 'observed' ? '⚠️ Observada' : '⏳ Pendiente'}`
                        );
                      } catch (err: any) {
                        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo cambiar el estado.');
                      }
                    }}
                    className={`text-xs font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer shadow-xs ${
                      l.validation_status === 'ok' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' 
                        : l.validation_status === 'observed' 
                          ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' 
                          : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                    }`}
                  >
                    <option value="pending">⏳ Pendiente</option>
                    <option value="ok">✅ OK (Validada)</option>
                    <option value="observed">⚠️ Observado</option>
                  </select>
                  {l.unauthorized_load && <span className="block mt-1 badge bg-amber-100 text-amber-800 text-[9px] border-amber-200 font-bold">Sin Autorizar</span>}
                  {l.ticket_photo_url && (
                    <button onClick={() => setViewingTicket(l.ticket_photo_url!)} className="mt-1 flex w-full items-center justify-center gap-1 text-[10px] font-bold text-ecar-blue hover:bg-blue-100 bg-blue-50 border border-blue-100 px-1 py-0.5 rounded transition-colors">
                      <ImageIcon size={10} /> Ver Ticket
                    </button>
                  )}
                </td>
                <td className="text-center">
                  {editingId === l.id ? (
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={saveEdit} disabled={updateLoad.isPending} className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-all" title="Guardar"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all" title="Cancelar"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => startEdit(l)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-all" title="Editar carga"><Pencil size={14} /></button>
                      {canDelete && (
                        <button 
                          onClick={async () => {
                            if (await useModalStore.getState().showConfirm('Confirmar Eliminación', '¿Seguro que deseás borrar esta carga realizada?')) {
                              try {
                                await deleteLoad.mutateAsync(l.id);
                                useModalStore.getState().showAlert('Éxito', 'La carga de combustible se eliminó correctamente.');
                              } catch (err: any) {
                                useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar la carga.');
                              }
                            }
                          }} 
                          disabled={deleteLoad.isPending}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all" 
                          title="Borrar carga"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket Viewer Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingTicket(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-ecar-blue flex items-center gap-2">
                <ImageIcon size={18} /> Ticket de Carga
              </h3>
              <button onClick={() => setViewingTicket(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 flex items-center justify-center min-h-[400px]">
              <img src={viewingTicket} alt="Ticket de Carga" className="max-w-full max-h-full object-contain rounded shadow-sm" />
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <a href={viewingTicket} target="_blank" rel="noreferrer" className="px-4 py-2 bg-ecar-blue text-white rounded-lg text-sm font-bold hover:bg-ecar-blueDark transition-colors flex items-center gap-2">
                <Download size={16} /> Descargar Original
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* ── Batán Tab (Enhanced with QOAG Clinical Aesthetics) ── */
const BatanTab: React.FC<{
  movements: any[];
  vehicles: FuelVehicle[];
  createBatan: any;
  currentStock: number;
}> = ({ movements, vehicles, createBatan, currentStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'purchase' | 'discharge' | 'adjustment'>('all');
  const [selectedMov, setSelectedMov] = useState<any | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Default tank capacity (can be 200 L nominal)
  const nominalCapacity = 200;
  const stockPct = Math.min(100, Math.max(0, Math.round((currentStock / nominalCapacity) * 100)));

  // Current month stats
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYear = now.getFullYear();

  const monthMovements = useMemo(() => {
    return movements.filter(m => {
      if (!m.movement_date) return false;
      const d = new Date(m.movement_date);
      return d.getMonth() === currentMonthNum && d.getFullYear() === currentYear;
    });
  }, [movements, currentMonthNum, currentYear]);

  const monthPurchases = useMemo(() => {
    return monthMovements
      .filter(m => m.movement_type === 'purchase' || m.movement_type === 'ingreso')
      .reduce((acc, m) => acc + (m.liters_loaded || 0), 0);
  }, [monthMovements]);

  const monthDischarges = useMemo(() => {
    return monthMovements
      .filter(m => m.movement_type === 'discharge' || m.movement_type === 'egreso')
      .reduce((acc, m) => acc + (m.liters_discharged || 0), 0);
  }, [monthMovements]);

  // Filtered movements for table display
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'purchase' && m.movement_type !== 'purchase' && m.movement_type !== 'ingreso') return false;
        if (filterType === 'discharge' && m.movement_type !== 'discharge' && m.movement_type !== 'egreso') return false;
        if (filterType === 'adjustment' && m.movement_type !== 'adjustment' && m.movement_type !== 'ajuste') return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const num = (m.movement_number || '').toLowerCase();
        const code = (m.vehicle_code || '').toLowerCase();
        const driver = (m.driver_name || '').toLowerCase();
        const project = (m.project_name || '').toLowerCase();
        const fuel = (m.fuel_type || '').toLowerCase();
        const supplier = (m.supplier || '').toLowerCase();
        const obs = (m.observations || '').toLowerCase();
        return num.includes(term) || code.includes(term) || driver.includes(term) || project.includes(term) || fuel.includes(term) || supplier.includes(term) || obs.includes(term);
      }
      return true;
    });
  }, [movements, filterType, searchTerm]);

  // Determine stock alert level
  let stockBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let progressColor = 'bg-emerald-500';
  let alertText = 'Nivel Óptimo';

  if (currentStock <= 30) {
    stockBadgeColor = 'bg-red-50 text-red-700 border-red-200';
    progressColor = 'bg-red-500';
    alertText = '⚠️ Stock Crítico - Requiere Recarga';
  } else if (currentStock <= 80) {
    stockBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    progressColor = 'bg-amber-500';
    alertText = 'Atención: Nivel Medio';
  }

  return (
    <div className="space-y-6">
      {/* Batán Status Header Card */}
      <div className="light-card p-6 bg-white border border-gray-100 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
              <Droplets size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Batán de Combustible Interno</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stockBadgeColor}`}>
                  {alertText}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Control de inventario, ingresos por compra y consumo por vehículo/equipo</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} /> Registrar Compra / Ingreso
            </button>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-gray-300 transition-all"
            >
              <Sliders size={16} /> Ajustar Stock Real
            </button>
          </div>
        </div>

        {/* Level Progress Gauge and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Gauge card */}
          <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-sky-50/40 p-4 rounded-xl border border-sky-100 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Gauge size={14} className="text-sky-600" /> Nivel Actual del Tanque
              </span>
              <span className="text-sm font-black text-sky-800 font-mono">{stockPct}%</span>
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black text-gray-900 font-mono">{fmt(currentStock)} L</span>
                <span className="text-xs font-semibold text-gray-500 font-mono">Capacidad: {nominalCapacity} L</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3.5 p-0.5 overflow-hidden">
                <div className={`${progressColor} h-full rounded-full transition-all duration-500`} style={{ width: `${stockPct}%` }} />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              * El saldo se actualiza automáticamente con cada carga a vehículos o compra registrada.
            </p>
          </div>

          {/* Monthly Purchases */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <ArrowDownLeft size={16} className="text-emerald-600" /> Ingresos este Mes
            </span>
            <div className="mt-2">
              <p className="text-xl font-black text-emerald-800 font-mono">+{fmt(monthPurchases)} L</p>
              <p className="text-xs text-emerald-600 mt-1">Cargas de llenado de batán</p>
            </div>
          </div>

          {/* Monthly Discharges */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <ArrowUpRight size={16} className="text-amber-600" /> Descargas este Mes
            </span>
            <div className="mt-2">
              <p className="text-xl font-black text-amber-800 font-mono">-{fmt(monthDischarges)} L</p>
              <p className="text-xs text-amber-600 mt-1">Consumo en flota y equipos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="light-card overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
        {/* Table header & controls */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplets className="text-sky-600" size={18} />
            <h3 className="font-bold text-gray-800 text-sm">Histórico de Movimientos y Detalle</h3>
            <span className="bg-sky-100 text-sky-700 font-bold text-xs px-2 py-0.5 rounded-full">{filteredMovements.length}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Buscar por vehículo, obra, operador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="purchase">Ingresos / Compras</option>
              <option value="discharge">Descargas / Consumos</option>
              <option value="adjustment">Ajustes de Stock</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                <th className="py-3 px-4">ID / Ref</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Combustible & Proveedor</th>
                <th className="py-3 px-4">Destino / Vehículo</th>
                <th className="py-3 px-4">Operador / Conductor</th>
                <th className="py-3 px-4">Obra / Proyecto</th>
                <th className="py-3 px-4 text-right">Movimiento</th>
                <th className="py-3 px-4 text-right">Saldo Batán</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-gray-400 py-10">
                    <Droplets size={40} className="mx-auto mb-2 opacity-30 text-sky-400" />
                    <p className="font-semibold text-gray-500 text-sm">No se encontraron movimientos registrados en Batán</p>
                    <p className="text-xs text-gray-400 mt-1">Pruebe cambiando los filtros de búsqueda</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const isPurchase = m.movement_type === 'purchase' || m.movement_type === 'ingreso';
                  const isAdjustment = m.movement_type === 'adjustment' || m.movement_type === 'ajuste';

                  // Vehicle lookup
                  const veh = vehicles.find(v => v.code === m.vehicle_code || v.plate === m.vehicle_code);

                  return (
                    <tr key={m.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-700">{m.movement_number || '—'}</td>
                      <td className="py-2.5 px-4 text-gray-600 whitespace-nowrap">{m.movement_date || '—'}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isPurchase 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : isAdjustment 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isPurchase ? 'Ingreso / Compra' : isAdjustment ? 'Ajuste' : 'Descarga'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-gray-800">{m.fuel_type || 'Diesel EVOLUX'}</p>
                        {m.supplier && <p className="text-[10px] text-gray-500 font-medium">{m.supplier}</p>}
                      </td>
                      <td className="py-2.5 px-4">
                        {m.vehicle_code ? (
                          <div>
                            <p className="font-bold text-sky-700 font-mono">{m.vehicle_code}</p>
                            <p className="text-[10px] text-gray-500">{veh?.description || veh?.plate || ''}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">{isPurchase ? 'Batán (Stock General)' : 'Sin vehículo asignado'}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-gray-700 font-medium">{m.driver_name || '—'}</td>
                      <td className="py-2.5 px-4 text-gray-700">{m.project_name || '—'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {isPurchase ? (
                          <span className="text-emerald-600">+{fmt(m.liters_loaded || 0)} L</span>
                        ) : isAdjustment ? (
                          <span className="text-blue-600">Ajuste</span>
                        ) : (
                          <span className="text-amber-600">-{fmt(m.liters_discharged || 0)} L</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-extrabold text-sky-700 text-sm whitespace-nowrap bg-sky-50/30">
                        {fmt(m.computed_balance ?? m.balance_after ?? 0)} L
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedMov(m)}
                          className="p-1.5 bg-gray-100 hover:bg-sky-100 text-gray-600 hover:text-sky-700 rounded-md transition-colors"
                          title="Ver Detalle Completo"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ver Detalle Completo de Movimiento */}
      {selectedMov && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Droplets className="text-sky-600" size={20} />
                <h3 className="font-bold text-gray-900 text-lg">Detalle del Movimiento de Batán</h3>
              </div>
              <button onClick={() => setSelectedMov(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-gray-500">Comprobante ID</span>
                <span className="font-mono font-bold text-gray-900 text-sm">{selectedMov.movement_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Fecha</span>
                <span className="font-semibold text-gray-900">{selectedMov.movement_date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Tipo de Movimiento</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  selectedMov.movement_type === 'purchase' || selectedMov.movement_type === 'ingreso'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedMov.movement_type === 'adjustment' || selectedMov.movement_type === 'ajuste'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedMov.movement_type === 'purchase' || selectedMov.movement_type === 'ingreso' ? 'Ingreso / Compra' : selectedMov.movement_type === 'adjustment' || selectedMov.movement_type === 'ajuste' ? 'Ajuste Stock' : 'Descarga'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Combustible</span>
                <span className="font-semibold text-gray-900">{selectedMov.fuel_type || 'Diesel EVOLUX'}</span>
              </div>
              {selectedMov.supplier && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Proveedor / Estación</span>
                  <span className="font-semibold text-gray-900">{selectedMov.supplier}</span>
                </div>
              )}
              {selectedMov.vehicle_code && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Vehículo Cargado</span>
                  <span className="font-mono font-bold text-sky-700">{selectedMov.vehicle_code}</span>
                </div>
              )}
              {selectedMov.driver_name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Operador / Conductor</span>
                  <span className="font-semibold text-gray-900">{selectedMov.driver_name}</span>
                </div>
              )}
              {selectedMov.project_name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Proyecto / Obra</span>
                  <span className="font-semibold text-gray-900">{selectedMov.project_name}</span>
                </div>
              )}
              {selectedMov.remito_number && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">N° Remito / Ticket</span>
                  <span className="font-mono font-bold text-gray-800">{selectedMov.remito_number}</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-bold">Volumen del Movimiento</span>
                <span className="font-mono font-black text-sm text-gray-900">
                  {selectedMov.movement_type === 'purchase' || selectedMov.movement_type === 'ingreso'
                    ? `+${fmt(selectedMov.liters_loaded || 0)} L`
                    : selectedMov.movement_type === 'adjustment'
                      ? 'Ajuste'
                      : `-${fmt(selectedMov.liters_discharged || 0)} L`}
                </span>
              </div>

              <div className="flex justify-between items-center bg-sky-100/60 p-2.5 rounded-lg border border-sky-200">
                <span className="text-sky-900 font-extrabold">Saldo Resultante en Batán</span>
                <span className="font-mono font-black text-base text-sky-800">
                  {fmt(selectedMov.computed_balance ?? selectedMov.balance_after ?? 0)} L
                </span>
              </div>

              {selectedMov.observations && (
                <div className="pt-2">
                  <p className="text-gray-500 font-semibold mb-1">Observaciones / Notas:</p>
                  <p className="p-2 bg-white rounded border border-gray-200 text-gray-700 text-xs italic">
                    {selectedMov.observations}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedMov(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Compra / Ingreso a Batán */}
      {showPurchaseModal && (
        <ModalNewBatanPurchase
          onClose={() => setShowPurchaseModal(false)}
          onSubmit={async (data) => {
            const nextBalance = Number(currentStock) + Number(data.liters_loaded);
            await createBatan.mutateAsync({
              movement_number: `COMPRA-${String(Date.now()).slice(-6)}`,
              movement_date: data.movement_date,
              movement_type: 'purchase',
              supplier: data.supplier,
              fuel_type: data.fuel_type,
              liters_loaded: Number(data.liters_loaded),
              price_per_liter: data.price_per_liter ? Number(data.price_per_liter) : null,
              total_amount: data.total_amount ? Number(data.total_amount) : null,
              remito_number: data.remito_number || null,
              balance_after: nextBalance,
              movement_status: 'available',
              observations: data.observations || 'Ingreso / Carga de combustible a Batán'
            });
            useModalStore.getState().showAlert('Ingreso Registrado', `✅ Se registraron +${data.liters_loaded} L ingresados al Batán. Nuevo Saldo: ${fmt(nextBalance)} L.`);
            setShowPurchaseModal(false);
          }}
        />
      )}

      {/* Modal: Ajustar Stock Real */}
      {showAdjustmentModal && (
        <ModalBatanAdjustment
          currentStock={currentStock}
          onClose={() => setShowAdjustmentModal(false)}
          onSubmit={async (data) => {
            const newBal = Number(data.new_balance);
            await createBatan.mutateAsync({
              movement_number: `AJUSTE-${String(Date.now()).slice(-6)}`,
              movement_date: data.movement_date,
              movement_type: 'adjustment',
              fuel_type: 'Diesel EVOLUX',
              balance_after: newBal,
              movement_status: 'completed',
              observations: data.observations || `Ajuste manual de stock de Batán. Saldo ajustado a ${newBal} L.`
            });
            useModalStore.getState().showAlert('Stock Ajustado', `✅ Saldo de Batán actualizado a ${fmt(newBal)} L.`);
            setShowAdjustmentModal(false);
          }}
        />
      )}
    </div>
  );
};

/* ── Modal: Registrar Compra de Combustible a Batán ── */
const ModalNewBatanPurchase: React.FC<{
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}> = ({ onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    movement_date: new Date().toISOString().split('T')[0],
    supplier: 'Shell Agro',
    fuel_type: 'Diesel EVOLUX',
    liters_loaded: '',
    price_per_liter: '',
    total_amount: '',
    remito_number: '',
    observations: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.liters_loaded || Number(form.liters_loaded) <= 0) {
      useModalStore.getState().showAlert('Error', 'Ingrese una cantidad de litros válida mayor a 0.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      console.error(err);
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo guardar la compra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Droplets className="text-emerald-600" size={20} />
            <h3 className="font-bold text-gray-900 text-lg">Registrar Compra / Llenado de Batán</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Fecha de Recepción *</label>
            <input
              type="date"
              required
              value={form.movement_date}
              onChange={e => setForm({ ...form, movement_date: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Proveedor *</label>
              <select
                value={form.supplier}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white font-medium"
              >
                <option value="Shell Agro">Shell Agro</option>
                <option value="YPF Agro">YPF Agro</option>
                <option value="Axion">Axion</option>
                <option value="Puma">Puma</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Tipo Combustible *</label>
              <select
                value={form.fuel_type}
                onChange={e => setForm({ ...form, fuel_type: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white font-medium"
              >
                <option value="Diesel EVOLUX">Diesel EVOLUX</option>
                <option value="Diesel Premium / V-Power">Diesel Premium / V-Power</option>
                <option value="Diesel 500 / Ultradiesel">Diesel 500 / Ultradiesel</option>
                <option value="Nafta Súper">Nafta Súper</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Litros Ingresados al Batán *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ej: 200.00"
              value={form.liters_loaded}
              onChange={e => setForm({ ...form, liters_loaded: e.target.value })}
              className="w-full p-2 border border-sky-300 rounded-lg bg-sky-50 text-sky-900 font-bold text-sm focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Precio por Litro ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej: 1150.00"
                value={form.price_per_liter}
                onChange={e => {
                  const p = e.target.value;
                  const l = form.liters_loaded;
                  const tot = p && l ? (Number(p) * Number(l)).toFixed(2) : form.total_amount;
                  setForm({ ...form, price_per_liter: p, total_amount: tot });
                }}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-1">Importe Total ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej: 230000.00"
                value={form.total_amount}
                onChange={e => setForm({ ...form, total_amount: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">N° Remito / Factura</label>
            <input
              type="text"
              placeholder="Ej: REM-000418"
              value={form.remito_number}
              onChange={e => setForm({ ...form, remito_number: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Observaciones</label>
            <textarea
              rows={2}
              placeholder="Notas sobre el envío, orden de compra, etc."
              value={form.observations}
              onChange={e => setForm({ ...form, observations: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow flex items-center gap-1.5"
          >
            {loading ? 'Guardando...' : 'Confirmar Ingreso'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ── Modal: Ajustar Stock Real de Batán ── */
const ModalBatanAdjustment: React.FC<{
  currentStock: number;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}> = ({ currentStock, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    movement_date: new Date().toISOString().split('T')[0],
    new_balance: String(currentStock),
    observations: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_balance === '' || Number(form.new_balance) < 0) {
      useModalStore.getState().showAlert('Error', 'Ingrese un saldo de stock válido.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      console.error(err);
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo ajustar el stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="text-sky-600" size={20} />
            <h3 className="font-bold text-gray-900 text-lg">Ajuste Manual de Stock Batán</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg flex items-center justify-between">
            <span className="text-gray-600 font-semibold">Stock Calculado Actual:</span>
            <span className="font-mono font-black text-sky-900 text-sm">{fmt(currentStock)} L</span>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Fecha del Ajuste *</label>
            <input
              type="date"
              required
              value={form.movement_date}
              onChange={e => setForm({ ...form, movement_date: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Nuevo Stock Real (Litros) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ej: 180.00"
              value={form.new_balance}
              onChange={e => setForm({ ...form, new_balance: e.target.value })}
              className="w-full p-2 border border-sky-300 rounded-lg bg-sky-50 text-sky-900 font-bold text-sm focus:bg-white font-mono"
            />
            <p className="text-[11px] text-gray-500 mt-1">Utilice esta función tras medir el nivel real del tanque con varilla o calibración manual.</p>
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Motivo / Observación del Ajuste *</label>
            <textarea
              rows={2}
              required
              placeholder="Ej: Medición varilla turno mañana / Corrección por evaporación o merma"
              value={form.observations}
              onChange={e => setForm({ ...form, observations: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition-colors shadow flex items-center gap-1.5"
          >
            {loading ? 'Guardando...' : 'Aplicar Ajuste'}
          </button>
        </div>
      </form>
    </div>
  );
};

      <tbody>
        {data.map(r => (
          <tr key={r.id}>
            <td className="font-medium">{r.month_name} {r.year}</td>
            <td className="font-mono">{r.total_loads}</td>
            <td className="font-mono">{fmt(r.total_liters)} L</td>
            <td className="font-mono">$ {fmt(r.total_amount_sheet)}</td>
            <td className="font-mono font-bold">{r.supplier_invoice_amount ? `$ ${fmt(r.supplier_invoice_amount)}` : '—'}</td>
            <td className="font-mono font-bold">{r.difference ? <span className={r.difference > 0 ? 'text-red-600' : 'text-green-600'}>$ {fmt(r.difference)}</span> : '—'}</td>
            <td><span className={`badge ${r.status === 'controlled' ? 'badge-success' : r.status === 'observed' ? 'badge-danger' : 'badge-warning'}`}>{r.status === 'controlled' ? 'Controlado' : r.status === 'observed' ? 'Observado' : 'Pendiente'}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Fleet Tab ── */
const FleetTab: React.FC<{ vehicles: FuelVehicle[] }> = ({ vehicles }) => (
  <div className="light-card overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Flota Registrada ({vehicles.length} unidades)</h3></div>
    <table className="data-table">
      <thead>
        <tr><th>Código</th><th>Tipo</th><th>Descripción</th><th>Patente</th><th>Combustible</th><th>Tanque</th><th>Área</th><th>Responsable</th></tr>
      </thead>
      <tbody>
        {vehicles.map(v => (
          <tr key={v.id}>
            <td className="font-mono font-bold text-sky-600">{v.code}</td>
            <td><span className="badge badge-neutral">{v.vehicle_type}</span></td>
            <td className="font-medium">{v.description}</td>
            <td className="font-mono text-xs">{v.plate || '—'}</td>
            <td className="text-xs font-semibold text-gray-700">{v.preferred_fuel}</td>
            <td className="font-mono">{v.tank_capacity_liters ? `${v.tank_capacity_liters} L` : '—'}</td>
            <td className="text-xs">{v.area || '—'}</td>
            <td className="text-xs">{v.default_driver || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Requests Tab ── */
const RequestsTab: React.FC<{ loads: FuelLoad[]; vehicles: FuelVehicle[]; updateLoad: any; createLoad: any; projects: any[]; createBatan: any }> = ({ loads, vehicles, updateLoad, createLoad, projects, createBatan }) => {
  const { user, isAdmin, profile } = useAuth();
  const deleteLoad = useDeleteFuelLoad();
  const userEmail = user?.email?.toLowerCase() || '';
  const canDelete = isAdmin || userEmail.includes('gustavo') || userEmail.includes('lucas');
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState<{ vehicle_code: string; requested_liters: string; odometer_km: string; project_name: string; observations: string; fuel_source: 'station' | 'batan'; station_name: string; fuel_type: string }>({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', observations: '', fuel_source: 'station', station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power' });
  
  // Signature registration
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [sigDni, setSigDni] = useState(profile?.dni || '');
  const [sigName, setSigName] = useState(profile?.full_name || '');
  const [sigData, setSigData] = useState<string | null>(profile?.signature_data || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigSaving, setSigSaving] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);

  const hasSignature = !!(profile?.dni && profile?.signature_data);
  
  // Pending authorizations
  const pendingRequests = loads.filter(l => l.workflow_status === 'requested' || (l.workflow_status === 'completed' && l.unauthorized_load));
  // Pending loads (authorized but not completed)
  const authorizedRequests = loads.filter(l => l.workflow_status === 'authorized');

  // Canvas drawing functions
  useEffect(() => {
    const canvas = sigCanvasRef.current;
    if (canvas && showSignaturePanel) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1a2744';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (!hasDrawn) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [showSignaturePanel]);

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const ctx = sigCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1a2744';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = sigCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    setSigData(null);
    setHasDrawn(false);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1a2744';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  const handleSaveSignature = async () => {
    const canvas = sigCanvasRef.current;
    const canvasData = canvas ? canvas.toDataURL('image/png') : sigData;
    if (!sigDni || !sigName || (!canvasData && !hasDrawn)) return;
    setSigSaving(true);
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('profiles').update({ dni: sigDni, signature_data: canvasData, full_name: sigName }).eq('id', profile?.id);
      setShowSignaturePanel(false);
      window.location.reload();
    } catch (e: any) {
      alert('Error al guardar firma: ' + e.message);
    }
    setSigSaving(false);
  };

  const handleRequestSubmit = async () => {
    if (!reqForm.vehicle_code || !reqForm.requested_liters) return;
    const v = vehicles.find(x => x.code === reqForm.vehicle_code);
    const d = new Date();
    await createLoad.mutateAsync({
      load_number: `REQ-${String(loads.length + 1).padStart(4, '0')}`,
      load_date: d.toISOString().split('T')[0],
      month: MONTHS_ES[d.getMonth()],
      year: d.getFullYear(),
      day_of_week: DAYS_ES[d.getDay()],
      vehicle_code: reqForm.vehicle_code,
      vehicle_id: v?.id,
      vehicle_description: v?.description,
      plate: v?.plate,
      vehicle_type: v?.vehicle_type,
      fuel_type: reqForm.fuel_type || v?.preferred_fuel || 'Diesel Premium / V-Power',
      supplier: reqForm.station_name || 'YPF',
      station_name: reqForm.station_name || 'YPF',
      requested_liters: parseFloat(reqForm.requested_liters) || 0,
      odometer_km: parseInt(reqForm.odometer_km) || null,
      project_name: reqForm.project_name || null,
      observations: reqForm.observations,
      requested_by: user?.email || 'Operario',
      workflow_status: 'requested',
      created_by: 'web',
      load_source: reqForm.fuel_source
    });
    setReqForm({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', observations: '', fuel_source: 'station', station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power' });
    setShowReqForm(false);
  };

  const handleAuthorize = async (id: string, isCompletedWithoutAuth?: boolean) => {
    if (!profile) {
      alert("No tenés permisos para autorizar.");
      return;
    }
    const signature = `Firmado por: ${profile.full_name} (DNI: ${profile.dni}) - ${new Date().toLocaleString()}`;
    
    if (isCompletedWithoutAuth) {
      await updateLoad.mutateAsync({
        id,
        unauthorized_load: false,
        authorized_by: profile.full_name,
        authorized_at: new Date().toISOString(),
        supervisor_signature: signature
      });
    } else {
      await updateLoad.mutateAsync({
        id,
        workflow_status: 'authorized',
        authorized_by: profile.full_name,
        authorized_at: new Date().toISOString(),
        supervisor_signature: signature
      });
    }
  };

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({
    liters: '',
    price_per_liter: '',
    total_amount: '',
    fuel_source: 'station' as 'station' | 'batan',
    supplier: 'YPF',
    fuel_type: 'Diesel Premium / V-Power'
  });

  const handleComplete = async () => {
    const isBatan = completeForm.fuel_source === 'batan';
    const loadObj = loads.find(x => x.id === completingId);
    const isFillingBatan = loadObj?.vehicle_code?.startsWith('BT-');
    
    let ticketUrl = undefined;
    if (ticketFile) {
      const fileName = `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { supabase } = await import('../lib/supabase');
      const { error: uploadError } = await supabase.storage.from('fuel_tickets').upload(fileName, ticketFile);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fuel_tickets').getPublicUrl(fileName);
        ticketUrl = publicUrlData.publicUrl;
      }
    }

    if (!completingId || !completeForm.liters) return;
    if (!isBatan && !completeForm.total_amount && !completeForm.price_per_liter) {
      alert("Por favor, ingrese el Importe Total.");
      return;
    }
    
    const finalLiters = parseFloat(completeForm.liters) || 0;
    const finalAmount = isBatan ? 0 : parseFloat(completeForm.total_amount) || 0;
    const finalPrice = isBatan ? 0 : (parseFloat(completeForm.price_per_liter) || (finalAmount / finalLiters) || 0);

    await updateLoad.mutateAsync({
      id: completingId,
      liters: finalLiters,
      price_per_liter: finalPrice,
      total_amount: finalAmount,
      workflow_status: 'completed',
      load_source: completeForm.fuel_source,
      supplier: isBatan ? 'Batán Interno' : completeForm.supplier,
      station_name: isBatan ? 'Batán Interno' : completeForm.supplier,
      fuel_type: completeForm.fuel_type
    });

    if (isBatan) {
      await createBatan.mutateAsync({
        movement_date: new Date().toISOString().split('T')[0],
        movement_type: 'discharge',
        fuel_type: completeForm.fuel_type || loadObj?.fuel_type || 'Diesel Premium / V-Power',
        liters_discharged: finalLiters,
        movement_status: 'completed',
        reference_load: loadObj?.load_number
      });
    }

    if (isFillingBatan && !isBatan) {
      await createBatan.mutateAsync({
        movement_date: new Date().toISOString().split('T')[0],
        movement_type: 'purchase',
        fuel_type: completeForm.fuel_type || loadObj?.fuel_type || 'Diesel Premium / V-Power',
        liters_loaded: finalLiters,
        unit_price: finalPrice,
        total_amount: finalAmount,
        supplier: completeForm.supplier,
        movement_status: 'completed',
        reference_load: loadObj?.load_number,
        observations: `Carga al Batán finalizada desde panel (${loadObj?.load_number})`
      });
    }

    setCompletingId(null);
  };

  const shareableLink = `${window.location.origin}/fuel-request`;

  return (
    <div className="space-y-6">
      {/* Shareable Link + Signature Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shareable Link Card */}
        <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Link Directo para Operarios</h4>
              <p className="text-[10px] text-blue-600">Compartí este link para que los operarios soliciten cargas sin ingresar al sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              readOnly
              value={shareableLink}
              className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-mono text-blue-700 select-all"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={() => { navigator.clipboard.writeText(shareableLink); }}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              📋 Copiar
            </button>
          </div>
        </div>

        {/* Signature Registration Card */}
        {(isAdmin || profile?.role === 'colaborador') && (
          <div className={`rounded-xl p-4 shadow-sm border ${hasSignature ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasSignature ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <Pencil size={16} className={hasSignature ? 'text-green-600' : 'text-orange-600'} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${hasSignature ? 'text-green-900' : 'text-orange-900'}`}>
                    {hasSignature ? '✅ Firma Registrada' : '⚠️ Registrar Firma Digital'}
                  </h4>
                  <p className="text-[10px] text-gray-600">
                    {hasSignature ? `${profile?.full_name} — DNI: ${profile?.dni}` : 'Necesitás registrar tu firma para autorizar cargas'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSignaturePanel(!showSignaturePanel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${hasSignature ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-orange-600 text-white hover:bg-orange-700 animate-pulse'}`}
              >
                {hasSignature ? 'Modificar' : 'Registrar Firma'}
              </button>
            </div>
            {hasSignature && profile?.signature_data && !showSignaturePanel && (
              <div className="mt-3 flex items-center gap-3">
                <img src={profile.signature_data} alt="Firma" className="h-10 border border-green-200 rounded bg-white p-1" />
                <span className="text-[10px] text-green-700 font-mono">Firma activa</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signature Panel */}
      {showSignaturePanel && (
        <div className="bg-white border-2 border-blue-300 rounded-xl p-6 shadow-lg animate-fade-in">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Pencil size={18} className="text-blue-600" /> Registrar Firma Digital
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre Completo <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={sigName}
                onChange={e => setSigName(e.target.value)}
                placeholder="Ej: Juan Carlos Pérez"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">DNI <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={sigDni}
                onChange={e => setSigDni(e.target.value)}
                placeholder="Ej: 30.456.789"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block">Firma Digital <span className="text-red-500">*</span></label>
            <div className="relative">
              <canvas
                ref={sigCanvasRef}
                width={800}
                height={200}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-crosshair touch-none" style={{ height: '160px' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <p className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none font-medium">
                  Dibujá tu firma aquí
                </p>
              )}
              {hasDrawn && (
                <button
                  onClick={clearSignature}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg text-xs hover:bg-red-600 shadow-md"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowSignaturePanel(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSaveSignature}
              disabled={!sigDni || !sigName || !hasDrawn || sigSaving}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
            >
              {sigSaving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : (
                <><Check size={16} /> Guardar Firma</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Autorizaciones de Carga</h3>
        <button onClick={() => setShowReqForm(!showReqForm)} className="btn-primary">
          {showReqForm ? <X size={16} /> : <Plus size={16} />} Nueva Solicitud
        </button>
      </div>

      {showReqForm && (
        <div className="bg-white border-2 border-orange-200 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="font-bold text-gray-700 text-sm">📝 Solicitud de Carga (Operario)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Origen</label>
              <select value={reqForm.fuel_source} onChange={e => setReqForm({ ...reqForm, fuel_source: e.target.value as any, station_name: e.target.value === 'batan' ? 'Batán Interno' : 'YPF' })} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50 font-bold text-blue-700">
                <option value="station">Estación</option>
                <option value="batan">Batán Interno</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Estación Sugerida</label>
              <select disabled={reqForm.fuel_source === 'batan'} value={reqForm.station_name} onChange={e => setReqForm({ ...reqForm, station_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Tipo Combustible</label>
              <select value={reqForm.fuel_type} onChange={e => setReqForm({ ...reqForm, fuel_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Vehículo *</label>
              <select value={reqForm.vehicle_code} onChange={e => {
                const v = vehicles.find(x => x.code === e.target.value);
                setReqForm({ ...reqForm, vehicle_code: e.target.value, fuel_type: v?.preferred_fuel || reqForm.fuel_type });
              }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccioná...</option>
                {vehicles.map(v => <option key={v.id} value={v.code}>{v.code} — {v.description}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Obra / CC</label>
              <select value={reqForm.project_name} onChange={e => setReqForm({ ...reqForm, project_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Uso General</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Litros Solicitados *</label>
              <input type="number" step="0.1" value={reqForm.requested_liters} onChange={e => setReqForm({ ...reqForm, requested_liters: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Km / Hs</label>
              <input type="number" value={reqForm.odometer_km} onChange={e => setReqForm({ ...reqForm, odometer_km: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Motivo / Notas</label>
            <input value={reqForm.observations} onChange={e => setReqForm({ ...reqForm, observations: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: Viaje a obra interior..." />
          </div>
          <button onClick={handleRequestSubmit} disabled={!reqForm.vehicle_code || !reqForm.requested_liters} className="btn-primary w-full justify-center disabled:opacity-50">Enviar Solicitud a Gerencia</button>
        </div>
      )}

      {/* Pending Auth */}
      <div>
        <h4 className="font-bold text-gray-600 mb-3 text-sm flex items-center gap-2"><Info size={16} className="text-orange-500" /> Pendientes de Autorización (Gerencia)</h4>
        {pendingRequests.length === 0 ? <p className="text-sm text-gray-400 italic">No hay solicitudes pendientes.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRequests.map(r => (
              <div key={r.id} className={`${r.unauthorized_load ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4 shadow-sm relative group`}>
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-xs font-bold ${r.unauthorized_load ? 'text-red-600' : 'text-orange-600'}`}>{r.vehicle_code} - {r.vehicle_description}</div>
                  {canDelete && (
                    <button 
                      onClick={async () => {
                        if (await useModalStore.getState().showConfirm('Confirmar Eliminación', `¿Seguro que deseás borrar la solicitud de autorización para ${r.vehicle_code}?`)) {
                          try {
                            await deleteLoad.mutateAsync(r.id);
                            useModalStore.getState().showAlert('Éxito', 'Solicitud eliminada correctamente.');
                          } catch (err: any) {
                            useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar la solicitud.');
                          }
                        }
                      }}
                      disabled={deleteLoad.isPending}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-orange-100/80 transition-colors"
                      title="Borrar solicitud"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div className="text-sm">Solicita: <span className="font-bold">{r.requested_by}</span></div>
                <div className="text-sm">Litros pedidos: <span className="font-mono font-bold text-lg">{r.requested_liters} L</span></div>
                {r.unauthorized_load && r.workflow_status === 'completed' && (
                  <div className="mt-2 text-xs font-bold text-red-700 bg-red-100 p-2 rounded">
                    ¡Atención! Carga ya realizada: {r.liters} L ({r.station_name})
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{r.observations || 'Sin notas'}</div>
                {(isAdmin || r.requested_by === user?.email) ? (
                  <button onClick={() => handleAuthorize(r.id, r.unauthorized_load && r.workflow_status === 'completed')} className={`mt-3 w-full text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${r.unauthorized_load ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                    <Check size={14} /> {r.unauthorized_load ? 'Auditar y Aprobar Carga' : 'Autorizar con Firma'}
                  </button>
                ) : (
                  <div className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${r.unauthorized_load ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    Esperando Autorización
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authorized - Pending Load */}
      <div>
        <h4 className="font-bold text-gray-600 mb-3 text-sm flex items-center gap-2"><Check size={16} className="text-green-500" /> Autorizadas - Listas para Cargar</h4>
        {authorizedRequests.length === 0 ? <p className="text-sm text-gray-400 italic">No hay cargas autorizadas pendientes.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {authorizedRequests.map(r => (
              <div key={r.id} className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-bold text-green-700">{r.vehicle_code}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-mono font-bold">Autorizado</span>
                    {canDelete && (
                      <button 
                        onClick={async () => {
                          if (await useModalStore.getState().showConfirm('Confirmar Eliminación', `¿Seguro que deseás borrar la autorización de carga para ${r.vehicle_code}?`)) {
                            try {
                              await deleteLoad.mutateAsync(r.id);
                              useModalStore.getState().showAlert('Éxito', 'Autorización eliminada correctamente.');
                            } catch (err: any) {
                              useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar la autorización.');
                            }
                          }
                        }}
                        disabled={deleteLoad.isPending}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-green-200/60 transition-colors"
                        title="Borrar autorización"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm">Litros autorizados: <span className="font-mono font-bold">{r.requested_liters} L</span></div>
                <div className="text-[10px] text-gray-500 font-mono mt-1 bg-white p-1 rounded border border-green-100 line-clamp-2">
                  {r.supervisor_signature}
                </div>
                <button 
                  onClick={() => generateFuelValePdf(r, profile?.signature_data)}
                  className="mt-2 text-xs font-bold text-ecar-blue hover:text-blue-800 flex items-center gap-1"
                >
                  <Download size={14} /> Descargar PDF Autorizado (con N° de Solicitud)
                </button>

                {completingId === r.id ? (
                  <div className="mt-3 bg-white p-3 rounded-xl border border-green-300 shadow-md space-y-3">
                    <h5 className="font-bold text-xs text-green-900 flex items-center gap-1">
                      <Fuel size={14} className="text-green-600" /> Registrar Carga Efectiva del Vale
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500">Origen</label>
                        <select value={completeForm.fuel_source} onChange={e => {
                          const s = e.target.value as 'station' | 'batan';
                          setCompleteForm(prev => ({ ...prev, fuel_source: s, supplier: s === 'batan' ? 'Batán Interno' : 'YPF', total_amount: s === 'batan' ? '0' : prev.total_amount }));
                        }} className="w-full px-2 py-1 text-xs border rounded bg-gray-50 font-bold text-sky-700">
                          <option value="station">Estación</option>
                          <option value="batan">Batán</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500">Estación *</label>
                        <select disabled={completeForm.fuel_source === 'batan'} value={completeForm.supplier} onChange={e => setCompleteForm({ ...completeForm, supplier: e.target.value })} className="w-full px-2 py-1 text-xs border rounded bg-gray-50 font-medium disabled:opacity-50">
                          {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500">Tipo Combustible *</label>
                      <select value={completeForm.fuel_type} onChange={e => setCompleteForm({ ...completeForm, fuel_type: e.target.value })} className="w-full px-2 py-1 text-xs border rounded bg-gray-50 font-medium">
                        {FUEL_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500">Litros Reales *</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={completeForm.liters} 
                          onChange={e => {
                            const l = parseFloat(e.target.value) || 0;
                            const p = parseFloat(completeForm.price_per_liter) || 0;
                            setCompleteForm({ ...completeForm, liters: e.target.value, total_amount: p ? String(l * p) : completeForm.total_amount });
                          }} 
                          className="w-full px-2 py-1 text-xs border rounded bg-white font-mono font-bold text-sky-700" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500">$/Litro</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          disabled={completeForm.fuel_source === 'batan'} 
                          value={completeForm.price_per_liter} 
                          onChange={e => {
                            const p = parseFloat(e.target.value) || 0;
                            const l = parseFloat(completeForm.liters) || 0;
                            setCompleteForm({ ...completeForm, price_per_liter: e.target.value, total_amount: l ? String(l * p) : completeForm.total_amount });
                          }} 
                          className="w-full px-2 py-1 text-xs border rounded bg-white font-mono disabled:opacity-50" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500">Importe ($) *</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          disabled={completeForm.fuel_source === 'batan'} 
                          value={completeForm.total_amount} 
                          onChange={e => {
                            const t = parseFloat(e.target.value) || 0;
                            const l = parseFloat(completeForm.liters) || 0;
                            setCompleteForm({ ...completeForm, total_amount: e.target.value, price_per_liter: l ? String(t / l) : completeForm.price_per_liter });
                          }} 
                          className="w-full px-2 py-1 text-xs border rounded bg-white font-mono font-bold text-emerald-700 disabled:opacity-50" 
                        />
                      </div>
                    </div>

                    <label className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors border border-gray-300">
                      <Camera size={14} /> {ticketFile ? ticketFile.name : 'Foto del Ticket (Opcional)'}
                      <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={e => setTicketFile(e.target.files?.[0] || null)} />
                    </label>

                    <div className="flex gap-1">
                      <button onClick={handleComplete} disabled={updateLoad.isPending || createBatan.isPending} className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold disabled:opacity-50 shadow">Finalizar Carga</button>
                      <button onClick={() => setCompletingId(null)} className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-bold">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => {
                    const vObj = vehicles.find(x => x.code === r.vehicle_code);
                    setCompletingId(r.id); 
                    setCompleteForm({ 
                      liters: String(r.requested_liters || 0), 
                      price_per_liter: '', 
                      total_amount: '', 
                      fuel_source: r.load_source === 'batan' ? 'batan' : 'station',
                      supplier: r.station_name || r.supplier || 'YPF',
                      fuel_type: r.fuel_type || vObj?.preferred_fuel || 'Diesel Premium / V-Power'
                    }); 
                  }} className="mt-3 w-full bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700 shadow-sm">
                    <Fuel size={14} /> Completar Carga Real
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
    </div>
  );
};

/* ── Fleet Dashboard & Analytics Tab ── */
const FleetDashboardTab: React.FC<{ loads: FuelLoad[]; vehicles: FuelVehicle[] }> = ({ loads, vehicles }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [metricView, setMetricView] = useState<'amount' | 'liters'>('amount');
  
  const completedLoads = useMemo(() => loads.filter(l => l.workflow_status === 'completed' || !l.workflow_status), [loads]);

  // Global KPIs
  const filteredLoads = useMemo(() => {
    if (!selectedVehicle) return completedLoads;
    return completedLoads.filter(l => l.vehicle_code === selectedVehicle || l.vehicle_id === selectedVehicle);
  }, [completedLoads, selectedVehicle]);

  const totalLitersAll = useMemo(() => filteredLoads.reduce((s, l) => s + (l.liters || 0), 0), [filteredLoads]);
  const totalAmountAll = useMemo(() => filteredLoads.reduce((s, l) => s + (l.total_amount || 0), 0), [filteredLoads]);
  const avgPricePerLiter = totalLitersAll > 0 ? totalAmountAll / totalLitersAll : 0;

  // Monthly aggregated data for Line Chart & Bar Chart
  const monthlyAggregated = useMemo(() => {
    const map = new Map<string, { name: string; liters: number; amount: number; count: number }>();

    filteredLoads.forEach(l => {
      const monthKey = `${l.month || 'Mes'} ${l.year || ''}`.trim();
      const existing = map.get(monthKey) || { name: monthKey, liters: 0, amount: 0, count: 0 };
      existing.liters += (l.liters || 0);
      existing.amount += (l.total_amount || 0);
      existing.count += 1;
      map.set(monthKey, existing);
    });

    return Array.from(map.values()).reverse();
  }, [filteredLoads]);

  // Ranking by Vehicle
  const vehicleStats = useMemo(() => {
    const map = new Map<string, { code: string; desc: string; plate: string; liters: number; amount: number; loadsCount: number }>();

    completedLoads.forEach(l => {
      const key = l.vehicle_code || 'SIN_CODIGO';
      const existing = map.get(key) || {
        code: key,
        desc: l.vehicle_description || 'Vehículo General',
        plate: l.plate || '—',
        liters: 0,
        amount: 0,
        loadsCount: 0
      };
      existing.liters += (l.liters || 0);
      existing.amount += (l.total_amount || 0);
      existing.loadsCount += 1;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [completedLoads]);

  // Ranking by Driver/User
  const driverStats = useMemo(() => {
    const map = new Map<string, { name: string; liters: number; amount: number; loadsCount: number }>();

    completedLoads.forEach(l => {
      const name = l.driver_name || l.requested_by || 'Operario No Especificado';
      const existing = map.get(name) || { name, liters: 0, amount: 0, loadsCount: 0 };
      existing.liters += (l.liters || 0);
      existing.amount += (l.total_amount || 0);
      existing.loadsCount += 1;
      map.set(name, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [completedLoads]);

  return (
    <div className="space-y-6">
      {/* Selector & Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <PieChart size={20} className="text-sky-600" /> Analítica y Métricas de Combustible
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Control de litros consumidos, presupuesto invertido y costo por unidad</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedVehicle} 
            onChange={e => setSelectedVehicle(e.target.value)} 
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-sky-500/20 w-full md:w-64"
          >
            <option value="">Toda la Flota (Global)</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.code}>{v.code} — {v.description}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-sky-200 shadow-sm border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-xs font-bold text-sky-700 uppercase mb-2">
            <span>Combustible Consumido</span>
            <Fuel size={18} className="text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-900 font-mono">{fmt(totalLitersAll)} <span className="text-sm font-normal text-sky-700">L</span></p>
          <p className="text-[11px] text-gray-400 mt-1">{filteredLoads.length} cargas registradas</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase mb-2">
            <span>Importe Total Gastado</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-900 font-mono">{fmtCurrency(totalAmountAll)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Presupuesto ejecutado</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 uppercase mb-2">
            <span>Precio Promedio / Litro</span>
            <TrendingUp size={18} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-900 font-mono">$ {fmt(avgPricePerLiter)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Costo ponderado $/L</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-violet-200 shadow-sm border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between text-xs font-bold text-violet-700 uppercase mb-2">
            <span>Cargas Validadas</span>
            <FileCheck size={18} className="text-violet-500" />
          </div>
          <p className="text-2xl font-black text-violet-900 font-mono">{filteredLoads.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">Vales finalizados</p>
        </div>
      </div>

      {/* Main Line Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-sky-600" /> 
              {metricView === 'amount' ? 'Evolución Histórica del Gasto en Combustible ($ ARS)' : 'Evolución del Volúmen Consumido (Litros)'}
            </h4>
            <p className="text-xs text-gray-400">Tendencia mensual de consumo e importe gastado</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setMetricView('amount')} 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${metricView === 'amount' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Importe ($ ARS)
            </button>
            <button 
              onClick={() => setMetricView('liters')} 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${metricView === 'liters' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Litros (L)
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {monthlyAggregated.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos para graficar en el período</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyAggregated} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => metricView === 'amount' ? `$ ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}` : `${v} L`} />
                <RechartsTooltip 
                  formatter={(value: any) => [metricView === 'amount' ? fmtCurrency(Number(value)) : `${fmt(Number(value))} L`, metricView === 'amount' ? 'Gasto' : 'Litros']}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={metricView === 'amount' ? 'amount' : 'liters'} 
                  stroke={metricView === 'amount' ? '#10b981' : '#0284c7'} 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: metricView === 'amount' ? '#10b981' : '#0284c7', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 7 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid Tables: By Vehicle & By Driver */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Vehicle */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Truck size={16} className="text-sky-600" /> Consumo e Importe por Vehículo
            </h4>
            <span className="text-xs text-gray-400">{vehicleStats.length} unidades con consumos</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Patente</th>
                  <th className="text-right">Litros Total</th>
                  <th className="text-right">Importe Gastado ($)</th>
                  <th className="text-center">Cargas</th>
                </tr>
              </thead>
              <tbody>
                {vehicleStats.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-6">Sin cargas registradas</td></tr>
                ) : vehicleStats.map(v => (
                  <tr key={v.code}>
                    <td className="font-medium text-xs">
                      <span className="font-bold text-sky-700 block">{v.code}</span>
                      <span className="text-gray-500 text-[11px]">{v.desc}</span>
                    </td>
                    <td className="font-mono text-xs text-gray-500">{v.plate}</td>
                    <td className="font-mono font-bold text-right text-xs">{fmt(v.liters)} L</td>
                    <td className="font-mono font-bold text-right text-xs text-emerald-700">{fmtCurrency(v.amount)}</td>
                    <td className="text-center text-xs font-mono">{v.loadsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown by Driver */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Users size={16} className="text-indigo-600" /> Consumo e Importe por Usuario / Chofer
            </h4>
            <span className="text-xs text-gray-400">{driverStats.length} responsables</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chofer / Responsable</th>
                  <th className="text-right">Litros Cargados</th>
                  <th className="text-right">Importe Gastado ($)</th>
                  <th className="text-center">Cargas</th>
                </tr>
              </thead>
              <tbody>
                {driverStats.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-6">Sin choferes registrados</td></tr>
                ) : driverStats.map(d => (
                  <tr key={d.name}>
                    <td className="font-medium text-xs text-gray-800">{d.name}</td>
                    <td className="font-mono font-bold text-right text-xs text-sky-700">{fmt(d.liters)} L</td>
                    <td className="font-mono font-bold text-right text-xs text-emerald-700">{fmtCurrency(d.amount)}</td>
                    <td className="text-center text-xs font-mono">{d.loadsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
