import React, { useState, useMemo, useEffect } from 'react';
import {
  HardHat, Search, Plus, Package, Calculator, FolderOpen, X, Check,
  FileText, Layers, DollarSign, ChevronDown, ChevronRight,
  ArrowLeft, Eye, Edit2, Copy, Lock, Trash2, Save, RotateCcw,
  AlertTriangle, Database, Tag, Clock, Calendar, Info, Shield, Building2, ClipboardCheck,
  ShoppingCart, UploadCloud, File, Download, HelpCircle
} from 'lucide-react';
import { exportToCompras, exportToLogistica, exportToObra } from '../lib/budgetExports';
import {
  useBudgets, useCreateBudget, useUpdateBudget,
  useBudgetItems, useBudgetSections,
  useCreateBudgetSection, useCreateBudgetItem,
  useDeleteBudgetItem, useUpdateBudgetItem,
  useUpdateBudgetSection, useDeleteBudgetSection,
  useDuplicateBudget,
  useBudgetResources, useCreateBudgetResource, useUpdateBudgetResource, useDeleteBudgetResource,
  useProjects, useCreateProject,
  useItemDictionary, useSectionDictionary,
  useOpportunities,
  useBudgetFiles, useUploadBudgetFile, useDeleteBudgetFile,
  useCreatePurchaseRequest,
  useProfiles, useCopyOpportunityFilesToBudget,
  usePurchaseInvoices
} from '../hooks/useData';
import { exportBudgetPdf } from '../lib/pdfExport';
import { useModalStore } from '../store/useModalStore';

/* ━━━ Formatters ━━━ */
const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

/* ━━━ Constantes ━━━ */
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Borrador',    color: 'text-blue-700',   bg: 'bg-blue-100' },
  revision: { label: 'En Revisión', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  approved: { label: 'Aprobado',    color: 'text-green-700',  bg: 'bg-green-100' },
  closed:   { label: 'Cerrado',     color: 'text-gray-600',   bg: 'bg-gray-200' },
};

const COST_TYPE_LABELS: Record<string, { label: string; color: string; gradient: string }> = {
  material:      { label: 'Material',     color: 'bg-blue-50 text-blue-700',     gradient: 'from-blue-400 to-blue-600' },
  mano_obra:     { label: 'Mano de Obra', color: 'bg-orange-50 text-orange-700', gradient: 'from-orange-400 to-orange-600' },
  equipo:        { label: 'Equipo',       color: 'bg-slate-50 text-ecar-blue', gradient: 'from-ecar-blue to-ecar-blue' },
  subcontrato:   { label: 'Subcontrato',  color: 'bg-slate-50 text-ecar-blue',     gradient: 'from-ecar-blue to-ecar-blue' },
  gasto_general: { label: 'Gasto Gral',   color: 'bg-gray-100 text-gray-600',    gradient: 'from-gray-400 to-gray-600' },
  financiero:    { label: 'Financiero',   color: 'bg-red-50 text-red-600',       gradient: 'from-red-400 to-red-600' },
};

const WORK_TYPE_LABELS: Record<string, string> = {
  obra_nueva: 'Obra Nueva', adicional: 'Adicional', servicio: 'Servicio',
  mantenimiento: 'Mantenimiento', instalacion: 'Instalación', licitacion: 'Licitación',
  cambio_alcance: 'Cambio de Alcance', consulta: 'Consulta Interna',
};

const UNIT_OPTIONS = [
  { v: 'gl', l: 'Global' }, { v: 'm2', l: 'm²' }, { v: 'm3', l: 'm³' }, { v: 'ml', l: 'ml' },
  { v: 'kg', l: 'kg' }, { v: 'tn', l: 'tn' }, { v: 'un', l: 'Unidad' }, { v: 'hs', l: 'Horas' },
  { v: 'mes', l: 'Mes' }, { v: 'día', l: 'Día' }, { v: 'km', l: 'km' }, { v: 'lt', l: 'Litros' },
];

type ViewMode = 'list' | 'detail' | 'resources';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COMPONENTE PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const ProjectBudgetModule: React.FC = () => {
  const { data: budgets, isLoading } = useBudgets();
  const { data: projects } = useProjects();
  const { data: opportunities } = useOpportunities();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const duplicateBudget = useDuplicateBudget();
  const createProject = useCreateProject();

  const [view, setView] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [newForm, setNewForm] = useState({
    name: '', description: '', project_id: '', opportunity_id: '',
    gastos_generales_pct: '10', beneficio_pct: '10', financieros_pct: '3',
    impuestos_pct: '21', iibb_pct: '3.5',
    assumptions: '', exclusions: '', validity_days: '15', work_type: 'obra_nueva',
  });
  const [newProjectName, setNewProjectName] = useState('');

  const selectedBudget = useMemo(() => (budgets || []).find(b => b.id === selectedId), [budgets, selectedId]);

  // Stats
  const totalBudgets = (budgets || []).length;
  const draftCount = (budgets || []).filter(b => b.status === 'draft').length;
  const approvedCount = (budgets || []).filter(b => b.status === 'approved').length;
  const totalValue = (budgets || []).reduce((s, b) => s + (b.total_final_ars || 0), 0);

  const budgetChains = useMemo(() => {
    const list = budgets || [];
    const chains: Record<string, any[]> = {};
    
    const parentMap: Record<string, string> = {};
    list.forEach(b => {
       if (b.parent_version_id) parentMap[b.id] = b.parent_version_id;
    });
    
    const findRoot = (id: string): string => {
       let current = id;
       // Prevent infinite loop in case of circular references
       const seen = new Set<string>();
       while (parentMap[current] && !seen.has(current)) {
         seen.add(current);
         current = parentMap[current];
       }
       return current;
    };
    
    list.forEach(b => {
      const rootId = findRoot(b.id);
      if (!chains[rootId]) chains[rootId] = [];
      chains[rootId].push(b);
    });
    
    Object.values(chains).forEach(chain => {
       chain.sort((a, b) => b.version - a.version);
    });
    
    return chains;
  }, [budgets]);

  const filtered = useMemo(() => {
    let list = Object.values(budgetChains).map(chain => chain[0]).filter(Boolean);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || (b.project?.name || '').toLowerCase().includes(q));
    }
    if (filterStatus) list = list.filter(b => b.status === filterStatus);
    return list;
  }, [budgetChains, search, filterStatus]);

  const handleCreateBudget = async () => {
    if (!newForm.name.trim()) return;
    let projectId: string | null = newForm.project_id || null;
    let opportunityId: string | null = newForm.opportunity_id || null;
    // If user chose to create a new project, create it first
    if (newForm.project_id === '___new___' && newProjectName.trim()) {
      const newProj = await createProject.mutateAsync({ name: newProjectName.trim() });
      projectId = newProj.id;
    } else if (newForm.project_id === '___new___') {
      projectId = null; // No name typed, skip
    }
    await createBudget.mutateAsync({
      name: newForm.name,
      description: newForm.description || null,
      project_id: projectId,
      opportunity_id: opportunityId,
      gastos_generales_pct: parseFloat(newForm.gastos_generales_pct) || 0,
      beneficio_pct: parseFloat(newForm.beneficio_pct) || 0,
      financieros_pct: parseFloat(newForm.financieros_pct) || 0,
      impuestos_pct: parseFloat(newForm.impuestos_pct) || 0,
      iibb_pct: parseFloat(newForm.iibb_pct) || 0,
      assumptions: newForm.assumptions || null,
      exclusions: newForm.exclusions || null,
      validity_days: parseInt(newForm.validity_days) || 15,
      work_type: newForm.work_type as any,
      created_by: 'Colaborador',
    } as any);
    setShowNew(false);
    setNewProjectName('');
    setNewForm({
      name: '', description: '', project_id: '', opportunity_id: '',
      gastos_generales_pct: '10', beneficio_pct: '10', financieros_pct: '3',
      impuestos_pct: '21', iibb_pct: '3.5',
      assumptions: '', exclusions: '', validity_days: '15', work_type: 'obra_nueva',
    });
  };

  const handleDuplicate = async (budgetId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await duplicateBudget.mutateAsync(budgetId);
    // Auto-cerrar la versión anterior si no estaba ya cerrada
    const oldBudget = budgets?.find(b => b.id === budgetId);
    if (oldBudget && oldBudget.status !== 'closed' && oldBudget.status !== 'approved') {
      await updateBudget.mutateAsync({ id: budgetId, status: 'closed' });
    }
    setSelectedId(result.id);
    setView('detail');
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin" />
    </div>
  );

  // Preserve view for className comparisons (avoid TS narrowing after early return)
  const currentView: ViewMode = view;

  // ======== RESOURCES VIEW ========
  if (view === 'resources') {
    return <ResourcesPanel onBack={() => setView('list')} />;
  }

  // ======== DETAIL VIEW ========
  if (view === 'detail' && selectedBudget) {
    return (
      <BudgetDetailView
        budget={selectedBudget}
        allVersions={Object.values(budgetChains).find(c => c.some((b: any) => b.id === selectedBudget.id)) || [selectedBudget]}
        onSelectVersion={(id: string) => setSelectedId(id)}
        onBack={() => { setSelectedId(null); setView('list'); }}
        onDuplicate={() => handleDuplicate(selectedBudget.id)}
        updateBudget={updateBudget}
      />
    );
  }

  // ======== LIST VIEW ========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-ecar-blueDark via-ecar-blue to-ecar-blue rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 opacity-[0.07]"><HardHat size={180} strokeWidth={1} /></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
        <div className="relative z-10">
          <h3 className="font-black text-2xl flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm p-2 rounded-xl"><HardHat size={22} /></div>
            Proyectos & Presupuestos
          </h3>
          <p className="text-ecar-blueLight text-sm mt-1.5">Cómputos métricos, análisis de precios, versiones y control presupuestario <span className="text-ecar-blueLight/60 font-mono text-xs">(PR-GPP-01)</span></p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'list' ? 'bg-white text-ecar-blueDark shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              <FileText size={13} className="inline mr-1" />Presupuestos
            </button>
            <button onClick={() => setView('resources')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'resources' ? 'bg-white text-ecar-blueDark shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              <Database size={13} className="inline mr-1" />Banco de Precios
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: 'Total', value: totalBudgets, color: 'cyan', iconColor: 'text-ecar-blue' },
          { icon: Edit2, label: 'Borradores', value: draftCount, color: 'blue', iconColor: 'text-blue-500' },
          { icon: Check, label: 'Aprobados', value: approvedCount, color: 'green', iconColor: 'text-green-500' },
          { icon: DollarSign, label: 'Valor Total', value: fmt(totalValue), color: 'emerald', iconColor: 'text-emerald-500', isMoney: true },
        ].map((kpi, i) => (
          <div key={i} className={`light-card p-5 hover:shadow-md transition-all duration-300 ${kpi.color === 'blue' ? 'border-blue-200 bg-blue-50/20' : kpi.color === 'green' ? 'border-green-200 bg-green-50/20' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2">
              <kpi.icon size={16} className={kpi.iconColor} />{kpi.label}
            </div>
            <p className={`${kpi.isMoney ? 'text-xl' : 'text-2xl'} font-black ${kpi.color === 'cyan' ? 'text-ecar-blue' : kpi.color === 'blue' ? 'text-blue-600' : kpi.color === 'green' ? 'text-green-600' : 'text-gray-800'} font-mono`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o proyecto..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white hover:border-gray-400 transition-all cursor-pointer">
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-gradient-to-r from-ecar-blue to-ecar-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-ecar-blue/20 hover:shadow-ecar-blue/40 hover:scale-[1.02] transition-all active:scale-[0.98]">
          <Plus size={16} /> Nuevo Presupuesto
        </button>
      </div>

      {/* New Budget Form */}
      {showNew && (
        <div className="bg-white border-2 border-ecar-blueLight rounded-2xl p-6 shadow-lg space-y-4 animate-in">
          <h4 className="font-bold text-gray-800 flex items-center gap-2 text-lg"><Plus size={18} className="text-ecar-blue" /> Nuevo Presupuesto</h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre *</label>
              <input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" placeholder="Ej: Presupuesto Barrio Norte - Etapa 1" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Proyecto</label>
              <select value={newForm.project_id} onChange={e => { setNewForm({ ...newForm, project_id: e.target.value, opportunity_id: '' }); if (e.target.value !== '___new___') setNewProjectName(''); }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" disabled={!!newForm.opportunity_id}>
                <option value="">Sin asignar</option>
                {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="___new___">➕ Crear nuevo proyecto...</option>
              </select>
              {newForm.project_id === '___new___' && (
                <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-dashed border-ecar-blue rounded-xl text-sm bg-slate-50/30 focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                  placeholder="Nombre del nuevo proyecto..." autoFocus />
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Oportunidad (CRM)</label>
              <select value={newForm.opportunity_id} onChange={e => setNewForm({ ...newForm, opportunity_id: e.target.value, project_id: '' })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" disabled={!!newForm.project_id}>
                <option value="">Sin asignar</option>
                {(opportunities || []).map((o: any) => <option key={o.id} value={o.id}>{o.client_name} - {o.description?.substring(0,20)}...</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo de Trabajo</label>
              <select value={newForm.work_type} onChange={e => setNewForm({ ...newForm, work_type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm">
                {Object.entries(WORK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descripción / Aclaraciones Técnicas</label>
            <textarea value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Incluir descripción general del alcance..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Info size={11} /> Supuestos</label>
              <textarea value={newForm.assumptions} onChange={e => setNewForm({ ...newForm, assumptions: e.target.value })}
                rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Condiciones asumidas para presupuestar: acceso, plazo, disponibilidad..." />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><AlertTriangle size={11} /> Exclusiones</label>
              <textarea value={newForm.exclusions} onChange={e => setNewForm({ ...newForm, exclusions: e.target.value })}
                rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm" placeholder="Tareas, ítems o condiciones que NO están incluidos..." />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3">
            {[
              { key: 'gastos_generales_pct', label: 'GG %' },
              { key: 'beneficio_pct', label: 'Beneficio %' },
              { key: 'financieros_pct', label: 'Financieros %' },
              { key: 'impuestos_pct', label: 'IVA %' },
              { key: 'iibb_pct', label: 'IIBB %' },
              { key: 'validity_days', label: 'Validez (días)' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold text-gray-500">{f.label}</label>
                <input type="number" step="0.1" value={(newForm as any)[f.key]}
                  onChange={e => setNewForm({ ...newForm, [f.key]: e.target.value })}
                  className="w-full px-2 py-2.5 border border-gray-300 rounded-xl text-sm font-mono text-center" />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleCreateBudget} disabled={createBudget.isPending || !newForm.name.trim()}
              className="bg-gradient-to-r from-ecar-blue to-ecar-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 shadow-md hover:shadow-lg transition-all">
              <Check size={14} className="inline mr-1.5" />Crear Presupuesto
            </button>
            <button onClick={() => setShowNew(false)} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
              <X size={14} className="inline mr-1" />Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80">
          <h3 className="font-bold text-gray-800">Presupuestos Registrados</h3>
        </div>
        {filtered.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Presupuesto</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-3 py-3 text-center">Tipo</th>
                <th className="px-3 py-3 text-center">Versión</th>
                <th className="px-3 py-3 text-center">Estado</th>
                <th className="px-3 py-3 text-right">Total Final</th>
                <th className="px-3 py-3 text-center">Creado por</th>
                <th className="px-3 py-3 text-center">Fecha</th>
                <th className="px-3 py-3 text-center">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(budget => {
                const stat = STATUS_MAP[budget.status] || STATUS_MAP.draft;
                return (
                  <tr key={budget.id} className="hover:bg-slate-50/30 cursor-pointer transition-colors" onClick={() => openDetail(budget.id)}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="flex flex-col">
                        <span className="font-semibold">{budget.name}</span>
                        {budget.description && <span className="text-xs text-gray-500 font-normal truncate max-w-[300px]">{budget.description}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {budget.project?.name ? (<span className="flex items-center gap-1.5"><FolderOpen size={14} className="text-ecar-blue" />{budget.project.name}</span>) : budget.opportunity?.client_name ? (<span className="flex items-center gap-1.5"><Layers size={14} className="text-amber-500" />{budget.opportunity.client_name} - Oportunidad</span>) : (<span className="text-gray-400 text-xs">Sin asignar</span>)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {WORK_TYPE_LABELS[(budget as any).work_type] || 'Obra Nueva'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="font-mono text-xs font-bold text-gray-600">v{budget.version}</div>
                      {(() => {
                        const chain = Object.values(budgetChains).find(c => c.some((b: any) => b.id === budget.id));
                        return chain && chain.length > 1 ? (
                          <div className="text-[9px] font-normal text-gray-400 mt-0.5">({chain.length} versiones)</div>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${stat.bg} ${stat.color}`}>{stat.label}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-gray-800">{fmt(budget.total_final_ars)}</td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500">{budget.created_by || '—'}</td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500">{fmtDate(budget.created_at)}</td>
                    <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={(e) => handleDuplicate(budget.id, e)} title="Duplicar como nueva versión"
                        className="text-gray-400 hover:text-ecar-blue transition-colors p-1 rounded-lg hover:bg-slate-50">
                        <Copy size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay presupuestos</p>
            <p className="text-sm">Hacé clic en "Nuevo Presupuesto" para comenzar a estimar.</p>
          </div>
        )}
      </div>
    </div>
  );
};


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VISTA DETALLE DEL PRESUPUESTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const BudgetDetailView: React.FC<{
  budget: any;
  allVersions: any[];
  onSelectVersion: (id: string) => void;
  onBack: () => void;
  onDuplicate: () => void;
  updateBudget: any;
}> = ({ budget, allVersions, onSelectVersion, onBack, onDuplicate, updateBudget }) => {
  const { data: sections = [] } = useBudgetSections(budget.id);
  const { data: items = [] } = useBudgetItems(budget.id);
  const { data: allResources = [] } = useBudgetResources();
  const { data: itemDict = [] } = useItemDictionary();
  const { data: sectionDict = [] } = useSectionDictionary();
  const createSection = useCreateBudgetSection();
  const createItem = useCreateBudgetItem();
  const deleteItem = useDeleteBudgetItem();
  const updateItem = useUpdateBudgetItem();
  const updateSection = useUpdateBudgetSection();
  const deleteSection = useDeleteBudgetSection();
  const { data: profiles = [] } = useProfiles();
  const createProject = useCreateProject();
  const copyOppFiles = useCopyOpportunityFilesToBudget();

  const [showAdjudicarModal, setShowAdjudicarModal] = useState(false);
  const [adjudicarData, setAdjudicarData] = useState({
    name: '', client_name: '', manager_id: '', startup_folder_notes: '', start_date: '', end_date: ''
  });

  const handleOpenAdjudicar = () => {
    setAdjudicarData({
      name: budget.name,
      client_name: budget.opportunity?.client_name || '',
      manager_id: '',
      startup_folder_notes: [
        budget.description ? `DESCRIPCIÓN:\n${budget.description}` : '',
        (budget as any).assumptions ? `SUPUESTOS:\n${(budget as any).assumptions}` : '',
        (budget as any).exclusions ? `EXCLUSIONES:\n${(budget as any).exclusions}` : ''
      ].filter(Boolean).join('\n\n'),
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
    setShowAdjudicarModal(true);
  };

  const handleAdjudicar = async () => {
    if (!adjudicarData.name.trim()) return;
    try {
      const proj = await createProject.mutateAsync({
        name: adjudicarData.name,
        client_name: adjudicarData.client_name,
        manager_id: adjudicarData.manager_id || null,
        startup_folder_notes: adjudicarData.startup_folder_notes,
        start_date: adjudicarData.start_date || null,
        end_date: adjudicarData.end_date || null,
        status: 'active',
        budget_ars: budget.total_final_ars || 0
      });
      if (proj && proj.id) {
        await updateBudget.mutateAsync({ id: budget.id, project_id: proj.id, status: 'approved' });
        
        // Copy files from opportunity if opportunity exists
        if (budget.opportunity_id) {
          await copyOppFiles.mutateAsync({ opportunityId: budget.opportunity_id, budgetId: budget.id });
        }

        useModalStore.getState().showAlert('Éxito', 'Proyecto creado y presupuesto adjudicado.');
        setShowAdjudicarModal(false);
      }
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message || 'Error al crear proyecto');
    }
  };

  const [showNewItem, setShowNewItem] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSection, setNewSection] = useState({ ordinal: '', name: '' });
  const [newItem, setNewItem] = useState({ description: '', unit: 'gl', quantity: '1', unit_price_ars: '0', cost_type: 'material', notes: '', section_id: '', resource_id: '' });
  const [machineryList, setMachineryList] = useState<{name: string, hours: string}[]>([]);
  const [newMachinery, setNewMachinery] = useState({ name: '', hours: '' });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionData, setEditSectionData] = useState({ ordinal: '', name: '' });
  const [showInfo, setShowInfo] = useState(true);
  const [editingPcts, setEditingPcts] = useState(false);
  const [pctForm, setPctForm] = useState({ gastos_generales_pct: '', beneficio_pct: '', financieros_pct: '', impuestos_pct: '', iibb_pct: '' });

  // Nuevos hooks para adjuntos y pestañas
  const { data: budgetFiles = [] } = useBudgetFiles(budget.id);
  const uploadFile = useUploadBudgetFile();
  const deleteFile = useDeleteBudgetFile();
  
  const createPurchaseRequest = useCreatePurchaseRequest();

  const [activeTab, setActiveTab] = useState<'general' | 'entrada' | 'computo' | 'adjuntos' | 'cierre'>('computo');
  const [uploading, setUploading] = useState(false);
  const [fileTitle, setFileTitle] = useState('');
  const [fileCategory, setFileCategory] = useState('General');
  
  // Handoff checklist
  const HANDOFF_ITEMS = [
    { key: 'alcance', label: 'Alcance definido y documentado', desc: 'Descripción clara de qué incluye el trabajo, límites y condiciones' },
    { key: 'computo', label: 'Cómputo métrico completo', desc: 'Medición ordenada de materiales, tareas, cantidades y recursos necesarios' },
    { key: 'supuestos', label: 'Supuestos escritos', desc: 'Condiciones asumidas para presupuestar cuando la info no es completa' },
    { key: 'exclusiones', label: 'Exclusiones definidas', desc: 'Tareas o condiciones que NO están incluidas en el presupuesto' },
    { key: 'riesgos', label: 'Riesgos identificados', desc: 'Riesgos técnicos, económicos, de plazo o logísticos detectados' },
    { key: 'aprobacion_gg', label: 'Propuesta aprobada por GG', desc: 'Gerencia General validó margen, riesgo y condiciones' },
    { key: 'planilla_materiales', label: 'Planilla de materiales para Compras', desc: 'Listado con cantidades, especificaciones y prioridad de compra' },
    { key: 'recursos_criticos', label: 'Recursos críticos identificados', desc: 'Equipos, herramientas, materiales especiales o plazos de entrega largos' },
    { key: 'plazos_obras', label: 'Plazos validados con Obras', desc: 'Obras confirmó que los tiempos de ejecución son realistas' },
    { key: 'metodologia', label: 'Metodología constructiva consultada', desc: 'Se consultó a Obras cómo se ejecutará la tarea' },
    { key: 'disponibilidad_logistica', label: 'Disponibilidad logística verificada', desc: 'Logística confirmó equipos, vehículos, herramientas y stock disponible' },
    { key: 'contactos', label: 'Contactos clave definidos', desc: 'Referentes del proyecto: cliente, inspección, proveedores' },
  ];
  const handoffChecklist: Record<string, boolean> = budget.handoff_checklist || {};
  const handoffComplete = HANDOFF_ITEMS.every(item => handoffChecklist[item.key]);
  const handoffProgress = HANDOFF_ITEMS.filter(item => handoffChecklist[item.key]).length;
  const toggleHandoff = async (key: string) => {
    const updated = { ...handoffChecklist, [key]: !handoffChecklist[key] };
    await updateBudget.mutateAsync({ id: budget.id, handoff_checklist: updated });
  };

  const handleSendToCompras = async () => {
    const comprasItems = items.filter(
      (i: any) => i.cost_type === 'material' || i.cost_type === 'subcontrato'
    );
    if (comprasItems.length === 0) {
      useModalStore.getState().showAlert('Aviso', 'No hay materiales o subcontratos para enviar a Compras.');
      return;
    }
    if (!budget.project_id) {
      useModalStore.getState().showAlert('Atención', 'El presupuesto debe estar asignado a un proyecto para enviar a Compras.');
      return;
    }

    try {
      await createPurchaseRequest.mutateAsync({
        project_id: budget.project_id,
        urgency: 'normal',
        status: 'pending',
        items: comprasItems.map((i: any) => ({
          description: i.description + (i.notes ? ` - ${i.notes}` : ` (Rubro: ${i.section_id || 'Gral'})`),
          quantity: i.quantity,
          unit: i.unit || 'un',
          budget_item_id: i.id,
          estimated_unit_cost: i.unit_price_ars || 0
        }))
      });
      useModalStore.getState().showAlert('Éxito', 'Solicitud enviada a Compras exitosamente.');
    } catch (e) {
      console.error(e);
      useModalStore.getState().showAlert('Error', 'Error al enviar solicitud a Compras.');
    }
  };

  const handleSendToLogistica = async () => {
    const logisticaItems = items.filter((i: any) => i.cost_type === 'equipo');
    if (logisticaItems.length === 0) {
      useModalStore.getState().showAlert('Aviso', 'No hay equipos para enviar a Logística.');
      return;
    }
    if (!budget.project_id) {
      useModalStore.getState().showAlert('Atención', 'El presupuesto debe estar asignado a un proyecto para solicitar equipos.');
      return;
    }

    try {
      // Usamos PurchaseRequest como workaround técnico actual para bandeja de pedidos
      await createPurchaseRequest.mutateAsync({
        project_id: budget.project_id,
        urgency: 'normal',
        status: 'pending',
        items: logisticaItems.map((i: any) => ({
          description: i.description + (i.notes ? ` [REQUERIMIENTO LOGÍSTICO] - ${i.notes}` : ` [REQUERIMIENTO LOGÍSTICO]`),
          quantity: i.quantity,
          unit: i.unit || 'un'
        }))
      });
      useModalStore.getState().showAlert('Éxito', 'Solicitud enviada a Logística exitosamente.');
    } catch (e) {
      console.error(e);
      useModalStore.getState().showAlert('Error', 'Error al enviar solicitud a Logística.');
    }
  };

  const isLocked = budget.status === 'approved' || budget.status === 'closed';
  const stat = STATUS_MAP[budget.status] || STATUS_MAP.draft;

  // Calculations
  const directTotal = items.reduce((s: number, i: any) => s + i.quantity * i.unit_price_ars, 0);
  const gg = directTotal * (budget.gastos_generales_pct / 100);
  const beneficio = directTotal * (budget.beneficio_pct / 100);
  const subtotal = directTotal + gg + beneficio;
  const financiero = subtotal * (budget.financieros_pct / 100);
  const iva = subtotal * (budget.impuestos_pct / 100);
  const iibb = subtotal * (budget.iibb_pct / 100);
  const totalFinal = subtotal + financiero + iva + iibb;

  // Sync totalFinal to DB if it changes
  useEffect(() => {
    if (budget && Math.abs((budget.total_final_ars || 0) - totalFinal) > 0.01) {
      updateBudget.mutate({ id: budget.id, total_final_ars: totalFinal });
    }
  }, [totalFinal, budget?.id]);

  // Items grouped by section
  const itemsBySection = useMemo(() => {
    const map: Record<string, typeof items> = { _nosection: [] };
    sections.forEach((s: any) => { map[s.id] = []; });
    items.forEach((item: any) => {
      const key = item.section_id || '_nosection';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items, sections]);

  // Cost breakdown
  const costBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    items.forEach((item: any) => {
      const key = item.cost_type || 'material';
      breakdown[key] = (breakdown[key] || 0) + (item.quantity * item.unit_price_ars);
    });
    return breakdown;
  }, [items]);

  const handleCreateSection = async () => {
    if (!newSection.name.trim()) return;
    await createSection.mutateAsync({ budget_id: budget.id, ordinal: newSection.ordinal || String(sections.length + 1), name: newSection.name, sort_order: sections.length });
    setShowNewSection(false);
    setNewSection({ ordinal: '', name: '' });
  };

  const handleCreateItem = async () => {
    if (!newItem.description.trim()) return;

    let finalNotes = newItem.notes || '';
    if (machineryList.length > 0) {
      const machineryText = machineryList.map(m => `- ${m.name}: ${m.hours} hs`).join('\n');
      finalNotes = finalNotes ? `${finalNotes}\n\nMaquinaria requerida:\n${machineryText}` : `Maquinaria requerida:\n${machineryText}`;
    }

    await createItem.mutateAsync({
      budget_id: budget.id,
      section_id: newItem.section_id || (sections.length > 0 ? sections[0].id : null),
      description: newItem.description,
      unit: newItem.unit,
      quantity: parseFloat(newItem.quantity) || 1,
      unit_price_ars: parseFloat(newItem.unit_price_ars) || 0,
      cost_type: newItem.cost_type as any,
      notes: finalNotes || null,
      sort_order: items.length,
    } as any);
    setShowNewItem(false);
    setNewItem({ description: '', unit: 'gl', quantity: '1', unit_price_ars: '0', cost_type: 'material', notes: '', section_id: '', resource_id: '' });
    setMachineryList([]);
  };

  const handleResourceSelect = (resourceId: string) => {
    if (!resourceId) {
      setNewItem({ ...newItem, resource_id: '' });
      return;
    }
    const res = allResources.find((r: any) => r.id === resourceId);
    if (res) {
      setNewItem({
        ...newItem,
        resource_id: resourceId,
        description: res.name,
        unit: res.unit,
        unit_price_ars: String(res.unit_price_ars),
        cost_type: res.resource_type === 'mano_obra' ? 'mano_obra' : res.resource_type === 'equipo' ? 'equipo' : res.resource_type === 'subcontrato' ? 'subcontrato' : 'material',
      });
    }
  };

  const startEditItem = (item: any) => {
    if (isLocked) return;
    setEditingItemId(item.id);
    setEditItem({ description: item.description, unit: item.unit, quantity: String(item.quantity), unit_price_ars: String(item.unit_price_ars), cost_type: item.cost_type, notes: item.notes || '', section_id: item.section_id || '' });
  };

  const saveEditItem = async () => {
    if (!editingItemId || !editItem) return;
    await updateItem.mutateAsync({
      id: editingItemId,
      description: editItem.description,
      unit: editItem.unit,
      quantity: parseFloat(editItem.quantity) || 0,
      unit_price_ars: parseFloat(editItem.unit_price_ars) || 0,
      cost_type: editItem.cost_type as any,
      notes: editItem.notes || null,
      section_id: editItem.section_id || null,
    });
    setEditingItemId(null);
    setEditItem(null);
  };

  const startEditSection = (sec: any) => {
    if (isLocked) return;
    setEditingSectionId(sec.id);
    setEditSectionData({ ordinal: sec.ordinal, name: sec.name });
  };

  const saveEditSection = async () => {
    if (!editingSectionId) return;
    await updateSection.mutateAsync({ id: editingSectionId, ordinal: editSectionData.ordinal, name: editSectionData.name });
    setEditingSectionId(null);
  };

  const handleDeleteSection = async (secId: string) => {
    if (!await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar este rubro? Los ítems quedarán sin rubro asignado.')) return;
    await deleteSection.mutateAsync(secId);
  };

  const startEditPcts = () => {
    setPctForm({
      gastos_generales_pct: String(budget.gastos_generales_pct),
      beneficio_pct: String(budget.beneficio_pct),
      financieros_pct: String(budget.financieros_pct),
      impuestos_pct: String(budget.impuestos_pct),
      iibb_pct: String(budget.iibb_pct),
    });
    setEditingPcts(true);
  };

  const savePcts = async () => {
    await updateBudget.mutateAsync({
      id: budget.id,
      gastos_generales_pct: parseFloat(pctForm.gastos_generales_pct) || 0,
      beneficio_pct: parseFloat(pctForm.beneficio_pct) || 0,
      financieros_pct: parseFloat(pctForm.financieros_pct) || 0,
      impuestos_pct: parseFloat(pctForm.impuestos_pct) || 0,
      iibb_pct: parseFloat(pctForm.iibb_pct) || 0,
    });
    setEditingPcts(false);
  };

  const handleStatusChange = (newStatus: string) => {
    const updates: any = { id: budget.id, status: newStatus };
    if (newStatus === 'approved') {
      updates.approved_by = 'GG';
      updates.approved_at = new Date().toISOString();
    }
    updateBudget.mutate(updates);
  };

  // Render item row (view or edit mode)
  const renderItemRow = (item: any) => {
    const ct = COST_TYPE_LABELS[item.cost_type] || COST_TYPE_LABELS.material;
    const isEditing = editingItemId === item.id;

    if (isEditing && editItem) {
      return (
        <tr key={item.id} className="bg-slate-50/50 border-l-2 border-ecar-blue">
          <td className="px-4 py-2">
            <input value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })}
              className="w-full px-2 py-1.5 border border-ecar-blueLight rounded-lg text-sm" />
            <input value={editItem.notes} onChange={e => setEditItem({ ...editItem, notes: e.target.value })}
              placeholder="Notas..." className="w-full px-2 py-1 border border-gray-200 rounded-lg text-[10px] mt-1" />
          </td>
          <td className="px-2 py-2">
            <select value={editItem.cost_type} onChange={e => setEditItem({ ...editItem, cost_type: e.target.value })}
              className="w-full px-1 py-1.5 border border-gray-200 rounded-lg text-[10px]">
              {Object.entries(COST_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </td>
          <td className="px-2 py-2">
            <select value={editItem.unit} onChange={e => setEditItem({ ...editItem, unit: e.target.value })}
              className="w-full px-1 py-1.5 border border-gray-200 rounded-lg text-[10px]">
              {UNIT_OPTIONS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
            </select>
          </td>
          <td className="px-2 py-2">
            <input type="number" value={editItem.quantity} onChange={e => setEditItem({ ...editItem, quantity: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-mono text-right" style={{ width: '80px' }} />
          </td>
          <td className="px-2 py-2">
            <input type="number" value={editItem.unit_price_ars} onChange={e => setEditItem({ ...editItem, unit_price_ars: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-mono text-right" style={{ width: '100px' }} />
          </td>
          <td className="px-3 py-2 text-right font-mono font-bold text-sm text-ecar-blue">
            {fmt((parseFloat(editItem.quantity) || 0) * (parseFloat(editItem.unit_price_ars) || 0))}
          </td>
          <td className="px-2 py-2">
            <select value={editItem.section_id} onChange={e => setEditItem({ ...editItem, section_id: e.target.value })}
              className="w-full px-1 py-1 border border-gray-200 rounded text-[9px]">
              <option value="">Sin rubro</option>
              {sections.map((s: any) => <option key={s.id} value={s.id}>{s.ordinal} — {s.name}</option>)}
            </select>
          </td>
          <td className="px-2 py-2 text-center">
            <div className="flex gap-1 items-center justify-center">
              <button onClick={saveEditItem} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={14} /></button>
              <button onClick={() => { setEditingItemId(null); setEditItem(null); }} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={14} /></button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
        <td className="px-4 py-2.5">
          <span className="font-medium text-gray-800">{item.description}</span>
          {item.notes && <p className="text-[10px] text-gray-400 mt-0.5">{item.notes}</p>}
        </td>
        <td className="px-3 py-2.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ct.color}`}>{ct.label}</span></td>
        <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{item.unit}</td>
        <td className="px-3 py-2.5 text-right font-mono text-sm">{item.quantity.toLocaleString('es-AR')}</td>
        <td className="px-3 py-2.5 text-right font-mono text-sm">{fmt(item.unit_price_ars)}</td>
        <td className="px-3 py-2.5 text-right font-mono font-bold text-sm">{fmt(item.quantity * item.unit_price_ars)}</td>
        <td className="px-3 py-2.5"></td>
        <td className="px-3 py-2.5 text-center">
          {!isLocked && (
            <div className="flex gap-0.5 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEditItem(item)} className="text-gray-400 hover:text-ecar-blue p-1 rounded hover:bg-slate-50"><Edit2 size={13} /></button>
              <button onClick={() => deleteItem.mutate(item.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 size={13} /></button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 font-medium group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver a listado
      </button>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-ecar-blueDark via-ecar-blue to-ecar-blue rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-6 -right-6 opacity-[0.07]"><HardHat size={160} strokeWidth={1} /></div>
        <div className="absolute top-3 right-3 flex gap-2">
          {isLocked && <div className="bg-white/20 backdrop-blur-sm rounded-full p-2"><Lock size={16} /></div>}
          <button onClick={() => exportBudgetPdf(budget, sections, items)} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm border border-white/10">
            <FileText size={14} /> PDF
          </button>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 flex-wrap pr-20">
            <h3 className="font-black text-xl">{budget.name}</h3>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${stat.bg} ${stat.color}`}>{stat.label}</span>
            {allVersions.length > 1 ? (
              <div className="relative">
                <select
                  value={budget.id}
                  onChange={(e) => onSelectVersion(e.target.value)}
                  className="appearance-none bg-white/20 text-white font-mono pl-2.5 pr-6 py-1 rounded-full text-[10px] font-bold outline-none cursor-pointer hover:bg-white/30 transition-colors border-none"
                >
                  {allVersions.map((v: any) => (
                    <option key={v.id} value={v.id} className="text-gray-800 font-sans font-medium text-xs">
                      v{v.version} — {STATUS_MAP[v.status]?.label || 'Borrador'} {v.id === budget.id ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1.5 pointer-events-none opacity-70" />
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white font-mono">v{budget.version}</span>
            )}
            {(budget as any).work_type && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-ecar-blueLight">
                {WORK_TYPE_LABELS[(budget as any).work_type] || 'Obra Nueva'}
              </span>
            )}
          </div>
          {budget.description && <p className="text-ecar-blueLight text-sm mt-2">{budget.description}</p>}
          <div className="flex gap-4 mt-2 text-ecar-blueLight text-xs flex-wrap items-center">
            {budget.project?.name ? (
              <span className="flex items-center gap-1"><FolderOpen size={12} /> {budget.project.name}</span>
            ) : (
              <button onClick={handleOpenAdjudicar} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                <FolderOpen size={12} /> Adjudicar y Crear Proyecto
              </button>
            )}
            {budget.opportunity?.client_name && <span className="flex items-center gap-1"><Layers size={12} /> {budget.opportunity.client_name} (Oportunidad)</span>}
            <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(budget.created_at)}</span>
            {(budget as any).validity_days && <span className="flex items-center gap-1"><Clock size={12} /> Validez: {(budget as any).validity_days} días</span>}
            {budget.approved_by && <span className="flex items-center gap-1"><Shield size={12} /> Aprobado por: {budget.approved_by}</span>}
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 bg-gray-100 p-1 rounded-xl shadow-inner">
        {[
          { id: 'general', label: 'General & Alcance', icon: Info },
          { id: 'entrada', label: 'Entrada & Riesgos', icon: AlertTriangle },
          { id: 'computo', label: 'Cómputo & Precios', icon: Calculator },
          { id: 'adjuntos', label: 'Documentos', icon: FileText },
          { id: 'cierre', label: 'Cierre & Lecciones', icon: Check },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center ${
              activeTab === t.id ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB: GENERAL & ALCANCE */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="light-card overflow-hidden shadow-sm">
            <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><Info size={14} className="text-ecar-blue" /> Detalles del Alcance</span>
              {showInfo ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>
          {showInfo && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(budget as any).assumptions && (
                <div>
                  <h5 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Info size={11} /> Supuestos</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50/50 rounded-lg p-3 border border-blue-100">{(budget as any).assumptions}</p>
                </div>
              )}
              {(budget as any).exclusions && (
                <div>
                  <h5 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><AlertTriangle size={11} /> Exclusiones</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-amber-50/50 rounded-lg p-3 border border-amber-100">{(budget as any).exclusions}</p>
                </div>
              )}
            </div>
          )}
          </div>
          
          <div className="light-card p-4">
            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><Layers size={14} className="text-ecar-blue" /> Información Adicional</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Días de Validez</label>
                <input type="number" value={budget.validity_days || ''} 
                  onChange={e => updateBudget.mutate({ id: budget.id, validity_days: parseInt(e.target.value) || null })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Trabajo</label>
                <select value={budget.work_type || 'obra_nueva'} 
                  onChange={e => updateBudget.mutate({ id: budget.id, work_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(WORK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ENTRADA & RIESGOS */}
      {activeTab === 'entrada' && (
        <div className="space-y-4">
          {/* Handoff Checklist — Carpeta de Entrada */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                  <ClipboardCheck size={20} className="text-gray-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">Checklist de Entrada
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      handoffComplete ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                    }`}>{handoffProgress}/{HANDOFF_ITEMS.length}</span>
                  </h4>
                  <p className="text-xs text-gray-500">Validaciones previas según PR-GPP-01</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {HANDOFF_ITEMS.map(item => (
                  <label key={item.key}
                    onClick={() => toggleHandoff(item.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      handoffChecklist[item.key]
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                      handoffChecklist[item.key]
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-white border-2 border-gray-300'
                    }`}>
                      {handoffChecklist[item.key] && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium block ${
                        handoffChecklist[item.key] ? 'text-green-800 line-through decoration-green-400' : 'text-gray-700'
                      }`}>{item.label}</span>
                      <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="h-1.5 bg-gray-100">
              <div className="h-full bg-gradient-to-r from-gray-400 to-green-500 transition-all duration-500 rounded-r-full"
                style={{ width: `${(handoffProgress / HANDOFF_ITEMS.length) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
             <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><AlertTriangle size={14} className="text-amber-500" /> Matriz de Riesgos Identificados</h4>
             <textarea value={budget.risks || ''} 
                onChange={e => updateBudget.mutate({ id: budget.id, risks: e.target.value })}
                placeholder="Describir riesgos técnicos, climáticos, logísticos o financieros..."
                className="w-full h-32 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
             <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><HelpCircle size={14} className="text-ecar-blue" /> Información Faltante</h4>
             <textarea value={budget.missing_info || ''} 
                onChange={e => updateBudget.mutate({ id: budget.id, missing_info: e.target.value })}
                placeholder="Detallar información faltante o consultas a ingeniería..."
                className="w-full h-24 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30" />
          </div>
        </div>
      )}

      {/* TAB: CÓMPUTO Y PRECIOS */}
      {activeTab === 'computo' && (
        <div className="space-y-4">
          {/* Quick KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Costo Directo</p>
          <p className="text-lg font-black text-gray-800 font-mono">{fmt(directTotal)}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase">GG ({fmtPct(budget.gastos_generales_pct)})</p>
          <p className="text-lg font-black text-gray-800 font-mono">{fmt(gg)}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Beneficio ({fmtPct(budget.beneficio_pct)})</p>
          <p className="text-lg font-black text-green-700 font-mono">{fmt(beneficio)}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase">IVA + IIBB + Fin.</p>
          <p className="text-lg font-black text-gray-800 font-mono">{fmt(financiero + iva + iibb)}</p>
        </div>
        <div className="bg-white border border-ecar-blueLight rounded-xl p-4 shadow-sm bg-gradient-to-br from-slate-50 to-slate-50">
          <p className="text-[10px] font-bold text-ecar-blue uppercase">Total Final</p>
          <p className="text-xl font-black text-ecar-blue font-mono">{fmt(totalFinal)}</p>
        </div>
      </div>

      {/* Cost breakdown chart */}
      {Object.keys(costBreakdown).length > 0 && (
        <div className="light-card p-4">
          <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2"><Tag size={14} className="text-ecar-blue" /> Composición de Costos</h4>
          <div className="flex gap-0.5 h-8 rounded-xl overflow-hidden bg-gray-100">
            {Object.entries(costBreakdown).map(([type, val]) => {
              const pct = directTotal > 0 ? (val / directTotal) * 100 : 0;
              const ct = COST_TYPE_LABELS[type] || COST_TYPE_LABELS.material;
              return pct > 0 ? (
                <div key={type} className={`bg-gradient-to-b ${ct.gradient} flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500`}
                  style={{ width: `${pct}%` }} title={`${ct.label}: ${fmt(val)} (${pct.toFixed(1)}%)`}>
                  {pct > 10 ? ct.label : ''}
                </div>
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(costBreakdown).map(([type, val]) => {
              const ct = COST_TYPE_LABELS[type] || COST_TYPE_LABELS.material;
              const pct = directTotal > 0 ? (val / directTotal) * 100 : 0;
              return (
                <span key={type} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ct.color} border border-current/10`}>
                  {ct.label}: {fmt(val)} ({pct.toFixed(0)}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions Bar (Computo) */}
      <div className="flex flex-wrap gap-2">
        {!isLocked && (
          <>
            <button onClick={() => setShowNewSection(true)} className="bg-gray-100 text-gray-700 px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-gray-200 transition-all">
              <Layers size={14} /> + Rubro
            </button>
            <button onClick={() => setShowNewItem(true)} className="bg-gradient-to-r from-ecar-blue to-ecar-blue text-white px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all">
              <Plus size={14} /> + Ítem
            </button>
          </>
        )}
      </div>

      {/* Entregables e Interconexiones */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4 mt-2">
        <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2"><Download size={14} className="text-ecar-blue" /> Generar Entregables e Interconexiones</h4>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportToObra(budget, items, sections)} className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 transition-all shadow-sm">
            <FileText size={16} /> Carpeta de Obra (PDF)
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-1"></div>

          <button onClick={() => exportToCompras(budget, items, sections)} className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition-all shadow-sm">
            <Package size={16} /> Planilla de Compras (Excel)
          </button>
          <button onClick={handleSendToCompras} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition-all shadow-sm">
            <Check size={16} /> Enviar Solicitud a Compras
          </button>

          <div className="h-8 w-px bg-gray-200 mx-1"></div>

          <button onClick={() => exportToLogistica(budget, items, sections)} className="bg-slate-50 text-ecar-blue px-4 py-2.5 rounded-xl text-xs font-bold border border-ecar-blueLight hover:bg-ecar-blueLight flex items-center gap-1.5 transition-all shadow-sm">
            <HardHat size={16} /> Planilla Logística (Excel)
          </button>
          <button onClick={handleSendToLogistica} className="bg-ecar-blue text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-ecar-blue flex items-center gap-1.5 transition-all shadow-sm">
            <Check size={16} /> Solicitar Equipos a Logística
          </button>
        </div>
      </div>

      {/* Handoff Checklist — Carpeta de Entrega a Obra */}
      {budget.status === 'approved' && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <ClipboardCheck size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 flex items-center gap-2">Carpeta de Entrega a Obra
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    handoffComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>{handoffProgress}/{HANDOFF_ITEMS.length}</span>
                </h4>
                <p className="text-xs text-amber-600">Completá todos los ítems antes de entregar a Obras — Doc PR-GPP-01</p>
              </div>
            </div>
            {handoffComplete && (
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-full">
                <Check size={14} /> Listo para entregar
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {HANDOFF_ITEMS.map(item => (
                <label key={item.key}
                  onClick={() => toggleHandoff(item.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    handoffChecklist[item.key]
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                    handoffChecklist[item.key]
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    {handoffChecklist[item.key] && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${
                      handoffChecklist[item.key] ? 'text-green-800 line-through decoration-green-400' : 'text-gray-700'
                    }`}>{item.label}</span>
                    <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {!handoffComplete && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>Recordá:</strong> No entregar a Obras sin completar esta carpeta. Un presupuesto mal transferido genera compras urgentes, faltantes logísticos y desvíos económicos.
                </p>
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div className="h-full bg-gradient-to-r from-amber-400 to-green-500 transition-all duration-500 rounded-r-full"
              style={{ width: `${(handoffProgress / HANDOFF_ITEMS.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* New Section Form */}
      {showNewSection && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Layers size={14} className="text-ecar-blue" /> Nuevo Rubro / Sección</h4>
          {sectionDict.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Database size={10} /> Usar rubro existente del diccionario</label>
              <select onChange={e => {
                const sel = sectionDict.find((s: any) => s.name === e.target.value);
                if (sel) setNewSection({ ordinal: sel.ordinal || '', name: sel.name });
              }} className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-ecar-blue/30">
                <option value="">— Escribir manualmente —</option>
                {sectionDict.map((s: any, i: number) => <option key={i} value={s.name}>{s.ordinal ? `${s.ordinal} — ` : ''}{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-4 gap-3">
            <input value={newSection.ordinal} onChange={e => setNewSection({ ...newSection, ordinal: e.target.value })} placeholder="Ej: 1.1"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-ecar-blue/30" />
            <input value={newSection.name} onChange={e => setNewSection({ ...newSection, name: e.target.value })} placeholder="Nombre del rubro..."
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30"
              list="section-dict" />
            <datalist id="section-dict">
              {sectionDict.map((s: any, i: number) => <option key={i} value={s.name} />)}
            </datalist>
            <div className="flex gap-2">
              <button onClick={handleCreateSection} className="bg-ecar-blue text-white px-4 py-2 rounded-xl font-bold text-sm flex-1 hover:bg-ecar-blue transition-all"><Check size={14} /></button>
              <button onClick={() => setShowNewSection(false)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-200"><X size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* New Item Form */}
      {showNewItem && (
        <div className="bg-white border-2 border-ecar-blueLight rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Plus size={14} className="text-ecar-blue" /> Nuevo Ítem de Presupuesto</h4>
          {/* Unified autocomplete: Resources + Item Dictionary */}
          {(allResources.length > 0 || itemDict.length > 0) && (
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Database size={10} /> Autocompletar desde diccionario / Banco de Precios</label>
              <select value={newItem.resource_id} onChange={e => {
                const val = e.target.value;
                if (val.startsWith('dict__')) {
                  const desc = val.replace('dict__', '');
                  const dictItem = itemDict.find((d: any) => d.description === desc);
                  if (dictItem) {
                    setNewItem({ ...newItem, resource_id: '', description: dictItem.description, unit: dictItem.unit, unit_price_ars: String(dictItem.unit_price_ars), cost_type: dictItem.cost_type });
                  }
                } else {
                  handleResourceSelect(val);
                }
              }}
                className="w-full px-3 py-2 border border-dashed border-ecar-blueLight rounded-xl text-sm bg-slate-50/30 focus:ring-2 focus:ring-ecar-blue/30">
                <option value="">— Escribir manualmente —</option>
                {itemDict.length > 0 && <optgroup label="📖 Diccionario de Ítems (usados antes)">
                  {itemDict.map((d: any, i: number) => <option key={`d${i}`} value={`dict__${d.description}`}>{d.description} — {d.unit} — {fmt(d.unit_price_ars)}</option>)}
                </optgroup>}
                {allResources.length > 0 && <optgroup label="🏦 Banco de Precios (catálogo)">
                  {allResources.map((r: any) => <option key={r.id} value={r.id}>[{(r.resource_type || '').replace('_', ' ').toUpperCase()}] {r.name} — {r.unit} — {fmt(r.unit_price_ars)}</option>)}
                </optgroup>}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <div className="md:col-span-2 relative">
              <input value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Descripción del ítem..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" list="item-desc-dict" />
              <datalist id="item-desc-dict">
                {itemDict.map((d: any, i: number) => <option key={i} value={d.description} />)}
              </datalist>
            </div>
            <select value={newItem.section_id} onChange={e => {
              if (e.target.value === 'NEW_RUBRO') {
                setShowNewSection(true);
                setNewItem({ ...newItem, section_id: '' });
              } else {
                setNewItem({ ...newItem, section_id: e.target.value });
              }
            }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm">
              <option value="">Rubro...</option>
              <option value="NEW_RUBRO" className="font-bold text-ecar-blue bg-slate-50">+ Crear nuevo rubro...</option>
              {sections.map((s: any) => <option key={s.id} value={s.id}>{s.ordinal} — {s.name}</option>)}
            </select>
            <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm">
              {UNIT_OPTIONS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
            </select>
            <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} placeholder="Cant."
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            <input type="number" value={newItem.unit_price_ars} onChange={e => setNewItem({ ...newItem, unit_price_ars: e.target.value })} placeholder="Precio unit."
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            <select value={newItem.cost_type} onChange={e => setNewItem({ ...newItem, cost_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm">
              {Object.entries(COST_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1"><HardHat size={12}/> Maquinaria / Equipos Asociados (Opcional)</label>
            </div>
            {machineryList.length > 0 && (
              <ul className="text-xs space-y-1 mb-2">
                {machineryList.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    <span className="font-bold flex-1 text-gray-700">{m.name}</span>
                    <span className="text-ecar-blue font-mono font-bold bg-slate-50 px-1.5 py-0.5 rounded">{m.hours} hs</span>
                    <button onClick={() => setMachineryList(machineryList.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X size={12}/></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input value={newMachinery.name} onChange={e => setNewMachinery({ ...newMachinery, name: e.target.value })} placeholder="Ej: Retroexcavadora..." className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-ecar-blue/30" />
              <input type="number" value={newMachinery.hours} onChange={e => setNewMachinery({ ...newMachinery, hours: e.target.value })} placeholder="Horas..." className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-ecar-blue/30" />
              <button onClick={() => { if(newMachinery.name && newMachinery.hours) { setMachineryList([...machineryList, newMachinery]); setNewMachinery({name: '', hours: ''}); } }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"><Plus size={14}/></button>
            </div>
          </div>
          <div className="flex gap-2">
            <input value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} placeholder="Notas / supuestos..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
            <button onClick={handleCreateItem} disabled={createItem.isPending}
              className="bg-gradient-to-r from-ecar-blue to-ecar-blue text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-1 shadow-md">
              <Check size={14} /> Agregar
            </button>
            <button onClick={() => setShowNewItem(false)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Calculator size={16} className="text-ecar-blue" /> Cómputo Métrico & Análisis de Precios
          </h3>
          <span className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-0.5 rounded-full">{items.length} ítems</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin ítems de presupuesto</p>
            <p className="text-sm">Agregá rubros e ítems para armar el cómputo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-3 py-3 text-center">Tipo</th>
                  <th className="px-3 py-3 text-center">Unidad</th>
                  <th className="px-3 py-3 text-right">Cantidad</th>
                  <th className="px-3 py-3 text-right">P.Unit</th>
                  <th className="px-3 py-3 text-right">Subtotal</th>
                  <th className="px-3 py-3 text-center w-16">Rubro</th>
                  <th className="px-3 py-3 text-center w-20">Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sections.map((sec: any) => (
                  <React.Fragment key={sec.id}>
                    <tr className="bg-gray-50/80">
                      <td colSpan={8} className="px-4 py-2">
                        {editingSectionId === sec.id ? (
                          <div className="flex items-center gap-2">
                            <input value={editSectionData.ordinal} onChange={e => setEditSectionData({ ...editSectionData, ordinal: e.target.value })}
                              className="w-16 px-2 py-1 border rounded text-xs font-mono" />
                            <input value={editSectionData.name} onChange={e => setEditSectionData({ ...editSectionData, name: e.target.value })}
                              className="flex-1 px-2 py-1 border rounded text-xs" />
                            <button onClick={saveEditSection} className="text-green-600 p-1"><Save size={13} /></button>
                            <button onClick={() => setEditingSectionId(null)} className="text-gray-400 p-1"><X size={13} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/sec">
                            <Layers size={14} className="text-ecar-blue" />
                            <span className="font-bold text-gray-700">{sec.ordinal} — {sec.name}</span>
                            <span className="text-[10px] text-gray-400 ml-1">({(itemsBySection[sec.id] || []).length} ítems)</span>
                            {!isLocked && (
                              <div className="opacity-0 group-hover/sec:opacity-100 transition-opacity flex gap-0.5 ml-2">
                                <button onClick={() => startEditSection(sec)} className="text-gray-400 hover:text-ecar-blue p-0.5"><Edit2 size={12} /></button>
                                <button onClick={() => handleDeleteSection(sec.id)} className="text-gray-400 hover:text-red-500 p-0.5"><Trash2 size={12} /></button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {(itemsBySection[sec.id] || []).map(renderItemRow)}
                  </React.Fragment>
                ))}
                {/* Items without section */}
                {(itemsBySection['_nosection'] || []).length > 0 && (
                  <>
                    <tr className="bg-gray-50/80">
                      <td colSpan={8} className="px-4 py-2 font-bold text-gray-500 text-xs uppercase flex items-center gap-2">
                        <AlertTriangle size={12} className="text-amber-500" /> Sin rubro asignado
                      </td>
                    </tr>
                    {(itemsBySection['_nosection'] || []).map(renderItemRow)}
                  </>
                )}

                {/* ─── TOTALS ─── */}
                <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                  <td colSpan={5} className="px-4 py-2.5 text-right text-gray-700 uppercase text-xs">Costo Directo</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-800">{fmt(directTotal)}</td>
                  <td colSpan={2}></td>
                </tr>

                {editingPcts ? (
                  <>
                    {[
                      { key: 'gastos_generales_pct', label: 'Gastos Generales', val: directTotal * (parseFloat(pctForm.gastos_generales_pct) || 0) / 100 },
                      { key: 'beneficio_pct', label: 'Beneficio', val: directTotal * (parseFloat(pctForm.beneficio_pct) || 0) / 100, isGreen: true },
                    ].map(row => (
                      <tr key={row.key} className="bg-gray-50">
                        <td colSpan={4} className="px-4 py-1.5 text-right text-gray-500 text-xs">{row.label}</td>
                        <td className="px-3 py-1.5">
                          <input type="number" step="0.1" value={(pctForm as any)[row.key]}
                            onChange={e => setPctForm({ ...pctForm, [row.key]: e.target.value })}
                            className="w-16 px-1 py-0.5 border rounded text-xs font-mono text-center" />%
                        </td>
                        <td className={`px-3 py-1.5 text-right font-mono text-xs ${row.isGreen ? 'text-green-600' : 'text-gray-600'}`}>{fmt(row.val)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100/50 border-t border-gray-200 font-bold">
                      <td colSpan={5} className="px-4 py-2 text-right text-gray-600 uppercase text-xs">Subtotal</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700 text-sm">{fmt(directTotal + directTotal * (parseFloat(pctForm.gastos_generales_pct) || 0) / 100 + directTotal * (parseFloat(pctForm.beneficio_pct) || 0) / 100)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    {[
                      { key: 'financieros_pct', label: 'Financieros' },
                      { key: 'impuestos_pct', label: 'IVA' },
                      { key: 'iibb_pct', label: 'IIBB' },
                    ].map(row => {
                      const sub = directTotal + directTotal * (parseFloat(pctForm.gastos_generales_pct) || 0) / 100 + directTotal * (parseFloat(pctForm.beneficio_pct) || 0) / 100;
                      return (
                        <tr key={row.key} className="bg-gray-50">
                          <td colSpan={4} className="px-4 py-1.5 text-right text-gray-500 text-xs">{row.label}</td>
                          <td className="px-3 py-1.5">
                            <input type="number" step="0.1" value={(pctForm as any)[row.key]}
                              onChange={e => setPctForm({ ...pctForm, [row.key]: e.target.value })}
                              className="w-16 px-1 py-0.5 border rounded text-xs font-mono text-center" />%
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-gray-600 text-xs">{fmt(sub * (parseFloat((pctForm as any)[row.key]) || 0) / 100)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-2 text-right">
                        <button onClick={savePcts} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold mr-1"><Save size={11} className="inline" /> Guardar</button>
                        <button onClick={() => setEditingPcts(false)} className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-bold"><X size={11} className="inline" /> Cancelar</button>
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">
                        Gastos Generales ({fmtPct(budget.gastos_generales_pct)})
                        {!isLocked && <button onClick={startEditPcts} className="ml-2 text-ecar-blue hover:text-ecar-blue"><Edit2 size={10} className="inline" /></button>}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-600 text-xs">{fmt(gg)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">Beneficio ({fmtPct(budget.beneficio_pct)})</td>
                      <td className="px-3 py-1.5 text-right font-mono text-green-600 text-xs">{fmt(beneficio)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="bg-gray-100/50 border-t border-gray-200 font-bold">
                      <td colSpan={5} className="px-4 py-2 text-right text-gray-600 uppercase text-xs">Subtotal</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700 text-sm">{fmt(subtotal)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">Financieros ({fmtPct(budget.financieros_pct)})</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-600 text-xs">{fmt(financiero)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">IVA ({fmtPct(budget.impuestos_pct)}) + IIBB ({fmtPct(budget.iibb_pct)})</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-600 text-xs">{fmt(iva + iibb)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </>
                )}

                <tr className="bg-gradient-to-r from-slate-50 to-slate-50 border-t-2 border-ecar-blueLight font-black">
                  <td colSpan={5} className="px-4 py-3 text-right text-ecar-blue uppercase text-sm">Total Final</td>
                  <td className="px-3 py-3 text-right font-mono text-ecar-blueDark text-lg">{fmt(totalFinal)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
        </div>
      )}

      {/* TAB: ADJUNTOS */}
      {activeTab === 'adjuntos' && (
        <div className="space-y-4">
          <div className="light-card p-5">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={16} className="text-ecar-blue" /> Documentos y Planos</h4>
            <div className="flex gap-2 items-start mb-6">
              <input type="text" placeholder="Título corto (ej. Plano Eléctrico)" value={fileTitle} onChange={e => setFileTitle(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <select value={fileCategory} onChange={e => setFileCategory(e.target.value)} className="w-40 px-3 py-2 border rounded-lg text-sm">
                <option value="General">General</option>
                <option value="Planos">Planos</option>
                <option value="Cotizaciones">Cotizaciones</option>
                <option value="Especificaciones">Especificaciones</option>
              </select>
              <label className="cursor-pointer bg-ecar-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-ecar-blue transition-colors">
                {uploading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <UploadCloud size={16} />}
                {uploading ? 'Subiendo...' : 'Subir Archivo'}
                <input type="file" className="hidden" disabled={uploading || !fileTitle.trim()} onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    await uploadFile.mutateAsync({ budgetId: budget.id, file, title: fileTitle, category: fileCategory });
                    setFileTitle('');
                    e.target.value = '';
                  } catch(err: any) {
                    console.error(err);
                    useModalStore.getState().showAlert('Error', 'Error al subir archivo');
                  } finally {
                    setUploading(false);
                  }
                }} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {budgetFiles.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-2 text-center py-8">No hay documentos adjuntos a este presupuesto.</p>
              ) : budgetFiles.map((f: any) => (
                <div key={f.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="bg-ecar-blueLight text-ecar-blue p-2 rounded-lg flex-shrink-0"><File size={16} /></div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{f.file_name}</p>
                      <p className="text-[10px] text-gray-500">{f.file_type} • {(f.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={f.file_path} target="_blank" rel="noopener noreferrer" className="p-1.5 text-ecar-blue hover:bg-slate-50 rounded"><Download size={14} /></a>
                    {!isLocked && <button onClick={() => deleteFile.mutate(f.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="light-card p-4">
             <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><ShoppingCart size={14} className="text-ecar-blue" /> Gestión con Compras (PR-GPP-01)</h4>
             <p className="text-xs text-gray-600 mb-3">Las solicitudes de cotización de materiales críticos deben enviarse a Compras antes de cerrar el presupuesto.</p>
             <button onClick={async () => {
                 const materialItems = items.filter((i: any) => i.cost_type === 'material');
                 if (materialItems.length === 0) {
                   useModalStore.getState().showAlert('Aviso', 'No hay materiales en el cómputo para cotizar.');
                   return;
                 }
                 await createPurchaseRequest.mutateAsync({
                   project_id: budget.project_id,
                   budget_id: budget.id,
                   request_type: 'quote',
                   urgency: 'normal',
                   requested_by: 'Presupuestos',
                   notes: `Solicitud de cotización generada desde Presupuesto: ${budget.name}`,
                   items: materialItems.map((item: any) => ({
                     description: item.description,
                     quantity: item.quantity,
                     unit: item.unit,
                     estimated_unit_cost: 0,
                     inventory_item_id: null,
                     budget_item_id: item.id
                   }))
                 } as any);
                 useModalStore.getState().showAlert('Éxito', 'Solicitud de cotización enviada a Compras correctamente.');
             }} disabled={createPurchaseRequest.isPending} className="bg-ecar-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-ecar-blue transition-colors disabled:opacity-50">
                {createPurchaseRequest.isPending ? 'Enviando...' : 'Solicitar Cotización a Compras'}
             </button>
          </div>
        </div>
      )}

      {/* TAB: CIERRE Y LECCIONES */}
      {activeTab === 'cierre' && (
        <div className="space-y-4">
          {/* Cierre Económico Automático */}
          {budget.project_id && (
            <CierreEconomicoPanel
              projectId={budget.project_id}
              presupuestado={totalFinal}
              costoDirectoPresupuestado={directTotal}
            />
          )}
          {!budget.project_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <AlertTriangle size={24} className="mx-auto text-amber-500 mb-2" />
              <p className="text-sm font-bold text-amber-700">Este presupuesto no está asignado a un proyecto.</p>
              <p className="text-xs text-amber-600 mt-1">El cierre económico requiere un proyecto con facturas de compra registradas.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="light-card p-4">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-4"><DollarSign size={14} className="text-ecar-blue" /> Cierre Post-Obra</h4>
              <label className="block text-xs font-bold text-gray-500 mb-1">Costo Real Final (ARS) — Ingreso Manual</label>
              <input type="number" value={budget.actual_cost_ars || ''} 
                onChange={e => updateBudget.mutate({ id: budget.id, actual_cost_ars: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono mb-3" />
              {budget.actual_cost_ars > 0 && (
                <div className={`p-3 rounded-lg text-sm font-bold text-center ${
                  budget.actual_cost_ars > directTotal ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  Desvío vs. Presupuestado: {(((budget.actual_cost_ars - directTotal) / directTotal) * 100).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="light-card p-4">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><AlertTriangle size={14} className="text-amber-500" /> Lecciones Aprendidas</h4>
              <textarea value={budget.lessons_learned || ''} 
                onChange={e => updateBudget.mutate({ id: budget.id, lessons_learned: e.target.value })}
                placeholder="Documentar qué salió bien y qué salió mal para futuros presupuestos..."
                className="w-full h-32 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30" />
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL ACTIONS BAR */}
      <div className="bg-white border-t border-gray-200 p-4 rounded-b-xl flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-4">
        <div className="flex gap-2">
          {budget.status === 'draft' && (
            <button onClick={() => handleStatusChange('revision')} className="bg-yellow-100 text-yellow-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-yellow-200 transition-all border border-yellow-200">
              <Eye size={16} /> Enviar a Revisión
            </button>
          )}
          {budget.status === 'revision' && (
            <>
              <button onClick={() => handleStatusChange('approved')} className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-700 transition-all shadow-md">
                <Check size={16} /> Aprobar
              </button>
              <button onClick={() => handleStatusChange('draft')} className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-all">
                <RotateCcw size={16} /> Devolver a Borrador
              </button>
            </>
          )}
          {budget.status === 'approved' && (
            <>
              <button onClick={() => handleStatusChange('revision')} className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-all">
                <RotateCcw size={16} /> Devolver a Revisión
              </button>
              <button onClick={() => { if (handoffComplete) handleStatusChange('closed'); }}
                disabled={!handoffComplete}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  handoffComplete
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                <Building2 size={16} /> {handoffComplete ? 'Cerrar y Entregar a Obra' : `Completar Checklist Entrada para Cerrar`}
              </button>
            </>
          )}
        </div>
        <button onClick={onDuplicate} className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 hover:border-ecar-blue transition-all">
          <Copy size={16} /> Crear Nueva Versión
        </button>
      </div>

      {/* MODAL ADJUDICAR Y CREAR PROYECTO */}
      {showAdjudicarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2"><FolderOpen size={20} /> Adjudicar y Crear Proyecto (Carpeta de Inicio)</h2>
              <button onClick={() => setShowAdjudicarModal(false)} className="hover:bg-emerald-700 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 bg-gray-50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de la Obra *</label>
                  <input type="text" value={adjudicarData.name} onChange={e => setAdjudicarData({...adjudicarData, name: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: Torre Norte" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cliente</label>
                  <input type="text" value={adjudicarData.client_name} onChange={e => setAdjudicarData({...adjudicarData, client_name: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jefe de Obra (Responsable)</label>
                  <select value={adjudicarData.manager_id} onChange={e => setAdjudicarData({...adjudicarData, manager_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">
                    <option value="">Seleccione un responsable...</option>
                    {profiles.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Inicio</label>
                    <input type="date" value={adjudicarData.start_date} onChange={e => setAdjudicarData({...adjudicarData, start_date: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Fin Est.</label>
                    <input type="date" value={adjudicarData.end_date} onChange={e => setAdjudicarData({...adjudicarData, end_date: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Resumen de Carpeta de Inicio (Alcance, Riesgos, Restricciones)</label>
                <textarea 
                  value={adjudicarData.startup_folder_notes} 
                  onChange={e => setAdjudicarData({...adjudicarData, startup_folder_notes: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm font-mono"
                  placeholder="Detalle el alcance inicial, supuestos y exclusiones a transferir a obra..."
                />
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-2 shrink-0">
              <button onClick={() => setShowAdjudicarModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleAdjudicar} disabled={createProject.isPending || !adjudicarData.name.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                <Check size={16} /> Crear y Adjudicar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PANEL CATÁLOGO DE RECURSOS (Banco de Precios)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ResourcesPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data: resources = [], isLoading } = useBudgetResources();
  const createResource = useCreateBudgetResource();
  const updateResource = useUpdateBudgetResource();
  const deleteResource = useDeleteBudgetResource();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newRes, setNewRes] = useState({ code: '', name: '', resource_type: 'material', category: '', unit: 'u', unit_price_ars: '0', supplier_ref: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const filtered = useMemo(() => {
    let list = resources;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q));
    }
    if (filterType) list = list.filter(r => r.resource_type === filterType);
    return list;
  }, [resources, search, filterType]);

  const handleCreate = async () => {
    if (!newRes.name.trim()) return;
    await createResource.mutateAsync({
      code: newRes.code || null,
      name: newRes.name,
      resource_type: newRes.resource_type as any,
      category: newRes.category || null,
      unit: newRes.unit,
      unit_price_ars: parseFloat(newRes.unit_price_ars) || 0,
      supplier_ref: newRes.supplier_ref || null,
      notes: newRes.notes || null,
    } as any);
    setShowNew(false);
    setNewRes({ code: '', name: '', resource_type: 'material', category: '', unit: 'u', unit_price_ars: '0', supplier_ref: '', notes: '' });
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditData({ code: r.code || '', name: r.name, resource_type: r.resource_type, category: r.category || '', unit: r.unit, unit_price_ars: String(r.unit_price_ars), supplier_ref: r.supplier_ref || '', notes: r.notes || '' });
  };

  const saveEdit = async () => {
    if (!editingId || !editData) return;
    await updateResource.mutateAsync({
      id: editingId,
      code: editData.code || null,
      name: editData.name,
      resource_type: editData.resource_type as any,
      category: editData.category || null,
      unit: editData.unit,
      unit_price_ars: parseFloat(editData.unit_price_ars) || 0,
      supplier_ref: editData.supplier_ref || null,
      notes: editData.notes || null,
    } as any);
    setEditingId(null);
    setEditData(null);
  };

  const RESOURCE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    material: { label: 'Material', color: 'bg-blue-100 text-blue-700' },
    mano_obra: { label: 'Mano de Obra', color: 'bg-orange-100 text-orange-700' },
    equipo: { label: 'Equipo', color: 'bg-ecar-blueLight text-ecar-blue' },
    subcontrato: { label: 'Subcontrato', color: 'bg-ecar-blueLight text-ecar-blue' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-ecar-blueDark via-ecar-blue to-ecar-blue rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-6 -right-6 opacity-[0.07]"><Database size={160} strokeWidth={1} /></div>
        <div className="relative z-10">
          <h3 className="font-black text-2xl flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm p-2 rounded-xl"><Database size={22} /></div>
            Banco de Precios / Catálogo de Recursos
          </h3>
          <p className="text-ecar-blueLight text-sm mt-1.5">Base global de materiales, mano de obra, equipos y subcontratos con precios actualizados</p>
          <div className="flex gap-2 mt-4">
            <button onClick={onBack} className="bg-white/10 text-white hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
              <ArrowLeft size={13} className="inline mr-1" />Presupuestos
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar recurso..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white">
            <option value="">Todos los tipos</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-gradient-to-r from-ecar-blue to-ecar-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-ecar-blue/20 hover:shadow-ecar-blue/40 transition-all">
          <Plus size={16} /> Nuevo Recurso
        </button>
      </div>

      {/* New Resource Form */}
      {showNew && (
        <div className="bg-white border-2 border-ecar-blueLight rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Plus size={14} className="text-ecar-blue" /> Nuevo Recurso</h4>
          <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
            <input value={newRes.code} onChange={e => setNewRes({ ...newRes, code: e.target.value })} placeholder="Código"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            <input value={newRes.name} onChange={e => setNewRes({ ...newRes, name: e.target.value })} placeholder="Nombre del recurso *"
              className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
            <select value={newRes.resource_type} onChange={e => setNewRes({ ...newRes, resource_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm">
              {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input value={newRes.category} onChange={e => setNewRes({ ...newRes, category: e.target.value })} placeholder="Categoría"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm" />
            <select value={newRes.unit} onChange={e => setNewRes({ ...newRes, unit: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm">
              {UNIT_OPTIONS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
            </select>
            <input type="number" value={newRes.unit_price_ars} onChange={e => setNewRes({ ...newRes, unit_price_ars: e.target.value })} placeholder="Precio"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
            <input value={newRes.supplier_ref} onChange={e => setNewRes({ ...newRes, supplier_ref: e.target.value })} placeholder="Proveedor"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </div>
          <div className="flex gap-2">
            <input value={newRes.notes} onChange={e => setNewRes({ ...newRes, notes: e.target.value })} placeholder="Notas..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
            <button onClick={handleCreate} disabled={createResource.isPending}
              className="bg-ecar-blue text-white px-5 py-2 rounded-xl font-bold text-sm"><Check size={14} className="inline mr-1" /> Crear</button>
            <button onClick={() => setShowNew(false)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Resources Table */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Recursos Registrados</h3>
          <span className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-0.5 rounded-full">{filtered.length} recursos</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin" /></div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-3 py-3 text-center">Tipo</th>
                  <th className="px-3 py-3">Categoría</th>
                  <th className="px-3 py-3 text-center">Unidad</th>
                  <th className="px-3 py-3 text-right">Precio</th>
                  <th className="px-3 py-3">Proveedor</th>
                  <th className="px-3 py-3 text-center">Últ. Act.</th>
                  <th className="px-3 py-3 text-center">Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => {
                  const rt = RESOURCE_TYPE_LABELS[r.resource_type] || RESOURCE_TYPE_LABELS.material;
                  if (editingId === r.id && editData) {
                    return (
                      <tr key={r.id} className="bg-slate-50/50">
                        <td className="px-4 py-2"><input value={editData.code} onChange={e => setEditData({ ...editData, code: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-mono" /></td>
                        <td className="px-4 py-2"><input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" /></td>
                        <td className="px-2 py-2"><select value={editData.resource_type} onChange={e => setEditData({ ...editData, resource_type: e.target.value })} className="w-full px-1 py-1 border rounded text-[10px]">{Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></td>
                        <td className="px-2 py-2"><input value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" /></td>
                        <td className="px-2 py-2"><select value={editData.unit} onChange={e => setEditData({ ...editData, unit: e.target.value })} className="w-full px-1 py-1 border rounded text-[10px]">{UNIT_OPTIONS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}</select></td>
                        <td className="px-2 py-2"><input type="number" value={editData.unit_price_ars} onChange={e => setEditData({ ...editData, unit_price_ars: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-mono text-right" /></td>
                        <td className="px-2 py-2"><input value={editData.supplier_ref} onChange={e => setEditData({ ...editData, supplier_ref: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" /></td>
                        <td className="px-3 py-2 text-center text-xs text-gray-400">—</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={saveEdit} className="text-green-600 p-1"><Save size={13} /></button>
                          <button onClick={() => { setEditingId(null); setEditData(null); }} className="text-gray-400 p-1"><X size={13} /></button>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{r.code || '—'}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">
                        {r.name}
                        {r.notes && <p className="text-[10px] text-gray-400">{r.notes}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rt.color}`}>{rt.label}</span></td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">{r.category || '—'}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{r.unit}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{fmt(r.unit_price_ars)}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">{r.supplier_ref || '—'}</td>
                      <td className="px-3 py-2.5 text-center text-[10px] text-gray-400">{fmtDate(r.last_price_update)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex gap-0.5 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-ecar-blue p-1 rounded hover:bg-slate-50"><Edit2 size={13} /></button>
                          <button onClick={() => deleteResource.mutate(r.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Database size={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin recursos en el catálogo</p>
            <p className="text-sm">Agregá materiales, mano de obra, equipos y subcontratos</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CIERRE ECONÓMICO — Presupuesto vs. Real
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const CierreEconomicoPanel: React.FC<{
  projectId: string;
  presupuestado: number;
  costoDirectoPresupuestado: number;
}> = ({ projectId, presupuestado, costoDirectoPresupuestado }) => {
  const { data: invoices = [] } = usePurchaseInvoices();
  const projectInvoices = useMemo(() => {
    return invoices.filter((inv: any) => {
      if (inv.allocations && inv.allocations.length > 0) {
        return inv.allocations.some((a: any) => a.project_id === projectId);
      }
      return inv.project_id === projectId;
    });
  }, [invoices, projectId]);
  
  const gastoReal = useMemo(() => {
    return projectInvoices.reduce((sum: number, inv: any) => {
      if (inv.allocations && inv.allocations.length > 0) {
        const alloc = inv.allocations.find((a: any) => a.project_id === projectId);
        return sum + (alloc ? alloc.amount_ars : 0);
      }
      return sum + (inv.total_ars || 0);
    }, 0);
  }, [projectInvoices, projectId]);
  const desvio = costoDirectoPresupuestado > 0 ? ((gastoReal - costoDirectoPresupuestado) / costoDirectoPresupuestado) * 100 : 0;
  const rentabilidadEsperada = presupuestado - costoDirectoPresupuestado;
  const rentabilidadReal = presupuestado - gastoReal;
  const estaEnRojo = gastoReal > costoDirectoPresupuestado;

  return (
    <div className={`rounded-2xl border-2 shadow-sm overflow-hidden ${estaEnRojo ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'}`}>
      <div className={`p-4 border-b ${estaEnRojo ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <h4 className={`font-bold text-sm flex items-center gap-2 ${estaEnRojo ? 'text-red-800' : 'text-green-800'}`}>
          <DollarSign size={16} /> Cierre Económico — Presupuesto vs. Ejecución Real
          <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-black ${estaEnRojo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {projectInvoices.length} facturas registradas
          </span>
        </h4>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Costo Directo Presupuestado</p>
            <p className="text-lg font-black text-gray-800 font-mono">{fmt(costoDirectoPresupuestado)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Gasto Real (Facturas)</p>
            <p className={`text-lg font-black font-mono ${estaEnRojo ? 'text-red-600' : 'text-green-700'}`}>{fmt(gastoReal)}</p>
          </div>
          <div className={`rounded-xl p-3 border shadow-sm ${estaEnRojo ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Desvío</p>
            <p className={`text-lg font-black font-mono ${estaEnRojo ? 'text-red-600' : 'text-green-700'}`}>
              {desvio > 0 ? '+' : ''}{desvio.toFixed(1)}%
            </p>
          </div>
          <div className={`rounded-xl p-3 border shadow-sm ${rentabilidadReal < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Rentabilidad Real</p>
            <p className={`text-lg font-black font-mono ${rentabilidadReal < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{fmt(rentabilidadReal)}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Esperada: {fmt(rentabilidadEsperada)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-100 rounded-full h-5 overflow-hidden mb-3 relative">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${estaEnRojo ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-green-400 to-green-600'}`}
            style={{ width: `${Math.min((gastoReal / costoDirectoPresupuestado) * 100, 100)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-700">
            {costoDirectoPresupuestado > 0 ? `${((gastoReal / costoDirectoPresupuestado) * 100).toFixed(0)}% ejecutado` : '—'}
          </span>
        </div>

        {/* Latest invoices */}
        {projectInvoices.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 mb-2">Últimas facturas del proyecto</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {projectInvoices.slice(0, 8).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-bold text-gray-700 truncate">{inv.supplier?.name || 'Sin proveedor'}</span>
                    <span className="text-gray-400 shrink-0">Fact. {inv.invoice_number || '—'}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-800 shrink-0 ml-3">
                    {fmt(
                      (inv.allocations && inv.allocations.length > 0) 
                        ? (inv.allocations.find((a: any) => a.project_id === projectId)?.amount_ars || 0)
                        : (inv.total_ars || 0)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
