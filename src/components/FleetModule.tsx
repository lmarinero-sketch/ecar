import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Truck, MapPin, Wrench, CheckCircle, Clock } from 'lucide-react';

export const FleetModule: React.FC = () => {
  const { assets, projects, items } = useStore();
  const [filterMode, setFilterMode] = useState<string>('All');

  const filteredAssets = assets.filter(a => filterMode === 'All' || a.status === filterMode);

  return (
    <div className="space-y-6">
      
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm text-orange-900">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Truck size={20}/> Gestión de Flota Pesada y Equipamiento (San Juan)</h3>
        <p className="text-sm">
          Aquí gestionas el traslado físico y contable de los grandes equipos. Al asignar una excavadora a un frente de obra, el Sistema ERP devengará su costo diario de amortización directamente a los "Costos Generales" de esa orden de trabajo (WBS).
        </p>
      </div>

      <div className="flex gap-2">
        {['All', 'Available', 'Assigned', 'Maintenance', 'InTransit'].map(sts => (
          <button 
            key={sts} 
            onClick={() => setFilterMode(sts)}
            className={`px-4 py-1.5 text-sm font-bold rounded-full border transition-all ${filterMode === sts ? 'bg-ecar-blue text-white border-ecar-blue' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}
          >
            {sts === 'All' ? 'Todos' : sts === 'Available' ? 'Disponibles' : sts === 'Assigned' ? 'Asignados' : sts === 'Maintenance' ? 'En Taller' : 'En Tránsito'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.map(asset => {
          const itemDef = items.find(i => i.id === asset.itemId);
          const project = projects.find(p => p.id === asset.currentProjectId);
          
          return (
            <div key={asset.id} className="light-card p-5 flex flex-col justify-between hover:border-gray-400 transition-all cursor-pointer">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900 leading-tight">{itemDef?.name || 'Equipamiento pesado'}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    asset.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                    asset.status === 'Available' ? 'bg-green-100 text-green-700' :
                    asset.status === 'Maintenance' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {asset.status === 'Maintenance' ? 'En Taller' : asset.status === 'Available' ? 'Disponible' : asset.status === 'InTransit' ? 'Tránsito' : 'Asignado'}
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-400">S/N: {asset.serialNumber}</p>
                
                <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-600 h-10">
                   {asset.status === 'Assigned' && project ? (
                     <><MapPin size={16} className="text-ecar-blue shrink-0"/> <span className="font-medium line-clamp-2 leading-tight">{project.name}</span></>
                   ) : asset.status === 'Maintenance' ? (
                     <><Wrench size={16} className="text-red-500 shrink-0"/> <span className="font-medium">Taller Central SJ</span></>
                   ) : asset.status === 'InTransit' ? (
                     <><Clock size={16} className="text-orange-500 shrink-0"/> <span className="font-medium">En ruta a obra...</span></>
                   ) : (
                     <><CheckCircle size={16} className="text-green-500 shrink-0"/> <span className="font-medium">Depósito Central</span></>
                   )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Deprec. Diaria</p>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">A$ {asset.dailyDepreciationARS.toLocaleString()}</p>
                </div>
                {asset.status === 'Available' && (
                  <button className="bg-gray-100 hover:bg-ecar-blue hover:text-white transition-colors text-gray-600 font-bold text-xs px-3 py-1.5 rounded">
                     Asignar a Obra
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
