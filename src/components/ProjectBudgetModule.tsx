import React, { useState } from 'react';
import { HardHat, Search, Plus, Package, Calculator, FolderOpen } from 'lucide-react';
import { useBudgets, useProjects } from '../hooks/useData';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export const ProjectBudgetModule: React.FC = () => {
  const { data: budgets, isLoading } = useBudgets();
  useProjects();
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-cyan-600 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = (budgets || []).filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    (b.project?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><HardHat size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><HardHat size={24} /> Proyectos & Presupuestos</h3>
          <p className="text-cyan-100 text-sm mt-1">Estimación de costos, APUs y control presupuestario de obras</p>
        </div>
      </div>

      {/* Acciones & Buscador */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar por nombre o proyecto..." 
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" 
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border hover:bg-gray-200 transition-all">
            <Calculator size={16} /> Base de Precios
          </button>
          <button className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark hover:shadow-lg transition-all">
            <Plus size={16} /> Nuevo Presupuesto
          </button>
        </div>
      </div>

      {/* Lista de Presupuestos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Presupuestos Registrados</h3>
        </div>
        
        {filtered.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Presupuesto</th>
                <th className="px-4 py-3">Proyecto Asociado</th>
                <th className="px-4 py-3 text-center">Versión</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Total Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(budget => (
                <tr key={budget.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex flex-col">
                      <span>{budget.name}</span>
                      {budget.description && <span className="text-xs text-gray-500 font-normal">{budget.description}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {budget.project?.name ? (
                      <div className="flex items-center gap-1.5">
                        <FolderOpen size={14} className="text-cyan-600" />
                        {budget.project.name}
                      </div>
                    ) : (
                      <span className="text-gray-400">Sin proyecto asignado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">v{budget.version}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      budget.status === 'approved' ? 'bg-green-100 text-green-700' :
                      budget.status === 'revision' ? 'bg-yellow-100 text-yellow-700' :
                      budget.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {budget.status === 'approved' ? 'Aprobado' :
                       budget.status === 'revision' ? 'En Revisión' :
                       budget.status === 'closed' ? 'Cerrado' :
                       'Borrador'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">
                    {fmt(budget.total_final_ars)}
                  </td>
                </tr>
              ))}
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
