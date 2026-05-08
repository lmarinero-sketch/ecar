import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { useMonthlySnapshots } from '../hooks/useData';

const fmt = (n: number) => `$${Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtM = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return fmt(n);
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  personal_sueldos: { label: 'Sueldos Obreros', emoji: '👷', color: 'bg-blue-500' },
  personal_honorarios: { label: 'Honorarios', emoji: '💼', color: 'bg-indigo-500' },
  seguros: { label: 'Seguros', emoji: '🛡️', color: 'bg-teal-500' },
  servicios: { label: 'Servicios', emoji: '⚡', color: 'bg-yellow-500' },
  impuestos_arca: { label: 'Impuestos ARCA', emoji: '🏛️', color: 'bg-red-500' },
  gremios: { label: 'Gremios', emoji: '🤝', color: 'bg-purple-500' },
  combustibles: { label: 'Combustibles', emoji: '⛽', color: 'bg-orange-500' },
  cheques_echeq: { label: 'Cheques/Echeqs', emoji: '📝', color: 'bg-pink-500' },
  pagos_terceros: { label: 'Pagos a Terceros', emoji: '🤝', color: 'bg-cyan-500' },
  servicios_contratados: { label: 'Servicios Contratados', emoji: '🏗️', color: 'bg-lime-500' },
  viandas: { label: 'Viandas ECAR', emoji: '🍽️', color: 'bg-amber-500' },
  varios: { label: 'Varios', emoji: '📦', color: 'bg-gray-500' },
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const MonthlyReportModule: React.FC = () => {
  const { data: snapshots, isLoading } = useMonthlySnapshots();
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  const sortedSnapshots = useMemo(() => {
    if (!snapshots) return [];
    return [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  }, [snapshots]);

  const activeIdx = selectedIdx >= 0 ? selectedIdx : sortedSnapshots.length - 1;
  const snap = sortedSnapshots[activeIdx];

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (!snap) return <div className="text-center py-20 text-gray-400"><PieChart size={48} className="mx-auto mb-3 opacity-30" /><p>No hay datos de resumen mensual</p></div>;

  const monthDate = new Date(snap.month + 'T12:00:00');
  const monthLabel = `${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  const breakdown = (snap.expense_breakdown || {}) as Record<string, number>;
  const breakdownEntries = Object.entries(breakdown).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const totalBreakdown = breakdownEntries.reduce((s, [, v]) => s + v, 0);

  const totalRecibido = (snap.opening_balance || 0) + (snap.total_income || 0) + (snap.other_income || 0);
  const desvio = (snap.real_closing || 0) - (snap.projected_closing || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Calendar size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Calendar size={24} /> Resumen Mensual</h3>
          <p className="text-emerald-100 text-sm mt-1">Flujo de caja mensual — Proyectado vs Real</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setSelectedIdx(Math.max(0, activeIdx - 1))} disabled={activeIdx <= 0} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {sortedSnapshots.map((s, i) => {
            const d = new Date(s.month + 'T12:00:00');
            const label = `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear().toString().slice(2)}`;
            return (
              <button key={s.id} onClick={() => setSelectedIdx(i)} className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${i === activeIdx ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
            );
          })}
        </div>
        <button onClick={() => setSelectedIdx(Math.min(sortedSnapshots.length - 1, activeIdx + 1))} disabled={activeIdx >= sortedSnapshots.length - 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
      </div>

      {/* Flujo del mes - replica Excel Vista 3 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">📊 Resumen {monthLabel}</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <FlowRow label={`Caja Final ${MONTHS[monthDate.getMonth() === 0 ? 11 : monthDate.getMonth() - 1]} REAL`} value={snap.opening_balance} variant="opening" />
            <FlowRow label="Total Cobrado — Facturación Ventas Obras" value={snap.total_income} variant="income" />
            {(snap.other_income || 0) > 0 && <FlowRow label="Otros Ingresos (Apoyo financiero, ventas)" value={snap.other_income} variant="income" />}
            <div className="border-t border-gray-200 pt-2"><FlowRow label="TOTAL RECIBIDO" value={totalRecibido} variant="total" /></div>
            <FlowRow label={`Total Gastos ECAR ${monthLabel}`} value={snap.total_expenses} variant="expense" />
            <div className="border-t border-gray-200 pt-2">
              <FlowRow label={`Caja Final ${monthLabel} PROYECTADA`} value={snap.projected_closing} variant="projected" />
              <FlowRow label={`Caja Final ${monthLabel} REAL`} value={snap.real_closing} variant="real" />
              <FlowRow label="DIFERENCIA" value={desvio} variant="deviation" />
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de gastos */}
      {breakdownEntries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico barras */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieChart size={16} /> Distribución de Gastos</h4>
            <div className="space-y-3">
              {breakdownEntries.map(([key, value]) => {
                const cat = CATEGORY_LABELS[key] || { label: key, emoji: '📌', color: 'bg-gray-400' };
                const pct = totalBreakdown > 0 ? (value / totalBreakdown) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">{cat.emoji} {cat.label}</span>
                      <span className="font-mono font-bold text-gray-800">{fmt(value)} <span className="text-gray-400 text-xs">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`${cat.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla de categorías */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50"><h4 className="font-bold text-gray-800">Detalle por Categoría</h4></div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr><th className="px-4 py-3">Categoría</th><th className="px-4 py-3 text-right">Monto</th><th className="px-4 py-3 text-right">%</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdownEntries.map(([key, value]) => {
                  const cat = CATEGORY_LABELS[key] || { label: key, emoji: '📌', color: 'bg-gray-400' };
                  const pct = totalBreakdown > 0 ? (value / totalBreakdown) * 100 : 0;
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{cat.emoji} {cat.label}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{fmt(value)}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(totalBreakdown)}</td>
                  <td className="px-4 py-3 text-right font-mono">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evolución multi-mes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-bold text-gray-800 mb-4">📈 Evolución Mensual</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-3 text-left">Mes</th>
                <th className="px-3 py-3 text-right">Caja Inicio</th>
                <th className="px-3 py-3 text-right">Ingresos</th>
                <th className="px-3 py-3 text-right">Gastos</th>
                <th className="px-3 py-3 text-right">Proyectado</th>
                <th className="px-3 py-3 text-right">Real</th>
                <th className="px-3 py-3 text-right">Desvío</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedSnapshots.filter(s => (s.opening_balance || 0) > 0).map(s => {
                const d = new Date(s.month + 'T12:00:00');
                const dev = (s.real_closing || 0) - (s.projected_closing || 0);
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 ${s.id === snap.id ? 'bg-emerald-50' : ''}`}>
                    <td className="px-3 py-3 font-medium">{MONTHS[d.getMonth()].slice(0, 3)} {d.getFullYear()}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-500">{fmtM(s.opening_balance)}</td>
                    <td className="px-3 py-3 text-right font-mono text-green-600">{fmtM((s.total_income || 0) + (s.other_income || 0))}</td>
                    <td className="px-3 py-3 text-right font-mono text-red-600">{fmtM(s.total_expenses)}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-500">{fmtM(s.projected_closing)}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold">{fmtM(s.real_closing)}</td>
                    <td className={`px-3 py-3 text-right font-mono font-bold ${dev >= 0 ? 'text-green-600' : 'text-red-600'}`}>{dev >= 0 ? '+' : '-'}{fmtM(Math.abs(dev))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FlowRow: React.FC<{ label: string; value: number | null; variant: string }> = ({ label, value, variant }) => {
  const v = value || 0;
  const styles: Record<string, string> = {
    opening: 'text-gray-800 font-bold text-lg',
    income: 'text-green-600 font-medium',
    total: 'text-blue-700 font-bold text-lg',
    expense: 'text-red-600 font-bold',
    projected: 'text-gray-500',
    real: 'text-emerald-700 font-bold text-lg',
    deviation: v >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold',
  };
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-mono ${styles[variant] || 'text-gray-800'}`}>
        {variant === 'deviation' && v !== 0 ? (v > 0 ? '+' : '-') : ''}
        {variant === 'expense' ? '-' : ''}{fmt(Math.abs(v))}
      </span>
    </div>
  );
};
