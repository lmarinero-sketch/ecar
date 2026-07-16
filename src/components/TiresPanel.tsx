import React, { useState } from 'react';
import { Circle, Plus, AlertTriangle } from 'lucide-react';
import { useFleetTires, useCreateFleetTire, useFuelVehicles } from '../hooks/useData';
import type { FleetTire } from '../lib/types';

export const TiresPanel: React.FC = () => {
  const { data: tires = [], isLoading } = useFleetTires();
  const { data: vehicles = [] } = useFuelVehicles();
  const createTire = useCreateFleetTire();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<FleetTire>>({ status: 'stock', km_installed: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return;
    
    await createTire.mutateAsync(formData as FleetTire);
    setShowForm(false);
    setFormData({ status: 'stock', km_installed: 0 });
  };

  const getHealthStatus = (tire: FleetTire) => {
    if (!tire.km_installed || !tire.expected_lifespan_km || !tire.vehicle?.current_km) return 'ok';
    const used = tire.vehicle.current_km - tire.km_installed;
    const remaining = tire.expected_lifespan_km - used;
    if (remaining < 2000) return 'critical';
    if (remaining < 5000) return 'warning';
    return 'ok';
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando Neumáticos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Circle className="text-gray-700" /> Control de Neumáticos
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Alta Cubierta
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="light-card p-5 space-y-4 border-l-4 border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Código/Serie *</label>
              <input required type="text" className="input" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Marca y Modelo</label>
              <input type="text" className="input" value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Ej: FateO Miler" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Medida</label>
              <input type="text" className="input" value={formData.size || ''} onChange={e => setFormData({ ...formData, size: e.target.value })} placeholder="Ej: 295/80 R22.5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Vehículo Instalado</label>
              <select className="input" value={formData.vehicle_id || ''} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value, status: e.target.value ? 'en_uso' : 'stock' })}>
                <option value="">(En Stock)</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Posición</label>
              <input type="text" className="input" value={formData.position || ''} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Ej: Eje 2 Der Ext" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Vida Útil (Km)</label>
              <input type="number" className="input" value={formData.expected_lifespan_km || ''} onChange={e => setFormData({ ...formData, expected_lifespan_km: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={createTire.isPending}>{createTire.isPending ? 'Guardando...' : 'Crear Neumático'}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b font-bold text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Medida / Marca</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Desgaste</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tires.map(tire => {
              const health = getHealthStatus(tire);
              const used = tire.vehicle?.current_km && tire.km_installed ? tire.vehicle.current_km - tire.km_installed : 0;
              const pct = tire.expected_lifespan_km ? Math.min(100, (used / tire.expected_lifespan_km) * 100) : 0;
              
              return (
                <tr key={tire.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{tire.code}</td>
                  <td className="px-4 py-3">
                    <p>{tire.size}</p>
                    <p className="text-xs text-gray-400">{tire.brand}</p>
                  </td>
                  <td className="px-4 py-3">
                    {tire.vehicle ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-ecar-blueLight/20 text-ecar-blueDark px-2 py-1 rounded">
                          {tire.vehicle.code}
                        </span>
                        <span className="text-xs text-gray-500">{tire.position}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Pañol / Stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      tire.status === 'en_uso' ? 'bg-green-100 text-green-700' :
                      tire.status === 'stock' ? 'bg-blue-100 text-blue-700' :
                      tire.status === 'en_recapado' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tire.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tire.status === 'en_uso' && tire.expected_lifespan_km ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-xs">
                          {health === 'critical' && <AlertTriangle size={14} className="text-red-500" />}
                          <span className={health === 'critical' ? 'text-red-600 font-bold' : 'text-gray-600'}>
                            {used.toLocaleString()} / {tire.expected_lifespan_km.toLocaleString()} km
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${health === 'critical' ? 'bg-red-500' : health === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
