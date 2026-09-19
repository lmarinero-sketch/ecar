import React, { useState } from 'react';
import {
  FolderOpen, MessageSquareText, FileText, Users, Plus,
  CheckCircle2, Eye, Sparkles, Building2
} from 'lucide-react';
import { RFIModule } from '../RFIModule';
import { InformesObraGenerator } from './InformesObraGenerator';
import { useProjects } from '../../hooks/useData';
import {
  useTechnicalBlueprints, useCreateTechnicalBlueprint,
  useMeetingCommitments, useCreateMeetingCommitment,
  useWorkReports
} from '../../hooks/useObraData';
import type { TechnicalBlueprint, MeetingCommitment } from '../../lib/types';

export const DocumentacionComunicacionModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planos' | 'rfi' | 'informes' | 'minutas'>('planos');
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return localStorage.getItem('ecar_active_project_id') || (projects[0]?.id || '');
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Queries
  const { data: blueprints = [], isLoading: loadingBlueprints } = useTechnicalBlueprints(selectedProjectId || undefined);
  const { data: meetings = [], isLoading: loadingMeetings } = useMeetingCommitments(selectedProjectId || undefined);
  const { data: reports = [], isLoading: loadingReports } = useWorkReports(selectedProjectId || undefined);

  // Mutations
  const createBlueprint = useCreateTechnicalBlueprint();
  const createMeeting = useCreateMeetingCommitment();

  // Modals
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showNewBlueprintModal, setShowNewBlueprintModal] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);

  // Blueprint Form
  const [bpForm, setBpForm] = useState({
    codigo_plano: '',
    titulo: '',
    disciplina: 'sanitaria' as TechnicalBlueprint['disciplina'],
    sector: '',
    revision_actual: 'Rev. 0',
    aprobado_por: '',
    archivo_url: '',
  });

  // Meeting Form
  const [meetForm, setMeetForm] = useState({
    titulo_reunion: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_reunion: 'comitente' as MeetingCommitment['tipo_reunion'],
    participantes: '',
    temas_tratados: '',
    compromisos: [{ descripcion: '', responsable: '', fecha_limite: new Date().toISOString().split('T')[0], estado: 'pendiente' as const }],
  });

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpForm.titulo || !bpForm.codigo_plano) return;
    await createBlueprint.mutateAsync({
      project_id: selectedProjectId,
      codigo_plano: bpForm.codigo_plano.trim(),
      titulo: bpForm.titulo.trim(),
      disciplina: bpForm.disciplina,
      sector: bpForm.sector.trim() || null,
      revision_actual: bpForm.revision_actual.trim() || 'Rev. 0',
      es_vigente: true,
      aprobado_por: bpForm.aprobado_por.trim() || null,
      archivo_url: bpForm.archivo_url.trim() || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
      historial_revisiones: [
        { revision: bpForm.revision_actual.trim() || 'Rev. 0', fecha: new Date().toISOString().split('T')[0], autor: 'Of. Técnica', archivo_url: '#' }
      ]
    });
    setShowNewBlueprintModal(false);
    setBpForm({ codigo_plano: '', titulo: '', disciplina: 'sanitaria', sector: '', revision_actual: 'Rev. 0', aprobado_por: '', archivo_url: '' });
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetForm.titulo_reunion) return;
    await createMeeting.mutateAsync({
      project_id: selectedProjectId,
      titulo_reunion: meetForm.titulo_reunion.trim(),
      fecha: meetForm.fecha,
      tipo_reunion: meetForm.tipo_reunion,
      participantes: meetForm.participantes.split(',').map(s => s.trim()).filter(Boolean),
      temas_tratados: meetForm.temas_tratados.trim(),
      compromisos: meetForm.compromisos.filter(c => c.descripcion.trim()).map((c, i) => ({
        id: `comp-${Date.now()}-${i}`,
        descripcion: c.descripcion.trim(),
        responsable: c.responsable.trim() || 'Equipo de Obra',
        fecha_limite: c.fecha_limite,
        estado: c.estado,
      })),
    });
    setShowNewMeetingModal(false);
    setMeetForm({
      titulo_reunion: '',
      fecha: new Date().toISOString().split('T')[0],
      tipo_reunion: 'comitente',
      participantes: '',
      temas_tratados: '',
      compromisos: [{ descripcion: '', responsable: '', fecha_limite: new Date().toISOString().split('T')[0], estado: 'pendiente' }],
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Header ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FolderOpen size={180} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <span>📁</span> Gerencia de Obras · Grupo 6
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Documentación Técnica & Comunicación Formal
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Gestión de planos con control estricto de versión vigente vs histórica, canal formal de Consultas Técnicas (RFI), generación de Informes de Obra para comitentes en PDF y seguimiento de minutas de reunión.
          </p>
        </div>
      </div>

      {/* ─── Navigation Bar ─── */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('planos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'planos'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <FolderOpen size={16} className="text-indigo-400" /> 1. Planos & Versión Vigente
          </button>

          <button
            onClick={() => setActiveTab('rfi')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rfi'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <MessageSquareText size={16} className="text-rose-400" /> 2. Consultas Técnicas (RFI)
          </button>

          <button
            onClick={() => setActiveTab('informes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'informes'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <FileText size={16} className="text-amber-400" /> 3. Informes de Obra (PDF)
          </button>

          <button
            onClick={() => setActiveTab('minutas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'minutas'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <Users size={16} className="text-emerald-400" /> 4. Minutas & Compromisos
          </button>
        </div>

        {/* Project Switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs shadow-sm">
          <Building2 size={14} className="text-amber-500 shrink-0" />
          <span className="text-gray-500 font-medium">Obra:</span>
          <select
            value={selectedProjectId}
            onChange={e => {
              setSelectedProjectId(e.target.value);
              localStorage.setItem('ecar_active_project_id', e.target.value);
            }}
            className="font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── TAB 1: PLANOS & VERSIÓN VIGENTE ─── */}
      {activeTab === 'planos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <FolderOpen size={16} className="text-indigo-600" /> Repositorio de Planos Aprobados para Construcción
              </h3>
              <p className="text-xs text-gray-500">Regla estricta: Siempre se muestra destacada la revisión vigente activa. Las versiones superadas quedan archivadas como historial.</p>
            </div>
            <button
              onClick={() => setShowNewBlueprintModal(true)}
              className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Subir Plano
            </button>
          </div>

          {loadingBlueprints ? (
            <div className="text-center py-12 text-gray-400">Cargando planos...</div>
          ) : blueprints.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <FolderOpen size={48} className="mx-auto text-gray-300" />
              <h4 className="font-bold text-gray-700">Sin planos cargados en esta obra</h4>
              <p className="text-xs text-gray-400">Subí los planos de replanteo, sanitarios, gas o estructuras con su revisión vigente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blueprints.map(bp => (
                <div key={bp.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-indigo-400 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                          {bp.codigo_plano}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Versión Vigente: {bp.revision_actual}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                          {bp.disciplina}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">{bp.titulo}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Sector</span>
                      <span className="font-medium text-gray-800">{bp.sector || 'Frente General'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Aprobado Por</span>
                      <span className="font-medium text-gray-800">{bp.aprobado_por || 'Inspección'}</span>
                    </div>
                  </div>

                  {/* Historical Revisions Collapsible */}
                  {bp.historial_revisiones && bp.historial_revisiones.length > 0 && (
                    <div className="border-t pt-2 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Historial de Revisiones Obsoletas</span>
                      <div className="divide-y divide-gray-100 text-[11px] text-gray-500">
                        {bp.historial_revisiones.map((h, i) => (
                          <div key={i} className="py-1 flex justify-between items-center">
                            <span>{h.revision} · {h.fecha} · {h.notas || 'Revisión superada'}</span>
                            <span className="text-[10px] text-gray-400 font-mono">Archivado</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <a
                      href={bp.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye size={14} /> Abrir Plano Vigente
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: CONSULTAS TÉCNICAS (RFI) ─── */}
      {activeTab === 'rfi' && (
        <div>
          <RFIModule />
        </div>
      )}

      {/* ─── TAB 3: INFORMES DE OBRA (PDF) ─── */}
      {activeTab === 'informes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" /> Historial de Informes de Obra Emitidos
              </h3>
              <p className="text-xs text-gray-500">Salidas ejecutivas automáticas que consolidan avances, fotos de partes diarios e hitos.</p>
            </div>
            <button
              onClick={() => setShowReportGenerator(true)}
              className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4 text-xs flex items-center gap-1.5 shadow-sm border-none"
            >
              <Sparkles size={16} /> Emitir Informe PDF
            </button>
          </div>

          {loadingReports ? (
            <div className="text-center py-12 text-gray-400">Cargando informes...</div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <FileText size={48} className="mx-auto text-gray-300" />
              <h4 className="font-bold text-gray-700">Sin informes generados para esta obra</h4>
              <p className="text-xs text-gray-400">Hacé clic en "Emitir Informe PDF" para crear un reporte semanal o mensual oficial.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => (
                <div key={rep.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-700 bg-slate-100 px-2 py-0.5 rounded">
                        {rep.numero_informe}
                      </span>
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {rep.tipo}
                      </span>
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {rep.alcance === 'cliente' ? 'Cliente' : 'Interno'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900">{rep.titulo}</h4>
                    <p className="text-gray-500 line-clamp-1">{rep.resumen_ejecutivo}</p>
                    <span className="text-[11px] text-gray-400">
                      Período: {rep.periodo_desde} al {rep.periodo_hasta} · Emitido por: {rep.emitido_por}
                    </span>
                  </div>

                  <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Emitido
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: MINUTAS & COMPROMISOS ─── */}
      {activeTab === 'minutas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-emerald-500" /> Minutas de Reunión & Compromisos
              </h3>
              <p className="text-xs text-gray-500">Registro formal de acuerdos de obra, responsables y seguimiento de tareas acordadas.</p>
            </div>
            <button
              onClick={() => setShowNewMeetingModal(true)}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Nueva Minuta
            </button>
          </div>

          {loadingMeetings ? (
            <div className="text-center py-12 text-gray-400">Cargando minutas...</div>
          ) : meetings.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <Users size={48} className="mx-auto text-gray-300" />
              <h4 className="font-bold text-gray-700">Sin minutas de reunión registradas</h4>
              <p className="text-xs text-gray-400">Registrá reuniones de obra y asigná compromisos formales con comitentes y subcontratistas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map(m => (
                <div key={m.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {m.tipo_reunion}
                        </span>
                        <span className="text-gray-400 text-xs">{m.fecha}</span>
                      </div>
                      <h4 className="font-bold text-base text-gray-900">{m.titulo_reunion}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong className="text-gray-700">Participantes:</strong> {m.participantes.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg text-xs text-gray-700">
                    <strong className="block mb-1 text-gray-900">Temas Tratados:</strong>
                    {m.temas_tratados}
                  </div>

                  {/* Compromisos List */}
                  {m.compromisos && m.compromisos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-600 block">Compromisos Asumidos:</span>
                      <div className="space-y-1.5">
                        {m.compromisos.map(c => (
                          <div key={c.id} className="p-2.5 rounded-lg border bg-white flex items-center justify-between text-xs gap-2">
                            <div>
                              <span className="font-bold text-gray-800">{c.descripcion}</span>
                              <span className="text-[11px] text-gray-500 block">
                                Resp: <strong>{c.responsable}</strong> · Límite: {c.fecha_limite}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.estado === 'cumplido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal Subir Plano ─── */}
      {showNewBlueprintModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <FolderOpen size={18} className="text-indigo-600" /> Subir Plano Técnico
              </h3>
              <button onClick={() => setShowNewBlueprintModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateBlueprint} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 uppercase block mb-1">Código de Plano *</label>
                  <input
                    required
                    placeholder="Ej: PL-GAS-012"
                    value={bpForm.codigo_plano}
                    onChange={e => setBpForm({ ...bpForm, codigo_plano: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 uppercase block mb-1">Revisión Inicial *</label>
                  <input
                    required
                    placeholder="Ej: Rev. 0"
                    value={bpForm.revision_actual}
                    onChange={e => setBpForm({ ...bpForm, revision_actual: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Título del Plano *</label>
                <input
                  required
                  placeholder="Ej: Red Distribuidora de Gas - Nodos y Acometidas"
                  value={bpForm.titulo}
                  onChange={e => setBpForm({ ...bpForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 uppercase block mb-1">Disciplina</label>
                  <select
                    value={bpForm.disciplina}
                    onChange={e => setBpForm({ ...bpForm, disciplina: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                  >
                    <option value="sanitaria">Sanitaria / Agua</option>
                    <option value="gas">Gas / Redes</option>
                    <option value="estructura">Estructura / Hormigón</option>
                    <option value="arquitectura">Arquitectura</option>
                    <option value="electrica">Eléctrica</option>
                    <option value="vial">Vial / Pavimentos</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-600 uppercase block mb-1">Sector / Frente</label>
                  <input
                    placeholder="Ej: Tramo Norte"
                    value={bpForm.sector}
                    onChange={e => setBpForm({ ...bpForm, sector: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Aprobado Por</label>
                <input
                  placeholder="Ej: Ing. Inspector Comitente"
                  value={bpForm.aprobado_por}
                  onChange={e => setBpForm({ ...bpForm, aprobado_por: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">URL o Archivo PDF</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={bpForm.archivo_url}
                  onChange={e => setBpForm({ ...bpForm, archivo_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewBlueprintModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 text-xs"
                >
                  Registrar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Nueva Minuta ─── */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" /> Nueva Minuta de Obra
              </h3>
              <button onClick={() => setShowNewMeetingModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Título de la Reunión *</label>
                <input
                  required
                  placeholder="Ej: Coordinación de Empalme con OSSE"
                  value={meetForm.titulo_reunion}
                  onChange={e => setMeetForm({ ...meetForm, titulo_reunion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 uppercase block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={meetForm.fecha}
                    onChange={e => setMeetForm({ ...meetForm, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 uppercase block mb-1">Tipo de Reunión</label>
                  <select
                    value={meetForm.tipo_reunion}
                    onChange={e => setMeetForm({ ...meetForm, tipo_reunion: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                  >
                    <option value="comitente">Con Comitente / Dirección</option>
                    <option value="obra_interna">Interna ECAR</option>
                    <option value="subcontratista">Con Subcontratista</option>
                    <option value="seguridad_calidad">Comité de Seguridad / Calidad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Participantes (separados por coma)</label>
                <input
                  placeholder="Lucas Marinero, Ing. Comitente, Capataz..."
                  value={meetForm.participantes}
                  onChange={e => setMeetForm({ ...meetForm, participantes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Temas Tratados / Resumen</label>
                <textarea
                  rows={3}
                  placeholder="Puntos discutidos y resoluciones acordadas..."
                  value={meetForm.temas_tratados}
                  onChange={e => setMeetForm({ ...meetForm, temas_tratados: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Compromiso Asumido</label>
                <input
                  placeholder="Descripción del compromiso concreto..."
                  value={meetForm.compromisos[0]?.descripcion || ''}
                  onChange={e => setMeetForm({
                    ...meetForm,
                    compromisos: [{ ...meetForm.compromisos[0], descripcion: e.target.value }]
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-xs mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Responsable asignado"
                    value={meetForm.compromisos[0]?.responsable || ''}
                    onChange={e => setMeetForm({
                      ...meetForm,
                      compromisos: [{ ...meetForm.compromisos[0], responsable: e.target.value }]
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                  <input
                    type="date"
                    value={meetForm.compromisos[0]?.fecha_limite || ''}
                    onChange={e => setMeetForm({
                      ...meetForm,
                      compromisos: [{ ...meetForm.compromisos[0], fecha_limite: e.target.value }]
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 text-xs"
                >
                  Guardar Minuta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Informes Obra Generator Modal ─── */}
      {showReportGenerator && selectedProject && (
        <InformesObraGenerator
          project={selectedProject}
          onClose={() => setShowReportGenerator(false)}
        />
      )}
    </div>
  );
};
