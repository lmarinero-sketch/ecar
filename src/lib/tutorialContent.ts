import type { ModuleId } from './types';

export type TutorialEntry = {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
};

export const TUTORIAL_CONTENT: Record<ModuleId, TutorialEntry> = {
  bi: {
    title: 'Dashboard Ejecutivo',
    description: 'Centro de control ejecutivo con KPIs organizados por Gerencia (Proyectos, Compras, Obras, Logística, Financiero). Vista integral del estado de la empresa en tiempo real.',
    steps: [
      'Revisá los KPIs de cada Gerencia: Proyectos (pipeline, conversión), Compras (OC, proveedores), Obras (NC, cambios), Logística (inventario, flota).',
      'Consultá los indicadores financieros: cheques a cobrar, facturación del mes.',
      'Revisá la sección de alertas de riesgo para acciones urgentes.',
      'Hacé clic en "Ver Detalle" para navegar al módulo correspondiente.',
    ],
    tips: [
      'Los KPIs se agrupan por Gerencia según el Manual de Organización ECAR.',
      'Las tarjetas con borde rojo indican situaciones que requieren atención urgente.',
      'El dashboard se actualiza automáticamente con datos en tiempo real de todos los módulos.',
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
    description: 'Sistema de carga en 2 pasos. Control de consumo, tickets fotográficos y auditoría de cargas sin autorizar.',
    steps: [
      'El operario crea una solicitud y luego completa la carga subiendo la foto del ticket desde el mismo link.',
      'Si carga sin autorización previa, queda marcado como "Sin Autorizar" para control de gerencia.',
      'Indicadores, rendimiento km/litro y notificaciones en tiempo real.',
      'Revisá el historial de cargas y el consumo promedio por vehículo.',
    ],
    tips: [
      'Cargá el km del odómetro para calcular el rendimiento automáticamente.',
      'Los vehículos se comparten con el módulo de Flota.',
    ],
  },
  logistics: {
    title: 'Gerencia de Logística',
    description: 'Hub centralizado de logística (Doc PR-GL-01). Control de pañol, transporte, inventario, flota y abastecimiento con KPIs consolidados y alertas de stock.',
    steps: [
      'Revisá los KPIs consolidados: ítems en stock, stock bajo, valor inventario, OC pendientes, flota operativa.',
      'Hacé clic en las tarjetas de Pañol, Flota, OC o Pedidos para acceder al sub-módulo.',
      'Revisá las alertas de stock bajo para identificar materiales que necesitan reposición urgente.',
      'Consultá los últimos movimientos de inventario en la tabla inferior.',
    ],
    tips: [
      'El rol "Pañolero" solo puede ver y gestionar las secciones de Pañol y Flota, sin acceso a información contable.',
      'Las alertas rojas indican ítems por debajo del stock mínimo configurado.',
      'Desde este hub podés navegar a todos los sub-módulos de logística.',
    ],
  },
  user_management: {
    title: 'Gestión de Usuarios',
    description: 'Administración de cuentas de usuario del sistema ECAR. Creá, editá y eliminá usuarios, asigná roles (Admin/Operario) y controlá qué módulos puede ver cada persona.',
    steps: [
      'Accedé al módulo desde el menú lateral (solo visible para Administradores).',
      'Hacé clic en "Nuevo Usuario" para crear una cuenta con email y contraseña.',
      'Asigná el rol: Admin (acceso total) u Operario (acceso restringido).',
      'Seleccioná los módulos habilitados para usuarios con rol Operario.',
      'Editá permisos de usuarios existentes desde el ícono de edición.',
    ],
    tips: [
      'Solo los usuarios con rol Admin pueden acceder a este módulo.',
      'Un Admin tiene acceso a todos los módulos automáticamente, sin importar la lista de módulos asignados.',
      'No podés eliminar tu propia cuenta desde este panel.',
      'Los cambios de permisos se aplican en el próximo inicio de sesión del usuario.',
    ],
  },
  purchase_orders: {
    title: 'Órdenes de Compra / OT',
    description: 'Emisión y seguimiento de Órdenes de Compra y Órdenes de Trabajo formales. Vinculación con pedidos internos, proveedores y proyectos.',
    steps: [
      'Creá una nueva OC desde "Nueva Orden" seleccionando proveedor y proyecto.',
      'Agregá los ítems con cantidad, unidad y precio unitario.',
      'Si el monto supera el umbral, la OC requiere aprobación de GG.',
      'Hacé seguimiento del estado: emitida → entregada → cerrada.',
    ],
    tips: [
      'Las OC se numeran automáticamente de forma secuencial.',
      'Vinculá cada OC con un pedido de compra interno para trazabilidad.',
      'Las OC urgentes quedan marcadas con bandera roja.',
    ],
  },
  opportunities: {
    title: 'Pipeline de Oportunidades',
    description: 'Gestión del funnel comercial de ECAR. Registrá oportunidades, llevá el pipeline por etapas, controlá documentación recibida y versiones de presupuesto.',
    steps: [
      'Registrá una nueva oportunidad con cliente, descripción y monto estimado.',
      'Completá el checklist de documentación recibida.',
      'Mové la oportunidad por las etapas: Oportunidad → Relevamiento → Presupuesto → Propuesta → Negociación → Adjudicada.',
      'Registrá supuestos y exclusiones para cada presupuesto.',
      'Al adjudicar, generá la Carpeta de Inicio de Obra.',
    ],
    tips: [
      'Usá la vista Pipeline (Kanban) para una visión rápida del embudo comercial.',
      'La tasa de conversión se calcula automáticamente con las oportunidades cerradas.',
      'Las oportunidades rechazadas quedan en un historial separado para análisis.',
    ],
  },
  nonconformities: {
    title: 'No Conformidades',
    description: 'Registro de desvíos respecto de los procedimientos. Acciones inmediatas, análisis de causa raíz, acciones correctivas y lecciones aprendidas.',
    steps: [
      'Registrá una NC indicando categoría (compra, obra, logística, proveedor, documental, seguridad).',
      'Describí el desvío y adjuntá evidencia fotográfica.',
      'Definí acción inmediata y responsable.',
      'Completá el análisis de causa raíz y acción correctiva.',
      'Verificá eficacia y cerrá la NC con lección aprendida.',
    ],
    tips: [
      'Las NC se numeran automáticamente para trazabilidad.',
      'Las NC abiertas aparecen en el Dashboard de indicadores por gerencia.',
      'Las lecciones aprendidas se incorporan a la mejora continua del sistema.',
    ],
  },
  supplier_eval: {
    title: 'Evaluación de Proveedores',
    description: 'Calificación periódica de proveedores según criterios de plazo, calidad, precio, documentación y respuesta a reclamos.',
    steps: [
      'Seleccioná el proveedor y período a evaluar.',
      'Calificá cada criterio del 1 al 5.',
      'El sistema calcula el puntaje general automáticamente.',
      'Indicá la recomendación: recomendado, condicional, no recomendado o bloquear.',
    ],
    tips: [
      'Evaluá proveedores mensualmente para mantener un historial útil.',
      'Los proveedores bloqueados no aparecen como opción en nuevas OC.',
      'La cantidad de NC se vincula automáticamente con la evaluación.',
    ],
  },
  communications: {
    title: 'Comunicaciones WhatsApp',
    description: 'CRM de WhatsApp con registro completo de todas las conversaciones con Rombo. Visualizá el historial de mensajes por número de teléfono con interfaz tipo WhatsApp Web.',
    steps: [
      'Seleccioná una conversación de la lista lateral.',
      'Revisá el historial completo de mensajes: los verdes son del usuario, los blancos de Rombo.',
      'Usá el buscador para filtrar conversaciones por número o contenido.',
      'Los datos se actualizan automáticamente cada 15 segundos.',
    ],
    tips: [
      'Este módulo es de solo lectura — los mensajes se envían desde WhatsApp.',
      'Las conversaciones muestran la intención detectada (intent) en la cabecera.',
      'Los pedidos de compra por WhatsApp quedan registrados tanto aquí como en Pedidos de Compra.',
    ],
  },
  weekly_report: {
    title: 'Reporte Semanal a GG',
    description: 'Resumen ejecutivo consolidado para Gerencia General con avance por obra, pedidos de compra, no conformidades, cambios de alcance, pipeline y decisiones requeridas.',
    steps: [
      'Revisá los KPIs de la semana: obras activas, horas trabajadas, avance promedio.',
      'Navegá semanas anteriores con los botones de navegación.',
      'Revisá la sección de "Decisiones Requeridas" para priorizar acciones.',
      'Imprimí el reporte con el botón de imprimir.',
    ],
    tips: [
      'Los datos se consolidan automáticamente de todos los módulos.',
      'Los incidentes reportados en partes diarios aparecen en el detalle de cada obra.',
      'El reporte se puede usar como base para la reunión semanal de GG.',
    ],
  },
  budget_landing: {
    title: 'Gerencia de Proyectos y Presupuestos',
    description: 'Hub del área de presupuestos. Flujo del proceso desde la oportunidad hasta la entrega a obra, con documentos a cada gerencia y matriz de responsabilidades.',
    steps: [
      'Revisá el flujo del proceso de presupuestación en 6 pasos.',
      'Accedé a los sub-módulos: Pipeline de Oportunidades, Presupuestos de Obra, Certificaciones.',
      'Consultá los documentos que se entregan a cada gerencia (Obras, Compras, Logística, Administración).',
      'Revisá la matriz RACI para entender responsabilidades.',
    ],
    tips: [
      'Este módulo es informativo y de navegación — los datos se cargan en los sub-módulos.',
      'El criterio rector: todo presupuesto debe explicar qué se entendió, midió, incluyó y excluyó.',
    ],
  },
  payments: {
    title: 'Control de Pagos Semanales',
    description: 'Planilla de pagos semanales con alias/CBU, titulares de cuenta y exportación PDF. Similar a la planilla de Adolfo para control de transferencias.',
    steps: [
      'Creá una nueva planilla de pagos indicando fecha y responsable.',
      'Agregá pagos manualmente o importá desde Gastos Operativos.',
      'Completá alias/CBU, titular de cuenta y nro. de factura para cada ítem.',
      'Marcá cada pago como realizado con el ícono ✓.',
      'Exportá la planilla a PDF para impresión o archivo.',
    ],
    tips: [
      'Los gastos operativos no pagados del período aparecen como importables.',
      'La columna "Resto" permite registrar pagos parciales.',
      'El PDF se genera con formato de tabla formal listo para imprimir.',
    ],
  },
  user_activity: {
    title: 'Actividad de Usuarios',
    description: 'Auditoría de navegación y acciones de los usuarios en el sistema.',
    steps: [
      'Revisá la tabla de registro de actividad para ver qué usuarios se conectaron recientemente.',
      'Analizá los módulos más visitados por cada usuario.',
      'Consultá las acciones específicas realizadas (clicks, ingresos a módulos) para propósitos de auditoría.'
    ],
    tips: [
      'Los registros de actividad se almacenan de forma automática cada vez que un usuario interactúa con el sistema.',
      'Solo los usuarios con rol de Administrador pueden ver este módulo.'
    ]
  },
  scope_changes: {
    title: 'Adicionales de Obra',
    description: 'Gestión de adicionales y cambios de alcance que impactan en el presupuesto y cronograma.',
    steps: [
      'Registrá un nuevo Adicional de Obra o Cambio de Alcance indicando el motivo y la obra afectada.',
      'Detallá el impacto económico (costo) y el impacto en plazo (días de extensión) del cambio.',
      'Cargá la documentación respaldatoria que justifique el adicional.',
      'Hacé el seguimiento de su estado de aprobación (borrador, enviado, aprobado, rechazado).'
    ],
    tips: [
      'Todo adicional aprobado debe vincularse luego al Presupuesto y al WBS de la obra.',
      'Llevá un control estricto de los adicionales para evitar desvíos imprevistos al final del proyecto.'
    ]
  },
  
  quality: {
    title: 'Calidad (Checklists)',
    description: 'Control de calidad en obra y seguimiento de protocolos (hormigonado, excavación, etc.).',
    steps: [
      'Seleccioná el protocolo o checklist de calidad correspondiente a la tarea a evaluar.',
      'Completá los ítems de verificación indicando si cumplen o no con los estándares.',
      'Adjuntá fotos de evidencia de los trabajos realizados.',
      'En caso de desvíos, generá automáticamente una No Conformidad o un ítem de Punch List.'
    ],
    tips: [
      'Completar los checklists en tiempo real asegura la trazabilidad y evita retrabajos.',
      'La firma digital avala que el proceso se realizó bajo la norma vigente.'
    ]
  },
  worker_payments: {
    title: 'Pagos a Trabajadores',
    description: 'Maestro de trabajadores con datos bancarios, montos de referencia y métricas de pago.',
    steps: [
      'Revisá la tabla con todos los trabajadores y sus datos bancarios.',
      'Editá inline el alias/CBU, monto o observación — los cambios impactan en todo el sistema.',
      'Usá la pestaña Métricas para ver gasto mensual y ranking de trabajadores.',
      'Exportá la planilla a PDF para impresión o archivo.',
    ],
    tips: [
      'El monto de referencia se toma del campo retribución pactada del legajo.',
      'Los trabajadores inactivos se muestran con opacidad reducida.',
      'Podés ordenar por nombre o monto haciendo clic en la columna.',
    ],
  },
  compras_intro: {
    title: 'Introducción Gerencia de Compras',
    description: 'Punto de partida del área de abastecimiento: pedidos, cotizaciones, órdenes de compra y evaluación de proveedores.',
    steps: [
      'Revisá el circuito de trabajo en 5 pasos desde el pedido de obra hasta la evaluación.',
      'Navegá a los submódulos activos: Registro de Compras, Pedidos, Órdenes de Compra y Evaluación de Proveedores.',
      'Consultá los entregables e interacción con Obras, Logística y Finanzas.',
      'Revisá las preguntas frecuentes para resolver dudas operativas.',
    ],
    tips: [
      'Todo pedido sin stock en pañol se deriva automáticamente a este sector.',
    ],
  },
  logistics_intro: {
    title: 'Introducción Gerencia de Logística',
    description: 'Punto de partida del área de logística: inventario, pañol, entregas a obra, flota vehicular y mantenimiento.',
    steps: [
      'Revisá el circuito en 5 pasos de gestión de stock, entregas y partes diarios de flota.',
      'Accedé a los módulos de Entregas, Flota y Maquinaria, e Inventario.',
      'Consultá la sección de Diagramas de Procesos completos.',
    ],
    tips: [
      'El uso del código QR por parte de choferes automatiza el odómetro de cada unidad.',
    ],
  },
  obra_intro: {
    title: 'Introducción Gerencia de Obra',
    description: 'Punto de partida del frente de producción: planificación WBS, parte diario de campo, adicionales, calidad y seguridad.',
    steps: [
      'Revisá el circuito operativo desde la estructura WBS hasta el cierre de protocolos e incidentes.',
      'Ingresá a WBS, Parte Diario, Adicionales, Seguridad, Calidad, RFI y No Conformidades.',
      'Consultá la documentación a entregar a Finanzas para la certificación comitente.',
    ],
    tips: [
      'El Parte Diario cargado por el Capataz alimenta la asistencia de RRHH y el uso de maquinaria de Logística.',
    ],
  },
  finanzas_intro: {
    title: 'Introducción Gerencia de Adm. y Finanzas',
    description: 'Punto de partida del área financiera: tesorería, cashflow, ARCA, certificaciones, quincenas y pagos.',
    steps: [
      'Revisá el flujo de certificación comitente, comprobantes, obligaciones y pagos.',
      'Accedé a Finanzas, Alertas & Obligaciones, Certificaciones, Gastos, Pagos y Pagos a Trabajadores.',
      'Consultá las FAQs sobre vencimientos, eCheqs y retenciones impositivas.',
    ],
    tips: [
      'El módulo Alertas & Obligaciones notifica vencimientos fiscales y bancarios 15 días antes.',
    ],
  },
  rrhh_intro: {
    title: 'Introducción Gerencia de RRHH',
    description: 'Punto de partida de la gestión de talento: legajos, EPP, asistencia, licencias y sueldos UOCRA.',
    steps: [
      'Revisá el ciclo de vida del colaborador desde el alta hasta la liquidación final.',
      'Ingresá a Legajos & Personal, Parte Diario de Presentismo y Liquidación de Sueldos.',
      'Revisá la guía de entrega de EPP e indumentaria de trabajo.',
    ],
    tips: [
      'El Parte Diario de Obra pre-carga las horas del personal en este módulo.',
      'Recordá actualizar la Ficha de Entrega de EPP con la firma del trabajador.',
      'La firma digital de entrega de EPP cumple con los requerimientos de auditoría de ART.',
    ],
  },
  payment_orders: {
    title: 'Órdenes de Pago a Proveedores',
    description: 'Gestión y trazabilidad de los pagos emitidos a proveedores, cheques, transferencias y efectivo.',
    steps: [
      'Visualizá el total de pagos emitidos y su desglose por método de pago.',
      'Buscá pagos por proveedor, número de cheque o número de factura.',
      'Llevá un control cruzado con los cheques emitidos y facturas abonadas.',
    ],
    tips: [
      'Los pagos realizados con "Cheque Propio" se registran automáticamente en el módulo de Finanzas y Cheques.',
    ],
  },
};
