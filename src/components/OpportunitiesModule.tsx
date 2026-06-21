import React, { useState, useMemo } from 'react';
import {
  Target, Search, Plus, ChevronRight, Star, AlertTriangle,
  Clock, DollarSign, MapPin, FileText, X, Save, CheckCircle2,
  BarChart3, Eye, Download, Upload, Trash2, Paperclip, Image as ImageIcon, File
} from 'lucide-react';
import { useOpportunities, useCreateOpportunity, useUpdateOpportunity, useProjects, useUploadOpportunityFile, useDeleteOpportunityFile, useOpportunityBudgets } from '../hooks/useData';
import type { Opportunity, OpportunityStage, OpportunityFile } from '../lib/types';
import { exportOpportunityPdf } from '../lib/pdfExport';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const STAGES: { id: OpportunityStage; label: string; color: string; bgColor: string }[] = [
  { id: 'oportunidad', label: 'Oportunidad', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { id: 'relevamiento', label: 'Relevamiento', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  { id: 'en_presupuesto', label: 'En Presupuesto', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  { id: 'propuesta_enviada', label: 'Propuesta Enviada', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  { id: 'negociacion', label: 'Negociación', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  { id: 'adjudicada', label: 'Adjudicada', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  { id: 'rechazada', label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
];

const WORK_TYPES: Record<string, string> = {
  obra_nueva: 'Obra Nueva',
  adicional: 'Adicional',
  servicio: 'Servicio',
  mantenimiento: 'Mantenimiento',
  licitacion: 'Licitación',
  cambio_alcance: 'Cambio de Alcance',
  consulta: 'Consulta',
};

const PRIORITIES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  baja: { label: 'Baja', color: 'bg-gray-100 text-gray-600', icon: null },
  media: { label: 'Media', color: 'bg-blue-100 text-blue-700', icon: null },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700', icon: <Star size={12} /> },
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={12} /> },
};

const RISK_COLORS: Record<string, string> = {
  bajo: 'bg-green-100 text-green-700',
  medio: 'bg-yellow-100 text-yellow-700',
  alto: 'bg-red-100 text-red-700',
};

const emptyChecklist = {
  planos: false, pliego: false, memoria_tecnica: false,
  visita_obra: false, fotos: false, mediciones: false, condiciones_pago: false,
};

const DateInput: React.FC<{ value: string; onChange: (v: string) => void; className?: string }> = ({ value, onChange, className }) => {
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = isFocused ? value : (value ? value.split('-').reverse().join('/') : '');

  return (
    <input
      type={isFocused ? 'date' : 'text'}
      value={displayValue}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholder="dd/mm/yyyy"
      className={className}
    />
  );
};

export const OpportunitiesModule: React.FC = () => {
  const { data: opportunities, isLoading } = useOpportunities();
  const { data: projects } = useProjects();
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();
  const uploadFile = useUploadOpportunityFile();
  const deleteFile = useDeleteOpportunityFile();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const { data: oppBudgets, isLoading: loadingBudgets } = useOpportunityBudgets(selectedOpp?.id);

  const [activeTab, setActiveTab] = useState<'general' | 'archivos' | 'presupuestos'>('general');
  const [fileForm, setFileForm] = useState({
    title: '',
    category: 'adicional',
    observations: '',
    file: null as File | null
  });

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [filterStage, setFilterStage] = useState<OpportunityStage | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_name: '',
    client_contact: '',
    description: '',
    work_type: 'obra_nueva' as Opportunity['work_type'],
    estimated_amount: '' as number | string,
    stage: 'oportunidad' as OpportunityStage,
    priority: 'media' as Opportunity['priority'],
    risk_level: 'bajo' as Opportunity['risk_level'],
    location: '',
    estimated_deadline: '',
    assumptions: '',
    exclusions: '',
    project_id: '',
    documentation_checklist: { ...emptyChecklist },
  });

  const filtered = useMemo(() => {
    if (!opportunities) return [];
    let result = opportunities;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(o =>
        o.client_name.toLowerCase().includes(s) ||
        o.description.toLowerCase().includes(s) ||
        (o.location || '').toLowerCase().includes(s)
      );
    }
    if (filterStage !== 'all') {
      result = result.filter(o => o.stage === filterStage);
    }
    return result;
  }, [opportunities, search, filterStage]);

  const pipelineData = useMemo(() => {
    const activeStages = STAGES.filter(s => s.id !== 'rechazada');
    return activeStages.map(stage => ({
      ...stage,
      items: filtered.filter(o => o.stage === stage.id),
      total: filtered.filter(o => o.stage === stage.id).reduce((sum, o) => sum + o.estimated_amount, 0),
    }));
  }, [filtered]);

  const stats = useMemo(() => {
    if (!opportunities) return { total: 0, activas: 0, montoTotal: 0, adjudicadas: 0, tasa: 0 };
    const activas = opportunities.filter(o => !['adjudicada', 'rechazada'].includes(o.stage));
    const adjudicadas = opportunities.filter(o => o.stage === 'adjudicada');
    const cerradas = opportunities.filter(o => ['adjudicada', 'rechazada'].includes(o.stage));
    return {
      total: opportunities.length,
      activas: activas.length,
      montoTotal: activas.reduce((s, o) => s + o.estimated_amount, 0),
      adjudicadas: adjudicadas.length,
      tasa: cerradas.length > 0 ? Math.round((adjudicadas.length / cerradas.length) * 100) : 0,
    };
  }, [opportunities]);

  const handleSubmit = async () => {
    try {
      if (selectedOpp) {
        await updateOpp.mutateAsync({ id: selectedOpp.id, ...form, estimated_amount: Number(form.estimated_amount) || 0, project_id: form.project_id || null });
      } else {
        await createOpp.mutateAsync({ ...form, estimated_amount: Number(form.estimated_amount) || 0, project_id: form.project_id || null });
      }
      setShowForm(false);
      setSelectedOpp(null);
      resetForm();
      setActiveTab('general');
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      client_name: '', client_contact: '', description: '', work_type: 'obra_nueva',
      estimated_amount: '', stage: 'oportunidad', priority: 'media', risk_level: 'bajo',
      location: '', estimated_deadline: '', assumptions: '', exclusions: '', project_id: '',
      documentation_checklist: { ...emptyChecklist },
    });
  };

  const openEdit = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setActiveTab('general');
    setForm({
      client_name: opp.client_name,
      client_contact: opp.client_contact || '',
      description: opp.description,
      work_type: opp.work_type,
      estimated_amount: opp.estimated_amount,
      stage: opp.stage,
      priority: opp.priority,
      risk_level: opp.risk_level,
      location: opp.location || '',
      estimated_deadline: opp.estimated_deadline || '',
      assumptions: opp.assumptions || '',
      exclusions: opp.exclusions || '',
      project_id: opp.project_id || '',
      documentation_checklist: opp.documentation_checklist || { ...emptyChecklist },
    });
    setShowForm(true);
  };

  const moveStage = async (opp: Opportunity, newStage: OpportunityStage) => {
    await updateOpp.mutateAsync({ id: opp.id, stage: newStage });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-cyan-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-800 via-blue-700 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Target size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Target size={24} /> Pipeline de Oportunidades</h3>
          <p className="text-cyan-100 text-sm mt-1">Gerencia de Proyectos y Presupuestos — Doc PR-GPP-01</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: <FileText size={16} />, color: 'text-gray-700' },
          { label: 'Activas', value: stats.activas, icon: <Clock size={16} />, color: 'text-blue-600' },
          { label: 'Monto Pipeline', value: fmt(stats.montoTotal), icon: <DollarSign size={16} />, color: 'text-emerald-600' },
          { label: 'Adjudicadas', value: stats.adjudicadas, icon: <CheckCircle2 size={16} />, color: 'text-green-600' },
          { label: 'Tasa Conversión', value: `${stats.tasa}%`, icon: <BarChart3 size={16} />, color: 'text-indigo-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${kpi.color} mb-1`}>{kpi.icon} {kpi.label}</div>
            <div className="text-xl font-bold text-gray-800">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, descripción o ubicación..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all" />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('pipeline')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Pipeline</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Lista</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStage} onChange={e => setFilterStage(e.target.value as OpportunityStage | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
            <option value="all">Todas las etapas</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={() => { resetForm(); setSelectedOpp(null); setActiveTab('general'); setShowForm(true); }}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-cyan-700 hover:shadow-lg transition-all">
            <Plus size={16} /> Nueva Oportunidad
          </button>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' ? (
        <div className="overflow-x-auto overflow-y-hidden pb-4 flex-1 min-h-0">
          <div className="flex gap-3 min-w-max h-full">
            {pipelineData.map(stage => (
              <div key={stage.id} 
                className={`w-72 rounded-xl border shadow-sm ${stage.bgColor} flex flex-col h-full transition-all ${dragOverStage === stage.id ? 'ring-2 ring-cyan-500 bg-opacity-80 scale-[1.01]' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={async e => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const oppId = e.dataTransfer.getData('text/plain');
                  const opp = opportunities?.find(o => o.id === oppId);
                  if (opp && opp.stage !== stage.id) {
                    await moveStage(opp, stage.id);
                  }
                }}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm ${stage.color}`}>{stage.label}</span>
                    <span className="bg-white/70 px-2 py-0.5 rounded-full text-xs font-bold text-gray-600">{stage.items.length}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{fmt(stage.total)}</div>
                </div>
                {/* Cards */}
                <div className="p-2 space-y-2 flex-1 min-h-[120px] overflow-y-auto ecar-scrollbar">
                  {stage.items.map(opp => (
                    <div key={opp.id} onClick={() => openEdit(opp)}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('text/plain', opp.id);
                        setDraggedOppId(opp.id);
                      }}
                      onDragEnd={() => {
                        setDraggedOppId(null);
                        setDragOverStage(null);
                      }}
                      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group ${draggedOppId === opp.id ? 'opacity-50 scale-95 ring-2 ring-cyan-500' : ''}`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-sm text-gray-800 leading-tight">{opp.client_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${PRIORITIES[opp.priority].color}`}>
                          {PRIORITIES[opp.priority].label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{opp.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-gray-700">{fmt(opp.estimated_amount)}</span>
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${RISK_COLORS[opp.risk_level]}`}>
                            R: {opp.risk_level.charAt(0).toUpperCase()}
                          </span>
                          {opp.location && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={10} />{opp.location.slice(0, 12)}</span>
                          )}
                        </div>
                      </div>
                      {/* Quick stage move */}
                      <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap items-center">
                        {STAGES.filter(s => s.id !== opp.stage && s.id !== 'rechazada').slice(0, 3).map(s => (
                          <button key={s.id} onClick={e => { e.stopPropagation(); moveStage(opp, s.id); }}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.bgColor} ${s.color} hover:opacity-80 transition-all`}>
                            → {s.label.slice(0, 8)}
                          </button>
                        ))}
                        <button onClick={e => { e.stopPropagation(); exportOpportunityPdf(opp, projects?.find(p => p.id === opp.project_id)?.name); }}
                          title="Descargar PDF"
                          className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all ml-auto flex items-center gap-1">
                          <Download size={10} /> PDF
                        </button>
                      </div>
                    </div>
                  ))}
                  {stage.items.length === 0 && (
                    <div className="text-center py-8 text-gray-300">
                      <Target size={24} className="mx-auto mb-1 opacity-30" />
                      <p className="text-xs">Sin oportunidades</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Cliente / Descripción</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-center">Etapa</th>
                <th className="px-4 py-3 text-center">Prioridad</th>
                <th className="px-4 py-3 text-center">Riesgo</th>
                <th className="px-4 py-3 text-right">Monto Est.</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(opp => {
                const stageInfo = STAGES.find(s => s.id === opp.stage)!;
                return (
                  <tr key={opp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{opp.client_name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{opp.description}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{WORK_TYPES[opp.work_type]}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stageInfo.bgColor} ${stageInfo.color}`}>{stageInfo.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PRIORITIES[opp.priority].color}`}>
                        {PRIORITIES[opp.priority].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${RISK_COLORS[opp.risk_level]}`}>{opp.risk_level}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{fmt(opp.estimated_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={e => { e.stopPropagation(); exportOpportunityPdf(opp, projects?.find(p => p.id === opp.project_id)?.name); }} className="text-gray-400 hover:text-cyan-600 p-1" title="Descargar PDF"><Download size={16} /></button>
                        <button onClick={() => openEdit(opp)} className="text-cyan-600 hover:text-cyan-800 p-1" title="Ver / Editar"><Eye size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <Target size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay oportunidades</p>
                  <p className="text-sm">Hacé clic en "Nueva Oportunidad" para registrar una.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REJECTED (collapsed) */}
      {filtered.some(o => o.stage === 'rechazada') && (
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <summary className="p-4 cursor-pointer font-bold text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <ChevronRight size={16} className="details-open:rotate-90 transition-transform" />
            Rechazadas ({filtered.filter(o => o.stage === 'rechazada').length})
          </summary>
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            {filtered.filter(o => o.stage === 'rechazada').map(opp => (
              <div key={opp.id} onClick={() => openEdit(opp)} className="bg-red-50 rounded-lg p-3 border border-red-100 cursor-pointer hover:shadow transition-all">
                <div className="font-bold text-sm text-gray-700">{opp.client_name}</div>
                <div className="text-xs text-gray-500">{opp.description}</div>
                <div className="text-xs text-red-600 mt-1">{opp.rejection_reason || 'Sin motivo'}</div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={() => setShowForm(false)}>
          <div className="flex min-h-full items-start justify-center py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Target size={20} className="text-cyan-600" />
                  {selectedOpp ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
                </h3>
                {selectedOpp && (
                  <div className="flex gap-4 mt-2">
                    <button onClick={() => setActiveTab('general')}
                      className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeTab === 'general' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      General
                    </button>
                    <button onClick={() => setActiveTab('archivos')}
                      className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeTab === 'archivos' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      Archivos Adjuntos ({selectedOpp.files?.length || 0})
                    </button>
                    <button onClick={() => setActiveTab('presupuestos')}
                      className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeTab === 'presupuestos' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      Presupuestos ({oppBudgets?.length || 0})
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 self-start"><X size={20} /></button>
            </div>
            
            {/* General Tab */}
            <div className={`p-5 space-y-4 ${activeTab === 'general' ? 'block' : 'hidden'}`}>
              {/* Row 1: Cliente + Contacto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Cliente / Comitente *</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Razón social o nombre completo)</span>
                  </label>
                  <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Contacto</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Teléfono, email, cargo o área)</span>
                  </label>
                  <input value={form.client_contact} onChange={e => setForm({ ...form, client_contact: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" placeholder="Teléfono, email" />
                </div>
              </div>

              {/* Row 2: Descripción */}
              <div>
                <label className="block mb-1">
                  <span className="block text-xs font-bold text-gray-600">Descripción de la Oportunidad *</span>
                  <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Describir qué se necesita construir, proveer o mantener)</span>
                </label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" placeholder="Obra, servicio o necesidad..." />
              </div>

              {/* Row 3: Tipo + Monto + Plazo */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Tipo de Trabajo</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Obra, Adicional, Licitación, etc.)</span>
                  </label>
                  <select value={form.work_type} onChange={e => setForm({ ...form, work_type: e.target.value as Opportunity['work_type'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
                    {Object.entries(WORK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Monto Estimado ($)</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Valor aproximado sin IVA)</span>
                  </label>
                  <input type="text"
                    value={form.estimated_amount === '' ? '' : Number(form.estimated_amount).toLocaleString('es-AR')}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm({ ...form, estimated_amount: val === '' ? '' : Number(val) });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Plazo Estimado</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Fecha prevista de inicio/adjudicación)</span>
                  </label>
                  <DateInput value={form.estimated_deadline} onChange={v => setForm({ ...form, estimated_deadline: v })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
                </div>
              </div>

              {/* Row 4: Etapa + Prioridad + Riesgo + Ubicación */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Etapa</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Fase comercial actual)</span>
                  </label>
                  <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as OpportunityStage })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Prioridad</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Importancia estratégica)</span>
                  </label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Opportunity['priority'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
                    <option value="baja">Baja</option><option value="media">Media</option>
                    <option value="alta">Alta</option><option value="critica">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Riesgo</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Nivel de riesgo operativo/financiero)</span>
                  </label>
                  <select value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value as Opportunity['risk_level'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
                    <option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Ubicación</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Provincia, ciudad o zona)</span>
                  </label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" placeholder="Ciudad / zona" />
                </div>
              </div>

              {/* Row 5: Proyecto vinculado */}
              <div>
                <label className="block mb-1">
                  <span className="block text-xs font-bold text-gray-600">Proyecto Vinculado (opcional)</span>
                  <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Si corresponde a una obra en ejecución)</span>
                </label>
                <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
                  <option value="">Sin proyecto</option>
                  {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Documentation Checklist */}
              <div>
                <label className="block mb-2">
                  <span className="block text-xs font-bold text-gray-600">Checklist de Documentación Recibida</span>
                  <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Documentación entregada por el cliente)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'planos', label: 'Planos' },
                    { key: 'pliego', label: 'Pliego' },
                    { key: 'memoria_tecnica', label: 'Memoria Técnica' },
                    { key: 'visita_obra', label: 'Visita de Obra' },
                    { key: 'fotos', label: 'Fotos' },
                    { key: 'mediciones', label: 'Mediciones' },
                    { key: 'condiciones_pago', label: 'Cond. de Pago' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition-all">
                      <input type="checkbox"
                        checked={(form.documentation_checklist as Record<string, boolean>)[item.key]}
                        onChange={e => setForm({
                          ...form,
                          documentation_checklist: { ...form.documentation_checklist, [item.key]: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Supuestos y Exclusiones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Supuestos</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Condiciones asumidas para cotizar o ejecutar)</span>
                  </label>
                  <textarea value={form.assumptions} onChange={e => setForm({ ...form, assumptions: e.target.value })} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" placeholder="Condiciones asumidas..." />
                </div>
                <div>
                  <label className="block mb-1">
                    <span className="block text-xs font-bold text-gray-600">Exclusiones</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Elementos o tareas que NO se incluyen en la oferta)</span>
                  </label>
                  <textarea value={form.exclusions} onChange={e => setForm({ ...form, exclusions: e.target.value })} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" placeholder="Elementos no incluidos..." />
                </div>
              </div>
            </div>

            {/* Archivos Tab */}
            <div className={`p-5 space-y-6 ${activeTab === 'archivos' ? 'block' : 'hidden'}`}>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Upload size={16} /> Subir Nuevo Archivo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="col-span-2">
                    <input type="text" placeholder="Título del archivo" value={fileForm.title} onChange={e => setFileForm({...fileForm, title: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/30" />
                  </div>
                  <div>
                    <select value={fileForm.category} onChange={e => setFileForm({...fileForm, category: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/30">
                      <option value="adicional">Adicional</option>
                      <option value="planos">Planos</option>
                      <option value="pliego">Pliego</option>
                      <option value="memoria_tecnica">Memoria Técnica</option>
                      <option value="ifc">Modelo 3D (IFC/RVT)</option>
                      <option value="presupuesto">Presupuesto</option>
                    </select>
                  </div>
                  <div>
                    <input type="file" onChange={e => setFileForm({...fileForm, file: e.target.files?.[0] || null})} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <input type="text" placeholder="Observaciones (opcional)" value={fileForm.observations} onChange={e => setFileForm({...fileForm, observations: e.target.value})} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/30" />
                  <button disabled={!fileForm.file || !fileForm.title || uploadFile.isPending}
                    onClick={async () => {
                      if (selectedOpp && fileForm.file) {
                        await uploadFile.mutateAsync({
                          opportunityId: selectedOpp.id,
                          file: fileForm.file,
                          title: fileForm.title,
                          category: fileForm.category,
                          observations: fileForm.observations,
                          uploadedBy: 'Colaborador'
                        });
                        setFileForm({ title: '', category: 'adicional', observations: '', file: null });
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }
                    }}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2">
                    {uploadFile.isPending ? 'Subiendo...' : <><Upload size={16} /> Subir</>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedOpp?.files?.map(f => (
                  <div key={f.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex gap-3 items-start group hover:border-cyan-200 transition-colors">
                    <div className="bg-cyan-50 p-2 rounded-lg text-cyan-600 shrink-0">
                      {f.file_type?.match(/pdf/i) ? <FileText size={24} /> :
                       f.file_type?.match(/png|jpg|jpeg/i) ? <ImageIcon size={24} /> :
                       <File size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h5 className="font-bold text-sm text-gray-800 truncate pr-2" title={f.title}>{f.title}</h5>
                        <span className="text-[9px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase shrink-0">{f.category}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5" title={f.observations || ''}>{f.observations || 'Sin observaciones'}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-mono">
                          {(f.file_size || 0) > 1024 * 1024 ? `${(f.file_size! / (1024*1024)).toFixed(1)} MB` : `${Math.round(f.file_size! / 1024)} KB`} • {f.file_type?.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={f.file_url} target="_blank" rel="noreferrer" className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded transition-colors" title="Ver / Descargar">
                            <Download size={14} />
                          </a>
                          <button onClick={() => { if(confirm('¿Seguro que querés borrar este archivo?')) deleteFile.mutate(f.id) }} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!selectedOpp?.files?.length && (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Paperclip size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No hay archivos adjuntos</p>
                    <p className="text-sm text-gray-400">Subí planos, pliegos o referencias para esta oportunidad.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Presupuestos Tab */}
            <div className={`p-5 space-y-4 ${activeTab === 'presupuestos' ? 'block' : 'hidden'}`}>
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex items-start gap-3">
                <Target size={20} className="text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-cyan-800 text-sm">Presupuestos Analíticos</h4>
                  <p className="text-cyan-700 text-xs mt-1">
                    Esta oportunidad está integrada con el módulo principal de Presupuestos. 
                    Cualquier presupuesto detallado asociado a esta oportunidad aparecerá aquí.
                  </p>
                </div>
              </div>

              {loadingBudgets ? (
                <div className="text-center py-6 text-gray-400">Cargando presupuestos...</div>
              ) : oppBudgets && oppBudgets.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Presupuesto</th>
                        <th className="px-3 py-3 text-center">Versión</th>
                        <th className="px-3 py-3 text-center">Estado</th>
                        <th className="px-3 py-3 text-right">Total Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {oppBudgets.map(budget => (
                        <tr key={budget.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{budget.name}</td>
                          <td className="px-3 py-3 text-center font-mono text-xs font-bold text-gray-600">v{budget.version}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-gray-100 text-gray-600">
                              {budget.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-gray-800">
                            {Number(budget.total_final_ars).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No hay presupuestos asociados</p>
                  <p className="text-sm text-gray-400 mt-1">Para cotizar esta oportunidad, andá al módulo de Presupuestos y creá uno nuevo asociándolo a este cliente.</p>
                </div>
              )}
            </div>

            {/* Form Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between rounded-b-2xl">
              <div>
                {selectedOpp && (
                  <button onClick={() => exportOpportunityPdf(selectedOpp, projects?.find(p => p.id === selectedOpp.project_id)?.name)} 
                    className="text-cyan-600 hover:text-cyan-800 font-bold text-sm flex items-center gap-2">
                    <Download size={16} /> Descargar PDF
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm">Cancelar</button>
                <button onClick={handleSubmit} disabled={!form.client_name || !form.description || createOpp.isPending || updateOpp.isPending}
                  className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-cyan-700 disabled:opacity-50 transition-all">
                  <Save size={16} /> {selectedOpp ? 'Guardar Cambios' : 'Crear Oportunidad'}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
