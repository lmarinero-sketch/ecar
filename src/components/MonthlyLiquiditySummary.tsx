import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Edit2 } from 'lucide-react';
import { 
  useMonthlySnapshots, 
  useUpsertMonthlySnapshot, 
  useProjectCertificates, 
  useGastosRegistrosByRange 
} from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';

const fmt = (n: number) => `$${Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

export const MonthlyLiquiditySummary: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    // Default to current month
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Also get previous month string
  const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const { data: snapshots } = useMonthlySnapshots();
  const upsertSnapshot = useUpsertMonthlySnapshot();
  const { data: certificates } = useProjectCertificates();
  
  // Fetch gastos for the current month
  const { data: gastosRegistros } = useGastosRegistrosByRange([monthStr]);

  // Find snapshots
  const currentSnap = (snapshots || []).find(s => s.month.startsWith(monthStr));
  const prevSnap = (snapshots || []).find(s => s.month.startsWith(prevMonthStr));

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    apoyoFinanciero: 0,
    cajaFinalReal: 0,
    otrosIngresosAmount: 0,
    otrosIngresosObs: '',
    otrosGastosAmount: 0,
    otrosGastosObs: ''
  });

  // Calculate fields
  const cajaInicial = prevSnap?.real_closing || 0;

  // Total Cobrado: sum of net_deposit of certificates deposited in this month
  const totalCobrado = useMemo(() => {
    if (!certificates) return 0;
    return certificates.reduce((sum, c) => {
      if (c.status === 'deposited' && c.deposit_date && c.deposit_date.startsWith(monthStr)) {
        return sum + (c.net_deposit || 0);
      }
      return sum;
    }, 0);
  }, [certificates, monthStr]);

  // Total Gastos: sum of gastos for this month
  const totalGastos = useMemo(() => {
    if (!gastosRegistros) return 0;
    return gastosRegistros.reduce((sum, g) => sum + (g.monto || 0), 0);
  }, [gastosRegistros]);

  // Sync form with current snapshot when switching months or when data loads
  useEffect(() => {
    if (currentSnap) {
      setForm({
        apoyoFinanciero: currentSnap.other_income || 0,
        cajaFinalReal: currentSnap.real_closing || 0,
        otrosIngresosAmount: currentSnap.expense_breakdown?.otros_ingresos?.amount || 0,
        otrosIngresosObs: currentSnap.expense_breakdown?.otros_ingresos?.obs || '',
        otrosGastosAmount: currentSnap.expense_breakdown?.otros_gastos?.amount || 0,
        otrosGastosObs: currentSnap.expense_breakdown?.otros_gastos?.obs || ''
      });
    } else {
      setForm({
        apoyoFinanciero: 0,
        cajaFinalReal: 0,
        otrosIngresosAmount: 0,
        otrosIngresosObs: '',
        otrosGastosAmount: 0,
        otrosGastosObs: ''
      });
    }
    setIsEditing(false);
  }, [currentSnap, monthStr]);

  // Derived values for display
  const displayApoyo = isEditing ? form.apoyoFinanciero : (currentSnap?.other_income || 0);
  const displayCajaReal = isEditing ? form.cajaFinalReal : (currentSnap?.real_closing || 0);
  const displayOtrosIngresosAmount = isEditing ? form.otrosIngresosAmount : (currentSnap?.expense_breakdown?.otros_ingresos?.amount || 0);
  const displayOtrosGastosAmount = isEditing ? form.otrosGastosAmount : (currentSnap?.expense_breakdown?.otros_gastos?.amount || 0);

  const totalRecibido = cajaInicial + totalCobrado + displayApoyo + displayOtrosIngresosAmount;
  const totalGastosSum = totalGastos + displayOtrosGastosAmount;
  const cajaEsperada = totalRecibido - totalGastosSum;
  const diferencia = displayCajaReal - cajaEsperada;

  const handleSave = async () => {
    try {
      const snapData = {
        month: `${monthStr}-01`,
        opening_balance: cajaInicial,
        total_income: totalCobrado,
        other_income: form.apoyoFinanciero,
        total_expenses: totalGastosSum,
        projected_closing: cajaEsperada,
        real_closing: form.cajaFinalReal,
        deviation: form.cajaFinalReal - cajaEsperada,
        expense_breakdown: {
          ...currentSnap?.expense_breakdown,
          otros_ingresos: { amount: form.otrosIngresosAmount, obs: form.otrosIngresosObs },
          otros_gastos: { amount: form.otrosGastosAmount, obs: form.otrosGastosObs }
        }
      };

      await upsertSnapshot.mutateAsync(snapData);
      setIsEditing(false);
      useModalStore.getState().showAlert('Éxito', 'Resumen guardado correctamente');
    } catch (e: any) {
      useModalStore.getState().showAlert('Error', e.message);
    }
  };

  const monthLabel = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="light-card overflow-hidden mt-6 mb-6">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white flex justify-between items-center">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <ChevronLeft />
        </button>
        <h3 className="font-bold text-lg tracking-wider">RESUMEN {monthLabel}</h3>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-200">
            {/* CAJA INICIAL */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-3 font-medium text-gray-700 w-2/3">CAJA FINAL MES ANTERIOR REAL</td>
              <td className="px-6 py-3 text-right font-mono font-bold">{fmt(cajaInicial)}</td>
            </tr>

            {/* INGRESOS */}
            <tr className="bg-blue-50/30">
              <td className="px-6 py-3 font-medium text-blue-800">TOTAL COBRADO - FACTURACION VENTAS (Certificados depositados)</td>
              <td className="px-6 py-3 text-right font-mono">{fmt(totalCobrado)}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-3 font-medium text-gray-700">
                APOYO FINANCIERO ECAR SAS
              </td>
              <td className="px-6 py-2 text-right">
                {isEditing ? (
                  <input 
                    type="number" 
                    value={form.apoyoFinanciero || ''} 
                    onChange={e => setForm({...form, apoyoFinanciero: parseFloat(e.target.value) || 0})}
                    className="w-32 px-2 py-1 border border-gray-300 rounded font-mono text-right"
                  />
                ) : (
                  <span className="font-mono">{fmt(displayApoyo)}</span>
                )}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-2 font-medium text-gray-700">
                <div className="flex flex-col">
                  <span>OTROS INGRESOS (Ajustes manuales)</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      placeholder="Observaciones..."
                      value={form.otrosIngresosObs} 
                      onChange={e => setForm({...form, otrosIngresosObs: e.target.value})}
                      className="text-xs px-2 py-1 mt-1 border border-gray-300 rounded text-gray-600"
                    />
                  ) : (
                    form.otrosIngresosObs && <span className="text-xs text-gray-500 italic">{form.otrosIngresosObs}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-2 text-right">
                {isEditing ? (
                  <input 
                    type="number" 
                    value={form.otrosIngresosAmount || ''} 
                    onChange={e => setForm({...form, otrosIngresosAmount: parseFloat(e.target.value) || 0})}
                    className="w-32 px-2 py-1 border border-gray-300 rounded font-mono text-right"
                  />
                ) : (
                  <span className="font-mono">{fmt(displayOtrosIngresosAmount)}</span>
                )}
              </td>
            </tr>

            {/* TOTAL RECIBIDO */}
            <tr className="bg-gray-100 border-y-2 border-gray-300">
              <td className="px-6 py-3 font-bold text-gray-800 uppercase">TOTAL RECIBIDO {monthLabel}</td>
              <td className="px-6 py-3 text-right font-mono font-bold text-gray-800">{fmt(totalRecibido)}</td>
            </tr>

            {/* GASTOS */}
            <tr className="bg-rose-50/30">
              <td className="px-6 py-3 font-medium text-rose-800">TOTAL GASTOS ECAR (Gastos Operativos cargados)</td>
              <td className="px-6 py-3 text-right font-mono">{fmt(totalGastos)}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-2 font-medium text-gray-700">
                <div className="flex flex-col">
                  <span>OTROS GASTOS (Ajustes manuales)</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      placeholder="Observaciones..."
                      value={form.otrosGastosObs} 
                      onChange={e => setForm({...form, otrosGastosObs: e.target.value})}
                      className="text-xs px-2 py-1 mt-1 border border-gray-300 rounded text-gray-600"
                    />
                  ) : (
                    form.otrosGastosObs && <span className="text-xs text-gray-500 italic">{form.otrosGastosObs}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-2 text-right">
                {isEditing ? (
                  <input 
                    type="number" 
                    value={form.otrosGastosAmount || ''} 
                    onChange={e => setForm({...form, otrosGastosAmount: parseFloat(e.target.value) || 0})}
                    className="w-32 px-2 py-1 border border-gray-300 rounded font-mono text-right"
                  />
                ) : (
                  <span className="font-mono">{fmt(displayOtrosGastosAmount)}</span>
                )}
              </td>
            </tr>

            {/* CAJA FINAL ESPERADA */}
            <tr className="bg-emerald-50 border-t-2 border-emerald-200">
              <td className="px-6 py-3 font-bold text-emerald-800 uppercase">CAJA FINAL {monthLabel} ESPERADA</td>
              <td className="px-6 py-3 text-right font-mono font-bold text-emerald-800">{fmt(cajaEsperada)}</td>
            </tr>

            {/* CAJA FINAL REAL */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-3 font-bold text-gray-800 uppercase">CAJA FINAL {monthLabel} REAL</td>
              <td className="px-6 py-2 text-right font-mono font-bold">
                {isEditing ? (
                  <input 
                    type="number" 
                    value={form.cajaFinalReal || ''} 
                    onChange={e => setForm({...form, cajaFinalReal: parseFloat(e.target.value) || 0})}
                    className="w-36 px-2 py-1 border-2 border-emerald-400 focus:ring-2 focus:ring-emerald-200 rounded font-mono text-right text-lg"
                  />
                ) : (
                  <span className="text-lg">{fmt(displayCajaReal)}</span>
                )}
              </td>
            </tr>

            {/* DIFERENCIA */}
            <tr className="bg-sky-500 text-white">
              <td className="px-6 py-4 font-bold uppercase">DIFERENCIA</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-lg">
                {displayCajaReal === 0 && !isEditing && cajaEsperada !== 0 ? '-' : fmt(diferencia)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
        {isEditing ? (
          <>
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 font-bold text-sm text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={upsertSnapshot.isPending}
              className="px-4 py-2 font-bold text-sm text-white bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 flex items-center gap-2"
            >
              <Save size={16} /> {upsertSnapshot.isPending ? 'Guardando...' : 'Guardar Resumen'}
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 font-bold text-sm text-ecar-blue bg-white border border-ecar-blue rounded-lg shadow-sm hover:bg-blue-50 flex items-center gap-2"
          >
            <Edit2 size={16} /> Editar Valores Manuales
          </button>
        )}
      </div>
    </div>
  );
};
