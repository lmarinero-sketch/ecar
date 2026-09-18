import type { FuelVehicle } from './types';

export type MaintenanceAlertLevel = 'overdue' | 'soon' | 'ok' | 'none';

export interface MaintenanceCheckResult {
  level: MaintenanceAlertLevel;
  primaryReason: 'km' | 'hours' | 'date' | null;
  overdueReasons: ('km' | 'hours' | 'date')[];
  soonReasons: ('km' | 'hours' | 'date')[];
  kmDiff: number | null; // Positivo = excedido, Negativo = lo que resta para el service
  hoursDiff: number | null; // Positivo = excedido, Negativo = lo que resta para el service
  daysDiff: number | null; // Positivo = vencido hace X días, Negativo = faltan X días
  currentValue: number | null;
  targetValue: number | null;
  unit: string;
  summary: string;
  detail: string;
  badgeLabel: string;
  badgeClass: string;
  isOverdue: boolean;
  isSoon: boolean;
}

export const KM_PREVENTIVE_THRESHOLD = 500; // Alerta amarilla si faltan <= 500 km
export const HOURS_PREVENTIVE_THRESHOLD = 50; // Alerta amarilla si faltan <= 50 hs
export const DAYS_PREVENTIVE_THRESHOLD = 7; // Alerta amarilla si faltan <= 7 días

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Evalúa el estado de mantenimiento de un vehículo considerando
 * Odómetro (Km), Horómetro (Hs) y Fecha estimada.
 * 
 * Permite pasar `readingOverride` para chequear en tiempo real mientras el operario
 * tipea el odómetro/horómetro en el reporte vía QR.
 */
export function checkVehicleMaintenance(
  vehicle: FuelVehicle,
  readingOverride?: number | null
): MaintenanceCheckResult {
  const isHours = vehicle.tracking_type === 'hours';
  const unit = isHours ? 'hs' : 'km';

  // Determinar valores actuales y objetivos
  const currentKm = (!isHours && readingOverride !== undefined && readingOverride !== null)
    ? readingOverride
    : (vehicle.current_km ?? null);

  const currentHours = (isHours && readingOverride !== undefined && readingOverride !== null)
    ? readingOverride
    : (vehicle.current_hours ?? null);

  const targetKm = vehicle.next_maintenance_km ?? null;
  const targetHours = vehicle.next_maintenance_hours ?? null;
  const targetDate = vehicle.next_maintenance_date ?? null;

  let kmDiff: number | null = null;
  let hoursDiff: number | null = null;
  let daysDiff: number | null = null;

  const overdueReasons: ('km' | 'hours' | 'date')[] = [];
  const soonReasons: ('km' | 'hours' | 'date')[] = [];

  // 1. Evaluación por Kilómetros (si aplica)
  if (targetKm !== null && currentKm !== null) {
    kmDiff = currentKm - targetKm;
    if (kmDiff >= 0) {
      overdueReasons.push('km');
    } else if (Math.abs(kmDiff) <= KM_PREVENTIVE_THRESHOLD) {
      soonReasons.push('km');
    }
  }

  // 2. Evaluación por Horas / Horómetro (si aplica)
  if (targetHours !== null && currentHours !== null) {
    hoursDiff = currentHours - targetHours;
    if (hoursDiff >= 0) {
      overdueReasons.push('hours');
    } else if (Math.abs(hoursDiff) <= HOURS_PREVENTIVE_THRESHOLD) {
      soonReasons.push('hours');
    }
  }

  // 3. Evaluación por Fecha
  if (targetDate) {
    const today = new Date(todayStr());
    const target = new Date(targetDate);
    const diffMs = today.getTime() - target.getTime();
    daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24)); // > 0 es vencido, < 0 es futuro

    if (daysDiff >= 0) {
      overdueReasons.push('date');
    } else if (Math.abs(daysDiff) <= DAYS_PREVENTIVE_THRESHOLD) {
      soonReasons.push('date');
    }
  }

  // Determinar Nivel Global y Causa Principal
  const isOverdue = overdueReasons.length > 0;
  const isSoon = !isOverdue && soonReasons.length > 0;
  const hasTargets = targetKm !== null || targetHours !== null || targetDate !== null;

  let level: MaintenanceAlertLevel = 'none';
  let primaryReason: 'km' | 'hours' | 'date' | null = null;

  if (isOverdue) {
    level = 'overdue';
    // Prioridad de razón: Horas/Km según tracking_type antes que fecha
    if (isHours && overdueReasons.includes('hours')) primaryReason = 'hours';
    else if (!isHours && overdueReasons.includes('km')) primaryReason = 'km';
    else primaryReason = overdueReasons[0];
  } else if (isSoon) {
    level = 'soon';
    if (isHours && soonReasons.includes('hours')) primaryReason = 'hours';
    else if (!isHours && soonReasons.includes('km')) primaryReason = 'km';
    else primaryReason = soonReasons[0];
  } else if (hasTargets) {
    level = 'ok';
  }

  const currentValue = isHours ? currentHours : currentKm;
  const targetValue = isHours ? targetHours : targetKm;

  // Formatear Mensajes y Badges
  let summary = 'Mantenimiento programado al día';
  let detail = '';
  let badgeLabel = 'Al día';
  let badgeClass = 'bg-green-100 text-green-700 border-green-200';

  if (level === 'overdue') {
    badgeLabel = 'Service Vencido';
    badgeClass = 'bg-red-100 text-red-700 border-red-200';

    if (primaryReason === 'hours' && hoursDiff !== null && targetHours !== null) {
      const excess = hoursDiff.toFixed(1);
      summary = `Service vencido por horómetro (+${excess} hs)`;
      detail = `Actual: ${currentHours?.toFixed(1)} hs | Próximo: ${targetHours.toFixed(1)} hs (Exceso: +${excess} hs)`;
    } else if (primaryReason === 'km' && kmDiff !== null && targetKm !== null) {
      const excess = kmDiff.toLocaleString();
      summary = `Service vencido por kilometraje (+${excess} km)`;
      detail = `Actual: ${currentKm?.toLocaleString()} km | Próximo: ${targetKm.toLocaleString()} km (Exceso: +${excess} km)`;
    } else if (primaryReason === 'date' && daysDiff !== null) {
      summary = `Service vencido por fecha (${targetDate})`;
      detail = `Fecha límite: ${targetDate} (Vencido hace ${daysDiff === 0 ? 'hoy' : `${daysDiff} días`})`;
    }
  } else if (level === 'soon') {
    badgeLabel = 'Service Próximo';
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

    if (primaryReason === 'hours' && hoursDiff !== null && targetHours !== null) {
      const remaining = Math.abs(hoursDiff).toFixed(1);
      summary = `Mantenimiento próximo (restan ${remaining} hs)`;
      detail = `Actual: ${currentHours?.toFixed(1)} hs | Service a las: ${targetHours.toFixed(1)} hs`;
    } else if (primaryReason === 'km' && kmDiff !== null && targetKm !== null) {
      const remaining = Math.abs(kmDiff).toLocaleString();
      summary = `Mantenimiento próximo (restan ${remaining} km)`;
      detail = `Actual: ${currentKm?.toLocaleString()} km | Service a los: ${targetKm.toLocaleString()} km`;
    } else if (primaryReason === 'date' && daysDiff !== null) {
      const remainingDays = Math.abs(daysDiff);
      summary = `Mantenimiento próximo en ${remainingDays} días`;
      detail = `Programado para el ${targetDate}`;
    }
  } else if (level === 'ok') {
    badgeLabel = 'Al día';
    badgeClass = 'bg-green-100 text-green-700 border-green-200';
    if (targetValue !== null && currentValue !== null) {
      const remaining = isHours
        ? `${(targetValue - currentValue).toFixed(1)} hs`
        : `${(targetValue - currentValue).toLocaleString()} km`;
      detail = `Próximo service a los ${targetValue.toLocaleString()} ${unit} (restan ${remaining})`;
    } else if (targetDate) {
      detail = `Próximo service programado: ${targetDate}`;
    }
  } else {
    badgeLabel = 'Sin programar';
    badgeClass = 'bg-gray-100 text-gray-500 border-gray-200';
    summary = 'Sin service programado';
    detail = 'Definir km, horas o fecha límite para activar alertas.';
  }

  return {
    level,
    primaryReason,
    overdueReasons,
    soonReasons,
    kmDiff,
    hoursDiff,
    daysDiff,
    currentValue,
    targetValue,
    unit,
    summary,
    detail,
    badgeLabel,
    badgeClass,
    isOverdue,
    isSoon,
  };
}
