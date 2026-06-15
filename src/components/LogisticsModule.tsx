import React, { useMemo } from 'react';
import {
  Warehouse, Package, Truck, ClipboardCheck,
  AlertTriangle, ArrowRight, Clock,
  FileSignature,
} from 'lucide-react';
import {
  useInventoryItems, usePurchaseOrders, useFuelVehicles,
  useToolAssignments, useInventoryMovements,
} from '../hooks/useData';
import { useAppStore } from '../store/useStore';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export const LogisticsModule: React.FC = () => {
  const { data: items = [] } = useInventoryItems();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: vehicles = [] } = useFuelVehicles();
  const { data: assignments = [] } = useToolAssignments();
  const { data: movements = [] } = useInventoryMovements();
  const { setActiveModule } = useAppStore();

  const lowStock = useMemo(() => items.filter(i => i.current_stock <= i.min_stock && i.min_stock > 0), [items]);
  const totalValue = useMemo(() => items.reduce((s, i) => s + i.current_stock * i.unit_cost, 0), [items]);
  const activeAssignments = useMemo(() => (assignments || []).filter(a => a.status === 'assigned').length, [assignments]);
  const pendingPOs = useMemo(() => purchaseOrders.filter(po => ['pendiente_aprobacion', 'aprobada', 'emitida'].includes(po.status)), [purchaseOrders]);
  const fleetOperative = useMemo(() => vehicles.filter(v => v.vehicle_condition === 'operativo').length, [vehicles]);
  const recentMovements = useMemo(() => (movements || []).slice(0, 5), [movements]);

  const cards = [
    {
      title: 'Depósito & Inventario',
      desc: 'Control de stock, estanterías, códigos de barras y movimientos',
      icon: Package,
      color: 'from-orange-600 to-orange-400',
      stats: [
        { label: 'Ítems', value: items.length },
        { label: 'Stock Bajo', value: lowStock.length, alert: lowStock.length > 0 },
        { label: 'Valor Total', value: fmt(totalValue) },
      ],
      module: 'inventory' as const,
    },
    {
      title: 'Flota & Combustible',
      desc: 'Vehículos, mantenimiento preventivo, cargas de combustible',
      icon: Truck,
      color: 'from-slate-700 to-slate-500',
      stats: [
        { label: 'Vehículos', value: vehicles.length },
        { label: 'Operativos', value: fleetOperative },
        { label: 'Con Obs.', value: vehicles.filter(v => v.vehicle_condition === 'con_observaciones').length },
      ],
      module: 'fleet' as const,
    },
    {
      title: 'Órdenes de Compra',
      desc: 'OC/OT emitidas, entregas pendientes, urgencias',
      icon: FileSignature,
      color: 'from-violet-600 to-purple-400',
      stats: [
        { label: 'OC Pendientes', value: pendingPOs.length },
        { label: 'Urgentes', value: purchaseOrders.filter(po => po.urgency && !['cerrada', 'cancelada'].includes(po.status)).length, alert: true },
      ],
      module: 'purchase_orders' as const,
    },
    {
      title: 'Pedidos de Compra',
      desc: 'Solicitudes internas de materiales desde obra',
      icon: ClipboardCheck,
      color: 'from-purple-600 to-indigo-400',
      stats: [
        { label: 'Herr. Asignadas', value: activeAssignments },
      ],
      module: 'purchase_requests' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-teal-700 to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Warehouse size={120} /></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-teal-400 to-purple-400" />
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Warehouse size={24} /> Gerencia de Logística</h3>
          <p className="text-teal-100 text-sm mt-1">Doc PR-GL-01 — Control de acopios, transporte, inventario y abastecimiento</p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Ítems en Stock</p>
          <p className="text-xl font-black text-gray-800 font-mono">{items.length}</p>
        </div>
        <div className={`bg-white border rounded-xl p-4 shadow-sm ${lowStock.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
          <p className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1"><AlertTriangle size={10} /> Stock Bajo</p>
          <p className="text-xl font-black text-red-600 font-mono">{lowStock.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-400 uppercase">Valor Inventario</p>
          <p className="text-xl font-black text-emerald-700 font-mono">{fmt(totalValue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-purple-400 uppercase">OC Pendientes</p>
          <p className="text-xl font-black text-purple-700 font-mono">{pendingPOs.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Flota Operativa</p>
          <p className="text-xl font-black text-slate-700 font-mono">{fleetOperative}/{vehicles.length}</p>
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-700 text-sm mb-1">⚠️ {lowStock.length} ítems por debajo del stock mínimo</p>
            <div className="flex flex-wrap gap-1.5">
              {lowStock.slice(0, 6).map(i => (
                <span key={i.id} className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{i.name} ({i.current_stock}/{i.min_stock})</span>
              ))}
              {lowStock.length > 6 && <span className="text-red-400 text-xs font-medium">y {lowStock.length - 6} más...</span>}
            </div>
          </div>
          <button onClick={() => setActiveModule('inventory')} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-all shrink-0 flex items-center gap-1">
            Ver Inventario <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => setActiveModule(card.module)}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all text-left group overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${card.color} px-5 py-3 flex items-center gap-2`}>
                <Icon size={18} className="text-white" />
                <span className="font-bold text-white text-sm">{card.title}</span>
                <ArrowRight size={14} className="text-white/50 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-3">{card.desc}</p>
                <div className="flex gap-3">
                  {card.stats.map((s, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${(s as any).alert ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                      <span className="text-gray-400 font-medium">{s.label}:</span> {s.value}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={16} /> Últimos Movimientos de Inventario</h3>
          <button onClick={() => setActiveModule('inventory')} className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1">
            Ver todos <ArrowRight size={12} />
          </button>
        </div>
        {recentMovements.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Ítem</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2 text-center">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentMovements.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{new Date(m.created_at).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-2 font-medium">{(m.item as any)?.name || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.movement_type === 'in' ? 'bg-green-100 text-green-700' : m.movement_type === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {m.movement_type === 'in' ? 'Ingreso' : m.movement_type === 'out' ? 'Egreso' : m.movement_type === 'return' ? 'Devolución' : 'Ajuste'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center font-mono font-bold">{m.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">Sin movimientos registrados aún</div>
        )}
      </div>
    </div>
  );
};
