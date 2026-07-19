import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet, Landmark, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
  AlertTriangle, X, CreditCard
} from 'lucide-react';
import { useBankAccounts, useCashMovements, useCheques, useCreateCashMovement, useProjectCertificates } from '../hooks/useData';
import { MonthlyLiquiditySummary } from './MonthlyLiquiditySummary';
import { useImplementationStore } from '../store/useImplementationStore';

const fmt = (n: number) => `$${Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};


const CATEGORIES = [
  'Sueldos/Honorarios', 'Seguros', 'Servicios', 'Impuestos ARCA',
  'Gremios', 'Combustibles', 'Cheques/Echeqs', 'Pagos a terceros',
  'Servicios contratados', 'Viandas', 'Varios', 'Certificación',
  'Cobro certificado', 'Otro ingreso',
];

export const LiquidityDashboard: React.FC = () => {
  const { data: accounts, isLoading: loadingAccounts } = useBankAccounts();

  useEffect(() => {
    useImplementationStore.getState().completeItem('c2-21');
  }, []);
  const { isLoading: loadingMovements } = useCashMovements();

  const { data: cheques } = useCheques();
  const { data: certificates } = useProjectCertificates();
  const createMovement = useCreateCashMovement();

  const [showNewMovement, setShowNewMovement] = useState(false);

  const [form, setForm] = useState({ type: 'expense' as 'income' | 'expense', category: '', description: '', amount: '', counterpart: '', bank_account_id: '' });

  // KPIs
  const totalLiquidity = useMemo(() => (accounts || []).reduce((s, a) => s + a.current_balance, 0), [accounts]);
  const cashBalance = useMemo(() => (accounts || []).find(a => a.type === 'cash')?.current_balance || 0, [accounts]);
  const bankBalance = useMemo(() => (accounts || []).filter(a => a.type === 'bank').reduce((s, a) => s + a.current_balance, 0), [accounts]);
  const investBalance = useMemo(() => (accounts || []).filter(a => a.type === 'investment').reduce((s, a) => s + a.current_balance, 0), [accounts]);

  // Cheques próximos 7 días
  const today = new Date();
  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const upcomingCheques = useMemo(() => {
    if (!cheques) return [];
    return cheques.filter(c => {
      if (c.status !== 'pending' || !c.due_date) return false;
      const d = new Date(c.due_date);
      return d >= today && d <= weekAhead;
    }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  }, [cheques]);

  const chequesPayable = upcomingCheques.filter(c => c.direction === 'payable');
  const chequesReceivable = upcomingCheques.filter(c => c.direction === 'receivable');
  const totalPayable = chequesPayable.reduce((s, c) => s + c.amount_ars, 0);
  const totalReceivable = chequesReceivable.reduce((s, c) => s + c.amount_ars, 0);

  // Certificaciones pendientes
  const upcomingCerts = useMemo(() => {
    if (!certificates) return [];
    return certificates.filter(c => c.status === 'pending');
  }, [certificates]);
  const totalCerts = upcomingCerts.reduce((s, c) => s + (c.net_deposit || 0), 0);


  // Cheques a cubrir (Line Chart Data) - Próximos 45 días
  const chequesChartData = useMemo(() => {
    if (!cheques) return [];
    const t = new Date();
    t.setHours(0,0,0,0);
    const maxDate = new Date(t.getTime() + 45 * 86400000);
    
    const pendingPayable = cheques.filter(c => {
        if (c.direction !== 'payable' || c.status !== 'pending' || !c.due_date) return false;
        const d = new Date(c.due_date);
        return d >= t && d <= maxDate;
    });

    if (pendingPayable.length === 0) return [];

    const grouped = pendingPayable.reduce((acc, c) => {
      const date = c.due_date!;
      acc[date] = (acc[date] || 0) + c.amount_ars;
      return acc;
    }, {} as Record<string, number>);

    const sortedDates = Object.keys(grouped).sort();
    return sortedDates.map(date => ({
      date,
      daily: grouped[date]
    }));
  }, [cheques]);

  const maxChequeAmount = useMemo(() => Math.max(...chequesChartData.map(d => d.daily), 1), [chequesChartData]);
  
  // SVG Chart Dimensions
  const svgWidth = 1000;
  const svgHeight = 220;
  const paddingY = 40;
  const paddingX = 40;
  const stepX = chequesChartData.length > 1 ? (svgWidth - paddingX * 2) / (chequesChartData.length - 1) : 0;
  const chartPoints = chequesChartData.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = svgHeight - paddingY - ((d.daily / maxChequeAmount) * (svgHeight - paddingY * 2));
    return `${x},${y}`;
  }).join(' ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount) return;
    await createMovement.mutateAsync({
      type: form.type,
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount),
      counterpart: form.counterpart || null,
      bank_account_id: form.bank_account_id || null,
      movement_date: new Date().toISOString().split('T')[0],
      created_by: 'web',
    });
    setForm({ type: 'expense', category: '', description: '', amount: '', counterpart: '', bank_account_id: '' });
    setShowNewMovement(false);
  };

  if (loadingAccounts || loadingMovements) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><DollarSign size={24} /> Tablero de Liquidez</h3>
          <p className="text-emerald-100 text-sm mt-1">Posición financiera en tiempo real — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Efectivo', value: cashBalance, icon: Wallet, color: 'emerald', type: 'cash' },
          { label: 'Bancos', value: bankBalance, icon: Landmark, color: 'blue', type: 'bank' },
          { label: 'Inversiones', value: investBalance, icon: TrendingUp, color: 'purple', type: 'investment' },
          { label: 'Disponibilidad Total', value: totalLiquidity, icon: DollarSign, color: 'amber', type: 'total' },
        ].map(kpi => (
          <div key={kpi.label} className={`light-card p-5 hover:shadow-md transition-all ${kpi.type === 'total' ? 'ring-2 ring-amber-200' : ''}`}>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2">
              <kpi.icon size={16} className={`text-${kpi.color}-500`} /> {kpi.label}
            </div>
            <p className={`text-2xl font-black text-${kpi.color}-600 font-mono`}>{fmt(kpi.value)}</p>
            {kpi.type !== 'total' && Array.isArray(accounts) && accounts.filter(a => a.type === kpi.type).map(a => (
              <p key={a.id} className="text-xs text-gray-400 mt-1">{a.name}{a.bank_name ? ` (${a.bank_name})` : ''}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Alerts + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alertas de Caja */}
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Alertas de Caja (7 días)</h3>
          </div>
          <div className="p-4 space-y-3">
            {chequesPayable.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1"><ArrowUpRight size={14} /> Cheques a pagar</span>
                  <span className="font-mono font-bold text-red-700">{fmt(totalPayable)}</span>
                </div>
                {chequesPayable.map(c => (
                  <div key={c.id} className="flex justify-between text-xs text-red-600 py-0.5">
                    <span>N° {c.cheque_number} — {c.beneficiary_or_issuer || c.bank_name}</span>
                    <span className="font-mono">{fmt(c.amount_ars)} · {new Date(c.due_date!).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}
            {chequesReceivable.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-green-700 flex items-center gap-1"><ArrowDownRight size={14} /> Cheques a cobrar</span>
                  <span className="font-mono font-bold text-green-700">{fmt(totalReceivable)}</span>
                </div>
                {chequesReceivable.map(c => (
                  <div key={c.id} className="flex justify-between text-xs text-green-600 py-0.5">
                    <span>N° {c.cheque_number} — {c.beneficiary_or_issuer || c.bank_name}</span>
                    <span className="font-mono">{fmt(c.amount_ars)} · {new Date(c.due_date!).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}
            {upcomingCerts.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1"><TrendingUp size={14} /> Certificaciones a cobrar</span>
                  <span className="font-mono font-bold text-blue-700">{fmt(totalCerts)}</span>
                </div>
                {upcomingCerts.map(c => (
                  <div key={c.id} className="flex justify-between text-xs text-blue-600 py-0.5">
                    <span className="truncate mr-2">Cert. N° {c.certificate_number} — {c.project?.name || 'Obra'}</span>
                    <span className="font-mono whitespace-nowrap">{fmt(c.net_deposit || 0)} {c.deposit_date ? `· ${new Date(c.deposit_date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
            {upcomingCheques.length === 0 && upcomingCerts.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Sin vencimientos próximos</p>
              </div>
            )}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Neto Cheques (7 días):</span>
              <span className={`font-mono font-bold ${totalReceivable - totalPayable >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReceivable - totalPayable >= 0 ? '+' : ''}{fmt(totalReceivable - totalPayable)}
              </span>
            </div>
          </div>
        </div>


      </div>

      {/* Gráfico de Línea - Cheques a Cubrir */}
      {chequesChartData.length > 0 && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-red-500" /> Proyección de Cheques a Cubrir (Próximos 45 días)
            </h3>
          </div>
          <div className="p-6 overflow-x-auto">
            <div className="min-w-[800px] h-56 relative">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradient-red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f3f4f6" strokeWidth="1" />
                <line x1={paddingX} y1={svgHeight/2} x2={svgWidth - paddingX} y2={svgHeight/2} stroke="#f3f4f6" strokeWidth="1" />
                <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e5e7eb" strokeWidth="2" />
                
                {/* Max Value Label */}
                <text x={paddingX - 10} y={paddingY + 4} fontSize="12" fill="#9ca3af" textAnchor="end">{fmtShort(maxChequeAmount)}</text>
                <text x={paddingX - 10} y={svgHeight - paddingY + 4} fontSize="12" fill="#9ca3af" textAnchor="end">$0</text>

                {chequesChartData.length > 1 && (
                  <>
                    <polygon points={`${paddingX},${svgHeight-paddingY} ${chartPoints} ${paddingX + (chequesChartData.length-1)*stepX},${svgHeight-paddingY}`} fill="url(#gradient-red)" />
                    <polyline points={chartPoints} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
                {chequesChartData.length === 1 && (
                  <circle cx={paddingX} cy={svgHeight - paddingY - ((chequesChartData[0].daily / maxChequeAmount) * (svgHeight - paddingY * 2))} r="6" fill="#ef4444" />
                )}

                {/* Points and Text */}
                {chequesChartData.map((d, i) => {
                  const x = paddingX + i * stepX;
                  const y = svgHeight - paddingY - ((d.daily / maxChequeAmount) * (svgHeight - paddingY * 2));
                  return (
                    <g key={d.date} className="hover:opacity-80 cursor-pointer transition-opacity">
                      <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                      <text x={x} y={svgHeight - 15} fontSize="12" fill="#6b7280" textAnchor="middle">{new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</text>
                      <text x={x} y={y - 12} fontSize="12" fill="#1f2937" fontWeight="bold" textAnchor="middle">{fmtShort(d.daily)}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}



        <MonthlyLiquiditySummary />

        {/* Modal Nuevo Movimiento */}
        {showNewMovement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Registrar Ingreso / Egreso</h3>
              <button onClick={() => setShowNewMovement(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['expense', 'income'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${form.type === t ? (t === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'bg-white text-green-600 shadow-sm') : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'expense' ? '📤 Egreso' : '📥 Ingreso'}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Categoría *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all">
                  <option value="">Seleccioná...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Monto ($) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="1500000" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Contraparte</label>
                  <input type="text" value={form.counterpart} onChange={e => setForm({ ...form, counterpart: e.target.value })} placeholder="Ej: Elio, Proveedor" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Descripción</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalle opcional" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Cuenta</label>
                <select value={form.bank_account_id} onChange={e => setForm({ ...form, bank_account_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Sin asignar</option>
                  {(accounts || []).map(a => <option key={a.id} value={a.id}>{a.name}{a.bank_name ? ` (${a.bank_name})` : ''}</option>)}
                </select>
              </div>

              <button type="submit" disabled={createMovement.isPending} className="btn-primary w-full">
                {createMovement.isPending ? 'Guardando...' : '✅ Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
