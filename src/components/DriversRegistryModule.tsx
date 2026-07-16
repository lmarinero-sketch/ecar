import React from 'react';
import { Users, Shield, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useEmployees, useDriverKpis } from '../hooks/useData';

// Componente Placeholder para el Dashboard de Choferes
export const DriversRegistryModule: React.FC = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: driverKpis = [] } = useDriverKpis();

  // En un caso real, filtraríamos los empleados que tengan un rol de 'chofer'
  const drivers = employees.filter(e => e.is_driver);

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin" /></div>;
  }

  // Calculate averages from actual KPIs
  const validSafetyScores = driverKpis.filter(k => k.safety_score > 0).map(k => k.safety_score);
  const avgSafetyScore = validSafetyScores.length > 0 ? (validSafetyScores.reduce((a,b) => a+b, 0) / validSafetyScores.length).toFixed(0) : '100';
  
  const validEfficiencies = driverKpis.filter(k => k.efficiency_km_l > 0).map(k => k.efficiency_km_l);
  const avgEfficiency = validEfficiencies.length > 0 ? (validEfficiencies.reduce((a,b) => a+b, 0) / validEfficiencies.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Users size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Users size={24} /> Registro de Choferes</h3>
          <p className="text-blue-100 text-sm mt-1">Monitoreo de desempeño, KPIs y asignaciones de los conductores de la flota.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Shield size={16} className="text-emerald-500" /> Promedio Seguridad (Flota)</div>
          <p className="text-2xl font-black text-emerald-600 font-mono relative z-10">{avgSafetyScore}/100</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingUp size={16} className="text-blue-500" /> Eficiencia Promedio</div>
          <p className="text-2xl font-black text-blue-600 font-mono relative z-10">{avgEfficiency} Km/L</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><CheckCircle2 size={16} className="text-purple-500" /> Cumplimiento de Reportes</div>
          <p className="text-2xl font-black text-purple-600 font-mono relative z-10">92%</p>
        </div>
      </div>

      {/* Driver List Table */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Ranking y Perfiles de Choferes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Chofer</th>
                <th className="px-4 py-3 text-center">Carnet (Venc.)</th>
                <th className="px-4 py-3 text-center">Safety Score</th>
                <th className="px-4 py-3 text-center">Eficiencia</th>
                <th className="px-4 py-3 text-center">Alertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((driver, i) => {
                const kpis = driverKpis.find(k => k.driver_name === driver.full_name) || { safety_score: 100, efficiency_km_l: 0 };
                const safetyScore = kpis.safety_score;
                const efficiency = Number(kpis.efficiency_km_l).toFixed(1);
              
              // Lógica de Vencimiento
              let isExpired = false;
              let isExpiringSoon = false;
              if (driver.driver_license_expiry) {
                const expiry = new Date(driver.driver_license_expiry);
                const today = new Date();
                const diffTime = Math.abs(expiry.getTime() - today.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (expiry < today) {
                  isExpired = true;
                } else if (diffDays <= 30) {
                  isExpiringSoon = true;
                }
              }

              return (
                <tr key={driver.id || i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-800">{driver.full_name || `Chofer ${i + 1}`}</div>
                    <div className="text-xs text-gray-500">{driver.dni ? `DNI: ${driver.dni}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-bold">{driver.driver_license_category || 'N/A'}</div>
                    <div className={`text-xs ${isExpired ? 'text-red-500 font-bold' : isExpiringSoon ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                      {driver.driver_license_expiry || 'Sin fecha'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${safetyScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {safetyScore}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-600">{efficiency} Km/L</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {isExpired && <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full"><AlertTriangle size={12}/> Vencido</span>}
                      {isExpiringSoon && <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full"><AlertTriangle size={12}/> Vence pronto</span>}
                      {safetyScore < 80 && <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full"><AlertTriangle size={12}/> Peligro</span>}
                      {!isExpired && !isExpiringSoon && safetyScore >= 80 && <span className="text-gray-300">-</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">No hay choferes para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
