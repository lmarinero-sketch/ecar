import React from 'react';
import { DollarSign, Calculator, TrendingUp } from 'lucide-react';

// Alícuotas estándar UOCRA / Construcción Argentina
const ALICUOTAS = {
  jubilacion: 0.11,       // 11% aporte patronal jubilación
  ley19032: 0.02,         // 2% PAMI
  asignaciones: 0.0789,   // 7.89% asignaciones familiares
  fondo_empleo: 0.0089,   // 0.89% fondo de empleo
  obra_social: 0.06,      // 6% obra social
  art: 0.035,             // ~3.5% ART (varía)
  seguro_vida: 0.003,     // 0.3% seguro vida obligatorio
};

const TOTAL_CARGAS = Object.values(ALICUOTAS).reduce((a, b) => a + b, 0);

interface Props {
  employee: {
    full_name: string;
    retribucion_pactada: number | null;
    category?: { name: string; hourly_rate_ars: number } | null;
  };
}

export const EmployeeCostPanel: React.FC<Props> = ({ employee }) => {
  const bruto = employee.retribucion_pactada || (employee.category?.hourly_rate_ars || 0) * 8 * 22;
  const cargasSociales = bruto * TOTAL_CARGAS;
  const costoTotal = bruto + cargasSociales;

  const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calculator size={16} className="text-emerald-600" /> Costo Salarial & F.931
      </h4>
      
      {bruto === 0 ? (
        <p className="text-sm text-gray-400">Sin retribución cargada. Ingresá un monto en el formulario de empleado.</p>
      ) : (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xs font-bold text-emerald-600 mb-1">Bruto</p>
              <p className="text-lg font-black font-mono text-emerald-700">{formatARS(bruto)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xs font-bold text-amber-600 mb-1">Cargas Sociales</p>
              <p className="text-lg font-black font-mono text-amber-700">{formatARS(cargasSociales)}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <p className="text-xs font-bold text-indigo-600 mb-1">Costo Total</p>
              <p className="text-lg font-black font-mono text-indigo-700">{formatARS(costoTotal)}</p>
            </div>
          </div>

          {/* Desglose */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <p className="text-xs font-bold text-gray-500 uppercase">Desglose F.931 (Aprox.)</p>
            </div>
            <div className="divide-y divide-gray-100 text-sm">
              {Object.entries(ALICUOTAS).map(([key, rate]) => (
                <div key={key} className="flex justify-between px-4 py-2 hover:bg-gray-50">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">{(rate * 100).toFixed(2)}%</span>
                    <span className="font-mono font-bold text-gray-800 w-28 text-right">{formatARS(bruto * rate)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2 bg-indigo-50 font-bold">
                <span className="text-indigo-700">Total cargas patronales</span>
                <div className="flex items-center gap-3">
                  <span className="text-indigo-400 text-xs">{(TOTAL_CARGAS * 100).toFixed(2)}%</span>
                  <span className="font-mono text-indigo-700 w-28 text-right">{formatARS(cargasSociales)}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            * Valores aproximados con alícuotas estándar construcción. Pueden variar según ART contratada y convenio.
          </p>
        </div>
      )}
    </div>
  );
};
