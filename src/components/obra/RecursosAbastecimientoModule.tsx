import React, { useState } from 'react';
import {
  Package, ArrowLeftRight, ShoppingCart, Users,
  Building2, Truck
} from 'lucide-react';
import { PurchaseRequestsModule } from '../PurchaseRequestsModule';
import { DeliveriesTab } from '../LogisticsModule';
import { WbsModule } from '../WbsModule';
import {
  useProjects, useLogisticsDeliveries, useAllFuelVehicles, useEmployees
} from '../../hooks/useData';

export const RecursosAbastecimientoModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'remitos' | 'movimientos' | 'recursos'>('pedidos');
  const { data: projects = [] } = useProjects();
  const { data: deliveries = [], isLoading: loadingDeliveries } = useLogisticsDeliveries();
  const { data: allVehicles = [] } = useAllFuelVehicles();
  const { data: employees = [] } = useEmployees();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return localStorage.getItem('ecar_active_project_id') || (projects[0]?.id || '');
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Header ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Package size={180} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <span>📦</span> Gerencia de Obras · Grupo 3
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Recursos y Abastecimiento de Obra
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Circuito integral extremo a extremo: Pedido de Obra ➔ Evaluación de Pañol Central ➔ Despacho con Remito oficial ➔ Recepción física a pie de obra con control de diferencias.
          </p>
        </div>
      </div>

      {/* ─── Navigation Subtabs ─── */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pedidos'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <ShoppingCart size={16} /> 1. Pedidos de Obra
          </button>

          <button
            onClick={() => setActiveTab('remitos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'remitos'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <Truck size={16} /> 2. Remitos y Recepción en Obra
          </button>

          <button
            onClick={() => setActiveTab('movimientos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'movimientos'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <ArrowLeftRight size={16} /> 3. Movimientos Internos
          </button>

          <button
            onClick={() => setActiveTab('recursos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'recursos'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <Users size={16} /> 4. Recursos Asignados
          </button>
        </div>

        {/* Project Context Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs shadow-sm">
          <Building2 size={14} className="text-amber-500 shrink-0" />
          <span className="text-gray-500 font-medium">Obra contextual:</span>
          <select
            value={selectedProjectId}
            onChange={e => {
              setSelectedProjectId(e.target.value);
              localStorage.setItem('ecar_active_project_id', e.target.value);
            }}
            className="font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="">Todas las Obras</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'pedidos' && (
        <div>
          <PurchaseRequestsModule initialProjectId={selectedProjectId} />
        </div>
      )}

      {activeTab === 'remitos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <Truck size={18} className="text-blue-600" /> Despachos y Remitos con Destino a Obra
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Aquí el personal a pie de obra recepciona los envíos de Logística, valida las cantidades aceptadas/rechazadas ítem por ítem e imprime o descarga el Remito Oficial.
            </p>
          </div>
          <DeliveriesTab
            deliveries={deliveries}
            loading={loadingDeliveries}
            projects={projects}
            allVehicles={allVehicles}
            employees={employees}
            filterProjectId={selectedProjectId}
          />
        </div>
      )}

      {activeTab === 'movimientos' && (
        <div>
          <WbsModule initialProjectId={selectedProjectId} initialTab="movimientos" />
        </div>
      )}

      {activeTab === 'recursos' && (
        <div>
          <WbsModule initialProjectId={selectedProjectId} initialTab="recursos" />
        </div>
      )}
    </div>
  );
};
