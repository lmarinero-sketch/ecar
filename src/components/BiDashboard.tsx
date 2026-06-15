import React, { useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Users, Truck, DollarSign, BarChart3 } from 'lucide-react';
import { useProjects, useEmployees, useCheques, useInvoices } from '../hooks/useData';
import { useImplementationStore } from '../store/useImplementationStore';

export const BiDashboard: React.FC = () => {
  const { data: projects = [] } = useProjects();

  useEffect(() => {
    useImplementationStore.getState().completeItem('c2-25');
  }, []);
  const { data: employees = [] } = useEmployees();
  const { data: cheques = [] } = useCheques();
  const { data: invoices = [] } = useInvoices();

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const activeEmployees = employees.filter(e => e.employment_status === 'active').length;
  const totalBudget = projects.reduce((a, p) => a + (p.budget_ars || 0), 0);
  const chequesACobrar = cheques.filter(c => c.direction === 'receivable' && c.status === 'pending').reduce((a, c) => a + c.amount_ars, 0);
  const facturacionMes = invoices.filter(i => i.status === 'approved').reduce((a, i) => a + i.total_ars, 0);

  const formatARS = (v: number) => {
    if (v >= 1_000_000_000) return `A$ ${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `A$ ${(v / 1_000_000).toFixed(1)}M`;
    return `A$ ${v.toLocaleString()}`;
  };

  const kpis = [
    { label: 'Obras Activas', value: activeProjects.toString(), icon: BarChart3, color: 'border-l-blue-500', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Presupuesto Total', value: formatARS(totalBudget), icon: DollarSign, color: 'border-l-green-500', bg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Personal Activo', value: activeEmployees.toString(), icon: Users, color: 'border-l-purple-500', bg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Facturación Aprobada', value: formatARS(facturacionMes), icon: TrendingUp, color: 'border-l-emerald-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Cheques a Cobrar', value: formatARS(chequesACobrar), icon: DollarSign, color: 'border-l-orange-500', bg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { label: 'Flota', value: '—', icon: Truck, color: 'border-l-gray-400', bg: 'bg-gray-50', iconColor: 'text-gray-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><LayoutDashboard size={140} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><LayoutDashboard size={24} /> Dashboard Ejecutivo</h3>
          <p className="text-blue-100 text-sm mt-1">Vista general del estado de ECAR Constructora en tiempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={`bg-white border-l-4 ${kpi.color} border-y border-r border-gray-200 shadow-sm p-5 rounded-xl`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                <h4 className="text-2xl font-black text-gray-900 mt-2 font-mono">{kpi.value}</h4>
              </div>
              <div className={`${kpi.bg} p-2 rounded-lg ${kpi.iconColor}`}><kpi.icon size={20} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
