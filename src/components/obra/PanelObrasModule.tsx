import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, Search, AlertTriangle,
  Clock, ShieldAlert, ShoppingBag,
  MapPin, ChevronRight
} from 'lucide-react';
import { useProjects, useCreateProject, useWbsElements, usePurchaseRequests, useNonConformities } from '../../hooks/useData';
import { useProjectMilestones } from '../../hooks/useObraData';
import { useAppStore } from '../../store/useStore';
import { useModalStore } from '../../store/useModalStore';

export const PanelObrasModule: React.FC = () => {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const { setActiveModule, setActiveProjectId } = useAppStore();
  const { data: allWbs = [] } = useWbsElements();
  const { data: allMilestones = [] } = useProjectMilestones();
  const { data: purchaseRequests = [] } = usePurchaseRequests();
  const { data: nonConformities = [] } = useNonConformities();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'active' | 'suspended' | 'completed'>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    client_name: '',
    location: '',
    budget_ars: '',
    contract_amount: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  // KPI Calculations
  const activeProjects = projects.filter(p => (p.status || 'active') === 'active');

  // Critical alerts
  const openNCs = nonConformities.filter(nc => nc.status === 'abierta' || nc.status === 'en_analisis');
  const criticalOrders = purchaseRequests.filter(pr => pr.urgency === 'urgent' && pr.status !== 'received');
  const milestonesAtRisk = allMilestones.filter(m => m.estado === 'en_riesgo' || m.estado === 'vencido');

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.client_name && p.client_name.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q));
      
      const pStatus = p.status || 'active';
      const matchesStatus = statusFilter === 'todos' || pStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveModule('obra_gestion');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    try {
      const newProj = await createProject.mutateAsync({
        name: createForm.name.trim(),
        client_name: createForm.client_name.trim() || null,
        location: createForm.location.trim() || null,
        budget_ars: parseFloat(createForm.budget_ars) || 0,
        contract_amount: parseFloat(createForm.contract_amount) || parseFloat(createForm.budget_ars) || 0,
        start_date: createForm.start_date || null,
        status: 'active',
      } as any);

      setShowCreateModal(false);
      setCreateForm({ name: '', client_name: '', location: '', budget_ars: '', contract_amount: '', start_date: new Date().toISOString().split('T')[0] });
      useModalStore.getState().showAlert('Obra Creada', `La obra "${createForm.name}" ha sido creada con éxito.`);
      if (newProj?.id) {
        handleOpenProject(newProj.id);
      }
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', 'No se pudo crear la obra: ' + err.message);
    }
  };

  const formatARS = (n: number) => {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    return `$${n.toLocaleString('es-AR')}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Header & Title ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span>🏗️</span> Gerencia de Obras · Panel de Obras (Nivel 1)
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Consola Ejecutiva de Cartera de Obras
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              Supervisión en tiempo real de todos los proyectos activos, desvíos de plazo, hitos críticos, pedidos y calidad para toma de decisiones ágiles.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold py-3 px-5 shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-2"
          >
            <Plus size={18} /> Nueva Obra
          </button>
        </div>
      </div>

      {/* ─── Executive Metrics Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Obras Activas</span>
            <span className="text-2xl font-extrabold text-gray-900">{activeProjects.length}</span>
            <span className="text-[11px] text-gray-500 block">de {projects.length} totales</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Hitos en Riesgo</span>
            <span className="text-2xl font-extrabold text-amber-600">{milestonesAtRisk.length}</span>
            <span className="text-[11px] text-gray-500 block">requieren atención</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">No Conformidades</span>
            <span className="text-2xl font-extrabold text-red-600">{openNCs.length}</span>
            <span className="text-[11px] text-gray-500 block">abiertas en frentes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-ecar-blue flex items-center justify-center font-bold shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Pedidos Críticos</span>
            <span className="text-2xl font-extrabold text-blue-700">{criticalOrders.length}</span>
            <span className="text-[11px] text-gray-500 block">insumos en camino</span>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por obra, comitente o localidad..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['todos', 'active', 'suspended', 'completed'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              {st === 'todos' ? 'Todas' : st === 'active' ? '🟢 Activas' : st === 'suspended' ? '🟡 Suspendidas' : '🏁 Finalizadas'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Projects Grid ─── */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando portafolio de obras...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <Building2 size={48} className="mx-auto text-gray-300" />
          <h3 className="text-lg font-bold text-gray-700">No se encontraron obras</h3>
          <p className="text-sm text-gray-500">Probá modificando el término de búsqueda o el filtro de estado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(project => {
            const projectTasks = allWbs.filter(t => t.project_id === project.id);
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter(t => t.phase === 'completado').length;
            const avgProgress = totalTasks > 0
              ? Math.round(projectTasks.reduce((acc, t) => acc + (t.progress_pct || 0), 0) / totalTasks)
              : (project.advance_pct || 0);

            const projectMilestones = allMilestones.filter(m => m.project_id === project.id);
            const nextMilestone = projectMilestones.find(m => m.estado !== 'cumplido');
            const hasMilestoneRisk = projectMilestones.some(m => m.estado === 'en_riesgo' || m.estado === 'vencido');

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  {/* Top line: Status & Location */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                      project.status === 'completed'
                        ? 'bg-slate-100 text-slate-700'
                        : project.status === 'suspended'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {project.status === 'completed' ? 'Finalizada' : project.status === 'suspended' ? 'Suspendida' : 'En Ejecución'}
                    </span>

                    {project.location && (
                      <span className="text-gray-500 flex items-center gap-1 line-clamp-1">
                        <MapPin size={12} className="text-amber-500 shrink-0" />
                        {project.location}
                      </span>
                    )}
                  </div>

                  {/* Title & Client */}
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1">
                      Comitente: <span className="text-gray-700 font-bold">{project.client_name || 'No especificado'}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">Avance Físico Ponderado</span>
                      <span className="text-amber-600 font-extrabold">{avgProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, avgProgress))}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Indicators Snippet */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Presupuesto</span>
                      <span className="font-bold text-gray-800">{formatARS(project.contract_amount || project.budget_ars)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Tareas WBS</span>
                      <span className="font-bold text-gray-800">{completedTasks} / {totalTasks}</span>
                    </div>
                  </div>

                  {/* Next Milestone Warning */}
                  {nextMilestone && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      hasMilestoneRisk ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}>
                      <Clock size={14} className={hasMilestoneRisk ? 'text-red-500 shrink-0' : 'text-slate-500 shrink-0'} />
                      <div className="line-clamp-1">
                        <span className="font-bold">Próx. Hito:</span> {nextMilestone.nombre}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <button
                  onClick={() => handleOpenProject(project.id)}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-700 text-xs font-bold transition-colors border-t border-slate-200 flex items-center justify-between"
                >
                  <span>Ingresar a Gestión de Obra</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Crear Nueva Obra ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <Building2 size={20} className="text-amber-500" /> Crear Nueva Obra
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Nombre de la Obra *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Tendido Red Gas Barrio Norte"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Comitente / Cliente</label>
                  <input
                    type="text"
                    placeholder="Ej: OSSE / Municipalidad"
                    value={createForm.client_name}
                    onChange={e => setCreateForm({ ...createForm, client_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Ubicación / Localidad</label>
                  <input
                    type="text"
                    placeholder="Ej: Mar del Plata, Sector A"
                    value={createForm.location}
                    onChange={e => setCreateForm({ ...createForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Monto Contractual ($ARS)</label>
                  <input
                    type="number"
                    placeholder="Ej: 45000000"
                    value={createForm.contract_amount}
                    onChange={e => setCreateForm({ ...createForm, contract_amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Fecha Inicio Prevista</label>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={e => setCreateForm({ ...createForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending || !createForm.name.trim()}
                  className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold px-5 py-2"
                >
                  {createProject.isPending ? 'Creando...' : 'Crear Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
