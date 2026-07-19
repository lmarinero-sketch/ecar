import React, { useState, useMemo } from 'react';
import {
  FileText, Calendar, TrendingUp, AlertTriangle, Clock,
  Building2, Package, Truck, DollarSign,
  Target, ShieldAlert, Wrench, Printer, ArrowRight
} from 'lucide-react';
import {
  usePartesDiarios, useProjects, useFuelVehicles,
  usePurchaseRequests, useNonConformities, useScopeChanges,
  useOpportunities, useBudgets
} from '../hooks/useData';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export const WeeklyReportModule: React.FC = () => {
  const { data: partes = [] } = usePartesDiarios();
  const { data: projects = [] } = useProjects();
  const { data: vehicles = [] } = useFuelVehicles();
  const { data: purchaseRequests = [] } = usePurchaseRequests();
  const { data: nonConformities = [] } = useNonConformities();
  const { data: scopeChanges = [] } = useScopeChanges();
  const { data: opportunities = [] } = useOpportunities();
  const { data: budgets = [] } = useBudgets();

  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate current week range
  const weekRange = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - weekOffset * 7);
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday, label: `${monday.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} al ${sunday.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` };
  }, [weekOffset]);

  // Filter data for current week
  const weekPartes = useMemo(() => partes.filter(p => {
    const d = new Date(p.fecha);
    return d >= weekRange.start && d <= weekRange.end;
  }), [partes, weekRange]);

  const weekPRs = useMemo(() => purchaseRequests.filter(pr => {
    const d = new Date(pr.created_at);
    return d >= weekRange.start && d <= weekRange.end;
  }), [purchaseRequests, weekRange]);

  const weekNCs = useMemo(() => nonConformities.filter(nc => {
    const d = new Date(nc.created_at);
    return d >= weekRange.start && d <= weekRange.end;
  }), [nonConformities, weekRange]);

  const weekChanges = useMemo(() => scopeChanges.filter(sc => {
    const d = new Date(sc.created_at);
    return d >= weekRange.start && d <= weekRange.end;
  }), [scopeChanges, weekRange]);

  // Stats
  const totalHoras = weekPartes.reduce((s, p) => s + (p.horas_trabajadas || 0), 0);
  const obrasActivas = new Set(weekPartes.map(p => p.obra_id)).size;
  const avgAvance = weekPartes.length > 0 ? weekPartes.reduce((s, p) => s + (p.avance_porcentual || 0), 0) / weekPartes.length : 0;
  const partesConIncidentes = weekPartes.filter(p => p.incidentes && p.incidentes.trim().length > 0);
  const vehiclesInMaintenance = vehicles.filter(v => v.next_maintenance_date && v.next_maintenance_date <= new Date().toISOString().slice(0, 10));
  const pendingPRs = purchaseRequests.filter(pr => pr.status === 'pending');
  const openNCs = nonConformities.filter(nc => nc.status !== 'cerrada');
  const openChanges = scopeChanges.filter(sc => sc.status !== 'aprobado' && sc.status !== 'rechazado' && sc.status !== 'ejecutado');
  const activeOpps = opportunities.filter(o => o.stage !== 'adjudicada' && o.stage !== 'rechazada');
  const approvedBudgets = budgets.filter(b => b.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><FileText size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><FileText size={24} /> Reporte Semanal a GG</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Resumen ejecutivo consolidado — PR-GO-01 §20</p>
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-600 transition-all">← Semana Anterior</button>
        <div className="text-center">
          <p className="text-lg font-black text-gray-800 flex items-center gap-2"><Calendar size={18} className="text-ecar-blue" /> Semana: {weekRange.label}</p>
          {weekOffset === 0 && <span className="badge badge-success">Semana Actual</span>}
        </div>
        <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-600 transition-all disabled:opacity-30">Semana Siguiente →</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Building2 size={16} className="text-blue-500" /> Obras Activas</div>
          <p className="text-3xl font-black text-gray-800">{obrasActivas}</p>
          <p className="text-xs text-gray-400 mt-1">{weekPartes.length} partes diarios</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Clock size={16} className="text-green-500" /> Horas Trabajadas</div>
          <p className="text-3xl font-black text-green-700">{totalHoras}</p>
          <p className="text-xs text-gray-400 mt-1">horas esta semana</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><TrendingUp size={16} className="text-ecar-blue" /> Avance Prom.</div>
          <p className="text-3xl font-black text-ecar-blue">{avgAvance.toFixed(0)}%</p>
          <p className="text-xs text-gray-400 mt-1">promedio del período</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><AlertTriangle size={16} className="text-red-500" /> Incidentes</div>
          <p className="text-3xl font-black text-red-600">{partesConIncidentes.length}</p>
          <p className="text-xs text-gray-400 mt-1">partes con novedades</p>
        </div>
      </div>

      {/* Section: Avance por Obra */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Building2 size={16} className="text-blue-600" />
          <h3 className="font-bold text-gray-800">Avance por Obra</h3>
        </div>
        {weekPartes.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {Array.from(new Set(weekPartes.map(p => p.obra_id))).map(obraId => {
              const obPartes = weekPartes.filter(p => p.obra_id === obraId);
              const project = projects.find(p => p.id === obraId);
              const avgAv = obPartes.reduce((s, p) => s + (p.avance_porcentual || 0), 0) / obPartes.length;
              const totalHs = obPartes.reduce((s, p) => s + (p.horas_trabajadas || 0), 0);
              const incidents = obPartes.filter(p => p.incidentes && p.incidentes.trim());
              return (
                <div key={obraId} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-gray-800">{project?.name || 'Obra sin nombre'}</span>
                    <span className="text-xs text-gray-500 font-mono">{obPartes.length} partes · {totalHs}hs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-ecar-blue to-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, avgAv)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-ecar-blue w-12 text-right">{avgAv.toFixed(0)}%</span>
                  </div>
                  {incidents.length > 0 && (
                    <div className="mt-1.5">
                      {incidents.map((p, i) => (
                        <p key={i} className="text-[11px] text-orange-600 flex items-start gap-1"><AlertTriangle size={10} className="mt-0.5 shrink-0" /> <span>{p.incidentes}</span></p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400"><Building2 size={40} className="mx-auto mb-2 opacity-30" /><p>Sin partes de obra esta semana</p></div>
        )}
      </div>

      {/* Grid: Compras + No Conformidades + Cambios de Alcance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pedidos de Compra */}
        <div className="light-card overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Package size={14} className="text-ecar-blue" />
            <h4 className="font-bold text-gray-700 text-sm">Pedidos de Compra</h4>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Nuevos esta semana</span><span className="text-sm font-bold text-gray-800">{weekPRs.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Pendientes acumulados</span><span className="text-sm font-bold text-orange-600">{pendingPRs.length}</span></div>
            {pendingPRs.length > 0 && (
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                {pendingPRs.slice(0, 3).map(pr => (
                  <p key={pr.id} className="text-[10px] text-gray-600 truncate">• {pr.notes || 'Pedido sin detalle'}</p>
                ))}
                {pendingPRs.length > 3 && <p className="text-[10px] text-gray-400">...y {pendingPRs.length - 3} más</p>}
              </div>
            )}
          </div>
        </div>

        {/* No Conformidades */}
        <div className="light-card overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-600" />
            <h4 className="font-bold text-gray-700 text-sm">No Conformidades</h4>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Nuevas esta semana</span><span className="text-sm font-bold text-gray-800">{weekNCs.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Abiertas acumuladas</span><span className="text-sm font-bold text-red-600">{openNCs.length}</span></div>
            {openNCs.length > 0 && (
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                {openNCs.slice(0, 3).map(nc => (
                  <p key={nc.id} className="text-[10px] text-gray-600 truncate">• {nc.description}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cambios de Alcance */}
        <div className="light-card overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Target size={14} className="text-amber-600" />
            <h4 className="font-bold text-gray-700 text-sm">Adicionales & Cambios</h4>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Nuevos esta semana</span><span className="text-sm font-bold text-gray-800">{weekChanges.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Pendientes de aprobación</span><span className="text-sm font-bold text-amber-600">{openChanges.length}</span></div>
          </div>
        </div>
      </div>

      {/* Grid: Pipeline + Presupuestos + Flota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pipeline */}
        <div className="light-card overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-600" />
            <h4 className="font-bold text-gray-700 text-sm">Pipeline Comercial</h4>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Oportunidades activas</span><span className="text-sm font-bold text-blue-600">{activeOpps.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Valor estimado</span><span className="text-sm font-bold text-gray-800 font-mono">{fmt(activeOpps.reduce((s, o) => s + (o.estimated_amount || 0), 0))}</span></div>
          </div>
        </div>

        {/* Presupuestos */}
        <div className="light-card overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <DollarSign size={14} className="text-green-600" />
            <h4 className="font-bold text-gray-700 text-sm">Presupuestos</h4>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Total presupuestos</span><span className="text-sm font-bold text-gray-800">{budgets.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Aprobados</span><span className="text-sm font-bold text-green-600">{approvedBudgets.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Valor aprobado</span><span className="text-sm font-bold text-gray-800 font-mono">{fmt(approvedBudgets.reduce((s, b) => s + (b.total_final_ars || 0), 0))}</span></div>
          </div>
        </div>

        {/* Flota */}
        <div className="light-card overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Truck size={14} className="text-sky-600" />
            <h4 className="font-bold text-gray-700 text-sm">Flota & Logística</h4>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Vehículos activos</span><span className="text-sm font-bold text-gray-800">{vehicles.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Mant. vencido</span><span className={`text-sm font-bold ${vehiclesInMaintenance.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{vehiclesInMaintenance.length}</span></div>
            {vehiclesInMaintenance.length > 0 && (
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                {vehiclesInMaintenance.slice(0, 3).map(v => (
                  <p key={v.id} className="text-[10px] text-red-500 truncate flex items-center gap-1"><Wrench size={9} /> {v.code} — {v.description}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decisiones Requeridas */}
      {(pendingPRs.length > 0 || openNCs.length > 0 || openChanges.length > 0 || vehiclesInMaintenance.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3"><AlertTriangle size={16} /> Decisiones Requeridas para GG</h4>
          <div className="space-y-2">
            {pendingPRs.length > 5 && <div className="flex items-center gap-2 text-sm text-red-700"><ArrowRight size={12} /> Hay {pendingPRs.length} pedidos de compra pendientes de aprobación.</div>}
            {openNCs.length > 0 && <div className="flex items-center gap-2 text-sm text-red-700"><ArrowRight size={12} /> {openNCs.length} No Conformidades abiertas requieren cierre.</div>}
            {openChanges.length > 0 && <div className="flex items-center gap-2 text-sm text-red-700"><ArrowRight size={12} /> {openChanges.length} Adicionales/Cambios de alcance pendientes de aprobación.</div>}
            {vehiclesInMaintenance.length > 0 && <div className="flex items-center gap-2 text-sm text-red-700"><ArrowRight size={12} /> {vehiclesInMaintenance.length} vehículo(s) con mantenimiento vencido.</div>}
          </div>
        </div>
      )}

      {/* Print Button */}
      <div className="flex justify-end">
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> Imprimir Reporte Semanal
        </button>
      </div>
    </div>
  );
};
