import React, { useState, useEffect } from 'react';
import {
  FolderTree, Calendar, HardHat, ShieldCheck, RotateCcw,
  Building2, type LucideIcon
} from 'lucide-react';
import { useProjects } from '../../hooks/useData';
import { useAppStore } from '../../store/useStore';
import { Fase1Planificacion } from './fases/Fase1Planificacion';
import { Fase2Programacion } from './fases/Fase2Programacion';
import { Fase3Ejecucion } from './fases/Fase3Ejecucion';
import { Fase4Control } from './fases/Fase4Control';
import { Fase5Retroalimentacion } from './fases/Fase5Retroalimentacion';

export type FaseObra = 'planificacion' | 'programacion' | 'ejecucion' | 'control' | 'retroalimentacion';

const FASES: Array<{
  id: FaseObra;
  numero: string;
  nombre: string;
  subtitulo: string;
  icon: LucideIcon;
  color: string;
  activeBg: string;
}> = [
  {
    id: 'planificacion',
    numero: 'Fase 1',
    nombre: 'Planificación',
    subtitulo: 'WBS, Rubros, Ítems & Tramos',
    icon: FolderTree,
    color: 'text-blue-600',
    activeBg: 'bg-blue-50 border-blue-600 text-blue-700'
  },
  {
    id: 'programacion',
    numero: 'Fase 2',
    nombre: 'Programación',
    subtitulo: 'Bandeja PP & Emisión ODTs',
    icon: Calendar,
    color: 'text-amber-600',
    activeBg: 'bg-amber-50 border-amber-600 text-amber-800'
  },
  {
    id: 'ejecucion',
    numero: 'Fase 3',
    nombre: 'Ejecución',
    subtitulo: 'Modo Terreno / Tablet',
    icon: HardHat,
    color: 'text-emerald-600',
    activeBg: 'bg-emerald-50 border-emerald-600 text-emerald-800'
  },
  {
    id: 'control',
    numero: 'Fase 4',
    nombre: 'Control & Certificación',
    subtitulo: 'Hitos 0/100 & Estados de Pago',
    icon: ShieldCheck,
    color: 'text-purple-600',
    activeBg: 'bg-purple-50 border-purple-600 text-purple-800'
  },
  {
    id: 'retroalimentacion',
    numero: 'Fase 5',
    nombre: 'Retroalimentación',
    subtitulo: 'Benchmark Rendimientos & Lecciones',
    icon: RotateCcw,
    color: 'text-teal-600',
    activeBg: 'bg-teal-50 border-teal-600 text-teal-800'
  }
];

export const NuevoModuloObra: React.FC = () => {
  const { data: projects = [] } = useProjects();
  const { activeProjectId, setActiveProjectId } = useAppStore();

  // Seleccionar por defecto el proyecto Roque si existe
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      const roque = projects.find(p => p.name.toLowerCase().includes('roque'));
      if (roque) {
        setActiveProjectId(roque.id);
      } else {
        setActiveProjectId(projects[0].id);
      }
    }
  }, [projects, activeProjectId, setActiveProjectId]);

  const [activeFase, setActiveFase] = useState<FaseObra>('planificacion');
  const selectedProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Barra Superior de Proyecto */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md">
            <Building2 size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proyecto de Obra Activo</span>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {selectedProject?.name || 'Selecciona un proyecto'}
              </h2>
              {selectedProject && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedProject.status?.toUpperCase() || 'ACTIVO'}
                </span>
              )}
            </div>
            {selectedProject?.client_name && (
              <span className="text-xs text-slate-500">Comitente: {selectedProject.client_name}</span>
            )}
          </div>
        </div>

        {/* Selector de Obra */}
        <div className="flex items-center gap-3">
          <select
            value={activeProjectId || ''}
            onChange={e => setActiveProjectId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[260px]"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name.replace('\n', ' - ')} ({p.client_name || 'Sin cliente'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navegación del Ciclo de 5 Fases de Obra */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {FASES.map(fase => {
            const Icon = fase.icon;
            const isActive = activeFase === fase.id;
            return (
              <button
                key={fase.id}
                onClick={() => setActiveFase(fase.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  isActive
                    ? fase.activeBg + ' shadow-sm border-2'
                    : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${isActive ? 'opacity-90' : 'text-slate-400'}`}>
                    {fase.numero}
                  </span>
                  <Icon size={18} className={isActive ? fase.color : 'text-slate-400 group-hover:text-slate-600'} />
                </div>
                <div className="font-bold text-sm leading-tight text-slate-900">
                  {fase.nombre}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {fase.subtitulo}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de la Fase Activa */}
      {selectedProject ? (
        <div>
          {activeFase === 'planificacion' && (
            <Fase1Planificacion
              projectId={selectedProject.id}
              projectName={selectedProject.name}
            />
          )}

          {activeFase === 'programacion' && (
            <Fase2Programacion
              projectId={selectedProject.id}
              projectName={selectedProject.name}
            />
          )}

          {activeFase === 'ejecucion' && (
            <Fase3Ejecucion
              projectId={selectedProject.id}
              projectName={selectedProject.name}
            />
          )}

          {activeFase === 'control' && (
            <Fase4Control
              projectId={selectedProject.id}
              projectName={selectedProject.name}
            />
          )}

          {activeFase === 'retroalimentacion' && (
            <Fase5Retroalimentacion
              projectId={selectedProject.id}
              projectName={selectedProject.name}
            />
          )}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">No hay ninguna obra seleccionada</h3>
          <p className="text-xs text-slate-500 mt-1">Selecciona una obra en el menú superior para acceder al módulo de gestión.</p>
        </div>
      )}
    </div>
  );
};
