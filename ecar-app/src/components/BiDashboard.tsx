import React from 'react';
import { useStore } from '../store/useStore';
import { Activity, Clock, Package, Truck, CheckCircle2, TrendingUp, AlertTriangle, LayoutDashboard } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const timeSeriesData = [
  { name: 'Ene', cost: 120000000, revenue: 150000000, otif: 75 },
  { name: 'Feb', cost: 250000000, revenue: 310000000, otif: 80 },
  { name: 'Mar', cost: 410000000, revenue: 520000000, otif: 85 },
  { name: 'Abr', cost: 680000000, revenue: 840000000, otif: 82 },
  { name: 'May (Proy)', cost: 950000000, revenue: 1250000000, otif: 87 },
  { name: 'Jun (Proy)', cost: 1300000000, revenue: 1720000000, otif: 90 },
];

const COLORS = ['#2D7ECC', '#10B981', '#F59E0B', '#EF4444'];

export const BiDashboard: React.FC = () => {
  const { kpis, projects, wbsElements } = useStore();

  const formatARS = (val: number) => `A$ ${(val / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;

  // Calculate total revenue per project dynamically
  const projectRevenueData = projects.map(p => {
    const projWbs = wbsElements.filter(w => w.projectId === p.id);
    const totalRev = projWbs.reduce((acc, curr) => acc + (curr.budgetRevenueARS || 0), 0);
    const totalCost = projWbs.reduce((acc, curr) => acc + (curr.budgetCostARS || 0), 0);
    return {
      name: p.name,
      value: totalRev,
      cost: totalCost,
      margin: totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0
    };
  }).filter(p => p.value > 0);

  const totalPortfolioRevenue = projectRevenueData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px] flex flex-col justify-center p-6 shadow-sm border border-ecar-blue/20">
         {/* Background Image & Overlay */}
         <div className="absolute inset-0 z-0 bg-[url('/hero-construction.png')] bg-cover bg-center"></div>
         <div className="absolute inset-0 z-0 bg-ecar-blueDark/80 mix-blend-multiply"></div>
         <div className="absolute inset-0 z-0 bg-gradient-to-r from-ecar-blueDark via-ecar-blueDark/90 to-transparent"></div>
         
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-white mb-2">
              <h2 className="text-3xl font-bold tracking-tight">Buenas tardes 👋</h2>
            </div>
            <p className="text-blue-100 max-w-3xl leading-relaxed text-sm">
              Bienvenido al <strong className="text-white">Sistema Integral ECAR</strong>. Desde acá podés analizar la salud financiera del portfolio, autorizar órdenes de trabajo pendientes, y liquidar certificaciones conectadas a la inflación de manera predictiva.
            </p>
            <div className="mt-4 flex gap-3">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded font-medium text-xs flex items-center gap-2"><LayoutDashboard size={14} /> BI Inteligente</span>
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded font-medium text-xs flex items-center gap-2"><Clock size={14} /> KPI Tiempo Real</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="light-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 text-ecar-blue rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform">
             <Clock size={24} className="mt-4 mr-4" />
          </div>
          <p className="text-sm text-gray-500 font-medium">OTIF Logístico</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{kpis.otif}%</h3>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Target (85%) superado</p>
        </div>

        <div className="light-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform">
             <Activity size={24} className="mt-4 mr-4" />
          </div>
          <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Variación Costo (VAC)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-green-600">
               {kpis.vac < 0 ? '-' : '+'} {formatARS(Math.abs(kpis.vac))}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-2">Ahorro sobre líneas WBS</p>
        </div>

        <div className="light-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center opacity-50 transition-transform">
             <Package size={24} className="mt-4 mr-4" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Rotación Inventario</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{kpis.turnoverRate}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-2">Ciclos por semestre</p>
        </div>

        <div className="light-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center opacity-50">
             <Truck size={24} className="mt-4 mr-4" />
          </div>
          <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Utilización Flota</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{kpis.fleetUtilization}%</h3>
          </div>
          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">Amortización optima</p>
        </div>

        <div className="light-card p-5 relative overflow-hidden group border-b-4 border-b-ecar-blue">
          <p className="text-sm text-gray-500 font-medium">SPI (Cronograma global)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className={`text-3xl font-bold ${kpis.spi < 1 ? 'text-ecar-red' : 'text-green-600'}`}>
              {kpis.spi}
            </h3>
          </div>
          <p className="text-xs text-ecar-red mt-2">Retraso detectado en Dique Tambolar</p>
        </div>
      </div>

      {/* Main Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart: Revenue Composition */}
        <div className="light-card p-6 flex flex-col">
           <h3 className="text-base font-bold text-gray-900 mb-1">Composición de Facturación</h3>
           <p className="text-xs text-gray-500 mb-4">Total Proyectado: <span className="font-bold text-ecar-blue">{formatARS(totalPortfolioRevenue)}</span></p>
           
           <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectRevenueData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatARS(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '11px', paddingTop: '10px'}}/>
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Area Chart: Costs vs Revenue */}
        <div className="light-card p-6 lg:col-span-2 flex flex-col">
           <h3 className="text-base font-bold text-gray-900 mb-1">Evolución: Costo Devengado. vs Facturación Apercibir (Mensual)</h3>
           <p className="text-xs text-gray-500 mb-4">Métricas consolidadas de la oficina técnica</p>
           
           <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D7ECC" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2D7ECC" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} tickFormatter={(val) => `$${val/1000000}M`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <RechartsTooltip 
                    formatter={(value: number) => formatARS(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Area type="monotone" dataKey="revenue" name="Facturación" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="cost" name="Costo Devengado" stroke="#2D7ECC" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* Portfolio Table */}
      <div className="light-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
           <TrendingUp size={18} className="text-gray-400"/>
           <h3 className="font-bold text-gray-900">Estado Financiero por Frente de Obra</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Contratista / Ubicación</th>
              <th className="text-right">Costo Presupuestado</th>
              <th className="text-right">Facturación Apercibir</th>
              <th className="text-right">Margen Bruto (%)</th>
              <th className="text-center">SPI / Estado</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => {
              const rData = projectRevenueData.find(rd => rd.name === p.name);
              const cost = rData?.cost || p.budgetARS;
              const rev = rData?.value || p.budgetARS * 1.3; // Default 30% margin if no WBS
              const margin = ((rev - cost) / rev) * 100;
              
              const rowSpi = idx === 1 ? 0.98 : (idx === 2 ? 0.91 : 1.05);

              return (
                <tr key={p.id}>
                  <td className="font-bold text-gray-900">{p.name}</td>
                  <td>
                    <p className="text-gray-700">{p.client}</p>
                    <p className="text-xs text-gray-400">{p.location}</p>
                  </td>
                  <td className="text-right font-mono text-gray-600">{formatARS(cost)}</td>
                  <td className="text-right font-mono text-green-700 font-bold">{formatARS(rev)}</td>
                  <td className="text-right font-mono text-gray-900">
                    <span className={`px-2 py-1 rounded bg-gray-100 ${margin < 20 ? 'text-orange-600' : 'text-green-700'}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                     {rowSpi < 1 ? (
                        <div className="flex items-center justify-center gap-1 text-ecar-red text-xs font-bold">
                           <AlertTriangle size={12}/> SPI {rowSpi}
                        </div>
                     ) : (
                        <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-bold">
                           <CheckCircle2 size={12}/> SPI {rowSpi}
                        </div>
                     )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
