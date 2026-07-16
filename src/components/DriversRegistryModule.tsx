import React from 'react';
import { Users, Shield, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useEmployees } from '../hooks/useData';

// Componente Placeholder para el Dashboard de Choferes
export const DriversRegistryModule: React.FC = () => {
  const { data: employees = [], isLoading } = useEmployees();
  
  // Usamos los empleados marcados como choferes, o todos si no hay ninguno (fallback temporal)
  const realDrivers = employees.filter(e => e.is_driver);
  const drivers = realDrivers.length > 0 ? realDrivers : employees.slice(0, 5);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Users size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Users size={24} /> Registro de Choferes</h3>
          <p className="text-blue-100 text-sm mt-1">Monitoreo de desempeño, KPIs y asignaciones de los conductores de la flota.</p>
        </div>
      </div>

      {/* KPIs Generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Shield size={16} className="text-emerald-500" /> Promedio Seguridad (Flota)</div>
          <p className="text-2xl font-black text-emerald-600 font-mono relative z-10">85/100</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingUp size={16} className="text-blue-500" /> Eficiencia Promedio</div>
          <p className="text-2xl font-black text-blue-600 font-mono relative z-10">8.5 Km/L</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><CheckCircle2 size={16} className="text-purple-500" /> Cumplimiento de Reportes</div>
          <p className="text-2xl font-black text-purple-600 font-mono relative z-10">92%</p>
        </div>
      </div>

      {/* Lista de Choferes (Mock) */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Ranking y Perfiles de Choferes</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Chofer</th>
              <th className="px-4 py-3">Vehículo Asignado</th>
              <th className="px-4 py-3 text-center">Safety Score</th>
              <th className="px-4 py-3 text-center">Eficiencia</th>
              <th className="px-4 py-3 text-center">Alertas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.map((driver, i) => {
              // Valores mockeados
              const safetyScore = 95 - (i * 5);
              const efficiency = (9.2 - (i * 0.4)).toFixed(1);
              
              return (
                <tr key={driver.id || i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-800">{driver.full_name || `Chofer ${i + 1}`}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">Camioneta {i + 1} (AB{123+i}CD)</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${safetyScore > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {safetyScore}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-600">{efficiency} Km/L</td>
                  <td className="px-4 py-3 text-center">
                    {i === 2 ? <span className="flex justify-center text-red-500" title="Exceso de velocidad registrado"><AlertTriangle size={16} /></span> : <span className="text-gray-300">-</span>}
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
  );
};
