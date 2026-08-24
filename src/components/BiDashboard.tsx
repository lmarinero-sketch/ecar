import React, { useEffect } from 'react';
import {
  LayoutDashboard, TrendingUp, Users, Truck, DollarSign, BarChart3,
  Target, FileSignature, ShieldAlert,
  Package, Briefcase, AlertTriangle, CalendarClock, MapPin, ArrowRight, ShoppingCart
} from 'lucide-react';
import {
  useProjects, useEmployees, useCheques, useInvoices,
  useOpportunities, usePurchaseOrders, useNonConformities,
  useScopeChanges, useSupplierEvaluations, useInventoryItems,
  useFuelVehicles, usePurchaseRequests, useLogisticsDeliveries
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
  const { data: purchaseRequests = [] } = usePurchaseRequests();
  const { data: deliveries = [] } = useLogisticsDeliveries();

  useEffect(() => { useImplementationStore.getState().completeItem('c2-25'); }, []);

  // === OPERATIVA DEL DÍA (HOY) ===
  const today = new Date().toISOString().split('T')[0];
  
  const chequesHoy = cheques.filter(c => c.due_date === today && c.status === 'pending');
  const chequesPagarHoy = chequesHoy.filter(c => c.direction === 'payable').reduce((sum, c) => sum + c.amount_ars, 0);
  const chequesCobrarHoy = chequesHoy.filter(c => c.direction === 'receivable').reduce((sum, c) => sum + c.amount_ars, 0);

  const entregasEnTransito = deliveries.filter(d => d.status === 'en_transito');
  
  const pedidosHoy = purchaseRequests.filter(r => r.created_at.startsWith(today));
  const pedidosUrgentesHoy = pedidosHoy.filter(r => r.urgency === 'urgent').length;

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

  // Alertas de flota
  const vtvDueCount = vehicles.filter(v => v.vtv_expiry && v.vtv_expiry <= today).length;
  const serviceDueCount = vehicles.filter(v => v.next_maintenance_date && v.next_maintenance_date <= today).length;
  const vehiclesAlertCount = vtvDueCount + serviceDueCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><LayoutDashboard size={120} /></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-2xl flex items-center gap-2"><LayoutDashboard size={24} /> Dashboard Ejecutivo — ECAR</h3>
              <p className="text-blue-100 text-sm mt-1">Vista consolidada por gerencia · Actualización en tiempo real</p>
            </div>
          </div>
        </div>
      </div>

      {/* Operativa del Día (HOY) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cheques Hoy */}
        <div className={`light-card p-5 border-l-4 ${chequesHoy.length > 0 ? 'border-amber-500 bg-amber-50/20' : 'border-gray-200'} flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><CalendarClock size={16} className={chequesHoy.length > 0 ? 'text-amber-500' : 'text-gray-400'} /> Vencimientos Hoy</h4>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${chequesHoy.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
              {chequesHoy.length} cheques
            </span>
          </div>
          {chequesHoy.length > 0 ? (
            <div className="space-y-3 mt-3">
              {chequesPagarHoy > 0 && (
                <div className="flex justify-between items-center text-sm border-b border-amber-100 pb-2">
                  <span className="text-gray-600 font-medium">A Pagar</span>
                  <span className="font-bold font-mono text-red-600">{formatARS(chequesPagarHoy)}</span>
                </div>
              )}
              {chequesCobrarHoy > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">A Cobrar</span>
                  <span className="font-bold font-mono text-emerald-600">{formatARS(chequesCobrarHoy)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">No hay cheques pendientes para la fecha actual.</p>
          )}
        </div>

        {/* Camionetas en tránsito */}
        <div className={`light-card p-5 border-l-4 ${entregasEnTransito.length > 0 ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200'} flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><MapPin size={16} className={entregasEnTransito.length > 0 ? 'text-blue-500' : 'text-gray-400'} /> Flota en Tránsito</h4>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${entregasEnTransito.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {entregasEnTransito.length} vehículos
            </span>
          </div>
          {entregasEnTransito.length > 0 ? (
            <div className="mt-3 space-y-2">
              {entregasEnTransito.slice(0, 3).map(e => (
                <div key={e.id} className="text-xs flex items-center justify-between border-b border-blue-50 pb-1 last:border-0">
                  <span className="font-bold text-gray-700 truncate">{e.vehicle?.code || 'Vehículo'}</span>
                  <span className="text-gray-500 truncate max-w-[120px]"><ArrowRight size={10} className="inline mr-1 text-blue-400" />{e.project?.name || e.destination}</span>
                </div>
              ))}
              {entregasEnTransito.length > 3 && <p className="text-[10px] text-gray-400 text-center pt-1">+ {entregasEnTransito.length - 3} más</p>}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">No hay camionetas realizando entregas en este momento.</p>
          )}
        </div>

        {/* Pedidos del día */}
        <div className={`light-card p-5 border-l-4 ${pedidosUrgentesHoy > 0 ? 'border-red-500 bg-red-50/20' : pedidosHoy.length > 0 ? 'border-ecar-blue bg-blue-50/10' : 'border-gray-200'} flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><ShoppingCart size={16} className={pedidosUrgentesHoy > 0 ? 'text-red-500' : pedidosHoy.length > 0 ? 'text-ecar-blue' : 'text-gray-400'} /> Ingresos del Día</h4>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${pedidosUrgentesHoy > 0 ? 'bg-red-100 text-red-700' : pedidosHoy.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {pedidosHoy.length} pedidos
            </span>
          </div>
          {pedidosHoy.length > 0 ? (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Total Solicitudes:</span>
                <span className="font-bold text-gray-800">{pedidosHoy.length}</span>
              </div>
              {pedidosUrgentesHoy > 0 && (
                <div className="mt-2 bg-red-100 border border-red-200 text-red-700 text-xs px-2 py-1.5 rounded flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={14} /> ¡{pedidosUrgentesHoy} marcados como urgentes!
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">Aún no se han generado pedidos de obra ni de almacén hoy.</p>
          )}
        </div>
      </div>

      {/* Resumen General - Top Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Obras Activas', value: String(activeProjects), icon: BarChart3, color: 'text-ecar-blue', valColor: 'text-ecar-blueDark' },
          { label: 'Pipeline', value: formatARS(pipelineValue), icon: Target, color: 'text-blue-500', valColor: 'text-blue-600' },
          { label: 'Personal', value: String(activeEmployees), icon: Users, color: 'text-ecar-blue', valColor: 'text-ecar-blueDark' },
          { label: 'Facturación', value: formatARS(facturacionMes), icon: TrendingUp, color: 'text-green-500', valColor: 'text-green-600' },
          { label: 'A Cobrar', value: formatARS(chequesACobrar), icon: DollarSign, color: 'text-emerald-500', valColor: 'text-emerald-600' },
          { label: 'Flota Op.', value: `${fleetOperative}/${vehicles.length}`, icon: Truck, color: 'text-slate-500', valColor: 'text-slate-600' },
        ].map((kpi, i) => (
          <div key={i} className="light-card p-5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider whitespace-nowrap"><kpi.icon size={14} className={kpi.color} /> {kpi.label}</div>
            <p className={`text-xl font-black ${kpi.valColor} font-mono truncate`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Sección por Gerencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gerencia de Proyectos y Presupuestos */}
        <div className="light-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Briefcase size={18} className="text-ecar-blue" /> Gerencia de Proyectos y Presupuestos
            </h4>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pipeline</p>
                <p className="text-2xl font-black text-ecar-blue font-mono">{pipelineActive} <span className="text-xs font-medium text-gray-400">ops</span></p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Conversión</p>
                <p className="text-2xl font-black text-ecar-blue font-mono">{conversionRate}% <span className="text-xs font-medium text-gray-400">({pipelineWon} ganadas)</span></p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Presupuesto Total</p>
                <p className="text-2xl font-black text-green-600 font-mono">{formatARS(totalBudget)}</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adicionales Pend.</p>
                <p className="text-2xl font-black text-amber-600 font-mono">{pendingSC}</p>
              </div>
            </div>
            {scEconomicImpact > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-amber-700 font-medium">Impacto adicionales aprobados: <span className="font-bold">{formatARS(scEconomicImpact)}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Gerencia de Compras */}
        <div className="light-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <FileSignature size={18} className="text-ecar-blue" /> Gerencia de Compras
            </h4>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OC Abiertas</p>
                <p className="text-2xl font-black text-ecar-blue font-mono">{openPOs}</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monto Comprometido</p>
                <p className="text-2xl font-black text-ecar-blue font-mono">{formatARS(poTotal)}</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Proveedores</p>
                <p className="text-2xl font-black text-ecar-blue font-mono">{avgScore} <span className="text-xs font-medium text-gray-400">/ 5.0</span></p>
              </div>
              <div className={`border rounded-xl p-4 bg-white shadow-sm ${urgentPOs > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${urgentPOs > 0 ? 'text-red-500' : 'text-gray-400'}`}>OC Urgentes</p>
                <p className={`text-2xl font-black font-mono ${urgentPOs > 0 ? 'text-red-600' : 'text-green-600'}`}>{urgentPOs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gerencia de Obras */}
        <div className="light-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <ShieldAlert size={18} className="text-ecar-blue" /> Gerencia de Obras — Calidad
            </h4>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`border rounded-xl p-4 bg-white shadow-sm ${openNC > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${openNC > 0 ? 'text-red-500' : 'text-gray-400'}`}>NC Abiertas</p>
                <p className={`text-2xl font-black font-mono ${openNC > 0 ? 'text-red-600' : 'text-green-600'}`}>{openNC}</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cambios Pend.</p>
                <p className="text-2xl font-black text-amber-600 font-mono">{pendingSC}</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NC Total</p>
                <p className="text-2xl font-black text-ecar-blue font-mono">{nonConformities.length}</p>
              </div>
            </div>
            {openNC > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm">
                <ShieldAlert size={16} className="text-red-500" />
                <span className="text-red-700 font-medium">Hay <span className="font-bold">{openNC} no conformidades abiertas</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Gerencia de Logística */}
        <div className="light-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Package size={18} className="text-ecar-blue" /> Gerencia de Logística
            </h4>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor Inventario</p>
                <p className="text-2xl font-black text-ecar-blue font-mono">{formatARS(totalInventoryValue)}</p>
              </div>
              <div className={`border rounded-xl p-4 bg-white shadow-sm ${lowStockItems > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${lowStockItems > 0 ? 'text-red-500' : 'text-gray-400'}`}>Stock Bajo</p>
                <p className={`text-2xl font-black font-mono ${lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockItems}</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flota OK</p>
                <p className="text-2xl font-black text-slate-700 font-mono">{fleetOperative} <span className="text-xs font-medium text-gray-400">/ {vehicles.length}</span></p>
              </div>
            </div>
            <div className="px-5 pb-5">
              {vehiclesAlertCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm mt-3">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className="text-red-700 font-medium">Hay <span className="font-bold">{vehiclesAlertCount} alertas</span> vehiculares (VTV o Service vencido)</span>
                </div>
              )}
            </div>
            {lowStockItems > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} className="text-orange-500" />
                <span className="text-orange-700 font-medium"><span className="font-bold">{lowStockItems} ítems</span> por debajo del mínimo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects table */}
      <div className="light-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">Obras en Curso</h4>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Sin obras registradas. Creá una desde el módulo de Planificación WBS.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Obra</th>
                <th>Cliente</th>
                <th>Ubicación</th>
                <th className="text-right">Presupuesto</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td className="font-bold text-gray-900">{p.name}</td>
                  <td className="text-gray-600">{p.client_name || '—'}</td>
                  <td className="text-gray-500 text-xs">{p.location || '—'}</td>
                  <td className="text-right font-mono font-bold text-gray-700">{formatARS(p.budget_ars)}</td>
                  <td className="text-center">
                    <span className={`badge ${p.status === 'active' ? 'badge-success' : p.status === 'completed' ? 'badge-info' : 'badge-neutral'}`}>
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
