import React, { useState, useMemo } from 'react';
import {
  Target, Plus, X, FolderTree, Calendar, BarChart3, RefreshCw,
  Check, Trash2, AlertTriangle, Clock, CheckCircle2, Pencil,
  MessageSquare, TrendingUp, Flag,
} from 'lucide-react';
import {
  useProjects, useCreateProject, useWbsElements, useCreateWbsElement,
  useUpdateWbsElement, useDeleteWbsElement, useEmployees,
  useProjectFeedback, useCreateProjectFeedback, useUpdateProjectFeedback,
} from '../hooks/useData';
import type { WbsElement, ProjectFeedback } from '../lib/types';

type MainTab = 'planificacion' | 'programacion' | 'ejecucion' | 'retroalimentacion';

const PHASE_COLORS: Record<string, string> = {
  planificacion: 'bg-blue-100 text-blue-700',
  programacion: 'bg-amber-100 text-amber-700',
  ejecucion: 'bg-green-100 text-green-700',
  completado: 'bg-gray-100 text-gray-600',
};
const PRIORITY_COLORS: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-600', media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700', critica: 'bg-red-100 text-red-700',
};
const GANTT_BAR_COLORS: Record<string, string> = {
  planificacion: '#3b82f6', programacion: '#f59e0b', ejecucion: '#22c55e', completado: '#9ca3af',
};

export const WbsModule: React.FC = () => {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: wbs = [] } = useWbsElements(selectedProjectId || undefined);
  const { data: employees = [] } = useEmployees();
  const [tab, setTab] = useState<MainTab>('planificacion');
  const [showForm, setShowForm] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editTask, setEditTask] = useState<WbsElement | null>(null);
  const [form, setForm] = useState({ name: '', client_name: '', client_cuit: '', location: '', budget_ars: 0, start_date: '' });
  const createWbs = useCreateWbsElement();
  const updateWbs = useUpdateWbsElement();
  const deleteWbs = useDeleteWbsElement();

  const [taskForm, setTaskForm] = useState<{
    name: string; description: string; start_date: string; end_date: string; duration_days: string;
    assigned_to: string; priority: 'baja' | 'media' | 'alta' | 'critica'; phase: 'planificacion' | 'programacion' | 'ejecucion' | 'completado';
    budget_cost_ars: string; notes: string; color: string;
  }>({
    name: '', description: '', start_date: '', end_date: '', duration_days: '1',
    assigned_to: '', priority: 'media', phase: 'planificacion',
    budget_cost_ars: '0', notes: '', color: '#3b82f6',
  });

  const handleCreateProject = async () => {
    await createProject.mutateAsync(form as any);
    setShowForm(false);
    setForm({ name: '', client_name: '', client_cuit: '', location: '', budget_ars: 0, start_date: '' });
  };

  const handleSaveTask = async () => {
    if (!taskForm.name || !selectedProjectId) return;
    const payload = {
      project_id: selectedProjectId,
      name: taskForm.name,
      description: taskForm.description || null,
      start_date: taskForm.start_date || null,
      end_date: taskForm.end_date || null,
      duration_days: parseInt(taskForm.duration_days) || 1,
      assigned_to: taskForm.assigned_to || null,
      priority: taskForm.priority,
      phase: taskForm.phase,
      budget_cost_ars: parseFloat(taskForm.budget_cost_ars) || 0,
      notes: taskForm.notes || null,
      color: taskForm.color,
    };
    if (editTask) {
      await updateWbs.mutateAsync({ id: editTask.id, ...payload });
    } else {
      await createWbs.mutateAsync(payload);
    }
    setShowNewTask(false);
    setEditTask(null);
    resetTaskForm();
  };

  const resetTaskForm = () => setTaskForm({ name: '', description: '', start_date: '', end_date: '', duration_days: '1', assigned_to: '', priority: 'media', phase: 'planificacion', budget_cost_ars: '0', notes: '', color: '#3b82f6' });

  const openEditTask = (el: WbsElement) => {
    setEditTask(el);
    setTaskForm({
      name: el.name, description: el.description || '', start_date: el.start_date || '', end_date: el.end_date || '',
      duration_days: String(el.duration_days), assigned_to: el.assigned_to || '', priority: el.priority,
      phase: el.phase, budget_cost_ars: String(el.budget_cost_ars), notes: el.notes || '', color: el.color,
    });
    setShowNewTask(true);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const formatARS = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${v.toLocaleString('es-AR')}`;

  const kpis = useMemo(() => {
    const total = wbs.length;
    const completadas = wbs.filter(t => t.phase === 'completado').length;
    const enEjecucion = wbs.filter(t => t.phase === 'ejecucion').length;
    const avgProgress = total > 0 ? Math.round(wbs.reduce((s, t) => s + t.progress_pct, 0) / total) : 0;
    const totalBudget = wbs.reduce((s, t) => s + t.budget_cost_ars, 0);
    return { total, completadas, enEjecucion, avgProgress, totalBudget };
  }, [wbs]);

  const tabs: { id: MainTab; label: string; emoji: string; icon: React.ElementType }[] = [
    { id: 'planificacion', label: 'Planificación', emoji: '📋', icon: Target },
    { id: 'programacion', label: 'Programación', emoji: '📅', icon: Calendar },
    { id: 'ejecucion', label: 'Ejecución', emoji: '🔨', icon: BarChart3 },
    { id: 'retroalimentacion', label: 'Retro', emoji: '🔄', icon: RefreshCw },
  ];

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando planificación...</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Target size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Target size={24} /> Gestión de Proyectos</h3>
          <p className="text-indigo-200 text-sm mt-1">Planificación · Programación · Ejecución · Retroalimentación</p>
        </div>
      </div>

      {/* Project Selector + New */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={selectedProjectId || ''} onChange={e => setSelectedProjectId(e.target.value || null)} className="flex-1 min-w-[200px] px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/30">
          <option value="">Seleccioná una obra</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client_name || 'Sin cliente'}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md">
          <Plus size={16} /> Nueva Obra
        </button>
      </div>

      {selectedProjectId && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Tareas', value: kpis.total, icon: FolderTree, color: 'text-indigo-600' },
              { label: 'En Ejecución', value: kpis.enEjecucion, icon: Clock, color: 'text-green-600' },
              { label: 'Completadas', value: kpis.completadas, icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'Avance Global', value: `${kpis.avgProgress}%`, icon: TrendingUp, color: 'text-cyan-600' },
              { label: 'Presupuesto', value: formatARS(kpis.totalBudget), icon: BarChart3, color: 'text-purple-600' },
            ].map(k => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-1"><k.icon size={14} className={k.color} /> {k.label}</div>
                <p className={`text-xl font-black font-mono ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <span className="md:hidden text-base">{t.emoji}</span>
                <span className="hidden md:inline">{t.emoji} {t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'planificacion' && <PlanificacionTab wbs={wbs} employees={employees} onNew={() => { resetTaskForm(); setEditTask(null); setShowNewTask(true); }} onEdit={openEditTask} onDelete={id => deleteWbs.mutate(id)} />}
          {tab === 'programacion' && <GanttTab wbs={wbs} project={selectedProject!} />}
          {tab === 'ejecucion' && <EjecucionTab wbs={wbs} onUpdateProgress={(id, pct) => updateWbs.mutate({ id, progress_pct: pct })} onUpdatePhase={(id, phase) => updateWbs.mutate({ id, phase: phase as any })} />}
          {tab === 'retroalimentacion' && <RetroTab projectId={selectedProjectId} wbs={wbs} />}
        </>
      )}

      {!selectedProjectId && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Target size={56} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">Seleccioná una obra para gestionar</p>
          <p className="text-sm mt-1">O creá una nueva desde el botón de arriba.</p>
        </div>
      )}

      {/* Modal Nueva Obra */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Nueva Obra</h3><button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button></div>
            <input placeholder="Nombre de la obra *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border rounded-xl text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Cliente" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} className="px-3 py-2.5 border rounded-xl text-sm" />
              <input placeholder="CUIT Cliente" value={form.client_cuit} onChange={e => setForm({ ...form, client_cuit: e.target.value })} className="px-3 py-2.5 border rounded-xl text-sm" />
              <input placeholder="Ubicación" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="px-3 py-2.5 border rounded-xl text-sm" />
              <input type="number" placeholder="Presupuesto ARS" value={form.budget_ars || ''} onChange={e => setForm({ ...form, budget_ars: parseFloat(e.target.value) || 0 })} className="px-3 py-2.5 border rounded-xl text-sm" />
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="px-3 py-2.5 border rounded-xl text-sm col-span-2" />
            </div>
            <button onClick={handleCreateProject} disabled={!form.name || createProject.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
              {createProject.isPending ? 'Creando...' : '✅ Crear Obra'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Nueva/Editar Tarea */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{editTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3><button onClick={() => { setShowNewTask(false); setEditTask(null); }}><X size={20} className="text-gray-400" /></button></div>
            <div><label className="text-xs font-bold text-gray-500">Nombre *</label><input value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm" placeholder="Ej: Excavación de fundaciones" /></div>
            <div><label className="text-xs font-bold text-gray-500">Descripción</label><textarea value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} rows={2} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-gray-500">Fecha Inicio</label><input type="date" value={taskForm.start_date} onChange={e => setTaskForm({...taskForm, start_date: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-500">Fecha Fin</label><input type="date" value={taskForm.end_date} onChange={e => setTaskForm({...taskForm, end_date: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-500">Duración (días)</label><input type="number" value={taskForm.duration_days} onChange={e => setTaskForm({...taskForm, duration_days: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono" /></div>
              <div><label className="text-xs font-bold text-gray-500">Presupuesto ($)</label><input type="number" value={taskForm.budget_cost_ars} onChange={e => setTaskForm({...taskForm, budget_cost_ars: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-gray-500">Responsable</label>
                <select value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm">
                  <option value="">Sin asignar</option>
                  {employees.filter(e => e.employment_status === 'active').map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Prioridad</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})} className="w-full px-3 py-2.5 border rounded-xl text-sm">
                  <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-gray-500">Fase</label>
                <select value={taskForm.phase} onChange={e => setTaskForm({...taskForm, phase: e.target.value as any})} className="w-full px-3 py-2.5 border rounded-xl text-sm">
                  <option value="planificacion">📋 Planificación</option><option value="programacion">📅 Programación</option><option value="ejecucion">🔨 Ejecución</option><option value="completado">✅ Completado</option>
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Color</label><input type="color" value={taskForm.color} onChange={e => setTaskForm({...taskForm, color: e.target.value})} className="w-full h-10 rounded-xl border cursor-pointer" /></div>
            </div>
            <div><label className="text-xs font-bold text-gray-500">Notas</label><input value={taskForm.notes} onChange={e => setTaskForm({...taskForm, notes: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
            <button onClick={handleSaveTask} disabled={!taskForm.name || createWbs.isPending || updateWbs.isPending} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <Check size={16} /> {editTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════ PLANIFICACIÓN TAB ═══════════════════════ */
const PlanificacionTab: React.FC<{ wbs: WbsElement[]; employees: any[]; onNew: () => void; onEdit: (el: WbsElement) => void; onDelete: (id: string) => void }> = ({ wbs, onNew, onEdit, onDelete }) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <button onClick={onNew} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-md"><Plus size={16} /> Nueva Tarea</button>
    </div>
    {wbs.length > 0 ? (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Tarea</th>
              <th className="px-4 py-3">Fase</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3 text-center">Avance</th>
              <th className="px-4 py-3 text-right">Presupuesto</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {wbs.map(el => (
              <tr key={el.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{el.name}</p>
                  {el.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{el.description}</p>}
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PHASE_COLORS[el.phase]}`}>{el.phase}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_COLORS[el.priority]}`}>{el.priority}</span></td>
                <td className="px-4 py-3 text-xs text-gray-600">{(el.employee as any)?.full_name || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${el.progress_pct}%` }} /></div>
                    <span className="text-xs font-mono font-bold text-gray-500">{el.progress_pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">{el.budget_cost_ars > 0 ? `$${el.budget_cost_ars.toLocaleString('es-AR')}` : '—'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onEdit(el)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil size={13} className="text-gray-500" /></button>
                    <button onClick={() => onDelete(el.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <FolderTree size={48} className="mx-auto mb-3 opacity-20" /><p className="font-medium">Sin tareas</p><p className="text-sm">Creá la primera tarea del proyecto.</p>
      </div>
    )}
  </div>
);

/* ═══════════════════════ GANTT TAB (CSS puro) ═══════════════════════ */
const GanttTab: React.FC<{ wbs: WbsElement[]; project: any }> = ({ wbs, project }) => {
  const tasksWithDates = wbs.filter(t => t.start_date && t.end_date);

  const { minDate, totalDays, weeks } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const now = new Date();
      const min = new Date(project?.start_date || now);
      const max = new Date(min); max.setDate(max.getDate() + 90);
      return { minDate: min, maxDate: max, totalDays: 90, weeks: [] as Date[] };
    }
    const dates = tasksWithDates.flatMap(t => [new Date(t.start_date!), new Date(t.end_date!)]);
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 14);
    const td = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    const wks: Date[] = [];
    const curr = new Date(min);
    curr.setDate(curr.getDate() - curr.getDay() + 1);
    while (curr <= max) { wks.push(new Date(curr)); curr.setDate(curr.getDate() + 7); }
    return { minDate: min, maxDate: max, totalDays: td, weeks: wks };
  }, [tasksWithDates, project]);

  const dayToPercent = (date: Date) => {
    const diff = (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    return (diff / totalDays) * 100;
  };

  const today = new Date();
  const todayPct = dayToPercent(today);

  if (tasksWithDates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <Calendar size={48} className="mx-auto mb-3 opacity-20" />
        <p className="font-medium">Sin tareas programadas</p>
        <p className="text-sm">Asigná fechas de inicio y fin a las tareas en la pestaña Planificación.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={16} className="text-indigo-600" /> Diagrama de Gantt</h3>
        <span className="text-xs text-gray-400 font-mono">{tasksWithDates.length} tareas programadas</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(800, totalDays * 6) }}>
          {/* Timeline header */}
          <div className="flex border-b border-gray-200 bg-gray-50/50 sticky top-0 z-10">
            <div className="w-[220px] shrink-0 px-4 py-2 text-xs font-bold text-gray-500 uppercase border-r border-gray-200">Tarea</div>
            <div className="flex-1 relative" style={{ height: 32 }}>
              {weeks.map((w, i) => {
                const pct = dayToPercent(w);
                return (
                  <div key={i} className="absolute top-0 h-full border-l border-gray-200 flex items-center" style={{ left: `${pct}%` }}>
                    <span className="text-[9px] font-mono text-gray-400 pl-1 whitespace-nowrap">
                      {w.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })}
              {/* Today line header */}
              {todayPct >= 0 && todayPct <= 100 && (
                <div className="absolute top-0 h-full w-0.5 bg-red-500 z-20" style={{ left: `${todayPct}%` }}>
                  <span className="absolute -top-0 -left-3 bg-red-500 text-white text-[8px] px-1 rounded-b font-bold">HOY</span>
                </div>
              )}
            </div>
          </div>

          {/* Task rows */}
          {tasksWithDates.map(task => {
            const startPct = dayToPercent(new Date(task.start_date!));
            const endPct = dayToPercent(new Date(task.end_date!));
            const barWidth = Math.max(endPct - startPct, 1);
            const barColor = task.color || GANTT_BAR_COLORS[task.phase] || '#3b82f6';

            return (
              <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50/30 group">
                <div className="w-[220px] shrink-0 px-4 py-2.5 border-r border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: barColor }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{task.name}</p>
                    <p className="text-[10px] text-gray-400">{(task.employee as any)?.full_name || ''}</p>
                  </div>
                </div>
                <div className="flex-1 relative" style={{ height: 44 }}>
                  {/* Week grid lines */}
                  {weeks.map((w, i) => (
                    <div key={i} className="absolute top-0 h-full border-l border-gray-100" style={{ left: `${dayToPercent(w)}%` }} />
                  ))}
                  {/* Today line */}
                  {todayPct >= 0 && todayPct <= 100 && <div className="absolute top-0 h-full w-0.5 bg-red-500/20 z-10" style={{ left: `${todayPct}%` }} />}
                  {/* Gantt Bar */}
                  <div className="absolute top-2 h-5 rounded-md shadow-sm flex items-center overflow-hidden transition-all" style={{ left: `${startPct}%`, width: `${barWidth}%`, background: barColor }}>
                    {/* Progress fill */}
                    <div className="h-full rounded-md opacity-40 bg-white" style={{ width: `${100 - task.progress_pct}%`, position: 'absolute', right: 0 }} />
                    <span className="text-[9px] font-bold text-white px-1.5 relative z-10 whitespace-nowrap">{task.progress_pct}%</span>
                  </div>
                  {/* Duration label */}
                  <div className="absolute bottom-0.5 text-[8px] text-gray-400 font-mono" style={{ left: `${startPct}%` }}>
                    {task.duration_days}d
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center">
        <span className="text-[10px] text-gray-500 font-bold">FASES:</span>
        {Object.entries(GANTT_BAR_COLORS).map(([phase, color]) => (
          <div key={phase} className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm" style={{ background: color }} /><span className="text-[10px] text-gray-500">{phase}</span></div>
        ))}
        <div className="flex items-center gap-1 ml-3"><div className="w-3 h-0.5 bg-red-500" /><span className="text-[10px] text-gray-500">Hoy</span></div>
      </div>
    </div>
  );
};

/* ═══════════════════════ EJECUCIÓN TAB ═══════════════════════ */
const EjecucionTab: React.FC<{ wbs: WbsElement[]; onUpdateProgress: (id: string, pct: number) => void; onUpdatePhase: (id: string, phase: string) => void }> = ({ wbs, onUpdateProgress, onUpdatePhase }) => {
  const atrasadas = wbs.filter(t => t.end_date && new Date(t.end_date) < new Date() && t.phase !== 'completado');
  const enEjecucion = wbs.filter(t => t.phase === 'ejecucion');
  const avgProgress = wbs.length > 0 ? Math.round(wbs.reduce((s, t) => s + t.progress_pct, 0) / wbs.length) : 0;

  return (
    <div className="space-y-4">
      {/* SPI & KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`bg-white border rounded-xl p-4 shadow-sm ${atrasadas.length > 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><AlertTriangle size={14} className="text-red-500" /> Tareas Atrasadas</div>
          <p className="text-2xl font-black font-mono text-red-600">{atrasadas.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Clock size={14} className="text-green-500" /> En Ejecución</div>
          <p className="text-2xl font-black font-mono text-green-600">{enEjecucion.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><TrendingUp size={14} className="text-indigo-500" /> Avance Global</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${avgProgress}%` }} /></div>
            <span className="font-mono font-bold text-indigo-600 text-sm">{avgProgress}%</span>
          </div>
        </div>
      </div>

      {/* Tasks with progress controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-100"><span className="text-sm font-bold text-gray-700">Control de Avance</span></div>
        <div className="divide-y divide-gray-100">
          {wbs.map(task => (
            <div key={task.id} className={`px-4 py-3 flex items-center gap-3 ${task.end_date && new Date(task.end_date) < new Date() && task.phase !== 'completado' ? 'bg-red-50/30' : ''}`}>
              <div className="w-2 h-8 rounded-full shrink-0" style={{ background: task.color || '#3b82f6' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.name}</p>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${PHASE_COLORS[task.phase]}`}>{task.phase}</span>
                  {task.end_date && new Date(task.end_date) < new Date() && task.phase !== 'completado' && <Flag size={12} className="text-red-500" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${task.progress_pct}%`, background: task.color || '#3b82f6' }} />
                  </div>
                  <input type="range" min="0" max="100" step="5" value={task.progress_pct} onChange={e => onUpdateProgress(task.id, Number(e.target.value))} className="w-24 h-1.5 accent-indigo-600" />
                  <span className="text-xs font-mono font-bold text-gray-600 w-8">{task.progress_pct}%</span>
                </div>
              </div>
              <select value={task.phase} onChange={e => onUpdatePhase(task.id, e.target.value)} className="text-xs px-2 py-1.5 border rounded-lg bg-gray-50">
                <option value="planificacion">📋 Plan</option><option value="programacion">📅 Prog</option><option value="ejecucion">🔨 Ejec</option><option value="completado">✅ Comp</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════ RETROALIMENTACIÓN TAB ═══════════════════════ */
const RetroTab: React.FC<{ projectId: string; wbs: WbsElement[] }> = ({ projectId, wbs }) => {
  const { data: feedbacks = [] } = useProjectFeedback(projectId);
  const createFb = useCreateProjectFeedback();
  const updateFb = useUpdateProjectFeedback();
  const [showNew, setShowNew] = useState(false);
  const [fbForm, setFbForm] = useState({ tipo: 'desviacion' as ProjectFeedback['tipo'], descripcion: '', impacto: '', accion_correctiva: '', responsable: '', wbs_element_id: '' });

  const handleAdd = async () => {
    if (!fbForm.descripcion) return;
    await createFb.mutateAsync({
      project_id: projectId, tipo: fbForm.tipo, descripcion: fbForm.descripcion,
      impacto: fbForm.impacto || null, accion_correctiva: fbForm.accion_correctiva || null,
      responsable: fbForm.responsable || null, wbs_element_id: fbForm.wbs_element_id || null,
    });
    setShowNew(false);
    setFbForm({ tipo: 'desviacion', descripcion: '', impacto: '', accion_correctiva: '', responsable: '', wbs_element_id: '' });
  };

  const TIPO_COLORS: Record<string, string> = { desviacion: 'bg-red-100 text-red-700', leccion: 'bg-blue-100 text-blue-700', mejora: 'bg-green-100 text-green-700', riesgo: 'bg-amber-100 text-amber-700' };
  const EST_COLORS: Record<string, string> = { abierto: 'bg-yellow-100 text-yellow-700', en_proceso: 'bg-blue-100 text-blue-700', resuelto: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowNew(!showNew)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-md">
          {showNew ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo Registro</>}
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><MessageSquare size={16} className="text-indigo-600" /> Nuevo Registro de Retroalimentación</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-gray-500">Tipo *</label>
              <select value={fbForm.tipo} onChange={e => setFbForm({...fbForm, tipo: e.target.value as any})} className="w-full px-3 py-2.5 border rounded-xl text-sm">
                <option value="desviacion">⚠️ Desviación</option><option value="leccion">📖 Lección Aprendida</option><option value="mejora">💡 Mejora</option><option value="riesgo">🔴 Riesgo</option>
              </select>
            </div>
            <div><label className="text-xs font-bold text-gray-500">Tarea Relacionada</label>
              <select value={fbForm.wbs_element_id} onChange={e => setFbForm({...fbForm, wbs_element_id: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm">
                <option value="">Ninguna</option>{wbs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs font-bold text-gray-500">Descripción *</label><textarea value={fbForm.descripcion} onChange={e => setFbForm({...fbForm, descripcion: e.target.value})} rows={2} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-gray-500">Impacto</label><input value={fbForm.impacto} onChange={e => setFbForm({...fbForm, impacto: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm" placeholder="Impacto en costo, plazo..." /></div>
            <div><label className="text-xs font-bold text-gray-500">Responsable</label><input value={fbForm.responsable} onChange={e => setFbForm({...fbForm, responsable: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500">Acción Correctiva</label><textarea value={fbForm.accion_correctiva} onChange={e => setFbForm({...fbForm, accion_correctiva: e.target.value})} rows={2} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
          <button onClick={handleAdd} disabled={!fbForm.descripcion || createFb.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
            <Check size={16} className="inline mr-1" /> Registrar
          </button>
        </div>
      )}

      {feedbacks.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100"><span className="text-sm font-bold text-gray-700">Historial de Retroalimentación ({feedbacks.length})</span></div>
          <div className="divide-y divide-gray-100">
            {feedbacks.map(fb => (
              <div key={fb.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIPO_COLORS[fb.tipo]}`}>{fb.tipo}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EST_COLORS[fb.estado]}`}>{fb.estado.replace('_', ' ')}</span>
                  {(fb.wbs_element as any)?.name && <span className="text-[10px] text-gray-400">→ {(fb.wbs_element as any).name}</span>}
                  <span className="text-[10px] text-gray-400 ml-auto font-mono">{new Date(fb.created_at).toLocaleDateString('es-AR')}</span>
                </div>
                <p className="text-sm text-gray-700">{fb.descripcion}</p>
                {fb.impacto && <p className="text-xs text-gray-500"><strong>Impacto:</strong> {fb.impacto}</p>}
                {fb.accion_correctiva && <p className="text-xs text-gray-500"><strong>Acción:</strong> {fb.accion_correctiva}</p>}
                {fb.estado !== 'resuelto' && (
                  <div className="flex gap-1 pt-1">
                    {fb.estado === 'abierto' && <button onClick={() => updateFb.mutate({ id: fb.id, estado: 'en_proceso' })} className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">En Proceso</button>}
                    <button onClick={() => updateFb.mutate({ id: fb.id, estado: 'resuelto' })} className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200">Resolver</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <RefreshCw size={48} className="mx-auto mb-3 opacity-20" /><p className="font-medium">Sin registros de retroalimentación</p>
          <p className="text-sm">Registrá desviaciones, lecciones aprendidas y mejoras del proyecto.</p>
        </div>
      )}
    </div>
  );
};
