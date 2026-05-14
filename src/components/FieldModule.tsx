import React, { useState } from 'react';
import { ClipboardList, Plus, Sun, Cloud, CloudRain, CloudLightning, Snowflake, Wind, Check, X, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { usePartesDiarios, useCreateParteDiario, useUpdateParteDiario, useProjects } from '../hooks/useData';
import type { ParteDiario } from '../lib/types';

const CLIMA_ICONS: Record<string, React.ElementType> = { despejado: Sun, nublado: Cloud, lluvia: CloudRain, tormenta: CloudLightning, nieve: Snowflake, ventoso: Wind };
const CLIMA_LABELS: Record<string, string> = { despejado: 'Despejado', nublado: 'Nublado', lluvia: 'Lluvia', tormenta: 'Tormenta', nieve: 'Nieve', ventoso: 'Ventoso' };
const ESTADO_COLORS: Record<string, string> = { borrador: 'bg-gray-100 text-gray-600', enviado: 'bg-yellow-100 text-yellow-700', aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700' };

export const FieldModule: React.FC = () => {
  const { data: partes = [], isLoading } = usePartesDiarios();
  const { data: projects = [] } = useProjects();
  const createParte = useCreateParteDiario();
  const updateParte = useUpdateParteDiario();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [form, setForm] = useState({
    obra_id: '', fecha: new Date().toISOString().split('T')[0], clima: 'despejado',
    temperatura_min: '', temperatura_max: '', trabajo_realizado: '', entregas: '', incidentes: '',
    horas_trabajadas: '8', notas: '', firmado_por: '',
  });

  const handleSubmit = async () => {
    if (!form.obra_id || !form.trabajo_realizado) return;
    await createParte.mutateAsync({
      obra_id: form.obra_id, fecha: form.fecha, clima: form.clima as ParteDiario['clima'],
      temperatura_min: form.temperatura_min ? Number(form.temperatura_min) : null,
      temperatura_max: form.temperatura_max ? Number(form.temperatura_max) : null,
      trabajo_realizado: form.trabajo_realizado, entregas: form.entregas || null,
      incidentes: form.incidentes || null, horas_trabajadas: Number(form.horas_trabajadas),
      notas: form.notas || null, firmado_por: form.firmado_por || null, estado: 'borrador',
    });
    setShowForm(false);
    setForm({ obra_id: '', fecha: new Date().toISOString().split('T')[0], clima: 'despejado', temperatura_min: '', temperatura_max: '', trabajo_realizado: '', entregas: '', incidentes: '', horas_trabajadas: '8', notas: '', firmado_por: '' });
  };

  const kpis = {
    total: partes.length,
    borradores: partes.filter(p => p.estado === 'borrador').length,
    enviados: partes.filter(p => p.estado === 'enviado').length,
    aprobados: partes.filter(p => p.estado === 'aprobado').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardList size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ClipboardList size={24} /> Parte Diario de Obra</h3>
          <p className="text-cyan-100 text-sm mt-1">Registro diario de actividades, personal, clima y avance de obra</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Partes', value: kpis.total, icon: ClipboardList, color: 'text-cyan-600' },
          { label: 'Borradores', value: kpis.borradores, icon: Clock, color: 'text-gray-500' },
          { label: 'Enviados', value: kpis.enviados, icon: Eye, color: 'text-yellow-600' },
          { label: 'Aprobados', value: kpis.aprobados, icon: Check, color: 'text-green-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><kpi.icon size={16} className={kpi.color} /> {kpi.label}</div>
            <p className={`text-2xl font-black font-mono ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* New Button */}
      <button onClick={() => setShowForm(!showForm)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark hover:shadow-lg transition-all">
        {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo Parte Diario</>}
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Obra *</label>
              <select value={form.obra_id} onChange={e => setForm({...form, obra_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue">
                <option value="">Seleccioná una obra</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Clima</label>
              <div className="flex gap-1 mt-1">
                {Object.entries(CLIMA_ICONS).map(([key, Icon]) => (
                  <button key={key} onClick={() => setForm({...form, clima: key})} className={`p-2 rounded-lg border transition-all ${form.clima === key ? 'bg-cyan-100 border-cyan-400 text-cyan-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`} title={CLIMA_LABELS[key]}>
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Temp Mín (°C)</label><input type="number" value={form.temperatura_min} onChange={e => setForm({...form, temperatura_min: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: 12" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Temp Máx (°C)</label><input type="number" value={form.temperatura_max} onChange={e => setForm({...form, temperatura_max: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: 28" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Hs Trabajadas</label><input type="number" value={form.horas_trabajadas} onChange={e => setForm({...form, horas_trabajadas: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Trabajo Realizado *</label><textarea value={form.trabajo_realizado} onChange={e => setForm({...form, trabajo_realizado: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Descripción detallada de las tareas realizadas en el día..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Entregas / Recepciones</label><textarea value={form.entregas} onChange={e => setForm({...form, entregas: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Materiales recibidos, entregas, etc." /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Incidentes / Novedades</label><textarea value={form.incidentes} onChange={e => setForm({...form, incidentes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Incidentes de seguridad, paradas, etc." /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Firmado por</label><input type="text" value={form.firmado_por} onChange={e => setForm({...form, firmado_por: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Nombre del encargado" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Notas</label><input type="text" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Observaciones adicionales" /></div>
          </div>
          <button onClick={handleSubmit} disabled={createParte.isPending} className="bg-ecar-blue text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark">
            {createParte.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />} Guardar Parte
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Registro de Partes Diarios</h3></div>
        {isLoading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-ecar-blue rounded-full animate-spin mx-auto" /></div>
        ) : partes.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><ClipboardList size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No hay partes diarios</p><p className="text-sm">Creá el primer parte para registrar el avance de obra.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {partes.map(p => {
              const ClimaIcon = p.clima ? CLIMA_ICONS[p.clima] || Sun : Sun;
              const isExpanded = expanded === p.id;
              return (
                <div key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <div className="px-4 py-3 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : p.id)}>
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center"><ClimaIcon size={20} className="text-cyan-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{(p.obra as any)?.name || 'Sin obra'} — {new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p className="text-xs text-gray-500 truncate">{p.trabajo_realizado.substring(0, 80)}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">{p.horas_trabajadas}hs</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ESTADO_COLORS[p.estado]}`}>{p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}</span>
                      {p.estado === 'borrador' && (
                        <button onClick={(e) => { e.stopPropagation(); updateParte.mutate({ id: p.id, estado: 'enviado' }); }} className="px-2 py-1 bg-yellow-500 text-white rounded-lg text-xs font-bold hover:bg-yellow-600 transition-all">Enviar</button>
                      )}
                      {p.estado === 'enviado' && (
                        <button onClick={(e) => { e.stopPropagation(); updateParte.mutate({ id: p.id, estado: 'aprobado', aprobado_en: new Date().toISOString() }); }} className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all">Aprobar</button>
                      )}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pl-18 space-y-2 bg-gray-50/50 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                        <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Trabajo Realizado</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{p.trabajo_realizado}</p></div>
                        {p.entregas && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Entregas</p><p className="text-sm text-gray-700">{p.entregas}</p></div>}
                        {p.incidentes && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Incidentes</p><p className="text-sm text-red-600">{p.incidentes}</p></div>}
                        {p.notas && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Notas</p><p className="text-sm text-gray-600">{p.notas}</p></div>}
                        {p.firmado_por && <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Firmado por</p><p className="text-sm text-gray-700 font-medium">{p.firmado_por}</p></div>}
                        <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Clima</p><p className="text-sm text-gray-700">{CLIMA_LABELS[p.clima || 'despejado']} | {p.temperatura_min ?? '–'}°C / {p.temperatura_max ?? '–'}°C</p></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
