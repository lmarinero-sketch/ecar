import React, { useState, useMemo } from 'react';
import {
  FileSignature, Search, Plus, X, Save, Eye, AlertTriangle,
  Clock, CheckCircle2, DollarSign, Calendar,
} from 'lucide-react';
import { useScopeChanges, useCreateScopeChange, useUpdateScopeChange, useProjects } from '../hooks/useData';
import type { ScopeChange } from '../lib/types';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const CHANGE_TYPES: Record<string, { label: string; color: string }> = {
  adicional: { label: 'Adicional', color: 'bg-blue-100 text-blue-700' },
  cambio_alcance: { label: 'Cambio de Alcance', color: 'bg-purple-100 text-purple-700' },
  desvio: { label: 'Desvío', color: 'bg-orange-100 text-orange-700' },
  interferencia: { label: 'Interferencia', color: 'bg-red-100 text-red-700' },
};

const ORIGINS: Record<string, string> = {
  cliente: 'Cliente',
  inspeccion: 'Inspección',
  obra: 'Obra',
  interno: 'Interno',
};

const SC_STATUSES: Record<string, { label: string; color: string }> = {
  detectado: { label: 'Detectado', color: 'bg-yellow-100 text-yellow-700' },
  en_evaluacion: { label: 'En Evaluación', color: 'bg-blue-100 text-blue-700' },
  aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  ejecutado: { label: 'Ejecutado', color: 'bg-emerald-100 text-emerald-700' },
};

export const ScopeChangesModule: React.FC = () => {
  const { data: changes, isLoading } = useScopeChanges();
  const { data: projects } = useProjects();
  const createSC = useCreateScopeChange();
  const updateSC = useUpdateScopeChange();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedSC, setSelectedSC] = useState<ScopeChange | null>(null);
  const [form, setForm] = useState({
    change_type: 'adicional' as ScopeChange['change_type'],
    origin: 'obra' as ScopeChange['origin'],
    description: '',
    technical_impact: '',
    economic_impact: 0,
    deadline_impact_days: 0,
    status: 'detectado' as ScopeChange['status'],
    notes: '',
    project_id: '',
  });

  const filtered = useMemo(() => {
    if (!changes) return [];
    let result = changes;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(sc => sc.description.toLowerCase().includes(s));
    }
    if (filterType !== 'all') result = result.filter(sc => sc.change_type === filterType);
    return result;
  }, [changes, search, filterType]);

  const stats = useMemo(() => {
    if (!changes) return { total: 0, aprobados: 0, pendientes: 0, impactoTotal: 0 };
    return {
      total: changes.length,
      aprobados: changes.filter(sc => sc.status === 'aprobado' || sc.status === 'ejecutado').length,
      pendientes: changes.filter(sc => sc.status === 'detectado' || sc.status === 'en_evaluacion').length,
      impactoTotal: changes.filter(sc => sc.status !== 'rechazado').reduce((s, sc) => s + (sc.economic_impact || 0), 0),
    };
  }, [changes]);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, project_id: form.project_id || null, economic_impact: form.economic_impact || null, deadline_impact_days: form.deadline_impact_days || null };
      if (selectedSC) {
        await updateSC.mutateAsync({ id: selectedSC.id, ...payload });
      } else {
        await createSC.mutateAsync(payload);
      }
      setShowForm(false);
      setSelectedSC(null);
      resetForm();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setForm({ change_type: 'adicional', origin: 'obra', description: '', technical_impact: '', economic_impact: 0, deadline_impact_days: 0, status: 'detectado', notes: '', project_id: '' });
  };

  const openEdit = (sc: ScopeChange) => {
    setSelectedSC(sc);
    setForm({
      change_type: sc.change_type, origin: sc.origin, description: sc.description,
      technical_impact: sc.technical_impact || '', economic_impact: sc.economic_impact || 0,
      deadline_impact_days: sc.deadline_impact_days || 0, status: sc.status,
      notes: sc.notes || '', project_id: sc.project_id || '',
    });
    setShowForm(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-amber-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-orange-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><FileSignature size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><FileSignature size={24} /> Adicionales & Cambios de Alcance</h3>
          <p className="text-amber-100 text-sm mt-1">Registro y evaluación de cambios — Docs PR-GPP-01 / PR-GO-01</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: <FileSignature size={16} />, color: 'text-gray-700' },
          { label: 'Pendientes', value: stats.pendientes, icon: <Clock size={16} />, color: 'text-yellow-600' },
          { label: 'Aprobados', value: stats.aprobados, icon: <CheckCircle2 size={16} />, color: 'text-green-600' },
          { label: 'Impacto Económico', value: fmt(stats.impactoTotal), icon: <DollarSign size={16} />, color: 'text-red-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${kpi.color} mb-1`}>{kpi.icon} {kpi.label}</div>
            <div className="text-xl font-bold text-gray-800">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar descripción..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">Todos los tipos</option>
            {Object.entries(CHANGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => { resetForm(); setSelectedSC(null); setShowForm(true); }}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-amber-700 hover:shadow-lg transition-all">
            <Plus size={16} /> Nuevo Cambio
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-center">Origen</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Impacto $</th>
              <th className="px-4 py-3 text-center">Plazo (días)</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(sc => (
              <tr key={sc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CHANGE_TYPES[sc.change_type]?.color || 'bg-gray-100'}`}>
                    {CHANGE_TYPES[sc.change_type]?.label || sc.change_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-800 line-clamp-1">{sc.description}</div>
                  {sc.project && <div className="text-xs text-gray-400">{sc.project.name}</div>}
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-600">{ORIGINS[sc.origin] || sc.origin}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SC_STATUSES[sc.status]?.color || 'bg-gray-100'}`}>
                    {SC_STATUSES[sc.status]?.label || sc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-800">{sc.economic_impact ? fmt(sc.economic_impact) : '—'}</td>
                <td className="px-4 py-3 text-center text-gray-600">{sc.deadline_impact_days ? `+${sc.deadline_impact_days}d` : '—'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEdit(sc)} className="text-amber-600 hover:text-amber-800 p-1"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                <FileSignature size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay cambios registrados</p>
                <p className="text-sm">Hacé clic en "Nuevo Cambio" para registrar un adicional o desvío.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileSignature size={20} className="text-amber-600" />
                {selectedSC ? 'Editar Cambio' : 'Nuevo Cambio de Alcance / Adicional'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tipo *</label>
                  <select value={form.change_type} onChange={e => setForm({ ...form, change_type: e.target.value as ScopeChange['change_type'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                    {Object.entries(CHANGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Origen</label>
                  <select value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value as ScopeChange['origin'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                    {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ScopeChange['status'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                    {Object.entries(SC_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Obra / Proyecto</label>
                <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                  <option value="">General</option>
                  {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Descripción *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Describir el cambio, adicional o desvío..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Impacto Técnico</label>
                <textarea value={form.technical_impact} onChange={e => setForm({ ...form, technical_impact: e.target.value })} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="¿Cómo afecta técnicamente la obra?" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Impacto Económico ($)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={form.economic_impact} onChange={e => setForm({ ...form, economic_impact: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Impacto en Plazo (días)</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={form.deadline_impact_days} onChange={e => setForm({ ...form, deadline_impact_days: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Notas</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Notas adicionales..." />
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800"><strong>Recordar:</strong> Nunca ejecutar un adicional sin registro previo y aprobación formal cuando corresponda. Todo cambio que impacte costo o plazo debe ser evaluado por GPP y aprobado por GG.</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm">Cancelar</button>
              <button onClick={handleSubmit} disabled={!form.description || createSC.isPending || updateSC.isPending}
                className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-amber-700 disabled:opacity-50 transition-all">
                <Save size={16} /> {selectedSC ? 'Guardar Cambios' : 'Registrar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
