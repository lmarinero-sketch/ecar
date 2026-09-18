import React, { useState, useEffect } from 'react';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import {
  ClipboardCheck, CheckCircle2, Loader2, AlertTriangle,
  CircleCheck, CircleX, ChevronDown, ChevronUp, WifiOff,
  Camera, Sparkles, Check, Clock
} from 'lucide-react';
import type { FuelVehicle, VehicleChecklistItem, VehicleFuelLevel, VehicleCondition } from '../lib/types';
import { useOfflineStore } from '../store/useOfflineStore';
import { checkVehicleMaintenance } from '../lib/vehicleMaintenance';

// ... (skipping some constants) ...

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


const compressImageFile = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

type PageStatus = 'loading' | 'form' | 'success' | 'error' | 'offline_saved';

export const VehicleCheckInPage: React.FC<{ vehicleId: string }> = ({ vehicleId }) => {
  const [status, setStatus] = useState<PageStatus>('loading');
  const [vehicle, setVehicle] = useState<FuelVehicle | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const addDailyReport = useOfflineStore((s) => s.addDailyReport);

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

  // 4-Angle Photographic Inspection with AI
  type PhotoSlot = {
    id: 'frente' | 'lateral_izquierdo' | 'lateral_derecho' | 'trasera';
    label: string;
    icon: string;
    file: File | null;
    preview: string | null;
  };

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([
    { id: 'frente', label: 'Frente', icon: '🚗', file: null, preview: null },
    { id: 'lateral_izquierdo', label: 'Lateral Izq.', icon: '◀️', file: null, preview: null },
    { id: 'lateral_derecho', label: 'Lateral Der.', icon: '▶️', file: null, preview: null },
    { id: 'trasera', label: 'Trasera', icon: '🔙', file: null, preview: null },
  ]);

  const [inspectingAi, setInspectingAi] = useState(false);
  const [aiInspectionResult, setAiInspectionResult] = useState<{
    has_damage: boolean;
    severity: 'ninguno' | 'leve' | 'moderado' | 'critico';
    detected_issues: string[];
    summary: string;
    recommended_condition: 'operativo' | 'con_observaciones' | 'fuera_de_servicio';
  } | null>(null);
  const [aiInspectionError, setAiInspectionError] = useState<string | null>(null);

  const handlePhotoCapture = async (slotId: PhotoSlot['id'], file: File) => {
    try {
      const preview = await compressImageFile(file, 800, 800, 0.7);
      setPhotoSlots(prev => prev.map(s => s.id === slotId ? { ...s, file, preview } : s));
    } catch (e) {
      console.warn('Error reading photo:', e);
    }
  };

  const handleInspectPhotosWithAi = async () => {
    const filledSlots = photoSlots.filter(s => s.file);
    if (filledSlots.length === 0) return;
    setInspectingAi(true);
    setAiInspectionError(null);

    try {
      const photosPayload = await Promise.all(
        filledSlots.map(async s => {
          const compressed = await compressImageFile(s.file!, 1000, 1000, 0.8);
          return {
            angle: s.label,
            image_base64: compressed.split(',')[1],
            mime_type: 'image/jpeg',
          };
        })
      );

      const { data, error: fnErr } = await supabase.functions.invoke('inspect-vehicle-photos', {
        body: {
          photos: photosPayload,
          vehicle_info: {
            code: vehicle?.code,
            plate: vehicle?.plate,
            description: vehicle?.description,
          },
        },
      });

      if (fnErr || !data?.success) {
        throw new Error(data?.error || fnErr?.message || 'Error al inspeccionar fotos.');
      }

      const res = data.data;
      setAiInspectionResult(res);

      if (res.has_damage) {
        setHasDamage(true);
        const desc = `${res.summary || ''}\n${(res.detected_issues || []).join('\n')}`.trim();
        setDamageDescription(prev => prev ? `${prev}\n${desc}` : desc);
      }
    } catch (err: any) {
      console.error('Error inspecting photos:', err);
      setAiInspectionError(err.message || 'No se pudo completar el peritaje de IA.');
    } finally {
      setInspectingAi(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    if (!navigator.onLine) {
      // Si estamos offline desde el inicio y queremos leer datos, podemos intentar con cache
      // Pero para este MVP asumimos que el código QR tiene info o el service worker lo cachea.
      // Acá lo ideal sería cargar los datos del vehículo desde un cache local.
      // Por simplicidad en este MVP, fallamos elegantemente o permitimos carga parcial.
      setError('Necesitás internet al menos una vez para cargar los datos del vehículo.');
      setStatus('error');
      return;
    }

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
      const { data: p, error: pErr } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('name');
      if (pErr) console.warn('Error al cargar proyectos en checkin:', pErr);
      const activeProjects = (p || []).filter(proj => !proj.status || proj.status === 'active');
      setProjects(activeProjects.length > 0 ? activeProjects : (p || []));

      setStatus('form');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setStatus('error');
    }
  };

  const faultsCount = checklist.filter(c => c.estado === 'falla').length;
  const kmValue = odometerKm ? parseFloat(odometerKm) : null;
  const kmInvalid = kmValue !== null && vehicle?.tracking_type !== 'hours' && vehicle?.current_km != null && kmValue < vehicle.current_km;
  const hoursInvalid = kmValue !== null && vehicle?.tracking_type === 'hours' && vehicle?.current_hours != null && kmValue < vehicle.current_hours;
  const isInvalid = kmInvalid || hoursInvalid;
  const maintenanceAlert = vehicle ? checkVehicleMaintenance(vehicle, kmValue) : null;
  const computedCondition: VehicleCondition = (hasDamage || faultsCount > 0 || maintenanceAlert?.isOverdue)
    ? 'con_observaciones'
    : 'operativo';

  const toggleCheckItem = (idx: number) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, estado: c.estado === 'ok' ? 'falla' : 'ok' } : c));
  };

  const setCheckNote = (idx: number, nota: string) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, nota } : c));
  };

  const handleSubmit = async () => {
    if (!driverName.trim() || isInvalid) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);

    // Upload 4-angle inspection photos
    const uploadedPhotoUrls: string[] = [];
    const filledSlots = photoSlots.filter(s => s.file);
    if (filledSlots.length > 0 && isOnline) {
      for (const slot of filledSlots) {
        try {
          const fileName = `checkin_${vehicle?.code || 'veh'}_${slot.id}_${Date.now()}.jpg`;
          const base64 = await compressImageFile(slot.file!, 1200, 1200, 0.8);
          const fileObj = dataURLtoFile(base64, fileName);

          const { data: upData, error: upErr } = await supabase.storage
            .from('parte-diario-fotos')
            .upload(fileName, fileObj, { upsert: true });

          if (!upErr && upData) {
            const { data: pUrl } = supabase.storage.from('parte-diario-fotos').getPublicUrl(fileName);
            uploadedPhotoUrls.push(pUrl.publicUrl);
          } else {
            const { data: fData, error: fErr } = await supabase.storage
              .from('fuel_tickets')
              .upload(fileName, fileObj, { upsert: true });
            if (!fErr && fData) {
              const { data: pUrl } = supabase.storage.from('fuel_tickets').getPublicUrl(fileName);
              uploadedPhotoUrls.push(pUrl.publicUrl);
            } else {
              uploadedPhotoUrls.push(base64);
            }
          }
        } catch (photoErr) {
          console.warn('Error saving checkin photo:', photoErr);
        }
      }
    }
    const reportPayload = {
      tenant_id: ECAR_TENANT_ID,
      vehicle_id: vehicleId,
      report_date: today,
      report_time: null,
      driver_name: driverName.trim(),
      project_id: projectId || null,
      odometer_km: vehicle?.tracking_type === 'hours' ? null : (odometerKm ? parseInt(odometerKm) : null),
      hourmeter: vehicle?.tracking_type === 'hours' ? (odometerKm ? parseFloat(odometerKm) : null) : null,
      fuel_level: fuelLevel,
      checklist,
      has_damage: hasDamage,
      damage_description: hasDamage ? damageDescription : null,
      damage_photos: uploadedPhotoUrls,
      observations: observations.trim() || null,
      signed_by: signedBy.trim() || driverName.trim(),
      vehicle_condition_after: computedCondition,
      source: 'qr' as const,
    };

    if (!isOnline) {
      // Guardar localmente
      addDailyReport({
        ...reportPayload,
        offline_id: crypto.randomUUID(),
        saved_at: new Date().toISOString(),
      });
      setStatus('offline_saved');
      setSaving(false);
      return;
    }

    try {
      // 1. Insert report
      const { error: insertErr } = await supabase.from('vehicle_daily_reports').insert(reportPayload);
      if (insertErr) throw insertErr;

      // 2. Update vehicle
      const vehicleUpdates: Record<string, unknown> = {
        vehicle_condition: computedCondition,
      };
      if (odometerKm) {
        if (vehicle?.tracking_type === 'hours') vehicleUpdates.current_hours = parseFloat(odometerKm);
        else vehicleUpdates.current_km = parseInt(odometerKm);
      }
      if (hasDamage && damageDescription) {
        vehicleUpdates.next_maintenance_date = today;
        vehicleUpdates.maintenance_notes = `[REPORTE QR] ${damageDescription.substring(0, 200)}`;
      } else if (maintenanceAlert?.isOverdue) {
        vehicleUpdates.maintenance_notes = `[SERVICE VENCIDO] ${maintenanceAlert.summary} (Lectura: ${odometerKm} ${vehicle?.tracking_type === 'hours' ? 'hs' : 'km'})`;
      }
      await supabase.from('fuel_vehicles').update(vehicleUpdates).eq('id', vehicleId);

      // 3. Generar Orden de Trabajo automática en Taller si está vencido y no hay una pendiente
      if (maintenanceAlert?.isOverdue) {
        try {
          const { data: existingOrders } = await supabase
            .from('fleet_maintenance_orders')
            .select('id')
            .eq('vehicle_id', vehicleId)
            .eq('status', 'pendiente')
            .limit(1);

          if (!existingOrders || existingOrders.length === 0) {
            await supabase.from('fleet_maintenance_orders').insert({
              tenant_id: ECAR_TENANT_ID,
              vehicle_id: vehicleId,
              title: `Service Preventivo Vencido (${maintenanceAlert.primaryReason === 'hours' ? 'Horas' : 'Km'})`,
              description: `Alerta automática por reporte QR de ${driverName.trim()}. ${maintenanceAlert.summary}. Lectura cargada: ${odometerKm} ${vehicle?.tracking_type === 'hours' ? 'hs' : 'km'}.`,
              status: 'pendiente',
              cost_materials: 0,
              cost_labor: 0,
              total_cost: 0,
              odometer_at_entry: kmValue ? Math.round(kmValue) : null,
              created_by: `Check-in QR (${driverName.trim()})`,
            });
          }
        } catch (otErr) {
          console.warn('No se pudo registrar la orden de trabajo automática:', otErr);
        }
      }

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
      <header className="bg-ecar-blueDark p-6 text-center relative overflow-hidden shadow-md shrink-0 z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-700/30 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="bg-white rounded-xl p-2 inline-block mb-3 relative z-10 shadow-md">
          <img src="/rombo.jpeg" alt="Logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex flex-col items-center justify-center gap-1 text-white relative z-10">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={20} className="text-blue-300" />
            <h1 className="text-lg font-bold tracking-wide">Parte Diario Vehicular</h1>
          </div>
          <p className="text-blue-200 text-xs">Inspección por código QR</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 size={48} className="mx-auto text-ecar-blue animate-spin" />
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
                className="w-full py-3 rounded-xl bg-ecar-blue text-white font-bold text-sm hover:bg-ecar-blue transition-all"
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
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 text-left">
                <p className="text-sm text-gray-600"><strong>Chofer:</strong> {driverName}</p>
                <p className="text-sm text-gray-600"><strong>Estado:</strong> {
                  computedCondition === 'operativo' ? '🟢 Operativo' :
                  computedCondition === 'con_observaciones' ? '🟡 Con observaciones' : '🔴 Fuera de servicio'
                }</p>
                {hasDamage && (
                  <p className="text-sm text-red-600 font-medium">⚠️ Daño reportado — Se generó ticket de mantenimiento</p>
                )}
                {maintenanceAlert?.isOverdue && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                    ⚠️ <strong>Service Vencido:</strong> {maintenanceAlert.summary}. Se generó aviso automático para el taller.
                  </div>
                )}
                {maintenanceAlert?.isSoon && !maintenanceAlert?.isOverdue && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                    ℹ️ <strong>Mantenimiento Próximo:</strong> {maintenanceAlert.summary}.
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">Podés cerrar esta página</p>
            </div>
          </div>
        )}

        {/* Offline Saved */}
        {status === 'offline_saved' && (
          <div className="py-12">
            <div className="bg-white border border-yellow-200 rounded-2xl p-8 text-center space-y-5 shadow-lg">
              <div className="w-24 h-24 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                <WifiOff size={56} className="text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-yellow-700">Guardado sin conexión</h2>
              <p className="text-gray-600 text-sm font-medium">
                Tu reporte se guardó en este celular.
              </p>
              <p className="text-gray-500 text-xs px-4">
                Se enviará automáticamente en cuanto recuperes la señal de internet. No borres el historial del navegador.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="badge badge-warning"
                >
                  Nuevo reporte
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {status === 'form' && vehicle && (
          <div className="space-y-5">
            {!isOnline && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 flex items-center gap-3 shadow-sm rounded-r-lg">
                <WifiOff size={20} className="text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-800 font-medium leading-tight">
                  Estás sin conexión. El reporte se guardará en tu dispositivo y se enviará luego.
                </p>
              </div>
            )}
            
            {/* Vehicle Card */}
            <div className="light-card p-4">
              <div className="w-14 h-14 rounded-xl bg-ecar-blueLight flex items-center justify-center text-3xl shrink-0">
                {VEHICLE_ICON[vehicle.vehicle_type] || '🚐'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{vehicle.code} — {vehicle.description}</p>
                <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                  {vehicle.plate && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{vehicle.plate}</span>}
                  {vehicle.brand && <span>{vehicle.brand} {vehicle.model}</span>}
                </div>
                {vehicle.tracking_type === 'hours' ? (
                  vehicle.current_hours && (
                    <p className="text-[11px] text-gray-400 mt-1">Últimas horas: {vehicle.current_hours.toLocaleString()}</p>
                  )
                ) : (
                  vehicle.current_km && (
                    <p className="text-[11px] text-gray-400 mt-1">Último km: {vehicle.current_km.toLocaleString()}</p>
                  )
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blueLight focus:border-ecar-blue"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Obra / Destino</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-ecar-blueLight focus:border-ecar-blue shadow-sm font-medium text-gray-800"
                >
                  <option value="">Seleccioná la obra a la que está destinada...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">Cargando obras activas...</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  {vehicle.tracking_type === 'hours' ? 'Horómetro (Horas de motor) *' : 'Odómetro (Kilómetros) *'}
                </label>
                <input
                  type="number"
                  step={vehicle.tracking_type === 'hours' ? "0.1" : "1"}
                  inputMode="decimal"
                  value={odometerKm}
                  onChange={e => setOdometerKm(e.target.value)}
                  min={vehicle.tracking_type === 'hours' ? (vehicle.current_hours || 0) : (vehicle.current_km || 0)}
                  placeholder={vehicle.tracking_type === 'hours' 
                    ? (vehicle.current_hours ? `Mínimo: ${vehicle.current_hours.toLocaleString()} hs` : 'Hs actuales (horómetro)')
                    : (vehicle.current_km ? `Mínimo: ${vehicle.current_km.toLocaleString()} km` : 'Km actuales')}
                  className={`w-full px-4 py-3 border rounded-xl text-sm font-mono ${
                    kmInvalid
                      ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300 focus:border-red-400'
                      : 'border-gray-300 focus:ring-ecar-blueLight focus:border-ecar-blue'
                  }`}
                />
                {kmInvalid && (
                  <div className="flex items-center gap-1.5 mt-1.5 px-1">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 font-medium">
                      No puede ser menor a {vehicle.tracking_type === 'hours' ? vehicle.current_hours?.toLocaleString() + ' hs' : vehicle.current_km?.toLocaleString() + ' km'} (último registro)
                    </p>
                  </div>
                )}
                {!isInvalid && odometerKm && (
                  <p className="text-[11px] text-green-600 mt-1 px-1">
                    ✓ +{(parseFloat(odometerKm) - (vehicle.tracking_type === 'hours' ? (vehicle.current_hours || 0) : (vehicle.current_km || 0))).toLocaleString()} {vehicle.tracking_type === 'hours' ? 'hs' : 'km'} desde último registro
                  </p>
                )}

                {/* Real-time maintenance alert banner */}
                {maintenanceAlert && maintenanceAlert.level === 'overdue' && (
                  <div className="mt-2.5 p-3.5 bg-red-50 border-2 border-red-400 rounded-xl text-left flex items-start gap-3 shadow-sm animate-fade-in">
                    <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                        <span>¡Atención: Service Vencido!</span>
                      </p>
                      <p className="text-xs text-red-700 font-semibold">
                        {maintenanceAlert.summary}
                      </p>
                      <p className="text-[11px] text-red-600 leading-snug">
                        {maintenanceAlert.detail}. Al enviar el reporte se notificará automáticamente al equipo de taller y mantenimiento.
                      </p>
                    </div>
                  </div>
                )}

                {maintenanceAlert && maintenanceAlert.level === 'soon' && (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-300 rounded-xl text-left flex items-start gap-2.5 shadow-sm animate-fade-in">
                    <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                        <span>Aviso Preventivo: Service Próximo</span>
                      </p>
                      <p className="text-xs text-amber-700 font-medium">
                        {maintenanceAlert.summary} ({maintenanceAlert.detail})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fuel Level */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Nivel de Combustible</label>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {FUEL_LEVELS.map(fl => (
                  <button
                    key={fl.value}
                    type="button"
                    onClick={() => setFuelLevel(fl.value)}
                    className={`py-3 rounded-xl text-center transition-all border-2 ${
                      fuelLevel === fl.value
                        ? 'border-ecar-blue bg-slate-50 shadow-sm'
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
                  <ClipboardCheck size={18} className="text-ecar-blue" />
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

            {/* 4-Angle Photographic Inspection */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                    <Camera size={16} className="text-ecar-blue" />
                    Inspección Visual (4 Ángulos)
                  </h3>
                  <p className="text-[11px] text-gray-500">Sacá foto de cada lado para control pericial</p>
                </div>
                {photoSlots.some(s => s.file) && !inspectingAi && (
                  <button
                    type="button"
                    onClick={handleInspectPhotosWithAi}
                    className="bg-ecar-blue hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <Sparkles size={13} />
                    Inspeccionar con IA
                  </button>
                )}
              </div>

              {/* 4 Slots Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {photoSlots.map(slot => (
                  <div key={slot.id} className="relative border-2 border-dashed border-gray-200 hover:border-ecar-blue/40 rounded-xl p-2.5 text-center bg-gray-50 hover:bg-white transition-all overflow-hidden flex flex-col items-center justify-center min-h-[90px]">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoCapture(slot.id, f);
                      }}
                    />
                    {slot.preview ? (
                      <div className="w-full flex flex-col items-center gap-1">
                        <img src={slot.preview} alt={slot.label} className="w-full h-16 object-cover rounded-lg shadow-xs" />
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <Check size={11} /> {slot.label}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                        <span className="text-xl">{slot.icon}</span>
                        <span className="text-xs font-bold text-gray-600">{slot.label}</span>
                        <span className="text-[9px] text-gray-400 font-medium">Tocar para foto</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* AI Inspection Loading State */}
              {inspectingAi && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2.5 text-ecar-blue animate-pulse">
                  <Sparkles className="animate-spin text-ecar-blue shrink-0" size={17} />
                  <div className="text-xs">
                    <p className="font-bold">Analizando ángulos del vehículo con Inteligencia Artificial...</p>
                    <p className="text-blue-600">Detectando abolladuras, ópticas o daños estructurales (ignorando polvo).</p>
                  </div>
                </div>
              )}

              {/* AI Inspection Error */}
              {aiInspectionError && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>{aiInspectionError}</span>
                </div>
              )}

              {/* AI Inspection Result Feedback */}
              {aiInspectionResult && !inspectingAi && (
                <div className={`rounded-xl p-3 text-xs border space-y-1.5 animate-fade-in ${
                  aiInspectionResult.has_damage ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className={aiInspectionResult.has_damage ? 'text-amber-600' : 'text-emerald-600'} />
                      Peritaje IA: {aiInspectionResult.has_damage ? 'Daños detectados' : 'Sin daños estructurales'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      aiInspectionResult.has_damage ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {aiInspectionResult.severity || (aiInspectionResult.has_damage ? 'con daño' : 'óptimo')}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed">{aiInspectionResult.summary}</p>

                  {aiInspectionResult.detected_issues && aiInspectionResult.detected_issues.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 pt-1 border-t border-amber-200/60 font-medium">
                      {aiInspectionResult.detected_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Damage */}
            <div className={`light-card p-4 transition-all ${hasDamage ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
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
              className="w-full bg-gradient-to-r from-ecar-blue to-ecar-blue text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
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
