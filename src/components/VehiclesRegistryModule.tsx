import React, { useMemo } from 'react';
import { Truck, DollarSign, Activity, Wrench, AlertCircle } from 'lucide-react';
import { useFuelVehicles, useFuelLoads, useLogisticsMaintenanceLog } from '../hooks/useData';

export const VehiclesRegistryModule: React.FC = () => {
  const { data: vehicles = [], isLoading: isLoadingV } = useFuelVehicles();
  const { data: fuelLoads = [], isLoading: isLoadingF } = useFuelLoads();
  const { data: maintenanceLogs = [], isLoading: isLoadingM } = useLogisticsMaintenanceLog();

  const isLoading = isLoadingV || isLoadingF || isLoadingM;

  // Calculate Global KPIs based on real data
  const { avgCostPerKm, avgAvailability, ratioMaintStr } = useMemo(() => {
    if (vehicles.length === 0) return { avgCostPerKm: 0, avgAvailability: 100, ratioMaintStr: '0% Prev / 0% Corr' };
    
    let totalFuelCost = 0;
    fuelLoads.forEach(fl => totalFuelCost += (fl.total_amount || 0));
    let totalMaintCost = 0;
    let countPrev = 0;
    let countCorr = 0;
    
    maintenanceLogs.forEach(ml => {
      totalMaintCost += (ml.cost || 0);
      if (ml.type === 'service' || ml.type === 'vtv' || ml.type === 'seguro') countPrev++;
      else countCorr++;
    });

    // Approximate total KM (sum of current_km of active vehicles)
    let totalKm = vehicles.reduce((sum, v) => sum + (v.current_km || 0), 1);
    if (totalKm === 0) totalKm = 1; // Prevent division by zero

    const avgCostPerKm = (totalFuelCost + totalMaintCost) / totalKm;
    const totalMaintCount = countPrev + countCorr || 1;
    const ratioMaintStr = `${Math.round((countPrev/totalMaintCount)*100)}% Prev / ${Math.round((countCorr/totalMaintCount)*100)}% Corr`;
    
    // Availability based on maintenance status
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const avgAvailability = ((vehicles.length - vehiclesInMaintenance) / vehicles.length) * 100;

    return { avgCostPerKm, avgAvailability, ratioMaintStr };
  }, [vehicles, fuelLoads, maintenanceLogs]);

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
          <p className="text-amber-100 text-sm mt-1">Análisis de costos, disponibilidad y eficiencia de la flota basado en consumos reales.</p>
        </div>
      </div>

      {/* KPIs Generales de Flota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><DollarSign size={16} className="text-red-500" /> Costo Operativo Prom.</div>
          <p className="text-2xl font-black text-red-600 font-mono relative z-10">$ {avgCostPerKm.toLocaleString(undefined, { maximumFractionDigits: 2 })} / Km</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Truck size={16} className="text-emerald-500" /> Tasa de Disponibilidad</div>
          <p className="text-2xl font-black text-emerald-600 font-mono relative z-10">{avgAvailability.toFixed(1)} %</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-blue-500" /> Ratio Mantenimiento</div>
          <p className="text-2xl font-black text-blue-600 font-mono relative z-10">{ratioMaintStr}</p>
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
              {vehicles.map((v) => {
                // Cálculos reales
                const vFuelLoads = fuelLoads.filter(fl => fl.vehicle_id === v.id);
                const vMaintLogs = maintenanceLogs.filter(ml => ml.vehicle_id === v.id);
                
                const vFuelCost = vFuelLoads.reduce((sum, fl) => sum + (fl.total_amount || 0), 0);
                const vFuelLiters = vFuelLoads.reduce((sum, fl) => sum + (fl.liters || 0), 0);
                const vMaintCost = vMaintLogs.reduce((sum, ml) => sum + (ml.cost || 0), 0);
                const currentKm = v.current_km || 1;
                
                const costoKm = (vFuelCost + vMaintCost) / currentKm;
                const eficiencia = vFuelLiters > 0 ? (currentKm / vFuelLiters).toFixed(1) : 'N/A';
                const disponibilidad = v.status === 'maintenance' ? 0 : 100;
                
                const isWarning = (v.status === 'maintenance') || (disponibilidad < 90) || (costoKm > 3000);

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
