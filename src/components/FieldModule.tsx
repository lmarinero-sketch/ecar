import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Sun, Cloud, CloudRain, CloudLightning, Snowflake, Wind,
  Check, X, Clock, ChevronDown, ChevronUp, Eye, Camera, Users, Package,
  Truck, Send, Image as ImageIcon, Trash2, Search, Hammer,
} from 'lucide-react';
import {
  usePartesDiarios, useCreateParteDiario, useUpdateParteDiario, useProjects,
  useEmployees, useInventoryItems, useFuelVehicles,
  useParteFotos, useCreateParteFoto, useDeleteParteFoto,
  useParteSolicitudes, useCreateParteSolicitud, useUpdateParteSolicitud,
  usePartePersonal, useCreatePartePersonal, useDeletePartePersonal,
  useParteEquipos, useCreateParteEquipo, useDeleteParteEquipo,
  usePurchaseOrders,
  useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder
} from '../hooks/useData';
import { supabase } from '../lib/supabase';
import type { ParteDiario } from '../lib/types';
import { CarpetaObraButton } from './CarpetaObraButton';

const CLIMA_ICONS: Record<string, React.ElementType> = { despejado: Sun, nublado: Cloud, lluvia: CloudRain, tormenta: CloudLightning, nieve: Snowflake, ventoso: Wind };
const CLIMA_LABELS: Record<string, string> = { despejado: 'Despejado', nublado: 'Nublado', lluvia: 'Lluvia', tormenta: 'Tormenta', nieve: 'Nieve', ventoso: 'Ventoso' };
const ESTADO_COLORS: Record<string, string> = { borrador: 'badge-neutral', enviado: 'badge-warning', aprobado: 'badge-success', rechazado: 'badge-danger' };

type DetailTab = 'actividad' | 'fotos' | 'personal' | 'materiales' | 'equipos';
type PendingPhoto = { file: File; preview: string; tipo: 'avance' | 'entrega' | 'incidente' | 'otro' };

const EntregasProgramadas: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data: orders = [] } = usePurchaseOrders();
  const entregas = orders.filter(
    (o) => o.project_id === projectId && o.delivery_date && ['aprobada', 'emitida', 'entregada_parcial'].includes(o.status)
  );

  if (entregas.length === 0) return null;

  return (
    <div className="mt-4 border border-ecar-blueLight rounded-xl p-4 bg-slate-50/50 shadow-sm">
      <h4 className="text-sm font-bold text-ecar-blue flex items-center gap-2 mb-3">
        <Package size={16} /> Entregas Programadas de Compras
      </h4>
      <div className="space-y-2">
        {entregas.map((o) => (
          <div key={o.id} className="bg-white border border-ecar-blueLight rounded-lg p-3 flex justify-between items-center text-sm shadow-sm">
            <div>
              <p className="font-bold text-gray-800">{o.supplier_name}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{o.items?.map(i => `${i.quantity} ${i.unit} ${i.description}`).join(', ')}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="badge badge-info">
                Llega: {new Date(o.delivery_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FieldModule: React.FC = () => {
  const { data: partes = [], isLoading } = usePartesDiarios();
  const { data: projects = [] } = useProjects();
  const createParte = useCreateParteDiario();
  const updateParte = useUpdateParteDiario();
  const [showForm, setShowForm] = useState(false);
  const [selectedParte, setSelectedParte] = useState<ParteDiario | null>(null);

  const [form, setForm] = useState({
    obra_id: '', fecha: new Date().toISOString().split('T')[0], clima: 'despejado',
    temperatura_min: '', temperatura_max: '', trabajo_realizado: '', entregas: '', incidentes: '',
    horas_trabajadas: '8', notas: '', firmado_por: '', avance_porcentual: '0',
  });
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [fotoTipoForm, setFotoTipoForm] = useState<'avance' | 'entrega' | 'incidente' | 'otro'>('avance');
  const createParteFoto = useCreateParteFoto();

  const handleSubmit = async () => {
    if (!form.obra_id || !form.trabajo_realizado) return;
    const newParte = await createParte.mutateAsync({
      obra_id: form.obra_id, fecha: form.fecha, clima: form.clima as ParteDiario['clima'],
      temperatura_min: form.temperatura_min ? Number(form.temperatura_min) : null,
      temperatura_max: form.temperatura_max ? Number(form.temperatura_max) : null,
      trabajo_realizado: form.trabajo_realizado, entregas: form.entregas || null,
      incidentes: form.incidentes || null, horas_trabajadas: Number(form.horas_trabajadas),
      notas: form.notas || null, firmado_por: form.firmado_por || null, estado: 'borrador',
      avance_porcentual: Number(form.avance_porcentual) || 0,
    });
    setShowForm(false);
    setForm({ obra_id: '', fecha: new Date().toISOString().split('T')[0], clima: 'despejado', temperatura_min: '', temperatura_max: '', trabajo_realizado: '', entregas: '', incidentes: '', horas_trabajadas: '8', notas: '', firmado_por: '', avance_porcentual: '0' });
    // Upload pending photos
    if (newParte && pendingPhotos.length > 0) {
      for (const photo of pendingPhotos) {
        try {
          const ext = photo.file.name.split('.').pop();
          const path = `${(newParte as any).id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: upErr } = await supabase.storage.from('parte-diario-fotos').upload(path, photo.file);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('parte-diario-fotos').getPublicUrl(path);
            await createParteFoto.mutateAsync({ parte_id: (newParte as any).id, foto_url: urlData.publicUrl, tipo: photo.tipo });
          }
        } catch (err) { console.error('Photo upload error:', err); }
      }
    }
    setPendingPhotos([]);
    if (newParte) setSelectedParte(newParte as ParteDiario);
  };

  const kpis = useMemo(() => ({
    total: partes.length,
    borradores: partes.filter(p => p.estado === 'borrador').length,
    enviados: partes.filter(p => p.estado === 'enviado').length,
    aprobados: partes.filter(p => p.estado === 'aprobado').length,
  }), [partes]);

  if (selectedParte) {
    return <ParteDetailView parte={selectedParte} onBack={() => setSelectedParte(null)} onUpdate={updateParte} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardList size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <ClipboardList size={24} /> Parte Diario de Obra
          </h3>
          <p className="text-ecar-blueLight text-sm mt-1 max-w-2xl">
            Doc PR-GO-01 §4.4 — Registro diario de actividades, personal, fotos y solicitudes de materiales
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Partes', value: kpis.total, icon: ClipboardList, color: 'text-ecar-blue' },
          { label: 'Borradores', value: kpis.borradores, icon: Clock, color: 'text-gray-500' },
          { label: 'Enviados', value: kpis.enviados, icon: Eye, color: 'text-yellow-600' },
          { label: 'Aprobados', value: kpis.aprobados, icon: Check, color: 'text-green-600' },
        ].map(kpi => (
          <div key={kpi.label} className="light-card p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><kpi.icon size={16} className={kpi.color} /> {kpi.label}</div>
            <p className={`text-2xl font-black font-mono ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* New Button */}
      <button onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-3 w-full md:w-auto flex items-center justify-center gap-2">
        {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Nuevo Parte Diario</>}
      </button>

      {/* Form */}
      {showForm && (
        <div className="light-card p-5 md:p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2"><ClipboardList size={18} className="text-ecar-blue" /> Crear Parte Diario</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Obra *</label>
              <select value={form.obra_id} onChange={e => setForm({...form, obra_id: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue">
                <option value="">Seleccioná una obra</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {form.obra_id && (
                <div className="mt-2">
                  <CarpetaObraButton projectId={form.obra_id} />
                </div>
              )}
            </div>
          </div>
          {form.obra_id && <EntregasProgramadas projectId={form.obra_id} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Clima</label>
              <div className="flex gap-1 mt-1">
                {Object.entries(CLIMA_ICONS).map(([key, Icon]) => (
                  <button key={key} onClick={() => setForm({...form, clima: key})} className={`p-2.5 rounded-lg border transition-all ${form.clima === key ? 'bg-ecar-blueLight border-ecar-blue text-ecar-blue shadow-sm' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`} title={CLIMA_LABELS[key]}>
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Temp Mín (°C)</label><input type="number" value={form.temperatura_min} onChange={e => setForm({...form, temperatura_min: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" placeholder="12" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Temp Máx (°C)</label><input type="number" value={form.temperatura_max} onChange={e => setForm({...form, temperatura_max: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" placeholder="28" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Hs Trabajadas</label><input type="number" value={form.horas_trabajadas} onChange={e => setForm({...form, horas_trabajadas: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Trabajo Realizado *</label><textarea value={form.trabajo_realizado} onChange={e => setForm({...form, trabajo_realizado: e.target.value})} rows={3} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" placeholder="Descripción detallada de las tareas realizadas..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Entregas / Recepciones</label><textarea value={form.entregas} onChange={e => setForm({...form, entregas: e.target.value})} rows={2} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" placeholder="Materiales recibidos, entregas..." /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Incidentes / Novedades</label><textarea value={form.incidentes} onChange={e => setForm({...form, incidentes: e.target.value})} rows={2} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" placeholder="Incidentes, paradas..." /></div>
          </div>

          {/* 📋 Registro de Desvíos (PR-GO-01 §20) */}
          <div className="border border-orange-200 rounded-xl p-4 space-y-3 bg-orange-50/30">
            <h4 className="text-sm font-bold text-orange-700 flex items-center gap-2">⚠️ Registro de Desvíos</h4>
            <p className="text-[10px] text-gray-500">Si hubo desvíos de plazo, costo, calidad o seguridad, registralo aquí. Esto alimenta el Reporte Semanal a GG.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Descripción del Desvío</label><textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} rows={2} className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm bg-white" placeholder="Ej: Retraso por falta de material, problema con subcontratista..." /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Acción Inmediata / Decisión Requerida</label><textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} rows={2} className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm bg-white" placeholder="Ej: Se reprogramó tarea, se pidió material urgente..." /></div>
            </div>
          </div>

          {/* 📅 Planificación para el día siguiente */}
          <div className="border border-blue-200 rounded-xl p-4 space-y-3 bg-blue-50/30">
            <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2">📅 Planificación Siguiente Jornada</h4>
            <p className="text-[10px] text-gray-500">Anticipá las tareas, recursos y restricciones para mañana. (PR-GO-01 §8 Planificación Semanal)</p>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Tareas planificadas para mañana</label><textarea value={form.firmado_por ? '' : ''} onChange={() => {}} rows={2} className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white" placeholder="1. Hormigonado de losa 2do piso&#10;2. Instalación eléctrica bloque A&#10;3. Replanteo sector estacionamiento" /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Materiales necesarios</label><input className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white" placeholder="Cemento, hierro, cables..." /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Equipos necesarios</label><input className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white" placeholder="Mixer, autoelevador..." /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Restricciones / Riesgos</label><input className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white" placeholder="Pronóstico lluvia, faltante..." /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Avance del día (%)</label><input type="number" min="0" max="100" value={form.avance_porcentual} onChange={e => setForm({...form, avance_porcentual: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm font-mono" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Firmado por</label><input type="text" value={form.firmado_por} onChange={e => setForm({...form, firmado_por: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" placeholder="Nombre del encargado" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Notas Adicionales</label><input type="text" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm" placeholder="Observaciones" /></div>
          </div>

          {/* 📸 Fotos del Parte */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50/50">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Camera size={16} className="text-ecar-blue" /> 📸 Fotos de Avance</h4>
            <div className="flex flex-wrap gap-2">
              {(['avance', 'entrega', 'incidente', 'otro'] as const).map(t => (
                <button key={t} onClick={() => setFotoTipoForm(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${fotoTipoForm === t ? 'bg-ecar-blueLight text-ecar-blue ring-2 ring-offset-1 ring-ecar-blueLight' : 'bg-white text-gray-500 border border-gray-200'}`}>
                  {t === 'avance' ? '📊 Avance' : t === 'entrega' ? '📦 Entrega' : t === 'incidente' ? '⚠️ Incidente' : '📎 Otro'}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-ecar-blue hover:bg-slate-50/50 transition-all">
              <Camera size={20} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-500">Tomar foto o elegir archivo</span>
              <input type="file" accept="image/*" capture="environment" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setPendingPhotos(prev => [...prev, { file, preview: URL.createObjectURL(file), tipo: fotoTipoForm }]);
                }
                e.target.value = '';
              }} className="hidden" />
            </label>
            {pendingPhotos.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {pendingPhotos.map((p, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <img src={p.preview} alt={`Foto ${i+1}`} className="w-full h-24 object-cover" />
                    <div className="absolute top-1 left-1"><span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/90 text-gray-600">{p.tipo}</span></div>
                    <button onClick={() => { URL.revokeObjectURL(p.preview); setPendingPhotos(prev => prev.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            {pendingPhotos.length > 0 && <p className="text-xs text-gray-400">📎 {pendingPhotos.length} foto{pendingPhotos.length > 1 ? 's' : ''} pendiente{pendingPhotos.length > 1 ? 's' : ''} — se subirán al crear el parte</p>}
          </div>

          {/* Info about post-creation tabs */}
          <div className="bg-slate-50 border border-ecar-blueLight rounded-xl p-3 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <p className="text-xs text-ecar-blue"><strong>Tip:</strong> Al crear el parte podrás agregar <strong>personal presente</strong>, <strong>solicitar materiales</strong> del pañol y registrar <strong>equipos/maquinaria</strong> usados.</p>
          </div>

          <button onClick={handleSubmit} disabled={createParte.isPending || !form.obra_id || !form.trabajo_realizado} className="btn-primary w-full md:w-auto px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            {createParte.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />} Crear Parte y Continuar
          </button>
        </div>
      )}

      {/* Partes List */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Registro de Partes Diarios</h3></div>
        {isLoading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-ecar-blue rounded-full animate-spin mx-auto" /></div>
        ) : partes.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><ClipboardList size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No hay partes diarios</p><p className="text-sm">Creá el primer parte para registrar el avance de obra.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {partes.map(p => {
              const ClimaIcon = p.clima ? CLIMA_ICONS[p.clima] || Sun : Sun;
              return (
                <button key={p.id} onClick={() => setSelectedParte(p)} className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors text-left group">
                  <div className="w-11 h-11 rounded-xl bg-ecar-blueLight flex items-center justify-center shrink-0">
                    <ClimaIcon size={20} className="text-ecar-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate group-hover:text-ecar-blue transition-colors">{(p.obra as any)?.name || 'Sin obra'} — {new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    <p className="text-xs text-gray-500 truncate">{p.trabajo_realizado.substring(0, 80)}...</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.avance_porcentual > 0 && <span className="text-xs font-mono font-bold text-ecar-blue bg-slate-50 px-2 py-0.5 rounded-full">{p.avance_porcentual}%</span>}
                    <span className="font-mono text-xs text-gray-500">{p.horas_trabajadas}hs</span>
                    <span className={`badge ${ESTADO_COLORS[p.estado]}`}>{p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}</span>
                    <ChevronDown size={16} className="text-gray-300 group-hover:text-ecar-blue transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ ORDENES DE TRABAJO INTERNA (OTI) ═══════ */}
      <OrdenesTrabajoPanel projects={projects} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*                     PARTE DETAIL VIEW                              */
/* ═══════════════════════════════════════════════════════════════════ */
const ParteDetailView: React.FC<{
  parte: ParteDiario;
  onBack: () => void;
  onUpdate: any;
}> = ({ parte, onBack, onUpdate }) => {
  const [tab, setTab] = useState<DetailTab>('actividad');
  const ClimaIcon = parte.clima ? CLIMA_ICONS[parte.clima] || Sun : Sun;

  const tabs: { id: DetailTab; label: string; icon: React.ElementType; emoji: string }[] = [
    { id: 'actividad', label: 'Actividad', icon: ClipboardList, emoji: '📝' },
    { id: 'fotos', label: 'Fotos', icon: Camera, emoji: '📸' },
    { id: 'personal', label: 'Personal', icon: Users, emoji: '👷' },
    { id: 'materiales', label: 'Materiales', icon: Package, emoji: '📦' },
    { id: 'equipos', label: 'Equipos', icon: Truck, emoji: '🚛' },
  ];

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
        <ChevronUp size={16} className="rotate-[-90deg] group-hover:-translate-x-0.5 transition-transform" /> Volver a Partes Diarios
      </button>

      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><ClimaIcon size={80} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-xl">{(parte.obra as any)?.name || 'Sin obra'}</h3>
          <p className="text-ecar-blueLight text-sm mt-0.5 flex items-center gap-3">
            <span>{new Date(parte.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{CLIMA_LABELS[parte.clima || 'despejado']}</span>
            <span className="font-mono">{parte.horas_trabajadas}hs</span>
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 mt-3">
          <span className={`badge ${ESTADO_COLORS[parte.estado]}`}>{parte.estado.charAt(0).toUpperCase() + parte.estado.slice(1)}</span>
          {parte.estado === 'borrador' && (
            <button onClick={() => onUpdate.mutate({ id: parte.id, estado: 'enviado' })} className="badge badge-warning cursor-pointer hover:bg-yellow-200 gap-1">
              <Send size={12} /> Enviar para Aprobación
            </button>
          )}
          {parte.estado === 'enviado' && (
            <button onClick={() => onUpdate.mutate({ id: parte.id, estado: 'aprobado', aprobado_en: new Date().toISOString() })} className="badge badge-success cursor-pointer hover:bg-green-200 gap-1">
              <Check size={12} /> Aprobar
            </button>
          )}
        </div>
      </div>

      {/* Tabs - Mobile-friendly */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all ${tab === t.id ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <span className="text-base md:text-xs">{t.emoji}</span>
            <span className="hidden md:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'actividad' && <ActividadTab parte={parte} />}
      {tab === 'fotos' && <FotosTab parteId={parte.id} isBorrador={parte.estado === 'borrador'} />}
      {tab === 'personal' && <PersonalTab parteId={parte.id} isBorrador={parte.estado === 'borrador'} />}
      {tab === 'materiales' && <MaterialesTab parteId={parte.id} isBorrador={parte.estado === 'borrador'} />}
      {tab === 'equipos' && <EquiposTab parteId={parte.id} isBorrador={parte.estado === 'borrador'} />}
    </div>
  );
};

/* ── Actividad Tab ── */
const ActividadTab: React.FC<{ parte: ParteDiario }> = ({ parte }) => (
  <div className="light-card p-5 space-y-4">
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Trabajo Realizado</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{parte.trabajo_realizado}</p>
    </div>
    {parte.avance_porcentual > 0 && (
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Avance del Día</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-ecar-blue rounded-full transition-all" style={{ width: `${Math.min(parte.avance_porcentual, 100)}%` }} /></div>
          <span className="font-mono font-bold text-ecar-blue text-sm">{parte.avance_porcentual}%</span>
        </div>
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {parte.entregas && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Entregas / Recepciones</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{parte.entregas}</p></div>}
      {parte.incidentes && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">⚠️ Incidentes</p><p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{parte.incidentes}</p></div>}
      {parte.notas && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Notas</p><p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{parte.notas}</p></div>}
      {parte.firmado_por && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Firmado por</p><p className="text-sm text-gray-700 font-medium">{parte.firmado_por}</p></div>}
    </div>
    <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
      <span>Clima: {CLIMA_LABELS[parte.clima || 'despejado']}</span>
      <span>Temp: {parte.temperatura_min ?? '–'}°C / {parte.temperatura_max ?? '–'}°C</span>
    </div>
  </div>
);

/* ── Fotos Tab ── */
const FotosTab: React.FC<{ parteId: string; isBorrador: boolean }> = ({ parteId, isBorrador }) => {
  const { data: fotos = [] } = useParteFotos(parteId);
  const createFoto = useCreateParteFoto();
  const deleteFoto = useDeleteParteFoto();
  const [uploading, setUploading] = useState(false);
  const [fotoTipo, setFotoTipo] = useState<'avance' | 'entrega' | 'incidente' | 'otro'>('avance');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${parteId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('parte-diario-fotos').upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('parte-diario-fotos').getPublicUrl(path);
      await createFoto.mutateAsync({ parte_id: parteId, foto_url: urlData.publicUrl, tipo: fotoTipo });
    } catch (err) { console.error('Upload error:', err); }
    setUploading(false);
    e.target.value = '';
  };

  const TIPO_COLORS: Record<string, string> = { avance: 'badge-info', entrega: 'badge-success', incidente: 'badge-danger', otro: 'badge-neutral' };

  return (
    <div className="space-y-4">
      {isBorrador && (
        <div className="light-card p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Camera size={16} className="text-ecar-blue" /> Subir Foto</h4>
          <div className="flex flex-wrap gap-2">
            {(['avance', 'entrega', 'incidente', 'otro'] as const).map(t => (
              <button key={t} onClick={() => setFotoTipo(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${fotoTipo === t ? TIPO_COLORS[t] + ' ring-2 ring-offset-1 ring-ecar-blueLight' : 'bg-gray-100 text-gray-500'}`}>
                {t === 'avance' ? '📊 Avance' : t === 'entrega' ? '📦 Entrega' : t === 'incidente' ? '⚠️ Incidente' : '📎 Otro'}
              </button>
            ))}
          </div>
          <label className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? 'border-ecar-blueLight bg-slate-50' : 'border-gray-300 hover:border-ecar-blue hover:bg-slate-50/50'}`}>
            {uploading ? <div className="w-5 h-5 border-2 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin" /> : <Camera size={20} className="text-gray-400" />}
            <span className="text-sm font-medium text-gray-500">{uploading ? 'Subiendo...' : 'Tomar foto o elegir archivo'}</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      )}

      {fotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fotos.map(f => (
            <div key={f.id} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
              <img src={f.foto_url} alt={f.descripcion || 'Foto'} className="w-full h-40 object-cover" loading="lazy" />
              <div className="absolute top-2 left-2"><span className={`badge ${TIPO_COLORS[f.tipo]}`}>{f.tipo}</span></div>
              {isBorrador && (
                <button onClick={() => deleteFoto.mutate(f.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
              )}
              <div className="p-2"><p className="text-[10px] text-gray-400 font-mono">{new Date(f.taken_at).toLocaleString('es-AR')}</p></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="light-card p-8">
          <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin fotos</p>
          <p className="text-sm">Subí fotos del avance de obra usando el botón de arriba.</p>
        </div>
      )}
    </div>
  );
};

/* ── Personal Tab ── */
const PersonalTab: React.FC<{ parteId: string; isBorrador: boolean }> = ({ parteId, isBorrador }) => {
  const { data: personal = [] } = usePartePersonal(parteId);
  const { data: employees = [] } = useEmployees();
  const createPersonal = useCreatePartePersonal();
  const deletePersonal = useDeletePartePersonal();
  const [selEmp, setSelEmp] = useState('');
  const [horas, setHoras] = useState('8');
  const [tarea, setTarea] = useState('');
  const [search, setSearch] = useState('');

  const addedIds = personal.map(p => p.employee_id);
  const available = employees.filter(e => !addedIds.includes(e.id) && (e.employment_status === 'active') && (!search || e.full_name.toLowerCase().includes(search.toLowerCase())));

  const handleAdd = async () => {
    if (!selEmp) return;
    await createPersonal.mutateAsync({ parte_id: parteId, employee_id: selEmp, horas_trabajadas: Number(horas) || 8, tarea: tarea || null });
    setSelEmp(''); setHoras('8'); setTarea('');
  };

  return (
    <div className="space-y-4">
      {isBorrador && (
        <div className="light-card p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Users size={16} className="text-ecar-blue" /> Agregar Personal</h4>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empleado..." className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm" />
          </div>
          <select value={selEmp} onChange={e => setSelEmp(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm">
            <option value="">Seleccioná un empleado</option>
            {available.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.dni}</option>)}
          </select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-gray-500">Horas</label><input type="number" value={horas} onChange={e => setHoras(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono" /></div>
            <div><label className="text-xs font-bold text-gray-500">Tarea</label><input value={tarea} onChange={e => setTarea(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Opcional" /></div>
          </div>
          <button onClick={handleAdd} disabled={!selEmp || createPersonal.isPending} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> Agregar
          </button>
        </div>
      )}

      {personal.length > 0 ? (
        <div className="light-card overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Personal Presente ({personal.length})</span>
            <span className="text-xs font-mono text-gray-500">{personal.reduce((s, p) => s + p.horas_trabajadas, 0)} hs totales</span>
          </div>
          <div className="divide-y divide-gray-100">
            {personal.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-ecar-blueLight flex items-center justify-center text-ecar-blue font-bold text-xs shrink-0">
                  {((p.employee as any)?.full_name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{(p.employee as any)?.full_name || '—'}</p>
                  {p.tarea && <p className="text-xs text-gray-500 truncate">{p.tarea}</p>}
                </div>
                <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{p.horas_trabajadas}hs</span>
                {isBorrador && <button onClick={() => deletePersonal.mutate(p.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="light-card p-8">
          <Users size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin personal registrado</p>
        </div>
      )}
    </div>
  );
};

/* ── Materiales Tab ── */
const MaterialesTab: React.FC<{ parteId: string; isBorrador: boolean }> = ({ parteId, isBorrador }) => {
  const { data: solicitudes = [] } = useParteSolicitudes(parteId);
  const { data: items = [] } = useInventoryItems();
  const createSol = useCreateParteSolicitud();
  const updateSol = useUpdateParteSolicitud();
  const [itemId, setItemId] = useState('');
  const [desc, setDesc] = useState('');
  const [cant, setCant] = useState('');
  const [unidad, setUnidad] = useState('unidad');
  const [urgencia, setUrgencia] = useState<'baja' | 'normal' | 'urgente'>('normal');

  const handleItemSelect = (id: string) => {
    setItemId(id);
    const found = items?.find(i => i.id === id);
    if (found) { setDesc(found.name); setUnidad(found.unit); }
  };

  const handleAdd = async () => {
    if (!desc || !cant) return;
    await createSol.mutateAsync({ parte_id: parteId, item_id: itemId || null, descripcion: desc, cantidad: Number(cant), unidad, urgencia });
    setItemId(''); setDesc(''); setCant(''); setUnidad('unidad'); setUrgencia('normal');
  };

  const URG_COLORS: Record<string, string> = { baja: 'badge-neutral', normal: 'badge-info', urgente: 'badge-danger' };
  const EST_COLORS: Record<string, string> = { pendiente: 'badge-warning', aprobada: 'badge-success', rechazada: 'badge-danger', entregada: 'badge-info' };

  return (
    <div className="space-y-4">
      {isBorrador && (
        <div className="light-card p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Package size={16} className="text-orange-600" /> Solicitar Material</h4>
          <select value={itemId} onChange={e => handleItemSelect(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm">
            <option value="">Elegir del inventario (opcional)</option>
            {(items || []).map(i => <option key={i.id} value={i.id}>{i.name} — Stock: {i.current_stock} {i.unit}</option>)}
          </select>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción del material *" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="text-xs font-bold text-gray-500">Cantidad *</label><input type="number" value={cant} onChange={e => setCant(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono" /></div>
            <div><label className="text-xs font-bold text-gray-500">Unidad</label><input value={unidad} onChange={e => setUnidad(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" /></div>
            <div><label className="text-xs font-bold text-gray-500">Urgencia</label>
              <select value={urgencia} onChange={e => setUrgencia(e.target.value as any)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm">
                <option value="baja">Baja</option><option value="normal">Normal</option><option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={!desc || !cant || createSol.isPending} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> Solicitar Material
          </button>
        </div>
      )}

      {solicitudes.length > 0 ? (
        <div className="light-card overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-700">Solicitudes de Materiales ({solicitudes.length})</span>
          </div>
          <div className="divide-y divide-gray-100">
            {solicitudes.map(s => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.descripcion}</p>
                  <p className="text-xs text-gray-500">{s.cantidad} {s.unidad}</p>
                </div>
                <span className={`badge ${URG_COLORS[s.urgencia]}`}>{s.urgencia}</span>
                <span className={`badge ${EST_COLORS[s.estado]}`}>{s.estado}</span>
                {s.estado === 'pendiente' && !isBorrador && (
                  <div className="flex gap-1">
                    <button onClick={() => updateSol.mutate({ id: s.id, estado: 'aprobada', aprobada_en: new Date().toISOString() })} className="badge badge-success"><Check size={14} /></button>
                    <button onClick={() => updateSol.mutate({ id: s.id, estado: 'rechazada' })} className="badge badge-danger"><X size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="light-card p-8">
          <Package size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin solicitudes de materiales</p>
          <p className="text-sm">Solicitá materiales directamente desde la obra.</p>
        </div>
      )}
    </div>
  );
};

/* ── Equipos Tab ── */
const EquiposTab: React.FC<{ parteId: string; isBorrador: boolean }> = ({ parteId, isBorrador }) => {
  const { data: equipos = [] } = useParteEquipos(parteId);
  const { data: vehicles = [] } = useFuelVehicles();
  const createEquipo = useCreateParteEquipo();
  const deleteEquipo = useDeleteParteEquipo();
  const [vehicleId, setVehicleId] = useState('');
  const [horasUso, setHorasUso] = useState('');
  const [tareaEq, setTareaEq] = useState('');

  const addedIds = equipos.map(e => e.vehicle_id);
  const available = vehicles.filter(v => !addedIds.includes(v.id) && v.status === 'active');

  const handleAdd = async () => {
    if (!vehicleId) return;
    await createEquipo.mutateAsync({ parte_id: parteId, vehicle_id: vehicleId, horas_uso: Number(horasUso) || 0, tarea: tareaEq || null });
    setVehicleId(''); setHorasUso(''); setTareaEq('');
  };

  return (
    <div className="space-y-4">
      {isBorrador && (
        <div className="light-card p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Truck size={16} className="text-slate-600" /> Agregar Equipo / Maquinaria</h4>
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm">
            <option value="">Seleccioná equipo</option>
            {available.map(v => <option key={v.id} value={v.id}>{v.code} — {v.description} ({v.vehicle_type})</option>)}
          </select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-gray-500">Horas de Uso</label><input type="number" value={horasUso} onChange={e => setHorasUso(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono" /></div>
            <div><label className="text-xs font-bold text-gray-500">Tarea</label><input value={tareaEq} onChange={e => setTareaEq(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Qué hizo el equipo" /></div>
          </div>
          <button onClick={handleAdd} disabled={!vehicleId || createEquipo.isPending} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> Agregar Equipo
          </button>
        </div>
      )}

      {equipos.length > 0 ? (
        <div className="light-card overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Equipos en Obra ({equipos.length})</span>
            <span className="text-xs font-mono text-gray-500">{equipos.reduce((s, e) => s + e.horas_uso, 0)} hs totales</span>
          </div>
          <div className="divide-y divide-gray-100">
            {equipos.map(eq => (
              <div key={eq.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Truck size={16} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{(eq.vehicle as any)?.description || '—'} <span className="text-gray-400 text-xs">({(eq.vehicle as any)?.code})</span></p>
                  {eq.tarea && <p className="text-xs text-gray-500 truncate">{eq.tarea}</p>}
                </div>
                <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{eq.horas_uso}hs</span>
                {isBorrador && <button onClick={() => deleteEquipo.mutate(eq.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="light-card p-8">
          <Truck size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin equipos registrados</p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*              ORDENES DE TRABAJO INTERNA (OTI)                      */
/* ═══════════════════════════════════════════════════════════════════ */
const PRIO_LABELS: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'badge-neutral' },
  normal: { label: 'Normal', color: 'badge-info' },
  alta: { label: 'Alta', color: 'badge-warning' },
  urgente: { label: 'Urgente', color: 'badge-danger' },
};
const OTI_STATUS: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'badge-warning' },
  en_ejecucion: { label: 'En Ejecución', color: 'badge-info' },
  completada: { label: 'Completada', color: 'badge-success' },
  cancelada: { label: 'Cancelada', color: 'badge-danger' },
};

const OrdenesTrabajoPanel: React.FC<{ projects: any[] }> = ({ projects }) => {
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const createWO = useCreateWorkOrder();
  const updateWO = useUpdateWorkOrder();
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    project_id: '', title: '', description: '', assigned_to: '',
    priority: 'normal', start_date: new Date().toISOString().split('T')[0], due_date: '',
  });

  const filtered = useMemo(() => {
    let result = workOrders;
    if (filterStatus !== 'all') result = result.filter(wo => wo.status === filterStatus);
    return result;
  }, [workOrders, filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWO.mutateAsync({
      project_id: form.project_id || null,
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      priority: form.priority as any,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      status: 'pendiente',
    });
    setShowNew(false);
    setForm({ project_id: '', title: '', description: '', assigned_to: '', priority: 'normal', start_date: new Date().toISOString().split('T')[0], due_date: '' });
  };

  const activeCount = workOrders.filter(w => w.status === 'en_ejecucion').length;
  const pendingCount = workOrders.filter(w => w.status === 'pendiente').length;

  return (
    <div className="light-card overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Hammer size={18} className="text-amber-600" /> Órdenes de Trabajo Interna (OTI)</h3>
          <p className="text-xs text-gray-500 mt-0.5">PR-GO-01 — Define qué se ejecuta, quién responde y con qué criterio</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="badge badge-warning">{pendingCount} pendientes</span>}
          {activeCount > 0 && <span className="badge badge-info">{activeCount} en ejecución</span>}
          <button onClick={() => setShowNew(!showNew)} className="btn-primary px-3 py-1.5 flex items-center gap-1">
            {showNew ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nueva OTI</>}
          </button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="p-4 border-b border-gray-100 bg-amber-50/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">Título / Tarea *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Armar encofrado de columna C-3" /></div>
            <div><label className="text-xs font-bold text-gray-500">Obra</label><select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Sin obra</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><label className="text-xs font-bold text-gray-500">Asignar a</label><input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cuadrilla / Encargado" /></div>
            <div><label className="text-xs font-bold text-gray-500">Prioridad</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
            <div><label className="text-xs font-bold text-gray-500">Inicio</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-xs font-bold text-gray-500">Vencimiento</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500">Descripción / Criterio de ejecución</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Detallá las instrucciones técnicas, materiales a usar, condiciones de calidad y seguridad..." /></div>
          <button type="submit" disabled={createWO.isPending || !form.title} className="btn-primary px-5 py-2 disabled:opacity-50">
            {createWO.isPending ? 'Creando...' : '📋 Crear Orden de Trabajo'}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2 py-1 border rounded-md text-xs">
          <option value="all">Todos</option>
          {Object.entries(OTI_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} órdenes</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-amber-600 rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400"><Hammer size={36} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-medium">Sin órdenes de trabajo</p></div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map(wo => {
            const prio = PRIO_LABELS[wo.priority] || PRIO_LABELS.normal;
            const stat = OTI_STATUS[wo.status] || OTI_STATUS.pendiente;
            return (
              <div key={wo.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5"><Hammer size={18} className="text-amber-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">{wo.title}</span>
                      <span className={`badge ${stat.color}`}>{stat.label}</span>
                      <span className={`badge ${prio.color}`}>{prio.label}</span>
                    </div>
                    {wo.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{wo.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      {wo.assigned_to && <span>👷 {wo.assigned_to}</span>}
                      {wo.project && <span>🏗️ {(wo.project as any)?.name}</span>}
                      {wo.due_date && <span>📅 Vence: {new Date(wo.due_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {wo.status === 'pendiente' && (
                      <button onClick={() => updateWO.mutateAsync({ id: wo.id, status: 'en_ejecucion' })} className="badge badge-info">▶ Iniciar</button>
                    )}
                    {wo.status === 'en_ejecucion' && (
                      <button onClick={() => updateWO.mutateAsync({ id: wo.id, status: 'completada', completed_at: new Date().toISOString() })} className="badge badge-success">✅ Completar</button>
                    )}
                    {['pendiente', 'en_ejecucion'].includes(wo.status) && (
                      <button onClick={() => updateWO.mutateAsync({ id: wo.id, status: 'cancelada' })} className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold hover:bg-red-100">✕</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
