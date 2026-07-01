import React, { useState } from 'react';
import { Warehouse, PackageSearch, Truck, Repeat, Wrench, Plus, ChevronDown, ChevronUp, Package, Clock, ShieldAlert } from 'lucide-react';
import { useLogisticsAssets, useLogisticsMovements } from '../hooks/useData';

export const LogisticsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assets' | 'movements' | 'kpis'>('assets');
  const [showIntro, setShowIntro] = useState(true);
  
  const { data: assets, isLoading: loadingAssets } = useLogisticsAssets();
  const { data: movements, isLoading: loadingMovements } = useLogisticsMovements();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Descriptive Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-xl p-4 md:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10">
          <Warehouse size={80} className="md:w-[120px] md:h-[120px]" />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-xl md:text-2xl flex items-center gap-2">
            <Warehouse size={24} className="md:w-7 md:h-7" /> Gerencia de Logística
          </h3>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl">
            Aseguramos que cada obra cuente con los recursos físicos necesarios en tiempo y forma.
            Administramos inventarios, pañol, herramientas y la flota para evitar interrupciones operativas.
          </p>
        </div>
      </div>

      {/* Intro Accordion */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowIntro(!showIntro)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
              <PackageSearch size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">¿Cómo funciona Logística en ECAR?</h4>
              <p className="text-xs text-gray-500 mt-0.5">Conocé los procesos clave: Stock crítico, Trazabilidad, y Mantenimiento preventivo.</p>
            </div>
          </div>
          <div className="text-gray-400">
            {showIntro ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>
        {showIntro && (
          <div className="p-4 md:p-6 border-t border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h5 className="font-bold text-teal-700 text-sm flex items-center gap-2"><Package size={16} /> 1. Depósito y Stock Crítico</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Logística debe conocer exactamente qué tenemos, dónde está y su estado.
                Definimos <span className="font-semibold text-gray-800">Alertas de Reposición</span> antes de que el material o herramienta se agote (Stock Mínimo), protegiendo así el ritmo de la obra.
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-teal-700 text-sm flex items-center gap-2"><Repeat size={16} /> 2. Despachos y Devoluciones</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cada salida (Despacho) debe tener un responsable y una fecha de devolución.
                La trazabilidad previene pérdidas económicas. Logística acciona alertas cuando las herramientas no retornan a tiempo.
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-teal-700 text-sm flex items-center gap-2"><Truck size={16} /> 3. Flota y Mantenimiento</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                El control de horas y kilómetros nos permite anticipar mantenimientos preventivos (services, VTV) y roturas de maquinarias y vehículos de flota, evitando paradas forzadas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 md:gap-6 px-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'assets', icon: Truck, label: 'Flota & Máquinas' },
          { id: 'movements', icon: Repeat, label: 'Despachos & Devoluciones' },
          { id: 'kpis', icon: Wrench, label: 'Mantenimiento & KPIs' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
        {activeTab === 'assets' && (
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Truck className="text-teal-600" /> Flota y Maquinaria</h3>
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                <Plus size={16} /> Nuevo Activo
              </button>
            </div>
            {loadingAssets ? (
              <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div>
            ) : assets && assets.length > 0 ? (
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
                   <tr>
                     <th className="px-4 py-3 font-bold">Código / PIN</th>
                     <th className="px-4 py-3 font-bold">Activo</th>
                     <th className="px-4 py-3 font-bold">Ubicación / Resp.</th>
                     <th className="px-4 py-3 font-bold text-center">Horas/Km Actual</th>
                     <th className="px-4 py-3 font-bold">Estado</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {assets.map((a: any) => (
                     <tr key={a.id} className="hover:bg-gray-50">
                       <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.pin_plate || a.code}</td>
                       <td className="px-4 py-3 font-medium text-gray-800">{a.name} <span className="text-gray-400 font-normal ml-1">({a.brand})</span></td>
                       <td className="px-4 py-3 text-gray-600">
                         {a.current_location || '-'} <br/>
                         <span className="text-xs text-gray-400">{a.assigned_to}</span>
                       </td>
                       <td className="px-4 py-3 text-center font-bold">{a.current_hours_km}</td>
                       <td className="px-4 py-3">
                         {a.status === 'available' && <span className="inline-flex items-center bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">Disponible</span>}
                         {a.status === 'in_use' && <span className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">En Uso</span>}
                         {a.status === 'maintenance' && <span className="inline-flex items-center bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">Mantenimiento</span>}
                         {a.status === 'out_of_service' && <span className="inline-flex items-center bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">Fuera de Serv.</span>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Truck size={48} className="mx-auto mb-3 opacity-20" />
                <p>No hay activos registrados en la flota.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Repeat className="text-teal-600" /> Despachos y Devoluciones</h3>
              <div className="flex gap-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Registrar Salida
                </button>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Registrar Devolución
                </button>
              </div>
            </div>
            {loadingMovements ? (
              <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div>
            ) : movements && movements.length > 0 ? (
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
                   <tr>
                     <th className="px-4 py-3 font-bold">Fecha</th>
                     <th className="px-4 py-3 font-bold">Movimiento</th>
                     <th className="px-4 py-3 font-bold">Destino / Origen</th>
                     <th className="px-4 py-3 font-bold">Responsable</th>
                     <th className="px-4 py-3 font-bold">Estado</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {movements.map((m: any) => (
                     <tr key={m.id} className="hover:bg-gray-50">
                       <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.created_at).toLocaleDateString('es-AR')}</td>
                       <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                         {m.type === 'dispatch' ? <span className="text-blue-500">↑ Despacho</span> : <span className="text-emerald-500">↓ Devolución</span>}
                       </td>
                       <td className="px-4 py-3 text-gray-600">{m.type === 'dispatch' ? m.destination : m.origin}</td>
                       <td className="px-4 py-3 font-medium text-gray-700">{m.responsible_person}</td>
                       <td className="px-4 py-3">
                         {m.status === 'pending_return' ? (
                           <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold"><Clock size={12} /> Pendiente</span>
                         ) : (
                           <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">Cerrado</span>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Repeat size={48} className="mx-auto mb-3 opacity-20" />
                <p>No hay movimientos registrados.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kpis' && (
          <div className="p-4 md:p-6 space-y-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ShieldAlert className="text-teal-600" /> Tablero Logístico (Indicadores)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                <h4 className="text-red-700 text-sm font-bold flex justify-between items-center">Stock Crítico <span>(bajo mínimo)</span></h4>
                <p className="text-3xl font-black text-red-800 mt-2">0</p>
                <p className="text-xs text-red-600 mt-1">Ítems que requieren reposición urgente</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                <h4 className="text-amber-700 text-sm font-bold flex justify-between items-center">Devoluciones <span>(vencidas)</span></h4>
                <p className="text-3xl font-black text-amber-800 mt-2">0</p>
                <p className="text-xs text-amber-600 mt-1">Herramientas no retornadas a pañol</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <h4 className="text-blue-700 text-sm font-bold flex justify-between items-center">Mantenimientos <span>(próximos)</span></h4>
                <p className="text-3xl font-black text-blue-800 mt-2">0</p>
                <p className="text-xs text-blue-600 mt-1">Services de máquinas/flota a planificar</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                <h4 className="text-emerald-700 text-sm font-bold flex justify-between items-center">Flota Activa <span>(en uso)</span></h4>
                <p className="text-3xl font-black text-emerald-800 mt-2">0</p>
                <p className="text-xs text-emerald-600 mt-1">Vehículos y maquinaria operando</p>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Wrench size={16} className="text-gray-500" /> Últimos Mantenimientos y Cargas</h4>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                <Wrench size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay registros recientes de services o carga de combustible.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
