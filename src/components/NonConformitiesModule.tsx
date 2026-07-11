import React, { useState, useMemo } from 'react';
import {
  ShieldAlert, Search, Plus, X, Save, Eye, AlertTriangle,
  Clock, CheckCircle2, BarChart3, FileText,
} from 'lucide-react';
import { useNonConformities, useCreateNonConformity, useUpdateNonConformity, useProjects } from '../hooks/useData';
import type { NonConformity } from '../lib/types';

const CATEGORIES: Record<string, { label: string; color: string }> = {
  compra: { label: 'Compra', color: 'bg-violet-100 text-violet-700' },
  obra: { label: 'Obra', color: 'bg-cyan-100 text-cyan-700' },
  logistica: { label: 'Logística', color: 'bg-teal-100 text-teal-700' },
  proveedor: { label: 'Proveedor', color: 'bg-orange-100 text-orange-700' },
  documental: { label: 'Documental', color: 'bg-slate-100 text-slate-700' },
  seguridad: { label: 'Seguridad', color: 'bg-red-100 text-red-700' },
};

const STATUSES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  abierta: { label: 'Abierta', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={12} /> },
  en_analisis: { label: 'En Análisis', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
  accion_correctiva: { label: 'Acción Correctiva', color: 'bg-blue-100 text-blue-700', icon: <FileText size={12} /> },
  verificacion: { label: 'Verificación', color: 'bg-indigo-100 text-indigo-700', icon: <Eye size={12} /> },
  cerrada: { label: 'Cerrada', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
};

const IMPACTS: Record<string, { label: string; color: string }> = {
  bajo: { label: 'Bajo', color: 'bg-green-100 text-green-700' },
  medio: { label: 'Medio', color: 'bg-yellow-100 text-yellow-700' },
  alto: { label: 'Alto', color: 'bg-orange-100 text-orange-700' },
  critico: { label: 'Crítico', color: 'bg-red-100 text-red-700' },
};

export const NonConformitiesModule: React.FC = () => {
  const { data: ncs, isLoading } = useNonConformities();
  const { data: projects } = useProjects();
  const createNC = useCreateNonConformity();
  const updateNC = useUpdateNonConformity();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedNC, setSelectedNC] = useState<NonConformity | null>(null);
  const [form, setForm] = useState({
    nc_number: '',
    category: 'obra' as NonConformity['category'],
    area: '',
    description: '',
    impact: 'bajo' as NonConformity['impact'],
    root_cause: '',
    immediate_action: '',
    corrective_action: '',
    responsible: '',
    status: 'abierta' as NonConformity['status'],
    detected_by: '',
    lesson_learned: '',
    project_id: '',
  });

  const filtered = useMemo(() => {
    if (!ncs) return [];
    let result = ncs;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(nc =>
        nc.nc_number.toLowerCase().includes(s) ||
        nc.description.toLowerCase().includes(s) ||
        nc.area.toLowerCase().includes(s)
      );
    }
    if (filterStatus !== 'all') result = result.filter(nc => nc.status === filterStatus);
    if (filterCategory !== 'all') result = result.filter(nc => nc.category === filterCategory);
    return result;
  }, [ncs, search, filterStatus, filterCategory]);

  const stats = useMemo(() => {
    if (!ncs) return { total: 0, abiertas: 0, cerradas: 0, tiempoPromedio: 0 };
    const abiertas = ncs.filter(nc => nc.status !== 'cerrada').length;
    const cerradas = ncs.filter(nc => nc.status === 'cerrada');
    const tiempos = cerradas.filter(nc => nc.closed_at).map(nc => {
      const start = new Date(nc.detected_at || nc.created_at).getTime();
      const end = new Date(nc.closed_at!).getTime();
      return (end - start) / (1000 * 60 * 60 * 24);
    });
    return {
      total: ncs.length,
      abiertas,
      cerradas: cerradas.length,
      tiempoPromedio: tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0,
    };
  }, [ncs]);

  const nextNCNumber = useMemo(() => {
    if (!ncs || ncs.length === 0) return 'NC-001';
    const maxNum = ncs.reduce((max, nc) => {
      const match = nc.nc_number.match(/NC-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `NC-${String(maxNum + 1).padStart(3, '0')}`;
  }, [ncs]);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        project_id: form.project_id || null,
        nc_number: form.nc_number || nextNCNumber,
      };
      if (selectedNC) {
        await updateNC.mutateAsync({ id: selectedNC.id, ...payload });
      } else {
        await createNC.mutateAsync(payload);
      }
      setShowForm(false);
      setSelectedNC(null);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      nc_number: '', category: 'obra', area: '', description: '', impact: 'bajo',
      root_cause: '', immediate_action: '', corrective_action: '', responsible: '',
      status: 'abierta', detected_by: '', lesson_learned: '', project_id: '',
    });
  };

  const openEdit = (nc: NonConformity) => {
    setSelectedNC(nc);
    setForm({
      nc_number: nc.nc_number,
      category: nc.category,
      area: nc.area,
      description: nc.description,
      impact: nc.impact,
      root_cause: nc.root_cause || '',
      immediate_action: nc.immediate_action || '',
      corrective_action: nc.corrective_action || '',
      responsible: nc.responsible || '',
      status: nc.status,
      detected_by: nc.detected_by || '',
      lesson_learned: nc.lesson_learned || '',
      project_id: nc.project_id || '',
    });
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ShieldAlert size={24} /> No Conformidades</h3>
          <p className="text-red-100 text-sm mt-1">Sistema transversal de gestión de desvíos — Compatible ISO 9001</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total NC', value: stats.total, icon: <FileText size={16} />, color: 'text-gray-700' },
          { label: 'Abiertas', value: stats.abiertas, icon: <AlertTriangle size={16} />, color: 'text-red-600' },
          { label: 'Cerradas', value: stats.cerradas, icon: <CheckCircle2 size={16} />, color: 'text-green-600' },
          { label: 'Tiempo Prom. (días)', value: stats.tiempoPromedio, icon: <Clock size={16} />, color: 'text-blue-600' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar NC, descripción o área..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
            <option value="all">Todos los estados</option>
            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
            <option value="all">Todas las categorías</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => { resetForm(); setSelectedNC(null); setForm(f => ({ ...f, nc_number: nextNCNumber })); setShowForm(true); }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-red-700 hover:shadow-lg transition-all">
            <Plus size={16} /> Nueva NC
          </button>
        </div>
      </div>

      {/* NC List */}
      <div className="light-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">NC #</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-center">Impacto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(nc => (
              <tr key={nc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-gray-800">{nc.nc_number}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CATEGORIES[nc.category]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {CATEGORIES[nc.category]?.label || nc.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-800 line-clamp-1">{nc.description}</div>
                  {nc.area && <div className="text-xs text-gray-400">{nc.area}</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${IMPACTS[nc.impact]?.color || 'bg-gray-100'}`}>
                    {IMPACTS[nc.impact]?.label || nc.impact}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${STATUSES[nc.status]?.color || 'bg-gray-100'}`}>
                    {STATUSES[nc.status]?.icon} {STATUSES[nc.status]?.label || nc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{nc.responsible || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEdit(nc)} className="text-red-600 hover:text-red-800 p-1"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                <ShieldAlert size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay No Conformidades</p>
                <p className="text-sm">Hacé clic en "Nueva NC" para registrar un desvío.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-600" />
                {selectedNC ? `Editar ${form.nc_number}` : 'Nueva No Conformidad'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Row 1: NC Number + Category + Area */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Número NC</label>
                  <input value={form.nc_number} onChange={e => setForm({ ...form, nc_number: e.target.value })} readOnly={!!selectedNC}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Categoría *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as NonConformity['category'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Área</label>
                  <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="Ej: Depósito, Obra Sur..." />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Descripción del Desvío *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="Describir qué ocurrió, qué se desvió del procedimiento..." />
              </div>

              {/* Impact + Status + Project */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Impacto</label>
                  <select value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value as NonConformity['impact'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    {Object.entries(IMPACTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as NonConformity['status'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Obra / Proyecto</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    <option value="">General</option>
                    {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Detected by + Responsible */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Detectado por</label>
                  <input value={form.detected_by} onChange={e => setForm({ ...form, detected_by: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="Nombre de quien detectó" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Responsable de la Acción</label>
                  <input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="Nombre del responsable" />
                </div>
              </div>

              {/* PDCA Fields */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-red-500" /> Ciclo PDCA — Análisis y Acción
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Acción Inmediata</label>
                    <textarea value={form.immediate_action} onChange={e => setForm({ ...form, immediate_action: e.target.value })} rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="¿Qué se hizo inmediatamente para contener el desvío?" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Causa Raíz</label>
                    <textarea value={form.root_cause} onChange={e => setForm({ ...form, root_cause: e.target.value })} rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="¿Por qué ocurrió? Análisis 5 porqué o similar..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Acción Correctiva</label>
                    <textarea value={form.corrective_action} onChange={e => setForm({ ...form, corrective_action: e.target.value })} rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="¿Qué se modifica para evitar que vuelva a ocurrir?" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Lección Aprendida</label>
                    <textarea value={form.lesson_learned} onChange={e => setForm({ ...form, lesson_learned: e.target.value })} rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="¿Qué aprendimos para incorporar al sistema?" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm">Cancelar</button>
              <button onClick={handleSubmit} disabled={!form.description || createNC.isPending || updateNC.isPending}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-red-700 disabled:opacity-50 transition-all">
                <Save size={16} /> {selectedNC ? 'Guardar Cambios' : 'Registrar NC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
