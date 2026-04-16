import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { UserCircle, HardHat, FileText, Search } from 'lucide-react';

export const RrhhModule: React.FC = () => {
  const { employees, projects } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const filtered = employees.filter(e => {
    const matchSearch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.cuil.includes(searchTerm);
    const matchCat = filterCat ? e.uocraCategory === filterCat : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-gray-200 pb-4">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2"><HardHat size={24} className="text-ecar-blue"/> Gestión RRHH - Convenio UOCRA SJ</h2>
           <p className="text-sm text-gray-500 mt-1">Nómina de personal operativo con perfiles de tarea homologados.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por Nombre o CUIL..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded shadow-sm text-sm w-full md:w-64 focus:outline-none focus:border-ecar-blue"
            />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-gray-300 rounded px-4 py-2 text-sm shadow-sm focus:outline-none focus:border-ecar-blue">
             <option value="">Categorías UOCRA</option>
             <option value="Oficial Especializado">Oficial Especializado</option>
             <option value="Oficial">Oficial</option>
             <option value="Medio Oficial">Medio Oficial</option>
             <option value="Ayudante">Ayudante</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(emp => {
          const project = projects.find(p => p.id === emp.currentProjectId);
          return (
            <div key={emp.id} className="bg-white border text-left border-gray-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <UserCircle size={40} className="text-gray-300" />
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">{emp.fullName}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">CUIL: {emp.cuil}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    emp.uocraCategory === 'Oficial Especializado' ? 'bg-purple-100 text-purple-700' :
                    emp.uocraCategory === 'Oficial' ? 'bg-blue-100 text-blue-700' :
                    emp.uocraCategory === 'Medio Oficial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {emp.uocraCategory}
                  </span>
                </div>
                
                <div className="bg-gray-50/50 p-3 rounded border border-gray-100 text-sm text-gray-600 min-h-[80px]">
                  <strong>Perfil Operativo:</strong> {emp.profileDesc}
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm">
                   {project ? (
                     <><div className="w-2 h-2 rounded-full bg-green-500"></div> <span className="font-medium text-gray-700 truncate max-w-[150px]">{project.name}</span></>
                   ) : (
                     <><div className="w-2 h-2 rounded-full bg-orange-400"></div> <span className="font-medium text-gray-500">Sin asignar (En espera)</span></>
                   )}
                 </div>
                 <button className="text-ecar-blue hover:text-ecar-blueDark p-1" title="Ver Legajo">
                    <FileText size={18} />
                 </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
         <div className="text-center py-12 text-gray-400">
            No se encontraron operarios con esos filtros.
         </div>
      )}

    </div>
  );
};
