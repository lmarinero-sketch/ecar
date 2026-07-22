import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, Search, Plus, X, Save,
  Trash2
} from 'lucide-react';
import { useQualityChecklists, useCreateQualityChecklist, useUpdateQualityChecklist, useProjects, useWbsElements } from '../hooks/useData';
import type { QualityChecklist, QualityChecklistItem } from '../lib/types';

export const QualityModule: React.FC = () => {
  const { data: checklists, isLoading } = useQualityChecklists();
  const { data: projects } = useProjects();
  const { data: wbsElements } = useWbsElements();
  const createQC = useCreateQualityChecklist();
  const updateQC = useUpdateQualityChecklist();

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedQC, setSelectedQC] = useState<QualityChecklist | null>(null);

  const [form, setForm] = useState({
    project_id: '',
    wbs_element_id: '',
    title: '',
    inspector_name: '',
    items: [] as QualityChecklistItem[],
    status: 'draft' as QualityChecklist['status'],
    notes: '',
  });

  const filtered = useMemo(() => {
    if (!checklists) return [];
    let res = checklists;
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(x => x.title.toLowerCase().includes(s) || x.project?.name.toLowerCase().includes(s));
    }
    if (filterProject) res = res.filter(x => x.project_id === filterProject);
    return res;
  }, [checklists, search, filterProject]);

  const score = useMemo(() => {
    if (form.items.length === 0) return 0;
    const applicable = form.items.filter(i => i.status !== 'na');
    if (applicable.length === 0) return 100;
    const passed = applicable.filter(i => i.status === 'pass').length;
    return Math.round((passed / applicable.length) * 100);
  }, [form.items]);

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', status: 'na' }] });
  
  const updateItem = (index: number, field: keyof QualityChecklistItem, value: string) => {
    const newItems = [...form.items];
    (newItems[index] as any)[field] = value;
    setForm({ ...form, items: newItems });
  };
  
  const removeItem = (index: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });

  const handleSubmit = async () => {
    try {
      const payload = { ...form, score, wbs_element_id: form.wbs_element_id || null };
      if (selectedQC) {
        await updateQC.mutateAsync({ id: selectedQC.id, ...payload });
      } else {
        await createQC.mutateAsync(payload);
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setSelectedQC(null);
    setForm({ project_id: '', wbs_element_id: '', title: '', inspector_name: '', items: [], status: 'draft', notes: '' });
  };

  const openEdit = (qc: QualityChecklist) => {
    setSelectedQC(qc);
    setForm({
      project_id: qc.project_id || '',
      wbs_element_id: qc.wbs_element_id || '',
      title: qc.title,
      inspector_name: qc.inspector_name || '',
      items: qc.items || [],
      status: qc.status,
      notes: qc.notes || '',
    });
    setShowForm(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-teal-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardCheck size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ClipboardCheck size={24} /> Calidad y Cierre de Etapa</h3>
          <p className="text-emerald-100 text-sm mt-1">Gerencia de Obras — Auditorías e Inspecciones (PR-GO-01)</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar checklist..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-48">
            <option value="">Todos</option>
            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none flex items-center gap-2">
          <Plus size={16} /> Nueva Inspección
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(qc => (
          <div key={qc.id} className="light-card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(qc)}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-800 line-clamp-1">{qc.title}</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${qc.status === 'approved' ? 'bg-green-100 text-green-700' : qc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                {qc.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{qc.project?.name || 'Obra General'}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1"><ClipboardCheck size={14} /> {qc.items?.length || 0} ítems</div>
              <div className="flex items-center gap-1 font-bold text-emerald-600">Puntaje: {qc.score}%</div>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 flex justify-between">
              <span>{qc.inspector_name || 'Sin inspector'}</span>
              <span>{new Date(qc.created_at).toLocaleDateString('es-AR')}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-10">No hay inspecciones registradas.</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-full flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-emerald-500" />
                {selectedQC ? 'Editar Inspección' : 'Nueva Inspección de Calidad'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Proyecto</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Uso General</option>
                    {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tarea WBS (Opcional)</label>
                  <select value={form.wbs_element_id} onChange={e => setForm({ ...form, wbs_element_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Sin Tarea vinculada</option>
                    {(wbsElements || []).filter(w => !form.project_id || w.project_id === form.project_id).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Título de la Inspección / Etapa *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ej. Llenado de losa, Hormigonado..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nombre del Inspector</label>
                  <input value={form.inspector_name} onChange={e => setForm({ ...form, inspector_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Jefe de Obra o Calidad" />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-gray-700">Ítems de Control</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Score: {score}%</span>
                    <button onClick={addItem} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1">
                      <Plus size={14} /> Agregar Ítem
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <div className="flex-1 space-y-2">
                        <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Parámetro a verificar..." />
                        <input value={item.notes || ''} onChange={e => updateItem(idx, 'notes', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600" placeholder="Observaciones..." />
                      </div>
                      <select value={item.status} onChange={e => updateItem(idx, 'status', e.target.value)}
                        className={`border rounded px-2 py-1.5 text-sm font-bold w-24 ${
                          item.status === 'pass' ? 'bg-green-100 text-green-800 border-green-200' : 
                          item.status === 'fail' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                        <option value="pass">Aprobó</option>
                        <option value="fail">Falló</option>
                        <option value="na">N/A</option>
                      </select>
                      <button onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {form.items.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">No hay ítems agregados.</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Estado Final de Inspección</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold">
                    <option value="draft">Borrador / En Proceso</option>
                    <option value="approved">Aprobado / Certificable</option>
                    <option value="rejected">Rechazado / Rehacer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Notas Generales</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 font-bold text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSubmit} disabled={!form.title || createQC.isPending || updateQC.isPending}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none">
                <Save size={16} /> Guardar Inspección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
