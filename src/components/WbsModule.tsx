import React, { useState } from 'react';
import { Target, Plus, X, ChevronRight, FolderTree } from 'lucide-react';
import { useProjects, useCreateProject, useWbsElements } from '../hooks/useData';


export const WbsModule: React.FC = () => {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: wbs = [] } = useWbsElements(selectedProjectId || undefined);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', client_name: '', client_cuit: '', location: '', budget_ars: 0, start_date: '' });

  const handleCreate = async () => {
    await createProject.mutateAsync(form as any);
    setShowForm(false);
    setForm({ name: '', client_name: '', client_cuit: '', location: '', budget_ars: 0, start_date: '' });
  };

  const formatARS = (v: number) => v >= 1e6 ? `A$ ${(v / 1e6).toFixed(1)}M` : `A$ ${v.toLocaleString()}`;

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando planificación...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Target size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Target size={24} /> Planificación WBS</h3>
          <p className="text-cyan-100 text-sm mt-1">{projects.length} obras registradas. Estructura de desglose de trabajo con presupuesto y avance.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
          <Plus size={16} /> Nueva Obra
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Nueva Obra</h3><button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button></div>
            <input placeholder="Nombre de la obra" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Cliente" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="CUIT Cliente" value={form.client_cuit} onChange={e => setForm({ ...form, client_cuit: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Ubicación" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" placeholder="Presupuesto ARS" value={form.budget_ars || ''} onChange={e => setForm({ ...form, budget_ars: parseFloat(e.target.value) || 0 })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="px-3 py-2 border rounded-lg text-sm col-span-2" />
            </div>
            <button onClick={handleCreate} disabled={!form.name || createProject.isPending} className="w-full bg-ecar-blue text-white py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {createProject.isPending ? 'Creando...' : 'Crear Obra'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Projects list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800 text-sm">Obras</h3></div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {projects.length === 0 && <p className="p-4 text-gray-400 text-sm">Sin obras. Creá la primera.</p>}
            {projects.map(p => (
              <button key={p.id} onClick={() => setSelectedProjectId(p.id)} className={`w-full text-left p-4 hover:bg-gray-50 transition-all flex items-center gap-3 ${selectedProjectId === p.id ? 'bg-blue-50 border-l-4 border-ecar-blue' : ''}`}>
                <FolderTree size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.client_name || 'Sin cliente'} · {formatARS(p.budget_ars)}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* WBS Tree */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800 text-sm">Estructura WBS</h3></div>
          {!selectedProjectId ? (
            <div className="text-center py-16 text-gray-400 text-sm">Seleccioná una obra para ver su WBS</div>
          ) : wbs.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Sin elementos WBS. Próximamente: editor visual.</div>
          ) : (
            <div className="p-4 space-y-2">
              {wbs.map(el => (
                <div key={el.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{el.name}</span>
                    <span className="text-xs text-gray-400">{el.progress_pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-ecar-blue h-1.5 rounded-full" style={{ width: `${el.progress_pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
