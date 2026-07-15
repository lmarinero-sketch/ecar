import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [inlineEdit, setInlineEdit] = useState<string | null>(null);
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
    setInlineEdit(null);
  }, [currentSnap, monthStr]);

  // Derived values for display
  const displayApoyo = form.apoyoFinanciero;
  const displayCajaReal = form.cajaFinalReal;
  const displayOtrosIngresosAmount = form.otrosIngresosAmount;
  const displayOtrosGastosAmount = form.otrosGastosAmount;

  const totalRecibido = cajaInicial + totalCobrado + displayApoyo + displayOtrosIngresosAmount;
  const totalGastosSum = totalGastos + displayOtrosGastosAmount;
  const cajaEsperada = totalRecibido - totalGastosSum;
  const diferencia = displayCajaReal - cajaEsperada;

  const handleInlineSave = async (field: keyof typeof form, value: string | number) => {
    try {
      const newForm = { ...form, [field]: typeof value === 'string' ? value : (parseFloat(value.toString()) || 0) };
      setForm(newForm);
      
      const newApoyo = field === 'apoyoFinanciero' ? Number(value) : form.apoyoFinanciero;
      const newOtrosIngresos = field === 'otrosIngresosAmount' ? Number(value) : form.otrosIngresosAmount;
      const newOtrosGastos = field === 'otrosGastosAmount' ? Number(value) : form.otrosGastosAmount;
      const newCajaFinal = field === 'cajaFinalReal' ? Number(value) : form.cajaFinalReal;
      const newOtrosIngresosObs = field === 'otrosIngresosObs' ? String(value) : form.otrosIngresosObs;
      const newOtrosGastosObs = field === 'otrosGastosObs' ? String(value) : form.otrosGastosObs;

      const totalRecibidoNow = cajaInicial + totalCobrado + newApoyo + newOtrosIngresos;
      const totalGastosSumNow = totalGastos + newOtrosGastos;
      const cajaEsperadaNow = totalRecibidoNow - totalGastosSumNow;

      const snapData = {
        month: `${monthStr}-01`,
        opening_balance: cajaInicial,
        total_income: totalCobrado,
        other_income: newApoyo,
        total_expenses: totalGastosSumNow,
        projected_closing: cajaEsperadaNow,
        real_closing: newCajaFinal,
        deviation: newCajaFinal - cajaEsperadaNow,
        expense_breakdown: {
          ...currentSnap?.expense_breakdown,
          otros_ingresos: { amount: newOtrosIngresos, obs: newOtrosIngresosObs },
          otros_gastos: { amount: newOtrosGastos, obs: newOtrosGastosObs }
        }
      };

      await upsertSnapshot.mutateAsync(snapData);
      setInlineEdit(null);
    } catch (e: any) {
      useModalStore.getState().showAlert('Error', e.message);
    }
  };

  const renderEditableCell = (field: keyof typeof form, type: 'number' | 'text' = 'number', widthClass = 'w-32', isLarge = false) => {
    if (inlineEdit === field) {
      return (
        <input
          autoFocus
          type={type}
          defaultValue={form[field]}
          onBlur={(e) => handleInlineSave(field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') setInlineEdit(null);
          }}
          className={`${widthClass} px-2 py-1 ${isLarge ? 'border-2 border-ecar-blue focus:ring-2 focus:ring-ecar-blue/30 rounded font-mono text-right text-lg' : 'border border-gray-300 rounded font-mono text-right text-sm'} focus:outline-none focus:border-ecar-blue`}
        />
      );
    }
    return (
      <div 
        onClick={() => setInlineEdit(field)}
        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors inline-block min-w-[3rem]"
      >
        {type === 'number' ? <span className={`font-mono ${isLarge ? 'text-lg' : ''}`}>{fmt(form[field] as number)}</span> : (form[field] || <span className="text-gray-400 italic text-xs">Ajustes manuales</span>)}
      </div>
    );
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
                {renderEditableCell('apoyoFinanciero')}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-2 font-medium text-gray-700">
                <div className="flex flex-col">
                  <span>OTROS INGRESOS (Ajustes manuales)</span>
                  <div className="mt-1">{renderEditableCell('otrosIngresosObs', 'text', 'w-full')}</div>
                </div>
              </td>
              <td className="px-6 py-2 text-right">
                {renderEditableCell('otrosIngresosAmount')}
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
                  <div className="mt-1">{renderEditableCell('otrosGastosObs', 'text', 'w-full')}</div>
                </div>
              </td>
              <td className="px-6 py-2 text-right">
                {renderEditableCell('otrosGastosAmount')}
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
                {renderEditableCell('cajaFinalReal', 'number', 'w-36', true)}
              </td>
            </tr>

            {/* DIFERENCIA */}
            <tr className="bg-sky-500 text-white">
              <td className="px-6 py-4 font-bold uppercase">DIFERENCIA</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-lg">
                {displayCajaReal === 0 && !inlineEdit && cajaEsperada !== 0 ? '-' : fmt(diferencia)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  );
};
