import React from 'react';
import { AlertTriangle, CheckCircle2, Gauge } from 'lucide-react';
import {
  formatHourmeter,
  isSuspiciousHourmeter,
  normalizeHourmeterInput,
  parseHourmeter,
  reliableLastHours,
  toVisorDigits,
} from '../lib/hourmeter';

interface HourmeterInputProps {
  /** Valor normalizado con punto decimal (ej. "1234.5"). */
  value: string;
  onChange: (normalized: string) => void;
  /** Último horómetro registrado del vehículo (current_hours). */
  lastHours?: number | null;
  /** 'lg' para el check-in QR móvil, 'md' para formularios web. */
  size?: 'md' | 'lg';
  id?: string;
}

/**
 * Campo de Horómetro con máscara `0000,0`.
 *
 * Capa 1 – Máscara: máx. 4 enteros + 1 decimal; coma automática al 5º dígito.
 * Capa 2 – Confirmación: visor tipo LCD + frase explícita de lo que se registra
 *          y comparación con el último registro.
 */
export const HourmeterInput: React.FC<HourmeterInputProps> = ({
  value,
  onChange,
  lastHours,
  size = 'md',
  id = 'hourmeter-input',
}) => {
  const parsed = parseHourmeter(value);
  const minHours = reliableLastHours(lastHours);
  const legacySuspicious = isSuspiciousHourmeter(lastHours);
  const belowMin = parsed !== null && minHours !== null && parsed < minHours;
  const visor = toVisorDigits(value);
  const hasValue = parsed !== null;
  const lg = size === 'lg';

  return (
    <div className="space-y-2">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        maxLength={6}
        value={value.replace('.', ',')}
        onChange={e => onChange(normalizeHourmeterInput(e.target.value))}
        placeholder={minHours !== null ? `Mínimo: ${formatHourmeter(minHours)}` : '0000,0'}
        className={`w-full border rounded-xl font-mono tracking-widest ${lg ? 'px-4 py-3 text-lg' : 'px-3 py-2.5 text-sm'} ${
          belowMin
            ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300 focus:border-red-400'
            : 'border-gray-300 focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue'
        }`}
      />

      <p className="text-[11px] text-gray-500 leading-snug">
        Copiá <b>todos</b> los números del visor, incluido el último (decimal). La coma se agrega sola.
      </p>

      {/* Capa 2: visor espejo del horómetro físico */}
      <div
        className={`rounded-lg border shadow-sm p-3 transition-colors ${
          belowMin ? 'border-red-200 bg-red-50' : hasValue ? 'border-blue-200 bg-blue-50/60' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-0.5 bg-gray-900 rounded-md px-2.5 py-1.5 shadow-inner" aria-hidden>
            {visor.int.split('').map((d, i) => (
              <span key={i} className={`font-mono font-bold ${lg ? 'text-xl' : 'text-base'} ${hasValue ? 'text-emerald-300' : 'text-gray-600'}`}>
                {d}
              </span>
            ))}
            <span className={`font-mono font-bold ${lg ? 'text-xl' : 'text-base'} text-gray-400`}>,</span>
            <span className={`font-mono font-bold ${lg ? 'text-xl' : 'text-base'} px-1 rounded-sm ${hasValue ? 'bg-emerald-300 text-gray-900' : 'bg-gray-700 text-gray-500'}`}>
              {visor.dec}
            </span>
          </div>
          <div className="min-w-0">
            {hasValue ? (
              <p className={`${lg ? 'text-sm' : 'text-xs'} text-gray-800 leading-tight`}>
                Vas a registrar <b className="text-ecar-blue">{formatHourmeter(parsed!)} horas</b> de motor
              </p>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Gauge size={12} /> Debe coincidir con el visor de la máquina
              </p>
            )}
            {minHours !== null && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                Último registro: {formatHourmeter(minHours)} hs
                {hasValue && !belowMin && (
                  <span className="text-green-700 font-semibold"> · +{formatHourmeter(parsed! - minHours)} hs</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {belowMin && (
        <div className="flex items-center gap-1.5 px-1">
          <AlertTriangle size={12} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">
            No puede ser menor a {formatHourmeter(minHours!)} hs (último registro)
          </p>
        </div>
      )}
      {hasValue && !belowMin && minHours !== null && (
        <p className="text-[11px] text-green-600 px-1 flex items-center gap-1">
          <CheckCircle2 size={11} /> Lectura coherente con el último registro
        </p>
      )}
      {legacySuspicious && (
        <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800">
            El último registro ({lastHours!.toLocaleString('es-AR')} hs) parece mal cargado y no se usa como mínimo.
          </p>
        </div>
      )}
    </div>
  );
};

export default HourmeterInput;
