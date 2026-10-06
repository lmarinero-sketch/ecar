/**
 * Utilidades para la carga de Horómetro (maquinaria con tracking_type = 'hours').
 *
 * Contexto: el visor físico de las máquinas muestra el formato `0000,0`
 * (4 dígitos enteros + 1 decimal). Los operarios suelen copiar los dígitos
 * ignorando la coma, lo que multiplicaba la lectura x10 (ej. 1234,5 → 12345).
 *
 * Regla de negocio: ninguna máquina supera las 9.999,9 hs en su vida útil,
 * por lo que se limita la parte entera a 4 dígitos y, si el operario tipea
 * 5 dígitos seguidos, el 5º se interpreta automáticamente como decimal.
 *
 * El valor normalizado se guarda siempre con punto decimal ("1234.5") para
 * que `parseFloat` siga funcionando en el resto del código.
 */

export const HOURMETER_MAX_INT_DIGITS = 4;
export const HOURMETER_MAX = 9999.9;

/**
 * Normaliza lo que el usuario tipea en el campo de horómetro.
 * - Acepta coma o punto como separador decimal.
 * - Máximo 4 dígitos enteros y 1 decimal.
 * - Si se tipean 5 dígitos sin separador, inserta la coma antes del último
 *   (igual que el visor `0000,0`).
 *
 * @example normalizeHourmeterInput('12345')  // '1234.5'
 * @example normalizeHourmeterInput('1234,5') // '1234.5'
 * @example normalizeHourmeterInput('01234')  // '0123.4'
 * @example normalizeHourmeterInput('1234,')  // '1234.'  (mientras tipea)
 */
export function normalizeHourmeterInput(raw: string): string {
  const cleaned = raw.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const sepIdx = cleaned.indexOf('.');

  if (sepIdx >= 0) {
    const intPart = cleaned.slice(0, sepIdx).slice(0, HOURMETER_MAX_INT_DIGITS);
    const decPart = cleaned.slice(sepIdx + 1).replace(/\./g, '').slice(0, 1);
    return `${intPart}.${decPart}`;
  }

  const digits = cleaned.slice(0, HOURMETER_MAX_INT_DIGITS + 1);
  if (digits.length <= HOURMETER_MAX_INT_DIGITS) return digits;
  return `${digits.slice(0, HOURMETER_MAX_INT_DIGITS)}.${digits.slice(HOURMETER_MAX_INT_DIGITS)}`;
}

/** Convierte el valor normalizado a número (null si vacío o inválido). */
export function parseHourmeter(value: string): number | null {
  if (!value || value === '.') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** Formato es-AR con 1 decimal fijo: 1234.5 → "1.234,5". */
export function formatHourmeter(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Lecturas históricas >= 10.000 hs son físicamente imposibles para la flota
 * y casi seguro provienen del error de la coma. No deben usarse como mínimo
 * de validación (bloquearían la carga correcta).
 */
export function isSuspiciousHourmeter(n?: number | null): boolean {
  return n != null && n > HOURMETER_MAX;
}

/** Último registro confiable para validar "no puede ser menor a". */
export function reliableLastHours(n?: number | null): number | null {
  return n != null && !isSuspiciousHourmeter(n) ? n : null;
}

/** Dígitos para el visor tipo LCD: "123.4" → { int: '0123', dec: '4' }. */
export function toVisorDigits(value: string): { int: string; dec: string } {
  const [i = '', d = ''] = value.split('.');
  return {
    int: i.padStart(HOURMETER_MAX_INT_DIGITS, '0').slice(-HOURMETER_MAX_INT_DIGITS),
    dec: (d || '0').slice(0, 1),
  };
}
