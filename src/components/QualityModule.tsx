import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, Search, Plus, X, Save, Trash2, CheckCircle2,
  AlertCircle, CircleDot, ListChecks, Check, Layers
} from 'lucide-react';
import {
  useQualityChecklists, useCreateQualityChecklist, useUpdateQualityChecklist,
  useProjects, useWbsElements, useInspecciones, useCreateInspeccion,
  useUpdateInspeccion, usePunchList, useCreatePunchItem, useUpdatePunchItem
} from '../hooks/useData';
import type { QualityChecklist, QualityChecklistItem } from '../lib/types';

const TIPO_LABELS: Record<string, string> = {
  estructura: 'Estructura',
  electrica: 'Eléctrica',
  sanitaria: 'Sanitaria',
  gas: 'Gas',
  seguridad_contra_incendio: 'Contra Incendio',
  terminaciones: 'Terminaciones',
  general: 'General',
};

const RESULTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-700',
  aprobada: 'bg-green-100 text-green-700',
  aprobada_con_observaciones: 'bg-yellow-100 text-yellow-700',
  rechazada: 'bg-red-100 text-red-700',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  baja: 'bg-blue-100 text-blue-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  critica: 'bg-red-100 text-red-700',
};

const PUNCH_ESTADO_COLORS: Record<string, string> = {
  abierto: 'bg-red-100 text-red-700',
  en_correccion: 'bg-yellow-100 text-yellow-700',
  corregido: 'bg-blue-100 text-blue-700',
  verificado: 'bg-green-100 text-green-700',
  cerrado: 'bg-gray-100 text-gray-600',
};

export const QualityModule: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'checklists' | 'inspecciones' | 'punch'>('checklists');

  // Shared project / WBS data
  const { data: projects = [] } = useProjects();
  const { data: wbsElements = [] } = useWbsElements();

  // --- Checklists data & hooks ---
  const { data: checklists = [], isLoading: loadingChecklists } = useQualityChecklists();
  const createQC = useCreateQualityChecklist();
  const updateQC = useUpdateQualityChecklist();

  // --- Inspecciones & Punch list data & hooks ---
  const { data: inspecciones = [], isLoading: loadingInsp } = useInspecciones();
  const updateInspeccion = useUpdateInspeccion();
  const createInspeccion = useCreateInspeccion();
  const { data: punchItems = [], isLoading: loadingPunch } = usePunchList();
  const createPunchItem = useCreatePunchItem();
  const updatePunchItem = useUpdatePunchItem();

  // Filters
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');

  // Checklists Modal & Form
  const [showQcModal, setShowQcModal] = useState(false);
  const [selectedQC, setSelectedQC] = useState<QualityChecklist | null>(null);
  const [qcForm, setQcForm] = useState({
    project_id: '',
    wbs_element_id: '',
    title: '',
    inspector_name: '',
    items: [] as QualityChecklistItem[],
    status: 'draft' as QualityChecklist['status'],
    notes: '',
  });

  // Inspeccion Form
  const [showInspModal, setShowInspModal] = useState(false);
  const [formInsp, setFormInsp] = useState({
    obra_id: '',
    tipo: 'general',
    inspector: '',
    ubicacion: '',
    observaciones: '',
  });

  // Punch Form
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [formPunch, setFormPunch] = useState({
    obra_id: '',
    titulo: '',
    descripcion: '',
    ubicacion: '',
    prioridad: 'media',
    asignado_a: '',
    fecha_limite: '',
  });

  // --- Calculations for Checklists ---
  const filteredChecklists = useMemo(() => {
    let res = checklists;
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(x => x.title.toLowerCase().includes(s) || x.project?.name?.toLowerCase().includes(s));
    }
    if (filterProject) res = res.filter(x => x.project_id === filterProject);
    return res;
  }, [checklists, search, filterProject]);

  const avgChecklistScore = useMemo(() => {
    if (checklists.length === 0) return 0;
    const total = checklists.reduce((acc, c) => acc + (c.score || 0), 0);
    return Math.round(total / checklists.length);
  }, [checklists]);

  const qcScore = useMemo(() => {
    if (qcForm.items.length === 0) return 0;
    const applicable = qcForm.items.filter(i => i.status !== 'na');
    if (applicable.length === 0) return 100;
    const passed = applicable.filter(i => i.status === 'pass').length;
    return Math.round((passed / applicable.length) * 100);
  }, [qcForm.items]);

  // Checklists item helpers
  const addQcItem = () => setQcForm({ ...qcForm, items: [...qcForm.items, { description: '', status: 'na' }] });
  const updateQcItem = (index: number, field: keyof QualityChecklistItem, value: string) => {
    const newItems = [...qcForm.items];
    (newItems[index] as any)[field] = value;
    setQcForm({ ...qcForm, items: newItems });
  };
  const removeQcItem = (index: number) => setQcForm({ ...qcForm, items: qcForm.items.filter((_, i) => i !== index) });

  const resetQcForm = () => {
    setSelectedQC(null);
    setQcForm({ project_id: '', wbs_element_id: '', title: '', inspector_name: '', items: [], status: 'draft', notes: '' });
  };

  const openEditQc = (qc: QualityChecklist) => {
    setSelectedQC(qc);
    setQcForm({
      project_id: qc.project_id || '',
      wbs_element_id: qc.wbs_element_id || '',
      title: qc.title,
      inspector_name: qc.inspector_name || '',
      items: qc.items || [],
      status: qc.status,
      notes: qc.notes || '',
    });
    setShowQcModal(true);
  };

  const handleSaveQC = async () => {
    try {
      const payload = { ...qcForm, score: qcScore, wbs_element_id: qcForm.wbs_element_id || null };
      if (selectedQC) {
        await updateQC.mutateAsync({ id: selectedQC.id, ...payload });
      } else {
        await createQC.mutateAsync(payload);
      }
      setShowQcModal(false);
      resetQcForm();
    } catch (e) {
      console.error(e);
    }
  };

  // --- Inspecciones & Punch Form submissions ---
  const handleSubmitInsp = async () => {
    if (!formInsp.obra_id || !formInsp.inspector) return;
    await createInspeccion.mutateAsync({ ...formInsp, tipo: formInsp.tipo as any, resultado: 'pendiente' });
    setShowInspModal(false);
    setFormInsp({ obra_id: '', tipo: 'general', inspector: '', ubicacion: '', observaciones: '' });
  };

  const handleSubmitPunch = async () => {
    if (!formPunch.obra_id || !formPunch.titulo) return;
    await createPunchItem.mutateAsync({ ...formPunch, prioridad: formPunch.prioridad as any, fecha_limite: formPunch.fecha_limite || null });
    setShowPunchModal(false);
    setFormPunch({ obra_id: '', titulo: '', descripcion: '', ubicacion: '', prioridad: 'media', asignado_a: '', fecha_limite: '' });
  };

  // KPI calculations
  const inspAprobadas = inspecciones.filter(i => i.resultado === 'aprobada').length;
  const inspRechazadas = inspecciones.filter(i => i.resultado === 'rechazada').length;
  const punchAbiertos = punchItems.filter(p => p.estado === 'abierto' || p.estado === 'en_correccion').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <ClipboardCheck size={140} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm mb-3">
            <Layers size={14} className="text-ecar-blueLight" />
            Gerencia de Obras — Control de Calidad
          </div>
          <h3 className="font-black text-2xl md:text-3xl tracking-tight flex items-center gap-2.5">
            <ClipboardCheck size={28} className="text-ecar-blueLight" />
            Calidad e Inspecciones
          </h3>
          <p className="text-slate-100 text-sm mt-1.5 leading-relaxed font-normal">
            Auditorías técnicas, protocolos de ensayo, checklists de liberación de etapas y seguimiento de Punch List en obra (PR-GO-01).
          </p>
        </div>
      </div>

      {/* Unified KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="light-card p-4 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>Checklists Calidad</span>
            <ClipboardCheck size={16} className="text-ecar-blue" />
          </div>
          <p className="text-2xl font-black font-mono text-ecar-blue">{checklists.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Promedio: <strong className="text-emerald-600 font-semibold">{avgChecklistScore}%</strong></p>
        </div>

        <div className="light-card p-4 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>Inspecciones de Campo</span>
            <CheckCircle2 size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-800">{inspecciones.length}</p>
          <p className="text-[11px] text-green-600 mt-1 font-semibold">{inspAprobadas} aprobadas / {inspRechazadas} rechazadas</p>
        </div>

        <div className="light-card p-4 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>Punch List Abiertos</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-600">{punchAbiertos}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total ítems: {punchItems.length}</p>
        </div>

        <div className="light-card p-4 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>Estado General</span>
            <CircleDot size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {punchAbiertos === 0 ? 'Conforme' : `${punchAbiertos} Pend.`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Norma ISO 9001 / PR-GO</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('checklists')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'checklists'
                ? 'bg-white text-ecar-blue shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck size={15} />
            Checklists de Etapa ({checklists.length})
          </button>

          <button
            onClick={() => setActiveTab('inspecciones')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inspecciones'
                ? 'bg-white text-ecar-blue shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={15} />
            Inspecciones de Campo ({inspecciones.length})
          </button>

          <button
            onClick={() => setActiveTab('punch')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'punch'
                ? 'bg-white text-ecar-blue shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListChecks size={15} />
            Punch List ({punchItems.length})
          </button>
        </div>

        {/* Action Button for Active Tab */}
        <div>
          {activeTab === 'checklists' && (
            <button
              onClick={() => { resetQcForm(); setShowQcModal(true); }}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Nuevo Checklist
            </button>
          )}

          {activeTab === 'inspecciones' && (
            <button
              onClick={() => setShowInspModal(true)}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Nueva Inspección
            </button>
          )}

          {activeTab === 'punch' && (
            <button
              onClick={() => setShowPunchModal(true)}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Nuevo Ítem Punch List
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHECKLISTS DE CALIDAD                                              */}
      {/* ========================================================================= */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-xl w-full">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por título o proyecto..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                />
              </div>
              <select
                value={filterProject}
                onChange={e => setFilterProject(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-48 bg-white"
              >
                <option value="">Todas las obras</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {loadingChecklists ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-ecar-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChecklists.map(qc => (
                <div
                  key={qc.id}
                  className="light-card p-5 cursor-pointer hover:shadow-md transition-shadow border border-slate-200/80 group"
                  onClick={() => openEditQc(qc)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-ecar-blue transition-colors">
                      {qc.title}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      qc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      qc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {qc.status === 'approved' ? 'Aprobado' : qc.status === 'rejected' ? 'Rechazado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{qc.project?.name || 'Obra General'}</p>

                  <div className="flex items-center justify-between text-sm text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <ClipboardCheck size={14} className="text-slate-400" />
                      {qc.items?.length || 0} ítems de control
                    </div>
                    <div className="flex items-center gap-1 font-bold text-ecar-blue text-xs">
                      Puntaje: {qc.score}%
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
                    <span>Inspector: <strong className="text-slate-600 font-medium">{qc.inspector_name || 'Sin asignar'}</strong></span>
                    <span>{new Date(qc.created_at).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
              ))}
              {filteredChecklists.length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ClipboardCheck size={40} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">No hay checklists de calidad registrados</p>
                  <p className="text-xs text-slate-400 mt-1">Creá un nuevo checklist para documentar el cierre o liberación de una etapa.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INSPECCIONES DE CAMPO                                              */}
      {/* ========================================================================= */}
      {activeTab === 'inspecciones' && (
        <div className="light-card overflow-hidden border border-slate-200/80 shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-ecar-blue" />
              Registro de Inspecciones Técnicas
            </h3>
            <span className="text-xs text-slate-500 font-medium">{inspecciones.length} registradas</span>
          </div>

          {loadingInsp ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-ecar-blue rounded-full animate-spin mx-auto" />
            </div>
          ) : inspecciones.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardCheck size={48} className="mx-auto mb-3 opacity-30 text-ecar-blue" />
              <p className="font-medium text-slate-700">Sin inspecciones registradas</p>
              <p className="text-xs text-slate-400 mt-1">Registrá la primera inspección técnica de campo para esta obra.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Obra</th>
                    <th>Especialidad / Tipo</th>
                    <th>Inspector</th>
                    <th>Ubicación</th>
                    <th>Resultado</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {inspecciones.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="font-mono text-xs text-slate-600">
                        {new Date(i.fecha + 'T12:00:00').toLocaleDateString('es-AR')}
                      </td>
                      <td className="font-medium text-slate-800">
                        {(i.obra as any)?.name || '–'}
                      </td>
                      <td>
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {TIPO_LABELS[i.tipo] || i.tipo}
                        </span>
                      </td>
                      <td className="text-slate-600 text-xs">{i.inspector}</td>
                      <td className="text-slate-500 text-xs">{i.ubicacion || '–'}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${RESULTADO_COLORS[i.resultado] || 'bg-slate-100 text-slate-600'}`}>
                          {i.resultado.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        {i.resultado === 'pendiente' ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => updateInspeccion.mutate({ id: i.id, resultado: 'aprobada' })}
                              className="text-xs text-emerald-600 font-bold hover:underline"
                            >
                              Aprobar
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => updateInspeccion.mutate({ id: i.id, resultado: 'rechazada' })}
                              className="text-xs text-red-600 font-bold hover:underline"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Completada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PUNCH LIST                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'punch' && (
        <div className="light-card overflow-hidden border border-slate-200/80 shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ListChecks size={16} className="text-ecar-blue" />
              Punch List — No Conformidades de Obra
            </h3>
            <span className="text-xs text-amber-600 font-bold">{punchAbiertos} pendientes</span>
          </div>

          {loadingPunch ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-ecar-blue rounded-full animate-spin mx-auto" />
            </div>
          ) : punchItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ListChecks size={48} className="mx-auto mb-3 opacity-30 text-ecar-blue" />
              <p className="font-medium text-slate-700">Sin ítems de punch list</p>
              <p className="text-xs text-slate-400 mt-1">Registrá ítems cuando surjan observaciones o no conformidades en obra.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {punchItems.map(p => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-xs font-black font-mono text-slate-700 shrink-0">
                    #{p.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{p.titulo}</p>
                    </div>
                    {p.descripcion && <p className="text-xs text-slate-600 mt-0.5">{p.descripcion}</p>}
                    <p className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2">
                      <span>{(p.obra as any)?.name}</span>
                      {p.ubicacion && <span>• Sector: {p.ubicacion}</span>}
                      {p.asignado_a && <span>• Asignado: <strong className="text-slate-600 font-medium">{p.asignado_a}</strong></span>}
                      {p.fecha_limite && <span>• Límite: {p.fecha_limite}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${PRIORIDAD_COLORS[p.prioridad] || 'bg-slate-100 text-slate-700'}`}>
                      {p.prioridad}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${PUNCH_ESTADO_COLORS[p.estado] || 'bg-slate-100 text-slate-700'}`}>
                      {p.estado.replace('_', ' ')}
                    </span>
                    {p.estado === 'abierto' && (
                      <button
                        onClick={() => updatePunchItem.mutate({ id: p.id, estado: 'en_correccion' })}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors ml-1"
                      >
                        Corregir
                      </button>
                    )}
                    {p.estado === 'corregido' && (
                      <button
                        onClick={() => updatePunchItem.mutate({ id: p.id, estado: 'verificado', verificado_en: new Date().toISOString() })}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors ml-1"
                      >
                        Verificar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHECKLISTS                                                         */}
      {/* ========================================================================= */}
      {showQcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowQcModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-ecar-blue" />
                {selectedQC ? 'Editar Checklist de Calidad' : 'Nuevo Checklist de Calidad'}
              </h3>
              <button onClick={() => setShowQcModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Proyecto / Obra *</label>
                  <select
                    value={qcForm.project_id}
                    onChange={e => setQcForm({ ...qcForm, project_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Uso General</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tarea WBS (Opcional)</label>
                  <select
                    value={qcForm.wbs_element_id}
                    onChange={e => setQcForm({ ...qcForm, wbs_element_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Sin Tarea vinculada</option>
                    {wbsElements.filter(w => !qcForm.project_id || w.project_id === qcForm.project_id).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Título de la Inspección / Etapa *</label>
                  <input
                    value={qcForm.title}
                    onChange={e => setQcForm({ ...qcForm, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Ej. Llenado de losa, Hormigonado, Red PEAD..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Inspector</label>
                  <input
                    value={qcForm.inspector_name}
                    onChange={e => setQcForm({ ...qcForm, inspector_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Jefe de Obra o Inspector de Calidad"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Ítems de Control Técnico</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-ecar-blue bg-blue-50 px-2.5 py-1 rounded-lg">
                      Score: {qcScore}%
                    </span>
                    <button
                      onClick={addQcItem}
                      className="text-ecar-blue hover:text-ecar-blueDark text-xs font-bold flex items-center gap-1"
                    >
                      <Plus size={14} /> Agregar Ítem
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {qcForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex-1 space-y-2">
                        <input
                          value={item.description}
                          onChange={e => updateQcItem(idx, 'description', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                          placeholder="Parámetro a verificar..."
                        />
                        <input
                          value={item.notes || ''}
                          onChange={e => updateQcItem(idx, 'notes', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                          placeholder="Observaciones de campo..."
                        />
                      </div>
                      <select
                        value={item.status}
                        onChange={e => updateQcItem(idx, 'status', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-bold w-24 ${
                          item.status === 'pass' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          item.status === 'fail' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="pass">Aprobó</option>
                        <option value="fail">Falló</option>
                        <option value="na">N/A</option>
                      </select>
                      <button onClick={() => removeQcItem(idx)} className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {qcForm.items.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                      No hay ítems agregados. Hacé clic en "Agregar Ítem" para añadir puntos de control.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Estado Final de Inspección</label>
                  <select
                    value={qcForm.status}
                    onChange={e => setQcForm({ ...qcForm, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white"
                  >
                    <option value="draft">Borrador / En Proceso</option>
                    <option value="approved">Aprobado / Certificable</option>
                    <option value="rejected">Rechazado / Rehacer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Notas Generales</label>
                  <textarea
                    value={qcForm.notes}
                    onChange={e => setQcForm({ ...qcForm, notes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Conclusiones o comentarios del inspector..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/80">
              <button onClick={() => setShowQcModal(false)} className="px-4 py-2 font-bold text-xs text-slate-600 hover:text-slate-800">
                Cancelar
              </button>
              <button
                onClick={handleSaveQC}
                disabled={!qcForm.title || createQC.isPending || updateQC.isPending}
                className="btn-primary"
              >
                <Save size={16} /> Guardar Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVA INSPECCIÓN DE CAMPO                                          */}
      {/* ========================================================================= */}
      {showInspModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowInspModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-ecar-blue" />
                Nueva Inspección Técnica de Campo
              </h3>
              <button onClick={() => setShowInspModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Obra / Proyecto *</label>
                  <select
                    value={formInsp.obra_id}
                    onChange={e => setFormInsp({ ...formInsp, obra_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Seleccionar obra</option>
                    {projects.filter(p => p.status === 'active').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Especialidad / Tipo</label>
                  <select
                    value={formInsp.tipo}
                    onChange={e => setFormInsp({ ...formInsp, tipo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Inspector a cargo *</label>
                  <input
                    value={formInsp.inspector}
                    onChange={e => setFormInsp({ ...formInsp, inspector: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Nombre del inspector"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ubicación en Obra</label>
                  <input
                    value={formInsp.ubicacion}
                    onChange={e => setFormInsp({ ...formInsp, ubicacion: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Piso, sector, tramo, progresiva..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones</label>
                <textarea
                  value={formInsp.observaciones}
                  onChange={e => setFormInsp({ ...formInsp, observaciones: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Detalle o notas de la inspección..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/80">
              <button onClick={() => setShowInspModal(false)} className="px-4 py-2 font-bold text-xs text-slate-600 hover:text-slate-800">
                Cancelar
              </button>
              <button
                onClick={handleSubmitInsp}
                disabled={!formInsp.obra_id || !formInsp.inspector || createInspeccion.isPending}
                className="btn-primary"
              >
                {createInspeccion.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Crear Inspección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO ÍTEM PUNCH LIST                                              */}
      {/* ========================================================================= */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowPunchModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ListChecks size={20} className="text-ecar-blue" />
                Nuevo Ítem Punch List (No Conformidad)
              </h3>
              <button onClick={() => setShowPunchModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Obra / Proyecto *</label>
                  <select
                    value={formPunch.obra_id}
                    onChange={e => setFormPunch({ ...formPunch, obra_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Seleccionar obra</option>
                    {projects.filter(p => p.status === 'active').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Prioridad</label>
                  <select
                    value={formPunch.prioridad}
                    onChange={e => setFormPunch({ ...formPunch, prioridad: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título del Defecto o Falla *</label>
                <input
                  value={formPunch.titulo}
                  onChange={e => setFormPunch({ ...formPunch, titulo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Ej: Fisura en revoque sector B, junta sin sellar..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ubicación</label>
                  <input
                    value={formPunch.ubicacion}
                    onChange={e => setFormPunch({ ...formPunch, ubicacion: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Piso, sector..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Asignado a</label>
                  <input
                    value={formPunch.asignado_a}
                    onChange={e => setFormPunch({ ...formPunch, asignado_a: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Contratista o responsable"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={formPunch.fecha_limite}
                    onChange={e => setFormPunch({ ...formPunch, fecha_limite: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descripción detallada</label>
                <textarea
                  value={formPunch.descripcion}
                  onChange={e => setFormPunch({ ...formPunch, descripcion: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Acción correctiva requerida o evidencia de no conformidad..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/80">
              <button onClick={() => setShowPunchModal(false)} className="px-4 py-2 font-bold text-xs text-slate-600 hover:text-slate-800">
                Cancelar
              </button>
              <button
                onClick={handleSubmitPunch}
                disabled={!formPunch.obra_id || !formPunch.titulo || createPunchItem.isPending}
                className="btn-primary"
              >
                {createPunchItem.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Agregar a Punch List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
