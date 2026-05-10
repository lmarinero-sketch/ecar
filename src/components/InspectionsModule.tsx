import React, { useState } from 'react';
import { ClipboardCheck, Plus, X, Check, ListChecks, AlertCircle, CheckCircle2, Clock, CircleDot, ChevronDown, ChevronUp } from 'lucide-react';
import { useInspecciones, useCreateInspeccion, useUpdateInspeccion, usePunchList, useCreatePunchItem, useUpdatePunchItem, useProjects } from '../hooks/useData';

const TIPO_LABELS: Record<string, string> = { estructura: 'Estructura', electrica: 'Eléctrica', sanitaria: 'Sanitaria', gas: 'Gas', seguridad_contra_incendio: 'Contra Incendio', terminaciones: 'Terminaciones', general: 'General' };
const RESULTADO_COLORS: Record<string, string> = { pendiente: 'bg-gray-100 text-gray-600', aprobada: 'bg-green-100 text-green-700', aprobada_con_observaciones: 'bg-yellow-100 text-yellow-700', rechazada: 'bg-red-100 text-red-700' };
const PRIORIDAD_COLORS: Record<string, string> = { baja: 'bg-blue-100 text-blue-700', media: 'bg-yellow-100 text-yellow-700', alta: 'bg-orange-100 text-orange-700', critica: 'bg-red-100 text-red-700' };
const PUNCH_ESTADO_COLORS: Record<string, string> = { abierto: 'bg-red-100 text-red-700', en_correccion: 'bg-yellow-100 text-yellow-700', corregido: 'bg-blue-100 text-blue-700', verificado: 'bg-green-100 text-green-700', cerrado: 'bg-gray-100 text-gray-600' };

export const InspectionsModule: React.FC = () => {
  const { data: inspecciones = [], isLoading: loadingInsp } = useInspecciones();
  const { data: punchItems = [], isLoading: loadingPunch } = usePunchList();
  const { data: projects = [] } = useProjects();
  const createInspeccion = useCreateInspeccion();
  const updateInspeccion = useUpdateInspeccion();
  const createPunchItem = useCreatePunchItem();
  const updatePunchItem = useUpdatePunchItem();
  const [tab, setTab] = useState<'inspecciones' | 'punch'>('inspecciones');
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [formInsp, setFormInsp] = useState({ obra_id: '', tipo: 'general', inspector: '', ubicacion: '', observaciones: '' });
  const [formPunch, setFormPunch] = useState({ obra_id: '', titulo: '', descripcion: '', ubicacion: '', prioridad: 'media', asignado_a: '', fecha_limite: '' });

  const handleSubmitInsp = async () => {
    if (!formInsp.obra_id || !formInsp.inspector) return;
    await createInspeccion.mutateAsync({ ...formInsp, tipo: formInsp.tipo as any, resultado: 'pendiente' });
    setShowForm(false);
    setFormInsp({ obra_id: '', tipo: 'general', inspector: '', ubicacion: '', observaciones: '' });
  };

  const handleSubmitPunch = async () => {
    if (!formPunch.obra_id || !formPunch.titulo) return;
    await createPunchItem.mutateAsync({ ...formPunch, prioridad: formPunch.prioridad as any, fecha_limite: formPunch.fecha_limite || null });
    setShowForm(false);
    setFormPunch({ obra_id: '', titulo: '', descripcion: '', ubicacion: '', prioridad: 'media', asignado_a: '', fecha_limite: '' });
  };

  const punchAbiertos = punchItems.filter(p => p.estado === 'abierto' || p.estado === 'en_correccion').length;
  const inspAprobadas = inspecciones.filter(i => i.resultado === 'aprobada').length;
  const inspRechazadas = inspecciones.filter(i => i.resultado === 'rechazada').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardCheck size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ClipboardCheck size={24} /> Inspecciones & Calidad</h3>
          <p className="text-teal-100 text-sm mt-1">Control de calidad, checklists de inspección y seguimiento de no conformidades (Punch List)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><ClipboardCheck size={16} className="text-teal-500" /> Total Inspecciones</div>
          <p className="text-2xl font-black font-mono text-teal-600">{inspecciones.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><CheckCircle2 size={16} className="text-green-500" /> Aprobadas</div>
          <p className="text-2xl font-black font-mono text-green-600">{inspAprobadas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><AlertCircle size={16} className="text-red-500" /> Rechazadas</div>
          <p className="text-2xl font-black font-mono text-red-600">{inspRechazadas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><CircleDot size={16} className="text-orange-500" /> Punch Abiertos</div>
          <p className="text-2xl font-black font-mono text-orange-600">{punchAbiertos}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setTab('inspecciones')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === 'inspecciones' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ClipboardCheck size={16} /> Inspecciones ({inspecciones.length})
        </button>
        <button onClick={() => setTab('punch')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === 'punch' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ListChecks size={16} /> Punch List ({punchItems.length})
        </button>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
        {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> {tab === 'inspecciones' ? 'Nueva Inspección' : 'Nuevo Item'}</>}
      </button>

      {/* Form Inspeccion */}
      {showForm && tab === 'inspecciones' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Obra *</label><select value={formInsp.obra_id} onChange={e => setFormInsp({...formInsp, obra_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="">Seleccioná</option>{projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Tipo</label><select value={formInsp.tipo} onChange={e => setFormInsp({...formInsp, tipo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">{Object.entries(TIPO_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Inspector *</label><input value={formInsp.inspector} onChange={e => setFormInsp({...formInsp, inspector: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Nombre del inspector" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Ubicación</label><input value={formInsp.ubicacion} onChange={e => setFormInsp({...formInsp, ubicacion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Piso, sector, zona..." /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Observaciones</label><input value={formInsp.observaciones} onChange={e => setFormInsp({...formInsp, observaciones: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Notas generales..." /></div>
          </div>
          <button onClick={handleSubmitInsp} disabled={createInspeccion.isPending} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-teal-700 transition-all">
            {createInspeccion.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />} Crear Inspección
          </button>
        </div>
      )}

      {/* Form Punch */}
      {showForm && tab === 'punch' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Obra *</label><select value={formPunch.obra_id} onChange={e => setFormPunch({...formPunch, obra_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="">Seleccioná</option>{projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Título *</label><input value={formPunch.titulo} onChange={e => setFormPunch({...formPunch, titulo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: Fisura en muro P2" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Prioridad</label><select value={formPunch.prioridad} onChange={e => setFormPunch({...formPunch, prioridad: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option></select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Ubicación</label><input value={formPunch.ubicacion} onChange={e => setFormPunch({...formPunch, ubicacion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Piso, sector..." /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Asignado a</label><input value={formPunch.asignado_a} onChange={e => setFormPunch({...formPunch, asignado_a: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Responsable de corrección" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha Límite</label><input type="date" value={formPunch.fecha_limite} onChange={e => setFormPunch({...formPunch, fecha_limite: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Descripción</label><textarea value={formPunch.descripcion} onChange={e => setFormPunch({...formPunch, descripcion: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Detalle del defecto o no conformidad..." /></div>
          <button onClick={handleSubmitPunch} disabled={createPunchItem.isPending} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-teal-700 transition-all">
            {createPunchItem.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />} Agregar Item
          </button>
        </div>
      )}

      {/* Inspecciones Table */}
      {tab === 'inspecciones' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Registro de Inspecciones</h3></div>
          {loadingInsp ? <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto" /></div> :
            inspecciones.length === 0 ? <div className="text-center py-16 text-gray-400"><ClipboardCheck size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin inspecciones</p><p className="text-sm">Creá la primera inspección para controlar la calidad.</p></div> :
            <table className="w-full text-sm text-left"><thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Obra</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Inspector</th><th className="px-4 py-3">Resultado</th><th className="px-4 py-3">Acción</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{inspecciones.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{new Date(i.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 font-medium">{(i.obra as any)?.name || '–'}</td>
                  <td className="px-4 py-3">{TIPO_LABELS[i.tipo]}</td>
                  <td className="px-4 py-3">{i.inspector}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${RESULTADO_COLORS[i.resultado]}`}>{i.resultado.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 flex gap-1">{i.resultado === 'pendiente' && (<><button onClick={() => updateInspeccion.mutate({ id: i.id, resultado: 'aprobada' })} className="text-xs text-green-600 font-bold hover:underline">Aprobar</button><button onClick={() => updateInspeccion.mutate({ id: i.id, resultado: 'rechazada' })} className="text-xs text-red-600 font-bold hover:underline ml-2">Rechazar</button></>)}</td>
                </tr>
              ))}</tbody></table>
          }
        </div>
      )}

      {/* Punch List */}
      {tab === 'punch' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Punch List — No Conformidades</h3></div>
          {loadingPunch ? <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto" /></div> :
            punchItems.length === 0 ? <div className="text-center py-16 text-gray-400"><ListChecks size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin items de punch list</p><p className="text-sm">Agregá items cuando detectes no conformidades.</p></div> :
            <div className="divide-y divide-gray-100">{punchItems.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black font-mono text-gray-600">#{p.numero}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{p.titulo}</p>
                  <p className="text-xs text-gray-500">{(p.obra as any)?.name} {p.ubicacion ? `— ${p.ubicacion}` : ''} {p.asignado_a ? `→ ${p.asignado_a}` : ''}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PRIORIDAD_COLORS[p.prioridad]}`}>{p.prioridad}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PUNCH_ESTADO_COLORS[p.estado]}`}>{p.estado.replace('_', ' ')}</span>
                {p.estado === 'abierto' && <button onClick={() => updatePunchItem.mutate({ id: p.id, estado: 'en_correccion' })} className="text-xs text-blue-600 font-bold hover:underline">Corregir</button>}
                {p.estado === 'corregido' && <button onClick={() => updatePunchItem.mutate({ id: p.id, estado: 'verificado', verificado_en: new Date().toISOString() })} className="text-xs text-green-600 font-bold hover:underline">Verificar</button>}
              </div>
            ))}</div>
          }
        </div>
      )}
    </div>
  );
};
