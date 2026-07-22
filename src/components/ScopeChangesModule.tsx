import React, { useState, useMemo } from 'react';
import {
  FilePlus, Search, Plus, X, Save, Clock,
  DollarSign, Package
} from 'lucide-react';
import { useScopeChanges, useCreateScopeChange, useUpdateScopeChange, useProjects } from '../hooks/useData';
import type { ScopeChange } from '../lib/types';

const STATUSES: Record<string, { label: string; color: string }> = {
  detectado: { label: 'Detectado', color: 'badge-warning' },
  en_evaluacion: { label: 'En Evaluación', color: 'badge-pending' },
  aprobado: { label: 'Aprobado', color: 'badge-success' },
  rechazado: { label: 'Rechazado', color: 'badge-danger' },
  ejecutado: { label: 'Ejecutado', color: 'badge-info' },
};

const CHANGE_TYPES: Record<string, string> = {
  adicional: 'Adicional',
  cambio_alcance: 'Cambio de Alcance',
  desvio: 'Desvío',
  interferencia: 'Interferencia',
};

const ORIGINS: Record<string, string> = {
  cliente: 'Cliente',
  inspeccion: 'Inspección',
  obra: 'Obra',
  interno: 'Interno',
};

const fmt = (n: number | null | undefined) => n ? `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '—';

export const ScopeChangesModule: React.FC = () => {
  const { data: scopeChanges, isLoading } = useScopeChanges();
  const { data: projects } = useProjects();
  const createSC = useCreateScopeChange();
  const updateSC = useUpdateScopeChange();

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedSC, setSelectedSC] = useState<ScopeChange | null>(null);

  const [form, setForm] = useState({
    project_id: '',
    change_type: 'adicional' as ScopeChange['change_type'],
    origin: 'obra' as ScopeChange['origin'],
    description: '',
    technical_impact: '',
    status: 'detectado' as ScopeChange['status'],
    economic_impact: 0,
    deadline_impact_days: 0,
    notes: '',
  });

  const filtered = useMemo(() => {
    if (!scopeChanges) return [];
    let res = scopeChanges;
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(x => x.description.toLowerCase().includes(s) || x.project?.name.toLowerCase().includes(s));
    }
    if (filterProject) {
      res = res.filter(x => x.project_id === filterProject);
    }
    return res;
  }, [scopeChanges, search, filterProject]);

  const stats = useMemo(() => {
    if (!scopeChanges) return { total: 0, pending: 0, approvedImpact: 0 };
    return {
      total: scopeChanges.length,
      pending: scopeChanges.filter(s => s.status === 'detectado' || s.status === 'en_evaluacion').length,
      approvedImpact: scopeChanges.filter(s => s.status === 'aprobado' || s.status === 'ejecutado').reduce((acc, curr) => acc + (curr.economic_impact || 0), 0),
    };
  }, [scopeChanges]);

  const handleSubmit = async () => {
    try {
      if (selectedSC) {
        await updateSC.mutateAsync({ id: selectedSC.id, ...form });
      } else {
        await createSC.mutateAsync(form);
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setSelectedSC(null);
    setForm({
      project_id: '',
      change_type: 'adicional',
      origin: 'obra',
      description: '',
      technical_impact: '',
      status: 'detectado',
      economic_impact: 0,
      deadline_impact_days: 0,
      notes: '',
    });
  };

  const openEdit = (sc: ScopeChange) => {
    setSelectedSC(sc);
    setForm({
      project_id: sc.project_id || '',
      change_type: sc.change_type,
      origin: sc.origin,
      description: sc.description,
      technical_impact: sc.technical_impact || '',
      status: sc.status,
      economic_impact: sc.economic_impact || 0,
      deadline_impact_days: sc.deadline_impact_days || 0,
      notes: sc.notes || '',
    });
    setShowForm(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-ecar-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><FilePlus size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><FilePlus size={24} /> Adicionales y Cambios de Alcance</h3>
          <p className="text-orange-100 text-sm mt-1">Gerencia de Proyectos y Obras — Control de desvíos y adicionales</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="light-card p-4">
          <div className="text-xs font-bold text-gray-500 flex items-center gap-1"><Package size={14} /> Total Registrados</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</div>
        </div>
        <div className="light-card p-4">
          <div className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock size={14} /> Pendientes de Gestión</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</div>
        </div>
        <div className="light-card p-4">
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1"><DollarSign size={14} /> Impacto Aprobado</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{fmt(stats.approvedImpact)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full max-w-xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar adicional..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-48">
            <option value="">Todos los Proyectos</option>
            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo Adicional
        </button>
      </div>

      {/* Table */}
      <div className="light-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Proyecto</th>
              <th>Tipo</th>
              <th className="text-center">Estado</th>
              <th className="text-right">Impacto $</th>
              <th className="text-right">Demora (días)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sc => (
              <tr key={sc.id} onClick={() => openEdit(sc)} className="cursor-pointer hover:bg-gray-50">
                <td className="font-bold text-gray-800 max-w-xs truncate">{sc.description}</td>
                <td className="text-gray-600 text-sm">{sc.project?.name}</td>
                <td className="text-gray-600 text-sm capitalize">{CHANGE_TYPES[sc.change_type] || sc.change_type}</td>
                <td className="text-center">
                  <span className={`badge ${STATUSES[sc.status]?.color || 'badge-neutral'}`}>
                    {STATUSES[sc.status]?.label || sc.status}
                  </span>
                </td>
                <td className="text-right font-mono font-bold text-gray-700">{sc.economic_impact && sc.economic_impact > 0 ? fmt(sc.economic_impact) : '—'}</td>
                <td className="text-right font-mono text-gray-600">{sc.deadline_impact_days && sc.deadline_impact_days > 0 ? `+${sc.deadline_impact_days}` : '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-8">No se encontraron adicionales.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-full flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FilePlus size={20} className="text-orange-500" />
                {selectedSC ? 'Editar Adicional' : 'Nuevo Adicional de Obra'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Proyecto *</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleccionar Proyecto</option>
                    {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de Cambio</label>
                  <select value={form.change_type} onChange={e => setForm({ ...form, change_type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(CHANGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Descripción / Motivo *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Describir qué se debe hacer y por qué..." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Impacto Técnico</label>
                <textarea value={form.technical_impact} onChange={e => setForm({ ...form, technical_impact: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Cómo afecta a la obra..." />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Estado de Aprobación</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-700">
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Impacto Económico ($)</label>
                  <input type="number" value={form.economic_impact} onChange={e => setForm({ ...form, economic_impact: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Demora en Plazo (Días)</label>
                  <input type="number" value={form.deadline_impact_days} onChange={e => setForm({ ...form, deadline_impact_days: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Origen del Cambio</label>
                  <select value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Notas Internas</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Comentarios..." />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 font-bold text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSubmit} disabled={!form.description || !form.project_id || createSC.isPending || updateSC.isPending}
                className="btn-primary">
                <Save size={16} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
