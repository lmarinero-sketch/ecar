import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { mockData } from '../store/mockData';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Search, Bell, ChevronDown, Check, Clock, AlertCircle } from 'lucide-react';

const sparklineData1 = [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 8 }, { v: 5 }, { v: 12 }];
const sparklineData2 = [{ v: 1 }, { v: 1 }, { v: 2 }, { v: 1 }, { v: 3 }];
const sparklineData3 = [{ v: 5 }, { v: 4 }, { v: 3 }, { v: 5 }, { v: 7 }];
const sparklineData4 = [{ v: 1 }, { v: 2 }, { v: 1 }, { v: 2 }];

const initialMockLogisticsTable = [
  { id: '1234', tipo: 'Traslado', obra: 'Autopista Sur', prior: 'Alta', estado: 'En Proceso', responsable: 'Carlos R.', hito: '20/04/2026', aprob: 'Pendiente' },
  { id: '1235', tipo: 'Rotura', obra: 'Hospital', prior: 'Media', estado: 'En Proceso', responsable: 'Marina S.', hito: '21/04/2026', aprob: 'Confirmar' },
  { id: '1236', tipo: 'Traslado', obra: 'Dique Tambolar', prior: 'Baja', estado: 'Reservado', responsable: 'Carlos R.', hito: '22/04/2026', aprob: 'En proceso' },
  { id: '1237', tipo: 'Recepción', obra: '100 Casas IPV', prior: 'Alta', estado: 'Pendiente', responsable: 'Juan D.', hito: '23/04/2026', aprob: 'Pendiente' },
  { id: '1238', tipo: 'Traslado', obra: 'Torre Consorcio', prior: 'Alta', estado: 'Confirmado', responsable: 'Carlos R.', hito: '24/04/2026', aprob: 'OK' },
  { id: '1239', tipo: 'Rotura', obra: 'Galpón ML', prior: 'Alta', estado: 'En Proceso', responsable: 'Marina S.', hito: '25/04/2026', aprob: 'En proceso' },
  { id: '1240', tipo: 'Traslado', obra: 'Dique Tambolar', prior: 'Media', estado: 'Pendiente', responsable: 'Julia T.', hito: '26/04/2026', aprob: 'Pendiente' },
];

const KpiCard = ({ title, value, color, data, isCurrency = false }: any) => (
  <div className="bg-white border border-gray-200 rounded pb-0 pt-3 px-3 shadow-sm flex flex-col justify-between overflow-hidden relative cursor-pointer hover:border-gray-400 hover:shadow-md transition-all group" style={{ height: '85px' }}>
    <div>
      <h4 className="text-xs text-gray-800 font-semibold group-hover:text-ecar-blue">{title}</h4>
      <p className={`text-2xl font-bold mt-1 ${color === 'red' ? 'text-red-500' : 'text-gray-900'}`}>
        {isCurrency ? value : value}
      </p>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-6">
       <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="v" stroke={
               color === 'blue' ? '#3B82F6' : 
               color === 'red' ? '#EF4444' : 
               '#10B981'
            } strokeWidth={2} fillOpacity={0.2} fill={
               color === 'blue' ? '#3B82F6' : 
               color === 'red' ? '#EF4444' : 
               '#10B981'
            } />
          </AreaChart>
       </ResponsiveContainer>
    </div>
  </div>
);

export const LogisticsModule: React.FC = () => {
  const [data, setData] = useState(initialMockLogisticsTable);
  const [filterObra, setFilterObra] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Approve action simulates clicking on a pending item to approve it
  const handleApprove = (id: string, currentAprob: string) => {
    if (currentAprob === 'OK') return;
    setData(prev => prev.map(row => 
      row.id === id ? { ...row, aprob: 'OK', estado: 'Confirmado' } : row
    ));
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.id.includes(searchTerm) || item.obra.toLowerCase().includes(searchTerm.toLowerCase());
      const matchObra = filterObra ? item.obra === filterObra : true;
      const matchTipo = filterTipo ? item.tipo === filterTipo : true;
      const matchEstado = filterEstado ? item.estado === filterEstado : true;
      return matchSearch && matchObra && matchTipo && matchEstado;
    });
  }, [data, filterObra, filterTipo, filterEstado, searchTerm]);

  return (
    <div className="bg-gray-50 -m-6 p-6 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-3 border-b border-gray-200 mb-6 -mt-6 -mx-6 shadow-sm gap-4">
         <div className="flex items-center gap-4 pl-4">
            <img src="/logoECAR.png" alt="ECAR" className="h-7 w-auto object-contain" />
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="font-semibold text-gray-700">Módulo: Logística Interactiva</span>
         </div>
         <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pr-2">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar ID o Frentes de obra..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-full text-sm w-full md:w-64 bg-gray-50 focus:outline-none focus:border-ecar-blue focus:ring-1 focus:ring-ecar-blue transition-all" 
              />
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative cursor-pointer">
                <Bell className="text-gray-500 hover:text-ecar-blue transition-colors" size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-full px-2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden border border-blue-200 shrink-0">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" alt="User" />
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:inline">Lucas C.</span>
                <ChevronDown size={14} className="text-gray-500" />
              </div>
            </div>
         </div>
      </div>

      {/* KPI Row exactly as Mockup */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
         <KpiCard title="Casos activos" value={data.filter(d => d.estado !== 'Confirmado').length} color="blue" data={sparklineData1} />
         <KpiCard title="Urgentes" value={data.filter(d => d.prior === 'Alta').length} color="red" data={sparklineData2} />
         <KpiCard title="SLA vencidos" value="1" color="red" data={sparklineData3} />
         <KpiCard title="Terminados (OK)" value={data.filter(d => d.aprob === 'OK').length} color="green" data={sparklineData4} />
         <KpiCard title="Caja chica San Juan" value="$185.000" color="blue" data={sparklineData1} isCurrency />
         <KpiCard title="Gastos logísticos 30d" value="$1.470.000" color="red" data={sparklineData2} isCurrency />
      </div>

      {/* Filters Row - Functional */}
      <div className="bg-white p-3 rounded shadow-sm border border-gray-200 mb-4 flex gap-3 flex-wrap">
         <select value={filterObra} onChange={e => setFilterObra(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-[120px] text-gray-600 bg-white shadow-sm outline-none focus:border-ecar-blue">
            <option value="">Todas las Obras</option>
            <option value="Autopista Sur">Autopista Sur</option>
            <option value="Hospital">Hospital Rawson</option>
            <option value="Dique Tambolar">Dique Tambolar</option>
            <option value="100 Casas IPV">Barrio 100 Casas</option>
            <option value="Torre Consorcio">Consorcio Oficinas</option>
            <option value="Galpón ML">Galpón Mercadolibre</option>
         </select>
         
         <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-[120px] text-gray-600 bg-white shadow-sm outline-none focus:border-ecar-blue">
            <option value="">Todos los Tipos</option>
            <option value="Traslado">Traslado</option>
            <option value="Rotura">Rotura / Mantenimiento</option>
            <option value="Recepción">Recepción Material</option>
         </select>

         <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-[120px] text-gray-600 bg-white shadow-sm outline-none focus:border-ecar-blue">
            <option value="">Todos los Estados</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Reservado">Reservado</option>
         </select>
         
         <button onClick={() => { setFilterObra(''); setFilterTipo(''); setFilterEstado(''); setSearchTerm(''); }} className="bg-gray-100 text-gray-600 font-semibold text-sm px-4 py-1.5 rounded shadow-sm hover:bg-gray-200 border border-gray-300 transition-colors">
           Limpiar
         </button>
      </div>

      {/* Main Layout Split */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Left Side: Big Functional Table */}
        <div className="flex-1 bg-white border border-gray-200 rounded shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-700">
             <thead className="bg-gray-100/50 border-b border-gray-200 text-xs font-semibold text-gray-600">
               <tr>
                 <th className="px-4 py-3">ID</th>
                 <th className="px-4 py-3">Tipo</th>
                 <th className="px-4 py-3">Frente Obra</th>
                 <th className="px-4 py-3">Prioridad</th>
                 <th className="px-4 py-3">Estado</th>
                 <th className="px-4 py-3">Próximo hito</th>
                 <th className="px-4 py-3">Aprob. (Click para validar)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filteredData.length === 0 ? (
                 <tr><td colSpan={7} className="text-center py-8 text-gray-400">No se encontraron resultados</td></tr>
               ) : (
                 filteredData.map((row, i) => (
                   <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                     <td className="px-4 py-3 text-gray-500 font-mono">#{row.id}</td>
                     <td className="px-4 py-3 font-medium text-gray-800">{row.tipo}</td>
                     <td className="px-4 py-3 font-medium">{row.obra}</td>
                     <td className="px-4 py-3">
                       <span className={`px-2 py-0.5 rounded text-[11px] font-bold shadow-sm ${row.prior === 'Alta' ? 'bg-orange-400 text-white' : row.prior === 'Media' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>
                         {row.prior}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${row.estado === 'En Proceso' ? 'bg-ecar-blue text-white' : row.estado === 'Reservado' ? 'bg-green-600 text-white' : row.estado === 'Confirmado' ? 'bg-gray-800 text-white' : 'bg-gray-100 border border-gray-300 text-gray-600'}`}>
                          {row.estado}
                        </span>
                     </td>
                     <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.hito}</td>
                     <td className="px-4 py-3">
                       <button 
                          onClick={() => handleApprove(row.id, row.aprob)}
                          disabled={row.aprob === 'OK'}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                            row.aprob === 'Pendiente' ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 shadow-sm cursor-pointer' : 
                            row.aprob === 'En proceso' ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 shadow-sm cursor-pointer' :
                            row.aprob === 'Confirmar' ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 shadow-sm cursor-pointer' : 
                            'bg-green-500 border-green-600 text-white cursor-default shadow-sm'
                          }`}
                       >
                         {row.aprob === 'OK' ? <span className="flex items-center gap-1"><Check size={12}/> Autorizado</span> : row.aprob}
                       </button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>

        {/* Right Side: Widgets */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
           {/* Cola de aprobaciones */}
           <div className="bg-white border border-gray-200 rounded shadow-sm p-4 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-ecar-blue"></div>
             <h3 className="font-bold text-gray-800 text-sm mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
               <AlertCircle size={16} className="text-gray-400" /> Cola de Autorizaciones
             </h3>
             <ul className="space-y-4">
               <li className="flex justify-between items-center bg-gray-50 p-2 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-ecar-blue animate-pulse"></div>
                   <span className="text-sm text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]">OC #4567 - Acero 12mm</span>
                 </div>
                 <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-bold">Pendiente</span>
               </li>
               <li className="flex justify-between items-center hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                   <span className="text-sm text-gray-700 font-medium">Falla Excavadora Cat</span>
                 </div>
                 <span className="text-[10px] text-gray-400">Aprobar (GA)</span>
               </li>
               <li className="flex justify-between items-center hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-ecar-red"></div>
                   <span className="text-sm text-gray-700 font-medium">Hormigón Tambolar</span>
                 </div>
                 <span className="text-[10px] text-gray-400">Gerencia</span>
               </li>
             </ul>
           </div>

           {/* Agenda de hoy */}
           <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
             <h3 className="font-bold text-gray-800 text-sm mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
               <Clock size={16} className="text-gray-400" /> Despachos Urgentes
             </h3>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                 <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono mt-0.5 border border-gray-200">09:00</span>
                 <span className="text-sm text-gray-800 font-medium">Cemento a Autopista R40 (Camión BX-22)</span>
               </li>
               <li className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                 <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono mt-0.5 border border-gray-200">11:30</span>
                 <span className="text-sm text-gray-800 font-medium">Traslado Grúa P/ Loteo IPV Chimbas</span>
               </li>
               <li className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                 <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono mt-0.5 border border-gray-200">15:00</span>
                 <span className="text-sm text-gray-800 font-medium">Ingreso Proveedor (Mercado Libre Nave)</span>
               </li>
             </ul>
           </div>
        </div>

      </div>
    </div>
  );
};
