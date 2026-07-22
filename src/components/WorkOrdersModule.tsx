import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Search, Plus, X, Save,
  Clock, CheckCircle, AlertTriangle, PlayCircle
} from 'lucide-react';
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useProjects } from '../hooks/useData';
import type { WorkOrder } from '../lib/types';

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  en_ejecucion: 'bg-blue-100 text-blue-800 border-blue-200',
  completada: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  baja: 'text-gray-500',
  normal: 'text-blue-500',
  alta: 'text-orange-500',
  urgente: 'text-red-600',
};

export const WorkOrdersModule: React.FC = () => {
  const { data: workOrders, isLoading } = useWorkOrders();
  const { data: projects } = useProjects();
  const createWO = useCreateWorkOrder();
  const updateWO = useUpdateWorkOrder();

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    assigned_to: '',
    priority: 'normal' as WorkOrder['priority'],
    status: 'pendiente' as WorkOrder['status'],
    start_date: '',
    due_date: '',
    notes: '',
  });

  const filtered = useMemo(() => {
    if (!workOrders) return [];
    let res = workOrders;
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(x => x.title.toLowerCase().includes(s) || x.assigned_to?.toLowerCase().includes(s));
    }
    if (filterProject) res = res.filter(x => x.project_id === filterProject);
    if (filterStatus) res = res.filter(x => x.status === filterStatus);
    return res;
  }, [workOrders, search, filterProject, filterStatus]);

  const handleSubmit = async () => {
    try {
      if (selectedWO) {
        await updateWO.mutateAsync({ id: selectedWO.id, ...form });
      } else {
        await createWO.mutateAsync(form);
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setSelectedWO(null);
    setForm({ project_id: '', title: '', description: '', assigned_to: '', priority: 'normal', status: 'pendiente', start_date: '', due_date: '', notes: '' });
  };

  const openEdit = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setForm({
      project_id: wo.project_id || '',
      title: wo.title,
      description: wo.description || '',
      assigned_to: wo.assigned_to || '',
      priority: wo.priority,
      status: wo.status,
      start_date: wo.start_date || '',
      due_date: wo.due_date || '',
      notes: wo.notes || '',
    });
    setShowForm(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-ecar-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardList size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ClipboardList size={24} /> Órdenes de Trabajo Internas (OTI)</h3>
          <p className="text-blue-100 text-sm mt-1">Gerencia de Obras — Asignación y control de cuadrillas</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full flex-wrap">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar título o encargado..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-48">
            <option value="">Todos los proyectos</option>
            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-40">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_ejecucion">En Ejecución</option>
            <option value="completada">Completadas</option>
          </select>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva OTI
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(wo => (
          <div key={wo.id} onClick={() => openEdit(wo)} className="light-card p-4 cursor-pointer hover:-translate-y-1 transition-transform border-t-4" style={{ borderTopColor: wo.priority === 'urgente' ? '#ef4444' : wo.priority === 'alta' ? '#f97316' : '#3b82f6' }}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-800 line-clamp-1 flex-1">{wo.title}</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${STATUS_COLORS[wo.status]}`}>
                {wo.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[32px]">{wo.description || 'Sin descripción'}</div>
            
            <div className="space-y-1.5 mb-4 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Proyecto:</span>
                <span className="font-medium text-gray-800 truncate ml-2 max-w-[150px]">{wo.project?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Encargado:</span>
                <span className="font-medium text-gray-800">{wo.assigned_to || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Vencimiento:</span>
                <span className="font-medium text-gray-800">{wo.due_date ? new Date(wo.due_date).toLocaleDateString('es-AR') : '—'}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-10">No se encontraron Órdenes de Trabajo.</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-full flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ClipboardList size={20} className="text-ecar-blue" />
                {selectedWO ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo Interna (OTI)'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Título de la Tarea *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ej. Llenado de base columna 4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Proyecto</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Uso General / Depósito</option>
                    {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Encargado / Cuadrilla</label>
                  <input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ej. Cuadrilla Pérez" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Descripción Detallada</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Instrucciones para la ejecución..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Prioridad</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold ${PRIORITY_COLORS[form.priority]}`}>
                    <option value="baja" className="text-gray-500">Baja</option>
                    <option value="normal" className="text-blue-500">Normal</option>
                    <option value="alta" className="text-orange-500">Alta</option>
                    <option value="urgente" className="text-red-600">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="pendiente">Pendiente</option>
                    <option value="en_ejecucion">En Ejecución</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Fecha de Inicio Estimada</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Fecha Límite (Due Date)</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 font-bold text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSubmit} disabled={!form.title || createWO.isPending || updateWO.isPending}
                className="btn-primary">
                <Save size={16} /> Guardar Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
