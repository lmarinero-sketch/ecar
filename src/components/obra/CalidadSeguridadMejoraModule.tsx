import React, { useState } from 'react';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckSquare,
  BookOpen, RefreshCw, Building2
} from 'lucide-react';
import { QualityModule } from '../QualityModule';
import { SafetyModule } from '../SafetyModule';
import { NonConformitiesModule } from '../NonConformitiesModule';
import { useProjectFeedback, useProjects } from '../../hooks/useData';

export const CalidadSeguridadMejoraModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calidad' | 'seguridad' | 'no_conformidades' | 'desvios_lecciones'>('calidad');
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return localStorage.getItem('ecar_active_project_id') || (projects[0]?.id || '');
  });

  const { data: feedbacks = [] } = useProjectFeedback(selectedProjectId || undefined);
  const desvios = feedbacks.filter(f => f.tipo === 'desviacion' || f.tipo === 'riesgo');
  const lecciones = feedbacks.filter(f => f.tipo === 'leccion' || f.tipo === 'mejora');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Header ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck size={180} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <span>🛡️</span> Gerencia de Obras · Grupo 4
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Calidad, Seguridad y Mejora Continua
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Concentración integral del control técnico: aseguramiento de calidad (checklists y punch list), auditorías de higiene y seguridad (Dec. 911/96), tratamiento formal de No Conformidades y captura de lecciones aprendidas.
          </p>
        </div>
      </div>

      {/* ─── Subfunction Navigation Bar + Project Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calidad')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'calidad'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <CheckSquare size={16} className="text-emerald-500" /> 1. Calidad & Inspecciones
        </button>

        <button
          onClick={() => setActiveTab('seguridad')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'seguridad'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <ShieldAlert size={16} className="text-red-500" /> 2. Higiene & Seguridad (Dec. 911/96)
        </button>

        <button
          onClick={() => setActiveTab('no_conformidades')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'no_conformidades'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <AlertTriangle size={16} className="text-amber-500" /> 3. No Conformidades (CNC)
        </button>

        <button
          onClick={() => setActiveTab('desvios_lecciones')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'desvios_lecciones'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <BookOpen size={16} className="text-blue-500" /> 4. Desvíos & Lecciones Aprendidas
        </button>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                localStorage.setItem('ecar_active_project_id', e.target.value);
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Todas las obras</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Content Panels ─── */}
      {activeTab === 'calidad' && (
        <div>
          <QualityModule />
        </div>
      )}

      {activeTab === 'seguridad' && (
        <div>
          <SafetyModule />
        </div>
      )}

      {activeTab === 'no_conformidades' && (
        <div>
          <NonConformitiesModule />
        </div>
      )}

      {activeTab === 'desvios_lecciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desvíos y Acciones */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <RefreshCw size={16} className="text-amber-500" /> Desvíos Operativos y Acciones
                </h3>
                <p className="text-[11px] text-gray-500">Registro de desvíos en terreno y medidas de contención.</p>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                {desvios.length} registros
              </span>
            </div>

            {desvios.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No hay desvíos operativos registrados.</p>
            ) : (
              <div className="space-y-3">
                {desvios.map(d => (
                  <div key={d.id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 line-clamp-1">{d.descripcion}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">{d.tipo}</span>
                    </div>
                    {d.impacto && <p className="text-gray-600"><strong className="text-gray-700">Impacto:</strong> {d.impacto}</p>}
                    {d.accion_correctiva && <p className="text-amber-900 bg-amber-50 p-2 rounded border border-amber-200"><strong className="text-amber-800">Acción:</strong> {d.accion_correctiva}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lecciones Aprendidas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-500" /> Repositorio de Lecciones Aprendidas
                </h3>
                <p className="text-[11px] text-gray-500">Conocimiento capitalizado para presupuestación y ejecución de futuras obras.</p>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                {lecciones.length} lecciones
              </span>
            </div>

            {lecciones.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No hay lecciones aprendidas documentadas.</p>
            ) : (
              <div className="space-y-3">
                {lecciones.map(l => (
                  <div key={l.id} className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">{l.descripcion}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">Aprendizaje</span>
                    </div>
                    {l.accion_correctiva && <p className="text-blue-900"><strong className="text-blue-800">Recomendación:</strong> {l.accion_correctiva}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
