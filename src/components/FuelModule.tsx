import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Fuel, Plus, Truck, BarChart3, FileCheck, Droplets, Calendar, X, Check, Pencil, ClipboardCheck, Camera, PieChart, Info, Download, Trash2, Users, DollarSign, TrendingUp, Image as ImageIcon } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import { useFuelVehicles, useFuelLoads, useCreateFuelLoad, useUpdateFuelLoad, useDeleteFuelLoad, useFuelBatanMovements, useCreateFuelBatanMovement, useFuelReconciliation, useProjects } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useStore';
import type { FuelVehicle, FuelLoad } from '../lib/types';
import { useImplementationStore } from '../store/useImplementationStore';

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

type Tab = 'loads' | 'requests' | 'batan' | 'reconciliation' | 'fleet' | 'dashboard';

export const FuelModule: React.FC = () => {
  const [tab, setTab] = useState<Tab>('loads');

  useEffect(() => {
    if (tab === 'loads') {
      useImplementationStore.getState().completeItem('e60');
    } else if (tab === 'batan') {
      useImplementationStore.getState().completeItem('e61');
    } else if (tab === 'reconciliation') {
      useImplementationStore.getState().completeItem('e62');
    }
  }, [tab]);

  const [showForm, setShowForm] = useState(false);
  const { data: vehicles = [] } = useFuelVehicles();
  const { data: loads = [] } = useFuelLoads();
  const { data: batanMovements = [] } = useFuelBatanMovements();
  const { data: reconciliation = [] } = useFuelReconciliation();
  const { data: projects = [] } = useProjects();
  const createLoad = useCreateFuelLoad();
  const updateLoad = useUpdateFuelLoad();
  const createBatan = useCreateFuelBatanMovement();

  const now = new Date();
  const currentMonth = MONTHS_ES[now.getMonth()];
  const monthLoads = useMemo(() => loads.filter(l => l.month === currentMonth && l.year === now.getFullYear()), [loads, currentMonth]);
  const totalLiters = monthLoads.reduce((s, l) => s + (l.liters || 0), 0);
  const totalAmount = monthLoads.reduce((s, l) => s + (l.total_amount || 0), 0);
  const batanBalance = batanMovements.length > 0 ? (batanMovements[0].balance_after || 0) : 0;

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
    { id: 'reconciliation', label: 'Conciliación', icon: FileCheck },
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
          {tab === 'batan' && <BatanTab movements={batanMovements} createBatan={createBatan} />}
          {tab === 'reconciliation' && <ReconciliationTab data={reconciliation} />}
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
      alert("Por favor, complete los datos básicos (Fecha, Vehículo, Litros).");
      return;
    }
    if (!isBatan && (!form.total_amount && !form.price_per_liter)) {
      alert("Por favor, ingrese el Importe Total o el Precio por Litro facturado.");
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
          observations: `Consumo asociado a la carga: CARGA-${String(nextNum).padStart(4, '0')}`
        });
      }

      setForm({ fuel_source: 'station', supplier: 'YPF', station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power' });
      setShowForm(false);
    } catch (err: any) {
      console.error("Error al registrar carga:", err);
      alert("Error al registrar la carga: " + (err.message || 'Error desconocido'));
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
    } catch (err: any) {
      alert("Error al guardar edición: " + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Registro de Cargas Realizadas</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancelar' : 'Nueva Carga'}
        </button>
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
                disabled={form.fuel_source === 'batan'}
                value={form.supplier || 'YPF'} 
                onChange={e => {
                  const s = e.target.value;
                  if (s === 'Batán Interno') {
                    setForm(f => ({ ...f, fuel_source: 'batan', supplier: s, station_name: s, price_per_liter: 0, total_amount: 0 }));
                  } else {
                    setForm(f => ({ ...f, supplier: s, station_name: s }));
                  }
                }} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
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
                  setForm(f => ({ ...f, liters: l, total_amount: l * (f.price_per_liter || 0) })); 
                }} 
                className="w-full px-3 py-2 border border-sky-300 rounded-xl text-sm font-mono font-bold bg-white" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-sky-800">$/Litro (Precio Unitario) *</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Ej: 1250"
                value={form.price_per_liter || ''} 
                disabled={isFormBatan} 
                onChange={e => { 
                  const p = parseFloat(e.target.value) || 0; 
                  setForm(f => ({ ...f, price_per_liter: p, total_amount: (f.liters || 0) * p })); 
                }} 
                className="w-full px-3 py-2 border border-sky-300 rounded-xl text-sm font-mono bg-white disabled:opacity-50" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-sky-800">Importe Total ($) *</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Ej: 62500"
                value={form.total_amount || ''} 
                disabled={isFormBatan} 
                onChange={e => { 
                  const t = parseFloat(e.target.value) || 0; 
                  setForm(f => ({ ...f, total_amount: t, price_per_liter: f.liters ? t / f.liters : f.price_per_liter })); 
                }} 
                className="w-full px-3 py-2 border border-sky-300 rounded-xl text-sm font-mono font-black text-sky-900 bg-white disabled:opacity-50" 
              />
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

      {/* Table */}
      <div className="light-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
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
            {loads.length === 0 ? (
              <tr><td colSpan={11} className="text-center text-gray-400 py-8"><Fuel size={40} className="mx-auto mb-2 opacity-30" /><p>No hay cargas registradas</p></td></tr>
            ) : loads.map(l => (
              <tr key={l.id} className={`${editingId === l.id ? 'bg-blue-50/50' : ''}`}>
                <td className="font-mono text-xs text-gray-500">{l.load_number}</td>
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
                  {l.voucher_number && <div className="text-[10px] text-gray-400 font-mono">Vale: {l.voucher_number}</div>}
                </td>
                <td>
                  <span className={`badge ${l.validation_status === 'ok' ? 'badge-success' : l.validation_status === 'observed' ? 'badge-danger' : 'badge-warning'}`}>
                    {l.validation_status === 'ok' ? 'OK' : l.validation_status === 'observed' ? 'Observado' : 'Pendiente'}
                  </span>
                  {l.unauthorized_load && <span className="block mt-1 badge bg-amber-100 text-amber-800 text-[9px] border-amber-200">Sin Autorizar</span>}
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
                          onClick={() => { if (window.confirm('¿Seguro que deseás borrar esta carga?')) deleteLoad.mutateAsync(l.id); }} 
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

/* ── Batán Tab ── */
const BatanTab: React.FC<{ movements: any[]; createBatan: any }> = ({ movements }) => (
  <div className="light-card overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Control de Batán Interno</h3></div>
    <table className="data-table">
      <thead>
        <tr><th>ID</th><th>Fecha</th><th>Tipo</th><th>Combustible</th><th>Litros</th><th>Saldo</th><th>Estado</th></tr>
      </thead>
      <tbody>
        {movements.length === 0 ? (
          <tr><td colSpan={7} className="text-center text-gray-400 py-8"><Droplets size={40} className="mx-auto mb-2 opacity-30" /><p>Sin movimientos en batán</p></td></tr>
        ) : movements.map(m => (
          <tr key={m.id}>
            <td className="font-mono text-xs">{m.movement_number}</td>
            <td>{m.movement_date}</td>
            <td><span className={`badge ${m.movement_type === 'purchase' ? 'badge-info' : 'badge-warning'}`}>{m.movement_type === 'purchase' ? 'Compra' : 'Descarga'}</span></td>
            <td>{m.fuel_type}</td>
            <td className="font-mono font-bold">{m.liters_loaded || m.liters_discharged} L</td>
            <td className="font-mono font-bold text-sky-600">{m.balance_after} L</td>
            <td><span className="badge badge-success">{m.movement_status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Reconciliation Tab ── */
const ReconciliationTab: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="light-card overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Conciliación Mensual con Proveedores</h3></div>
    <table className="data-table">
      <thead>
        <tr><th>Mes</th><th>Cargas</th><th>Litros</th><th>Importe Planilla</th><th>Factura Proveedor</th><th>Diferencia</th><th>Estado</th></tr>
      </thead>
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
      const loadObj = loads.find(x => x.id === completingId);
      await createBatan.mutateAsync({
        movement_date: new Date().toISOString().split('T')[0],
        movement_type: 'discharge',
        fuel_type: completeForm.fuel_type || loadObj?.fuel_type || 'Diesel Premium / V-Power',
        liters_discharged: finalLiters,
        movement_status: 'completed',
        reference_load: loadObj?.load_number
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
              <div key={r.id} className={`${r.unauthorized_load ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4 shadow-sm relative`}>
                <div className={`text-xs font-bold mb-1 ${r.unauthorized_load ? 'text-red-600' : 'text-orange-600'}`}>{r.vehicle_code} - {r.vehicle_description}</div>
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
              <div key={r.id} className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-bold text-green-700">{r.vehicle_code}</div>
                  <div className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-mono">Autorizado</div>
                </div>
                <div className="text-sm">Litros autorizados: <span className="font-mono font-bold">{r.requested_liters} L</span></div>
                <div className="text-[10px] text-gray-500 font-mono mt-1 bg-white p-1 rounded border border-green-100 line-clamp-2">
                  {r.supervisor_signature}
                </div>
                <button 
                  onClick={async () => {
                    const doc = new jsPDF('p', 'pt', 'a4');
                    doc.setFillColor(11, 34, 64);
                    doc.triangle(0, 0, 600, 0, 600, 100, 'F');
                    doc.triangle(0, 0, 600, 100, 0, 160, 'F');

                    doc.setFillColor(210, 32, 39);
                    doc.triangle(0, 160, 600, 100, 600, 115, 'F');
                    doc.triangle(0, 160, 600, 115, 0, 175, 'F');

                    doc.setFillColor(11, 34, 64);
                    doc.triangle(0, 780, 600, 700, 600, 842, 'F');
                    doc.triangle(0, 780, 600, 842, 0, 842, 'F');

                    doc.setFillColor(210, 32, 39);
                    doc.triangle(0, 765, 600, 685, 600, 700, 'F');
                    doc.triangle(0, 765, 600, 700, 0, 780, 'F');
                    
                    try {
                      const response = await fetch('/logoECAR.png');
                      if (response.ok) {
                        const blob = await response.blob();
                        const base64 = await new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result as string);
                          reader.readAsDataURL(blob);
                        });
                        doc.setFillColor(255, 255, 255);
                        doc.roundedRect(30, 30, 140, 60, 5, 5, 'F');
                        doc.addImage(base64, 'PNG', 40, 40, 120, 42);
                      }
                    } catch (e) {
                      console.warn("Logo PDF error", e);
                    }

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(11, 34, 64);
                    doc.setFontSize(22);
                    doc.text("VALE DE COMBUSTIBLE Y LUBRICANTES", 40, 220);
                    
                    doc.setDrawColor(210, 32, 39);
                    doc.setLineWidth(3);
                    doc.line(40, 235, 300, 235);
                    doc.setDrawColor(11, 34, 64);
                    doc.line(300, 235, 550, 235);

                    doc.setFontSize(12);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont("helvetica", "normal");
                    
                    const startY = 270;
                    const lineSpacing = 28;
                    
                    const formatLocalDate = (dateStr?: string) => {
                      if (!dateStr) return '-';
                      const parts = dateStr.split('T')[0].split('-');
                      if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      }
                      return dateStr;
                    };

                    doc.setFont("helvetica", "bold");
                    doc.text("Fecha Solicitud:", 40, startY);
                    doc.setFont("helvetica", "normal");
                    doc.text(formatLocalDate(r.load_date), 140, startY);

                    doc.setFont("helvetica", "bold");
                    doc.text("Vehículo / Máquina:", 40, startY + lineSpacing);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${r.vehicle_code} - ${r.vehicle_description || ''}`, 170, startY + lineSpacing);

                    doc.setFont("helvetica", "bold");
                    doc.text("Odómetro / Horómetro:", 40, startY + lineSpacing * 2);
                    doc.setFont("helvetica", "normal");
                    doc.text(String(r.odometer_km || '-'), 190, startY + lineSpacing * 2);

                    doc.setFont("helvetica", "bold");
                    doc.text("Tipo de Combustible:", 40, startY + lineSpacing * 3);
                    doc.setFont("helvetica", "normal");
                    doc.text(r.fuel_type || 'Diesel Premium / V-Power', 180, startY + lineSpacing * 3);

                    doc.setFont("helvetica", "bold");
                    doc.text("Litros Solicitados:", 40, startY + lineSpacing * 4);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${r.requested_liters} L`, 160, startY + lineSpacing * 4);

                    doc.setFont("helvetica", "bold");
                    doc.text("Solicitante:", 40, startY + lineSpacing * 5);
                    doc.setFont("helvetica", "normal");
                    doc.text(r.requested_by || '', 120, startY + lineSpacing * 5);

                    doc.setFont("helvetica", "bold");
                    doc.text("Centro de Costo / Obra:", 40, startY + lineSpacing * 6);
                    doc.setFont("helvetica", "normal");
                    doc.text(r.project_name || 'Uso General', 190, startY + lineSpacing * 6);

                    const sigY = 500;
                    doc.setFontSize(16);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(11, 34, 64);
                    doc.text("Autorización de Gerencia", 40, sigY);
                    
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(60, 60, 60);
                    
                    const sigText = r.supervisor_signature || '';
                    const splitText = doc.splitTextToSize(sigText, 500);
                    doc.text(splitText, 40, sigY + 25);

                    if (profile?.signature_data) {
                      try {
                        doc.addImage(profile.signature_data, 'PNG', 40, sigY + 45, 180, 60);
                      } catch (e) {
                        console.error("Error embedding signature", e);
                      }
                    }

                    doc.setFontSize(9);
                    doc.setTextColor(150, 150, 150);
                    doc.text(`ID Sistema: ${r.id}`, 40, 800);
                    
                    doc.save(`Vale_Combustible_${r.vehicle_code}_${r.id.substring(0,6)}.pdf`);
                  }}
                  className="mt-2 text-xs font-bold text-ecar-blue hover:text-blue-800 flex items-center gap-1"
                >
                  <Download size={14} /> Descargar PDF Autorizado
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
                      <Camera size={14} /> Foto del Ticket (Opcional)
                      <input type="file" accept="image/*" capture="environment" className="hidden" />
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
