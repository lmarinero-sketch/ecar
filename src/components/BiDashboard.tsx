import React, { useEffect } from 'react';
import {
  LayoutDashboard, TrendingUp, Users, Truck, DollarSign, BarChart3,
  Target, FileSignature, ShieldAlert,
  Package, Briefcase, AlertTriangle,
} from 'lucide-react';
import {
  useProjects, useEmployees, useCheques, useInvoices,
  useOpportunities, usePurchaseOrders, useNonConformities,
  useScopeChanges, useSupplierEvaluations, useInventoryItems,
  useFuelVehicles,
} from '../hooks/useData';
import { useImplementationStore } from '../store/useImplementationStore';

const formatARS = (v: number) => {
  if (v >= 1_000_000_000) return `$ ${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$ ${(v / 1_000).toFixed(0)}K`;
  return `$ ${v.toLocaleString('es-AR')}`;
};


export const BiDashboard: React.FC = () => {
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const { data: cheques = [] } = useCheques();
  const { data: invoices = [] } = useInvoices();
  const { data: opportunities = [] } = useOpportunities();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: nonConformities = [] } = useNonConformities();
  const { data: scopeChanges = [] } = useScopeChanges();
  const { data: supplierEvals = [] } = useSupplierEvaluations();
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: vehicles = [] } = useFuelVehicles();

  useEffect(() => { useImplementationStore.getState().completeItem('c2-25'); }, []);

  // === KPIs Gerencia de Proyectos ===
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalBudget = projects.reduce((a, p) => a + (p.budget_ars || 0), 0);
  const pipelineValue = opportunities.filter(o => !['adjudicada', 'rechazada'].includes(o.stage)).reduce((a, o) => a + (o.estimated_amount || 0), 0);
  const pipelineActive = opportunities.filter(o => !['adjudicada', 'rechazada'].includes(o.stage)).length;
  const pipelineWon = opportunities.filter(o => o.stage === 'adjudicada').length;
  const conversionRate = opportunities.length > 0 ? Math.round((pipelineWon / opportunities.length) * 100) : 0;

  // === KPIs Gerencia de Compras ===
  const openPOs = purchaseOrders.filter(po => !['cerrada', 'cancelada'].includes(po.status)).length;
  const poTotal = purchaseOrders.filter(po => !['cerrada', 'cancelada'].includes(po.status)).reduce((a, po) => a + (po.total_amount || 0), 0);
  const urgentPOs = purchaseOrders.filter(po => po.urgency && !['cerrada', 'cancelada'].includes(po.status)).length;
  const avgScore = supplierEvals.length > 0 ? (supplierEvals.reduce((a, e) => a + e.overall_score, 0) / supplierEvals.length).toFixed(1) : '—';

  // === KPIs Gerencia de Obras ===
  const openNC = nonConformities.filter(nc => nc.status !== 'cerrada').length;
  const pendingSC = scopeChanges.filter(sc => sc.status === 'detectado' || sc.status === 'en_evaluacion').length;
  const scEconomicImpact = scopeChanges.filter(sc => sc.status === 'aprobado').reduce((a, sc) => a + (sc.economic_impact || 0), 0);

  // === KPIs Financieros ===
  const activeEmployees = employees.filter(e => e.employment_status === 'active').length;
  const chequesACobrar = cheques.filter(c => c.direction === 'receivable' && c.status === 'pending').reduce((a, c) => a + c.amount_ars, 0);

  const facturacionMes = invoices.filter(i => i.status === 'approved').reduce((a, i) => a + i.total_ars, 0);

  // === KPIs Logística ===
  const lowStockItems = (inventoryItems || []).filter(i => i.current_stock <= i.min_stock && i.min_stock > 0).length;
  const totalInventoryValue = (inventoryItems || []).reduce((s, i) => s + i.current_stock * i.unit_cost, 0);
  const fleetOperative = vehicles.filter(v => v.vehicle_condition === 'operativo').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><LayoutDashboard size={140} /></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-ecar-blue" />
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><LayoutDashboard size={24} /> Dashboard Ejecutivo — ECAR</h3>
          <p className="text-blue-200 text-sm mt-1">Vista consolidada por gerencia · Actualización en tiempo real</p>
        </div>
      </div>

      {/* Resumen General - Top Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Obras Activas', value: String(activeProjects), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pipeline Activo', value: formatARS(pipelineValue), icon: Target, color: 'text-ecar-blue', bg: 'bg-slate-50' },
          { label: 'Personal', value: String(activeEmployees), icon: Users, color: 'text-ecar-blue', bg: 'bg-slate-50' },
          { label: 'Facturación', value: formatARS(facturacionMes), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Cheques a Cobrar', value: formatARS(chequesACobrar), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Flota Operativa', value: `${fleetOperative}/${vehicles.length}`, icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((kpi, i) => (
          <div key={i} className="light-card p-4">
            <div className={`${kpi.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
              <kpi.icon size={16} className={kpi.color} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-lg font-black text-gray-900 font-mono mt-0.5">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Sección por Gerencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gerencia de Proyectos y Presupuestos */}
        <div className="light-card overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-ecar-blue text-white px-5 py-3 flex items-center gap-2">
            <Briefcase size={16} />
            <span className="font-bold text-sm">Gerencia de Proyectos y Presupuestos</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                <p className="text-[10px] font-bold text-blue-400 uppercase">Pipeline</p>
                <p className="text-xl font-black text-blue-700">{pipelineActive} <span className="text-xs font-medium text-blue-400">oportunidades</span></p>
              </div>
              <div className="bg-slate-50/50 border border-ecar-blueLight rounded-lg p-3">
                <p className="text-[10px] font-bold text-ecar-blue uppercase">Conversión</p>
                <p className="text-xl font-black text-ecar-blue">{conversionRate}% <span className="text-xs font-medium text-ecar-blue">({pipelineWon} ganadas)</span></p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Presupuesto Total</p>
                <p className="text-xl font-black text-emerald-700">{formatARS(totalBudget)}</p>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-400 uppercase">Adicionales Pend.</p>
                <p className="text-xl font-black text-amber-700">{pendingSC} <span className="text-xs font-medium text-amber-400">por aprobar</span></p>
              </div>
            </div>
            {scEconomicImpact > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2 text-xs">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-amber-700 font-medium">Impacto económico de adicionales aprobados: <span className="font-bold">{formatARS(scEconomicImpact)}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Gerencia de Compras */}
        <div className="light-card overflow-hidden">
          <div className="bg-gradient-to-r from-ecar-blue to-ecar-blue text-white px-5 py-3 flex items-center gap-2">
            <FileSignature size={16} />
            <span className="font-bold text-sm">Gerencia de Compras</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50/50 border border-ecar-blueLight rounded-lg p-3">
                <p className="text-[10px] font-bold text-ecar-blue uppercase">OC Abiertas</p>
                <p className="text-xl font-black text-ecar-blue">{openPOs}</p>
              </div>
              <div className="bg-slate-50/50 border border-ecar-blueLight rounded-lg p-3">
                <p className="text-[10px] font-bold text-ecar-blue uppercase">Monto Comprometido</p>
                <p className="text-xl font-black text-ecar-blue">{formatARS(poTotal)}</p>
              </div>
              <div className="bg-slate-50/50 border border-ecar-blueLight rounded-lg p-3">
                <p className="text-[10px] font-bold text-ecar-blue uppercase">Score Proveedores</p>
                <p className="text-xl font-black text-ecar-blue">{avgScore} <span className="text-xs font-medium text-ecar-blue">/ 5.0</span></p>
              </div>
              <div className={`rounded-lg p-3 ${urgentPOs > 0 ? 'bg-red-50/50 border border-red-200' : 'bg-green-50/50 border border-green-100'}`}>
                <p className={`text-[10px] font-bold uppercase ${urgentPOs > 0 ? 'text-red-400' : 'text-green-400'}`}>OC Urgentes</p>
                <p className={`text-xl font-black ${urgentPOs > 0 ? 'text-red-700' : 'text-green-700'}`}>{urgentPOs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gerencia de Obras */}
        <div className="light-card overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white px-5 py-3 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span className="font-bold text-sm">Gerencia de Obras — Calidad</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-lg p-3 ${openNC > 0 ? 'bg-red-50/50 border border-red-200' : 'bg-green-50/50 border border-green-100'}`}>
                <p className={`text-[10px] font-bold uppercase ${openNC > 0 ? 'text-red-400' : 'text-green-400'}`}>NC Abiertas</p>
                <p className={`text-xl font-black ${openNC > 0 ? 'text-red-700' : 'text-green-700'}`}>{openNC}</p>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-400 uppercase">Cambios Pend.</p>
                <p className="text-xl font-black text-amber-700">{pendingSC}</p>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                <p className="text-[10px] font-bold text-blue-400 uppercase">NC Total</p>
                <p className="text-xl font-black text-blue-700">{nonConformities.length}</p>
              </div>
            </div>
            {openNC > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2 text-xs">
                <ShieldAlert size={14} className="text-red-500" />
                <span className="text-red-700 font-medium">Hay <span className="font-bold">{openNC} no conformidades abiertas</span> requiriendo atención</span>
              </div>
            )}
          </div>
        </div>

        {/* Gerencia de Logística */}
        <div className="light-card overflow-hidden">
          <div className="bg-gradient-to-r from-ecar-blue to-emerald-500 text-white px-5 py-3 flex items-center gap-2">
            <Package size={16} />
            <span className="font-bold text-sm">Gerencia de Logística</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50/50 border border-ecar-blueLight rounded-lg p-3">
                <p className="text-[10px] font-bold text-ecar-blue uppercase">Valor Inventario</p>
                <p className="text-xl font-black text-ecar-blue">{formatARS(totalInventoryValue)}</p>
              </div>
              <div className={`rounded-lg p-3 ${lowStockItems > 0 ? 'bg-red-50/50 border border-red-200' : 'bg-green-50/50 border border-green-100'}`}>
                <p className={`text-[10px] font-bold uppercase ${lowStockItems > 0 ? 'text-red-400' : 'text-green-400'}`}>Stock Bajo</p>
                <p className={`text-xl font-black ${lowStockItems > 0 ? 'text-red-700' : 'text-green-700'}`}>{lowStockItems}</p>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Flota OK</p>
                <p className="text-xl font-black text-slate-700">{fleetOperative} <span className="text-xs font-medium text-slate-400">/ {vehicles.length}</span></p>
              </div>
            </div>
            {lowStockItems > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 flex items-center gap-2 text-xs">
                <AlertTriangle size={14} className="text-orange-500" />
                <span className="text-orange-700 font-medium"><span className="font-bold">{lowStockItems} ítems</span> por debajo del stock mínimo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects table */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Obras en Curso</h3>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Sin obras registradas. Creá una desde el módulo de Planificación WBS.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Obra</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3 text-right">Presupuesto</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.client_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.location || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{formatARS(p.budget_ars)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status === 'active' ? 'Activa' : p.status === 'completed' ? 'Terminada' : 'Suspendida'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
