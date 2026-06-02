import React, { useState, useEffect } from 'react';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import {
  ClipboardCheck, CheckCircle2, Loader2, AlertTriangle,
  CircleCheck, CircleX, ChevronDown, ChevronUp
} from 'lucide-react';
import type { FuelVehicle, VehicleChecklistItem, VehicleFuelLevel, VehicleCondition } from '../lib/types';

const DEFAULT_CHECKLIST: VehicleChecklistItem[] = [
  { item: 'Luces delanteras y traseras', estado: 'ok' },
  { item: 'Frenos', estado: 'ok' },
  { item: 'Neumáticos (presión y desgaste)', estado: 'ok' },
  { item: 'Nivel de aceite', estado: 'ok' },
  { item: 'Nivel de agua / refrigerante', estado: 'ok' },
  { item: 'Espejos retrovisores', estado: 'ok' },
  { item: 'Cinturón de seguridad', estado: 'ok' },
  { item: 'Limpieza interior', estado: 'ok' },
  { item: 'Herramientas de a bordo', estado: 'ok' },
  { item: 'Matafuego (carga vigente)', estado: 'ok' },
  { item: 'Botiquín primeros auxilios', estado: 'ok' },
  { item: 'Balizas / triángulos', estado: 'ok' },
  { item: 'Limpiaparabrisas', estado: 'ok' },
  { item: 'Bocina', estado: 'ok' },
];

const FUEL_LEVELS: { value: VehicleFuelLevel; label: string; icon: string; pct: number }[] = [
  { value: 'vacio', label: 'Vacío', icon: '🔴', pct: 0 },
  { value: 'cuarto', label: '1/4', icon: '🟠', pct: 25 },
  { value: 'medio', label: '1/2', icon: '🟡', pct: 50 },
  { value: 'tres_cuartos', label: '3/4', icon: '🟢', pct: 75 },
  { value: 'lleno', label: 'Lleno', icon: '🟢', pct: 100 },
];

const VEHICLE_ICON: Record<string, string> = {
  camion: '🚛', camioneta: '🛻', auto: '🚗', maquinaria: '🏗️', moto: '🏍️', otro: '🚐',
  'Camioneta': '🛻', 'Camión': '🚛', 'Equipo': '🏗️', 'Mini cargadora': '🏗️', 'Retroexcavadora': '🏗️', 'Batán': '🛢️',
};

type PageStatus = 'loading' | 'form' | 'success' | 'error';

export const VehicleCheckInPage: React.FC<{ vehicleId: string }> = ({ vehicleId }) => {
  const [status, setStatus] = useState<PageStatus>('loading');
  const [vehicle, setVehicle] = useState<FuelVehicle | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [driverName, setDriverName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [fuelLevel, setFuelLevel] = useState<VehicleFuelLevel>('medio');
  const [checklist, setChecklist] = useState<VehicleChecklistItem[]>(DEFAULT_CHECKLIST.map(c => ({ ...c })));
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    try {
      // Load vehicle
      const { data: v, error: vErr } = await supabase
        .from('fuel_vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      if (vErr || !v) {
        setError('Vehículo no encontrado. Verificá que el QR sea correcto.');
        setStatus('error');
        return;
      }
      setVehicle(v as FuelVehicle);
      if (v.default_driver) setDriverName(v.default_driver);

      // Load projects
      const { data: p } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      setProjects(p || []);

      setStatus('form');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setStatus('error');
    }
  };

  const faultsCount = checklist.filter(c => c.estado === 'falla').length;
  const kmValue = odometerKm ? parseInt(odometerKm) : null;
  const kmInvalid = kmValue !== null && vehicle?.current_km != null && kmValue < vehicle.current_km;
  const computedCondition: VehicleCondition = hasDamage || faultsCount >= 3
    ? 'fuera_de_servicio'
    : faultsCount > 0
      ? 'con_observaciones'
      : 'operativo';

  const toggleCheckItem = (idx: number) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, estado: c.estado === 'ok' ? 'falla' : 'ok' } : c));
  };

  const setCheckNote = (idx: number, nota: string) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, nota } : c));
  };

  const handleSubmit = async () => {
    if (!driverName.trim() || kmInvalid) return;
    setSaving(true);

    try {
      const today = new Date().toISOString().slice(0, 10);

      // 1. Insert report
      const { error: insertErr } = await supabase
        .from('vehicle_daily_reports')
        .insert({
          tenant_id: ECAR_TENANT_ID,
          vehicle_id: vehicleId,
          report_date: today,
          driver_name: driverName.trim(),
          project_id: projectId || null,
          odometer_km: odometerKm ? parseInt(odometerKm) : null,
          fuel_level: fuelLevel,
          checklist,
          has_damage: hasDamage,
          damage_description: hasDamage ? damageDescription : null,
          damage_photos: [],
          observations: observations.trim() || null,
          signed_by: signedBy.trim() || driverName.trim(),
          vehicle_condition_after: computedCondition,
          source: 'qr',
        });
      if (insertErr) throw insertErr;

      // 2. Update vehicle
      const vehicleUpdates: Record<string, unknown> = {
        vehicle_condition: computedCondition,
      };
      if (odometerKm) vehicleUpdates.current_km = parseInt(odometerKm);
      if (hasDamage && damageDescription) {
        vehicleUpdates.next_maintenance_date = today;
        vehicleUpdates.maintenance_notes = `[REPORTE QR] ${damageDescription.substring(0, 200)}`;
      }
      await supabase.from('fuel_vehicles').update(vehicleUpdates).eq('id', vehicleId);

      setStatus('success');
    } catch (err: any) {
      setError('Error al guardar: ' + (err?.message || 'Intentá de nuevo'));
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-800 to-violet-600 px-4 py-4 shadow-md">
        <div className="flex items-center justify-center gap-3">
          <ClipboardCheck size={24} className="text-white" />
          <div className="text-center">
            <h1 className="text-white text-lg font-bold">Parte Diario Vehicular</h1>
            <p className="text-indigo-200 text-xs">ECAR · Inspección por QR</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 size={48} className="mx-auto text-indigo-500 animate-spin" />
              <p className="text-gray-500 text-sm font-medium">Cargando vehículo...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="py-12">
            <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4 shadow-lg">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Error</h2>
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={() => { setStatus('loading'); setError(''); loadData(); }}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="py-12">
            <div className="bg-white border border-green-200 rounded-2xl p-8 text-center space-y-5 shadow-lg">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={56} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-700">¡Reporte Enviado!</h2>
              <p className="text-gray-500 text-sm">
                {vehicle?.code} — {vehicle?.description}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                <p className="text-sm text-gray-600"><strong>Chofer:</strong> {driverName}</p>
                <p className="text-sm text-gray-600"><strong>Estado:</strong> {
                  computedCondition === 'operativo' ? '🟢 Operativo' :
                  computedCondition === 'con_observaciones' ? '🟡 Con observaciones' : '🔴 Fuera de servicio'
                }</p>
                {hasDamage && (
                  <p className="text-sm text-red-600 font-medium">⚠️ Daño reportado — Se generó ticket de mantenimiento</p>
                )}
              </div>
              <p className="text-xs text-gray-400">Podés cerrar esta página</p>
            </div>
          </div>
        )}

        {/* Form */}
        {status === 'form' && vehicle && (
          <div className="space-y-5">
            {/* Vehicle Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center text-3xl shrink-0">
                {VEHICLE_ICON[vehicle.vehicle_type] || '🚐'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{vehicle.code} — {vehicle.description}</p>
                <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                  {vehicle.plate && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{vehicle.plate}</span>}
                  {vehicle.brand && <span>{vehicle.brand} {vehicle.model}</span>}
                </div>
                {vehicle.current_km && (
                  <p className="text-[11px] text-gray-400 mt-1">Último km: {vehicle.current_km.toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Driver + Project */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Chofer / Responsable *</label>
                <input
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Obra / Proyecto</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white"
                >
                  <option value="">Sin asignar</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Km Odómetro</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={odometerKm}
                  onChange={e => setOdometerKm(e.target.value)}
                  min={vehicle.current_km || 0}
                  placeholder={vehicle.current_km ? `Mínimo: ${vehicle.current_km.toLocaleString()} km` : 'Km actuales'}
                  className={`w-full px-4 py-3 border rounded-xl text-sm font-mono ${
                    kmInvalid
                      ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300 focus:border-red-400'
                      : 'border-gray-300 focus:ring-indigo-300 focus:border-indigo-400'
                  }`}
                />
                {kmInvalid && (
                  <div className="flex items-center gap-1.5 mt-1.5 px-1">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 font-medium">
                      No puede ser menor a {vehicle.current_km!.toLocaleString()} km (último registro)
                    </p>
                  </div>
                )}
                {vehicle.current_km && !kmInvalid && odometerKm && (
                  <p className="text-[11px] text-green-600 mt-1 px-1">✓ +{(parseInt(odometerKm) - vehicle.current_km).toLocaleString()} km desde último registro</p>
                )}
              </div>
            </div>

            {/* Fuel Level */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Nivel de Combustible</label>
              <div className="grid grid-cols-5 gap-2">
                {FUEL_LEVELS.map(fl => (
                  <button
                    key={fl.value}
                    type="button"
                    onClick={() => setFuelLevel(fl.value)}
                    className={`py-3 rounded-xl text-center transition-all border-2 ${
                      fuelLevel === fl.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-lg block">{fl.icon}</span>
                    <span className="text-[10px] font-bold text-gray-600">{fl.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    fuelLevel === 'vacio' ? 'bg-red-500' : fuelLevel === 'cuarto' ? 'bg-orange-500' : fuelLevel === 'medio' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${FUEL_LEVELS.find(f => f.value === fuelLevel)?.pct || 0}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowChecklist(!showChecklist)}
                className="w-full p-4 flex items-center justify-between bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-indigo-600" />
                  <span className="font-bold text-gray-800 text-sm">Checklist</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${faultsCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {faultsCount > 0 ? `${faultsCount} falla${faultsCount > 1 ? 's' : ''}` : 'Todo OK'}
                  </span>
                </div>
                {showChecklist ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {showChecklist && (
                <div className="divide-y divide-gray-100">
                  {checklist.map((item, idx) => (
                    <div key={idx} className={`p-3 flex items-start gap-3 ${item.estado === 'falla' ? 'bg-red-50/50' : ''} active:bg-gray-50 transition-colors`}>
                      <button
                        type="button"
                        onClick={() => toggleCheckItem(idx)}
                        className={`mt-0.5 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          item.estado === 'ok'
                            ? 'bg-green-100 text-green-600 active:bg-green-200'
                            : 'bg-red-100 text-red-600 active:bg-red-200'
                        }`}
                      >
                        {item.estado === 'ok' ? <CircleCheck size={22} /> : <CircleX size={22} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.estado === 'falla' ? 'text-red-700' : 'text-gray-700'}`}>
                          {item.item}
                        </p>
                        {item.estado === 'falla' && (
                          <input
                            value={item.nota || ''}
                            onChange={e => setCheckNote(idx, e.target.value)}
                            placeholder="Detalle..."
                            className="w-full mt-1.5 px-3 py-2 border border-red-200 rounded-lg text-xs bg-white"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Damage */}
            <div className={`bg-white border rounded-xl p-4 transition-all ${hasDamage ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDamage}
                  onChange={e => setHasDamage(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-gray-300 text-red-500 focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-sm text-gray-800">¿Hay algo roto o dañado?</span>
                  <p className="text-[11px] text-gray-500">Se genera ticket de mantenimiento</p>
                </div>
              </label>

              {hasDamage && (
                <textarea
                  value={damageDescription}
                  onChange={e => setDamageDescription(e.target.value)}
                  placeholder="Describí el daño o problema..."
                  rows={3}
                  className="w-full mt-3 px-4 py-3 border border-red-200 rounded-xl text-sm"
                  required
                />
              )}
            </div>

            {/* Observations */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Observaciones</label>
              <textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
              />
            </div>

            {/* Signature */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Firma (nombre)</label>
              <input
                value={signedBy}
                onChange={e => setSignedBy(e.target.value)}
                placeholder={driverName || 'Tu nombre completo'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
              />
            </div>

            {/* Condition Preview */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              computedCondition === 'operativo' ? 'bg-green-50 border-green-200' :
              computedCondition === 'con_observaciones' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <span className="text-2xl">
                {computedCondition === 'operativo' ? '🟢' : computedCondition === 'con_observaciones' ? '🟡' : '🔴'}
              </span>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Estado resultante</p>
                <p className={`font-bold text-sm ${
                  computedCondition === 'operativo' ? 'text-green-700' :
                  computedCondition === 'con_observaciones' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {computedCondition === 'operativo' ? 'Operativo' :
                   computedCondition === 'con_observaciones' ? 'Con observaciones' : 'Fuera de servicio'}
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving || !driverName.trim() || kmInvalid}
              className="w-full bg-gradient-to-r from-indigo-700 to-violet-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 size={20} className="animate-spin" /> Guardando...</>
              ) : (
                <><ClipboardCheck size={20} /> Enviar Parte Diario</>
              )}
            </button>

            <p className="text-center text-[10px] text-gray-400 pb-4">ECAR · SISTEMA CREADO POR GROW LABS</p>
          </div>
        )}
      </main>
    </div>
  );
};
