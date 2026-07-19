import React from 'react';
import { Truck, DollarSign, Activity, Wrench, AlertCircle } from 'lucide-react';
import { useFuelVehicles } from '../hooks/useData';

export const VehiclesRegistryModule: React.FC = () => {
  const { data: vehicles = [], isLoading } = useFuelVehicles();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Activity size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Activity size={24} /> Desempeño de Vehículos (KPIs)</h3>
          <p className="text-amber-100 text-sm mt-1">Análisis de costos, disponibilidad y eficiencia de la flota.</p>
        </div>
      </div>

      {/* KPIs Generales de Flota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><DollarSign size={16} className="text-red-500" /> Costo Operativo Prom.</div>
          <p className="text-2xl font-black text-red-600 font-mono relative z-10">$ 2,450 / Km</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Truck size={16} className="text-emerald-500" /> Tasa de Disponibilidad</div>
          <p className="text-2xl font-black text-emerald-600 font-mono relative z-10">94.5 %</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-blue-500" /> Ratio Mantenimiento</div>
          <p className="text-2xl font-black text-blue-600 font-mono relative z-10">80% Prev / 20% Corr</p>
        </div>
      </div>

      {/* Lista de Vehículos y KPIs individuales */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Métricas por Unidad</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th >Vehículo</th>
                <th className="text-right">Costo / Km</th>
                <th className="text-right">Eficiencia (Km/L)</th>
                <th className="text-center">Disponibilidad</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => {
                // Valores mockeados basados en el índice temporalmente
                const costoKm = 2000 + (i * 150);
                const eficiencia = (10 - (i * 0.5)).toFixed(1);
                const disponibilidad = 100 - (i * 2);
                const isWarning = disponibilidad < 90 || costoKm > 3000;

                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td >
                      <div className="font-bold text-gray-800">{v.code} - {v.plate}</div>
                      <div className="text-xs text-gray-500">{v.description}</div>
                    </td>
                    <td className="text-right font-mono text-gray-700">
                      $ {costoKm.toLocaleString()}
                    </td>
                    <td className="text-right font-mono text-gray-700">
                      {eficiencia} Km/L
                    </td>
                    <td className="text-center font-mono">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${disponibilidad >= 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {disponibilidad}%
                      </span>
                    </td>
                    <td className="text-center">
                      {isWarning ? (
                        <span className="flex items-center justify-center gap-1 text-red-500 text-xs font-bold">
                          <AlertCircle size={14} /> Revisar
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400">No hay vehículos registrados en la flota.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
