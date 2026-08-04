import React, { useMemo } from 'react';
import { Package, Truck, ShoppingBag, CheckCircle, ArrowRight, Building, Boxes } from 'lucide-react';

type FlowStatus = 'pending' | 'pañol' | 'obra' | 'compras' | 'logistica' | 'despacho' | 'recepcion';

interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  status: 'completed' | 'active' | 'future';
  icon: React.ReactNode;
}

interface RequestFlowDiagram3DProps {
  currentStatus: FlowStatus;
  hasDerivation: boolean;
}

export const RequestFlowDiagram3D: React.FC<RequestFlowDiagram3DProps> = ({ currentStatus, hasDerivation }) => {
  const nodes = useMemo<FlowNode[]>(() => {
    const baseNodes: FlowNode[] = [
      { id: '1', label: '1. Pedido Obra', sublabel: 'Solicitud creada', status: 'completed', icon: <Package size={20} /> },
      { id: '2', label: '2. Pañol Central', sublabel: 'Verificación stock', status: 'active', icon: <Boxes size={20} /> },
    ];

    if (hasDerivation) {
      baseNodes.push(
        { id: '3', label: '3. Compras', sublabel: 'Solicitud reposición', status: 'future', icon: <ShoppingBag size={20} /> },
        { id: '4', label: '4. Logística', sublabel: 'Recepción insumos', status: 'future', icon: <Boxes size={20} /> },
        { id: '5', label: '5. Despacho', sublabel: 'Envío a obra', status: 'future', icon: <Truck size={20} /> },
        { id: '6', label: '6. Recepción', sublabel: 'Entrega final', status: 'future', icon: <Building size={20} /> }
      );
    } else {
      baseNodes.push(
        { id: '3', label: '3. Despacho', sublabel: 'Envío a obra', status: 'future', icon: <Truck size={20} /> },
        { id: '4', label: '4. Recepción', sublabel: 'Entrega final', status: 'future', icon: <Building size={20} /> }
      );
    }

    if (currentStatus === 'compras' || currentStatus === 'logistica') {
      baseNodes[1].status = 'completed';
      if (hasDerivation) {
        baseNodes[2].status = currentStatus === 'compras' ? 'active' : 'completed';
        baseNodes[3].status = currentStatus === 'logistica' ? 'active' : 'future';
      }
    } else if (currentStatus === 'despacho') {
      baseNodes[1].status = 'completed';
      if (hasDerivation) {
        baseNodes[2].status = 'completed';
        baseNodes[3].status = 'completed';
        baseNodes[4].status = 'active';
      } else {
        baseNodes[2].status = 'active';
      }
    } else if (currentStatus === 'recepcion') {
      baseNodes.forEach(n => n.status = 'completed');
      baseNodes[baseNodes.length - 1].status = 'active';
    }

    return baseNodes;
  }, [currentStatus, hasDerivation]);

  return (
    <div className="w-full bg-slate-900 text-white rounded-xl p-6 shadow-inner space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <span>📦</span> Diagrama de Flujo del Pedido / Solicitud
        </h4>
        <span className="text-[11px] font-mono font-bold bg-white/10 px-2.5 py-1 rounded text-sky-300">
          {hasDerivation ? 'Ruta extendida con Compras' : 'Ruta directa de Pañol'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        {nodes.map((node, idx) => (
          <div
            key={node.id}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative ${
              node.status === 'completed'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : node.status === 'active'
                ? 'bg-blue-950/80 border-blue-400 text-blue-100 ring-2 ring-blue-500/50 scale-105 shadow-lg'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                  node.status === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : node.status === 'active'
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {node.icon}
              </div>
              {node.status === 'completed' && <CheckCircle size={16} className="text-emerald-400" />}
              {node.status === 'active' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
            </div>

            <div>
              <h5 className="font-bold text-xs leading-snug">{node.label}</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">{node.sublabel}</p>
            </div>

            {idx < nodes.length - 1 && (
              <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                <ArrowRight size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
