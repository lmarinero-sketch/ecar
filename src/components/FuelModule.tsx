import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Fuel, Plus, Truck, BarChart3, FileCheck, Droplets, Calendar, X, Check } from 'lucide-react';
import { useFuelVehicles, useFuelLoads, useCreateFuelLoad, useFuelBatanMovements, useCreateFuelBatanMovement, useFuelReconciliation, useProjects } from '../hooks/useData';
import type { FuelVehicle, FuelLoad } from '../lib/types';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const SUPPLIERS = ['Shell Agro','YPF Agro','Axion','Puma','Otro'];
const FUEL_TYPES = ['Diesel V-Power','Diesel - EVOLUX','Nafta','Aceite'];


const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Tab = 'loads' | 'batan' | 'reconciliation' | 'fleet';

export const FuelModule: React.FC = () => {
  const [tab, setTab] = useState<Tab>('loads');
  const [showForm, setShowForm] = useState(false);
  const { data: vehicles = [] } = useFuelVehicles();
  const { data: loads = [] } = useFuelLoads();
  const { data: batanMovements = [] } = useFuelBatanMovements();
  const { data: reconciliation = [] } = useFuelReconciliation();
  const { data: projects = [] } = useProjects();
  const createLoad = useCreateFuelLoad();
  const createBatan = useCreateFuelBatanMovement();

  const now = new Date();
  const currentMonth = MONTHS_ES[now.getMonth()];
  const monthLoads = useMemo(() => loads.filter(l => l.month === currentMonth && l.year === now.getFullYear()), [loads, currentMonth]);
  const totalLiters = monthLoads.reduce((s, l) => s + (l.liters || 0), 0);
  const totalAmount = monthLoads.reduce((s, l) => s + (l.total_amount || 0), 0);
  const batanBalance = batanMovements.length > 0 ? (batanMovements[0].balance_after || 0) : 0;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'loads', label: 'Cargas', icon: Fuel },
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
          {tab === 'loads' && <LoadsTab loads={loads} vehicles={vehicles} projects={projects} showForm={showForm} setShowForm={setShowForm} createLoad={createLoad} />}
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
  const [form, setForm] = useState<Partial<FuelLoad>>({});

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Registro de Cargas</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancelar' : 'Nueva Carga'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-700 text-sm">📝 Registrar Carga de Combustible</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Fecha</label>
              <input type="date" value={form.load_date || ''} onChange={e => handleDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue" />
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
              <input value={form.driver_name || ''} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} placeholder="Nombre" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
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
          <button onClick={handleSubmit} disabled={createLoad.isPending || !form.load_date || !form.vehicle_code || !form.liters} className="bg-ecar-blue text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all disabled:opacity-50">
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
              <th className="px-4 py-3">Patente</th><th className="px-4 py-3">Responsable</th><th className="px-4 py-3">Obra</th>
              <th className="px-4 py-3">Litros</th><th className="px-4 py-3">Vale</th><th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loads.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400"><Fuel size={40} className="mx-auto mb-2 opacity-30" /><p>No hay cargas registradas</p></td></tr>
            ) : loads.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.load_number}</td>
                <td className="px-4 py-3">{l.load_date}</td>
                <td className="px-4 py-3 font-medium">{l.vehicle_description} <span className="text-gray-400 text-xs">({l.vehicle_code})</span></td>
                <td className="px-4 py-3 font-mono text-xs">{l.plate}</td>
                <td className="px-4 py-3">{l.driver_name}</td>
                <td className="px-4 py-3 text-xs">{l.project_name}</td>
                <td className="px-4 py-3 font-mono font-bold">{l.liters} L</td>
                <td className="px-4 py-3 text-xs">{l.voucher_number}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${l.validation_status === 'ok' ? 'bg-green-100 text-green-700' : l.validation_status === 'observed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {l.validation_status === 'ok' ? 'OK' : l.validation_status === 'observed' ? 'Observado' : 'Pendiente'}
                  </span>
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
