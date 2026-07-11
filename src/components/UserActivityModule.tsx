import React, { useMemo, useState } from 'react';
import { useAuditLogs } from '../hooks/useData';
import { Activity, Clock, MousePointerClick, Calendar, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserActivityModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: logs, isLoading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!searchTerm) return logs;
    const s = searchTerm.toLowerCase();
    return logs.filter(l => 
      l.user_name.toLowerCase().includes(s) || 
      l.module.toLowerCase().includes(s) ||
      l.action_type.toLowerCase().includes(s)
    );
  }, [logs, searchTerm]);

  const stats = useMemo(() => {
    if (!logs) return [];
    
    // Group by user and module
    const userStats: Record<string, { user_name: string; total_seconds: number; clicks: number; module_times: Record<string, number> }> = {};
    
    // Only process today's logs for stats by default
    const today = new Date();
    today.setHours(0,0,0,0);

    logs.forEach(log => {
      const logDate = new Date(log.created_at);
      if (logDate < today) return; // Skip older logs for the summary

      if (!userStats[log.user_id]) {
        userStats[log.user_id] = { user_name: log.user_name, total_seconds: 0, clicks: 0, module_times: {} };
      }
      
      const stats = userStats[log.user_id];
      
      if (log.action_type === 'time_spent') {
        stats.total_seconds += (log.duration_seconds || 0);
        stats.module_times[log.module] = (stats.module_times[log.module] || 0) + (log.duration_seconds || 0);
      } else if (log.action_type === 'click') {
        stats.clicks += 1;
      }
    });
    
    return Object.values(userStats).sort((a, b) => b.total_seconds - a.total_seconds);
  }, [logs]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seg`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const m2 = m % 60;
    return `${h}h ${m2}m`;
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Activity size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p className="text-slate-500 max-w-md">
          El módulo de actividad de usuarios y auditoría es exclusivo para administradores del sistema.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center p-20"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumen Diario */}
      <div className="light-card p-5">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Calendar size={18} className="text-violet-600" /> Resumen de Actividad (Hoy)</h3>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-5">No hay actividad registrada el día de hoy.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(s => (
              <div key={s.user_name} className="border border-gray-100 bg-gray-50 rounded-lg p-4">
                <p className="font-bold text-gray-700 text-sm">{s.user_name}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-600"><Clock size={14} className="text-blue-500" /> {formatTime(s.total_seconds)}</div>
                  <div className="flex items-center gap-1 text-gray-600"><MousePointerClick size={14} className="text-emerald-500" /> {s.clicks} clics</div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                  {Object.entries(s.module_times).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([mod, time]) => (
                    <div key={mod} className="flex justify-between text-xs">
                      <span className="text-gray-500 truncate max-w-[120px]" title={mod}>{mod.replace('/', '') || 'Inicio'}</span>
                      <span className="font-medium text-gray-700">{formatTime(time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log detallado */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-violet-600" /> Log de Auditoría</h3>
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar usuario o módulo..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold">Fecha / Hora</th>
                <th className="px-4 py-3 font-bold">Usuario</th>
                <th className="px-4 py-3 font-bold">Módulo</th>
                <th className="px-4 py-3 font-bold">Acción</th>
                <th className="px-4 py-3 font-bold">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No se encontraron logs.</td></tr>
              ) : (
                filteredLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-500">{new Date(log.created_at).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{log.user_name}</td>
                    <td className="px-4 py-3 text-gray-600">{log.module}</td>
                    <td className="px-4 py-3">
                      {log.action_type === 'time_spent' ? (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold"><Clock size={12} /> Permanencia</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold"><MousePointerClick size={12} /> Clic</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {log.action_type === 'time_spent' ? `Duración: ${formatTime(log.duration_seconds)}` : log.details?.text || log.details?.element || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredLogs.length > 50 && (
          <div className="p-3 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-100">
            Mostrando los últimos 50 registros de {filteredLogs.length}
          </div>
        )}
      </div>
    </div>
  );
};
