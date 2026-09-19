import React, { useState, useMemo } from 'react';
import {
  Warehouse, Package, Truck, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, ShieldAlert, ShoppingBag, Wrench, ChevronDown, ChevronUp,
  HelpCircle, Layers
} from 'lucide-react';
import {
  usePurchaseRequests, useLogisticsDeliveries, useInventoryItems,
  useAllFuelVehicles, useToolAssignments, useProjects
} from '../../hooks/useData';
import { useAppStore } from '../../store/useStore';
import { checkVehicleMaintenance } from '../../lib/vehicleMaintenance';

export const LogisticsHomeModule: React.FC = () => {
  const { setActiveModule } = useAppStore();
  const [showGuide, setShowGuide] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'pedidos' | 'despachos' | 'stock' | 'flota'>('all');

  // Real data queries
  const { data: purchaseRequests = [], isLoading: loadingRequests } = usePurchaseRequests();
  const { data: deliveries = [], isLoading: loadingDeliveries } = useLogisticsDeliveries();
  const { data: inventoryItems = [], isLoading: loadingInventory } = useInventoryItems();
  const { data: vehicles = [], isLoading: loadingVehicles } = useAllFuelVehicles();
  const { data: tools = [] } = useToolAssignments();
  const { data: projects = [] } = useProjects();

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.id, p.name));
    return map;
  }, [projects]);

  // Today for date comparisons
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ─── 1. ALERTAS OPERATIVAS ACCIONABLES ───
  // Pedidos sin evaluar o pendientes
  const pendingRequests = useMemo(() => {
    return purchaseRequests.filter(r => r.status === 'pending');
  }, [purchaseRequests]);

  // Pedidos con faltantes esperando compras
  const requestsWithPurchases = useMemo(() => {
    return purchaseRequests.filter(r => r.status === 'ordered' || r.status === 'approved');
  }, [purchaseRequests]);

  // Despachos en tránsito pendientes de recepción en obra
  const inTransitDeliveries = useMemo(() => {
    return deliveries.filter(d => d.status === 'en_transito');
  }, [deliveries]);

  // Despachos programados o en preparación para hoy
  const todayDeliveries = useMemo(() => {
    return deliveries.filter(d => (d.status === 'pendiente' || d.status === 'pendiente_autorizacion') && d.delivery_date <= todayStr);
  }, [deliveries, todayStr]);

  // Artículos con stock disponible bajo mínimo
  const criticalStockItems = useMemo(() => {
    return inventoryItems.filter(i => {
      const disponible = (i.current_stock || 0) - (i.reserved_stock || 0);
      return disponible <= (i.min_stock || 0) && (i.min_stock || 0) > 0;
    });
  }, [inventoryItems]);

  // Flota con mantenimientos o VTV/seguro vencidos
  const overdueVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const check = checkVehicleMaintenance(v);
      const isVtvOverdue = v.vtv_expiry && v.vtv_expiry < todayStr;
      const isInsuranceOverdue = v.insurance_expiry && v.insurance_expiry < todayStr;
      return check.isOverdue || isVtvOverdue || isInsuranceOverdue;
    });
  }, [vehicles, todayStr]);

  // Herramientas asignadas sin devolución
  const overdueTools = useMemo(() => {
    return tools.filter(t => t.status === 'assigned' && !t.returned_date);
  }, [tools]);

  // Unify alerts list
  const attentionItems = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'pedidos' | 'despachos' | 'stock' | 'flota';
      badge: string;
      badgeColor: string;
      title: string;
      subtitle: string;
      date?: string | null;
      targetModule: 'purchase_requests' | 'logistics' | 'inventory' | 'fleet';
      actionLabel: string;
    }> = [];

    // Pedidos pendientes
    pendingRequests.forEach(req => {
      const projName = (req.project_id && projectMap.get(req.project_id)) || 'Obra no especificada';
      list.push({
        id: `req-${req.id}`,
        category: 'pedidos',
        badge: req.urgency === 'urgent' ? 'Urgente' : 'Por Evaluar',
        badgeColor: req.urgency === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200',
        title: `Pedido de Obra #${req.id.slice(0, 8)} · ${projName}`,
        subtitle: `${req.items?.length || 0} ítems solicitados por ${req.requested_by || 'Responsable de obra'}`,
        date: req.needed_date || req.created_at.slice(0, 10),
        targetModule: 'purchase_requests',
        actionLabel: 'Evaluar Pedido',
      });
    });

    // Despachos en tránsito
    inTransitDeliveries.forEach(del => {
      const projName = (del.project_id && projectMap.get(del.project_id)) || del.destination || 'Obra';
      list.push({
        id: `del-${del.id}`,
        category: 'despachos',
        badge: 'En Tránsito',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        title: `Despacho ${del.dispatch_number || `#${del.id.slice(0, 6)}`} con destino a ${projName}`,
        subtitle: `Chofer: ${del.driver_name || 'No asignado'} · Salida registrada el ${del.delivery_date}`,
        date: del.delivery_date,
        targetModule: 'logistics',
        actionLabel: 'Ver Entrega',
      });
    });

    // Stock crítico
    criticalStockItems.slice(0, 6).forEach(item => {
      const disponible = (item.current_stock || 0) - (item.reserved_stock || 0);
      list.push({
        id: `stock-${item.id}`,
        category: 'stock',
        badge: 'Stock Crítico',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        title: `${item.name} (${item.item_code || 'Sin código'})`,
        subtitle: `Disponible: ${disponible} ${item.unit} (Mínimo: ${item.min_stock} ${item.unit})`,
        targetModule: 'inventory',
        actionLabel: 'Gestionar Stock',
      });
    });

    // Flota vencida
    overdueVehicles.slice(0, 5).forEach(v => {
      list.push({
        id: `flt-${v.id}`,
        category: 'flota',
        badge: 'Mantenimiento Vencido',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        title: `Unidad ${v.code} · ${v.brand || ''} ${v.model || v.description}`,
        subtitle: `Próx. Service: ${v.next_maintenance_date || 'Vencido por km/horas'} · Chofer: ${v.default_driver || 'Sin chofer'}`,
        date: v.next_maintenance_date,
        targetModule: 'fleet',
        actionLabel: 'Abrir Taller',
      });
    });

    return list;
  }, [pendingRequests, inTransitDeliveries, criticalStockItems, overdueVehicles, projectMap]);

  const filteredAttention = useMemo(() => {
    if (filterType === 'all') return attentionItems;
    return attentionItems.filter(i => i.category === filterType);
  }, [attentionItems, filterType]);

  const isLoading = loadingRequests || loadingDeliveries || loadingInventory || loadingVehicles;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── Hero Header ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blueDark rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Warehouse size={180} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-ecar-blue/30 text-sky-300 border border-sky-400/30">
            <span>📦</span> Gerencia de Logística · Centro de Control Operativo
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Inicio y Prioridades de Abastecimiento
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Coordinación central entre Obra, Pañol Central y Compras. Aseguramos la disponibilidad de materiales, herramientas y flota vehicular a pie de obra en tiempo y forma.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveModule('purchase_requests')}
              className="px-4 py-2 bg-ecar-blue hover:bg-ecar-blueDark text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Package size={15} /> Ver Pedidos de Obra
            </button>
            <button
              onClick={() => setActiveModule('logistics')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/20 flex items-center gap-1.5"
            >
              <Truck size={15} /> Despachos & Entregas
            </button>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3 py-2 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ml-auto"
            >
              <HelpCircle size={15} />
              {showGuide ? 'Ocultar Guía Operativa' : 'Glosario & Circuito GROWLABS'}
              {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Circuito Funcional y Glosario (Desplegable) ─── */}
      {showGuide && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <Layers size={18} className="text-ecar-blue" />
              Circuito Oficial de Abastecimiento (Informe GROWLABS)
            </h3>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Regla de oro: El Pedido nace como necesidad de obra y se resuelve por ítem
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                <span>1️⃣</span> Pedido de Obra
              </span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Obra carga la necesidad (incluso artículos no registrados). <strong>No descuenta stock ni genera compra directa</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
              <span className="font-bold text-indigo-900 block flex items-center gap-1.5">
                <span>2️⃣</span> Resolución por Ítem
              </span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Logística evalúa stock por ítem. Si hay parcial (ej. 10 pedidos, 6 en stock), reserva 6 y deriva a Compras únicamente el saldo de 4.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1">
              <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                <span>3️⃣</span> Reserva de Stock
              </span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                La reserva reduce el <strong>Disponible</strong>, pero <strong>no reduce el Físico</strong>. El físico permanece en depósito hasta la salida.
              </p>
            </div>

            <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
              <span className="font-bold text-sky-900 block flex items-center gap-1.5">
                <span>4️⃣</span> Despacho y Salida
              </span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Al <em>Confirmar Salida</em> se reduce el físico, se consume la reserva y se emite el remito <code>REM-xxxx</code> en camino a obra.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                <span>5️⃣</span> Recepción en Obra
              </span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Obra valida cantidades aceptadas o rechazadas. <strong>No descuenta de nuevo el origen</strong>. El pedido solo se cierra como <em>Atendido</em> al estar completo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Top KPIs Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div
          onClick={() => setActiveModule('purchase_requests')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-ecar-blue cursor-pointer transition-all space-y-1"
        >
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pedidos por Evaluar</span>
            <Package size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-gray-500 block">
            {pendingRequests.filter(r => r.urgency === 'urgent').length} marcados urgentes
          </span>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => setActiveModule('logistics')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-ecar-blue cursor-pointer transition-all space-y-1"
        >
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">En Tránsito a Obra</span>
            <Truck size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {inTransitDeliveries.length}
          </div>
          <span className="text-[11px] text-gray-500 block">
            {todayDeliveries.length} programados para hoy
          </span>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => setActiveModule('purchase_requests')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-ecar-blue cursor-pointer transition-all space-y-1"
        >
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Saldos en Compras</span>
            <ShoppingBag size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">
            {requestsWithPurchases.length}
          </div>
          <span className="text-[11px] text-gray-500 block">
            faltantes derivados a compras
          </span>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => setActiveModule('inventory')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-ecar-blue cursor-pointer transition-all space-y-1"
        >
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Stock Crítico</span>
            <AlertTriangle size={16} className="text-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-orange-700">
            {criticalStockItems.length}
          </div>
          <span className="text-[11px] text-gray-500 block">
            artículos en o bajo mínimo
          </span>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => setActiveModule('fleet')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-ecar-blue cursor-pointer transition-all space-y-1 col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Flota a Revisar</span>
            <ShieldAlert size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            {overdueVehicles.length}
          </div>
          <span className="text-[11px] text-gray-500 block">
            {overdueTools.length} préstamos de pañol activos
          </span>
        </div>
      </div>

      {/* ─── Bandeja "Requieren Mi Atención Hoy" ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        {/* Cabecera y Filtros */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-ecar-blue" />
              Requieren mi atención hoy
            </h2>
            <p className="text-xs text-gray-500">
              Prioridades activas consolidadas entre Pedidos, Entregas, Existencias y Flota.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              Todos ({attentionItems.length})
            </button>
            <button
              onClick={() => setFilterType('pedidos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'pedidos'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              Pedidos ({pendingRequests.length})
            </button>
            <button
              onClick={() => setFilterType('despachos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'despachos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              Entregas ({inTransitDeliveries.length})
            </button>
            <button
              onClick={() => setFilterType('stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'stock'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              Stock ({criticalStockItems.length})
            </button>
            <button
              onClick={() => setFilterType('flota')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'flota'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              Flota ({overdueVehicles.length})
            </button>
          </div>
        </div>

        {/* Lista de Alertas */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            Cargando cola de prioridades de logística...
          </div>
        ) : filteredAttention.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <h4 className="font-bold text-gray-800 text-sm">¡Al día! No hay prioridades pendientes en esta vista</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Todos los pedidos están evaluados, los despachos recepcionados y el stock operativo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAttention.map(item => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    {item.date && (
                      <span className="text-gray-400 text-[11px] font-medium">
                        Fecha: {item.date}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-gray-500">{item.subtitle}</p>
                </div>

                <button
                  onClick={() => setActiveModule(item.targetModule)}
                  className="btn-primary bg-slate-900 hover:bg-ecar-blue text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-all shadow-sm"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Cuadrícula de Accesos a los 4 Módulos Operativos ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Módulo 1: Pedidos */}
        <div
          onClick={() => setActiveModule('purchase_requests')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-ecar-blue cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 group-hover:text-ecar-blue transition-colors flex items-center justify-between">
              1. Pedidos de Obra
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Registro de necesidades operativas de obras, resolución por ítem (10/6/4) y derivación de saldos a Compras.
            </p>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
            {purchaseRequests.length} pedidos históricos
          </span>
        </div>

        {/* Módulo 2: Entregas */}
        <div
          onClick={() => setActiveModule('logistics')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-ecar-blue cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 group-hover:text-ecar-blue transition-colors flex items-center justify-between">
              2. Despachos y Entregas
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Preparación, salida física del depósito con remito REM-xxxx, asignación de chofer y confirmación de recepción en obra.
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
            {deliveries.length} despachos emitidos
          </span>
        </div>

        {/* Módulo 3: Inventario */}
        <div
          onClick={() => setActiveModule('inventory')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-ecar-blue cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Warehouse size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 group-hover:text-ecar-blue transition-colors flex items-center justify-between">
              3. Inventario y Pañol
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Catálogo de artículos, control de existencias (Físico, Reservado, Disponible), préstamos de herramientas y Kardex auditado.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
            {inventoryItems.length} artículos en catálogo
          </span>
        </div>

        {/* Módulo 4: Flota */}
        <div
          onClick={() => setActiveModule('fleet')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-ecar-blue cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Wrench size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 group-hover:text-ecar-blue transition-colors flex items-center justify-between">
              4. Flota y Maquinaria
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Estado operativo de vehículos, alertas de mantenimiento preventivo, partes diarios de inspección y control de combustible.
            </p>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded inline-block">
            {vehicles.length} unidades registradas
          </span>
        </div>
      </div>
    </div>
  );
};
