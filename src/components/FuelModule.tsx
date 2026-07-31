import React, { useState, useMemo, useRef, useEffect } from 'react';

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
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Fuel size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Fuel size={24} /> Control de Combustible</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Registro de cargas, control de batán y conciliación con proveedor</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 items-start">
        <div className="w-full space-y-6">
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
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancelar' : 'Nueva Carga'}
        </button>
      </div>

      {showForm && (
        <div className="light-card p-5 space-y-4">
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
              <input type="number" step="0.01" value={form.total_amount || ''} onChange={e => { const t = parseFloat(e.target.value) || 0; setForm(f => ({ ...f, total_amount: t, price_per_liter: f.liters ? t / f.liters : f.price_per_liter })); }} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold" />
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
          <button onClick={handleSubmit} disabled={createLoad.isPending || !form.load_date || !form.vehicle_code || !form.liters} className="btn-primary disabled:opacity-50">
            <Check size={16} /> {createLoad.isPending ? 'Guardando...' : 'Registrar Carga'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="light-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Fecha</th><th>Vehículo</th>
              <th>Patente</th><th>Litros</th><th>$/L</th>
              <th>Importe</th><th>Vale</th><th>Estado</th>
              <th className="text-center">Editar</th>
            </tr>
          </thead>
          <tbody>
            {loads.length === 0 ? (
              <tr><td colSpan={10} className="text-center text-gray-400"><Fuel size={40} className="mx-auto mb-2 opacity-30" /><p>No hay cargas registradas</p></td></tr>
            ) : loads.map(l => (
              <tr key={l.id} className={`${editingId === l.id ? 'bg-blue-50/50' : ''}`}>
                <td className="font-mono text-xs text-gray-500">{l.load_number}</td>
                <td>{l.load_date}</td>
                <td className="font-medium">{l.vehicle_description} <span className="text-gray-400 text-xs">({l.vehicle_code})</span></td>
                <td className="font-mono text-xs">{l.plate}</td>
                {editingId === l.id ? (
                  <>
                    <td><input type="number" step="0.01" value={editForm.liters} onChange={e => { const lit = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, liters: lit, total_amount: lit * f.price_per_liter })); }} className="w-20 px-2 py-1 border rounded text-sm font-mono" /></td>
                    <td><input type="number" step="0.01" value={editForm.price_per_liter} onChange={e => { const p = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, price_per_liter: p, total_amount: f.liters * p })); }} className="w-20 px-2 py-1 border rounded text-sm font-mono" /></td>
                    <td><input type="number" step="0.01" value={editForm.total_amount} onChange={e => { const t = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, total_amount: t, price_per_liter: f.liters ? t / f.liters : f.price_per_liter })); }} className="w-24 px-2 py-1 border rounded text-sm font-mono font-bold" /></td>
                  </>
                ) : (
                  <>
                    <td className="font-mono font-bold">{l.liters} L</td>
                    <td className="font-mono text-xs">{l.price_per_liter ? `$ ${fmt(l.price_per_liter)}` : <span className="text-gray-300">—</span>}</td>
                    <td className="font-mono font-bold">{l.total_amount ? `$ ${fmt(l.total_amount)}` : <span className="text-gray-300">Sin precio</span>}</td>
                  </>
                )}
                <td className="text-xs">{l.voucher_number}</td>
                <td>
                  <span className={`badge ${l.validation_status === 'ok' ? 'badge-success' : l.validation_status === 'observed' ? 'badge-danger' : 'badge-warning'}`}>
                    {l.validation_status === 'ok' ? 'OK' : l.validation_status === 'observed' ? 'Observado' : 'Pendiente'}
                  </span>
                </td>
                <td className="text-center">
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
  <div className="light-card overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Control de Batán</h3></div>
    <table className="data-table">
      <thead>
        <tr><th>ID</th><th>Fecha</th><th>Tipo</th><th>Combustible</th><th>Litros</th><th>Saldo</th><th>Estado</th></tr>
      </thead>
      <tbody>
        {movements.length === 0 ? (
          <tr><td colSpan={7} className="text-center text-gray-400"><Droplets size={40} className="mx-auto mb-2 opacity-30" /><p>Sin movimientos</p></td></tr>
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
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Conciliación Mensual con Proveedor</h3></div>
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
            <td className="text-xs">{v.preferred_fuel}</td>
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
        <button onClick={() => setShowReqForm(!showReqForm)} className="btn-primary">
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
          <button onClick={handleRequestSubmit} disabled={!reqForm.vehicle_code || !reqForm.requested_liters} className="btn-primary w-full justify-center disabled:opacity-50">Enviar Solicitud a Gerencia</button>
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
                  onClick={async () => {
                    const doc = new jsPDF('p', 'pt', 'a4');
                    
                    // ECAR Corporate Background (Diagonal bands)
                    // Top Blue Band
                    doc.setFillColor(11, 34, 64); // ECAR Blue
                    doc.triangle(0, 0, 600, 0, 600, 100, 'F');
                    doc.triangle(0, 0, 600, 100, 0, 160, 'F');

                    // Top Red Band
                    doc.setFillColor(210, 32, 39); // ECAR Red
                    doc.triangle(0, 160, 600, 100, 600, 115, 'F');
                    doc.triangle(0, 160, 600, 115, 0, 175, 'F');

                    // Bottom Blue Band
                    doc.setFillColor(11, 34, 64);
                    doc.triangle(0, 780, 600, 700, 600, 842, 'F');
                    doc.triangle(0, 780, 600, 842, 0, 842, 'F');

                    // Bottom Red Band
                    doc.setFillColor(210, 32, 39);
                    doc.triangle(0, 765, 600, 685, 600, 700, 'F');
                    doc.triangle(0, 765, 600, 700, 0, 780, 'F');
                    
                    // Attempt to load ECAR logo
                    try {
                      const response = await fetch('/logoECAR.png');
                      if (response.ok) {
                        const blob = await response.blob();
                        const base64 = await new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result as string);
                          reader.readAsDataURL(blob);
                        });
                        // Draw white box for logo
                        doc.setFillColor(255, 255, 255);
                        doc.roundedRect(30, 30, 140, 60, 5, 5, 'F');
                        
                        doc.addImage(base64, 'PNG', 40, 40, 120, 42);
                      }
                    } catch (e) {
                      console.warn("No se pudo cargar el logo para el PDF", e);
                    }

                    // Header formatting
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(11, 34, 64); // ECAR Blue
                    doc.setFontSize(22);
                    doc.text("VALE DE COMBUSTIBLE Y LUBRICANTES", 40, 220);
                    
                    // Red/Blue line separator
                    doc.setDrawColor(210, 32, 39); // ECAR Red
                    doc.setLineWidth(3);
                    doc.line(40, 235, 300, 235);
                    doc.setDrawColor(11, 34, 64); // ECAR Blue
                    doc.line(300, 235, 550, 235);

                    // Content
                    doc.setFontSize(12);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont("helvetica", "normal");
                    
                    const startY = 280;
                    const lineSpacing = 28;
                    
                    doc.setFont("helvetica", "bold");
                    doc.text("Fecha Solicitud:", 40, startY);
                    doc.setFont("helvetica", "normal");
                    doc.text(new Date(r.load_date).toLocaleDateString(), 140, startY);

                    doc.setFont("helvetica", "bold");
                    doc.text("Vehículo / Máquina:", 40, startY + lineSpacing);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${r.vehicle_code} - ${r.vehicle_description || ''}`, 170, startY + lineSpacing);

                    doc.setFont("helvetica", "bold");
                    doc.text("Odómetro / Horómetro:", 40, startY + lineSpacing * 2);
                    doc.setFont("helvetica", "normal");
                    doc.text(String(r.odometer_km || '-'), 190, startY + lineSpacing * 2);

                    doc.setFont("helvetica", "bold");
                    doc.text("Litros Solicitados:", 40, startY + lineSpacing * 3);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${r.requested_liters} L`, 160, startY + lineSpacing * 3);

                    doc.setFont("helvetica", "bold");
                    doc.text("Solicitante:", 40, startY + lineSpacing * 4);
                    doc.setFont("helvetica", "normal");
                    doc.text(r.requested_by || '', 120, startY + lineSpacing * 4);

                    doc.setFont("helvetica", "bold");
                    doc.text("Centro de Costo / Obra:", 40, startY + lineSpacing * 5);
                    doc.setFont("helvetica", "normal");
                    doc.text(r.project_name || 'Uso General', 190, startY + lineSpacing * 5);

                    // Signature Section
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
                        // Very large signature layout
                        doc.addImage(profile.signature_data, 'PNG', 40, sigY + 45, 180, 60);
                      } catch (e) {
                        console.error("Error embedding signature", e);
                      }
                    }

                    // Footer
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
  const [chartMode, setChartMode] = useState<'grouped' | 'split'>('grouped');
  
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
    // For split view
    if (load.vehicle_code) {
      acc[k][load.vehicle_code] = (acc[k][load.vehicle_code] || 0) + (load.liters || 0);
    }
    return acc;
  }, {} as Record<string, any>);
  const monthlyData = Object.values(loadsByMonth).reverse();

  // Colors for split view
  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-2xl font-black text-ecar-blue font-mono mt-1">
                {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].liters.toLocaleString('es-AR') : 0} L
              </p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-[350px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-700 text-sm">Evolución de Consumo (Litros por Mes)</h4>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setChartMode('grouped')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartMode === 'grouped' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Global</button>
                <button onClick={() => setChartMode('split')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartMode === 'split' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Por Vehículo</button>
              </div>
            </div>
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <RechartsTooltip formatter={(value: any, name: any) => [`${Number(value).toLocaleString('es-AR')} L`, name === 'liters' ? 'Total' : name]} />
                  {chartMode === 'grouped' ? (
                    <Bar dataKey="liters" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  ) : (
                    vehicles.map((v, i) => (
                      <Bar key={v.code} dataKey={v.code} stackId="a" fill={COLORS[i % COLORS.length]} />
                    ))
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
