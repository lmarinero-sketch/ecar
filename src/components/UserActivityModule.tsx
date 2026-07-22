import React, { useMemo, useState } from 'react';
import { useAuditLogs } from '../hooks/useData';
import { Activity, Clock, MousePointerClick, Calendar, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserActivityModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: logs, isLoading } = useAuditLogs();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date filtering state
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'specific' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    let result = logs;

    // Apply date filters
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      result = result.filter(l => {
        const logDate = new Date(l.created_at);
        const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());

        if (dateFilter === 'today') return logDay.getTime() === today.getTime();
        if (dateFilter === 'yesterday') return logDay.getTime() === yesterday.getTime();
        if (dateFilter === 'specific' && startDate) {
          const specific = new Date(startDate + 'T00:00:00');
          return logDay.getTime() === new Date(specific.getFullYear(), specific.getMonth(), specific.getDate()).getTime();
        }
        if (dateFilter === 'range' && startDate && endDate) {
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T23:59:59');
          return logDate.getTime() >= start.getTime() && logDate.getTime() <= end.getTime();
        }
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.user_name.toLowerCase().includes(s) || 
        l.module.toLowerCase().includes(s) ||
        l.action_type.toLowerCase().includes(s)
      );
    }
    
    return result;
  }, [logs, searchTerm, dateFilter, startDate, endDate]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, dateFilter, startDate, endDate]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, page]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const stats = useMemo(() => {
    if (!logs) return [];
    
    // Group by user and module
    const userStats: Record<string, { user_name: string; total_seconds: number; clicks: number; module_times: Record<string, number> }> = {};
    
    // Process last 24h for stats by default
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    logs.forEach(log => {
      const logDate = new Date(log.created_at);
      if (logDate < yesterday) return; // Skip older logs for the summary

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
    return <div className="flex justify-center p-20"><div className="w-8 h-8 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumen Diario */}
      <div className="light-card p-5">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Calendar size={18} className="text-ecar-blue" /> Resumen de Actividad (Últimas 24hs)</h3>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-5">No hay actividad registrada en las últimas 24 horas.</p>
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
      <div className="light-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-ecar-blue" /> Log de Auditoría</h3>
            
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="Buscar usuario o módulo..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-ecar-blue focus:ring-1 focus:ring-ecar-blue outline-none"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <Filter size={16} />
              <span>Filtrar por fecha:</span>
            </div>
            
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg py-1.5 px-3 bg-white outline-none focus:border-ecar-blue focus:ring-1 focus:ring-ecar-blue"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="specific">Día específico</option>
              <option value="range">Rango de fechas</option>
            </select>

            {dateFilter === 'specific' && (
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg py-1.5 px-3 bg-white outline-none focus:border-ecar-blue"
              />
            )}

            {dateFilter === 'range' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg py-1.5 px-3 bg-white outline-none focus:border-ecar-blue"
                />
                <span className="text-gray-400 text-sm">hasta</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg py-1.5 px-3 bg-white outline-none focus:border-ecar-blue"
                />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="font-bold py-3 px-4 border-b border-gray-100">Fecha / Hora</th>
                <th className="font-bold py-3 px-4 border-b border-gray-100">Usuario</th>
                <th className="font-bold py-3 px-4 border-b border-gray-100">Módulo</th>
                <th className="font-bold py-3 px-4 border-b border-gray-100">Acción</th>
                <th className="font-bold py-3 px-4 border-b border-gray-100">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No se encontraron logs con los filtros aplicados.</td></tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/80 border-b border-gray-50 last:border-0 transition-colors">
                    <td className="py-2.5 px-4 text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-4 font-medium text-gray-700">{log.user_name}</td>
                    <td className="py-2.5 px-4 text-gray-600">{log.module}</td>
                    <td className="py-2.5 px-4">
                      {log.action_type === 'time_spent' ? (
                        <span className="badge badge-info bg-blue-50 text-blue-600 border border-blue-200"><Clock size={12} /> Permanencia</span>
                      ) : (
                        <span className="badge badge-success bg-emerald-50 text-emerald-600 border border-emerald-200"><MousePointerClick size={12} /> Clic</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-gray-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {log.action_type === 'time_spent' ? `Duración: ${formatTime(log.duration_seconds)}` : log.details?.text || log.details?.element || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {filteredLogs.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
              Mostrando registros <span className="font-bold text-gray-700">{(page - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-gray-700">{Math.min(page * itemsPerPage, filteredLogs.length)}</span> de <span className="font-bold text-gray-700">{filteredLogs.length}</span> totales
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="text-sm text-gray-600 font-medium px-2">
                Página {page} de {totalPages}
              </div>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Siguiente página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
