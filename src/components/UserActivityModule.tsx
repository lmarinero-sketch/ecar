import React, { useMemo, useState, useEffect } from 'react';
import { useAuditLogs, useDatabaseMemoryStats } from '../hooks/useData';
import {
  Activity,
  Clock,
  MousePointerClick,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Wifi,
  Database,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  Monitor,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

const MODULE_LABELS: Record<string, string> = {
  bi: 'Tablero BI',
  liquidity: 'Liquidez y Caja',
  purchases: 'Compras',
  purchase_orders: 'Órdenes de Compra',
  payment_orders: 'Órdenes de Pago',
  supplier_eval: 'Evaluación Proveedores',
  finances: 'Finanzas y Cheques',
  obligations: 'Obligaciones',
  invoicing: 'Facturación',
  expenses: 'Gastos',
  payments: 'Pagos',
  worker_payments: 'Liquidación Semanal',
  certifications: 'Certificaciones',
  rrhh: 'RRHH y Personal',
  wbs: 'WBS / Estructura',
  inventory: 'Pañol e Inventario',
  tools: 'Herramientas Pañol',
  purchase_requests: 'Pedidos de Obra',
  logistics: 'Logística y Despachos',
  fleet: 'Flota y Maquinaria',
  fuel: 'Combustible',
  field: 'Avance de Obra',
  safety: 'Seguridad e Higiene',
  inspections: 'Inspecciones',
  rfi: 'RFI / Consultas',
  documents: 'Documentación',
  project_budget: 'Presupuestos de Obra',
  opportunities: 'Oportunidades',
  budget_landing: 'Ger. Presupuestos',
  compras_intro: 'Ger. Compras',
  logistics_intro: 'Ger. Logística',
  obra_intro: 'Ger. Obras',
  finanzas_intro: 'Ger. Finanzas',
  rrhh_intro: 'Ger. RRHH',
  obra_panel: 'Panel de Obras',
  obra_gestion: 'Gestión de Obra',
  obra_recursos: 'Recursos Obra',
  obra_calidad: 'Calidad Obra',
  obra_economia: 'Economía Obra',
  obra_documentacion: 'Docs. Obra',
  user_management: 'Gestión de Usuarios',
  user_activity: 'Actividad de Usuarios',
  communications: 'Comunicaciones',
  weekly_report: 'Reporte Semanal',
  guide: 'Guía Rápida',
  manual: 'Manual Operativo',
  implementation: 'Implementación',
};

const getModuleLabel = (mod?: string | null) => {
  if (!mod) return 'Inicio';
  const clean = mod.replace(/^\//, '');
  return MODULE_LABELS[clean] || clean || 'Inicio';
};

const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m < 60) return `${m}m ${remS}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
};

const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};

export const UserActivityModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: logs = [], isLoading, refetch, isFetching } = useAuditLogs();
  const { data: dbStats = [], refetch: refetchDb } = useDatabaseMemoryStats();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState<'all' | 'time_spent' | 'click' | 'heartbeat'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'specific' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 40;

  // Reloj para calcular "hace X seg" en vivo
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  // Listas únicas para dropdowns de filtro
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l: any) => {
      if (l.user_name) set.add(l.user_name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const uniqueModules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l: any) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set).sort((a, b) => getModuleLabel(a).localeCompare(getModuleLabel(b)));
  }, [logs]);

  // Logs filtrados por fecha, usuario, módulo, acción y búsqueda
  const filteredLogs = useMemo(() => {
    let result = logs as any[];

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
          const spec = new Date(startDate + 'T00:00:00');
          return logDay.getTime() === new Date(spec.getFullYear(), spec.getMonth(), spec.getDate()).getTime();
        }
        if (dateFilter === 'range' && startDate && endDate) {
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T23:59:59');
          return logDate.getTime() >= start.getTime() && logDate.getTime() <= end.getTime();
        }
        return true;
      });
    }

    if (selectedUser) {
      result = result.filter(l => l.user_name === selectedUser);
    }
    if (selectedModule) {
      result = result.filter(l => l.module === selectedModule);
    }
    if (selectedAction !== 'all') {
      result = result.filter(l => l.action_type === selectedAction);
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase().trim();
      result = result.filter(l => {
        const modLabel = getModuleLabel(l.module).toLowerCase();
        const detailText = JSON.stringify(l.details || {}).toLowerCase();
        return (
          (l.user_name || '').toLowerCase().includes(s) ||
          (l.module || '').toLowerCase().includes(s) ||
          modLabel.includes(s) ||
          (l.action_type || '').toLowerCase().includes(s) ||
          detailText.includes(s)
        );
      });
    }

    return result;
  }, [logs, searchTerm, selectedUser, selectedModule, selectedAction, dateFilter, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedUser, selectedModule, selectedAction, dateFilter, startDate, endDate]);

  // 1. Sesiones en Vivo (últimos 3 minutos) -> Qué se está viendo y quién lo está viendo ahora
  const liveSessions = useMemo(() => {
    const cutoff = nowMs - 3 * 60 * 1000;
    const byUser = new Map<
      string,
      {
        userId: string;
        userName: string;
        module: string;
        subview?: string;
        lastSeenMs: number;
        viewport?: string;
        sessionSeconds: number;
        sessionBandwidth: number;
      }
    >();

    // logs vienen ordenados DESC por created_at
    for (const l of logs as any[]) {
      const t = new Date(l.created_at).getTime();
      if (t < cutoff) break;
      const key = l.user_id || l.user_name;
      if (!byUser.has(key)) {
        byUser.set(key, {
          userId: key,
          userName: l.user_name || 'Usuario',
          module: l.module || 'bi',
          subview: l.details?.subview,
          lastSeenMs: t,
          viewport: l.details?.viewport,
          sessionSeconds: l.duration_seconds || 0,
          sessionBandwidth: Number(l.details?.bandwidth_bytes || 0),
        });
      } else {
        const cur = byUser.get(key)!;
        if (l.action_type === 'time_spent' || l.action_type === 'heartbeat') {
          cur.sessionSeconds += Number(l.duration_seconds || 0);
        }
        cur.sessionBandwidth += Number(l.details?.bandwidth_bytes || 0);
      }
    }

    return Array.from(byUser.values()).sort((a, b) => b.lastSeenMs - a.lastSeenMs);
  }, [logs, nowMs]);

  // 2. Analítica agregada sobre filteredLogs (usuarios, módulos, tiempo y ancho de banda)
  const analytics = useMemo(() => {
    const userMap = new Map<
      string,
      {
        userName: string;
        totalSeconds: number;
        clicks: number;
        heartbeats: number;
        bandwidthBytes: number;
        lastSeen: string;
        modules: Record<string, number>;
      }
    >();

    const moduleMap = new Map<
      string,
      {
        module: string;
        label: string;
        totalSeconds: number;
        clicks: number;
        bandwidthBytes: number;
        users: Set<string>;
      }
    >();

    const timelineMap = new Map<
      string,
      {
        dateKey: string;
        label: string;
        minutes: number;
        seconds: number;
        bandwidthKB: number;
        events: number;
      }
    >();

    let totalSeconds = 0;
    let totalClicks = 0;
    let totalBandwidthBytes = 0;

    for (const l of filteredLogs) {
      const dur =
        l.action_type === 'time_spent' || l.action_type === 'heartbeat'
          ? Number(l.duration_seconds || 0)
          : 0;
      const bw = Number(l.details?.bandwidth_bytes || 0);
      const isClick = l.action_type === 'click';

      totalSeconds += dur;
      if (isClick) totalClicks += 1;
      totalBandwidthBytes += bw;

      // Por usuario
      const uName = l.user_name || 'Desconocido';
      if (!userMap.has(uName)) {
        userMap.set(uName, {
          userName: uName,
          totalSeconds: 0,
          clicks: 0,
          heartbeats: 0,
          bandwidthBytes: 0,
          lastSeen: l.created_at,
          modules: {},
        });
      }
      const uStat = userMap.get(uName)!;
      uStat.totalSeconds += dur;
      uStat.bandwidthBytes += bw;
      if (isClick) uStat.clicks += 1;
      if (l.action_type === 'heartbeat') uStat.heartbeats += 1;
      if (l.module) {
        uStat.modules[l.module] = (uStat.modules[l.module] || 0) + dur + (isClick ? 1 : 0);
      }

      // Por módulo
      const modKey = l.module || 'bi';
      if (!moduleMap.has(modKey)) {
        moduleMap.set(modKey, {
          module: modKey,
          label: getModuleLabel(modKey),
          totalSeconds: 0,
          clicks: 0,
          bandwidthBytes: 0,
          users: new Set(),
        });
      }
      const mStat = moduleMap.get(modKey)!;
      mStat.totalSeconds += dur;
      mStat.bandwidthBytes += bw;
      if (isClick) mStat.clicks += 1;
      mStat.users.add(uName);

      // Serie temporal por día (o por hora si filtro es 'today' / 'yesterday')
      const dt = new Date(l.created_at);
      const byHour = dateFilter === 'today' || dateFilter === 'yesterday';
      const timeKey = byHour
        ? `${String(dt.getHours()).padStart(2, '0')}:00`
        : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const label = byHour
        ? `${String(dt.getHours()).padStart(2, '0')}h`
        : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;

      if (!timelineMap.has(timeKey)) {
        timelineMap.set(timeKey, {
          dateKey: timeKey,
          label,
          minutes: 0,
          seconds: 0,
          bandwidthKB: 0,
          events: 0,
        });
      }
      const tl = timelineMap.get(timeKey)!;
      tl.seconds += dur;
      tl.minutes = Number((tl.seconds / 60).toFixed(1));
      tl.bandwidthKB = Number(((tl.bandwidthKB * 1024 + bw) / 1024).toFixed(1));
      tl.events += 1;
    }

    const userRanking = Array.from(userMap.values()).sort(
      (a, b) => b.totalSeconds - a.totalSeconds || b.clicks - a.clicks
    );

    const moduleRanking = Array.from(moduleMap.values())
      .map(m => ({ ...m, userCount: m.users.size }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds || b.clicks - a.clicks);

    const timeline = Array.from(timelineMap.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey)
    );

    return {
      totalSeconds,
      totalClicks,
      totalBandwidthBytes,
      userRanking,
      moduleRanking,
      timeline,
    };
  }, [filteredLogs, dateFilter]);

  // 3. Estadísticas de memoria usada en Base de Datos
  const dbSummary = useMemo(() => {
    const totalRows = dbStats.reduce((s, t) => s + t.rows, 0);
    const totalBytes = dbStats.reduce((s, t) => s + t.estimatedBytes, 0);
    const chartData = dbStats.slice(0, 8).map(t => ({
      name: t.label.length > 18 ? t.label.slice(0, 18) + '…' : t.label,
      kb: Number((t.estimatedBytes / 1024).toFixed(1)),
      rows: t.rows,
    }));
    return { totalRows, totalBytes, chartData };
  }, [dbStats]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, page]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  const exportLogsExcel = () => {
    if (filteredLogs.length === 0) return;
    const rows = filteredLogs.map(l => ({
      'Fecha y Hora': new Date(l.created_at).toLocaleString('es-AR'),
      Usuario: l.user_name,
      Módulo: getModuleLabel(l.module),
      'Sub-vista': l.details?.subview || '—',
      Acción:
        l.action_type === 'time_spent'
          ? 'Permanencia'
          : l.action_type === 'heartbeat'
            ? 'En Vivo (Heartbeat)'
            : 'Clic / Interacción',
      'Duración (seg)': l.duration_seconds || 0,
      'Ancho Banda (KB)': l.details?.bandwidth_bytes
        ? Number((Number(l.details.bandwidth_bytes) / 1024).toFixed(2))
        : 0,
      Detalle: l.details?.text || l.details?.reason || l.details?.path || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actividad_Usuarios');
    XLSX.writeFile(wb, `ECAR_Actividad_Usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Activity size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p className="text-slate-500 max-w-md">
          El módulo de actividad de usuarios y telemetría es exclusivo para administradores del sistema.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <div className="w-8 h-8 border-4 border-ecar-blueLight border-t-ecar-blue rounded-full animate-spin" />
      </div>
    );
  }

  const topModule = analytics.moduleRanking[0];
  const topModulePct =
    topModule && analytics.totalSeconds > 0
      ? Math.round((topModule.totalSeconds / analytics.totalSeconds) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Institucional */}
      <div className="bg-gradient-to-r from-[#0B2240] to-slate-800 rounded-xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2">
            <Activity size={22} className="text-sky-400" /> Telemetría y Actividad de Usuarios
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Monitoreo en vivo de pantallas, tiempo de uso por módulo, ancho de banda y memoria de base de datos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetch();
              refetchDb();
            }}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Actualizar
          </button>
          <button
            type="button"
            onClick={exportLogsExcel}
            className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download size={14} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span className="flex items-center gap-1.5"><Users size={15} className="text-emerald-600" /> En Línea Ahora</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{liveSessions.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            {analytics.userRanking.length} usuarios activos en el filtro
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span className="flex items-center gap-1.5"><Clock size={15} className="text-sky-600" /> Tiempo Total de Uso</span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{formatDuration(analytics.totalSeconds)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {analytics.totalClicks.toLocaleString()} interacciones registradas
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span className="flex items-center gap-1.5"><Layers size={15} className="text-amber-600" /> Módulo Más Usado</span>
          </div>
          <p className="text-lg font-black text-slate-900 truncate" title={topModule?.label || '—'}>
            {topModule ? topModule.label : 'Sin datos'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {topModule ? `${formatDuration(topModule.totalSeconds)} (${topModulePct}% del tiempo)` : '—'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span className="flex items-center gap-1.5"><Database size={15} className="text-indigo-600" /> Red & Base de Datos</span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            {formatBytes(analytics.totalBandwidthBytes)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            BD est.: {formatBytes(dbSummary.totalBytes)} ({dbSummary.totalRows.toLocaleString()} reg.)
          </p>
        </div>
      </div>

      {/* PANEL EN VIVO: Qué se está viendo y quién lo está viendo ahora */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Eye size={16} className="text-emerald-600" /> Actividad en Tiempo Real (Últimos 3 minutos)
          </h3>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            {liveSessions.length} {liveSessions.length === 1 ? 'usuario conectado' : 'usuarios conectados'}
          </span>
        </div>
        {liveSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No se detectaron latidos en vivo en los últimos 3 minutos. Los usuarios conectados envían telemetría automáticamente cada 45 segundos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {liveSessions.map(sess => {
              const secAgo = Math.max(0, Math.floor((nowMs - sess.lastSeenMs) / 1000));
              return (
                <div key={sess.userId} className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      {sess.userName}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 font-semibold shrink-0">
                      hace {secAgo}s
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="text-slate-400">Viendo: </span>
                    <strong className="text-[#0B2240]">{getModuleLabel(sess.module)}</strong>
                    {sess.subview && <span className="text-slate-500"> › {sess.subview}</span>}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-100">
                    <span className="flex items-center gap-1">
                      <Monitor size={11} /> {sess.viewport || 'Web'}
                    </span>
                    <span className="font-mono">
                      {formatDuration(sess.sessionSeconds)} · {formatBytes(sess.sessionBandwidth)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RANKINGS: Quiénes usan más el sistema & Qué parte se usa más */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Usuarios */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-ecar-blue" /> Quiénes Usan el Sistema
            </h3>
            <span className="text-xs text-slate-400">{analytics.userRanking.length} usuarios</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {analytics.userRanking.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">Sin registros en el rango seleccionado.</p>
            ) : (
              analytics.userRanking.map((u, idx) => {
                const favMod = Object.entries(u.modules).sort((a, b) => b[1] - a[1])[0]?.[0];
                return (
                  <div key={u.userName} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                        <span className="text-slate-400 font-mono mr-1.5">#{idx + 1}</span>
                        {u.userName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Más usado: <span className="font-semibold text-slate-700">{getModuleLabel(favMod)}</span> · Últ.:{' '}
                        {new Date(u.lastSeen).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-xs text-[#0B2240]">{formatDuration(u.totalSeconds)}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {u.clicks} clics · {formatBytes(u.bandwidthBytes)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ranking de Módulos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-600" /> Qué Parte se Usa Más
            </h3>
            <span className="text-xs text-slate-400">{analytics.moduleRanking.length} módulos</span>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {analytics.moduleRanking.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">Sin registros en el rango seleccionado.</p>
            ) : (
              analytics.moduleRanking.slice(0, 12).map(m => {
                const pct =
                  analytics.totalSeconds > 0
                    ? Math.max(4, Math.round((m.totalSeconds / analytics.totalSeconds) * 100))
                    : 5;
                return (
                  <div key={m.module} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{m.label}</span>
                      <span className="font-mono text-slate-600">
                        {formatDuration(m.totalSeconds)} · {m.clicks} clics · {m.userCount} usu.
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B2240] rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3 GRÁFICOS: Tiempo de Uso, Ancho de Banda, Memoria en Base de Datos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Tiempo de Uso */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-3">
            <Clock size={14} className="text-sky-600" /> Tiempo de Uso (Minutos)
          </h4>
          <div className="h-56">
            {analytics.timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Sin datos suficientes</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeline}>
                  <defs>
                    <linearGradient id="gradTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip formatter={(v: any) => [`${v} min`, 'Tiempo de uso']} />
                  <Area type="monotone" dataKey="minutes" stroke="#0284c7" strokeWidth={2.5} fill="url(#gradTime)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Ancho de Banda Usado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-3">
            <Wifi size={14} className="text-emerald-600" /> Ancho de Banda Medido (KB)
          </h4>
          <div className="h-56">
            {analytics.timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Sin datos suficientes</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeline}>
                  <defs>
                    <linearGradient id="gradBw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip formatter={(v: any) => [`${v} KB`, 'Ancho de banda']} />
                  <Area type="monotone" dataKey="bandwidthKB" stroke="#10b981" strokeWidth={2.5} fill="url(#gradBw)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 3: Memoria Usada en Base de Datos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-3">
            <Database size={14} className="text-indigo-600" /> Memoria Estimada en BD (KB por Tabla)
          </h4>
          <div className="h-56">
            {dbSummary.chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Calculando tablas...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dbSummary.chartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={115} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    formatter={(v: any, _name: any, item: any) => [
                      `${v} KB (${item?.payload?.rows || 0} filas)`,
                      'Tamaño est.',
                    ]}
                  />
                  <Bar dataKey="kb" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* LOG DE AUDITORÍA COMPLETO Y PRECISO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity size={18} className="text-ecar-blue" /> Log Completo de Auditoría ({filteredLogs.length})
            </h3>
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Buscar usuario, módulo o texto clicado..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-ecar-blue focus:ring-1 focus:ring-ecar-blue outline-none"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          {/* Filtros combinables */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
              <Filter size={14} /> Filtros:
            </div>

            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white outline-none"
            >
              <option value="">Todos los usuarios</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white outline-none"
            >
              <option value="">Todos los módulos</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{getModuleLabel(m)}</option>
              ))}
            </select>

            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value as any)}
              className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white outline-none"
            >
              <option value="all">Todas las acciones</option>
              <option value="time_spent">⏱️ Permanencia</option>
              <option value="click">🖱️ Clic / Acción</option>
              <option value="heartbeat">🟢 Latido en vivo</option>
            </select>

            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white outline-none"
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
                className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white"
              />
            )}

            {dateFilter === 'range' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white"
                />
                <span className="text-gray-400 text-xs">a</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white"
                />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold">Fecha / Hora</th>
                <th className="py-3 px-4 font-bold">Usuario</th>
                <th className="py-3 px-4 font-bold">Módulo / Sub-vista</th>
                <th className="py-3 px-4 font-bold">Acción</th>
                <th className="py-3 px-4 font-bold">Red / Duración</th>
                <th className="py-3 px-4 font-bold">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-10">
                    No se encontraron registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{log.user_name}</td>
                    <td className="py-2.5 px-4 text-slate-700">
                      <span className="font-semibold">{getModuleLabel(log.module)}</span>
                      {log.details?.subview && (
                        <span className="text-slate-400 ml-1">› {log.details.subview}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {log.action_type === 'time_spent' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                          <Clock size={11} /> Permanencia
                        </span>
                      ) : log.action_type === 'heartbeat' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-bold text-[10px]">
                          <Activity size={11} /> En Vivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                          <MousePointerClick size={11} /> Clic
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.duration_seconds > 0 ? formatDuration(log.duration_seconds) : '—'}
                      {log.details?.bandwidth_bytes > 0 && (
                        <span className="text-emerald-700 ml-1.5">
                          ({formatBytes(Number(log.details.bandwidth_bytes))})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {log.action_type === 'click'
                        ? log.details?.text || log.details?.element || '—'
                        : log.details?.reason || log.details?.url || log.details?.path || 'Sesión activa'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filteredLogs.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <div className="text-slate-500">
              Mostrando <strong className="text-slate-800">{(page - 1) * itemsPerPage + 1}</strong> a{' '}
              <strong className="text-slate-800">{Math.min(page * itemsPerPage, filteredLogs.length)}</strong> de{' '}
              <strong className="text-slate-800">{filteredLogs.length}</strong> registros
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="font-medium text-slate-700 px-2">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
