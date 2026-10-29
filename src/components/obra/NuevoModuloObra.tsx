import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree, Calendar, HardHat, ShieldCheck, RotateCcw,
  Building2, type LucideIcon
} from 'lucide-react';
import { useProjects, useUpdateProject } from '../../hooks/useData';
import {
  useObraItems,
  useObraOrdenesTrabajo,
  useObraParteDiarioItems,
  useObraHitos,
  useObraLeccionesAprendidas
} from '../../hooks/useNuevoModuloObra';
import { useAppStore } from '../../store/useStore';
import { useModalStore } from '../../store/useModalStore';
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
    subtitulo: 'WBS, Rubros & Presupuesto',
    icon: FolderTree,
    color: 'text-blue-600',
    activeBg: 'bg-blue-50 border-blue-600 text-blue-700'
  },
  {
    id: 'programacion',
    numero: 'Fase 2',
    nombre: 'Programación',
    subtitulo: 'Asignación WBS & Emisión ODTs',
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
  const updateProject = useUpdateProject();

  // Datos sincronizados en vivo para los indicadores de comunicación entre las 5 Fases
  const { data: items = [] } = useObraItems(selectedProject?.id);
  const { data: odts = [] } = useObraOrdenesTrabajo(selectedProject?.id);
  const { data: partes = [] } = useObraParteDiarioItems(selectedProject?.id);
  const { data: hitos = [] } = useObraHitos(selectedProject?.id);
  const { data: lecciones = [] } = useObraLeccionesAprendidas(selectedProject?.id);

  const liveMetrics = useMemo(() => {
    const odtsActivas = odts.filter(o => o.estado === 'emitida' || o.estado === 'en_ejecucion');
    const odtsCumplidas = odts.filter(o => o.estado === 'cumplida');

    const ejecutadoPorItem: Record<string, number> = {};
    partes.forEach(p => {
      const itemId = p.item_id || p.odt?.item_id || p.tramo_item?.item_id;
      if (itemId) {
        ejecutadoPorItem[itemId] = (ejecutadoPorItem[itemId] || 0) + Number(p.cantidad_real || 0);
      }
    });

    let totalContractual = 0;
    let totalEjecutadoAcotado = 0;
    let itemsConAvance = 0;
    let itemsCompletos = 0;

    items.forEach(it => {
      const cant = Number(it.cantidad_contractual || 0);
      const ejec = ejecutadoPorItem[it.id] || 0;
      totalContractual += cant;
      totalEjecutadoAcotado += cant > 0 ? Math.min(cant, ejec) : 0;
      if (ejec > 0) itemsConAvance++;
      if (cant > 0 && ejec >= cant) itemsCompletos++;
    });

    const avanceGlobalPct = totalContractual > 0
      ? Math.min(100, Number(((totalEjecutadoAcotado / totalContractual) * 100).toFixed(1)))
      : 0;

    const hitosAprobados = hitos.filter(h => h.estado_binario === 100).length;

    return {
      totalItems: items.length,
      itemsConAvance,
      itemsCompletos,
      odtsActivas: odtsActivas.length,
      odtsCumplidas: odtsCumplidas.length,
      totalOdts: odts.filter(o => o.estado !== 'anulada').length,
      totalPartes: partes.length,
      avanceGlobalPct,
      hitosAprobados,
      totalHitos: hitos.length,
      totalLecciones: lecciones.length
    };
  }, [items, odts, partes, hitos, lecciones]);

  const getFaseBadge = (faseId: FaseObra) => {
    switch (faseId) {
      case 'planificacion':
        return `${liveMetrics.totalItems} ítems · ${liveMetrics.avanceGlobalPct}% ejec.`;
      case 'programacion':
        return `${liveMetrics.odtsActivas} activas · ${liveMetrics.odtsCumplidas} cumplidas`;
      case 'ejecucion':
        return `${liveMetrics.totalPartes} partes · ${liveMetrics.avanceGlobalPct}% avance`;
      case 'control':
        return `${liveMetrics.hitosAprobados}/${liveMetrics.totalHitos} hitos 100%`;
      case 'retroalimentacion':
        return `${liveMetrics.totalLecciones} lecciones`;
    }
  };

  return (
    <div className="space-y-5 pb-16 w-full px-2 sm:px-4">
      {/* Barra Superior de Proyecto */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proyecto de Obra Activo</span>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {selectedProject?.name || 'Selecciona un proyecto'}
              </h2>
              {selectedProject && (
                <select
                  value={selectedProject.status || 'active'}
                  onChange={async (e) => {
                    const newStatus = e.target.value as 'active' | 'suspended' | 'completed';
                    try {
                      await updateProject.mutateAsync({
                        id: selectedProject.id,
                        updates: { status: newStatus }
                      });
                      const label = newStatus === 'completed' ? 'Finalizada' : newStatus === 'suspended' ? 'Suspendida' : 'En Ejecución';
                      useModalStore.getState().showAlert('Estado Actualizado', `La obra ahora está marcada como ${label}.`);
                    } catch (err: any) {
                      useModalStore.getState().showAlert('Error', err.message);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all focus:outline-none ${
                    selectedProject.status === 'completed'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : selectedProject.status === 'suspended'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                  title="Cambiar estado: En Ejecución / Suspendida / Finalizada"
                >
                  <option value="active">🟢 En Ejecución</option>
                  <option value="suspended">🟡 Suspendida</option>
                  <option value="completed">🏁 Finalizada</option>
                </select>
              )}
              {selectedProject && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  Avance Físico Global: {liveMetrics.avanceGlobalPct}% ({liveMetrics.itemsCompletos}/{liveMetrics.totalItems} ítems al 100%)
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

      {/* Navegación del Ciclo de 5 Fases de Obra con Comunicación de Estado en Vivo */}
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
                <div className="flex items-center justify-between mb-1">
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
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive ? 'bg-white/80 text-slate-800 border border-slate-200/80' : 'bg-slate-100 text-slate-600'
                }`}>
                  {getFaseBadge(fase.id)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de la Fase Activa */}
      {selectedProject ? (
        <div className="w-full">
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
