import type { ModuleId } from './types';

export type TutorialEntry = {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
};

export const TUTORIAL_CONTENT: Record<ModuleId, TutorialEntry> = {
  bi: {
    title: 'Dashboard Principal',
    description: 'Vista general del estado de la empresa. Muestra KPIs financieros, alertas activas, resumen de módulos y actividad reciente en tiempo real.',
    steps: [
      'Revisá los indicadores principales: facturación, cheques, obligaciones pendientes.',
      'Hacé clic en las tarjetas de KPI para ir al módulo correspondiente.',
      'Revisá la sección de alertas para ver vencimientos próximos.',
      'Usá el gráfico de actividad para entender la tendencia del mes.',
    ],
    tips: [
      'Los datos se actualizan automáticamente cada vez que ingresás al Dashboard.',
      'Las tarjetas con borde rojo indican situaciones que requieren atención urgente.',
    ],
  },
  liquidity: {
    title: 'Liquidez',
    description: 'Control de flujo de caja diario. Visualizá saldos bancarios, cheques por cobrar/pagar, y proyecciones de liquidez a corto plazo.',
    steps: [
      'Revisá el saldo disponible actual en la parte superior.',
      'Consultá los cheques próximos a vencer en la tabla.',
      'Analizá el gráfico de proyección para anticipar necesidades de fondos.',
    ],
    tips: [
      'Actualizá los saldos bancarios diariamente para mayor precisión.',
      'Los cheques en rojo están vencidos o por vencer en 48hs.',
    ],
  },
  guide: {
    title: 'Guía de Uso',
    description: 'Manual interactivo del sistema ECAR. Explicaciones detalladas de cada módulo con ejemplos prácticos.',
    steps: [
      'Navegá por las secciones para entender cada módulo.',
      'Seguí los pasos indicados para cada operación.',
      'Consultá la sección de preguntas frecuentes.',
    ],
    tips: [
      'Podés activar el Modo Tutorial para obtener ayuda contextual en cada pantalla.',
    ],
  },
  manual: {
    title: 'Manual ISO',
    description: 'Documentación de procedimientos según normas ISO. Procesos estandarizados para la gestión de calidad de la constructora.',
    steps: [
      'Seleccioná el procedimiento que necesitás consultar.',
      'Leé las instrucciones paso a paso.',
      'Verificá los formularios asociados a cada proceso.',
    ],
    tips: [
      'Este manual se actualiza periódicamente. Asegurate de consultar la versión vigente.',
    ],
  },
  implementation: {
    title: 'Implementación',
    description: 'Panel de seguimiento del progreso de implementación del sistema ECAR. Muestra qué módulos están activos, en progreso o pendientes.',
    steps: [
      'Revisá el porcentaje general de implementación.',
      'Hacé clic en cada módulo para ver su estado detallado.',
      'Marcá los hitos completados a medida que avances.',
    ],
    tips: [
      'Priorizá los módulos de Administración y Logística que son los de uso diario.',
    ],
  },
  purchases: {
    title: 'Compras',
    description: 'Gestión completa de facturas de compra. Registrá proveedores, montos, IVA, y controlá el estado de pago de cada factura.',
    steps: [
      'Hacé clic en "Nueva Factura" para registrar una compra.',
      'Completá los datos del proveedor, CUIT, monto y tipo de IVA.',
      'La factura queda en estado "Pendiente" hasta que se marque como pagada.',
      'Usá los filtros para buscar por proveedor, fecha o estado.',
      'Exportá el listado a Excel desde el botón de descarga.',
    ],
    tips: [
      'El CUIT se valida automáticamente al ingresarlo.',
      'Podés vincular facturas con cheques desde el módulo de Finanzas.',
      'Las facturas vencidas aparecen resaltadas en rojo.',
    ],
  },
  finances: {
    title: 'Finanzas',
    description: 'Control de cheques emitidos y recibidos, pagos a proveedores, y movimientos financieros. Gestión de la cartera de cheques.',
    steps: [
      'Registrá cheques emitidos o recibidos con "Nuevo Cheque".',
      'Indicá fecha de emisión, vencimiento, beneficiario y monto.',
      'Controlá el estado: emitido, depositado, cobrado, rechazado.',
      'Usá la vista semanal para ver vencimientos próximos.',
    ],
    tips: [
      'Los cheques próximos a vencer (7 días) se resaltan en amarillo.',
      'Podés filtrar por banco, beneficiario o rango de fechas.',
    ],
  },
  obligations: {
    title: 'Alertas y Obligaciones',
    description: 'Calendario de vencimientos fiscales, laborales y contractuales. Recordatorios automáticos para no perder ninguna fecha.',
    steps: [
      'Creá una nueva obligación con "Nuevo Recordatorio".',
      'Indicá tipo (fiscal, laboral, contractual), fecha de vencimiento y descripción.',
      'El sistema te avisa cuando se acerca el vencimiento.',
      'Marcá como completada cuando la hayas cumplido.',
    ],
    tips: [
      'Las obligaciones vencidas aparecen en rojo en el Dashboard.',
      'Podés configurar recordatorios recurrentes (mensuales, anuales).',
    ],
  },
  invoicing: {
    title: 'ARCA (Facturación)',
    description: 'Módulo de facturación electrónica. Actualmente en modo borrador — la integración con AFIP está próxima a implementarse.',
    steps: [
      'Revisá las facturas emitidas en el listado.',
      'Los borradores se pueden editar antes de confirmar.',
      'Una vez confirmados, se enviarán a AFIP automáticamente (próximamente).',
    ],
    tips: [
      '⚠️ Este módulo aún no emite facturas con AFIP. Próximo a implementación.',
      'Usá el modo borrador para preparar facturas y tenerlas listas.',
    ],
  },
  monthly_report: {
    title: 'Reporte Mensual',
    description: 'Resumen mensual de ingresos, egresos, IVA y resultado operativo. Comparativa mes a mes con gráficos.',
    steps: [
      'Seleccioná el mes y año que querés consultar.',
      'Revisá los totales de compras, ventas e IVA.',
      'Compará con meses anteriores usando el gráfico.',
    ],
    tips: [
      'El reporte se genera automáticamente con los datos cargados en Compras y Finanzas.',
    ],
  },
  expenses: {
    title: 'Gastos Operativos',
    description: 'Registro de gastos diarios de obra y oficina. Categorizá gastos menores, viáticos, materiales y servicios.',
    steps: [
      'Registrá un nuevo gasto con fecha, categoría y monto.',
      'Adjuntá la foto del ticket o comprobante.',
      'Los gastos se agrupan por categoría y mes automáticamente.',
    ],
    tips: [
      'Cargá los gastos el mismo día para no olvidarlos.',
      'Los gastos sin comprobante quedan marcados como pendientes de documentación.',
    ],
  },
  certifications: {
    title: 'Certificaciones ICC',
    description: 'Gestión de certificados de obra. Seguimiento del avance certificado, montos aprobados y pendientes de cobro.',
    steps: [
      'Cargá una nueva certificación con el número de certificado y obra.',
      'Indicá el monto certificado y la fecha de presentación.',
      'Hacé seguimiento del estado: presentada, aprobada, cobrada.',
    ],
    tips: [
      'Vinculá certificaciones con la planificación WBS para control cruzado.',
    ],
  },
  rrhh: {
    title: 'Recursos Humanos',
    description: 'Legajos digitales del personal. Datos personales, documentación, categorías, ART y control de asistencia.',
    steps: [
      'Buscá un empleado por nombre o legajo en la barra de búsqueda.',
      'Hacé clic en el empleado para ver su legajo completo.',
      'Cargá documentación (DNI, ART, alta AFIP) desde la pestaña de archivos.',
      'Registrá la asistencia diaria desde el Parte Diario o QR.',
    ],
    tips: [
      'Los empleados con documentación vencida aparecen con alerta.',
      'Podés exportar el listado completo a Excel.',
    ],
  },
  inventory: {
    title: 'Inventario',
    description: 'Control de stock de materiales y herramientas. Gestión de depósitos, estanterías y movimientos de entrada/salida.',
    steps: [
      'Revisá el stock actual en la vista general.',
      'Cargá nuevos ítems con "Nuevo Ítem" indicando nombre, unidad y categoría.',
      'Registrá entradas (compras) y salidas (consumo en obra).',
      'Usá la vista de depósito para ver la distribución por estantería.',
    ],
    tips: [
      'Las herramientas tienen prioridad visual con ícono 🔧.',
      'Los ítems con stock bajo se resaltan automáticamente.',
      'Los Pedidos de Compra solo permiten pedir materiales que existan en inventario.',
    ],
  },
  fleet: {
    title: 'Flota y Maquinaria',
    description: 'Registro completo de vehículos y maquinaria pesada. Control de kilometraje, mantenimiento programado, seguro y VTV.',
    steps: [
      'Agregá un nuevo vehículo con "Nuevo Vehículo" completando todos los datos.',
      'Editá un vehículo existente haciendo clic en el ícono ✏️.',
      'Programá el próximo mantenimiento indicando fecha y km.',
      'Ingresá a "Mantenimiento" para ver alertas de service vencidos.',
      'Ingresá a "Combustible" para registrar cargas de nafta/diesel.',
    ],
    tips: [
      'Cuando un vehículo tiene service vencido, aparece una alerta roja 🔴 en el módulo.',
      'Los vehículos se comparten con el módulo de Combustible.',
      'Mantené actualizados los km para que las alertas de mantenimiento sean precisas.',
    ],
  },
  purchase_requests: {
    title: 'Pedidos de Compra',
    description: 'Solicitudes de materiales y herramientas para obra. Los pedidos están vinculados al inventario — solo se pueden pedir ítems registrados.',
    steps: [
      'Hacé clic en "Nuevo Pedido" para crear una solicitud.',
      'Seleccioná el material o herramienta del dropdown (vinculado al inventario).',
      'Indicá la cantidad necesaria y la urgencia.',
      'El pedido queda en estado "Pendiente" hasta que Compras lo apruebe.',
    ],
    tips: [
      'Las herramientas 🔧 aparecen primero en el selector para mayor visibilidad.',
      'Si no encontrás un ítem, primero cargalo en Inventario.',
      'La unidad de medida se completa automáticamente al seleccionar el ítem.',
    ],
  },
  project_budget: {
    title: 'Proyectos y Presupuestos',
    description: 'Gestión de proyectos de construcción. Presupuestos, costos estimados vs. reales, y seguimiento financiero por obra.',
    steps: [
      'Creá un nuevo proyecto con nombre, cliente y presupuesto estimado.',
      'Asociá rubros y sub-rubros con costos unitarios.',
      'Compará el presupuesto original vs. el costo real a medida que avanza la obra.',
    ],
    tips: [
      'Vinculá el presupuesto con el WBS para control de avance + costo.',
    ],
  },
  wbs: {
    title: 'WBS — Planificación de Obra',
    description: 'Work Breakdown Structure. Descomposición jerárquica del trabajo por obra, con tareas, responsables y fechas.',
    steps: [
      'Seleccioná el proyecto/obra a planificar.',
      'Creá las tareas principales y sub-tareas.',
      'Asigná responsables, fechas de inicio y fin.',
      'Controlá el avance marcando tareas como completadas.',
    ],
    tips: [
      'El WBS se puede vincular con el BIM para visualización 3D del avance.',
      'Las tareas vencidas se resaltan automáticamente.',
    ],
  },
  field: {
    title: 'Parte Diario',
    description: 'Registro diario de actividades de obra. Asistencia del personal, equipos utilizados, clima y novedades.',
    steps: [
      'Creá un nuevo parte diario para la fecha actual.',
      'Registrá la asistencia del personal (presente, ausente, justificado).',
      'Indicá los equipos/maquinaria utilizados.',
      'Agregá novedades, incidentes o comentarios del día.',
    ],
    tips: [
      'El QR de asistencia permite que los operarios firmen desde su celular.',
      'Completá el parte antes del fin del día para no perder información.',
    ],
  },
  safety: {
    title: 'Seguridad e Incidentes',
    description: 'Registro de incidentes de seguridad, accidentes y observaciones preventivas en obra.',
    steps: [
      'Reportá un incidente con "Nuevo Reporte".',
      'Clasificá por gravedad: leve, moderado, grave.',
      'Indicá las acciones correctivas tomadas.',
      'Hacé seguimiento hasta el cierre del incidente.',
    ],
    tips: [
      'Los incidentes graves generan alertas automáticas para el responsable de seguridad.',
    ],
  },
  inspections: {
    title: 'Inspecciones y Calidad',
    description: 'Checklist de inspecciones de calidad en obra. Verificación de trabajos realizados según estándares.',
    steps: [
      'Seleccioná el tipo de inspección (estructural, instalaciones, terminaciones).',
      'Completá el checklist punto por punto.',
      'Adjuntá fotos de evidencia.',
      'Generá el informe de inspección.',
    ],
    tips: [
      'Las inspecciones con ítems no conformes quedan marcadas para seguimiento.',
    ],
  },
  rfi: {
    title: 'Consultas de Obra (RFI)',
    description: 'Request for Information. Canal formal para consultas técnicas entre obra, oficina técnica y dirección.',
    steps: [
      'Creá una nueva RFI describiendo la consulta.',
      'Asigná al destinatario (dirección técnica, proyectista, etc.).',
      'Esperá la respuesta y revisá cuando esté contestada.',
      'Cerrá la RFI cuando esté resuelta.',
    ],
    tips: [
      'Numerá las RFI secuencialmente para trazabilidad.',
      'Adjuntá planos o fotos para mayor claridad.',
    ],
  },
  documents: {
    title: 'Documentos y Correo',
    description: 'Gestión documental centralizada. Cartas documento, notas, comunicaciones formales y archivo digital.',
    steps: [
      'Subí documentos digitalizados con "Nuevo Documento".',
      'Clasificá por tipo: carta documento, nota, circular, etc.',
      'Buscá documentos por palabra clave, fecha o tipo.',
      'Generá cartas documento con el formato oficial.',
    ],
    tips: [
      'Las cartas documento se generan con el formato de Correo Argentino.',
      'Mantené un respaldo digital de toda la documentación importante.',
    ],
  },
  fuel: {
    title: 'Combustible',
    description: 'Registro de cargas de combustible por vehículo. Control de consumo, costos y rendimiento (km/litro).',
    steps: [
      'Seleccioná el vehículo que cargó combustible.',
      'Indicá litros, monto, tipo de combustible y km del odómetro.',
      'Opcionalmente, subí la foto del ticket para registro.',
      'Revisá el historial de cargas y el consumo promedio por vehículo.',
    ],
    tips: [
      'Cargá el km del odómetro para calcular el rendimiento automáticamente.',
      'Los vehículos se comparten con el módulo de Flota.',
    ],
  },
  logistics: {
    title: 'Logística',
    description: 'Gestión de acopios y distribución de materiales entre obras y depósitos.',
    steps: [
      'Consultá el stock por ubicación.',
      'Registrá movimientos entre depósitos.',
    ],
    tips: [
      'Este módulo está en desarrollo.',
    ],
  },
};
