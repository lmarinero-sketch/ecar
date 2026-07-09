import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Fuel, Plus, Truck, BarChart3, FileCheck, Droplets, Calendar, X, Check, Pencil, ClipboardCheck, Camera, PieChart, Info, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import { useFuelVehicles, useFuelLoads, useCreateFuelLoad, useUpdateFuelLoad, useFuelBatanMovements, useCreateFuelBatanMovement, useFuelReconciliation, useProjects } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import type { FuelVehicle, FuelLoad } from '../lib/types';
import { useImplementationStore } from '../store/useImplementationStore';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const SUPPLIERS = ['Shell Agro','YPF Agro','Axion','Puma','Otro'];
const FUEL_TYPES = ['Diesel V-Power','Diesel - EVOLUX','Nafta','Aceite'];


const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'requests', label: 'Autorizaciones', icon: ClipboardCheck },
    { id: 'loads', label: 'Cargas Realizadas', icon: Fuel },
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'batan', label: 'Batán', icon: Droplets },
    { id: 'reconciliation', label: 'Conciliación', icon: FileCheck },
    { id: 'fleet', label: 'Flota', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-800 to-sky-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Fuel size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Fuel size={24} /> Control de Combustible</h3>
          <p className="text-sky-100 text-sm mt-1">Registro de cargas, control de batán y conciliación con proveedor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        <div className="lg:col-span-3 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI icon={Fuel} label={`Litros ${currentMonth}`} value={`${fmt(totalLiters)} L`} color="sky" />
            <KPI icon={BarChart3} label={`Importe ${currentMonth}`} value={totalAmount > 0 ? `$ ${fmt(totalAmount)}` : 'Sin precio'} color="emerald" />
            <KPI icon={Calendar} label="Cargas del mes" value={String(monthLoads.length)} color="violet" />
            <KPI icon={Droplets} label="Saldo Batán" value={`${fmt(batanBalance)} L`} color="amber" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === t.id ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === 'requests' && <RequestsTab loads={loads} vehicles={vehicles} updateLoad={updateLoad} createLoad={createLoad} projects={projects} />}
          {tab === 'loads' && <LoadsTab loads={loads} vehicles={vehicles} projects={projects} showForm={showForm} setShowForm={setShowForm} createLoad={createLoad} />}
          {tab === 'dashboard' && <FleetDashboardTab loads={loads} vehicles={vehicles} />}
          {tab === 'batan' && <BatanTab movements={batanMovements} createBatan={createBatan} />}
          {tab === 'reconciliation' && <ReconciliationTab data={reconciliation} />}
          {tab === 'fleet' && <FleetTab vehicles={vehicles} />}
        </div>

        <div className="lg:col-span-1">
          <Batan3dTank balance={batanBalance} capacity={15000} />
        </div>
      </div>
    </div>
  );
};

/* ── KPI Card ── */
const KPI: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Icon size={16} className={`text-${color}-500`} /> {label}</div>
    <p className={`text-xl font-black text-${color}-600 font-mono`}>{value}</p>
  </div>
);

/* ── Loads Tab ── */
const LoadsTab: React.FC<{ loads: FuelLoad[]; vehicles: FuelVehicle[]; projects: any[]; showForm: boolean; setShowForm: (v: boolean) => void; createLoad: any }> = ({ loads, vehicles, projects, showForm, setShowForm, createLoad }) => {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<FuelLoad>>(() => {
    const d = new Date();
    return {
      load_date: d.toISOString().split('T')[0],
      month: MONTHS_ES[d.getMonth()],
      year: d.getFullYear(),
      day_of_week: DAYS_ES[d.getDay()],
      driver_name: user?.email || '',
    };
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ liters: number; price_per_liter: number; total_amount: number }>({ liters: 0, price_per_liter: 0, total_amount: 0 });
  const updateLoad = useUpdateFuelLoad();

  const handleVehicleCode = (code: string) => {
    const v = vehicles.find(x => x.code === code);
    if (v) {
      setForm(f => ({ ...f, vehicle_code: code, vehicle_id: v.id, vehicle_description: v.description, plate: v.plate || '', vehicle_type: v.vehicle_type, fuel_type: v.preferred_fuel || '' }));
    } else {
      setForm(f => ({ ...f, vehicle_code: code }));
    }
  };

  const handleDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    setForm(f => ({ ...f, load_date: dateStr, month: MONTHS_ES[d.getMonth()], year: d.getFullYear(), day_of_week: DAYS_ES[d.getDay()] }));
  };

  const handleSubmit = async () => {
    if (!form.load_date || !form.vehicle_code || !form.liters) return;
    const nextNum = loads.length + 1;
    await createLoad.mutateAsync({ ...form, load_number: `CARGA-${String(nextNum).padStart(4, '0')}`, validation_status: 'pending', load_source: 'station', created_by: 'web' });
    setForm({});
    setShowForm(false);
  };

  const startEdit = (l: FuelLoad) => {
    setEditingId(l.id);
    setEditForm({ liters: l.liters || 0, price_per_liter: l.price_per_liter || 0, total_amount: l.total_amount || 0 });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateLoad.mutateAsync({ id: editingId, liters: editForm.liters, price_per_liter: editForm.price_per_liter, total_amount: editForm.total_amount });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Registro de Cargas</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-sky-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-sky-700 transition-all">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancelar' : 'Nueva Carga'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-700 text-sm">📝 Registrar Carga de Combustible</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Fecha</label>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Código Interno</label>
              <select value={form.vehicle_code || ''} onChange={e => handleVehicleCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccioná...</option>
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
              <label className="text-xs font-bold text-gray-500">Tipo</label>
              <input readOnly value={form.vehicle_type || ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Responsable</label>
              <input readOnly value={form.driver_name || ''} placeholder="Nombre" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
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
              <label className="text-xs font-bold text-gray-500">Proveedor</label>
              <select value={form.supplier || ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccioná...</option>
                {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Tipo Combustible</label>
              <select value={form.fuel_type || ''} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccioná...</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Litros</label>
              <input type="number" step="0.01" value={form.liters || ''} onChange={e => { const l = parseFloat(e.target.value) || 0; setForm(f => ({ ...f, liters: l, total_amount: l * (f.price_per_liter || 0) })); }} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">$/Litro</label>
              <input type="number" step="0.01" value={form.price_per_liter || ''} onChange={e => { const p = parseFloat(e.target.value) || 0; setForm(f => ({ ...f, price_per_liter: p, total_amount: (f.liters || 0) * p })); }} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Importe Total</label>
              <input readOnly value={form.total_amount ? `$ ${fmt(form.total_amount)}` : ''} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">N° Vale</label>
              <input value={form.voucher_number || ''} onChange={e => setForm(f => ({ ...f, voucher_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">N° Remito</label>
              <input value={form.remito_number || ''} onChange={e => setForm(f => ({ ...f, remito_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Observaciones</label>
            <input value={form.observations || ''} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </div>
          <button onClick={handleSubmit} disabled={createLoad.isPending || !form.load_date || !form.vehicle_code || !form.liters} className="bg-sky-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-sky-700 transition-all disabled:opacity-50">
            <Check size={16} /> {createLoad.isPending ? 'Guardando...' : 'Registrar Carga'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Patente</th><th className="px-4 py-3">Litros</th><th className="px-4 py-3">$/L</th>
              <th className="px-4 py-3">Importe</th><th className="px-4 py-3">Vale</th><th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Editar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loads.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400"><Fuel size={40} className="mx-auto mb-2 opacity-30" /><p>No hay cargas registradas</p></td></tr>
            ) : loads.map(l => (
              <tr key={l.id} className={`hover:bg-gray-50 ${editingId === l.id ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.load_number}</td>
                <td className="px-4 py-3">{l.load_date}</td>
                <td className="px-4 py-3 font-medium">{l.vehicle_description} <span className="text-gray-400 text-xs">({l.vehicle_code})</span></td>
                <td className="px-4 py-3 font-mono text-xs">{l.plate}</td>
                {editingId === l.id ? (
                  <>
                    <td className="px-4 py-2"><input type="number" step="0.01" value={editForm.liters} onChange={e => { const lit = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, liters: lit, total_amount: lit * f.price_per_liter })); }} className="w-20 px-2 py-1 border rounded text-sm font-mono" /></td>
                    <td className="px-4 py-2"><input type="number" step="0.01" value={editForm.price_per_liter} onChange={e => { const p = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, price_per_liter: p, total_amount: f.liters * p })); }} className="w-20 px-2 py-1 border rounded text-sm font-mono" /></td>
                    <td className="px-4 py-2 font-mono font-bold text-sm">$ {fmt(editForm.total_amount)}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-mono font-bold">{l.liters} L</td>
                    <td className="px-4 py-3 font-mono text-xs">{l.price_per_liter ? `$ ${fmt(l.price_per_liter)}` : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 font-mono font-bold">{l.total_amount ? `$ ${fmt(l.total_amount)}` : <span className="text-gray-300">Sin precio</span>}</td>
                  </>
                )}
                <td className="px-4 py-3 text-xs">{l.voucher_number}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${l.validation_status === 'ok' ? 'bg-green-100 text-green-700' : l.validation_status === 'observed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {l.validation_status === 'ok' ? 'OK' : l.validation_status === 'observed' ? 'Observado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === l.id ? (
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={saveEdit} disabled={updateLoad.isPending} className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-all" title="Guardar"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all" title="Cancelar"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(l)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-all" title="Editar precio retroactivo"><Pencil size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Batán Tab ── */
const BatanTab: React.FC<{ movements: any[]; createBatan: any }> = ({ movements }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Control de Batán</h3></div>
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
        <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Combustible</th><th className="px-4 py-3">Litros</th><th className="px-4 py-3">Saldo</th><th className="px-4 py-3">Estado</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {movements.length === 0 ? (
          <tr><td colSpan={7} className="text-center py-12 text-gray-400"><Droplets size={40} className="mx-auto mb-2 opacity-30" /><p>Sin movimientos</p></td></tr>
        ) : movements.map(m => (
          <tr key={m.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs">{m.movement_number}</td>
            <td className="px-4 py-3">{m.movement_date}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.movement_type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{m.movement_type === 'purchase' ? 'Compra' : 'Descarga'}</span></td>
            <td className="px-4 py-3">{m.fuel_type}</td>
            <td className="px-4 py-3 font-mono font-bold">{m.liters_loaded || m.liters_discharged} L</td>
            <td className="px-4 py-3 font-mono font-bold text-sky-600">{m.balance_after} L</td>
            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{m.movement_status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Reconciliation Tab ── */
const ReconciliationTab: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Conciliación Mensual con Proveedor</h3></div>
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
        <tr><th className="px-4 py-3">Mes</th><th className="px-4 py-3">Cargas</th><th className="px-4 py-3">Litros</th><th className="px-4 py-3">Importe Planilla</th><th className="px-4 py-3">Factura Proveedor</th><th className="px-4 py-3">Diferencia</th><th className="px-4 py-3">Estado</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map(r => (
          <tr key={r.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{r.month_name} {r.year}</td>
            <td className="px-4 py-3 font-mono">{r.total_loads}</td>
            <td className="px-4 py-3 font-mono">{fmt(r.total_liters)} L</td>
            <td className="px-4 py-3 font-mono">$ {fmt(r.total_amount_sheet)}</td>
            <td className="px-4 py-3 font-mono font-bold">{r.supplier_invoice_amount ? `$ ${fmt(r.supplier_invoice_amount)}` : '—'}</td>
            <td className="px-4 py-3 font-mono font-bold">{r.difference ? <span className={r.difference > 0 ? 'text-red-600' : 'text-green-600'}>$ {fmt(r.difference)}</span> : '—'}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'controlled' ? 'bg-green-100 text-green-700' : r.status === 'observed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status === 'controlled' ? 'Controlado' : r.status === 'observed' ? 'Observado' : 'Pendiente'}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Fleet Tab ── */
const FleetTab: React.FC<{ vehicles: FuelVehicle[] }> = ({ vehicles }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Flota Registrada ({vehicles.length} unidades)</h3></div>
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
        <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Patente</th><th className="px-4 py-3">Combustible</th><th className="px-4 py-3">Tanque</th><th className="px-4 py-3">Área</th><th className="px-4 py-3">Responsable</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {vehicles.map(v => (
          <tr key={v.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono font-bold text-sky-600">{v.code}</td>
            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{v.vehicle_type}</span></td>
            <td className="px-4 py-3 font-medium">{v.description}</td>
            <td className="px-4 py-3 font-mono text-xs">{v.plate || '—'}</td>
            <td className="px-4 py-3 text-xs">{v.preferred_fuel}</td>
            <td className="px-4 py-3 font-mono">{v.tank_capacity_liters ? `${v.tank_capacity_liters} L` : '—'}</td>
            <td className="px-4 py-3 text-xs">{v.area || '—'}</td>
            <td className="px-4 py-3 text-xs">{v.default_driver || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── 3D Batán Tank Component ── */
const Batan3dTank: React.FC<{ balance: number; capacity?: number }> = ({ balance, capacity = 15000 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const percent = Math.min(100, Math.max(0, (balance / capacity) * 100));

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff'); // Pure white inside light card

    // Camera
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0b477d, 0.5);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Group for rotation
    const group = new THREE.Group();
    scene.add(group);

    // 1. Tank Glass Outer Shell
    const tankRadius = 1.2;
    const tankHeight = 3.2;
    
    // Cylinder geometry for outer shell
    const outerGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 32, 1, true);
    const outerMat = new THREE.MeshPhongMaterial({
      color: 0x0b477d,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      shininess: 90,
      depthWrite: false
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    // Tank metal caps (top and bottom)
    const capGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, 0.15, 32);
    const capMat = new THREE.MeshPhongMaterial({
      color: 0x0b477d,
      shininess: 80
    });
    
    const bottomCap = new THREE.Mesh(capGeo, capMat);
    bottomCap.position.y = -tankHeight / 2 - 0.075;
    group.add(bottomCap);

    const topCap = bottomCap.clone();
    topCap.position.y = tankHeight / 2 + 0.075;
    group.add(topCap);

    // Support legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x334155 });
    
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeo, legMat);
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      leg.position.set(
        Math.cos(angle) * (tankRadius - 0.1),
        -tankHeight / 2 - 0.3,
        Math.sin(angle) * (tankRadius - 0.1)
      );
      group.add(leg);
    }

    // 2. Liquid inside
    // Height of liquid is based on balance percentage
    const fillRatio = balance / capacity;
    const liquidHeight = tankHeight * fillRatio;
    
    const liquidGeo = new THREE.CylinderGeometry(tankRadius - 0.05, tankRadius - 0.05, Math.max(0.01, liquidHeight), 32);
    const liquidMat = new THREE.MeshPhongMaterial({
      color: 0x0ea5e9, // Sky blue fuel
      transparent: true,
      opacity: 0.75,
      shininess: 100,
    });
    
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    // Align bottom of liquid mesh with bottom of outer tank
    liquidMesh.position.y = -tankHeight / 2 + liquidHeight / 2;
    group.add(liquidMesh);

    // 3. Grid helper for visual reference
    const grid = new THREE.GridHelper(8, 8, 0xe5e7eb, 0xf3f4f6);
    grid.position.y = -tankHeight / 2 - 0.55;
    scene.add(grid);

    // Animate fluid ripple / physics
    let waveTime = 0;
    let targetY = -tankHeight / 2 + liquidHeight / 2;
    let currentY = targetY;
    let targetScaleY = Math.max(0.001, fillRatio);
    let currentScaleY = targetScaleY;

    // Window resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate group slowly
      group.rotation.y += 0.007;

      // Ripple animation on scale/position to feel alive
      waveTime += 0.05;
      const ripple = Math.sin(waveTime) * 0.03 * (1 - fillRatio) * fillRatio;
      
      // Interpolate values in case balance changes dynamically
      currentY += (targetY - currentY) * 0.1;
      currentScaleY += (targetScaleY - currentScaleY) * 0.1;

      liquidMesh.scale.y = currentScaleY + ripple;
      liquidMesh.position.y = currentY;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [balance, capacity]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3 flex flex-col items-center">
      <div className="w-full flex justify-between items-center px-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tanque Batán 3D</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-green-700 uppercase">Monitoreo</span>
        </div>
      </div>
      
      <div ref={mountRef} className="w-full h-[220px] rounded-lg overflow-hidden border border-gray-100 shadow-inner bg-white" />
      
      <div className="w-full text-center space-y-1">
        <p className="text-2xl font-black text-sky-600 font-mono">{percent.toFixed(1)}%</p>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-[11px] text-gray-400 font-mono">
          {balance.toLocaleString('es-AR')} L / {capacity.toLocaleString('es-AR')} L
        </p>
      </div>
    </div>
  );
};


/* ── Requests Tab ── */
const RequestsTab: React.FC<{ loads: FuelLoad[]; vehicles: FuelVehicle[]; updateLoad: any; createLoad: any; projects: any[] }> = ({ loads, vehicles, updateLoad, createLoad, projects }) => {
  const { user, isAdmin, profile } = useAuth();
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', observations: '' });
  
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
  const pendingRequests = loads.filter(l => l.workflow_status === 'requested');
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
    // Scale from display size to canvas internal resolution
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
      // Force page reload to get updated profile
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
      fuel_type: v?.preferred_fuel,
      requested_liters: parseFloat(reqForm.requested_liters) || 0,
      odometer_km: parseInt(reqForm.odometer_km) || null,
      project_name: reqForm.project_name || null,
      observations: reqForm.observations,
      requested_by: user?.email || 'Operario',
      workflow_status: 'requested',
      created_by: 'web'
    });
    setReqForm({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', observations: '' });
    setShowReqForm(false);
  };

  const handleAuthorize = async (id: string) => {
    if (!profile?.dni || !profile?.signature_data) {
      setShowSignaturePanel(true);
      return;
    }
    const signature = `Firmado por: ${profile.full_name} (DNI: ${profile.dni}) - ${new Date().toLocaleString()}`;
    await updateLoad.mutateAsync({
      id,
      workflow_status: 'authorized',
      authorized_by: profile.full_name,
      authorized_at: new Date().toISOString(),
      supervisor_signature: signature
    });
  };

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ liters: '', price_per_liter: '', total_amount: '' });

  const handleComplete = async () => {
    if (!completingId || !completeForm.liters) return;
    await updateLoad.mutateAsync({
      id: completingId,
      liters: parseFloat(completeForm.liters) || 0,
      price_per_liter: parseFloat(completeForm.price_per_liter) || 0,
      total_amount: parseFloat(completeForm.total_amount) || 0,
      workflow_status: 'completed'
    });
    setCompletingId(null);
  };

  // Build shareable link
  const shareableLink = `${window.location.origin}/fuel-request`;

  return (
    <div className="space-y-6">
      {/* ── Shareable Link + Signature Banner ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shareable Link Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
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
        {isAdmin && (
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

      {/* ── Signature Registration Panel (expandable) ── */}
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

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Autorizaciones de Carga</h3>
        <button onClick={() => setShowReqForm(!showReqForm)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-orange-700 transition-all">
          {showReqForm ? <X size={16} /> : <Plus size={16} />} Nueva Solicitud
        </button>
      </div>

      {showReqForm && (
        <div className="bg-white border-2 border-orange-200 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="font-bold text-gray-700 text-sm">📝 Solicitud de Carga (Operario)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Vehículo</label>
              <select value={reqForm.vehicle_code} onChange={e => setReqForm({ ...reqForm, vehicle_code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccioná...</option>
                {vehicles.map(v => <option key={v.id} value={v.code}>{v.code} — {v.description}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Litros Solicitados</label>
              <input type="number" step="0.1" value={reqForm.requested_liters} onChange={e => setReqForm({ ...reqForm, requested_liters: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Odómetro (Km) / Horómetro (Hs)</label>
              <input type="number" value={reqForm.odometer_km} onChange={e => setReqForm({ ...reqForm, odometer_km: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Obra / CC</label>
              <select value={reqForm.project_name} onChange={e => setReqForm({ ...reqForm, project_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Uso General</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Motivo / Notas</label>
            <input value={reqForm.observations} onChange={e => setReqForm({ ...reqForm, observations: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: Viaje a obra interior..." />
          </div>
          <button onClick={handleRequestSubmit} disabled={!reqForm.vehicle_code || !reqForm.requested_liters} className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold text-sm shadow-md disabled:opacity-50">Enviar Solicitud a Gerencia</button>
        </div>
      )}

      {/* Pending Auth */}
      <div>
        <h4 className="font-bold text-gray-600 mb-3 text-sm flex items-center gap-2"><Info size={16} className="text-orange-500" /> Pendientes de Autorización (Gerencia)</h4>
        {pendingRequests.length === 0 ? <p className="text-sm text-gray-400 italic">No hay solicitudes pendientes.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRequests.map(r => (
              <div key={r.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm relative">
                <div className="text-xs font-bold text-orange-600 mb-1">{r.vehicle_code} - {r.vehicle_description}</div>
                <div className="text-sm">Solicita: <span className="font-bold">{r.requested_by}</span></div>
                <div className="text-sm">Litros: <span className="font-mono font-bold text-lg">{r.requested_liters} L</span></div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{r.observations || 'Sin notas'}</div>
                {isAdmin ? (
                  <button onClick={() => handleAuthorize(r.id)} className="mt-3 w-full bg-orange-600 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-orange-700">
                    <Check size={14} /> Autorizar con Firma
                  </button>
                ) : (
                  <div className="mt-3 w-full bg-orange-100 text-orange-700 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
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
                  onClick={() => {
                    const doc = new jsPDF();
                    doc.setFontSize(20);
                    doc.text("Vale de Combustible / Lubricantes", 20, 20);
                    doc.setFontSize(12);
                    doc.text(`Fecha Solicitud: ${new Date(r.load_date).toLocaleDateString()}`, 20, 35);
                    doc.text(`Vehículo / Máquina: ${r.vehicle_code}`, 20, 45);
                    doc.text(`Odómetro / Horómetro: ${r.odometer_km || '-'}`, 20, 55);
                    doc.text(`Litros Solicitados: ${r.requested_liters} L`, 20, 65);
                    doc.text(`Solicitante: ${r.requested_by}`, 20, 75);
                    doc.text(`Centro de Costo: ${r.project_name || 'Uso General'}`, 20, 85);
                    
                    doc.setFontSize(14);
                    doc.text("Autorización de Gerencia", 20, 110);
                    doc.setFontSize(10);
                    doc.text(r.supervisor_signature || '', 20, 120);
                    
                    if (profile?.signature_data) {
                      try {
                        doc.addImage(profile.signature_data, 'PNG', 20, 130, 60, 20);
                      } catch (e) {
                        console.error("Error embedding signature", e);
                      }
                    }
                    
                    doc.save(`Vale_Combustible_${r.vehicle_code}_${r.id.substring(0,6)}.pdf`);
                  }}
                  className="mt-2 text-xs font-bold text-ecar-blue hover:text-blue-800 flex items-center gap-1"
                >
                  <Download size={14} /> Descargar PDF Autorizado
                </button>
                {completingId === r.id ? (
                  <div className="mt-3 bg-white p-2 rounded-lg border border-green-200 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500">Lts Reales</label>
                        <input type="number" step="0.1" value={completeForm.liters} onChange={e => { const l = parseFloat(e.target.value) || 0; setCompleteForm({ ...completeForm, liters: e.target.value, total_amount: String(l * (parseFloat(completeForm.price_per_liter) || 0)) }); }} className="w-full px-2 py-1 text-xs border rounded bg-gray-50 font-mono" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500">Monto Final</label>
                        <input type="number" step="0.1" value={completeForm.total_amount} onChange={e => setCompleteForm({ ...completeForm, total_amount: e.target.value })} className="w-full px-2 py-1 text-xs border rounded bg-gray-50 font-mono" />
                      </div>
                    </div>
                    <label className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors border border-gray-300">
                      <Camera size={14} /> Foto del Ticket
                      <input type="file" accept="image/*" capture="environment" className="hidden" />
                    </label>
                    <div className="flex gap-1">
                      <button onClick={handleComplete} className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold">Cargar</button>
                      <button onClick={() => setCompletingId(null)} className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-bold">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setCompletingId(r.id); setCompleteForm({ liters: String(r.requested_liters || 0), price_per_liter: '', total_amount: '' }); }} className="mt-3 w-full bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700 shadow-sm">
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


/* ── Dashboard Tab ── */
const FleetDashboardTab: React.FC<{ loads: FuelLoad[]; vehicles: FuelVehicle[] }> = ({ loads, vehicles }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  
  const completedLoads = loads.filter(l => l.workflow_status === 'completed' || !l.workflow_status);

  // Stats
  const totalLitersAll = completedLoads.reduce((s, l) => s + (l.liters || 0), 0);
  
  // Group by month
  const loadsByMonth = completedLoads.reduce((acc, load) => {
    const k = `${load.month} ${load.year}`;
    if (!acc[k]) acc[k] = { name: k, liters: 0, amount: 0, count: 0 };
    acc[k].liters += (load.liters || 0);
    acc[k].amount += (load.total_amount || 0);
    acc[k].count += 1;
    return acc;
  }, {} as Record<string, any>);
  const monthlyData = Object.values(loadsByMonth).reverse(); // Assuming descending order from loads

  // Selected vehicle data
  const vehicleLoads = selectedVehicle ? completedLoads.filter(l => l.vehicle_code === selectedVehicle) : [];
  const vTotalLiters = vehicleLoads.reduce((s, l) => s + (l.liters || 0), 0);
  const vAvgLiters = vehicleLoads.length ? vTotalLiters / vehicleLoads.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <h3 className="font-bold text-gray-800">Dashboard de Flota</h3>
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[200px]">
          <option value="">Toda la flota (Global)</option>
          {vehicles.map(v => <option key={v.id} value={v.code}>{v.code} — {v.description}</option>)}
        </select>
      </div>

      {!selectedVehicle ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Litros Totales Históricos</p>
              <p className="text-2xl font-black text-sky-600 font-mono mt-1">{totalLitersAll.toLocaleString('es-AR')} L</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Cargas Realizadas</p>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{completedLoads.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Litros Mes Actual</p>
              <p className="text-2xl font-black text-purple-600 font-mono mt-1">
                {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].liters.toLocaleString('es-AR') : 0} L
              </p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-[300px]">
            <h4 className="font-bold text-gray-700 text-sm mb-4">Evolución de Consumo (Litros por Mes)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <RechartsTooltip formatter={(value: any) => [`${Number(value).toLocaleString('es-AR')} L`, 'Litros']} />
                <Bar dataKey="liters" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-sky-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Última Carga</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{vehicleLoads[0] ? new Date(vehicleLoads[0].load_date).toLocaleDateString('es-AR') : 'N/A'}</p>
              {vehicleLoads[0] && <p className="text-xs text-gray-500 mt-1">{vehicleLoads[0].liters} L - {vehicleLoads[0].odometer_km ? `${vehicleLoads[0].odometer_km} km` : ''}</p>}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Carga Promedio</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{vAvgLiters.toLocaleString('es-AR', {maximumFractionDigits:1})} L</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Cargas Totales (Vehículo)</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{vehicleLoads.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-[300px]">
            <h4 className="font-bold text-gray-700 text-sm mb-4">Historial Reciente de Cargas</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...vehicleLoads].reverse().slice(-10)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="load_date" tick={{fontSize: 10}} tickFormatter={v => new Date(v).toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit'})} />
                <YAxis tick={{fontSize: 12}} />
                <RechartsTooltip labelFormatter={v => new Date(v).toLocaleDateString('es-AR')} formatter={(value: any) => [`${value} L`, 'Litros']} />
                <Line type="monotone" dataKey="liters" stroke="#ea580c" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
