import React, { useState } from 'react';
import { MessageSquareText, Plus, X, Check, Clock, CheckCircle2, AlertCircle, DollarSign, Calendar, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useConsultasObra, useCreateConsultaObra, useUpdateConsultaObra, useProjects } from '../hooks/useData';

const ESTADO_COLORS: Record<string, string> = { borrador: 'bg-gray-100 text-gray-600', abierta: 'bg-yellow-100 text-yellow-700', respondida: 'bg-blue-100 text-blue-700', cerrada: 'bg-green-100 text-green-700' };

export const RFIModule: React.FC = () => {
  const { data: consultas = [], isLoading } = useConsultasObra();
  const { data: projects = [] } = useProjects();
  const createConsulta = useCreateConsultaObra();
  const updateConsulta = useUpdateConsultaObra();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [respuestaForm, setRespuestaForm] = useState<{ id: string; respuesta: string } | null>(null);

  const [form, setForm] = useState({
    obra_id: '', asunto: '', pregunta: '', consultado_por: '', asignado_a: '',
    impacto_costo: false, impacto_costo_monto: '', impacto_cronograma: false, impacto_cronograma_dias: '',
    fecha_limite_respuesta: '',
  });

  const handleSubmit = async () => {
    if (!form.obra_id || !form.asunto || !form.pregunta || !form.consultado_por) return;
    await createConsulta.mutateAsync({
      obra_id: form.obra_id, asunto: form.asunto, pregunta: form.pregunta,
      consultado_por: form.consultado_por, asignado_a: form.asignado_a || null,
      impacto_costo: form.impacto_costo, impacto_costo_monto: form.impacto_costo_monto ? Number(form.impacto_costo_monto) : 0,
      impacto_cronograma: form.impacto_cronograma, impacto_cronograma_dias: form.impacto_cronograma_dias ? Number(form.impacto_cronograma_dias) : 0,
      fecha_limite_respuesta: form.fecha_limite_respuesta || null,
      estado: 'abierta',
    });
    setShowForm(false);
    setForm({ obra_id: '', asunto: '', pregunta: '', consultado_por: '', asignado_a: '', impacto_costo: false, impacto_costo_monto: '', impacto_cronograma: false, impacto_cronograma_dias: '', fecha_limite_respuesta: '' });
  };

  const handleResponder = async () => {
    if (!respuestaForm || !respuestaForm.respuesta) return;
    await updateConsulta.mutateAsync({ id: respuestaForm.id, respuesta_oficial: respuestaForm.respuesta, estado: 'respondida', respondido_en: new Date().toISOString() });
    setRespuestaForm(null);
  };

  const abiertas = consultas.filter(c => c.estado === 'abierta').length;
  const respondidas = consultas.filter(c => c.estado === 'respondida').length;
  const conImpactoCosto = consultas.filter(c => c.impacto_costo).length;
  const conImpactoCrono = consultas.filter(c => c.impacto_cronograma).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><MessageSquareText size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><MessageSquareText size={24} /> Consultas de Obra (RFI)</h3>
          <p className="text-purple-100 text-sm mt-1">Solicitudes formales de información técnica — trazabilidad de consultas y respuestas</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><MessageSquareText size={16} className="text-purple-500" /> Total RFI</div>
          <p className="text-2xl font-black font-mono text-purple-600">{consultas.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Clock size={16} className="text-yellow-500" /> Abiertas</div>
          <p className="text-2xl font-black font-mono text-yellow-600">{abiertas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><DollarSign size={16} className="text-red-500" /> Impacto Costo</div>
          <p className="text-2xl font-black font-mono text-red-600">{conImpactoCosto}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Calendar size={16} className="text-orange-500" /> Impacto Crono</div>
          <p className="text-2xl font-black font-mono text-orange-600">{conImpactoCrono}</p>
        </div>
      </div>

      {/* New Button */}
      <button onClick={() => setShowForm(!showForm)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
        {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nueva Consulta (RFI)</>}
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Obra *</label><select value={form.obra_id} onChange={e => setForm({...form, obra_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="">Seleccioná</option>{projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Consultado por *</label><input value={form.consultado_por} onChange={e => setForm({...form, consultado_por: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Quién formula la consulta" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Asignado a</label><input value={form.asignado_a} onChange={e => setForm({...form, asignado_a: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Quién debe responder" /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Asunto *</label><input value={form.asunto} onChange={e => setForm({...form, asunto: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Tema de la consulta" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Pregunta / Detalle *</label><textarea value={form.pregunta} onChange={e => setForm({...form, pregunta: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Detalle la consulta técnica..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha límite respuesta</label><input type="date" value={form.fecha_limite_respuesta} onChange={e => setForm({...form, fecha_limite_respuesta: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.impacto_costo} onChange={e => setForm({...form, impacto_costo: e.target.checked})} className="rounded" /><span className="text-sm font-bold text-gray-600">Impacto en Costo</span></label>
              {form.impacto_costo && <input value={form.impacto_costo_monto} onChange={e => setForm({...form, impacto_costo_monto: e.target.value})} className="w-32 px-2 py-1 border rounded-lg text-sm font-mono" placeholder="$ Monto" />}
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.impacto_cronograma} onChange={e => setForm({...form, impacto_cronograma: e.target.checked})} className="rounded" /><span className="text-sm font-bold text-gray-600">Impacto en Cronograma</span></label>
              {form.impacto_cronograma && <input value={form.impacto_cronograma_dias} onChange={e => setForm({...form, impacto_cronograma_dias: e.target.value})} className="w-20 px-2 py-1 border rounded-lg text-sm font-mono" placeholder="Días" />}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={createConsulta.isPending} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-all">
            {createConsulta.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />} Enviar Consulta
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Registro de Consultas (RFI)</h3></div>
        {isLoading ? <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto" /></div> :
          consultas.length === 0 ? <div className="text-center py-16 text-gray-400"><MessageSquareText size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin consultas</p><p className="text-sm">Creá la primera RFI para formalizar consultas técnicas.</p></div> :
          <div className="divide-y divide-gray-100">{consultas.map(c => {
            const isExpanded = expanded === c.id;
            return (
              <div key={c.id}>
                <div className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setExpanded(isExpanded ? null : c.id)}>
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-black font-mono text-sm">#{c.numero}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{c.asunto}</p>
                    <p className="text-xs text-gray-500">{(c.obra as any)?.name} — {c.consultado_por} {c.asignado_a ? `→ ${c.asignado_a}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.impacto_costo && <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-500">$ {c.impacto_costo_monto.toLocaleString('es-AR')}</span>}
                    {c.impacto_cronograma && <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-orange-50 text-orange-500">+{c.impacto_cronograma_dias}d</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ESTADO_COLORS[c.estado]}`}>{c.estado}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50/50 border-t border-gray-100 space-y-3 pt-3">
                    <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Pregunta</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{c.pregunta}</p></div>
                    {c.respuesta_oficial && <div className="bg-blue-50 rounded-lg p-3 border border-blue-100"><p className="text-xs font-bold text-blue-600 uppercase mb-1">Respuesta Oficial</p><p className="text-sm text-blue-800 whitespace-pre-wrap">{c.respuesta_oficial}</p>{c.respondido_en && <p className="text-xs text-blue-500 mt-1">— {new Date(c.respondido_en).toLocaleDateString('es-AR')}</p>}</div>}
                    {c.estado === 'abierta' && !respuestaForm && (
                      <button onClick={() => setRespuestaForm({ id: c.id, respuesta: '' })} className="text-sm text-purple-600 font-bold hover:underline flex items-center gap-1"><CheckCircle2 size={14} /> Responder esta consulta</button>
                    )}
                    {respuestaForm?.id === c.id && (
                      <div className="space-y-2">
                        <textarea value={respuestaForm.respuesta} onChange={e => setRespuestaForm({...respuestaForm, respuesta: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Escribí la respuesta oficial..." />
                        <div className="flex gap-2">
                          <button onClick={handleResponder} className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-all flex items-center gap-1"><Check size={14} /> Enviar Respuesta</button>
                          <button onClick={() => setRespuestaForm(null)} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-bold">Cancelar</button>
                        </div>
                      </div>
                    )}
                    {c.estado === 'respondida' && (
                      <button onClick={() => updateConsulta.mutate({ id: c.id, estado: 'cerrada' })} className="text-sm text-green-600 font-bold hover:underline flex items-center gap-1"><CheckCircle2 size={14} /> Cerrar consulta</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}</div>
        }
      </div>
    </div>
  );
};
