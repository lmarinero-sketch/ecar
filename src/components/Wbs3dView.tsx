import React, { useState, useMemo } from 'react';
import { X, Sparkles, Calendar, RefreshCw, Play, Pause, Upload, Box } from 'lucide-react';
import type { WbsElement } from '../lib/types';
import { IfcViewer } from './IfcViewer';

type ViewType = 'isometric' | 'bim';

/* ═══════════════════════ VISTA 3D AVANCE DE OBRA (CSS 3D) ═══════════════════════ */
const PHASE_BG: Record<string, string> = {
  planificacion: 'bg-blue-500', programacion: 'bg-amber-500',
  ejecucion: 'bg-emerald-500', completado: 'bg-gray-400',
};
const PHASE_LABEL: Record<string, string> = {
  planificacion: 'bg-blue-100 text-blue-700', programacion: 'bg-amber-100 text-amber-700',
  ejecucion: 'bg-emerald-100 text-emerald-700', completado: 'bg-gray-100 text-gray-600',
};

type RenderMode = 'realista' | 'fases' | 'estructural';

export const Wbs3dView: React.FC<{ wbs: WbsElement[]; projectId: string }> = ({ wbs, projectId }) => {
  const [selectedTask, setSelectedTask] = useState<WbsElement | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('realista');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('isometric');

  const dateBounds = useMemo(() => {
    if (!wbs.length) return { start: new Date(), end: new Date(), totalDays: 1 };
    const all = wbs.flatMap(t => [new Date(t.start_date || '').getTime(), new Date(t.end_date || '').getTime()]);
    const start = new Date(Math.min(...all));
    const end = new Date(Math.max(...all));
    return { start, end, totalDays: Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) };
  }, [wbs]);

  // Timeline playback
  React.useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => {
      setTimelineProgress(p => { if (p >= 100) { setIsPlaying(false); return 100; } return p + 1; });
    }, 80);
    return () => clearInterval(iv);
  }, [isPlaying]);

  const getTimelineDate = () => {
    const t = (timelineProgress / 100) * (dateBounds.end.getTime() - dateBounds.start.getTime());
    return new Date(dateBounds.start.getTime() + t).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTaskVisualProgress = (task: WbsElement) => {
    if (!isPlaying) return task.progress_pct;
    const ts = new Date(task.start_date || '').getTime(), te = new Date(task.end_date || '').getTime();
    const cur = dateBounds.start.getTime() + (timelineProgress / 100) * (dateBounds.end.getTime() - dateBounds.start.getTime());
    if (cur < ts) return 0;
    if (cur >= te) return 100;
    return Math.round(((cur - ts) / (te - ts)) * 100);
  };

  // Classify tasks by structural type
  const classifyTask = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('fund') || n.includes('excav') || n.includes('ciment') || n.includes('pilot')) return 'foundation';
    if (n.includes('columna') || n.includes('muro') || n.includes('pared') || n.includes('tabique')) return 'column';
    if (n.includes('viga') || n.includes('losa') || n.includes('techo') || n.includes('entrepiso')) return 'slab';
    return 'finishes';
  };

  const getBlockColor = (task: WbsElement): string => {
    if (renderMode === 'fases') {
      switch (task.phase) {
        case 'planificacion': return '#3b82f6';
        case 'programacion': return '#f59e0b';
        case 'ejecucion': return '#22c55e';
        case 'completado': return '#6b7280';
      }
    }
    if (renderMode === 'estructural') return '#0ea5e9';
    const type = classifyTask(task.name);
    if (type === 'foundation') return '#78716c';
    if (type === 'column') return '#a8a29e';
    if (type === 'slab') return '#d97706';
    return '#115c9c';
  };

  const getBlockDimensions = (task: WbsElement) => {
    const type = classifyTask(task.name);
    switch (type) {
      case 'foundation': return { w: 90, h: 28, floor: 0 };
      case 'column': return { w: 30, h: 80, floor: 1 };
      case 'slab': return { w: 100, h: 16, floor: 2 };
      default: return { w: 55, h: 55, floor: 3 };
    }
  };

  return (
    <div className="space-y-4">
      {/* View Type Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewType('isometric')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
              viewType === 'isometric' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Box size={15} /> Vista Isométrica
          </button>
          <button
            onClick={() => setViewType('bim')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
              viewType === 'bim' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload size={15} /> Visor BIM (IFC)
          </button>
        </div>
        {viewType === 'bim' && (
          <p className="text-xs text-gray-400">Cargá un archivo .ifc exportado desde Revit, ArchiCAD o AutoCAD para visualizar el modelo 3D real.</p>
        )}
      </div>

      {/* BIM Viewer */}
      {viewType === 'bim' && <IfcViewer projectId={projectId} />}

      {/* Isometric CSS View */}
      {viewType === 'isometric' && !wbs.length && (
        <div className="light-card p-1">
          <Sparkles size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin tareas para visualizar</p>
          <p className="text-sm">Creá tareas en Planificación para ver el modelo 3D.</p>
        </div>
      )}

      {viewType === 'isometric' && wbs.length > 0 && (
    <div className="flex flex-col lg:flex-row gap-0 h-[620px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* 3D Canvas Area */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 flex flex-col min-h-0 overflow-hidden">
        {/* Isometric Grid */}
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
          <div
            className="relative transition-transform duration-[20000ms] ease-linear"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1200px',
              animation: autoRotate && !isPlaying ? 'iso-rotate 40s linear infinite' : undefined,
            }}
          >
            <div
              className="relative"
              style={{
                transform: 'rotateX(55deg) rotateZ(-45deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Grid floor */}
              <div
                className="absolute border border-ecar-blueLight/30"
                style={{
                  width: 400, height: 400, left: -200, top: -200,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(99,102,241,0.08) 39px, rgba(99,102,241,0.08) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(99,102,241,0.08) 39px, rgba(99,102,241,0.08) 40px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Task blocks */}
              {wbs.map((task, idx) => {
                const dims = getBlockDimensions(task);
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const x = (col - 1) * 120;
                const y = (row - Math.floor((wbs.length - 1) / 6)) * 120;
                const elevation = dims.floor * 50;
                const color = getBlockColor(task);
                const progress = getTaskVisualProgress(task);
                const isSelected = selectedTask?.id === task.id;
                const opacity = renderMode === 'estructural' ? 0.5 : (progress / 100) * 0.7 + 0.3;

                return (
                  <div
                    key={task.id}
                    onClick={() => { setSelectedTask(task); setAutoRotate(false); }}
                    className={`absolute cursor-pointer transition-all duration-500 group`}
                    style={{
                      left: x - dims.w / 2, top: y - dims.w / 2,
                      width: dims.w, height: dims.w,
                      transform: `translateZ(${elevation}px)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Top face */}
                    <div
                      className={`absolute inset-0 transition-all duration-300 ${isSelected ? 'ring-2 ring-ecar-blue ring-offset-1' : ''}`}
                      style={{
                        background: color,
                        opacity,
                        transform: `translateZ(${dims.h * (progress / 100)}px)`,
                        boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                        borderRadius: 4,
                      }}
                    />
                    {/* Front face */}
                    <div
                      className="absolute transition-all duration-300"
                      style={{
                        bottom: 0, left: 0, width: dims.w,
                        height: dims.h * (progress / 100),
                        background: `linear-gradient(180deg, ${color}dd, ${color}88)`,
                        opacity,
                        transformOrigin: 'bottom',
                        transform: 'rotateX(-90deg)',
                        borderRadius: '0 0 4px 4px',
                      }}
                    />
                    {/* Right face */}
                    <div
                      className="absolute transition-all duration-300"
                      style={{
                        top: 0, right: 0,
                        width: dims.h * (progress / 100), height: dims.w,
                        background: `linear-gradient(90deg, ${color}bb, ${color}66)`,
                        opacity,
                        transformOrigin: 'right',
                        transform: 'rotateY(90deg)',
                        borderRadius: '0 4px 4px 0',
                      }}
                    />
                    {/* Wireframe outline */}
                    <div
                      className={`absolute inset-0 border-2 transition-all duration-300 rounded ${
                        isSelected ? 'border-ecar-blue' : 'border-gray-300/40'
                      }`}
                      style={{ transform: `translateZ(${dims.h * (progress / 100)}px)` }}
                    />
                    {/* Label on hover */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                      style={{ transform: 'rotateZ(45deg) rotateX(-55deg)' }}>
                      <div className="bg-slate-900/90 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg backdrop-blur">
                        {task.name} — {progress}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay controls */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-3 shadow-md max-w-[260px]">
          <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Gemelo Digital 3D
          </h4>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            Visualización isométrica del avance de obra. Hacé click en un bloque para inspeccionar.
          </p>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border shadow-md flex items-center gap-1.5 transition-all ${
              autoRotate ? 'bg-slate-50 border-ecar-blueLight text-ecar-blue' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <RefreshCw size={10} className={autoRotate ? 'animate-spin' : ''} />
            Rotación: {autoRotate ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Render mode */}
        <div className="absolute bottom-20 left-4 bg-white/95 backdrop-blur border border-gray-200 rounded-lg p-1 shadow-md flex gap-1">
          {(['realista', 'estructural', 'fases'] as RenderMode[]).map(m => (
            <button key={m} onClick={() => setRenderMode(m)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all capitalize ${
                renderMode === m ? 'bg-ecar-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {m === 'estructural' ? 'Rayos X' : m === 'fases' ? 'Ver Fases' : 'Realista'}
            </button>
          ))}
        </div>

        {/* Timeline player */}
        <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-4 relative z-10">
          <button
            onClick={() => { if (timelineProgress >= 100) setTimelineProgress(0); setIsPlaying(!isPlaying); }}
            className={`p-2 rounded-lg text-white transition-all shadow ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-ecar-blue hover:bg-ecar-blue'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              <span className="flex items-center gap-1">
                <Calendar size={11} className="text-ecar-blue" /> Simulación de Avance
              </span>
              <span className="bg-slate-50 text-ecar-blue px-2 py-0.5 rounded-full font-mono font-bold text-xs border border-ecar-blueLight">
                {getTimelineDate()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-mono">{dateBounds.start.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
              <input type="range" min="0" max="100" value={timelineProgress}
                onChange={e => { setAutoRotate(false); setTimelineProgress(parseInt(e.target.value)); }}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-ecar-blue"
              />
              <span className="text-[10px] text-gray-400 font-mono">{dateBounds.end.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar — task list + detail */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-sm text-gray-800">Estructura WBS Activa</h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">Avance y Selección 3D</p>
          </div>
          <span className="badge badge-info">{wbs.length} elementos</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {wbs.map(task => {
            const isSelected = selectedTask?.id === task.id;
            const vp = getTaskVisualProgress(task);
            return (
              <div key={task.id} onClick={() => { setSelectedTask(task); setAutoRotate(false); }}
                className={`p-3.5 cursor-pointer transition-all ${
                  isSelected ? 'bg-slate-50/70 border-l-4 border-ecar-blue' : 'hover:bg-gray-50/30'
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <h5 className={`font-bold text-xs leading-tight ${isSelected ? 'text-ecar-blueDark' : 'text-gray-700'}`}>{task.name}</h5>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${PHASE_LABEL[task.phase] || 'bg-gray-100 text-gray-700'}`}>{vp}%</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2">
                  <span className="font-mono">
                    {new Date(task.start_date || '').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} al {new Date(task.end_date || '').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>{task.duration_days} días</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1 mt-2.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${PHASE_BG[task.phase] || 'bg-gray-400'}`} style={{ width: `${vp}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {selectedTask ? (
          <div className="p-4 border-t border-gray-200 bg-slate-900 text-white space-y-3.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold tracking-wider text-ecar-blue uppercase">Inspección de Objeto</span>
                <h5 className="font-bold text-sm leading-tight text-white mt-0.5">{selectedTask.name}</h5>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            {selectedTask.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5">{selectedTask.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cronología</span>
                <span className="font-mono text-slate-200 block mt-0.5">{new Date(selectedTask.start_date || '').toLocaleDateString('es-AR')}</span>
                <span className="text-[10px] text-slate-400 font-mono">al {new Date(selectedTask.end_date || '').toLocaleDateString('es-AR')} ({selectedTask.duration_days} d)</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Presupuesto</span>
                <span className="font-mono text-ecar-blue font-bold block mt-0.5">${selectedTask.budget_cost_ars ? selectedTask.budget_cost_ars.toLocaleString('es-AR') : '0'} ARS</span>
              </div>
            </div>
            <div className="flex gap-2 items-center bg-white/5 rounded-lg p-2.5 border border-white/5 mt-1">
              <div className="w-8 h-8 rounded-full bg-ecar-blueDark border border-ecar-blueDark flex items-center justify-center text-ecar-blueLight font-bold text-xs">
                {selectedTask.assigned_to ? '👤' : '👥'}
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Fase & Responsable</span>
                <span className="text-xs text-slate-200 font-bold block">{selectedTask.phase.charAt(0).toUpperCase() + selectedTask.phase.slice(1)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 border-t border-gray-100 bg-gray-50/20">
            <Sparkles size={24} className="mx-auto mb-2 opacity-20 text-ecar-blue animate-pulse" />
            <p className="text-xs font-medium">Seleccioná un elemento en el listado para ver detalles.</p>
          </div>
        )}
      </div>

      {/* CSS animation for rotation */}
      <style>{`
        @keyframes iso-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
      )}
    </div>
  );
};
