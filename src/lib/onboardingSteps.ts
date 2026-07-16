import type { Step } from 'react-joyride';

export const ONBOARDING_STEPS: Record<string, Step[]> = {

  // ─── BI DASHBOARD ───
  bi: [
    {
      target: 'body',
      placement: 'center',
      content: '👋 ¡Bienvenido al Dashboard Ejecutivo! Aquí encontrarás los KPIs organizados por Gerencia en tiempo real. Te mostramos rápidamente cómo manejarlo.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="bi-kpis"]',
      content: '📊 Aquí están los indicadores clave de cada Gerencia: Proyectos, Compras, Obras, Logística y Finanzas. Las tarjetas con borde rojo requieren atención urgente.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="bi-alerts"]',
      content: '🔔 Esta sección agrupa las alertas de riesgo activas. Revisalas diariamente para tomar acciones a tiempo.',
      placement: 'top',
    },
  ],

  // ─── COMPRAS ───
  purchases: [
    {
      target: 'body',
      placement: 'center',
      content: '🧾 Bienvenido al módulo de Compras. Aquí registrás y controlás todas las facturas de proveedores. ¡Te guiamos por los pasos principales!',
      skipBeacon: true,
    },
    {
      target: '[data-tour="purchases-nueva"]',
      content: '➕ Hacé clic aquí para registrar una nueva factura. Completá proveedor, CUIT, monto neto, IVA y fecha.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="purchases-razones-sociales"]',
      content: '🏢 Antes de cargar facturas, asegurate de tener al menos una Razón Social registrada (ej: ECAR SAS) desde la pestaña "Razones Sociales".',
      placement: 'bottom',
    },
    {
      target: '[data-tour="purchases-tabla"]',
      content: '📋 Acá verás el listado de todas las facturas cargadas. Podés filtrar por proveedor, estado (pendiente/pagada) o fecha. Las rechazadas aparecen tachadas.',
      placement: 'top',
    },
    {
      target: '[data-tour="purchases-posicion-iva"]',
      content: '💰 Este resumen muestra tu Posición IVA actual: la diferencia entre el IVA de Ventas y el de Compras. Si el saldo es positivo, debés pagar; si es negativo, tenés saldo a favor.',
      placement: 'left',
    },
  ],

  // ─── RRHH ───
  rrhh: [
    {
      target: 'body',
      placement: 'center',
      content: '👷 Bienvenido a Recursos Humanos. Aquí administrás el personal, sus legajos, asistencia y sueldos.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="rrhh-search"]',
      content: '🔎 Buscá cualquier empleado por nombre o legajo desde este campo.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="rrhh-nuevo-empleado"]',
      content: '➕ Registrá un nuevo empleado completando sus datos personales, CUIL, categoría y proyecto al que pertenece.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="rrhh-pagar"]',
      content: '💸 Usá el botón "Pagar a Obreros" para registrar pagos de sueldo. Podés buscar el obrero por nombre y registrar el importe con observaciones.',
      placement: 'left',
    },
  ],

  // ─── FINANZAS ───
  finances: [
    {
      target: 'body',
      placement: 'center',
      content: '🏦 Bienvenido a Finanzas. Controlá cheques emitidos, recibidos y todos los movimientos financieros desde acá.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="finances-cheques"]',
      content: '📝 Registrá cheques con "Nuevo Cheque". Indicá beneficiario, banco, fecha de vencimiento y monto.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="finances-vencimientos"]',
      content: '⚠️ Los cheques próximos a vencer (menos de 7 días) aparecen resaltados. Revisalos diariamente.',
      placement: 'top',
    },
  ],

  // ─── PAGOS SEMANALES ───
  payments: [
    {
      target: 'body',
      placement: 'center',
      content: '📋 Bienvenido a Control de Pagos Semanales. Acá armás la planilla de pagos con alias/CBU y la exportás a PDF.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="payments-nueva-planilla"]',
      content: '➕ Creá una nueva planilla indicando la semana y el responsable de los pagos.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="payments-items"]',
      content: '📦 Cada fila de la planilla representa un pago. Completá alias/CBU, titular, concepto y monto.',
      placement: 'top',
    },
    {
      target: '[data-tour="payments-pdf"]',
      content: '📄 Una vez completa, exportá la planilla a PDF con el formato formal listo para imprimir o enviar.',
      placement: 'left',
    },
  ],

  // ─── INVENTARIO ───
  inventory: [
    {
      target: 'body',
      placement: 'center',
      content: '📦 Bienvenido a Inventario. Controlá el stock de materiales y herramientas por depósito y estantería.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="inventory-nuevo"]',
      content: '➕ Cargá nuevos ítems con nombre, unidad de medida, categoría y stock mínimo.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="inventory-alertas"]',
      content: '🔴 Los ítems con stock por debajo del mínimo configurado se resaltan automáticamente aquí.',
      placement: 'top',
    },
  ],

  // ─── FLOTA ───
  fleet: [
    {
      target: 'body',
      placement: 'center',
      content: '🚗 Bienvenido a Flota y Maquinaria. Registrá vehículos, programá mantenimientos y controlá documentación.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="fleet-nuevo"]',
      content: '➕ Agregá un nuevo vehículo completando patente, modelo, km actuales y fecha del próximo service.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="fleet-alertas"]',
      content: '🔔 Los vehículos con seguro o VTV vencido, o con service pendiente, aparecen con alerta roja en esta sección.',
      placement: 'top',
    },
  ],

  // ─── LIQUIDEZ ───
  liquidity: [
    {
      target: 'body',
      placement: 'center',
      content: '💵 Bienvenido a Liquidez. Visualizá el flujo de caja, saldos bancarios y proyecciones diarias.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="liquidity-saldo"]',
      content: '💰 Acá ves el saldo disponible actual consolidado de todas las cuentas.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="liquidity-proyeccion"]',
      content: '📈 El gráfico muestra la proyección de liquidez para los próximos días según los cheques a cobrar y pagar.',
      placement: 'top',
    },
  ],

  // ─── PEDIDOS DE COMPRA ───
  purchase_requests: [
    {
      target: 'body',
      placement: 'center',
      content: '🛒 Bienvenido a Pedidos de Compra. Solicitá materiales y herramientas para obra desde acá.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="pr-nuevo"]',
      content: '➕ Hacé clic en "Nuevo Pedido" para solicitar un material o herramienta. Solo podés pedir ítems que ya estén registrados en Inventario.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="pr-estado"]',
      content: '📋 El pedido queda en estado "Pendiente" hasta que el área de Compras lo apruebe y convierta en una Orden de Compra.',
      placement: 'top',
    },
  ],

  // ─── OPORTUNIDADES ───
  opportunities: [
    {
      target: 'body',
      placement: 'center',
      content: '🎯 Bienvenido al Pipeline Comercial. Registrá, seguí y gestioná oportunidades de negocio de principio a fin.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="opp-nueva"]',
      content: '➕ Creá una nueva oportunidad con cliente, descripción y monto estimado.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="opp-kanban"]',
      content: '📌 La vista Kanban muestra las oportunidades organizadas por etapa: desde el primer contacto hasta la adjudicación.',
      placement: 'top',
    },
  ],

  // ─── GASTOS ───
  expenses: [
    {
      target: 'body',
      placement: 'center',
      content: '🧾 Bienvenido a Gastos Operativos. Registrá los gastos diarios de obra y oficina con foto del comprobante.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="expenses-nuevo"]',
      content: '➕ Registrá un nuevo gasto indicando fecha, categoría, monto y adjuntando el ticket o factura.',
      placement: 'bottom',
    },
  ],

  // ─── SEGURIDAD ───
  safety: [
    {
      target: 'body',
      placement: 'center',
      content: '⛑️ Bienvenido a Seguridad e Incidentes. Reportá incidentes, accidentes y observaciones preventivas en obra.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="safety-nuevo"]',
      content: '➕ Reportá un nuevo incidente clasificándolo por gravedad: leve, moderado o grave.',
      placement: 'bottom',
    },
  ],

  // ─── NO CONFORMIDADES ───
  nonconformities: [
    {
      target: 'body',
      placement: 'center',
      content: '⚠️ Bienvenido a No Conformidades. Registrá desvíos, acciones correctivas y lecciones aprendidas.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="nc-nueva"]',
      content: '➕ Registrá una NC con categoría, descripción del desvío y responsable de corrección.',
      placement: 'bottom',
    },
  ],

  // ─── PARTE DIARIO ───
  field: [
    {
      target: 'body',
      placement: 'center',
      content: '📋 Bienvenido al Parte Diario. Registrá asistencia, equipos utilizados, clima y novedades del día.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="field-nuevo"]',
      content: '➕ Creá el parte del día. Podés registrar quiénes trabajaron, qué equipos usaron y qué novedades hubo.',
      placement: 'bottom',
    },
  ],

  // ─── EVALUACIÓN PROVEEDORES ───
  supplier_eval: [
    {
      target: 'body',
      placement: 'center',
      content: '⭐ Bienvenido a Evaluación de Proveedores. Calificá periódicamente a tus proveedores para mantener un registro de desempeño.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="supeval-nueva"]',
      content: '➕ Seleccioná el proveedor y período a evaluar, luego calificá cada criterio del 1 al 5.',
      placement: 'bottom',
    },
  ],

  // ─── DOCUMENTOS ───
  documents: [
    {
      target: 'body',
      placement: 'center',
      content: '📁 Bienvenido a Documentos y Correo. Gestioná toda la documentación formal: cartas, notas, comunicaciones y archivo digital.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="docs-nuevo"]',
      content: '➕ Subí documentos digitalizados clasificándolos por tipo: carta documento, nota, circular, etc.',
      placement: 'bottom',
    },
  ],

  // ─── COMBUSTIBLE ───
  fuel: [
    {
      target: 'body',
      placement: 'center',
      content: '⛽ Bienvenido a Combustible. Registrá cada carga de nafta o diesel por vehículo para control de consumo y costos.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="fuel-nuevo"]',
      content: '➕ Registrá una nueva carga indicando vehículo, litros, monto y km del odómetro para calcular rendimiento.',
      placement: 'bottom',
    },
  ],

  // ─── OBLIGACIONES ───
  obligations: [
    {
      target: 'body',
      placement: 'center',
      content: '🗓️ Bienvenido a Alertas y Obligaciones. Llevá el control de vencimientos fiscales, laborales y contractuales.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="obl-nueva"]',
      content: '➕ Creá un nuevo recordatorio indicando tipo, descripción y fecha de vencimiento.',
      placement: 'bottom',
    },
  ],

  // ─── FALLBACK GLOBAL ───
  _fallback: [
    {
      target: 'body',
      placement: 'center',
      content: '👋 ¡Bienvenido a este módulo! Explorá las opciones disponibles. Si necesitás ayuda, hacé clic en el ícono de tutorial (🎓) en la barra superior en cualquier momento.',
      skipBeacon: true,
    },
  ],
};
