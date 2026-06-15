import React, { useState, useMemo, useEffect } from 'react';
import {
  Target, Plus, X, FolderTree, Calendar, BarChart3, RefreshCw,
  Check, Trash2, AlertTriangle, Clock, CheckCircle2, Pencil,
  MessageSquare, TrendingUp, Flag, Users, Wrench, ArrowLeftRight,
  ShoppingCart, FileCheck, DollarSign, Truck, Sparkles
} from 'lucide-react';
import { Wbs3dView } from './Wbs3dView';
import { useImplementationStore } from '../store/useImplementationStore';
import {
  useProjects, useCreateProject, useWbsElements, useCreateWbsElement,
  useUpdateWbsElement, useDeleteWbsElement, useEmployees,
  useProjectFeedback, useCreateProjectFeedback, useUpdateProjectFeedback,
  // Project-Hub specific resource/financial hooks:
  useProjectEmployees, useProjectInventoryMovements, useProjectToolAssignments,
  useProjectFuelLoads, useProjectPurchaseRequests, useProjectCertificates,
  useCreateToolAssignment, useUpdateToolAssignment, useCreateInventoryMovement,
  useCreateFuelLoad, useCreatePurchaseRequest, useCreateProjectCertificate,
  useUpdateProjectCertificate, useInventoryItems, useFuelVehicles, useBankAccounts
} from '../hooks/useData';
import type {
  WbsElement, ProjectFeedback, Employee, ProjectCertificate, BankAccount
} from '../lib/types';

type MainTab = 'planificacion' | 'programacion' | 'ejecucion' | 'recursos' | 'movimientos' | 'pedidos' | 'certificados' | 'retroalimentacion' | 'avance3d';

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

  useEffect(() => {
    useImplementationStore.getState().completeItem('g18');
  }, []);
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

  const [aiInput, setAiInput] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState(false);

  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return '1';
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? String(diff) : '1';
  };

  const calculateEndDate = (start: string, duration: string): string => {
    if (!start) return '';
    const d = parseInt(duration) || 1;
    const s = new Date(start);
    s.setDate(s.getDate() + d - 1);
    return s.toISOString().split('T')[0];
  };

  const handleStartDateChange = (val: string) => {
    const updated = { ...taskForm, start_date: val };
    if (val && taskForm.end_date) {
      updated.duration_days = calculateDuration(val, taskForm.end_date);
    } else if (val && taskForm.duration_days) {
      updated.end_date = calculateEndDate(val, taskForm.duration_days);
    }
    setTaskForm(updated);
  };

  const handleEndDateChange = (val: string) => {
    const updated = { ...taskForm, end_date: val };
    if (taskForm.start_date && val) {
      updated.duration_days = calculateDuration(taskForm.start_date, val);
    }
    setTaskForm(updated);
  };

  const handleDurationChange = (val: string) => {
    const updated = { ...taskForm, duration_days: val };
    if (taskForm.start_date && val) {
      updated.end_date = calculateEndDate(taskForm.start_date, val);
    }
    setTaskForm(updated);
  };

  const parseNaturalLanguageTask = (text: string, employeesList: Employee[]) => {
    const normalized = text.toLowerCase().trim();
    
    let name = '';
    let description = '';
    let start_date = '';
    let end_date = '';
    let duration_days = '1';
    let assigned_to = '';
    let priority: 'baja' | 'media' | 'alta' | 'critica' = 'media';
    let phase: 'planificacion' | 'programacion' | 'ejecucion' | 'completado' = 'planificacion';
    let budget_cost_ars = '0';
    let notes = '';

    // 1. Budget parsing
    const budgetMatch = text.match(/(?:presupuesto|costo|costar|ars|\$)\s*([\d\.,]+)\s*(millón|millones|m|mil|k)?/i);
    if (budgetMatch) {
      let numStr = budgetMatch[1].replace(/\./g, '').replace(',', '.');
      let val = parseFloat(numStr) || 0;
      const unit = budgetMatch[2]?.toLowerCase() || '';
      if (unit.includes('mill') || unit === 'm') {
        val *= 1000000;
      } else if (unit.includes('mil') || unit === 'k') {
        val *= 1000;
      }
      budget_cost_ars = String(val);
    }

    // 2. Priority parsing
    if (normalized.includes('critica') || normalized.includes('crítica') || normalized.includes('urgente')) {
      priority = 'critica';
    } else if (normalized.includes('alta')) {
      priority = 'alta';
    } else if (normalized.includes('baja')) {
      priority = 'baja';
    } else if (normalized.includes('media')) {
      priority = 'media';
    }

    // 3. Phase parsing
    if (normalized.includes('planific') || normalized.includes('planif') || normalized.includes(' plan ')) {
      phase = 'planificacion';
    } else if (normalized.includes('program') || normalized.includes('prog')) {
      phase = 'programacion';
    } else if (normalized.includes('ejecuc') || normalized.includes('ejec') || normalized.includes('haciendo')) {
      phase = 'ejecucion';
    } else if (normalized.includes('completado') || normalized.includes('terminado') || normalized.includes('finalizado') || normalized.includes('hecho')) {
      phase = 'completado';
    }

    // 4. Assignee parsing
    const assigneeMatch = text.match(/(?:asignado a|responsable|encargado|a cargo de)\s+([a-záéíóúñ\s]+)/i);
    if (assigneeMatch) {
      const namePart = assigneeMatch[1].trim().toLowerCase();
      const found = employeesList.find(e => e.full_name.toLowerCase().includes(namePart));
      if (found) {
        assigned_to = found.id;
      }
    }

    // 5. Notes / Comments
    const notesMatch = text.match(/(?:nota|comentario|obs):\s*([^\.]+)/i) || text.match(/(?:nota|comentario|observacion)\s+([^\.]+)/i);
    if (notesMatch) {
      notes = notesMatch[1].trim();
    }

    // 6. Dates and Duration
    const durationMatch = text.match(/(\d+)\s*(?:días|dias|dia|días)/i);
    if (durationMatch) {
      duration_days = durationMatch[1];
    }

    const monthMap: Record<string, string> = {
      enero: '01', ene: '01', febrero: '02', feb: '02', marzo: '03', mar: '03',
      abril: '04', abr: '04', mayo: '05', may: '05', junio: '06', jun: '06',
      julio: '07', jul: '07', agosto: '08', ago: '08', septiembre: '09', sep: '09',
      octubre: '10', oct: '10', noviembre: '11', nov: '11', diciembre: '12', dic: '12'
    };

    const parseSingleDate = (dayStr: string, monthStr: string, yearStr?: string) => {
      const day = dayStr.padStart(2, '0');
      let month = '01';
      if (monthMap[monthStr.toLowerCase()]) {
        month = monthMap[monthStr.toLowerCase()];
      } else if (/^\d{1,2}$/.test(monthStr)) {
        month = monthStr.padStart(2, '0');
      }
      const year = yearStr || '2026';
      return `${year}-${month}-${day}`;
    };

    const rangeMatch = text.match(/(?:del|desde el)\s+(\d{1,2})(?:\s+de\s+([a-z]+)|\/(\d{1,2}))\s+(?:al|hasta el)\s+(\d{1,2})(?:\s+de\s+([a-z]+)|\/(\d{1,2}))/i);
    if (rangeMatch) {
      const startDay = rangeMatch[1];
      const startMonth = rangeMatch[2] || rangeMatch[3];
      const endDay = rangeMatch[4];
      const endMonth = rangeMatch[5] || rangeMatch[6];
      
      start_date = parseSingleDate(startDay, startMonth);
      end_date = parseSingleDate(endDay, endMonth);
      
      const d1 = new Date(start_date);
      const d2 = new Date(end_date);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) {
        duration_days = String(diff);
      }
    } else {
      const singleDateMatch = text.match(/(?:el|desde el|inicio el)\s+(\d{1,2})(?:\s+de\s+([a-z]+)|\/(\d{1,2}))/i);
      if (singleDateMatch) {
        const day = singleDateMatch[1];
        const month = singleDateMatch[2] || singleDateMatch[3];
        start_date = parseSingleDate(day, month);
        
        const dur = parseInt(duration_days) || 1;
        const d1 = new Date(start_date);
        d1.setDate(d1.getDate() + dur - 1);
        end_date = d1.toISOString().split('T')[0];
      }
    }

    let cleanName = text;
    if (budgetMatch) cleanName = cleanName.replace(budgetMatch[0], '');
    if (assigneeMatch) cleanName = cleanName.replace(assigneeMatch[0], '');
    if (notesMatch) cleanName = cleanName.replace(notesMatch[0], '');
    if (durationMatch) cleanName = cleanName.replace(durationMatch[0], '');
    if (rangeMatch) {
      cleanName = cleanName.replace(rangeMatch[0], '');
    } else {
      const singleDateMatch = text.match(/(?:el|desde el|inicio el)\s+(\d{1,2})(?:\s+de\s+([a-z]+)|\/(\d{1,2}))/i);
      if (singleDateMatch) cleanName = cleanName.replace(singleDateMatch[0], '');
    }

    cleanName = cleanName
      .replace(/(?:crear|hacer|pintar|realizar|agregar|nueva tarea|tarea|prioridad\s+[a-z]+|fase\s+[a-z]+)/gi, '')
      .replace(/[,;\.\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanName) {
      cleanName = text.split(' ').slice(0, 4).join(' ');
    }
    
    name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    return { name, description, start_date, end_date, duration_days, assigned_to, priority, phase, budget_cost_ars, notes };
  };

  const handleAiFill = () => {
    if (!aiInput.trim()) return;
    const parsed = parseNaturalLanguageTask(aiInput, employees);
    setTaskForm({
      name: parsed.name,
      description: parsed.description,
      start_date: parsed.start_date || taskForm.start_date,
      end_date: parsed.end_date || taskForm.end_date,
      duration_days: parsed.duration_days,
      assigned_to: parsed.assigned_to,
      priority: parsed.priority,
      phase: parsed.phase,
      budget_cost_ars: parsed.budget_cost_ars,
      notes: parsed.notes,
      color: taskForm.color,
    });
    setAiSuccessMessage(true);
    setTimeout(() => setAiSuccessMessage(false), 3000);
  };

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
    { id: 'avance3d', label: 'Avance 3D', emoji: '✨', icon: Sparkles },
    { id: 'recursos', label: 'Recursos', emoji: '👥', icon: Users },
    { id: 'movimientos', label: 'Movimientos', emoji: '📦', icon: ArrowLeftRight },
    { id: 'pedidos', label: 'Pedidos', emoji: '🛒', icon: ShoppingCart },
    { id: 'certificados', label: 'Certificados', emoji: '📄', icon: FileCheck },
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
          <p className="text-indigo-200 text-sm mt-1">Planificación · Recursos · Movimientos · Pedidos · Certificados · Retroalimentación</p>
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
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 min-w-[90px] py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <span className="md:hidden text-base">{t.emoji}</span>
                <span className="hidden md:inline">{t.emoji} {t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'planificacion' && <PlanificacionTab wbs={wbs} employees={employees} onNew={() => { resetTaskForm(); setEditTask(null); setShowNewTask(true); }} onEdit={openEditTask} onDelete={id => deleteWbs.mutate(id)} />}
          {tab === 'programacion' && <GanttTab wbs={wbs} project={selectedProject!} />}
          {tab === 'ejecucion' && <EjecucionTab wbs={wbs} onUpdateProgress={(id, pct) => updateWbs.mutate({ id, progress_pct: pct })} onUpdatePhase={(id, phase) => updateWbs.mutate({ id, phase: phase as any })} />}
          {tab === 'avance3d' && <Wbs3dView wbs={wbs} projectId={selectedProjectId!} />}
          {tab === 'recursos' && <RecursosTab projectId={selectedProjectId} />}
          {tab === 'movimientos' && <MovimientosTab projectId={selectedProjectId} />}
          {tab === 'pedidos' && <PedidosTab projectId={selectedProjectId} />}
          {tab === 'certificados' && <CertificadosTab projectId={selectedProjectId} />}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center pb-6 pt-12 px-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-gray-100">
            {/* Modal Header — sticky */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <FolderTree size={20} className="text-[#115C9C]" />
                  {editTask ? 'Editar Tarea de Obra' : 'Nueva Tarea de Obra'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Definí los detalles, cronograma y responsables del item del WBS.</p>
              </div>
              <button 
                onClick={() => { setShowNewTask(false); setEditTask(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Form Fields (7 Columns) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Nombre */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Nombre de la Tarea *</label>
                  <input 
                    value={taskForm.name} 
                    onChange={e => setTaskForm({...taskForm, name: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] transition-all" 
                    placeholder="Ej: Excavación de fundaciones y vigas de riostra" 
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Descripción / Alcance</label>
                  <textarea 
                    value={taskForm.description} 
                    onChange={e => setTaskForm({...taskForm, description: e.target.value})} 
                    rows={2} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] transition-all resize-none"
                    placeholder="Detalles adicionales sobre las tareas a realizar..."
                  />
                </div>

                {/* Cronograma Sincronizado */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-205 space-y-3 relative">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-1">
                    <Clock size={14} className="text-[#115C9C]" />
                    CRONOGRAMA DE TRABAJO
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      Fechas & Duración Sincronizadas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Fecha de Inicio</label>
                      <input 
                        type="date" 
                        value={taskForm.start_date} 
                        onChange={e => handleStartDateChange(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] bg-white transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Fecha de Fin</label>
                      <input 
                        type="date" 
                        value={taskForm.end_date} 
                        onChange={e => handleEndDateChange(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] bg-white transition-all" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200/60">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Duración (días corridos)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={taskForm.duration_days} 
                        onChange={e => handleDurationChange(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] bg-white transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Presupuesto Asignado ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 font-mono text-sm font-bold">$</span>
                        <input 
                          type="number" 
                          value={taskForm.budget_cost_ars} 
                          onChange={e => setTaskForm({...taskForm, budget_cost_ars: e.target.value})} 
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] bg-white transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Prioridad + Fase en una fila */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Prioridad */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Prioridad</label>
                    <div className="grid grid-cols-4 gap-0.5 bg-gray-100 rounded-xl p-1">
                      {(['baja', 'media', 'alta', 'critica'] as const).map(p => {
                        const isSelected = taskForm.priority === p;
                        const activeStyles = {
                          baja: 'bg-green-600 text-white shadow-sm',
                          media: 'bg-blue-600 text-white shadow-sm',
                          alta: 'bg-amber-600 text-white shadow-sm',
                          critica: 'bg-red-600 text-white shadow-sm',
                        };
                        return (
                          <button key={p} type="button" onClick={() => setTaskForm({ ...taskForm, priority: p })}
                            className={`py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${isSelected ? activeStyles[p] : 'text-gray-500 hover:text-gray-800'}`}
                          >
                            {p === 'critica' ? 'Crítica' : p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Fase */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Fase del WBS</label>
                    <div className="grid grid-cols-4 gap-0.5 bg-gray-100 rounded-xl p-1">
                      {(['planificacion', 'programacion', 'ejecucion', 'completado'] as const).map(f => {
                        const isSelected = taskForm.phase === f;
                        const labels: Record<string, string> = { planificacion: 'Planif.', programacion: 'Program.', ejecucion: 'Ejecuc.', completado: 'Complet.' };
                        return (
                          <button key={f} type="button" onClick={() => setTaskForm({ ...taskForm, phase: f })}
                            className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-white text-[#115C9C] shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
                          >
                            {labels[f]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Responsable, Color & Notas en fila compacta */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Responsable</label>
                    <select 
                      value={taskForm.assigned_to} 
                      onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] bg-white transition-all"
                    >
                      <option value="">Sin asignar</option>
                      {employees.filter(e => e.employment_status === 'active').map(e => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Color</label>
                    <div className="flex gap-1.5">
                      <input type="color" value={taskForm.color} onChange={e => setTaskForm({...taskForm, color: e.target.value})} className="w-10 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white" />
                      <input type="text" value={taskForm.color} onChange={e => setTaskForm({...taskForm, color: e.target.value})} className="w-full px-2 py-2 border border-gray-300 rounded-xl text-xs font-mono text-center uppercase" maxLength={7} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Notas</label>
                    <input 
                      value={taskForm.notes} 
                      onChange={e => setTaskForm({...taskForm, notes: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#115C9C]/30 focus:border-[#115C9C] transition-all" 
                      placeholder="Observaciones..."
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: AI Assistant (5 Columns) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#0B477D] to-[#08355e] text-white p-4 rounded-2xl shadow-inner relative overflow-hidden flex flex-col border border-[#08355e] max-h-[520px]">
                {/* Decorative background icon */}
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none translate-x-1/4 -translate-y-1/4">
                  <Sparkles size={220} />
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                      <Sparkles size={18} className="text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">Carga Rápida con IA</h4>
                      <p className="text-[10px] text-blue-200">Asistente en Lenguaje Natural</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-blue-100 leading-relaxed">
                    Escribí una frase detallando la tarea y el cargador inteligente completará los campos de fechas, presupuesto, prioridad y responsable automáticamente.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-blue-200 uppercase tracking-wider block">Tu frase / instrucción:</label>
                    <textarea
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      placeholder="Ej: Excavación de zapatas desde el 15 de junio por 8 días con presupuesto de 1.5 millones asignado a gomez..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all resize-none h-24"
                    />
                    <button
                      type="button"
                      onClick={handleAiFill}
                      disabled={!aiInput.trim()}
                      className="w-full bg-white hover:bg-blue-50 text-[#0B477D] font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 active:scale-[0.98]"
                    >
                      <Sparkles size={13} className="text-amber-500 animate-pulse" />
                      Procesar Frase
                    </button>
                    
                    {aiSuccessMessage && (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-[10px] px-3 py-2 rounded-xl text-center font-bold animate-pulse flex items-center justify-center gap-1">
                        <Check size={12} /> ¡Datos autocompletados!
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider block mb-2">Presioná para probar ejemplos:</span>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
                      {[
                        {
                          label: "📅 Rango de Fechas + Responsable + Presupuesto",
                          text: "Crear Pintura exterior del 12/05 al 25/05 asignado a Gomez con costo de 250 mil"
                        },
                        {
                          label: "⏱️ Fecha Inicio + Duración + Prioridad Crítica",
                          text: "Excavación de fundaciones desde el 15/06 durante 12 días prioridad critica nota: peligro derrumbe"
                        },
                        {
                          label: "💰 Millones + Fase Completada",
                          text: "Estructura de hormigón armado fase completado presupuesto 5 millones el 01/05"
                        }
                      ].map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAiInput(ex.text);
                            const parsed = parseNaturalLanguageTask(ex.text, employees);
                            setTaskForm({
                              name: parsed.name,
                              description: parsed.description || taskForm.description,
                              start_date: parsed.start_date || taskForm.start_date,
                              end_date: parsed.end_date || taskForm.end_date,
                              duration_days: parsed.duration_days,
                              assigned_to: parsed.assigned_to || taskForm.assigned_to,
                              priority: parsed.priority,
                              phase: parsed.phase,
                              budget_cost_ars: parsed.budget_cost_ars,
                              notes: parsed.notes || taskForm.notes,
                              color: taskForm.color,
                            });
                            setAiSuccessMessage(true);
                            setTimeout(() => setAiSuccessMessage(false), 3000);
                          }}
                          className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-2 rounded-xl text-blue-100 hover:text-white transition-all block text-[10px]"
                        >
                          <div className="font-semibold text-white/90 truncate mb-0.5">{ex.label}</div>
                          <div className="opacity-60 truncate font-mono text-[9px]">{ex.text}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 text-center relative z-10">
                  <span className="text-[9px] tracking-widest text-blue-200/50 font-bold uppercase">SISTEMA CREADO POR GROW LABS</span>
                </div>
              </div>

            </div>{/* end grid */}
            </div>{/* end scrollable body */}

            {/* Modal Actions — sticky footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl">
              <button 
                onClick={() => { setShowNewTask(false); setEditTask(null); }}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm border hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveTask} 
                disabled={!taskForm.name || createWbs.isPending || updateWbs.isPending} 
                className="bg-[#115C9C] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#0B477D] shadow-md transition-all disabled:opacity-50"
              >
                <Check size={16} /> 
                {editTask ? 'Guardar Cambios' : 'Crear Tarea'}
              </button>
            </div>
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

// ==========================================
// TAB: RECURSOS
// ==========================================
interface RecursosTabProps {
  projectId: string;
}

const RecursosTab: React.FC<RecursosTabProps> = ({ projectId }) => {
  const { data: projectEmployees = [], isLoading: loadingEmployees } = useProjectEmployees(projectId);
  const { data: toolAssignments = [], isLoading: loadingAssignments } = useProjectToolAssignments(projectId);
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: globalEmployees = [] } = useEmployees();
  const createToolAssignment = useCreateToolAssignment();
  const updateToolAssignment = useUpdateToolAssignment();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [notes, setNotes] = useState('');

  // Filtrar ítems de inventario que sean herramientas
  const tools = useMemo(() => {
    return inventoryItems.filter(item => item.category === 'herramienta');
  }, [inventoryItems]);

  const handleAssign = async () => {
    if (!selectedItemId || !selectedEmployeeId) return;
    await createToolAssignment.mutateAsync({
      project_id: projectId,
      item_id: selectedItemId,
      employee_id: selectedEmployeeId,
      assigned_date: new Date().toISOString().split('T')[0],
      status: 'assigned',
      notes: notes || null,
    });
    setShowAssignModal(false);
    setSelectedItemId('');
    setSelectedEmployeeId('');
    setNotes('');
  };

  const handleReturn = async (id: string) => {
    await updateToolAssignment.mutateAsync({
      id,
      returned_date: new Date().toISOString().split('T')[0],
      status: 'returned',
    });
  };

  return (
    <div className="space-y-6">
      {/* Sección Personal de Obra */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" /> Personal Asignado
          </h3>
          <span className="text-xs text-gray-500 font-medium">Asignados en el módulo de RRHH</span>
        </div>

        {loadingEmployees ? (
          <div className="text-center py-6 text-gray-400 text-sm">Cargando personal...</div>
        ) : projectEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projectEmployees.map((emp: Employee) => {
              const initials = emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={emp.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-800 truncate">{emp.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.category?.name || 'Operario'}</p>
                    <p className="text-[10px] font-mono text-gray-500 mt-0.5">CUIL: {emp.cuil || 'S/D'}</p>
                  </div>
                  {emp.category?.daily_rate_ars && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Jornal</p>
                      <p className="text-sm font-bold font-mono text-indigo-600">${emp.category.daily_rate_ars.toLocaleString('es-AR')}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200 text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">Sin personal asignado a esta obra</p>
            <p className="text-xs">Podés asignar operarios editando sus legajos en el módulo de RRHH.</p>
          </div>
        )}
      </div>

      {/* Sección Herramientas y Equipamiento */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Wrench size={20} className="text-indigo-600" /> Herramientas y Equipamiento
          </h3>
          <button onClick={() => setShowAssignModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all">
            <Plus size={14} /> Asignar Herramienta
          </button>
        </div>

        {loadingAssignments ? (
          <div className="text-center py-6 text-gray-400 text-sm">Cargando herramientas asignadas...</div>
        ) : toolAssignments.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Herramienta</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Fecha Asig.</th>
                  <th className="px-4 py-3">Devolución</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {toolAssignments.map(asg => (
                  <tr key={asg.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {asg.item?.name || 'Herramienta Desconocida'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {asg.employee ? asg.employee.full_name : 'No asignado'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {asg.assigned_date}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {asg.returned_date || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        asg.status === 'returned' ? 'bg-green-100 text-green-700' :
                        asg.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {asg.status === 'assigned' ? 'Asignado' :
                         asg.status === 'returned' ? 'Devuelto' :
                         asg.status === 'lost' ? 'Perdido' : 'Dañado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {asg.status === 'assigned' && (
                        <button onClick={() => handleReturn(asg.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold text-[10px] border transition-all">
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200 text-gray-400">
            <Wrench size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">No hay herramientas asignadas actualmente</p>
            <p className="text-xs">Hacé clic en "Asignar Herramienta" para registrar una salida del pañol a esta obra.</p>
          </div>
        )}
      </div>

      {/* Modal Asignar Herramienta */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Wrench size={18} className="text-indigo-600" /> Asignar Herramienta a Obra
              </h3>
              <button onClick={() => setShowAssignModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Seleccioná la Herramienta *</label>
                <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Seleccionar herramienta...</option>
                  {tools.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Stock: {t.current_stock} {t.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Responsable (Empleado) *</label>
                <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Seleccionar responsable...</option>
                  {globalEmployees.map((emp: Employee) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.category?.name || 'Operario'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Notas / Observaciones</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Ej: Estado al entregar, accesorios incluidos..." />
              </div>

              <button onClick={handleAssign} disabled={!selectedItemId || !selectedEmployeeId || createToolAssignment.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2">
                {createToolAssignment.isPending ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// TAB: MOVIMIENTOS Y CONSUMOS
// ==========================================
const MovimientosTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data: movements = [], isLoading: loadingMovements } = useProjectInventoryMovements(projectId);
  const { data: fuelLoads = [], isLoading: loadingFuel } = useProjectFuelLoads(projectId);
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: vehicles = [] } = useFuelVehicles();
  const createMovement = useCreateInventoryMovement();
  const createFuelLoad = useCreateFuelLoad();

  const [activeSubTab, setActiveSubTab] = useState<'materiales' | 'combustible'>('materiales');
  
  // Movimiento Inventario Form
  const [showMovModal, setShowMovModal] = useState(false);
  const [itemId, setItemId] = useState('');
  const [movType, setMovType] = useState<'in' | 'out'>('out');
  const [qty, setQty] = useState('1');
  const [movNotes, setMovNotes] = useState('');

  // Fuel Load Form
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [driver, setDriver] = useState('');
  const [obs, setObs] = useState('');

  const handleSaveMovement = async () => {
    if (!itemId || !qty) return;
    await createMovement.mutateAsync({
      project_id: projectId,
      item_id: itemId,
      movement_type: movType,
      quantity: parseFloat(qty),
      notes: movNotes || null,
    });
    setShowMovModal(false);
    setItemId('');
    setQty('1');
    setMovNotes('');
  };

  const handleSaveFuel = async () => {
    if (!vehicleId || !liters || !totalCost) return;
    const v = vehicles.find(x => x.id === vehicleId);
    await createFuelLoad.mutateAsync({
      project_id: projectId,
      vehicle_id: vehicleId,
      vehicle_code: v?.code || null,
      vehicle_description: v?.description || null,
      plate: v?.plate || null,
      vehicle_type: v?.vehicle_type || null,
      load_date: new Date().toISOString().split('T')[0],
      liters: parseFloat(liters),
      total_amount: parseFloat(totalCost),
      price_per_liter: parseFloat(totalCost) / parseFloat(liters),
      odometer_km: odometer ? parseFloat(odometer) : null,
      driver_name: driver || null,
      observations: obs || null,
      load_source: 'station',
      validation_status: 'pending',
    });
    setShowFuelModal(false);
    setVehicleId('');
    setLiters('');
    setTotalCost('');
    setOdometer('');
    setDriver('');
    setObs('');
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs Toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-md">
        <button onClick={() => setActiveSubTab('materiales')} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeSubTab === 'materiales' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          📦 Materiales / Consumibles
        </button>
        <button onClick={() => setActiveSubTab('combustible')} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeSubTab === 'combustible' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          ⛽ Carga de Combustible
        </button>
      </div>

      {activeSubTab === 'materiales' ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Historial de Movimientos de Material</h3>
            <button onClick={() => setShowMovModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all">
              <Plus size={14} /> Registrar Movimiento
            </button>
          </div>

          {loadingMovements ? (
            <div className="text-center py-6 text-gray-400 text-sm">Cargando movimientos...</div>
          ) : movements.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Notas</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map(mov => (
                    <tr key={mov.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {mov.item?.name || 'Material Desconocido'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          mov.movement_type === 'in' ? 'bg-green-100 text-green-700' :
                          mov.movement_type === 'out' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {mov.movement_type === 'in' ? 'Ingreso' :
                           mov.movement_type === 'out' ? 'Consumo' :
                           mov.movement_type === 'return' ? 'Devolución' : 'Ajuste'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {mov.quantity} {mov.item?.unit}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[200px]">
                        {mov.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                        {new Date(mov.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
              <ArrowLeftRight size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No hay movimientos registrados</p>
              <p className="text-sm">Registrá ingresos de materiales o consumos en el proyecto.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Planillas de Carga de Combustible</h3>
            <button onClick={() => setShowFuelModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all">
              <Plus size={14} /> Cargar Combustible
            </button>
          </div>

          {loadingFuel ? (
            <div className="text-center py-6 text-gray-400 text-sm">Cargando consumos de combustible...</div>
          ) : fuelLoads.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Vehículo</th>
                    <th className="px-4 py-3">Litros</th>
                    <th className="px-4 py-3">Monto Total</th>
                    <th className="px-4 py-3">Chofer</th>
                    <th className="px-4 py-3">Odómetro</th>
                    <th className="px-4 py-3">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fuelLoads.map(load => (
                    <tr key={load.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {load.load_date}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {load.vehicle_code ? `${load.vehicle_code} (${load.plate || 'S/P'})` : 'Flota General'}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {load.liters ? `${load.liters.toLocaleString('es-AR')} L` : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                        {load.total_amount ? `$${load.total_amount.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {load.driver_name || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                        {load.odometer_km ? `${load.odometer_km.toLocaleString('es-AR')} Km` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[150px]">
                        {load.observations || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
              <Truck size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin cargas de combustible registradas</p>
              <p className="text-sm">Registrá los consumos de la flota asignada al proyecto.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Registrar Movimiento Inventario */}
      {showMovModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-indigo-600" /> Registrar Movimiento de Material
              </h3>
              <button onClick={() => setShowMovModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setMovType('out')} className={`py-1.5 rounded text-xs font-bold transition-all ${movType === 'out' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'}`}>
                Consumo / Salida
              </button>
              <button onClick={() => setMovType('in')} className={`py-1.5 rounded text-xs font-bold transition-all ${movType === 'in' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
                Ingreso a Obra
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Material / Insumo *</label>
                <select value={itemId} onChange={e => setItemId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none">
                  <option value="">Seleccionar material...</option>
                  {inventoryItems.filter(x => !x.is_tool).map(item => (
                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.current_stock} {item.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad *</label>
                <input type="number" min="0.01" step="any" value={qty} onChange={e => setQty(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Notas</label>
                <textarea value={movNotes} onChange={e => setMovNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" placeholder="Motivo o detalle del movimiento..." />
              </div>

              <button onClick={handleSaveMovement} disabled={!itemId || !qty || createMovement.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2">
                {createMovement.isPending ? 'Procesando...' : 'Confirmar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Carga de Combustible */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Truck size={18} className="text-indigo-600" /> Registrar Consumo de Combustible
              </h3>
              <button onClick={() => setShowFuelModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Vehículo de Flota *</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none">
                  <option value="">Seleccionar vehículo...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.code} — {v.brand} {v.model} ({v.plate})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Litros cargados *</label>
                  <input type="number" min="0.1" step="any" value={liters} onChange={e => setLiters(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Costo Total ($ ARS) *</label>
                  <input type="number" min="1" step="any" value={totalCost} onChange={e => setTotalCost(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Odómetro (Km)</label>
                  <input type="number" value={odometer} onChange={e => setOdometer(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Chofer responsable</label>
                  <input type="text" value={driver} onChange={e => setDriver(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" placeholder="Nombre completo" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Observaciones</label>
                <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" placeholder="Detalles de la carga..." />
              </div>

              <button onClick={handleSaveFuel} disabled={!vehicleId || !liters || !totalCost || createFuelLoad.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2">
                {createFuelLoad.isPending ? 'Guardando planilla...' : 'Guardar Planilla de Carga'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// TAB: PEDIDOS DE MERCADERÍA / COMPRAS
// ==========================================
const PedidosTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data: purchaseRequests = [], isLoading: loadingRequests } = useProjectPurchaseRequests(projectId);
  const { data: inventoryItems = [] } = useInventoryItems();
  const createRequest = useCreatePurchaseRequest();

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [notes, setNotes] = useState('');
  
  // Temporary list of items to request
  const [items, setItems] = useState<{
    inventory_item_id: string | null;
    description: string;
    quantity: number;
    unit: string;
    estimated_unit_cost: number;
  }[]>([]);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('0');

  const handleAddItem = () => {
    const invItem = inventoryItems.find(x => x.id === selectedItemId);
    const description = invItem ? invItem.name : customDescription;
    if (!description || !quantity) return;

    setItems([
      ...items,
      {
        inventory_item_id: selectedItemId || null,
        description,
        quantity: parseFloat(quantity),
        unit: invItem?.unit || 'U',
        estimated_unit_cost: parseFloat(unitCost) || 0,
      }
    ]);

    setSelectedItemId('');
    setCustomDescription('');
    setQuantity('1');
    setUnitCost('0');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    await createRequest.mutateAsync({
      project_id: projectId,
      urgency,
      status: 'pending',
      notes: notes || null,
      items: items,
    });
    setShowNewOrderModal(false);
    setItems([]);
    setNotes('');
    setUrgency('normal');
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Pedidos de Materiales y Suministros</h3>
        <button onClick={() => setShowNewOrderModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all">
          <Plus size={14} /> Nuevo Pedido
        </button>
      </div>

      {loadingRequests ? (
        <div className="text-center py-6 text-gray-400 text-sm">Cargando pedidos...</div>
      ) : purchaseRequests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {purchaseRequests.map(req => {
            const requestItems = req.items || [];
            const estimatedTotal = requestItems.reduce((acc, it) => acc + (it.quantity * (it.estimated_unit_cost || 0)), 0);

            return (
              <div key={req.id} className={`bg-white border rounded-xl p-5 shadow-sm transition-all space-y-3 relative overflow-hidden ${
                req.urgency === 'urgent' ? 'border-red-200' : 'border-gray-200'
              }`}>
                {req.urgency === 'urgent' && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
                    Urgente
                  </div>
                )}
                
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs text-gray-400 font-mono">Solicitado el {new Date(req.created_at).toLocaleDateString('es-AR')}</p>
                    {req.notes && <p className="text-sm text-gray-700 italic">"{req.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'ordered' ? 'bg-purple-100 text-purple-700' :
                      req.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status === 'pending' ? 'Pendiente' :
                       req.status === 'approved' ? 'Aprobado' :
                       req.status === 'ordered' ? 'Ordenado' :
                       req.status === 'received' ? 'Recibido' : 'Rechazado'}
                    </span>
                    {estimatedTotal > 0 && (
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Total Est.: ${estimatedTotal.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="border-t border-gray-100 pt-2.5 space-y-1">
                  {requestItems.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-center text-xs py-0.5">
                      <span className="text-gray-700 font-medium">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono">
                          {item.quantity} {item.unit || 'U'}
                        </span>
                        {item.estimated_unit_cost ? (
                          <span className="text-gray-400 font-mono">
                            c/u: ${item.estimated_unit_cost.toLocaleString('es-AR')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay pedidos solicitados</p>
          <p className="text-sm">Hacé clic en "Nuevo Pedido" para enviar una solicitud al sector de compras.</p>
        </div>
      )}

      {/* Modal Nuevo Pedido */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-600" /> Crear Pedido de Compras
              </h3>
              <button onClick={() => setShowNewOrderModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Urgencia</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value as any)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none">
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Notas / Motivo</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" placeholder="Destino, justificación..." />
              </div>
            </div>

            {/* Agregar item form */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Agregar ítem al pedido</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Item del Catálogo (Opcional)</label>
                  <select value={selectedItemId} onChange={e => {
                    setSelectedItemId(e.target.value);
                    if (e.target.value) setCustomDescription('');
                  }} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none bg-white">
                    <option value="">Seleccionar del pañol...</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Descripción Manual (Si no está en catálogo)</label>
                  <input type="text" value={customDescription} onChange={e => {
                    setCustomDescription(e.target.value);
                    if (e.target.value) setSelectedItemId('');
                  }} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none bg-white" placeholder="Ej: Clavos de 2 pulgadas" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad *</label>
                  <input type="number" min="0.01" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Costo Unitario Est. (Opcional)</label>
                  <input type="number" min="0" step="any" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none bg-white" />
                </div>
              </div>

              <button onClick={handleAddItem} className="bg-gray-800 text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-gray-700 transition-all">
                Agregar Ítem
              </button>
            </div>

            {/* List of items added */}
            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items agregados</p>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 text-xs bg-white">
                      <div>
                        <span className="font-bold text-gray-800">{it.description}</span>
                        <span className="text-gray-400 ml-2 font-mono">{it.quantity} {it.unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {it.estimated_unit_cost > 0 && (
                          <span className="font-mono text-gray-500 font-medium">
                            Est: ${(it.quantity * it.estimated_unit_cost).toLocaleString('es-AR')}
                          </span>
                        )}
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 font-bold">
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={items.length === 0 || createRequest.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2">
              {createRequest.isPending ? 'Enviando pedido...' : 'Registrar Pedido y Enviar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// TAB: CERTIFICADOS DE OBRA
// ==========================================
const CertificadosTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data: certificates = [], isLoading: loadingCerts } = useProjectCertificates(projectId);
  const { data: bankAccounts = [] } = useBankAccounts();
  const createCert = useCreateProjectCertificate();
  const updateCert = useUpdateProjectCertificate();

  const [showNewCertModal, setShowNewCertModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<ProjectCertificate | null>(null);

  // New certificate form fields
  const [certNumber, setCertNumber] = useState('');
  const [period, setPeriod] = useState('');
  const [gross, setGross] = useState('');
  const [redet, setRedet] = useState('');
  const [retIibb, setRetIibb] = useState('');
  const [retCheque, setRetCheque] = useState('');
  const [retOther, setRetOther] = useState('');

  // Payment fields
  const [bankAccountId, setBankAccountId] = useState('');
  const [depositDate, setDepositDate] = useState('');

  const handleSaveCert = async () => {
    const grossVal = parseFloat(gross) || 0;
    const redetVal = parseFloat(redet) || 0;
    const totalCertifiedVal = grossVal + redetVal;
    const iibbVal = parseFloat(retIibb) || 0;
    const chequeVal = parseFloat(retCheque) || 0;
    const otherVal = parseFloat(retOther) || 0;
    const netVal = totalCertifiedVal - (iibbVal + chequeVal + otherVal);

    await createCert.mutateAsync({
      project_id: projectId,
      certificate_number: parseInt(certNumber) || 1,
      period_description: period || null,
      gross_amount: grossVal,
      redetermination: redetVal,
      total_certified: totalCertifiedVal,
      retention_iibb: iibbVal,
      retention_imp_cheque: chequeVal,
      other_retentions: otherVal,
      net_deposit: netVal,
      status: 'pending',
    });

    setShowNewCertModal(false);
    setCertNumber('');
    setPeriod('');
    setGross('');
    setRedet('');
    setRetIibb('');
    setRetCheque('');
    setRetOther('');
  };

  const handlePayCert = async () => {
    if (!showPayModal || !bankAccountId || !depositDate) return;
    await updateCert.mutateAsync({
      id: showPayModal.id,
      status: 'deposited',
      deposit_bank_account_id: bankAccountId,
      deposit_date: depositDate,
    });
    setShowPayModal(null);
    setBankAccountId('');
    setDepositDate('');
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Certificaciones e Ingresos</h3>
        <button onClick={() => setShowNewCertModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all">
          <Plus size={14} /> Registrar Certificado
        </button>
      </div>

      {loadingCerts ? (
        <div className="text-center py-6 text-gray-400 text-sm">Cargando certificados...</div>
      ) : certificates.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Cert. N°</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3 text-right">Monto Bruto</th>
                <th className="px-4 py-3 text-right">Redet.</th>
                <th className="px-4 py-3 text-right">Retenciones</th>
                <th className="px-4 py-3 text-right">Neto A Cobrar</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-xs text-gray-700">
              {certificates.map(cert => {
                const totalRetentions = (cert.retention_iibb || 0) + (cert.retention_imp_cheque || 0) + (cert.other_retentions || 0);

                return (
                  <tr key={cert.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-800 font-sans">
                      #{cert.certificate_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-sans">
                      {cert.period_description || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800">
                      ${cert.gross_amount.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      +${(cert.redetermination || 0).toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">
                      -${totalRetentions.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">
                      ${cert.net_deposit.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cert.status === 'deposited' ? 'bg-green-100 text-green-700' :
                        cert.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        cert.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cert.status === 'deposited' ? 'Cobrado' :
                         cert.status === 'approved' ? 'Aprobado' :
                         cert.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      {cert.status !== 'deposited' && cert.status !== 'rejected' && (
                        <button onClick={() => setShowPayModal(cert)} className="bg-emerald-600 text-white px-2 py-1 rounded font-bold text-[10px] hover:bg-emerald-700 transition-all">
                          Registrar Cobro
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <FileCheck size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin certificados registrados</p>
          <p className="text-sm">Registrá los certificados de obra correspondientes para su liquidación.</p>
        </div>
      )}

      {/* Modal Registrar Certificado */}
      {showNewCertModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileCheck size={18} className="text-indigo-600" /> Registrar Certificado de Obra
              </h3>
              <button onClick={() => setShowNewCertModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">N° Certificado *</label>
                  <input type="number" value={certNumber} onChange={e => setCertNumber(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Período / Detalle *</label>
                  <input type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" placeholder="Ej: Mayo 2026" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Monto Bruto Básico *</label>
                  <input type="number" min="0" step="any" value={gross} onChange={e => setGross(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Redetermination Provisoria</label>
                  <input type="number" min="0" step="any" value={redet} onChange={e => setRedet(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-t border-gray-100 pt-3">Retenciones Impositivas y de Garantía</p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Ret. IIBB</label>
                  <input type="number" min="0" step="any" value={retIibb} onChange={e => setRetIibb(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Imp. Cheque</label>
                  <input type="number" min="0" step="any" value={retCheque} onChange={e => setRetCheque(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Otras Retenciones</label>
                  <input type="number" min="0" step="any" value={retOther} onChange={e => setRetOther(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <button onClick={handleSaveCert} disabled={!certNumber || !period || !gross || createCert.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2">
                {createCert.isPending ? 'Guardando...' : 'Guardar y Registrar Certificado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Cobro */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" /> Registrar Cobro de Certificado #{showPayModal.certificate_number}
              </h3>
              <button onClick={() => setShowPayModal(null)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
              <p>Monto Neto a Acreditar: <strong className="font-mono">${showPayModal.net_deposit.toLocaleString('es-AR')}</strong></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Cuenta Bancaria de Destino *</label>
                <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none">
                  <option value="">Seleccionar cuenta...</option>
                  {bankAccounts.map((acc: BankAccount) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank_name || 'Sin banco'}) — CBU: {acc.cbu || 'S/D'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Fecha de Acreditación / Depósito *</label>
                <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none" />
              </div>

              <button onClick={handlePayCert} disabled={!bankAccountId || !depositDate || updateCert.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2">
                {updateCert.isPending ? 'Confirmando...' : 'Confirmar Cobro y Acreditación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
