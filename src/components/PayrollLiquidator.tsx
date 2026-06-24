import React, { useState, useMemo } from 'react';
import { X, Save, Users } from 'lucide-react';
import { useEmployees, useCreateWeeklyPaymentItem, useCreateWeeklyPayrollDetail } from '../hooks/useData';
import { supabase } from '../lib/supabase';

// Type definitions for internal state
type ObreroPayroll = {
  employee_id: string;
  name: string;
  category: string;
  cbu: string;
  hourly_rate: number;
  worked_hours: number;
  overtime_hours: number;
  base_amount: number;
  extra_amount: number;
  discount_amount: number;
  final_amount: number;
};

export const PayrollLiquidator: React.FC<{
  paymentId: string;
  paymentDate: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ paymentId, paymentDate, onClose, onSuccess }) => {
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees();
  const createPaymentItem = useCreateWeeklyPaymentItem();
  const createPayrollDetail = useCreateWeeklyPayrollDetail();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(paymentDate + 'T12:00:00');
    d.setDate(d.getDate() - 6); // default to 7 days before
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(paymentDate);
  
  const [isLoadingAtt, setIsLoadingAtt] = useState(false);
  const [obreros, setObreros] = useState<ObreroPayroll[]>([]);
  const [step, setStep] = useState(1); // 1: Config, 2: Edit

  const activeObreros = useMemo(() => {
    return employees.filter(e => e.employment_status === 'active' && (e.category_id || e.union_name?.toUpperCase() === 'UOCRA'));
  }, [employees]);

  const fetchAttendanceAndCalculate = async () => {
    setIsLoadingAtt(true);
    try {
      const { data: attendance, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .eq('status', 'present');
      
      if (error) throw error;

      const results: ObreroPayroll[] = activeObreros.map(emp => {
        const empAtt = attendance?.filter(a => a.employee_id === emp.id) || [];
        // calculate hours down to minute
        let totalWorkedMinutes = 0;
        let totalOvertimeHours = 0; // manual overtime
        
        empAtt.forEach(a => {
          totalWorkedMinutes += Math.round(Number(a.worked_hours) * 60);
          totalOvertimeHours += Number(a.overtime_hours) || 0;
        });

        const workedHours = +(totalWorkedMinutes / 60).toFixed(2);
        
        // Use retribucion_pactada if exists, else category daily rate / 8
        const hourly_rate = emp.retribucion_pactada ? Number(emp.retribucion_pactada) : (emp.category ? Number(emp.category.daily_rate_ars) / 8 : 0);
        
        const base_amount = +(workedHours * hourly_rate).toFixed(2);
        
        return {
          employee_id: emp.id,
          name: emp.full_name,
          category: emp.category?.name || 'Obrero',
          cbu: emp.bank_alias_cbu || '',
          hourly_rate,
          worked_hours: workedHours,
          overtime_hours: totalOvertimeHours,
          base_amount,
          extra_amount: 0,
          discount_amount: 0,
          final_amount: base_amount
        };
      });

      setObreros(results);
      setStep(2);
    } catch (e) {
      console.error(e);
      alert("Error al cargar asistencia.");
    } finally {
      setIsLoadingAtt(false);
    }
  };

  const updateObrero = (index: number, field: keyof ObreroPayroll, value: string | number) => {
    const newObreros = [...obreros];
    const ob = { ...newObreros[index] };
    
    if (typeof ob[field] === 'number') {
      (ob as any)[field] = Number(value);
    } else {
      (ob as any)[field] = value;
    }

    // Recalculate if hours or amounts change
    if (['worked_hours', 'hourly_rate', 'extra_amount', 'discount_amount'].includes(field)) {
      ob.base_amount = +(ob.worked_hours * ob.hourly_rate).toFixed(2);
      ob.final_amount = +(ob.base_amount + ob.extra_amount - ob.discount_amount).toFixed(2);
    }

    newObreros[index] = ob;
    setObreros(newObreros);
  };

  const handleSave = async () => {
    // Only save obreros with amount > 0
    const toPay = obreros.filter(o => o.final_amount > 0);
    if (toPay.length === 0) {
      alert("No hay montos a liquidar.");
      return;
    }

    const total = toPay.reduce((acc, o) => acc + o.final_amount, 0);

    try {
      // 1. Create Weekly Payment Item for the total
      const newItem = await createPaymentItem.mutateAsync({
        payment_id: paymentId,
        concepto: `SUELDOS OBREROS (${startDate} al ${endDate})`,
        monto: total,
        alias_cbu: '',
        titular_cuenta: '',
        nro_factura: '',
        observaciones: `Liquidación de ${toPay.length} obreros`,
        source_type: 'sueldos_obreros',
        source_id: 'payroll',
        orden: 0
      });

      // 2. Create Payroll Details
      for (const ob of toPay) {
        await createPayrollDetail.mutateAsync({
          weekly_payment_id: paymentId,
          weekly_payment_item_id: newItem.id,
          employee_id: ob.employee_id,
          week_start: startDate,
          week_end: endDate,
          worked_hours: ob.worked_hours,
          overtime_hours: ob.overtime_hours,
          hourly_rate: ob.hourly_rate,
          base_amount: ob.base_amount,
          extra_amount: ob.extra_amount,
          discount_amount: ob.discount_amount,
          final_amount: ob.final_amount
        });
      }

      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Hubo un error al guardar la liquidación.");
    }
  };

  const formatARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="font-bold text-lg flex items-center gap-2"><Users size={20} className="text-indigo-600"/> Liquidación de Obreros</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Seleccioná el período a liquidar. El sistema cruzará automáticamente la asistencia de estos días con el valor por hora pactado en el legajo de cada obrero.
            </p>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Desde Fecha</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Hasta Fecha</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <button 
              onClick={fetchAttendanceAndCalculate} 
              disabled={isLoadingAtt || isLoadingEmployees}
              className="w-full bg-indigo-600 text-white font-bold rounded-xl py-3 mt-4 disabled:opacity-50"
            >
              {isLoadingAtt ? 'Calculando...' : 'Calcular Devengado'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-indigo-600" /> Detalle de Nómina y Pagos
          </h2>
          <p className="text-sm text-gray-500">Período: {new Date(startDate + 'T12:00:00').toLocaleDateString()} al {new Date(endDate + 'T12:00:00').toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Volver a Calcular</button>
          <button onClick={handleSave} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
            <Save size={16} /> Aprobar y Crear Pago
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 min-w-[200px]">Obrero / CBU</th>
                <th className="px-4 py-3 min-w-[100px] text-center">Horas</th>
                <th className="px-4 py-3 min-w-[120px] text-right">Valor Hora</th>
                <th className="px-4 py-3 min-w-[120px] text-right">Premios</th>
                <th className="px-4 py-3 min-w-[120px] text-right">Descuentos</th>
                <th className="px-4 py-3 min-w-[140px] text-right">Total Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {obreros.map((ob, i) => (
                <tr key={ob.employee_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-sm text-gray-800">{ob.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{ob.cbu || 'Sin CBU'}</p>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input 
                      type="number" 
                      step="0.1"
                      value={ob.worked_hours} 
                      onChange={e => updateObrero(i, 'worked_hours', e.target.value)}
                      className="w-full text-center border rounded px-2 py-1 text-sm font-mono font-bold text-indigo-700 bg-indigo-50"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input 
                      type="number" 
                      value={ob.hourly_rate} 
                      onChange={e => updateObrero(i, 'hourly_rate', e.target.value)}
                      className="w-full text-right border rounded px-2 py-1 text-sm font-mono"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input 
                      type="number" 
                      value={ob.extra_amount} 
                      onChange={e => updateObrero(i, 'extra_amount', e.target.value)}
                      className="w-full text-right border rounded px-2 py-1 text-sm font-mono text-green-700 bg-green-50"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input 
                      type="number" 
                      value={ob.discount_amount} 
                      onChange={e => updateObrero(i, 'discount_amount', e.target.value)}
                      className="w-full text-right border rounded px-2 py-1 text-sm font-mono text-red-700 bg-red-50"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-base text-gray-900">{formatARS(ob.final_amount)}</span>
                  </td>
                </tr>
              ))}
              {obreros.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No se encontraron obreros activos para liquidar.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right text-gray-600">TOTAL NÓMINA A PAGAR</td>
                <td className="px-4 py-3 text-right text-lg text-indigo-700">
                  {formatARS(obreros.reduce((a,b) => a + b.final_amount, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
