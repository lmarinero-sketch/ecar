import React, { useState, useEffect } from 'react';
import { Check, Send, Truck, Droplets, Gauge, FileText, AlertCircle, Building2 } from 'lucide-react';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';

type Vehicle = { id: string; code: string; description: string; vehicle_type: string; plate?: string };
type Project = { id: string; name: string };

export const FuelRequestPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const STATIONS = ['YPF', 'Shell', 'Axion', 'Puma', 'YPF Agro', 'Shell Agro', 'Batán Interno', 'Estación Obra', 'Otro'];
  const FUEL_TYPES = ['Diesel 500 / Ultradiesel', 'Diesel Premium / V-Power', 'Diesel EVOLUX', 'Nafta Súper', 'Nafta Premium', 'Aceite / Lubricante', 'Otro'];

  const [form, setForm] = useState({
    vehicle_code: '',
    requested_liters: '',
    odometer_km: '',
    project_name: '',
    requested_by: '',
    observations: '',
    station_name: 'YPF',
    fuel_type: 'Diesel Premium / V-Power',
  });

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [vRes, pRes] = await Promise.all([
          supabase.from('fuel_vehicles').select('id, code, description, vehicle_type, plate, preferred_fuel').eq('status', 'active').order('code'),
          supabase.from('projects').select('id, name').eq('status', 'active').order('name'),
        ]);
        setVehicles(vRes.data || []);
        setProjects(pRes.data || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!form.vehicle_code || !form.requested_liters || !form.requested_by) {
      setError('Completá Vehículo, Litros y Tu Nombre');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const vehicle = vehicles.find(v => v.code === form.vehicle_code);
      const { error: dbError } = await supabase.from('fuel_loads').insert({
        tenant_id: ECAR_TENANT_ID,
        load_number: `SOL-${Date.now().toString(36).toUpperCase()}`,
        load_date: new Date().toISOString().slice(0, 10),
        vehicle_code: form.vehicle_code,
        vehicle_id: vehicle?.id,
        vehicle_description: vehicle?.description || '',
        vehicle_type: vehicle?.vehicle_type || '',
        plate: vehicle?.plate || '',
        requested_liters: parseFloat(form.requested_liters),
        odometer_km: form.odometer_km ? parseInt(form.odometer_km) : null,
        project_name: form.project_name || null,
        requested_by: form.requested_by,
        observations: form.observations || null,
        supplier: form.station_name,
        station_name: form.station_name,
        fuel_type: form.fuel_type || vehicle?.preferred_fuel || 'Diesel Premium / V-Power',
        workflow_status: 'requested',
        driver_name: form.requested_by,
        liters: 0,
        load_source: form.station_name === 'Batán Interno' ? 'batan' : 'station',
        validation_status: 'pending',
      });

      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Error al enviar solicitud');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin mb-4" />
        <p className="text-ecar-blue font-bold tracking-widest uppercase text-sm">Cargando Flota...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4 relative overflow-hidden">
        {/* ECAR Corporate Background */}
        <div className="absolute top-0 left-0 right-0 h-[35vh] bg-ecar-blue transform origin-top-left -skew-y-6 z-0 shadow-lg"></div>
        <div className="absolute top-[35vh] left-0 right-0 h-4 bg-ecar-red transform origin-top-left -skew-y-6 z-0 translate-y-[-100%] shadow-md"></div>
        
        <div className="relative z-10 bg-white rounded-2xl p-10 text-center max-w-md w-full border border-gray-100 shadow-2xl animate-fade-in-up">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100 shadow-inner">
            <Check size={48} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-ecar-blue mb-3">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-2">
            Tu pedido de <span className="text-ecar-red font-bold">{form.requested_liters} litros</span> para el vehículo <span className="text-ecar-blue font-bold">{form.vehicle_code}</span> fue registrado exitosamente.
          </p>
          <p className="text-gray-400 text-sm mb-8 font-medium">
            Gerencia recibirá la solicitud y la autorizará desde el sistema.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', requested_by: '', observations: '' }); }}
            className="bg-ecar-blue hover:bg-ecar-blueDark text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl w-full"
          >
            Nueva Solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4 relative overflow-hidden">
      {/* ECAR Corporate Background */}
      <div className="fixed top-0 left-0 right-0 h-[45vh] bg-ecar-blue transform origin-top-left -skew-y-3 z-0 shadow-2xl"></div>
      <div className="fixed top-[45vh] left-0 right-0 h-8 bg-ecar-red transform origin-top-left -skew-y-3 z-0 translate-y-[-100%] shadow-xl"></div>
      
      <div className="fixed bottom-0 right-0 left-0 h-[15vh] bg-ecar-blue transform origin-bottom-right -skew-y-2 z-0 opacity-10"></div>
      
      <div className="relative z-10 w-full max-w-xl my-8">
        
        {/* Header / Logo */}
        <div className="text-center mb-8 animate-fade-in flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 mb-4 transform hover:scale-105 transition-transform">
            <img src="/logoECAR.png" alt="ECAR Logo" className="h-16 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40"><text x="10" y="30" font-family="Arial" font-size="24" font-weight="bold" fill="%230B2240">ECAR</text></svg>';
            }} />
          </div>
          <h1 className="text-white font-black text-2xl tracking-wide shadow-black drop-shadow-md">VALE DE COMBUSTIBLE</h1>
          <p className="text-white/80 text-xs uppercase tracking-[0.3em] font-bold mt-1 drop-shadow-sm">Solicitud Interna</p>
        </div>

        {/* Form Card */}
        <div className="light-card ">
          
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-2">
              <div className="bg-ecar-blueLight p-2 rounded-lg">
                <FileText className="text-ecar-blue" size={24} />
              </div>
              <div>
                <h2 className="text-ecar-blue font-black text-xl">Datos del Pedido</h2>
                <p className="text-gray-400 text-sm">Completá la información para solicitar carga</p>
              </div>
            </div>

            {/* Nombre del operario */}
            <div>
              <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                Tu Nombre Completo <span className="text-ecar-red">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={form.requested_by}
                onChange={e => setForm({ ...form, requested_by: e.target.value })}
                className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all font-medium"
              />
            </div>

            {/* Vehículo */}
            <div>
              <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Truck size={16} className="text-ecar-red" /> Vehículo / Máquina <span className="text-ecar-red">*</span>
              </label>
              <select
                value={form.vehicle_code}
                onChange={e => setForm({ ...form, vehicle_code: e.target.value })}
                className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all font-medium appearance-none"
              >
                <option value="">Seleccionar vehículo...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.code}>
                    {v.code} — {v.description} {v.plate ? `(${v.plate})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Row: Estación + Tipo de Combustible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  Estación de Servicio Preferida
                </label>
                <select
                  value={form.station_name}
                  onChange={e => setForm({ ...form, station_name: e.target.value })}
                  className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all font-medium appearance-none"
                >
                  {STATIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  Tipo de Combustible
                </label>
                <select
                  value={form.fuel_type}
                  onChange={e => setForm({ ...form, fuel_type: e.target.value })}
                  className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all font-medium appearance-none"
                >
                  {FUEL_TYPES.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row: Litros + Odómetro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Droplets size={16} className="text-ecar-red" /> Litros <span className="text-ecar-red">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 50"
                  value={form.requested_liters}
                  onChange={e => setForm({ ...form, requested_liters: e.target.value })}
                  className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 font-mono placeholder:text-gray-400 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all text-lg font-bold"
                />
              </div>
              <div>
                <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Gauge size={16} className="text-gray-400" /> Km / Hs
                </label>
                <input
                  type="number"
                  placeholder="Ej: 150325"
                  value={form.odometer_km}
                  onChange={e => setForm({ ...form, odometer_km: e.target.value })}
                  className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 font-mono placeholder:text-gray-400 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all text-lg font-bold"
                />
              </div>
            </div>

            {/* Obra / CC */}
            <div>
              <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Building2 size={16} className="text-gray-400" /> Obra / Centro de Costo
              </label>
              <select
                value={form.project_name}
                onChange={e => setForm({ ...form, project_name: e.target.value })}
                className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all font-medium appearance-none"
              >
                <option value="">Uso General (sin obra)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Observaciones */}
            <div>
              <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider mb-2 block">Motivo / Notas</label>
              <textarea
                placeholder="Ej: Viaje a obra interior..."
                rows={2}
                value={form.observations}
                onChange={e => setForm({ ...form, observations: e.target.value })}
                className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blueLight transition-all resize-none font-medium"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-ecar-red px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {/* Submit */}
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-ecar-blue hover:bg-ecar-blueDark text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando Solicitud...
                  </>
                ) : (
                  <>
                    <Send size={22} /> Enviar Solicitud a Gerencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 font-medium text-xs mt-8">
          ECAR Constructora • Sistema de Gestión Integral
        </p>
      </div>
    </div>
  );
};
