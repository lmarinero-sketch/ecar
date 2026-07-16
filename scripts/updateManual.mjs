import fs from 'fs';

const filePath = 'src/components/ManualModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add missing icon imports if not there
const missingIcons = ['Banknote', 'Rocket', 'Mail', 'PieChart'];
missingIcons.forEach(icon => {
  if (!content.includes(icon)) {
    content = content.replace('LayoutDashboard,', `${icon}, LayoutDashboard,`);
  }
});

// New modules to append
const newModulesCode = `
  {
    id: 'logistics',
    code: 'MOD-05A',
    name: 'Logística y Acopios',
    section: 'Gerencia Logística',
    icon: Warehouse,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    purpose: 'Gestión centralizada de depósitos, recepción de mercadería y transferencias a obras, asegurando trazabilidad física del inventario.',
    scope: 'Gerencia de Logística y Encargados de Pañol.',
    responsible: 'Gerencia de Logística',
    process: [
      'Se configuran los depósitos centrales y pañoles de obra.',
      'Se reciben los remitos físicos y se ingresan al sistema, actualizando el stock.',
      'Se gestionan transferencias de materiales entre depósitos usando remitos internos.',
      'Se audita el layout 3D del depósito para optimización de espacios.'
    ],
    records: ['Remitos de Recepción', 'Remitos de Transferencia', 'Historial de Movimientos'],
    kpis: ['Tiempo de procesamiento de remitos', 'Precisión de inventario', 'Rotación de stock'],
    features: ['Recepción con códigos QR', 'Transferencias inter-depósitos', 'Mapeo 3D de almacenes']
  },
  {
    id: 'fleet',
    code: 'MOD-05B',
    name: 'Gestión de Flota y Taller',
    section: 'Gerencia Logística',
    icon: Truck,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-400',
    purpose: 'Control integral del parque automotor, mantenimientos (preventivos y correctivos) y ciclo de vida de neumáticos.',
    scope: 'Gerencia de Logística, Responsables de Taller y Choferes.',
    responsible: 'Jefe de Taller / Logística',
    process: [
      'Los choferes realizan reportes diarios de estado (Check-in) desde sus celulares, indicando km y novedades.',
      'El taller recibe alertas de mantenimiento y genera Órdenes de Trabajo (OT).',
      'Se gestiona el inventario de neumáticos por serie, posición y recapado.',
      'Se controla el consumo de combustible cruzando litros cargados vs km recorridos.'
    ],
    records: ['Reportes diarios de vehículos', 'Órdenes de Trabajo de Taller', 'Ficha histórica de neumáticos'],
    kpis: ['Costo por KM', 'Disponibilidad de flota', 'Desgaste prematuro de neumáticos'],
    features: ['Check-in móvil de vehículos', 'Gestión de OT', 'Trazabilidad de neumáticos (serie, posición)']
  },
  {
    id: 'communications',
    code: 'MOD-10',
    name: 'Comunicaciones',
    section: 'Comunicaciones',
    icon: Mail,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-400',
    purpose: 'Centralizar y trazar comunicaciones formales como Cartas Documento y Notas de Pedido, resguardando la evidencia legal.',
    scope: 'Asesoría Legal, Administración y Gerencia General.',
    responsible: 'Asesoría Legal / Gerencia',
    process: [
      'Se registra la emisión o recepción de Cartas Documento con su respectivo tracking ID.',
      'Se adjunta el PDF escaneado del documento original.',
      'Se definen plazos de vencimiento para contestaciones legales.',
      'Se emiten notas de pedido formales hacia proveedores o subcontratistas.'
    ],
    records: ['Cartas Documento emitidas/recibidas', 'Notas de Pedido', 'Acuses de recibo'],
    kpis: ['CDs sin responder en plazo', 'Volumen de comunicaciones formales'],
    features: ['Trazabilidad de correo legal', 'Adjuntos PDF', 'Alertas de vencimiento']
  },
  {
    id: 'payments',
    code: 'MOD-03E',
    name: 'Pagos y Egresos',
    section: 'Gerencia Adm y Finanzas',
    icon: Banknote,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    purpose: 'Gestión de órdenes de pago, salida de fondos y conciliación directa con las proyecciones del Tablero de Liquidez.',
    scope: 'Tesorería y Administración Financiera.',
    responsible: 'Tesorero / Gerente Financiero',
    process: [
      'Se reciben las facturas conformadas desde el módulo de Gastos o Compras.',
      'Se arman las Órdenes de Pago (OP) seleccionando el medio de pago (Transferencia, Cheque, Efectivo).',
      'Se autorizan las OP según los montos y niveles de autorización jerárquica.',
      'Al ejecutar el pago, se debita del saldo bancario del Tablero de Liquidez automáticamente.'
    ],
    records: ['Órdenes de Pago emitidas', 'Comprobantes de transferencia/cheque', 'Flujo de salida de caja'],
    kpis: ['Días promedio de pago', 'Pagos fuera de término', 'Efectividad de conciliación'],
    features: ['Generación de OP', 'Multi-medio de pago', 'Integración con Liquidez']
  },
  {
    id: 'budget_landing',
    code: 'MOD-02A',
    name: 'Introducción GPP',
    section: 'Gerencia Presupuestos',
    icon: HardHat,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    purpose: 'Importar y estructurar presupuestos de obras desde formatos estándar para su control operativo.',
    scope: 'Gerencia de Presupuestos y Licitaciones.',
    responsible: 'Gerente de Presupuestos',
    process: [
      'Se recibe el presupuesto oficial o licitado en formato Excel/CSV.',
      'El sistema mapea los ítems, unidades y costos directos.',
      'Se genera la estructura base para el WBS y el control de costos (BIM/Project Budget).',
      'Se establecen los márgenes esperados y curvas de inversión.'
    ],
    records: ['Presupuestos importados', 'Estructuras de costos base'],
    kpis: ['Precisión de importación', 'Desviación inicial de costos'],
    features: ['Importador inteligente', 'Mapeo de rubros', 'Generación de WBS base']
  },
  {
    id: 'weekly_report',
    code: 'MOD-11',
    name: 'Reporte Gerencia General',
    section: 'Tableros',
    icon: PieChart,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    purpose: 'Generar consolidados semanales automatizados para la toma de decisiones del directorio, cruzando finanzas, obras y recursos humanos.',
    scope: 'Directorio y Gerencia General.',
    responsible: 'Gerente General',
    process: [
      'El sistema compila al cierre de la semana los KPIs críticos de todas las áreas.',
      'Se generan gráficos de avance físico vs financiero de las obras activas.',
      'Se destaca la posición de liquidez a 7 y 30 días.',
      'Se resumen las incidencias críticas (accidentes, desvíos presupuestarios).',
      'Se exporta a PDF para presentación al Directorio.'
    ],
    records: ['Reportes Semanales Históricos', 'Actas de Directorio'],
    kpis: ['Cumplimiento de objetivos semanales', 'Desvíos críticos detectados'],
    features: ['Consolidación multi-módulo', 'Generación automática PDF', 'Gráficos ejecutivos']
  },
  {
    id: 'guide',
    code: 'MOD-98',
    name: 'Guía Rápida',
    section: 'Sistema',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    purpose: 'Asistir al usuario en la operatoria diaria mediante tutoriales y guías paso a paso dentro de la plataforma.',
    scope: 'Todos los usuarios del sistema.',
    responsible: 'Administrador del Sistema',
    process: [
      'Los usuarios acceden a la guía desde el menú superior o atajos de teclado.',
      'Encuentran artículos y flujos de trabajo sobre cómo usar cada módulo.',
      'El Asistente de IA puede referenciar estas guías automáticamente.'
    ],
    records: ['Artículos de ayuda', 'Registro de búsquedas'],
    kpis: ['Consultas resueltas por la guía', 'Uso del módulo de ayuda'],
    features: ['Buscador de ayuda', 'Tutoriales interactivos', 'Integración IA']
  },
  {
    id: 'implementation',
    code: 'MOD-97',
    name: 'Implementación',
    section: 'Sistema',
    icon: Rocket,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    purpose: 'Trazar y gestionar el avance del despliegue del ERP ECAR en la organización.',
    scope: 'Equipo de Implementación y Consultores.',
    responsible: 'Líder de Proyecto',
    process: [
      'Se definen las fases de implementación (Relevamiento, Configuración, Capacitación, Go-Live).',
      'Se asignan tareas a los key users de cada gerencia.',
      'Se mide el nivel de adopción del sistema por módulo.',
      'Se firman actas de conformidad por fase superada.'
    ],
    records: ['Plan de Implementación', 'Actas de Hito', 'Encuestas de Adopción'],
    kpis: ['% de Avance de Implementación', 'Horas de capacitación dictadas'],
    features: ['Gantt de implementación', 'Checklists de Go-Live']
  },
  {
    id: 'user_management',
    code: 'MOD-99A',
    name: 'Gestión de Usuarios',
    section: 'Sistema',
    icon: Users,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    purpose: 'Administrar el acceso, los roles y los permisos de los empleados dentro de la plataforma ECAR.',
    scope: 'Administradores de Sistema y RRHH.',
    responsible: 'Administrador IT',
    process: [
      'Se da de alta al empleado en RRHH y luego se le provisiona usuario de sistema.',
      'Se asignan roles granulares (Ej: Solo lectura, Aprobador, Carga de datos).',
      'Se restringe el acceso por módulos o por Centros de Costo (Obras).',
      'Se gestiona el reseteo de contraseñas y bloqueos por inactividad.'
    ],
    records: ['Padrón de Usuarios', 'Matriz de Permisos'],
    kpis: ['Usuarios activos vs inactivos', 'Incidentes de acceso'],
    features: ['Roles y permisos granulares', 'Sincronización con legajos']
  },
  {
    id: 'user_activity',
    code: 'MOD-99B',
    name: 'Actividad de Usuarios',
    section: 'Sistema',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    purpose: 'Registrar y auditar todas las transacciones y accesos al sistema para fines legales y de seguridad (Norma ISO 27001).',
    scope: 'Auditoría Interna y Administradores IT.',
    responsible: 'Auditor IT',
    process: [
      'El sistema guarda automáticamente un log inmutable de cada acción de creación, modificación o borrado.',
      'El log incluye timestamp, usuario, IP, módulo y detalle del cambio (antes/después).',
      'El administrador puede filtrar logs para investigaciones de seguridad o errores humanos.'
    ],
    records: ['Logs de Auditoría Inmutables', 'Alertas de accesos sospechosos'],
    kpis: ['Intentos de acceso fallidos', 'Volumen de transacciones'],
    features: ['Trazabilidad total', 'Cumplimiento normativo ISO', 'Búsqueda avanzada de logs']
  }
`;

// Updating existing modules text using regex or replace
content = content.replace(
  /'Se carga el parte diario en el sistema detallando equipos, horas y novedades.'/g,
  "'Se carga el parte diario en el sistema detallando equipos, horas y novedades. Si el operario se encuentra sin conexión a internet en la obra (Modo Offline), el reporte se guarda encriptado en la memoria del celular y se transmite automáticamente al recuperar la señal.'"
);

content = content.replace(
  /'Se genera el recibo de sueldo y se aprueba para su liquidación.'/g,
  "'Se genera la liquidación, procesando las novedades y deducciones. Posteriormente, el sistema genera automáticamente el Recibo de Sueldo en formato PDF, listo para su firma digital o impresión.'"
);

content = content.replace(
  /'Se definen los EPP requeridos y se registra su entrega al personal.'/g,
  "'Se definen los EPP requeridos, se registra su entrega al personal controlando fechas de vencimiento, y se exige la firma o conformidad (digital o física) del empleado receptor.'"
);

content = content.replace(
  /'Se integra un asistente IA para consultas rápidas sobre manuales o procedimientos.'/g,
  "'Se integra Rombo Chat, el asistente inteligente impulsado por IA, capaz de procesar audio en texto, leer manuales, resolver dudas operativas e incluso navegar por el sistema y consultar datos en tiempo real mediante funciones Edge especializadas.'"
);

// Append new modules just before the closing bracket of MODULES_DATA
content = content.replace(/\s*}\s*\];/, `  },${newModulesCode}\n];`);

// Ensure the count of modules displayed in the PDF and UI is updated from 27 to 37 (or the total length)
content = content.replace(/27\s*<\/div>\n\s*<div className="text-\[10px\] font-medium text-gray-500">Modulos documentados/g, 
  `{MODULES_DATA.length}</div>\n          <div className="text-[10px] font-medium text-gray-500">Módulos documentados`);

// also fix the hardcoded 27 in the hero section
content = content.replace(/27 Módulos/g, '{MODULES_DATA.length} Módulos');
content = content.replace(/27\s*Módulos/g, '{MODULES_DATA.length} Módulos');

fs.writeFileSync(filePath, content);
console.log('Manual updated successfully.');
