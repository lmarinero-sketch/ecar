import React, { useState, useEffect } from 'react';
import { Check, Send, FileText, AlertCircle, Camera, Upload, X, Copy } from 'lucide-react';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import { useModalStore } from '../store/useModalStore';
import { generateFuelValePdf } from '../lib/generateFuelValePdf';
import type { FuelLoad } from '../lib/types';

type Vehicle = { id: string; code: string; description: string; vehicle_type: string; plate?: string; preferred_fuel?: string };

const STATIONS = ['YPF', 'Shell', 'Axion', 'Puma', 'YPF Agro', 'Shell Agro', 'Batán Interno', 'Estación Obra', 'Otro'];
const FUEL_TYPES = ['Diesel 500 / Ultradiesel', 'Diesel Premium / V-Power', 'Diesel EVOLUX', 'Nafta Súper', 'Nafta Premium', 'Aceite / Lubricante', 'Otro'];

const compressImageFile = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<string> => {
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
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const FuelRequestPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [successState, setSuccessState] = useState<'none' | 'request' | 'complete'>('none');
  const [successLoadNumber, setSuccessLoadNumber] = useState('');
  const [createdLoad, setCreatedLoad] = useState<FuelLoad | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVehicle, setSearchVehicle] = useState('');
  const [searching, setSearching] = useState(false);
  
  const [activeRequest, setActiveRequest] = useState<FuelLoad | null>(null);
  const [showUnauthorizedForm, setShowUnauthorizedForm] = useState(false);

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

  const [completeForm, setCompleteForm] = useState({
    station_name: 'YPF',
    fuel_type: 'Diesel Premium / V-Power',
    liters: '',
    price_per_liter: '',
    total_amount: ''
  });
  const [ticketFile, setTicketFile] = useState<File | null>(null);

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
          
        // Restaurado auto-load EXCLUSIVO para recuperación de cámara (Background Kill)
        // Solo se recupera si se hizo clic en el botón de cámara en los últimos 5 minutos.
        const pendingId = localStorage.getItem('ecar_active_fuel_request');
        const photoTimeStr = localStorage.getItem('taking_photo_timestamp');
        
        if (pendingId && photoTimeStr) {
          const timeSincePhotoClick = Date.now() - parseInt(photoTimeStr);
          if (timeSincePhotoClick < 5 * 60 * 1000) { // 5 minutos de ventana
            const { data: req } = await supabase.from('fuel_loads').select('*').eq('id', pendingId).single();
            if (req && req.workflow_status === 'requested') {
              setActiveRequest(req as FuelLoad);
              setCompleteForm(f => ({ ...f, station_name: req.station_name || 'YPF', fuel_type: req.fuel_type || 'Diesel Premium / V-Power' }));
            }
          }
        }
        // Limpiamos el flag para que futuras visitas a la página no auto-carguen por error
        localStorage.removeItem('taking_photo_timestamp');
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !searchVehicle) return;
    setSearching(true);
    setError('');
    try {
      let req;
      if (searchQuery.trim()) {
        const cleanQuery = searchQuery.trim().toUpperCase();
        const query = cleanQuery.startsWith('SOL-') ? cleanQuery : `SOL-${cleanQuery}`;
        const { data, error: dbError } = await supabase.from('fuel_loads').select('*').eq('load_number', query).single();
        if (dbError || !data) throw new Error('No se encontró la solicitud por número de seguimiento.');
        req = data;
      } else if (searchVehicle) {
        const { data, error: dbError } = await supabase.from('fuel_loads')
          .select('*')
          .eq('vehicle_code', searchVehicle)
          .in('workflow_status', ['requested', 'authorized'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (dbError || !data) throw new Error(`No se encontraron solicitudes pendientes o autorizadas para el vehículo ${searchVehicle}.`);
        req = data;
      }

      if (!req) throw new Error('No se encontró la solicitud.');
      if (req.workflow_status === 'completed') throw new Error('Esta solicitud ya fue completada.');
      
      localStorage.setItem('ecar_active_fuel_request', req.id);
      setActiveRequest(req as FuelLoad);
      setCompleteForm(f => ({ ...f, station_name: req.station_name || 'YPF', fuel_type: req.fuel_type || 'Diesel Premium / V-Power' }));
    } catch (e: any) {
      setError(e.message || 'Error al buscar solicitud');
    }
    setSearching(false);
  };

  const handleSubmit = async (action: 'wait' | 'direct') => {
    if (!form.vehicle_code || !form.requested_liters || !form.requested_by) {
      setError('Completá Vehículo, Litros y Tu Nombre');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const vehicle = vehicles.find(v => v.code === form.vehicle_code);
      const { data: inserted, error: dbError } = await supabase.from('fuel_loads').insert({
        tenant_id: ECAR_TENANT_ID,
        load_number: `SOL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        load_date: new Date().toLocaleDateString('sv-SE'),
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
      }).select().single();

      if (dbError) throw dbError;
      
      if (action === 'wait') {
        setSuccessLoadNumber(inserted.load_number);
        setCreatedLoad(inserted as FuelLoad);
        setSuccessState('request');
        setForm({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', requested_by: '', observations: '', station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power' });
      } else {
        localStorage.setItem('ecar_active_fuel_request', inserted.id);
        setActiveRequest(inserted as FuelLoad);
        setCompleteForm(f => ({ ...f, station_name: inserted.station_name || 'YPF', fuel_type: inserted.fuel_type || 'Diesel Premium / V-Power' }));
      }
    } catch (e: any) {
      setError(e.message || 'Error al enviar solicitud');
    }
    setSubmitting(false);
  };

  const handleCompleteLoad = async () => {
    if (!activeRequest) return;
    const isBatan = completeForm.station_name === 'Surtidor Propio / Batán' || completeForm.station_name === 'Batán Interno' || activeRequest.station_name === 'Surtidor Propio / Batán' || activeRequest.station_name === 'Batán Interno' || activeRequest.load_source === 'batan';
    
    if (!completeForm.liters || (!isBatan && !completeForm.total_amount)) {
      setError(isBatan ? 'Debe ingresar la cantidad de litros cargados.' : 'Debe ingresar Litros y el Importe Total para completar la carga.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      let photoUrl: string | null = null;
      if (ticketFile) {
        try {
          const fileExt = ticketFile.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${activeRequest.load_number}.${fileExt}`;
          
          // COMPRESS ALWAYS BEFORE UPLOAD (Fix for Android stalling on 15MB images)
          const base64Compressed = await compressImageFile(ticketFile);
          const compressedFile = dataURLtoFile(base64Compressed, fileName);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fuel_tickets')
            .upload(fileName, compressedFile, { upsert: true });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage.from('fuel_tickets').getPublicUrl(fileName);
            photoUrl = publicUrlData.publicUrl;
          } else {
            console.warn("Storage RLS policy restricted upload, using compressed base64 fallback:", uploadError);
            photoUrl = base64Compressed;
          }
        } catch (storageErr) {
          console.warn("Storage exception, using compressed base64 fallback:", storageErr);
          photoUrl = await compressImageFile(ticketFile);
        }
      }

      const isUnauthorized = activeRequest.workflow_status !== 'authorized';
      const finalLiters = parseFloat(completeForm.liters);
      const finalAmount = isBatan ? 0 : (parseFloat(completeForm.total_amount) || 0);
      const finalPrice = isBatan ? 0 : (parseFloat(completeForm.price_per_liter) || (finalLiters > 0 ? finalAmount / finalLiters : 0));

      const { error: updateError } = await supabase.from('fuel_loads')
        .update({
          workflow_status: 'completed',
          liters: finalLiters,
          price_per_liter: finalPrice,
          total_amount: finalAmount,
          station_name: isBatan ? 'Batán Interno' : completeForm.station_name,
          fuel_type: completeForm.fuel_type,
          unauthorized_load: isUnauthorized,
          ticket_photo_url: photoUrl
        })
        .eq('id', activeRequest.id);
        
      if (updateError) {
        if (updateError.message?.includes('row-level security')) {
          throw new Error('No tenés permisos para actualizar esta solicitud o la misma ya fue completada.');
        }
        throw updateError;
      }

      if (isBatan) {
        await supabase.from('fuel_batan_movements').insert({
          tenant_id: ECAR_TENANT_ID,
          movement_number: `DESCARGA-${String(Date.now()).slice(-6)}`,
          movement_date: new Date().toISOString().split('T')[0],
          movement_type: 'discharge',
          fuel_type: completeForm.fuel_type || activeRequest.fuel_type || 'Diesel EVOLUX',
          liters_discharged: finalLiters,
          vehicle_code: activeRequest.vehicle_code,
          driver_name: activeRequest.driver_name || activeRequest.requested_by,
          project_name: activeRequest.project_name,
          movement_status: 'completed',
          observations: `Carga directa realizada desde app móvil (${activeRequest.load_number})`
        });
      }
      
      localStorage.removeItem('ecar_active_fuel_request');
      setActiveRequest(null);
      setForm({
        vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', requested_by: '', observations: '', station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power'
      });
      setCompleteForm({ station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power', liters: '', price_per_liter: '', total_amount: '' });
      setTicketFile(null);
      setSuccessState('complete');
      
    } catch (e: any) {
      setError(e.message || 'Error al completar la carga');
    }
    setSubmitting(false);
  };

  const resetRequest = async () => {
    if (await useModalStore.getState().showConfirm('Confirmar', '¿Estás seguro de cancelar esta solicitud y crear una nueva?')) {
      localStorage.removeItem('ecar_active_fuel_request');
      setActiveRequest(null);
      setForm({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', requested_by: '', observations: '', station_name: 'YPF', fuel_type: 'Diesel Premium / V-Power' });
    }
  };

  if (successState !== 'none') {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4 relative overflow-hidden">
        {/* ECAR Corporate Background */}
        <div className="absolute top-0 left-0 right-0 h-[35vh] bg-ecar-blue transform origin-top-left -skew-y-6 z-0 shadow-lg"></div>
        <div className="absolute top-[35vh] left-0 right-0 h-4 bg-ecar-red transform origin-top-left -skew-y-6 z-0 translate-y-[-100%] shadow-md"></div>
        
        <div className="relative z-10 bg-white rounded-2xl p-10 text-center max-w-md w-full border border-gray-100 shadow-2xl animate-fade-in-up">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100 shadow-inner">
            <Check size={48} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-ecar-blue mb-3">
            {successState === 'request' ? '¡Solicitud Enviada!' : '¡Carga Registrada!'}
          </h2>
          <p className="text-gray-600 mb-2">
            {successState === 'request' 
              ? 'Tu pedido fue registrado exitosamente. Gerencia lo revisará pronto.' 
              : 'La carga de combustible se ha completado exitosamente y ya está registrada en el sistema.'}
          </p>
          
          {successState === 'request' && (
            <div className="my-6 bg-red-50 border-2 border-red-200 rounded-xl p-5 space-y-3 shadow-sm">
              <p className="text-sm text-red-700 font-black uppercase tracking-wider mb-1">
                ⚠️ IMPORTANTE: GUARDÁ ESTE NÚMERO
                <span className="block text-xs font-medium mt-1 text-red-600">Lo necesitarás para completar la carga luego de surtir.</span>
              </p>
              <p className="text-4xl font-black font-mono text-ecar-red tracking-widest">{successLoadNumber}</p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(successLoadNumber);
                    useModalStore.getState().showAlert('Copiado', `Código ${successLoadNumber} copiado al portapapeles.`);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Copy size={14} /> Copiar Código
                </button>
                {createdLoad && (
                  <button
                    type="button"
                    onClick={() => generateFuelValePdf(createdLoad)}
                    className="bg-ecar-blue hover:bg-ecar-blueDark text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <FileText size={14} /> Descargar Vale PDF
                  </button>
                )}
              </div>
            </div>
          )}
          
          <button
            onClick={() => setSuccessState('none')}
            className="mt-4 bg-ecar-blue hover:bg-ecar-blueDark text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl w-full"
          >
            Nueva {successState === 'request' ? 'Solicitud' : 'Carga'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin mb-4" />
        <p className="text-ecar-blue font-bold tracking-widest uppercase text-sm">Cargando Flota...</p>
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
        <div className="text-center mb-6 animate-fade-in flex flex-col items-center">
          <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 mb-3 transform hover:scale-105 transition-transform">
            <img src="/logoECAR.png" alt="ECAR Logo" className="h-12 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40"><text x="10" y="30" font-family="Arial" font-size="24" font-weight="bold" fill="%230B2240">ECAR</text></svg>';
            }} />
          </div>
          <h1 className="text-white font-black text-2xl tracking-wide shadow-black drop-shadow-md">VALE DE COMBUSTIBLE</h1>
        </div>

        {/* Dynamic Card (Step 1 or Step 2) */}
        {!activeRequest ? (
          <>
          /* STEP 1: INITIAL REQUEST */
          <div className="light-card animate-fade-in-up">
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-2">
                <div className="bg-ecar-blueLight p-2 rounded-lg"><FileText className="text-ecar-blue" size={24} /></div>
                <div>
                  <h2 className="text-ecar-blue font-black text-xl">1. Nueva Solicitud</h2>
                  <p className="text-gray-400 text-sm">Pedí autorización para cargar</p>
                </div>
              </div>

              {/* Form Fields Step 1 */}
              <div>
                <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Tu Nombre <span className="text-ecar-red">*</span></label>
                <input type="text" placeholder="Ej: Juan Pérez" value={form.requested_by} onChange={e => setForm({ ...form, requested_by: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium" />
              </div>

              <div>
                <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Vehículo / Máquina <span className="text-ecar-red">*</span></label>
                <select value={form.vehicle_code} onChange={e => {
                  const v = vehicles.find(x => x.code === e.target.value);
                  setForm({ ...form, vehicle_code: e.target.value, fuel_type: v?.preferred_fuel || form.fuel_type });
                }} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium">
                  <option value="">Seleccionar vehículo...</option>
                  {vehicles.map(v => <option key={v.id} value={v.code}>{v.code} — {v.description}</option>)}
                </select>
              </div>

              <div>
                <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Obra / Centro de Costo</label>
                <select value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium text-sm">
                  <option value="">Uso General</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  <option value="Movimientos Internos">Movimientos Internos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Estación <span className="text-ecar-red">*</span></label>
                  <select value={form.station_name} onChange={e => setForm({ ...form, station_name: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800">
                    <option value="YPF">YPF</option>
                    <option value="Shell">Shell</option>
                    <option value="Axion">Axion</option>
                    <option value="Puma">Puma</option>
                    <option value="Refinor">Refinor</option>
                    <option value="Surtidor Propio / Batán">Surtidor Propio / Batán</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Tipo de Comb. <span className="text-ecar-red">*</span></label>
                  <select value={form.fuel_type} onChange={e => setForm({ ...form, fuel_type: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800">
                    <option value="Diesel Premium / V-Power">Diesel Premium</option>
                    <option value="Diesel Comun / X-10">Diesel Común</option>
                    <option value="Nafta Premium / V-Power">Nafta Premium</option>
                    <option value="Nafta Super">Nafta Súper</option>
                  </select>
                </div>
                <div>
                  <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Litros Solic. <span className="text-ecar-red">*</span></label>
                  <input type="number" step="0.1" value={form.requested_liters} onChange={e => setForm({ ...form, requested_liters: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold font-mono" placeholder="0.0" />
                </div>
                <div>
                  <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Km/Hs Actual <span className="text-ecar-red">*</span></label>
                  <input type="number" value={form.odometer_km} onChange={e => setForm({ ...form, odometer_km: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold font-mono" placeholder="Ej: 12500" />
                </div>
              </div>

              <div className="pt-2">
                {error && <div className="bg-red-50 border border-red-200 text-ecar-red px-3 py-2 rounded-lg text-sm flex gap-2 mb-4"><AlertCircle size={16} />{error}</div>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => handleSubmit('wait')} disabled={submitting} className="w-full bg-ecar-blue hover:bg-ecar-blueDark text-white font-bold py-3.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-lg hover:shadow-xl disabled:opacity-50">
                    <span className="flex items-center gap-2"><Send size={18} /> Solicitar</span>
                    <span className="text-[10px] font-normal opacity-80">(Esperar Autorización)</span>
                  </button>
                  <button onClick={() => handleSubmit('direct')} disabled={submitting} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-lg hover:shadow-xl disabled:opacity-50">
                    <span className="flex items-center gap-2"><Upload size={18} /> Cargar Ahora</span>
                    <span className="text-[10px] font-normal opacity-80">(Auditoría Posterior)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* SEARCH COMPONENT (Only shown in Step 1) */}
          <div className="mt-6 bg-gray-800/90 backdrop-blur-md rounded-xl p-5 border border-red-500/50 text-center animate-fade-in shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
            <h3 className="text-white text-lg font-black mb-1 flex items-center justify-center gap-2">
              <AlertCircle className="text-red-400" size={20} />
              ¿Ya tenés una solicitud pendiente?
            </h3>
            <p className="text-red-300 text-sm font-bold mb-4">NO CREES UNA NUEVA. Buscala por Nº Seguimiento o Vehículo:</p>
            {error && <div className="mb-3 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold shadow-sm">{error}</div>}
            
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input type="text" placeholder="Ej: SOL-XXXXX" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchVehicle(''); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="flex-1 px-4 py-3 rounded-lg border-0 shadow-inner font-mono text-center uppercase text-sm" />
              <div className="text-gray-400 font-bold self-center text-xs">O</div>
              <select value={searchVehicle} onChange={e => { setSearchVehicle(e.target.value); setSearchQuery(''); setError(''); }} className="flex-1 px-3 py-3 rounded-lg border-0 shadow-inner text-sm text-gray-800 font-medium">
                <option value="">Vehículo...</option>
                {vehicles.map(v => <option key={`search-${v.id}`} value={v.code}>{v.code} — {v.description}</option>)}
              </select>
            </div>
            
            <button onClick={handleSearch} disabled={searching || (!searchQuery.trim() && !searchVehicle)} className="mt-4 w-full max-w-md mx-auto bg-white text-ecar-blue font-bold px-4 py-3 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors shadow">
              {searching ? 'Buscando...' : 'Buscar Solicitud'}
            </button>
          </div>
        </>
        ) : (
          /* STEP 2: COMPLETE LOAD */
          <div className="light-card animate-fade-in-up border-2 border-ecar-blue/10">
            <div className="p-6 md:p-8 space-y-5">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activeRequest.workflow_status === 'authorized' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {activeRequest.workflow_status === 'authorized' ? <Check className="text-green-600" size={24} /> : <AlertCircle className="text-amber-600" size={24} />}
                  </div>
                  <div>
                    <h2 className="text-gray-800 font-black text-xl">2. Carga en Surtidor</h2>
                    <p className={`text-sm font-bold ${activeRequest.workflow_status === 'authorized' ? 'text-green-600' : 'text-amber-600'}`}>
                      {activeRequest.workflow_status === 'authorized' ? 'Solicitud Aprobada' : 'Solicitud Pendiente de Autorización'}
                    </p>
                  </div>
                </div>
                <button onClick={resetRequest} className="text-gray-400 hover:text-red-500 transition-colors" title="Cancelar Solicitud"><X size={20}/></button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Nº de Solicitud</span>
                    <span className="text-xl font-black font-mono text-ecar-red tracking-wider">{activeRequest.load_number}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => generateFuelValePdf(activeRequest)}
                    className="bg-ecar-blue hover:bg-ecar-blueDark text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all"
                  >
                    <FileText size={14} /> Descargar Vale PDF
                  </button>
                </div>
                <p className="mb-1"><span className="text-gray-500 font-semibold">Vehículo:</span> <span className="font-bold text-ecar-blue">{activeRequest.vehicle_description} ({activeRequest.vehicle_code})</span></p>
                <p><span className="text-gray-500 font-semibold">Litros Pedidos:</span> <span className="font-bold text-ecar-red">{activeRequest.requested_liters} L</span></p>
              </div>

              {(activeRequest.workflow_status === 'authorized' || showUnauthorizedForm) ? (
                <div className="space-y-5 animate-fade-in">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ingresá los valores <b>reales</b> del ticket de carga. <br/>
                    {activeRequest.workflow_status !== 'authorized' && <span className="text-amber-600 font-bold">Estás procediendo sin autorización, el sistema lo marcará para auditoría.</span>}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Estación</label>
                      <select value={completeForm.station_name} onChange={e => setCompleteForm({ ...completeForm, station_name: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 font-medium text-sm">
                        {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Combustible</label>
                      <select value={completeForm.fuel_type} onChange={e => setCompleteForm({ ...completeForm, fuel_type: e.target.value })} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 font-medium text-sm">
                        {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Litros Reales</label>
                      <input type="number" step="0.1" value={completeForm.liters} onChange={e => { const v = parseFloat(e.target.value)||0; setCompleteForm(f => ({ ...f, liters: e.target.value, total_amount: f.price_per_liter ? String(v * parseFloat(f.price_per_liter)) : f.total_amount })) }} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-3 py-2 text-lg font-bold font-mono text-ecar-blue" placeholder="0.0" />
                    </div>
                    <div>
                      <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">$/Litro</label>
                      <input type="number" step="0.01" value={completeForm.price_per_liter} onChange={e => { const v = parseFloat(e.target.value)||0; setCompleteForm(f => ({ ...f, price_per_liter: e.target.value, total_amount: f.liters ? String(parseFloat(f.liters) * v) : f.total_amount })) }} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-3 py-2 text-lg font-bold font-mono text-gray-600" placeholder="0.00" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Importe Total</label>
                      <input type="number" step="0.01" value={completeForm.total_amount} onChange={e => { const v = parseFloat(e.target.value)||0; setCompleteForm(f => ({ ...f, total_amount: e.target.value, price_per_liter: f.liters && parseFloat(f.liters)>0 ? String(v / parseFloat(f.liters)) : f.price_per_liter })) }} className="w-full bg-surface-secondary border border-gray-200 rounded-xl px-3 py-2 text-lg font-black font-mono text-emerald-600" placeholder="0.00" />
                    </div>
                  </div>

                  <div>
                      <label className="text-ecar-blue font-bold text-xs uppercase tracking-wider block mb-1">Foto del Ticket</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden">
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          onClick={() => localStorage.setItem('taking_photo_timestamp', Date.now().toString())}
                          onChange={e => setTicketFile(e.target.files?.[0] || null)} 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        />
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                        {ticketFile ? (
                          <>
                            <Check size={24} className="text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-600">{ticketFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Camera size={28} className="text-gray-400" />
                            <span className="text-sm text-gray-500 font-medium">Sacar foto o seleccionar archivo</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    {error && <div className="bg-red-50 border border-red-200 text-ecar-red px-3 py-2 rounded-lg text-sm flex gap-2 mb-4"><AlertCircle size={16} />{error}</div>}
                    <button onClick={handleCompleteLoad} disabled={submitting} className={`w-full text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 ${activeRequest.workflow_status === 'authorized' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                      {submitting ? 'Guardando...' : <><Upload size={20} /> Guardar Carga {activeRequest.workflow_status !== 'authorized' && '(Sin Autorizar)'}</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 animate-fade-in">
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 mb-6 text-sm">
                    Gerencia aún no ha autorizado esta carga. Podés esperar la autorización y volver a consultar este código más tarde.
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-3 font-bold uppercase tracking-wider">¿Ya cargaste igual?</p>
                    <button 
                      onClick={() => setShowUnauthorizedForm(true)} 
                      className="text-amber-700 bg-amber-100 hover:bg-amber-200 font-bold py-3 px-6 rounded-xl transition-colors text-sm w-full shadow-sm"
                    >
                      Forzar Carga (Auditoría Posterior)
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
