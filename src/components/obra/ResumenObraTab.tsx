import React from 'react';
import {
  ListChecks, Flag, ArrowRight, Zap, Building2
} from 'lucide-react';
import type { Project, WbsElement } from '../../lib/types';
import { useProjectMilestones, useProjectPendingTasks } from '../../hooks/useObraData';
import { useObraControlTareas } from '../../hooks/useData';

interface ResumenObraTabProps {
  project: Project;
  wbs: WbsElement[];
  onNavigateTab: (tabId: string) => void;
}

export const ResumenObraTab: React.FC<ResumenObraTabProps> = ({ project, wbs, onNavigateTab }) => {
  const { data: milestones = [] } = useProjectMilestones(project.id);
  const { data: pendingTasks = [] } = useProjectPendingTasks(project.id);
  const { data: tareasObra = [] } = useObraControlTareas(project.id);

  // WBS Progress
  const totalTasks = wbs.length;
  const completedTasks = wbs.filter(t => t.phase === 'completado').length;
  const avgProgress = totalTasks > 0
    ? Math.round(wbs.reduce((acc, t) => acc + (t.progress_pct || 0), 0) / totalTasks)
    : (project.advance_pct || 0);

  // Critical items
  const openPendings = pendingTasks.filter(p => p.estado === 'pendiente' || p.estado === 'en_proceso');
  const urgentPendings = openPendings.filter(p => p.prioridad === 'urgente' || p.prioridad === 'alta');
  const nextMilestones = milestones.filter(m => m.estado !== 'cumplido').slice(0, 3);
  const atRiskMilestone = milestones.find(m => m.estado === 'en_riesgo' || m.estado === 'vencido');

  const formatARS = (n: number) => {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    return `$${n.toLocaleString('es-AR')}`;
  };

  return (
    <div className="space-y-6">
      {/* ─── 20-Second Diagnostic Hero Banner ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
              <span>⚡</span> Diagnóstico de Obra en 20 Segundos
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold">{project.name}</h2>
            <p className="text-xs text-gray-300">
              Comitente: <strong className="text-white">{project.client_name || 'Sin especificar'}</strong> · Ubicación: {project.location || 'Sede central'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-gray-300 block font-bold uppercase tracking-wider">Avance Global</span>
              <span className="text-2xl font-extrabold text-amber-400">{avgProgress}%</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-amber-400 flex items-center justify-center font-bold text-xs text-amber-300">
              {completedTasks}/{totalTasks}
            </div>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, avgProgress))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Fast Status Highlights ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('pendientes')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-amber-500 shadow-sm cursor-pointer transition-all space-y-1"
        >
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>Pendientes Abiertos</span>
            <ListChecks size={16} className="text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900">{openPendings.length}</span>
          <span className="text-[11px] text-red-600 block font-medium">{urgentPendings.length} de alta prioridad</span>
        </div>

        <div
          onClick={() => onNavigateTab('hitos')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-amber-500 shadow-sm cursor-pointer transition-all space-y-1"
        >
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>Situación de Plazos</span>
            <Flag size={16} className={atRiskMilestone ? 'text-red-500' : 'text-emerald-500'} />
          </div>
          <span className={`text-2xl font-extrabold ${atRiskMilestone ? 'text-red-600' : 'text-emerald-600'}`}>
            {atRiskMilestone ? 'En Riesgo' : 'Al Día'}
          </span>
          <span className="text-[11px] text-gray-500 block">
            {nextMilestones.length} próximos hitos
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('rendimientos')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-amber-500 shadow-sm cursor-pointer transition-all space-y-1"
        >
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>Producción de Campo</span>
            <Zap size={16} className="text-blue-500" />
          </div>
          <span className="text-2xl font-extrabold text-blue-700">{tareasObra.length}</span>
          <span className="text-[11px] text-gray-500 block">tramos / tareas activas</span>
        </div>

        <div
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1"
        >
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>Contrato / Inversión</span>
            <Building2 size={16} className="text-slate-500" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900">{formatARS(project.contract_amount || project.budget_ars)}</span>
          <span className="text-[11px] text-gray-500 block">monto total previsto</span>
        </div>
      </div>

      {/* ─── Two-Column Operations Overview ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Milestones and Deadlines */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <Flag size={16} className="text-amber-500" /> Próximos Hitos Contractuales & Plazos
            </h3>
            <button
              onClick={() => onNavigateTab('hitos')}
              className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>

          {nextMilestones.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No hay hitos pendientes próximos.</p>
          ) : (
            <div className="space-y-3">
              {nextMilestones.map(m => (
                <div key={m.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-1">{m.nombre}</h4>
                    <span className="text-[11px] text-gray-500">
                      Fecha: <strong className="text-gray-700">{m.fecha_pronosticada || m.fecha_objetivo_original}</strong> · Resp: {m.responsable || 'Equipo de Obra'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    m.estado === 'en_riesgo' || m.estado === 'vencido' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {m.estado === 'en_riesgo' ? 'En Riesgo' : m.estado === 'vencido' ? 'Vencido' : 'Al Día'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Pending Items */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <ListChecks size={16} className="text-amber-500" /> Pendientes Críticos de Recorrida
            </h3>
            <button
              onClick={() => onNavigateTab('pendientes')}
              className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>

          {urgentPendings.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Sin pendientes urgentes en frentes de obra.</p>
          ) : (
            <div className="space-y-3">
              {urgentPendings.slice(0, 3).map(p => (
                <div key={p.id} className="p-3 rounded-lg border border-red-100 bg-red-50/40 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-gray-900 line-clamp-1">{p.descripcion}</h4>
                    <span className="text-[11px] text-gray-500">
                      Sector: <strong className="text-gray-700">{p.sector}</strong> · Fecha obj: {p.fecha_objetivo}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-500 text-white shrink-0">
                    {p.prioridad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Quick Access Navigation Bar ─── */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Accesos Directos a Subfunciones</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs font-bold">
          <button onClick={() => onNavigateTab('planificacion')} className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-600 text-gray-700 text-center transition-all">
            📋 Planificación WBS
          </button>
          <button onClick={() => onNavigateTab('programacion')} className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-600 text-gray-700 text-center transition-all">
            📅 Programación
          </button>
          <button onClick={() => onNavigateTab('parte_diario')} className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-600 text-gray-700 text-center transition-all">
            📱 Parte Diario
          </button>
          <button onClick={() => onNavigateTab('rendimientos')} className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-600 text-gray-700 text-center transition-all">
            ⚡ Rendimientos Roque
          </button>
          <button onClick={() => onNavigateTab('pendientes')} className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-600 text-gray-700 text-center transition-all">
            ✅ Pendientes
          </button>
          <button onClick={() => onNavigateTab('avance3d')} className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-600 text-gray-700 text-center transition-all">
            ✨ Avance 3D
          </button>
        </div>
      </div>
    </div>
  );
};
