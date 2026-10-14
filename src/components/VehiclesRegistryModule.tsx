import React, { useMemo } from 'react';
import { Truck, DollarSign, Activity, Wrench, AlertCircle, Clock } from 'lucide-react';
import { useFuelVehicles, useFuelLoads, useLogisticsMaintenanceLog, useVehicleDailyReports } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { isVehicleHoursTracking } from '../lib/vehicleMaintenance';

const ESTIMATED_BATAN_PRICE_PER_LITER = 2470; // Costo promedio Diesel Evolux

export const VehiclesRegistryModule: React.FC = () => {
  const { canViewCosts } = useAuth();
  const { data: vehicles = [], isLoading: isLoadingV } = useFuelVehicles();
  const { data: fuelLoads = [], isLoading: isLoadingF } = useFuelLoads();
  const { data: maintenanceLogs = [], isLoading: isLoadingM } = useLogisticsMaintenanceLog();
  const { data: dailyReports = [], isLoading: isLoadingR } = useVehicleDailyReports();

  const isLoading = isLoadingV || isLoadingF || isLoadingM || isLoadingR;

  // Calculate Global KPIs based on real data
  const { avgCostPerKm, avgAvailability, ratioMaintStr, machineCount, truckCount } = useMemo(() => {
    if (vehicles.length === 0) {
      return { avgCostPerKm: 0, avgAvailability: 100, ratioMaintStr: '0% Prev / 0% Corr', machineCount: 0, truckCount: 0 };
    }
    
    let totalFuelCost = 0;
    fuelLoads.forEach(fl => {
      const amount = fl.total_amount && fl.total_amount > 0 
        ? fl.total_amount 
        : (fl.liters || 0) * ESTIMATED_BATAN_PRICE_PER_LITER;
      totalFuelCost += amount;
    });

    let totalMaintCost = 0;
    let countPrev = 0;
    let countCorr = 0;
    
    maintenanceLogs.forEach(ml => {
      totalMaintCost += (ml.cost || 0);
      if (ml.type === 'service' || ml.type === 'vtv' || ml.type === 'seguro') countPrev++;
      else countCorr++;
    });

    // Separar máquinas de rodados
    let totalKm = 0;
    let mCount = 0;
    let tCount = 0;

    vehicles.forEach(v => {
      if (isVehicleHoursTracking(v)) {
        mCount++;
      } else {
        tCount++;
        totalKm += (v.current_km || 0);
      }
    });

    if (totalKm === 0) totalKm = 1;

    const avgCostPerKm = (totalFuelCost + totalMaintCost) / totalKm;
    const totalMaintCount = countPrev + countCorr || 1;
    const ratioMaintStr = `${Math.round((countPrev/totalMaintCount)*100)}% Prev / ${Math.round((countCorr/totalMaintCount)*100)}% Corr`;
    
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const avgAvailability = ((vehicles.length - vehiclesInMaintenance) / vehicles.length) * 100;

    return { avgCostPerKm, avgAvailability, ratioMaintStr, machineCount: mCount, truckCount: tCount };
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
          <h3 className="font-bold text-2xl flex items-center gap-2"><Activity size={24} /> Desempeño de Flota y Maquinaria (KPIs)</h3>
          <p className="text-amber-100 text-sm mt-1">Análisis de costos, disponibilidad y consumos reales por hora (maquinarias) o por kilómetro (rodados).</p>
        </div>
      </div>

      {/* KPIs Generales de Flota */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Truck size={16} className="text-blue-500" /> Total Parque Activo</div>
          <p className="text-2xl font-black text-blue-600 font-mono relative z-10">{vehicles.length} Unidades</p>
          <p className="text-xs text-gray-500 mt-1">{machineCount} Máquinas / {truckCount} Rodados</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Truck size={16} className="text-emerald-500" /> Tasa de Disponibilidad</div>
          <p className="text-2xl font-black text-emerald-600 font-mono relative z-10">{avgAvailability.toFixed(1)} %</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-amber-500" /> Ratio Mantenimiento</div>
          <p className="text-2xl font-black text-amber-600 font-mono relative z-10">{ratioMaintStr}</p>
        </div>
        {canViewCosts && (
          <div className="kpi-card">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><DollarSign size={16} className="text-red-500" /> Costo Promedio Flota</div>
            <p className="text-2xl font-black text-red-600 font-mono relative z-10">$ {avgCostPerKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} / Km</p>
          </div>
        )}
      </div>

      {/* Lista de Vehículos y KPIs individuales */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Métricas por Unidad (Combustible & Mantenimiento)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Unidad</th>
                <th className="text-center">Tipo</th>
                <th className="text-right">Uso Registrado</th>
                <th className="text-right">Consumo / Eficiencia</th>
                {canViewCosts && <th className="text-right">Costo Operativo</th>}
                <th className="text-center">Disponibilidad</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const isHours = isVehicleHoursTracking(v);
                const vFuelLoads = fuelLoads.filter(fl => fl.vehicle_id === v.id);
                const vMaintLogs = maintenanceLogs.filter(ml => ml.vehicle_id === v.id);
                const vReports = dailyReports
                  .filter(r => r.vehicle_id === v.id)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                const vFuelCost = vFuelLoads.reduce((sum, fl) => {
                  const amt = fl.total_amount && fl.total_amount > 0 
                    ? fl.total_amount 
                    : (fl.liters || 0) * ESTIMATED_BATAN_PRICE_PER_LITER;
                  return sum + amt;
                }, 0);
                const vFuelLiters = vFuelLoads.reduce((sum, fl) => sum + (fl.liters || 0), 0);
                const vMaintCost = vMaintLogs.reduce((sum, ml) => sum + (ml.cost || 0), 0);
                const totalCost = vFuelCost + vMaintCost;

                let usoLabel = '';
                let consumoLabel = 'N/A';
                let costoUnitarioLabel = 'N/A';

                if (isHours) {
                  // Calcular delta de horas según reportes
                  const hoursReadings = vReports
                    .map(r => r.hourmeter ?? 0)
                    .filter(h => h > 0);
                  
                  let deltaHours = 0;
                  if (hoursReadings.length >= 2) {
                    deltaHours = Math.max(...hoursReadings) - Math.min(...hoursReadings);
                  } else if (v.current_hours && v.current_hours > 0) {
                    deltaHours = v.current_hours;
                  }

                  usoLabel = deltaHours > 0 ? `${deltaHours.toLocaleString(undefined, { maximumFractionDigits: 1 })} hs` : `${v.current_hours || 0} hs`;
                  
                  if (deltaHours > 0 && vFuelLiters > 0) {
                    const lph = vFuelLiters / deltaHours;
                    consumoLabel = `${lph.toFixed(2)} L/h`;
                  }

                  if (deltaHours > 0 && totalCost > 0) {
                    costoUnitarioLabel = `$ ${(totalCost / deltaHours).toLocaleString(undefined, { maximumFractionDigits: 0 })} / h`;
                  }
                } else {
                  // Kilómetros
                  const kmReadings = vReports
                    .map(r => r.kilometers ?? 0)
                    .filter(k => k > 0);
                  
                  let deltaKm = 0;
                  if (kmReadings.length >= 2) {
                    deltaKm = Math.max(...kmReadings) - Math.min(...kmReadings);
                  } else {
                    deltaKm = v.current_km || 0;
                  }

                  usoLabel = deltaKm > 0 ? `${deltaKm.toLocaleString()} km` : `${v.current_km || 0} km`;

                  if (deltaKm > 0 && vFuelLiters > 0) {
                    const kpl = deltaKm / vFuelLiters;
                    consumoLabel = `${kpl.toFixed(1)} Km/L`;
                  }

                  if (deltaKm > 0 && totalCost > 0) {
                    costoUnitarioLabel = `$ ${(totalCost / deltaKm).toLocaleString(undefined, { maximumFractionDigits: 0 })} / Km`;
                  }
                }

                const disponibilidad = v.status === 'maintenance' ? 0 : 100;
                const isWarning = (v.status === 'maintenance') || (disponibilidad < 90);

                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td>
                      <div className="font-bold text-gray-800">{v.code} - {v.plate}</div>
                      <div className="text-xs text-gray-500">{v.description}</div>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isHours ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isHours ? <Clock size={12} /> : <Truck size={12} />}
                        {isHours ? 'Maquinaria' : 'Rodado'}
                      </span>
                    </td>
                    <td className="text-right font-mono text-gray-700">
                      {usoLabel}
                    </td>
                    <td className="text-right font-mono font-bold text-emerald-700">
                      {consumoLabel}
                    </td>
                    {canViewCosts && (
                      <td className="text-right font-mono text-gray-700">
                        {costoUnitarioLabel}
                      </td>
                    )}
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
                        <span className="text-emerald-500 font-semibold text-xs">Operativo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-6">No hay unidades registradas en la flota.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
