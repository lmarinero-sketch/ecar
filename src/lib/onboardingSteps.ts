import type { Step } from 'react-joyride';

export const ONBOARDING_STEPS: Record<string, Step[]> = {
  // Ejemplos básicos para empezar, luego se pueden expandir para todos los módulos
  liquidity: [
    {
      target: 'body',
      placement: 'center',
      content: '¡Bienvenido al módulo de Liquidez! Aquí podrás ver el estado financiero general, ingresos, egresos y proyecciones de fondos.',
      skipBeacon: true,
    },
    {
      target: '.liquidity-kpi-cards',
      content: 'En esta sección encontrarás los indicadores clave de rendimiento (KPIs) resumidos.',
    },
    {
      target: '.liquidity-charts',
      content: 'Gráficos interactivos para analizar la evolución de tus finanzas en el tiempo.',
    }
  ],
  rrhh: [
    {
      target: 'body',
      placement: 'center',
      content: 'Bienvenido a Recursos Humanos. Administra tu personal, sueldos y asistencia.',
      skipBeacon: true,
    }
  ],
  // Agregar un fallback global para módulos sin pasos definidos todavía
  _fallback: [
    {
      target: 'body',
      placement: 'center',
      content: 'Bienvenido a este módulo. Pronto agregaremos una guía detallada para esta sección.',
      skipBeacon: true,
    }
  ]
};
