import React, { useRef, useState } from 'react';
import {
  BookOpen, Download, FileText, Shield, Users, Package,
  Banknote, Rocket, Mail, PieChart, LayoutDashboard, Calculator, ShoppingCart, Landmark, Bell,
  Warehouse, FileSignature, Smartphone, ShieldAlert, ClipboardCheck,
  MessageSquareText, Wallet, FolderOpen, HardHat, Target, Fuel,
  DollarSign, Calendar, ShoppingBag, Bot, CheckCircle, AlertCircle,
  Lock, Database, Zap, ArrowRight, Star, Activity, BarChart3,
  ChevronRight, Globe, Cpu, Server, Key, Truck
} from 'lucide-react';
import jsPDF from 'jspdf';

/* ═══════════════════════════════════════════════════════════════ */
/*                        TIPOS Y DATOS                           */
/* ═══════════════════════════════════════════════════════════════ */

interface ModuleDoc {
  id: string;
  code: string;
  name: string;
  section: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  purpose: string;
  scope: string;
  responsible: string;
  process: string[];
  records: string[];
  kpis: string[];
  features: string[];
}

const MODULES_DATA: ModuleDoc[] = [
  {
    id: 'bi',
    code: 'MOD-01',
    name: 'Dashboard BI',
    section: 'Tableros',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    purpose: 'Centro de control ejecutivo con KPIs organizados por Gerencia (Proyectos, Compras, Obras, Logística, Financiero) según el Manual de Organización ECAR.',
    scope: 'Todos los usuarios con acceso al sistema. KPIs agrupados por las 4 gerencias definidas en el Manual de Organización.',
    responsible: 'Gerencia General / Administración',
    process: [
      'El sistema recolecta datos de todos los módulos activos en tiempo real vía Supabase.',
      'Los KPIs se agrupan por gerencia: Proyectos (pipeline, conversión), Compras (OC, proveedores), Obras (NC, cambios), Logística (inventario, flota).',
      'Indicadores financieros muestran cheques a cobrar, facturación del mes y gastos.',
      'Las alertas de riesgo se destacan en la sección superior para acción inmediata.',
      'Los proyectos activos se listan con su estado, avance y presupuesto.'
    ],
    records: ['KPIs por Gerencia en tiempo real', 'Alertas de riesgo consolidadas', 'Lista de proyectos activos con progreso', 'Indicadores financieros'],
    kpis: ['Pipeline activo y tasa conversión', 'OC abiertas y score proveedores', 'NC abiertas y cambios pendientes', 'Stock bajo y flota operativa'],
    features: ['KPIs por Gerencia según Manual ECAR', 'Alertas de riesgo consolidadas', 'Navegación directa a módulos', 'Actualización en tiempo real']
  },
  {
    id: 'liquidity',
    code: 'MOD-02',
    name: 'Tablero de Liquidez',
    section: 'Tableros',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    purpose: 'Gestionar y proyectar el flujo de caja operativo, permitiendo anticipar déficits de liquidez con hasta 90 días de anticipación.',
    scope: 'Área de Administración y Gerencia. Información sobre cuentas bancarias, cheques y obligaciones futuras.',
    responsible: 'Administrador Contable / Gerente de Finanzas',
    process: [
      'El sistema consolida automáticamente los saldos de todas las cuentas bancarias registradas.',
      'Se proyectan los cheques a cobrar y a pagar según sus fechas de vencimiento.',
      'El tablero muestra el saldo proyectado diario para los próximos 30, 60 y 90 días.',
      'Incluye un Resumen Mensual que cruza los ingresos reales (facturación de certificados) vs gastos reales operativos.',
      'Permite el ajuste manual de "Caja Final Real", "Apoyo Financiero" y "Otros Ingresos/Gastos" para auditar la liquidez mensual.'
    ],
    records: ['Proyección de flujo de caja 90 días', 'Saldos bancarios actualizados', 'Cronograma de cheques', 'Resumen Mensual Esperado vs Real'],
    kpis: ['Saldo disponible total', 'Cheques a cobrar próximos 30 días', 'Diferencia de Caja Mensual', 'Días de cobertura financiera'],
    features: ['Proyección 30/60/90 días', 'Integración multi-cuenta bancaria', 'Resumen Mensual interactivo', 'Cálculo de Diferencia de Caja']
  },
  {
    id: 'certifications',
    code: 'MOD-02A',
    name: 'Certificaciones de Obras',
    section: 'Gerencia Adm y Finanzas',
    icon: HardHat,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-400',
    purpose: 'Control y seguimiento del cobro de certificados de obra pública y privada, controlando el ciclo Facturado > Depositado.',
    scope: 'Gerencia Administrativa y Financiera. Relacionado con proyectos de obra y vinculación directa al ingreso de flujo de caja.',
    responsible: 'Gerente Administrativo',
    process: [
      'Se asocian los proyectos de obra activos con sus valores contractuales.',
      'Se registran mes a mes las certificaciones con importes base y redeterminaciones.',
      'El sistema calcula deducciones y retenciones (Anticipo, Fondo de Reparo) automáticamente.',
      'Los certificados cambian de color según su estado: Blanco (Pendiente), Verde Claro (Facturado), Verde Oscuro (Depositado).',
      'El depósito real se vincula como ingreso para el Tablero de Liquidez.'
    ],
    records: ['Certificados de obra emitidos', 'Historial de depósitos bancarios', 'Registro de redeterminaciones'],
    kpis: ['Total Facturado vs Depositado', 'Días de atraso en cobro', 'Saldo pendiente de cobro por obra'],
    features: ['Cálculo de retenciones automáticas', 'Estados visuales por colores', 'Vinculación a Liquidez Mensual']
  },
  {
    id: 'gastos',
    code: 'MOD-02B',
    name: 'Gastos Operativos',
    section: 'Gerencia Adm y Finanzas',
    icon: ShoppingBag,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-400',
    purpose: 'Auditoría y registro mensual de los egresos, gastos fijos y pagos a terceros de la empresa.',
    scope: 'Gerencia Administrativa y Contable. Alimentación del flujo de caja corporativo.',
    responsible: 'Gerente de Finanzas / Contable',
    process: [
      'Se cargan o autocalculan los gastos fijos del mes organizados en categorías (Sueldos, Seguros, Impuestos, etc.).',
      'El sistema permite filtrar dinámicamente los registros por: mes actual, semana actual, hoy o personalizado.',
      'Cada registro de gasto especifica un método de pago y afecta el saldo de caja.',
      'Incluye consolidación automática de los "Cheques Emitidos" que se deben pagar en el período.',
      'La suma de estos egresos alimenta de manera directa el Resumen Mensual de Liquidez.'
    ],
    records: ['Registro de gastos fijos mensuales', 'Pagos a terceros', 'Consolidado de sueldos y honorarios'],
    kpis: ['Egresos totales del mes', 'Distribución del gasto por categoría', 'Gastos fijos vs variables'],
    features: ['Filtros temporales dinámicos', 'Asignación de categorías de gasto', 'Integración automática con Liquidez']
  },
  {
    id: 'purchases',
    code: 'MOD-03',
    name: 'Compras & Libro IVA',
    section: 'Administración',
    icon: ShoppingCart,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Gestionar la recepción y validación de facturas de compra mediante OCR con Inteligencia Artificial, generando el Libro IVA Compras digital.',
    scope: 'Toda factura de compra recibida de proveedores debe ser registrada en este módulo. Genera el registro para AFIP.',
    responsible: 'Administrativo de Compras / Contador',
    process: [
      'El usuario sube foto o PDF de la factura (desde web o WhatsApp vía Rombo).',
      'La Edge Function "process-invoice" procesa la imagen usando Gemini AI (OCR).',
      'El sistema extrae automáticamente: CUIT, tipo de factura, monto neto, IVA, totales y proveedor.',
      'La factura queda en estado "Pendiente de revisión" para validación del responsable.',
      'El usuario administrador revisa, corrige si es necesario, y cambia el estado a "Validado".',
      'El sistema asocia la factura al rubro de gasto contable correspondiente.',
      'Se puede exportar el Libro IVA Compras en formato Excel (.xlsx) o TXT para importar a sistema contable.'
    ],
    records: ['Facturas de compra digitalizadas', 'Libro IVA Compras digital', 'Base de proveedores actualizada', 'Log de procesamiento OCR'],
    kpis: ['Facturas procesadas por período', 'IVA Crédito Fiscal acumulado', 'Facturas pendientes de validación', 'Proveedores activos'],
    features: ['OCR con Gemini AI', 'Clasificación automática compra/venta', 'Exportación Libro IVA Excel', 'Base de proveedores integrada']
  },
  {
    id: 'finances',
    code: 'MOD-04',
    name: 'Finanzas & Tesorería',
    section: 'Administración',
    icon: Landmark,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    purpose: 'Gestionar la cartera de cheques (físicos y eCheqs), los comprobantes de pago y el control de cuentas bancarias.',
    scope: 'Todos los cheques emitidos (a pagar) y recibidos (a cobrar) de la empresa. Comprobantes de pago de proveedores y obligaciones.',
    responsible: 'Tesorero / Administrador',
    process: [
      'Alta de cheques: el usuario puede cargar manualmente o mediante foto (OCR con Edge Function extract-cheque-data).',
      'El sistema detecta feriados nacionales y posterga automáticamente los vencimientos al próximo día hábil.',
      'La cartera muestra los cheques pendientes, depositados, cobrados, rechazados y anulados.',
      'Para el registro de comprobantes de pago: se carga fecha, monto, medio de pago y se adjunta el comprobante (PDF/imagen).',
      'Los archivos se almacenan en el bucket "payment-receipts" de Supabase Storage.',
      'Las alertas de vencimiento se generan automáticamente 7 días antes.'
    ],
    records: ['Cartera de cheques activa', 'Comprobantes de pago registrados', 'Historial de cheques por estado', 'Log de alertas enviadas'],
    kpis: ['Total cheques a cobrar', 'Total cheques a pagar', 'Gastos fijos mensuales', 'Cheques venciendo próximos 7 días'],
    features: ['OCR de cheques por foto', 'Cálculo de días hábiles (feriados AR)', 'Comprobantes de pago con archivo adjunto', 'Alertas automáticas vía WhatsApp']
  },
  {
    id: 'obligations',
    code: 'MOD-05',
    name: 'Alertas & Obligaciones',
    section: 'Administración',
    icon: Bell,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    purpose: 'Centralizar el calendario de obligaciones fiscales, gremiales y contractuales con envío automático de alertas por WhatsApp.',
    scope: 'F931 AFIP, ART, cuotas gremiales, alquileres, seguros, habilitaciones y cualquier obligación recurrente de la empresa.',
    responsible: 'Administrador / Contador',
    process: [
      'El administrador registra cada obligación: tipo, monto estimado, día de vencimiento y recurrencia.',
      'Se configuran los contactos que deben recibir las alertas (número de WhatsApp).',
      'La Edge Function "process-reminders" se ejecuta automáticamente según el schedule configurado.',
      'Los avisos se envían X días antes del vencimiento definido por el usuario.',
      'El sistema registra en el log de notificaciones cada envío (exitoso o fallido).',
      'El historial de pagos permite documentar la cancelación de cada obligación.'
    ],
    records: ['Calendario de obligaciones', 'Log de notificaciones enviadas', 'Historial de pagos por obligación', 'Contactos de notificación activos'],
    kpis: ['Obligaciones vencidas impagasas', 'Alertas enviadas en el mes', 'Obligaciones próximas a vencer', 'Tasa de cumplimiento mensual'],
    features: ['Alertas WhatsApp automáticas', 'Scheduler de notificaciones', 'Múltiples contactos por alerta', 'Recurrencia configurable (diaria/semanal/mensual)']
  },
  {
    id: 'invoicing',
    code: 'MOD-06',
    name: 'Facturación (ARCA)',
    section: 'Administración',
    icon: Calculator,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    purpose: 'Generar y gestionar facturas de venta electrónicas con integración a ARCA (ex-AFIP), obteniendo el CAE de forma automatizada.',
    scope: 'Toda factura de venta emitida por la empresa a sus clientes. Tipos A, B y C según condición impositiva.',
    responsible: 'Administrador / Facturista',
    process: [
      'El usuario completa el encabezado de la factura: cliente, CUIT, tipo de comprobante y fecha.',
      'Se agregan los ítems de la factura con descripción, cantidad, precio unitario e IVA.',
      'El sistema calcula automáticamente subtotales, IVA (21%, 10.5%, 27%) y total.',
      'Al emitir, se envía la solicitud a ARCA para obtención del CAE.',
      'La factura con CAE queda disponible para descarga en PDF.',
      'Se registra automáticamente en el Libro IVA Ventas.'
    ],
    records: ['Facturas de venta emitidas', 'CAE de AFIP/ARCA', 'Libro IVA Ventas', 'PDFs de facturas generadas'],
    kpis: ['Facturación mensual total', 'IVA Débito Fiscal', 'Facturas emitidas por período', 'Facturas rechazadas por ARCA'],
    features: ['Integración ARCA/AFIP', 'Obtención automática de CAE', 'Tipos A, B y C', 'Exportación PDF de facturas']
  },
  {
    id: 'expenses',
    code: 'MOD-07',
    name: 'Gastos Operativos',
    section: 'Administración',
    icon: Wallet,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-400',
    purpose: 'Registrar y controlar todos los gastos operativos de la empresa por categoría y período, vinculando facturas de compra con rubros contables.',
    scope: 'Gastos de personal, seguros, servicios, impuestos, combustibles, viandas, gremios, terceros y varios.',
    responsible: 'Administrador',
    process: [
      'El administrador define los rubros de gastos (GastoItem) por categoría.',
      'Cada mes se registran los importes reales de cada rubro (GastoRegistro).',
      'Los gastos se pueden vincular directamente a facturas de compra del módulo Compras.',
      'Un trigger automático en Supabase asocia facturas cargadas por OCR al rubro correspondiente según el proveedor.',
      'El resumen mensual muestra el gasto real vs. presupuestado por categoría.',
      'El módulo Resumen Mensual usa estos datos para el informe ejecutivo.'
    ],
    records: ['Rubros de gasto activos', 'Registros de gasto por período', 'Vinculación factura-rubro', 'Comparativo real vs presupuesto'],
    kpis: ['Gasto total mensual por categoría', 'Variación vs. mes anterior', 'Gastos sin categorizar', 'Porcentaje de gastos fijos vs. variables'],
    features: ['Categorización automática via OCR', 'Vinculación con facturas de compra', 'Trigger automático de mapeo', 'Exportación para análisis contable']
  },
  {
    id: 'certifications',
    code: 'MOD-08',
    name: 'Certificaciones / ICC',
    section: 'Administración',
    icon: FileSignature,
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-500',
    purpose: 'Gestionar el ciclo completo de certificaciones de avance de obra (ICC - Instrumento de Certificación de Cobro) con control de retenciones y depósitos.',
    scope: 'Cada certificación emitida por la empresa a sus comitentes por avance de obra. Incluye retenciones, depósitos y estados.',
    responsible: 'Gerente de Proyectos / Administrador',
    process: [
      'Se crea la certificación indicando: proyecto, número de certificado, período y monto bruto.',
      'El sistema calcula automáticamente las retenciones (IIBB, Impuesto al Cheque, otras).',
      'El monto neto a depositar se calcula restando todas las retenciones.',
      'Se registra la fecha de depósito y la cuenta bancaria receptora.',
      'Los estados posibles son: Pendiente → Aprobado → Depositado → Rechazado.',
      'Se puede adjuntar foto del comprobante de depósito.',
      'El módulo genera el historial completo de certificaciones por proyecto.'
    ],
    records: ['Certificaciones por proyecto', 'Retenciones aplicadas', 'Comprobantes de depósito', 'Historial de estados'],
    kpis: ['Monto certificado acumulado', 'Certificaciones pendientes de depósito', 'Retenciones acumuladas por tipo', 'Días promedio de cobro'],
    features: ['Cálculo automático de retenciones', 'Flujo de estados controlado', 'Adjunto de comprobante de depósito', 'Historial por proyecto']
  },
  {
    id: 'rrhh',
    code: 'MOD-09',
    name: 'RRHH & Legajos',
    section: 'Personal',
    icon: Users,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Gestión integral del personal: legajos digitales, asistencia por QR, liquidación de haberes, documentos y novedades.',
    scope: 'Todo el personal en relación de dependencia. Fichajes, legajos, liquidaciones, vacaciones, ausencias y documentos legales.',
    responsible: 'RRHH / Administrador',
    process: [
      'Alta de empleado: datos personales, CUIL, categoría sindical, turno, obra asignada.',
      'Fichaje de asistencia: el operario escanea el QR de la obra desde su celular (CheckInPage).',
      'El sistema registra la hora de entrada/salida y calcula horas trabajadas y horas extra.',
      'Las novedades del período se registran: ausencias, vacaciones, adelantos, licencias.',
      'Al cierre del período, se exportan las novedades para el estudio contable (liquidación).',
      'Los documentos del legajo (DNI, recibos, constancias) se cargan en el bucket "legajos" de Supabase.'
    ],
    records: ['Legajos de personal', 'Registros de asistencia', 'Novedades de liquidación', 'Documentos del legajo'],
    kpis: ['Personal activo total', 'Ausentismo porcentual', 'Horas extra acumuladas', 'Documentos vencidos del legajo'],
    features: ['Fichaje QR geolocalizado desde celular', 'Legajo digital completo', 'Exportación de novedades para contador', 'Módulo de adelantos y licencias']
  },
  {
    id: 'inventory',
    code: 'MOD-10',
    name: 'Inventario & Pañol',
    section: 'Logística',
    icon: Package,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Controlar el stock de materiales, herramientas y consumibles del pañol con gestión de ubicaciones por estantería y movimientos auditables.',
    scope: 'Todo material, herramienta y consumible en posesión de la empresa. Altas, bajas, asignaciones y devoluciones.',
    responsible: 'Pañolero / Logística',
    process: [
      'Alta de ítem: nombre, categoría (material/herramienta/consumible), unidad, stock mínimo, costo y ubicación en estantería.',
      'El sistema genera código QR y código de barras único para cada ítem.',
      'Los movimientos se registran: Entrada (compra/devolución), Salida (asignación a obra/empleado), Ajuste.',
      'La asignación de herramientas vincula el ítem con el empleado y la obra receptora.',
      'El escáner de código de barras (BarcodeScannerModal) permite registro rápido desde el celular.',
      'Alertas automáticas cuando el stock cae por debajo del mínimo configurado.',
      'Las estanterías del pañol se mapean visualmente con el módulo de WarehouseShelves.'
    ],
    records: ['Inventario activo con stock', 'Movimientos auditables', 'Asignaciones de herramientas', 'Alertas de stock mínimo'],
    kpis: ['Ítems bajo stock mínimo', 'Valor total del inventario', 'Herramientas asignadas', 'Rotación de stock mensual'],
    features: ['QR y código de barras por ítem', 'Mapeo visual de estanterías', 'Escáner desde celular', 'Alertas de stock mínimo automáticas']
  },
  {
    id: 'purchase_requests',
    code: 'MOD-11',
    name: 'Pedidos de Compra',
    section: 'Logística',
    icon: ShoppingBag,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Gestionar el ciclo de pedidos de compra de materiales desde la solicitud en obra hasta la aprobación y recepción.',
    scope: 'Toda solicitud de compra originada en las obras o en el pañol. Estados: Pendiente → Aprobado → Consolidado → Ordenado → Recibido.',
    responsible: 'Jefe de Obra / Administración',
    process: [
      'El responsable de obra crea el pedido indicando los materiales necesarios, cantidad, unidad y urgencia.',
      'El pedido queda en estado "Pendiente" esperando aprobación del administrador.',
      'La administración revisa, aprueba o rechaza con su justificación.',
      'Los pedidos aprobados se consolidan en una orden de compra al proveedor.',
      'Al recibir la mercadería, se confirma la recepción y se registran las entradas al inventario.',
      'Los pedidos pueden solicitarse también desde el Parte Diario de Obra.'
    ],
    records: ['Pedidos de compra por estado', 'Ítems solicitados por pedido', 'Historial de aprobaciones', 'Pedidos vinculados a partes diarios'],
    kpis: ['Pedidos pendientes de aprobación', 'Tiempo promedio de aprobación', 'Pedidos urgentes activos', 'Tasa de rechazos'],
    features: ['Workflow de aprobación', 'Integración con inventario', 'Integración con Parte Diario', 'Niveles de urgencia (baja/normal/urgente)']
  },
  {
    id: 'field',
    code: 'MOD-12',
    name: 'Parte Diario de Obra',
    section: 'Operaciones',
    icon: Smartphone,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    purpose: 'Registrar el avance diario de cada obra incluyendo personal presente, equipos utilizados, materiales consumidos, clima e incidentes.',
    scope: 'Una entrada por día por obra activa. Flujo: Borrador → Enviado (desde obra) → Aprobado/Rechazado (desde oficina).',
    responsible: 'Jefe de Obra (carga) / Administración (aprobación)',
    process: [
      'El jefe de obra ingresa al sistema desde el celular y crea el parte del día.',
      'Completa: clima (con detección automática de temperatura), personal presente, equipos en uso, materiales utilizados.',
      'Describe el trabajo realizado y registra el avance porcentual de las tareas WBS.',
      'Adjunta fotografías del avance de obra (se suben a Supabase Storage).',
      'Envía el parte: pasa a estado "Enviado" y queda pendiente de aprobación.',
      'El administrador en oficina revisa, puede rechazarlo con comentarios o aprobarlo.',
      'Los datos de personal y equipos se integran con el módulo de RRHH y Combustible.'
    ],
    records: ['Partes diarios por obra', 'Fotos de avance de obra', 'Registro de personal y equipos', 'Historial de aprobaciones'],
    kpis: ['Partes aprobados vs. enviados', 'Avance porcentual promedio', 'Fotos registradas por obra', 'Tiempo de aprobación promedio'],
    features: ['Optimizado para celular', 'Adjunto de fotos múltiples', 'Integración con WBS para avances', 'Workflow de aprobación dos niveles']
  },
  {
    id: 'wbs',
    code: 'MOD-13',
    name: 'Planificación WBS & Gantt',
    section: 'Operaciones',
    icon: Target,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Planificar, programar y controlar el avance de obras mediante estructura de desglose del trabajo (WBS) con visualización en Gantt.',
    scope: 'Todo proyecto activo de la empresa. Estructura jerárquica de tareas con dependencias, asignaciones y fechas.',
    responsible: 'Gerente de Proyectos / Jefe de Obra',
    process: [
      'Se crea la estructura WBS del proyecto con niveles jerárquicos (Fase → Actividad → Tarea).',
      'Cada elemento WBS tiene: nombre, descripción, fechas inicio/fin, duración, dependencia, responsable, prioridad y color.',
      'El Gantt interactivo muestra las barras de tiempo con dependencias.',
      'El módulo 3D (Wbs3dView) permite visualizar la jerarquía en un grafo tridimensional.',
      'El avance se actualiza desde los Partes Diarios de Obra.',
      'La retroalimentación (desviaciones, lecciones, mejoras) se registra por elemento WBS.',
      'Las fases del proyecto son: Planificación → Programación → Ejecución → Completado.'
    ],
    records: ['Estructura WBS del proyecto', 'Cronograma Gantt', 'Retroalimentación de proyecto', 'Registro de avances por tarea'],
    kpis: ['Avance físico vs. planificado', 'Tareas críticas en riesgo', 'Desviaciones registradas', 'Índice de cumplimiento de fechas'],
    features: ['Gantt interactivo con dependencias', 'Visualización 3D de la jerarquía', 'Fases de proyecto controladas', 'Integración con Parte Diario']
  },
  {
    id: 'safety',
    code: 'MOD-14',
    name: 'Seguridad & Incidentes',
    section: 'Operaciones',
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    purpose: 'Registrar, investigar y dar seguimiento a incidentes de seguridad laboral y observaciones preventivas con evaluación de riesgos.',
    scope: 'Todos los incidentes, accidentes, cuasi-accidentes y enfermedades laborales. Observaciones preventivas de riesgo en obra.',
    responsible: 'Responsable de Higiene y Seguridad / Jefe de Obra',
    process: [
      'Alta de incidente: fecha, hora, tipo (accidente/incidente/cuasi-accidente/enfermedad laboral), gravedad (leve/moderado/grave/fatal).',
      'Se documenta: persona afectada, testigos, tratamiento recibido, días perdidos.',
      'Se realiza análisis de causa raíz y se definen acciones correctivas con responsable y fecha límite.',
      'Se registra si fue notificado a la ART.',
      'Para observaciones: se usa la matriz 5×5 de riesgo (severidad × probabilidad).',
      'El estado del incidente pasa por: Abierto → En Investigación → Cerrado.',
      'Todas las instancias se pueden documentar con fotos adjuntas.'
    ],
    records: ['Registro de incidentes OSHA', 'Observaciones preventivas', 'Acciones correctivas con seguimiento', 'Notificaciones a la ART'],
    kpis: ['Índice de frecuencia de accidentes', 'Días perdidos acumulados', 'Observaciones de alto riesgo abiertas', 'Incidentes notificados a ART'],
    features: ['Clasificación por gravedad (leve/grave/fatal)', 'Matriz de riesgo 5×5', 'Análisis de causa raíz', 'Integración con fotos de obra']
  },
  {
    id: 'inspections',
    code: 'MOD-15',
    name: 'Inspecciones & Calidad',
    section: 'Operaciones',
    icon: ClipboardCheck,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-400',
    purpose: 'Gestionar inspecciones técnicas de obra con checklists digitales y Punch List de no conformidades con asignación de responsables.',
    scope: 'Inspecciones de estructura, eléctrica, sanitaria, gas, seguridad contra incendio, terminaciones y generales.',
    responsible: 'Inspector Técnico / Director de Obra',
    process: [
      'Se crea la inspección indicando: tipo, fecha, inspector, obra y ubicación específica.',
      'El checklist de verificación se completa ítem por ítem con estado: OK / Falla / No Aplica y notas.',
      'El resultado global puede ser: Pendiente / Aprobada / Aprobada con Observaciones / Rechazada.',
      'Las fallas generan automáticamente ítems en el Punch List.',
      'El Punch List asigna número, prioridad, responsable y fecha límite a cada no conformidad.',
      'El cierre requiere foto de evidencia del trabajo correctivo realizado.',
      'Los estados del Punch List: Abierto → En Corrección → Corregido → Verificado → Cerrado.'
    ],
    records: ['Informes de inspección con checklist', 'Punch List por obra', 'Fotos de antes y después', 'Historial de no conformidades'],
    kpis: ['Inspecciones aprobadas vs. rechazadas', 'Punch List abiertos sin resolver', 'Tiempo promedio de cierre', 'No conformidades reincidentes'],
    features: ['Checklists digitales configurables', 'Punch List integrado', 'Evidencia fotográfica', 'Trazabilidad completa de no conformidades']
  },
  {
    id: 'rfi',
    code: 'MOD-16',
    name: 'Consultas de Obra (RFI)',
    section: 'Operaciones',
    icon: MessageSquareText,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-400',
    purpose: 'Gestionar las consultas formales de obra (Request for Information) con impacto documentado en costo y cronograma.',
    scope: 'Toda consulta técnica que requiera respuesta formal del comitente, proyectista o inspector. Numeradas correlativamente.',
    responsible: 'Jefe de Obra / Director de Obra',
    process: [
      'Se crea la RFI con: número correlativo, asunto, pregunta detallada, consultante y asignado a responder.',
      'Se indica la fecha requerida de respuesta y el plazo límite.',
      'Se documenta si tiene impacto en costo y/o en cronograma con el valor estimado.',
      'El estado evoluciona: Borrador → Abierta → Respondida → Cerrada.',
      'La respuesta oficial queda registrada con el respondiente y la fecha.',
      'Las fotos de la situación a resolver se adjuntan como evidencia.'
    ],
    records: ['Registro correlativo de RFIs', 'Respuestas oficiales documentadas', 'Impactos en costo y cronograma', 'Fotos de consulta'],
    kpis: ['RFIs abiertas sin respuesta', 'Tiempo promedio de respuesta', 'Impacto económico acumulado de RFIs', 'RFIs por proyecto'],
    features: ['Numeración correlativa automática', 'Documentación de impacto en costo/plazo', 'Historial de respuestas', 'Integración con proyectos WBS']
  },
  {
    id: 'fuel',
    code: 'MOD-17',
    name: 'Combustible',
    section: 'Logística',
    icon: Fuel,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-400',
    purpose: 'Controlar el consumo de combustible por vehículo/equipo, el stock del batán y realizar reconciliaciones mensuales.',
    scope: 'Todo vehículo y equipo que consuma combustible de la empresa. Stock del batán o carga en surtidor externo.',
    responsible: 'Pañolero / Jefe de Obra / Administrador',
    process: [
      'Alta de vehículo/equipo: nombre, patente, tipo, capacidad del tanque, nivel de alerta.',
      'Registro de cargas: vehículo, fecha, litros, kilómetros, operador y origen (batán propio o surtidor externo).',
      'El sistema calcula automáticamente el consumo en L/100km.',
      'Los movimientos del batán (entrada por compra, salida por carga) controlan el stock.',
      'Cuando el stock baja del nivel de alerta, se genera una notificación.',
      'La reconciliación mensual compara el combustible comprado vs. el distribuido.',
      'Los reportes permiten analizar el costo de combustible por vehículo y por obra.'
    ],
    records: ['Cargas de combustible por vehículo', 'Movimientos del batán', 'Reconciliaciones mensuales', 'Consumos y rendimiento por equipo'],
    kpis: ['Stock actual del batán (litros)', 'Consumo mensual total', 'Costo por litro promedio', 'Vehículos con consumo anómalo'],
    features: ['Control de batán propio', 'Cálculo de consumo L/100km', 'Alertas de stock mínimo', 'Reconciliación mensual automática']
  },
  {
    id: 'project_budget',
    code: 'MOD-18',
    name: 'Proyectos & Presupuestos',
    section: 'Operaciones',
    icon: HardHat,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Gestionar el ciclo de vida de proyectos y elaborar presupuestos de obra detallados con estructura de APU (Análisis de Precios Unitarios).',
    scope: 'Todos los proyectos activos de la empresa. Presupuestos con recursos (materiales, mano de obra, equipos, subcontratos).',
    responsible: 'Gerente de Proyectos / Dirección',
    process: [
      'Se crea el proyecto con datos del cliente, CUIT, presupuesto total y fechas.',
      'El presupuesto se estructura en secciones y subsecciones (ordinal tipo 1.1.1).',
      'Cada ítem presupuestario se vincula a un recurso de la biblioteca de precios.',
      'Se calculan automáticamente los porcentajes de gastos generales, beneficio, financieros e impuestos.',
      'La biblioteca de recursos mantiene precios actualizados con fecha de última actualización.',
      'El visualizador IFC permite cargar modelos BIM en formato Industry Foundation Classes.',
      'La calculadora BIM cruza el modelo 3D con los precios del presupuesto.'
    ],
    records: ['Proyectos activos y completados', 'Presupuestos con versiones', 'Biblioteca de precios de recursos', 'Modelos BIM en formato IFC'],
    kpis: ['Proyectos activos', 'Desviación presupuesto vs. real', 'Recursos actualizados en el último mes', 'Margen promedio de propuestas'],
    features: ['APU con biblioteca de precios', 'Visualizador IFC/BIM integrado', 'Cálculo de indirectos automático', 'Versionado de presupuestos']
  },
  {
    id: 'documents',
    code: 'MOD-19',
    name: 'Documentos & Correo',
    section: 'Operaciones',
    icon: FolderOpen,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    purpose: 'Gestionar la documentación técnica y administrativa de los proyectos y generar cartas documentos y contratos en formato estandarizado.',
    scope: 'Documentación técnica, planos, habilitaciones, contratos y correspondencia formal de la empresa.',
    responsible: 'Administrador / Director de Obra',
    process: [
      'El módulo centraliza los pedidos de documentación por proyecto.',
      'Se generan cartas documentos con plantillas preconfiguradas de la empresa.',
      'Los contratos se generan en PDF con los datos del empleado desde el módulo RRHH.',
      'El estado de cada pedido evoluciona: Recopilando → Listo → Enviado → Respondido.',
      'Se registra la fecha límite de respuesta y las notas del seguimiento.'
    ],
    records: ['Pedidos de documentación', 'Cartas documentos generadas', 'Contratos de personal', 'Historial de correspondencia'],
    kpis: ['Documentos pendientes de entrega', 'Pedidos vencidos sin respuesta', 'Contratos generados en el período', 'Tiempo promedio de resolución'],
    features: ['Generación de cartas documentos', 'Contratos en PDF automáticos', 'Seguimiento de estado de documentos', 'Integración con datos de RRHH']
  },
  {
    id: 'monthly_report',
    code: 'MOD-20',
    name: 'Resumen Mensual',
    section: 'Tableros',
    icon: Calendar,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Generar el informe ejecutivo mensual consolidado con todas las métricas financieras y operativas de la empresa.',
    scope: 'Cierre mensual de todos los módulos. Resumen de facturación, gastos, asistencia, certificaciones y avance de obra.',
    responsible: 'Gerencia / Administración',
    process: [
      'Al fin de cada mes el administrador accede al módulo de Resumen Mensual.',
      'El sistema consolida automáticamente datos de facturación, gastos operativos, asistencia y certificaciones.',
      'Se compara el período actual vs. el anterior con variaciones porcentuales.',
      'El informe puede exportarse para enviar a la dirección y al estudio contable.',
      'Los snapshots de liquidez se guardan automáticamente para análisis histórico.'
    ],
    records: ['Informe ejecutivo mensual', 'Comparativos período a período', 'Snapshots de liquidez históricos', 'Datos exportados para contador'],
    kpis: ['Facturación total del mes', 'Gastos operativos totales', 'Certificaciones cobradas', 'Resultado operativo del período'],
    features: ['Consolidación automática multi-módulo', 'Comparativo período anterior', 'Snapshots de liquidez', 'Exportación para contador']
  },
  {
    id: 'opportunities',
    code: 'MOD-21',
    name: 'Pipeline de Oportunidades',
    section: 'Operaciones',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    purpose: 'Gestionar el embudo comercial de ECAR desde la detección de oportunidades hasta la adjudicación, con checklist de documentación y versiones de presupuesto.',
    scope: 'Obras nuevas, adicionales, servicios, mantenimiento, licitaciones y consultas. Cubre todo el flujo comercial de la Gerencia de Proyectos.',
    responsible: 'Gerente de Proyectos y Presupuestos (GPP)',
    process: [
      'Se registra la oportunidad con cliente, tipo de trabajo, monto estimado, prioridad y nivel de riesgo.',
      'Se completa el checklist de documentación: planos, pliego, memoria técnica, visita de obra, fotos, mediciones, condiciones de pago.',
      'La oportunidad avanza por 7 etapas del pipeline: Oportunidad → Relevamiento → En Presupuesto → Propuesta Enviada → Negociación → Adjudicada / Rechazada.',
      'En la etapa de presupuesto se pueden crear versiones con monto, margen y condiciones.',
      'Se documentan supuestos y exclusiones para cada propuesta.',
      'Al adjudicar se vincula con un proyecto y se genera la Carpeta de Inicio de Obra.',
    ],
    records: ['Pipeline de oportunidades', 'Versiones de presupuesto', 'Checklist de documentación', 'Historial de rechazos'],
    kpis: ['Oportunidades activas', 'Monto total del pipeline', 'Tasa de conversión', 'Tiempo promedio por etapa'],
    features: ['Vista Kanban con drag entre etapas', 'Vista lista con filtros', 'KPIs automáticos', 'Quick move entre etapas']
  },
  {
    id: 'purchase_orders',
    code: 'MOD-22',
    name: 'Órdenes de Compra / OT',
    section: 'Administración',
    icon: FileSignature,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Emitir OC/OT formales con numeración automática, detalle de ítems, flujo de aprobación por monto y seguimiento de entregas.',
    scope: 'Toda compra o contratación que supere caja chica. Tipos: compra de material, servicio/OT, alquiler de equipo.',
    responsible: 'Gerente de Compras / GG (aprobación)',
    process: [
      'Se crea la OC con número secuencial automático (OC-0001).',
      'Se cargan ítems con descripción, cantidad, unidad y precio unitario.',
      'Si el monto supera $5.000.000, requiere aprobación de GG.',
      'Flujo: Borrador → Pend. Aprobación → Aprobada → Emitida → Entregada → Cerrada.',
      'Las OC urgentes se marcan con bandera roja y requieren justificación.',
    ],
    records: ['OC/OT emitidas', 'Detalle de ítems', 'Aprobaciones de GG', 'Entregas registradas'],
    kpis: ['OC abiertas', 'Monto comprometido', 'OC urgentes', 'Entregas pendientes'],
    features: ['Numeración automática', 'Ítems con subtotales', 'Aprobación por umbral', 'Flag de urgencia']
  },
  {
    id: 'nonconformities',
    code: 'MOD-23',
    name: 'No Conformidades',
    section: 'Operaciones',
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    purpose: 'Registrar desvíos de procedimientos con ciclo PDCA: detección, análisis de causa raíz, acción correctiva, verificación y lección aprendida.',
    scope: 'NC de compras, obra, logística, proveedores, documentación y seguridad. Compatible ISO 9001.',
    responsible: 'Responsable del área / Calidad',
    process: [
      'Registro de NC con número automático (NC-001), categoría, área e impacto.',
      'Documentación del desvío con evidencia fotográfica.',
      'Acción inmediata de contención.',
      'Análisis de causa raíz (5 porqué).',
      'Definición e implementación de acción correctiva.',
      'Verificación de eficacia y cierre con lección aprendida.',
    ],
    records: ['Registro numerado de NC', 'Evidencias', 'Acciones correctivas', 'Lecciones aprendidas'],
    kpis: ['NC abiertas', 'Tiempo promedio de cierre', 'NC por categoría', 'Reincidencia'],
    features: ['Ciclo PDCA completo', 'Numeración automática', 'Filtros por estado/categoría', 'Lecciones aprendidas']
  },
  {
    id: 'scope_changes',
    code: 'MOD-24',
    name: 'Adicionales & Cambios de Alcance',
    section: 'Operaciones',
    icon: FileSignature,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    purpose: 'Registrar y evaluar adicionales, cambios de alcance, desvíos e interferencias con evaluación de impacto técnico, económico y de plazo.',
    scope: 'Modificaciones al alcance original de un proyecto. Origen: cliente, inspección, obra o interno.',
    responsible: 'GPP / Gerente de Obras',
    process: [
      'Detección y registro del cambio con tipo y origen.',
      'Evaluación de impacto técnico, económico ($) y en plazo (días).',
      'Aprobación formal por GG cuando corresponda.',
      'Ejecución solo post-aprobación.',
      'Vinculación con presupuesto original para defensa de reclamos.',
    ],
    records: ['Cambios registrados', 'Evaluaciones de impacto', 'Aprobaciones', 'Evidencia documental'],
    kpis: ['Cambios pendientes', 'Impacto económico total', 'Cambios por tipo/origen', 'Desviación de plazo'],
    features: ['Clasificación por tipo y origen', 'Triple impacto (técnico/económico/plazo)', 'Flujo de aprobación', 'Warning de ejecución sin registro']
  },
  {
    id: 'supplier_eval',
    code: 'MOD-25',
    name: 'Evaluación de Proveedores',
    section: 'Administración',
    icon: ClipboardCheck,
    color: 'text-ecar-blue',
    bgColor: 'bg-slate-50',
    borderColor: 'border-ecar-blue',
    purpose: 'Calificar proveedores periódicamente según 5 criterios estandarizados con recomendación automática basada en puntaje.',
    scope: 'Todo proveedor operado en el período. Evaluación mensual recomendada.',
    responsible: 'Gerente de Compras',
    process: [
      'Selección del proveedor y período.',
      'Calificación de 5 criterios (1-5): entrega, calidad, precio, documentación, respuesta a reclamos.',
      'Cálculo automático de puntaje general.',
      'Recomendación automática: Recomendado (≥4), Condicional (≥3), No Recomendado (≥2), Bloqueado (<2).',
      'Registro de cantidad de NC del proveedor en el período.',
    ],
    records: ['Evaluaciones por proveedor/período', 'Historial de puntajes', 'Ranking de proveedores', 'NC vinculadas'],
    kpis: ['Proveedores evaluados', 'Puntaje promedio', 'Proveedores bloqueados', 'NC por proveedor'],
    features: ['Calificación con estrellas 1-5', 'Recomendación automática', 'Resumen por proveedor', 'Historial de evaluaciones']  },
  {
    id: 'logistics',
    code: 'MOD-05A',
    name: 'Logística y Pañol',
    section: 'Gerencia Logística',
    icon: Warehouse,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    purpose: 'Gestión centralizada de depósitos, recepción de mercadería y transferencias a obras, asegurando trazabilidad física del inventario.',
    scope: 'Gerencia de Logística y Encargados de Pañol.',
    responsible: 'Gerencia de Logística / Pañolero',
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

];

const AI_INTEGRATIONS = [
  {
    name: 'Rombo — WhatsApp Bot',
    icon: Bot,
    color: 'bg-green-500',
    description: 'Asistente de IA conectado a WhatsApp que permite operar el ERP en lenguaje natural desde el celular. Powered by GPT-4o.',
    capabilities: [
      'Cargar cheques dictando datos en texto',
      'Procesar facturas por foto con OCR',
      'Registrar gastos operativos',
      'Consultar saldos y cheques a vencer',
      'Recibir alertas de vencimientos',
      'Registrar partes diarios de obra'
    ]
  },
  {
    name: 'OCR de Facturas',
    icon: FileText,
    color: 'bg-ecar-blue',
    description: 'Edge Function "process-invoice" que usa Gemini AI para extraer datos estructurados de fotos y PDFs de facturas.',
    capabilities: [
      'Extracción de CUIT del proveedor',
      'Reconocimiento de tipo de comprobante (A/B/C)',
      'Extracción de punto de venta y número',
      'Cálculo de neto, IVA y total',
      'Clasificación automática compra/venta',
      'Asociación automática con proveedor existente'
    ]
  },
  {
    name: 'OCR de Cheques',
    icon: Landmark,
    color: 'bg-emerald-500',
    description: 'Edge Function "extract-cheque-data" que lee fotos de cheques físicos y extrae todos sus datos automáticamente.',
    capabilities: [
      'Número de cheque',
      'Banco emisor',
      'Monto en números y letras',
      'Fecha de emisión y vencimiento',
      'Beneficiario del cheque',
      'Clasificación físico vs. eCheq'
    ]
  }
];

const ARCH_ITEMS = [
  { icon: Globe, label: 'Frontend', desc: 'React 18 + Vite + TypeScript', color: 'bg-blue-500' },
  { icon: Database, label: 'Base de Datos', desc: 'Supabase (PostgreSQL)', color: 'bg-green-500' },
  { icon: Server, label: 'Edge Functions', desc: 'Deno (TypeScript)', color: 'bg-ecar-blue' },
  { icon: Cpu, label: 'IA / ML', desc: 'Gemini AI + GPT-4o', color: 'bg-orange-500' },
  { icon: Lock, label: 'Seguridad', desc: 'RLS + JWT + Row Level Security', color: 'bg-red-500' },
  { icon: Zap, label: 'Notificaciones', desc: 'WhatsApp API + Scheduler', color: 'bg-amber-500' },
];

const ROLES = [
  { role: 'Administrador (Admin)', perms: ['Acceso total a todos los módulos', 'Alta y baja de usuarios', 'Aprobación de documentos', 'Exportación de datos', 'Configuración del sistema'], color: 'bg-amber-100 border-amber-300' },
  { role: 'Operario', perms: ['Acceso solo a módulos asignados por el Admin', 'Registro de asistencia QR', 'Carga de partes diarios', 'Consulta de inventario asignado', 'Sin acceso a datos financieros'], color: 'bg-blue-100 border-blue-300' },
];

/* ═══════════════════════════════════════════════════════════════ */
/*               HELPER: ASCII normalizer para jsPDF              */
/* ═══════════════════════════════════════════════════════════════ */

/** Convierte caracteres con tildes y símbolos especiales a ASCII
 *  para compatibilidad con la fuente Helvetica de jsPDF. */
const t = (s: string): string =>
  s
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
    .replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U')
    .replace(/à/g, 'a').replace(/è/g, 'e').replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ù/g, 'u')
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N').replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/·/g, '-').replace(/—/g, '-').replace(/–/g, '-').replace(/→/g, '->').replace(/×/g, 'x')
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x00-\xFF]/g, '?');

/* ═══════════════════════════════════════════════════════════════ */
/*                       COMPONENTE PRINCIPAL                      */
/* ═══════════════════════════════════════════════════════════════ */

export const ManualModule: React.FC = () => {
  const manualRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [progress, setProgress] = useState(0);

  const handleDownloadPDF = async () => {
    if (!manualRef.current || isGenerating) return;
    setIsGenerating(true);
    setProgress(5);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const pageH = 297;
      const margin = 15;
      const contentW = pageW - margin * 2;

      // ── COLOR PALETTE ──
      const BLUE = [17, 92, 156] as [number, number, number];
      const DARK = [15, 30, 50] as [number, number, number];
      const GRAY = [100, 110, 125] as [number, number, number];
      const LIGHT = [245, 247, 250] as [number, number, number];
      const WHITE: [number, number, number] = [255, 255, 255];
      const GREEN = [34, 197, 94] as [number, number, number];

      const DARK_BLUE = [15, 45, 82] as [number, number, number];
      const RED_COLOR = [200, 30, 30] as [number, number, number];

      const removeWhiteBackground = (imgSrc: string): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = imgSrc;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(imgSrc);
            
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              if (r > 240 && g > 240 && b > 240) {
                data[i+3] = 0;
              }
            }
            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(imgSrc);
        });
      };

      let currentPage = 1;
      const addNewPage = () => {
        pdf.addPage();
        currentPage++;
        
        pdf.setFillColor(250, 251, 252);
        pdf.rect(0, 0, pageW, pageH, 'F');

        // Banners Superiores (Escalados)
        pdf.setFillColor(...DARK_BLUE);
        pdf.triangle(0, 0, pageW, 0, pageW, 12, 'F');
        pdf.triangle(0, 0, pageW, 12, 0, 8, 'F');

        pdf.setFillColor(...RED_COLOR);
        pdf.triangle(0, 8, pageW, 12, pageW, 16, 'F');
        pdf.triangle(0, 8, pageW, 16, 0, 12, 'F');

        // Banners Inferiores (Escalados)
        pdf.setFillColor(...DARK_BLUE);
        pdf.triangle(0, pageH, 0, pageH - 6, pageW, pageH - 12, 'F');
        pdf.triangle(0, pageH, pageW, pageH - 12, pageW, pageH, 'F');

        pdf.setFillColor(...RED_COLOR);
        pdf.triangle(0, pageH - 6, 0, pageH - 12, pageW, pageH - 16, 'F');
        pdf.triangle(0, pageH - 6, pageW, pageH - 16, pageW, pageH - 12, 'F');

        // Textos del Footer
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(t('ECAR ERP - Manual de Procedimientos del Sistema'), margin, pageH - 4);
        pdf.text(`PRO-ECAR-SYS-001 | Rev. 1.0 | ${new Date().toLocaleDateString('es-AR')}`, pageW - margin, pageH - 4, { align: 'right' });
        pdf.text(t(`Pag. ${currentPage}`), pageW / 2, pageH - 4, { align: 'center' });
      };

      // ════════════ PORTADA NUEVA (DISEÑO PREMIUM) ════════════
      // Fondo muy claro / blanco
      pdf.setFillColor(250, 251, 252);
      pdf.rect(0, 0, pageW, pageH, 'F');

      const FONT_NAME = 'helvetica'; // Fallback limpio para Calibri

      // Banners Superiores
      pdf.setFillColor(...DARK_BLUE);
      pdf.triangle(0, 0, pageW, 0, pageW, 55, 'F');
      pdf.triangle(0, 0, pageW, 55, 0, 40, 'F');

      pdf.setFillColor(...RED_COLOR);
      pdf.triangle(0, 40, pageW, 55, pageW, 70, 'F');
      pdf.triangle(0, 40, pageW, 70, 0, 55, 'F');

      // Banners Inferiores
      pdf.setFillColor(...DARK_BLUE);
      pdf.triangle(0, pageH, 0, pageH - 20, pageW, pageH - 35, 'F');
      pdf.triangle(0, pageH, pageW, pageH - 35, pageW, pageH, 'F');

      pdf.setFillColor(...RED_COLOR);
      pdf.triangle(0, pageH - 20, 0, pageH - 35, pageW, pageH - 50, 'F');
      pdf.triangle(0, pageH - 20, pageW, pageH - 50, pageW, pageH - 35, 'F');

      // Logo ECAR
      const logoImg = new Image();
      logoImg.src = '/logoECAR.png';
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          // Sombra
          pdf.setFillColor(0, 0, 0, 0.05);
          pdf.roundedRect(16, 16, 75, 45, 3, 3, 'F');
          // Caja blanca
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(15, 15, 75, 45, 3, 3, 'F');
          pdf.addImage(logoImg, 'PNG', 18, 20, 69, 35);
          resolve();
        };
        logoImg.onerror = () => resolve();
      });

      // Título Principal
      pdf.setTextColor(...DARK_BLUE);
      pdf.setFontSize(22);
      pdf.setFont(FONT_NAME, 'bold');
      pdf.text(t('MANUAL DE'), 15, 90);
      pdf.text(t('ORGANIZACIÓN, ÍNDICE'), 15, 100);
      pdf.setTextColor(...RED_COLOR);
      pdf.text(t('Y MAPA DE PROCESOS'), 15, 110);

      // Divisor
      pdf.setDrawColor(...DARK_BLUE);
      pdf.setLineWidth(0.8);
      pdf.line(15, 118, 140, 118);

      // Subtítulos
      pdf.setTextColor(100, 110, 125);
      pdf.setFontSize(9);
      pdf.setFont(FONT_NAME, 'bold');
      pdf.text(t('Gerencia General - Proyectos y Presupuestos - Compras - Logística - Obras'), 15, 128);

      pdf.setFontSize(8);
      pdf.setFont(FONT_NAME, 'normal');
      const subtitleDesc = pdf.splitTextToSize(
        'Primera etapa: arquitectura del sistema, mapa general de procesos y lógica de comunicación entre gerencias.',
        150
      );
      pdf.text(subtitleDesc.map(t), 15, 134);

      // Función para dibujar cajas de información
      const drawInfoBox = (x: number, y: number, w: number, h: number, title: string, value: string) => {
        pdf.setFillColor(0, 0, 0, 0.03);
        pdf.roundedRect(x + 1, y + 1, w, h, 2, 2, 'F');
        pdf.setDrawColor(220, 225, 230);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, w, h, 2, 2, 'FD');
        pdf.setTextColor(...RED_COLOR);
        pdf.setFontSize(6.5);
        pdf.setFont(FONT_NAME, 'bold');
        pdf.text(t(title), x + 4, y + 5);
        pdf.setTextColor(...DARK_BLUE);
        pdf.setFontSize(7.5);
        pdf.setFont(FONT_NAME, 'bold');
        const lines = pdf.splitTextToSize(t(value), w - 8);
        pdf.text(lines, x + 4, y + 10);
      };

      drawInfoBox(15, 150, 62, 14, 'CÓDIGO', 'ECAR-MAN-GG-001');
      drawInfoBox(82, 150, 62, 14, 'VERSIÓN', 'v2.0 - Normalizado');
      drawInfoBox(15, 168, 62, 14, 'ENFOQUE', 'Procesos - trazabilidad - mejora continua');
      drawInfoBox(82, 168, 62, 14, 'USO', 'Documento interno de conducción');

      // Caja Criterio Rector
      const crY = 195;
      pdf.setFillColor(0, 0, 0, 0.03);
      pdf.roundedRect(16, crY + 1, 128, 28, 2, 2, 'F');
      pdf.setDrawColor(220, 225, 230);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, crY, 128, 28, 2, 2, 'FD');
      
      pdf.setTextColor(...RED_COLOR);
      pdf.setFontSize(7);
      pdf.setFont(FONT_NAME, 'bold');
      pdf.text(t('CRITERIO RECTOR'), 20, crY + 6);
      
      pdf.setTextColor(...DARK_BLUE);
      pdf.setFontSize(8.5);
      pdf.setFont(FONT_NAME, 'normal');
      const crText = pdf.splitTextToSize(
        'Cada gerencia debe saber qué recibe, qué transforma, qué entrega, a quién se lo entrega, con qué evidencia y bajo qué criterio será evaluada.',
        118
      );
      pdf.text(crText.map(t), 20, crY + 12);

      // Logo Rombo Mascota sin fondo
      const transparentRombo = await removeWhiteBackground('/rombo.jpeg');
      const romboImg = new Image();
      romboImg.src = transparentRombo;
      await new Promise<void>((resolve) => {
        romboImg.onload = () => {
          // colocar a la derecha, encima del banner inferior
          pdf.addImage(romboImg, 'PNG', 125, 175, 75, 95);
          resolve();
        };
        romboImg.onerror = () => resolve();
      });

      setProgress(10);

      // ════════════ PÁGINA 2: ÍNDICE ════════════
      addNewPage();
      let y = 20;

      pdf.setFillColor(...LIGHT);
      pdf.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
      pdf.setTextColor(...BLUE);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('INDICE DE CONTENIDOS'), margin + 5, y + 8);
      y += 18;

      const tocSections = [
        { num: '1.', title: 'Introducción y Alcance del Sistema', pg: '3' },
        { num: '2.', title: 'Arquitectura Técnica', pg: '4' },
        { num: '3.', title: 'Gestión de Accesos y Roles', pg: '5' },
        { num: '4.', title: 'Integración con Inteligencia Artificial', pg: '6' },
        
        { num: '5.', title: 'TABLEROS', pg: '' },
        { num: '5.1', title: 'Dashboard BI (MOD-01)', pg: '7' },
        { num: '5.2', title: 'Tablero de Liquidez (MOD-02)', pg: '8' },
        { num: '5.3', title: 'Resumen Mensual (MOD-20)', pg: '9' },
        { num: '5.4', title: 'Reporte Gerencia General (MOD-11)', pg: '10' },
        
        { num: '6.', title: 'ADMINISTRACIÓN Y FINANZAS', pg: '' },
        { num: '6.1', title: 'Compras & Libro IVA (MOD-03)', pg: '11' },
        { num: '6.2', title: 'Finanzas & Tesorería (MOD-04)', pg: '12' },
        { num: '6.3', title: 'Alertas & Obligaciones (MOD-05)', pg: '13' },
        { num: '6.4', title: 'Facturación ARCA (MOD-06)', pg: '14' },
        { num: '6.5', title: 'Gastos Operativos (MOD-07)', pg: '15' },
        { num: '6.6', title: 'Certificaciones ICC (MOD-08)', pg: '16' },
        { num: '6.7', title: 'Pagos y Egresos (MOD-03E)', pg: '17' },
        
        { num: '7.', title: 'PERSONAL Y RRHH', pg: '' },
        { num: '7.1', title: 'RRHH & Legajos (MOD-09)', pg: '18' },
        
        { num: '8.', title: 'LOGÍSTICA Y FLOTA', pg: '' },
        { num: '8.1', title: 'Inventario & Pañol (MOD-10)', pg: '19' },
        { num: '8.2', title: 'Pedidos de Compra (MOD-11)', pg: '20' },
        { num: '8.3', title: 'Combustible (MOD-17)', pg: '21' },
        { num: '8.4', title: 'Logística y Acopios (MOD-05A)', pg: '22' },
        { num: '8.5', title: 'Gestión de Flota y Taller (MOD-05B)', pg: '23' },
        
        { num: '9.', title: 'OPERACIONES Y PROYECTOS', pg: '' },
        { num: '9.1', title: 'Parte Diario de Obra (MOD-12)', pg: '24' },
        { num: '9.2', title: 'Planificación WBS & Gantt (MOD-13)', pg: '25' },
        { num: '9.3', title: 'Seguridad & Incidentes (MOD-14)', pg: '26' },
        { num: '9.4', title: 'Inspecciones & Calidad (MOD-15)', pg: '27' },
        { num: '9.5', title: 'Consultas de Obra RFI (MOD-16)', pg: '28' },
        { num: '9.6', title: 'Proyectos & Presupuestos (MOD-18)', pg: '29' },
        { num: '9.7', title: 'Documentos & Correo (MOD-19)', pg: '30' },
        { num: '9.8', title: 'Introducción GPP (MOD-02A)', pg: '31' },
        
        { num: '10.', title: 'COMUNICACIONES Y SISTEMA', pg: '' },
        { num: '10.1', title: 'Comunicaciones (MOD-10)', pg: '32' },
        { num: '10.2', title: 'Guía Rápida (MOD-98)', pg: '33' },
        { num: '10.3', title: 'Implementación (MOD-97)', pg: '34' },
        { num: '10.4', title: 'Gestión de Usuarios (MOD-99A)', pg: '35' },
        { num: '10.5', title: 'Actividad de Usuarios (MOD-99B)', pg: '36' },

        { num: '11.', title: 'Seguridad de la Información', pg: '37' },
        { num: '12.', title: 'Control de Documentos', pg: '38' },
        { num: '13.', title: 'Glosario y Referencias', pg: '39' },
      ];

      tocSections.forEach((item) => {
        if (y > pageH - 20) { addNewPage(); y = 20; }
        const isSection = !item.num.includes('.');
        const isMain = item.num.endsWith('.') && item.pg === '';

        if (isMain) {
          y += 2;
          pdf.setFillColor(...BLUE);
          pdf.roundedRect(margin, y - 4, contentW, 8, 1, 1, 'F');
          pdf.setTextColor(...WHITE);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.text(t(`${item.num}  ${item.title}`), margin + 3, y + 1);
          y += 8;
        } else if (isSection && item.pg !== '') {
          pdf.setFillColor(230, 237, 245);
          pdf.rect(margin, y - 4, contentW, 7, 'F');
          pdf.setTextColor(...DARK);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.text(t(`${item.num}  ${item.title}`), margin + 3, y + 0.5);
          pdf.text(item.pg, pageW - margin - 2, y + 0.5, { align: 'right' });
          y += 7;
        } else if (item.pg !== '') {
          pdf.setTextColor(...GRAY);
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          pdf.text(t(`    ${item.num}  ${item.title}`), margin + 3, y);
          pdf.setTextColor(...BLUE);
          pdf.text(item.pg, pageW - margin - 2, y, { align: 'right' });
          // Dots
          pdf.setTextColor(200, 210, 220);
          const dotsStart = margin + 6 + pdf.getTextWidth(`    ${item.num}  ${item.title}`) + 2;
          const dotsEnd = pageW - margin - 10;
          let dx = dotsStart;
          while (dx < dotsEnd) { pdf.text('.', dx, y); dx += 2; }
          y += 6;
        }
      });

      setProgress(25);

      // ════════════ PÁGINA 3: INTRODUCCIÓN ════════════
      addNewPage();
      y = 20;

      const sectionHeader = (title: string, subtitle?: string) => {
        pdf.setFillColor(...BLUE);
        pdf.roundedRect(margin, y, contentW, 14, 2, 2, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(title), margin + 5, y + 9);
        if (subtitle) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.text(t(subtitle), pageW - margin - 3, y + 9, { align: 'right' });
        }
        y += 18;
      };


      sectionHeader(t('1. INTRODUCCION Y ALCANCE DEL SISTEMA'), t('Seccion 1 de 12'));


      pdf.setTextColor(...DARK);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('1.1 Proposito del Documento'), margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...GRAY);
      const intro1 = pdf.splitTextToSize(
        'El presente documento establece el Manual de Procedimientos del Sistema ERP ECAR para la gestion integral de empresas del sector construccion. Su proposito es describir exhaustivamente los procesos, responsabilidades, registros e indicadores de cada modulo del sistema.',
        contentW
      );
      pdf.text(intro1.map(t), margin, y);
      y += intro1.length * 4.5 + 4;

      pdf.setTextColor(...DARK);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(t('1.2 Alcance'), margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...GRAY);
      const intro2 = pdf.splitTextToSize(
        `Este manual aplica a la totalidad del sistema ERP ECAR compuesto por ${MODULES_DATA.length} módulos funcionales organizados en cinco áreas: Tableros Ejecutivos, Administración, Personal, Logística y Operaciones. Cubre también la integración con la Inteligencia Artificial (Rombo), las Edge Functions de procesamiento automático y la infraestructura tecnológica de soporte.`,
        contentW
      );
      pdf.text(intro2.map(t), margin, y);
      y += intro2.length * 4.5 + 6;

      // KPI cards del sistema
      pdf.setFillColor(...LIGHT);
      pdf.roundedRect(margin, y, contentW, 28, 2, 2, 'F');
      pdf.setTextColor(...BLUE);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('METRICAS DEL SISTEMA'), margin + 5, y + 7);

      const sysKpis = [
        { label: 'Módulos', value: `${MODULES_DATA.length}` },
        { label: 'Edge Functions', value: '6' },
        { label: 'Áreas cubiertas', value: '5' },
        { label: 'Tecnología IA', value: 'GPT-4o + Gemini' },
      ];
      sysKpis.forEach((kpi, i) => {
        const kx = margin + 5 + i * (contentW / 4);
        pdf.setFillColor(...WHITE);
        pdf.roundedRect(kx, y + 11, contentW / 4 - 4, 13, 1, 1, 'F');
        pdf.setTextColor(...BLUE);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(kpi.value), kx + 4, y + 20);
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(t(kpi.label), kx + 4, y + 23);
      });
      y += 34;

      // Normas de referencia
      pdf.setTextColor(...DARK);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(t('1.3 Referencias Normativas'), margin, y);
      y += 6;
      const norms = [
        'ISO 27001:2022 — Seguridad de la Información',
        'Ley 25.506 — Firma Digital Argentina',
        'RG AFIP/ARCA vigente — Facturación electrónica y CAE',
        'OSHA 29 CFR 1926 — Seguridad en Construcción (referencia internacional)',
      ];
      norms.forEach((norm) => {
        if (y > pageH - 20) { addNewPage(); y = 20; }
        pdf.setFillColor(...LIGHT);
        pdf.roundedRect(margin, y, contentW, 7, 1, 1, 'F');
        pdf.setTextColor(...DARK);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(t(`>  ${norm}`), margin + 3, y + 4.5);
        y += 9;
      });

      setProgress(35);

      // ════════════ PÁGINA: ARQUITECTURA ════════════
      addNewPage();
      y = 20;
      sectionHeader(t('2. ARQUITECTURA TECNICA DEL SISTEMA'), t('Seccion 2 de 12'));

      pdf.setTextColor(...DARK);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const archDesc = pdf.splitTextToSize(
        'ECAR es un sistema web progresivo (PWA) basado en React 18 + Vite con TypeScript, respaldado por Supabase como plataforma Backend-as-a-Service. La arquitectura garantiza disponibilidad 99.9%, encriptación en tránsito (TLS 1.3) y en reposo, Row Level Security en todas las tablas y autenticación JWT con tokens de sesión gestionados por Supabase Auth.',
        contentW
      );
      pdf.text(archDesc.map(t), margin, y);
      y += archDesc.length * 4.5 + 6;

      // Architecture diagram
      const archCols = 3;
      const archW = (contentW - 6) / archCols;
      ARCH_ITEMS.forEach((item, i) => {
        const col = i % archCols;
        const row = Math.floor(i / archCols);
        const ax = margin + col * (archW + 3);
        const ay = y + row * 22;
        if (y + row * 22 > pageH - 30) return;
        pdf.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
        pdf.roundedRect(ax, ay, archW, 18, 2, 2, 'F');
        pdf.setFillColor(...BLUE);
        pdf.roundedRect(ax + 2, ay + 2, 8, 8, 1, 1, 'F');
        pdf.setTextColor(...DARK);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(item.label), ax + 13, ay + 7);
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(item.desc, archW - 15);
        pdf.text(descLines.map(t), ax + 13, ay + 12);
      });
      y += Math.ceil(ARCH_ITEMS.length / archCols) * 22 + 6;

      // Edge Functions
      pdf.setTextColor(...DARK);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('2.1 Edge Functions (Serverless)'), margin, y);
      y += 6;

      const edgeFns = [
        { name: 'process-invoice', desc: 'OCR de facturas con Gemini AI. Extrae CUIT, tipo, monto, IVA y clasificación compra/venta.' },
        { name: 'extract-cheque-data', desc: 'OCR de cheques físicos. Extrae banco, número, monto, beneficiario y fechas.' },
        { name: 'rombo-chat', desc: 'Agente conversacional en lenguaje natural para operaciones vía web. Powered by GPT-4o.' },
        { name: 'rombo-whatsapp', desc: 'Webhook de WhatsApp. Recibe mensajes, procesa intención y ejecuta operaciones en el ERP.' },
        { name: 'send-whatsapp', desc: 'Envío de mensajes WhatsApp salientes para notificaciones y alertas automáticas.' },
        { name: 'process-reminders', desc: 'Scheduler de recordatorios. Evalúa obligaciones próximas y dispara alertas por WhatsApp.' },
      ];
      edgeFns.forEach((fn) => {
        if (y > pageH - 25) { addNewPage(); y = 20; }
        pdf.setFillColor(240, 245, 255);
        pdf.roundedRect(margin, y, contentW, 14, 1, 1, 'F');
        pdf.setFillColor(...BLUE);
        pdf.roundedRect(margin + 2, y + 3, 3, 8, 0.5, 0.5, 'F');
        pdf.setTextColor(...BLUE);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(fn.name), margin + 8, y + 7);
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const fnDesc = pdf.splitTextToSize(fn.desc, contentW - 10);
        pdf.text(fnDesc.map(t), margin + 8, y + 11);
        y += 16;
      });

      setProgress(45);

      // ════════════ PÁGINA: ROLES ════════════
      addNewPage();
      y = 20;
      sectionHeader(t('3. GESTION DE ACCESOS Y ROLES'), t('Seccion 3 de 12'));

      pdf.setTextColor(...DARK);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const rolesDesc = pdf.splitTextToSize(
        'El sistema implementa control de acceso basado en roles (RBAC) con dos perfiles predefinidos. La gestión de usuarios es realizada exclusivamente por usuarios con rol Administrador desde el panel de perfiles. Cada usuario tiene asignada una lista de módulos permitidos que restringe la navegación y el acceso a datos.',
        contentW
      );
      pdf.text(rolesDesc.map(t), margin, y);
      y += rolesDesc.length * 4.5 + 6;

      ROLES.forEach((roleItem) => {
        if (y > pageH - 60) { addNewPage(); y = 20; }
        const roleH = 12 + roleItem.perms.length * 7;
        pdf.setFillColor(245, 248, 252);
        pdf.roundedRect(margin, y, contentW, roleH, 2, 2, 'F');
        pdf.setFillColor(...BLUE);
        pdf.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
        pdf.roundedRect(margin, y + 8, contentW, 4, 0, 0, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(roleItem.role), margin + 5, y + 8);
        let py = y + 17;
        roleItem.perms.forEach((perm) => {
          pdf.setFillColor(...GREEN);
          pdf.circle(margin + 5, py - 1.5, 1.5, 'F');
          pdf.setTextColor(...DARK);
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          pdf.text(t(perm), margin + 10, py);
          py += 7;
        });
        y += roleH + 6;
      });

      // Security features
      pdf.setTextColor(...DARK);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('3.1 Caracteristicas de Seguridad'), margin, y);
      y += 6;
      const secFeats = [
        'Row Level Security (RLS) habilitada en todas las tablas de la base de datos',
        'Autenticación JWT con tokens de corta duración (sesión)',
        'Todas las comunicaciones cifradas con TLS 1.3',
        'Multi-tenancy: datos de cada empresa completamente aislados por tenant_id',
        'Logs de acceso y auditoría en Supabase (PostgreSQL WAL)',
        'Almacenamiento de archivos en buckets privados con permisos configurados por RLS',
      ];
      secFeats.forEach((feat) => {
        if (y > pageH - 20) { addNewPage(); y = 20; }
        pdf.setFillColor(...LIGHT);
        pdf.roundedRect(margin, y, contentW, 7, 1, 1, 'F');
        pdf.setTextColor(...DARK);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(t(`-  ${feat}`), margin + 3, y + 4.5);
        y += 9;
      });

      setProgress(55);

      // ════════════ PÁGINAS: IA ════════════
      addNewPage();
      y = 20;
      sectionHeader(t('4. INTEGRACION CON INTELIGENCIA ARTIFICIAL'), t('Seccion 4 de 12'));

      AI_INTEGRATIONS.forEach((ai) => {
        if (y > pageH - 80) { addNewPage(); y = 20; }
        const capH = 18 + ai.capabilities.length * 7;
        pdf.setFillColor(240, 245, 255);
        pdf.roundedRect(margin, y, contentW, capH, 2, 2, 'F');
        pdf.setFillColor(...BLUE);
        pdf.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
        pdf.roundedRect(margin, y + 8, contentW, 4, 0, 0, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(ai.name), margin + 5, y + 8.5);

        const aiDesc = pdf.splitTextToSize(ai.description, contentW - 6);
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'italic');
        pdf.text(aiDesc, margin + 5, y + 17);
        let cy = y + 17 + aiDesc.length * 4.5 + 2;
        ai.capabilities.forEach((cap) => {
          pdf.setFillColor(...BLUE);
          pdf.circle(margin + 7, cy - 1.5, 1.5, 'F');
          pdf.setTextColor(...DARK);
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          pdf.text(cap, margin + 12, cy);
          cy += 7;
        });
        y += capH + 6;
      });

      setProgress(65);

      // ════════════ PÁGINAS DE MÓDULOS ════════════
      let modProgress = 0;
      for (const mod of MODULES_DATA) {
        addNewPage();
        y = 20;
        modProgress++;
        setProgress(65 + Math.round((modProgress / MODULES_DATA.length) * 25));

        // Module header
        pdf.setFillColor(...BLUE);
        pdf.roundedRect(margin, y, contentW, 16, 2, 2, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(`${mod.code} - ${mod.name}`), margin + 5, y + 7);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(180, 210, 240);
        pdf.text(t(`Seccion: ${mod.section}`), margin + 5, y + 13);
        pdf.text(t(`Responsable: ${mod.responsible}`), pageW - margin - 3, y + 13, { align: 'right' });
        y += 20;

        // Purpose & Scope box
        pdf.setFillColor(240, 248, 255);
        pdf.roundedRect(margin, y, contentW, 28, 2, 2, 'F');
        pdf.setTextColor(...BLUE);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('PROPOSITO'), margin + 4, y + 5);
        const purpText = pdf.splitTextToSize(mod.purpose, contentW - 8);
        pdf.setTextColor(...DARK);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(purpText.map(t), margin + 4, y + 10);

        pdf.setTextColor(...BLUE);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('ALCANCE'), margin + 4, y + 22);
        const scopeText = pdf.splitTextToSize(mod.scope, contentW - 8);
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(scopeText, margin + 4, y + 27);
        y += 32;

        // Process steps
        if (y > pageH - 60) { addNewPage(); y = 20; }
        pdf.setTextColor(...DARK);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('DESCRIPCION DEL PROCESO'), margin, y);
        y += 6;

        mod.process.forEach((step, si) => {
          if (y > pageH - 22) { addNewPage(); y = 20; }
          const stepText = pdf.splitTextToSize(step, contentW - 14);
          const stepH = Math.max(10, stepText.length * 4.5 + 4);
          const isOdd = si % 2 === 0;
          pdf.setFillColor(isOdd ? 247 : 252, isOdd ? 250 : 254, isOdd ? 255 : 255);
          pdf.roundedRect(margin, y, contentW, stepH, 1, 1, 'F');
          pdf.setFillColor(...BLUE);
          pdf.circle(margin + 6, y + stepH / 2, 3.5, 'F');
          pdf.setTextColor(...WHITE);
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${si + 1}`, margin + 4.5, y + stepH / 2 + 2);
          pdf.setTextColor(...DARK);
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          pdf.text(stepText.map(t), margin + 13, y + 4.5);
          y += stepH + 2;
        });

        y += 4;

        // Two-column: Records & KPIs
        if (y > pageH - 55) { addNewPage(); y = 20; }
        const colW = (contentW - 4) / 2;

        // Records col
        pdf.setFillColor(...LIGHT);
        pdf.roundedRect(margin, y, colW, 7, 1, 1, 'F');
        pdf.setTextColor(...BLUE);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('REGISTROS QUE GENERA'), margin + 3, y + 5);
        y += 9;
        let recordY = y;
        mod.records.forEach((rec) => {
          if (recordY > pageH - 20) return;
          pdf.setFillColor(250, 252, 255);
          pdf.roundedRect(margin, recordY, colW, 8, 1, 1, 'F');
          pdf.setTextColor(...GRAY);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          const recLines = pdf.splitTextToSize(rec, colW - 8);
          pdf.text(recLines.map(t), margin + 5, recordY + 5);
          recordY += 10;
        });

        // KPIs col
        const kpiStartY = y - 9;
        pdf.setFillColor(...LIGHT);
        pdf.roundedRect(margin + colW + 4, kpiStartY, colW, 7, 1, 1, 'F');
        pdf.setTextColor(...BLUE);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('INDICADORES CLAVE (KPIs)'), margin + colW + 7, kpiStartY + 5);
        let kpiY = kpiStartY + 9;
        mod.kpis.forEach((kpi) => {
          if (kpiY > pageH - 20) return;
          pdf.setFillColor(250, 252, 255);
          pdf.roundedRect(margin + colW + 4, kpiY, colW, 8, 1, 1, 'F');
          pdf.setFillColor(...BLUE);
          pdf.circle(margin + colW + 7, kpiY + 4, 1.5, 'F');
          pdf.setTextColor(...DARK);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          const kpiLines = pdf.splitTextToSize(kpi, colW - 8);
          pdf.text(kpiLines.map(t), margin + colW + 10, kpiY + 5);
          kpiY += 10;
        });

        const maxColY = Math.max(recordY, kpiY);
        y = maxColY + 4;

        // Features chips
        if (y < pageH - 25) {
          pdf.setFillColor(232, 244, 255);
          pdf.roundedRect(margin, y, contentW, 8, 1, 1, 'F');
          pdf.setTextColor(...BLUE);
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'bold');
          pdf.text(t('CARACTERISTICAS PRINCIPALES:'), margin + 3, y + 5.5);
          y += 10;
          const chipW = (contentW - 6) / 2;
          mod.features.forEach((feat, fi) => {
            if (y > pageH - 12) return;
            const col = fi % 2;
            const row = Math.floor(fi / 2);
            const fx = margin + col * (chipW + 3);
            const fy = y + row * 9;
            pdf.setFillColor(215, 234, 252);
            pdf.roundedRect(fx, fy, chipW, 7, 1, 1, 'F');
            pdf.setTextColor(17, 70, 130);
            pdf.setFontSize(6.5);
            pdf.setFont('helvetica', 'normal');
            pdf.text(t(`- ${feat}`), fx + 3, fy + 4.5);
          });
        }
      }

      setProgress(90);

      // ════════════ PÁGINA: SEGURIDAD ════════════
      addNewPage();
      y = 20;
      sectionHeader(t('10. SEGURIDAD DE LA INFORMACION'), t('Seccion 10 de 12'));

      const secItems = [
        { title: 'Autenticación', desc: 'Supabase Auth con JWT. Sesiones con expiración configurable. No se almacenan contraseñas en texto plano (bcrypt).' },
        { title: 'Autorización', desc: 'Row Level Security (RLS) en todas las tablas. Cada consulta es filtrada automáticamente por tenant_id y rol del usuario.' },
        { title: 'Cifrado en Tránsito', desc: 'TLS 1.3 obligatorio en todas las comunicaciones. Certificados SSL/TLS gestionados por Supabase (Let\'s Encrypt).' },
        { title: 'Cifrado en Reposo', desc: 'Datos almacenados en discos cifrados AES-256. Backups automáticos diarios con retención de 7 días.' },
        { title: 'Multi-Tenancy', desc: 'Cada empresa tiene su propio tenant_id. Es imposible acceder a datos de otra empresa incluso con las mismas credenciales.' },
        { title: 'Almacenamiento de Archivos', desc: 'Buckets de Supabase Storage con políticas RLS. Solo el tenant propietario puede acceder a sus archivos.' },
      ];
      secItems.forEach((sec) => {
        if (y > pageH - 25) { addNewPage(); y = 20; }
        pdf.setFillColor(...LIGHT);
        pdf.roundedRect(margin, y, contentW, 18, 2, 2, 'F');
        pdf.setFillColor(...BLUE);
        pdf.roundedRect(margin, y, 4, 18, 0, 0, 'F');
        pdf.roundedRect(margin, y, 2, 18, 2, 0, 'F');
        pdf.setTextColor(...DARK);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(sec.title), margin + 8, y + 7);
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(sec.desc, contentW - 12);
        pdf.text(descLines, margin + 8, y + 12);
        y += 22;
      });

      // ════════════ PÁGINA: CONTROL DE DOCUMENTOS ════════════
      addNewPage();
      y = 20;
      sectionHeader(t('11. CONTROL DE DOCUMENTOS'), t('Seccion 11 de 12'));

      const docControlItems = [
        ['Código del documento', 'PRO-ECAR-SYS-001'],
        ['Título', 'Manual de Procedimientos del Sistema ERP ECAR'],
        ['Versión', '1.0'],
        ['Fecha de emisión', new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })],
        ['Elaborado por', 'Equipo de Desarrollo ECAR'],
        ['Revisado por', 'Departamento de Calidad'],
        ['Aprobado por', 'Dirección General'],
        ['Próxima revisión', 'A los 6 meses de la fecha de emisión o ante cambios mayores del sistema'],
        ['Distribución', 'Responsables de cada área, Auditores de Calidad, Dirección'],
        ['Soporte', 'Digital (PDF generado automáticamente por el sistema)'],
      ];
      docControlItems.forEach(([label, val]) => {
        if (y > pageH - 20) { addNewPage(); y = 20; }
        pdf.setFillColor(248, 250, 255);
        pdf.roundedRect(margin, y, contentW, 8, 1, 1, 'F');
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(label), margin + 3, y + 5.5);
        pdf.setTextColor(...DARK);
        pdf.setFont('helvetica', 'normal');
        pdf.text(t(val), margin + 70, y + 5.5);
        y += 10;
      });

      y += 6;
      pdf.setTextColor(...DARK);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('11.1 Historial de Revisiones'), margin, y);
      y += 6;

      // Revision table header
      pdf.setFillColor(...BLUE);
      pdf.roundedRect(margin, y, contentW, 8, 1, 1, 'F');
      pdf.setTextColor(...WHITE);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      ['Versión', 'Fecha', 'Descripción del Cambio', 'Autor'].forEach((col, ci) => {
        const cx = margin + ci * (contentW / 4);
        pdf.text(t(col), cx + 2, y + 5.5);
      });
      y += 10;
      pdf.setFillColor(...LIGHT);
      pdf.roundedRect(margin, y, contentW, 8, 1, 1, 'F');
      pdf.setTextColor(...DARK);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      ['1.0', new Date().toLocaleDateString('es-AR'), 'Versión inicial del manual del sistema completo', 'ECAR ERP'].forEach((col, ci) => {
        const cx = margin + ci * (contentW / 4);
        pdf.text(t(col), cx + 2, y + 5.5);
      });
      y += 12;

      // ════════════ PÁGINA: GLOSARIO ════════════
      addNewPage();
      y = 20;
      sectionHeader(t('12. GLOSARIO Y REFERENCIAS'), t('Seccion 12 de 12'));

      const glossary = [
        { term: 'API', def: 'Application Programming Interface. Interfaz de programación que permite la comunicación entre sistemas.' },
        { term: 'APU', def: 'Análisis de Precio Unitario. Descomposición de costos de una unidad de trabajo en materiales, mano de obra, equipos e indirectos.' },
        { term: 'ARCA', def: 'Agencia de Recaudación y Control Aduanero (ex-AFIP). Organismo recaudador de impuestos nacionales de Argentina.' },
        { term: 'CAE', def: 'Código de Autorización Electrónico. Código emitido por ARCA que valida una factura electrónica.' },
        { term: 'ERP', def: 'Enterprise Resource Planning. Sistema de planificación de recursos empresariales.' },
        { term: 'ICC', def: 'Instrumento de Certificación de Cobro. Certificado de avance de obra que habilita el cobro al comitente.' },
        { term: 'IVA', def: 'Impuesto al Valor Agregado. Impuesto indirecto al consumo vigente en Argentina.' },
        { term: 'JWT', def: 'JSON Web Token. Estándar para tokens de autenticación seguros y sin estado.' },
        { term: 'OCR', def: 'Optical Character Recognition. Tecnología de reconocimiento óptico de caracteres en imágenes.' },
        { term: 'RFI', def: 'Request for Information. Solicitud formal de aclaración técnica en proyectos de construcción.' },
        { term: 'RLS', def: 'Row Level Security. Política de seguridad de PostgreSQL que filtra datos a nivel de fila según el usuario.' },
        { term: 'WBS', def: 'Work Breakdown Structure. Estructura de desglose del trabajo en un proyecto.' },
        { term: 'Supabase', def: 'Plataforma Backend-as-a-Service open source basada en PostgreSQL. Utilizada como base de datos, autenticación y almacenamiento del sistema ECAR.' },
        { term: 'Tenant', def: 'Empresa cliente del sistema. El multi-tenancy garantiza el aislamiento total de datos entre distintas empresas.' },
        { term: 'Edge Function', def: 'Función serverless ejecutada en el edge de la red de Supabase, con latencia mínima. Usada para OCR, IA y notificaciones.' },
      ];
      glossary.forEach((item) => {
        if (y > pageH - 18) { addNewPage(); y = 20; }
        pdf.setFillColor(...LIGHT);
        pdf.roundedRect(margin, y, contentW, 14, 1, 1, 'F');
        pdf.setTextColor(...BLUE);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t(item.term), margin + 4, y + 6);
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        const defLines = pdf.splitTextToSize(item.def, contentW - 8);
        pdf.text(defLines, margin + 4, y + 11);
        y += 16;
      });

      // ════════════ CONTRAPORTADA ════════════
      addNewPage();
      pdf.setFillColor(...DARK);
      pdf.rect(0, 0, pageW, pageH, 'F');
      pdf.setTextColor(...WHITE);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('ECAR ERP'), pageW / 2, pageH / 2 - 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(180, 200, 220);
      pdf.text(t('Manual de Procedimientos del Sistema'), pageW / 2, pageH / 2 - 8, { align: 'center' });
      pdf.text(t('PRO-ECAR-SYS-001 | Version 1.0'), pageW / 2, pageH / 2, { align: 'center' });
      pdf.text(t(`Generado el ${new Date().toLocaleString('es-AR')}`), pageW / 2, pageH / 2 + 8, { align: 'center' });
      pdf.setTextColor(100, 130, 160);
      pdf.setFontSize(8);
      pdf.text(t('ECAR - Sistema ERP para Empresas Constructoras'), pageW / 2, pageH - 20, { align: 'center' });
      pdf.text(t('Ing. Carlos A. Regalado'), pageW / 2, pageH - 14, { align: 'center' });

      setProgress(98);
      pdf.save(`ECAR_Manual_Procedimientos_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`);
      setProgress(100);
      setTimeout(() => { setIsGenerating(false); setProgress(0); }, 1500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const sectionGroups = [
    { id: 'intro', label: 'Introducción', icon: BookOpen, color: 'text-blue-600' },
    { id: 'arch', label: 'Arquitectura', icon: Server, color: 'text-ecar-blue' },
    { id: 'roles', label: 'Roles & Accesos', icon: Key, color: 'text-amber-600' },
    { id: 'ai', label: 'Inteligencia Artificial', icon: Bot, color: 'text-green-600' },
    { id: 'Tableros', label: 'Tableros', icon: LayoutDashboard, color: 'text-blue-500' },
    { id: 'Administración', label: 'Administración', icon: Calculator, color: 'text-ecar-blue' },
    { id: 'Personal', label: 'Personal', icon: Users, color: 'text-ecar-blue' },
    { id: 'Logística', label: 'Logística', icon: Warehouse, color: 'text-ecar-blue' },
    { id: 'Operaciones', label: 'Operaciones', icon: HardHat, color: 'text-ecar-blue' },
    { id: 'security', label: 'Seguridad', icon: Shield, color: 'text-red-600' },
  ];

  const filteredModules = ['intro', 'arch', 'roles', 'ai', 'security'].includes(activeSection)
    ? []
    : MODULES_DATA.filter(m => m.section === activeSection);

  return (
    <div className="space-y-6" ref={manualRef}>
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30" style={{
              width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
              right: '-20px', top: '-20px',
              transform: `translate(${i * 5}px, ${i * 5}px)`,
            }} />
          ))}
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <BookOpen size={24} className="text-blue-300" />
              </div>
              <div>
                <div className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-0.5">PRO-ECAR-SYS-001</div>
                <h2 className="text-2xl font-black tracking-tight">Manual de Procedimientos</h2>
              </div>
            </div>
            <p className="text-blue-200 text-sm max-w-xl leading-relaxed">
              Documentación técnica y procedimental completa del Sistema ERP ECAR.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {[
                { label: `${MODULES_DATA.length} Módulos`, icon: Activity },
                { label: 'Versión 1.0', icon: Star },
                { label: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }), icon: Calendar },
              ].map((badge, i) => {
                const BadgeIcon = badge.icon;
                return (
                  <span key={i} className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    <BadgeIcon size={11} /> {badge.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="shrink-0">
            <button
              id="btn-download-manual-pdf"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-3 bg-white text-blue-900 hover:bg-blue-50 px-6 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait min-w-[200px] justify-center group"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-800/30 border-t-blue-800 rounded-full animate-spin" />
                  <span>Generando... {progress}%</span>
                </>
              ) : (
                <>
                  <Download size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Descargar PDF</span>
                </>
              )}
            </button>
            {isGenerating && (
              <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Módulos documentados', value: MODULES_DATA.length, icon: BarChart3, color: 'from-blue-500 to-blue-600' },
          { label: 'Edge Functions IA', value: 6, icon: Zap, color: 'from-ecar-blue to-ecar-blue' },
          { label: 'Procesos detallados', value: MODULES_DATA.reduce((a, m) => a + m.process.length, 0), icon: CheckCircle, color: 'from-emerald-500 to-green-600' },
          { label: 'Indicadores KPI', value: MODULES_DATA.reduce((a, m) => a + m.kpis.length, 0), icon: Activity, color: 'from-amber-500 to-orange-500' },
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="light-card p-5">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <StatIcon size={18} className="text-white" />
              </div>
              <div className="text-3xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-6">
        {/* ── SIDEBAR NAVIGATION ── */}
        <div className="w-60 shrink-0 space-y-1">
          <div className="light-card p-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Secciones del Manual</div>
            {sectionGroups.map((sec) => {
              const SecIcon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <SecIcon size={14} className={isActive ? 'text-blue-600' : sec.color} />
                  <span className="truncate">{sec.label}</span>
                  {isActive && <ChevronRight size={12} className="ml-auto text-blue-400" />}
                </button>
              );
            })}
          </div>


        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* === INTRODUCCIÓN === */}
          {activeSection === 'intro' && (
            <div className="space-y-6">
              <div className="light-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">1. Introducción y Alcance</h3>
                    <div className="text-xs text-gray-400">Sistema ERP ECAR</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  El presente Manual de Procedimientos describe exhaustivamente el Sistema ERP ECAR para la gestión integral de empresas del sector construcción. Abarca la totalidad de los procesos operativos, administrativos, financieros y de gestión de personas implementados en el sistema.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs font-bold text-blue-700 mb-1">DECLARACIÓN DE ALCANCE</div>
                  <p className="text-sm text-blue-800">
                    Este manual aplica a todos los usuarios del Sistema ECAR, incluyendo administradores y operarios. Cubre los {MODULES_DATA.length} módulos funcionales, las 6 Edge Functions de procesamiento automático, la integración con Inteligencia Artificial y la infraestructura de seguridad del sistema.
                  </p>
                </div>
              </div>

              <div className="light-card p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" /> Referencias Normativas
                </h4>
                <div className="space-y-2">
                  {[
                    { norm: 'ISO 27001:2022', desc: 'Seguridad de la Información', badge: 'Referencia' },
                    { norm: 'Ley 25.506 AR', desc: 'Firma Digital Argentina', badge: 'Legal' },
                    { norm: 'RG ARCA vigente', desc: 'Facturación Electrónica y Obtención de CAE', badge: 'Fiscal' },
                  ].map((ref, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">{ref.badge}</span>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{ref.norm}</div>
                        <div className="text-xs text-gray-500">{ref.desc}</div>
                      </div>
                      <CheckCircle size={16} className="text-green-500 ml-auto shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === ARQUITECTURA === */}
          {activeSection === 'arch' && (
            <div className="space-y-6">
              <div className="light-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-ecar-blueLight rounded-xl flex items-center justify-center">
                    <Server size={20} className="text-ecar-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">2. Arquitectura Técnica</h3>
                    <div className="text-xs text-gray-400">Stack tecnológico del sistema</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ARCH_ITEMS.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                        <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                          <ItemIcon size={16} className="text-white" />
                        </div>
                        <div className="font-bold text-gray-800 text-sm">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="light-card p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-ecar-blue" /> Edge Functions (Serverless)
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'process-invoice', desc: 'OCR de facturas con Gemini AI', badge: 'IA' },
                    { name: 'extract-cheque-data', desc: 'OCR de cheques físicos', badge: 'IA' },
                    { name: 'rombo-chat', desc: 'Agente conversacional web (GPT-4o)', badge: 'IA' },
                    { name: 'rombo-whatsapp', desc: 'Webhook de WhatsApp + procesamiento de intención', badge: 'Bot' },
                    { name: 'send-whatsapp', desc: 'Envío de mensajes y alertas por WhatsApp', badge: 'Notify' },
                    { name: 'process-reminders', desc: 'Scheduler automático de obligaciones', badge: 'Cron' },
                  ].map((fn, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-7 h-7 bg-ecar-blueLight rounded-lg flex items-center justify-center shrink-0">
                        <Zap size={12} className="text-ecar-blue" />
                      </div>
                      <div className="font-mono text-sm font-bold text-gray-800">{fn.name}</div>
                      <div className="text-xs text-gray-500 flex-1">{fn.desc}</div>
                      <span className="badge badge-info">{fn.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === ROLES === */}
          {activeSection === 'roles' && (
            <div className="space-y-6">
              <div className="light-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Key size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">3. Gestión de Accesos y Roles</h3>
                    <div className="text-xs text-gray-400">Control de acceso basado en roles (RBAC)</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {ROLES.map((role, i) => (
                    <div key={i} className={`rounded-xl border-2 p-5 ${role.color}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Users size={18} className="text-gray-700" />
                        <h4 className="font-bold text-gray-800">{role.role}</h4>
                      </div>
                      <ul className="space-y-2">
                        {role.perms.map((perm, pi) => (
                          <li key={pi} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
                            {perm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="light-card p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock size={16} className="text-red-500" /> Características de Seguridad
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    'Row Level Security (RLS) en todas las tablas',
                    'Autenticación JWT con tokens de sesión',
                    'TLS 1.3 en todas las comunicaciones',
                    'Multi-tenancy: datos aislados por empresa',
                    'Logs de auditoría PostgreSQL (WAL)',
                    'Buckets de archivos con permisos RLS',
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-lg p-3">
                      <Shield size={14} className="text-red-500 shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === IA === */}
          {activeSection === 'ai' && (
            <div className="space-y-4">
              {AI_INTEGRATIONS.map((ai, i) => {
                const AiIcon = ai.icon;
                return (
                  <div key={i} className="light-card p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${ai.color} flex items-center justify-center shrink-0`}>
                        <AiIcon size={22} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{ai.name}</h3>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{ai.description}</p>
                        <div className="grid md:grid-cols-2 gap-2">
                          {ai.capabilities.map((cap, ci) => (
                            <div key={ci} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                              <ArrowRight size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs text-gray-700 font-medium">{cap}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* === SECURITY === */}
          {activeSection === 'security' && (
            <div className="light-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Shield size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">10. Seguridad de la Información</h3>
                  <div className="text-xs text-gray-400">ISO 27001:2022 referencia</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Autenticación', icon: Key, desc: 'Supabase Auth con JWT. Sesiones con expiración configurable. Contraseñas cifradas con bcrypt.', color: 'bg-blue-50 border-blue-200' },
                  { title: 'Autorización (RLS)', icon: Lock, desc: 'Row Level Security activa en todas las tablas. Cada consulta es filtrada automáticamente por tenant_id y rol.', color: 'bg-amber-50 border-amber-200' },
                  { title: 'Cifrado en Tránsito', icon: Globe, desc: 'TLS 1.3 obligatorio. Certificados SSL gestionados automáticamente por Supabase (Let\'s Encrypt).', color: 'bg-green-50 border-green-200' },
                  { title: 'Multi-Tenancy', icon: Shield, desc: 'Datos completamente aislados por tenant_id. Es imposible acceder a datos de otra empresa.', color: 'bg-red-50 border-red-200' },
                  { title: 'Almacenamiento', icon: Database, desc: 'Buckets de Supabase Storage con políticas RLS. Solo el tenant propietario puede acceder a sus archivos.', color: 'bg-slate-50 border-ecar-blueLight' },
                  { title: 'Auditoría', icon: FileText, desc: 'Logs de acceso y cambios en PostgreSQL WAL. Trazabilidad completa de operaciones críticas.', color: 'bg-slate-50 border-slate-200' },
                ].map((sec, i) => {
                  const SecIcon = sec.icon;
                  return (
                    <div key={i} className={`rounded-lg border p-4 ${sec.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <SecIcon size={15} className="text-gray-700" />
                        <h4 className="font-bold text-gray-800 text-sm">{sec.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{sec.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === MÓDULOS POR SECCIÓN === */}
          {filteredModules.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                {filteredModules.length} módulo{filteredModules.length > 1 ? 's' : ''} en {activeSection}
              </div>
              {filteredModules.map((mod) => {
                const ModIcon = mod.icon;
                return (
                  <div key={mod.id} className={`bg-white rounded-2xl border-2 ${mod.borderColor} shadow-sm overflow-hidden`}>
                    {/* Header */}
                    <div className={`${mod.bgColor} px-6 py-4 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
                          <ModIcon size={20} className={mod.color} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${mod.color} bg-white px-2 py-0.5 rounded-full`}>{mod.code}</span>
                            <h3 className="font-black text-gray-900 text-lg">{mod.name}</h3>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">Responsable: <span className="font-semibold text-gray-700">{mod.responsible}</span></div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${mod.color} ${mod.bgColor} border ${mod.borderColor} px-3 py-1 rounded-full`}>{mod.section}</span>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Purpose + Scope */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className={`text-xs font-black ${mod.color} uppercase tracking-wider mb-2`}>📌 Propósito</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{mod.purpose}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className={`text-xs font-black ${mod.color} uppercase tracking-wider mb-2`}>🎯 Alcance</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{mod.scope}</p>
                        </div>
                      </div>

                      {/* Process */}
                      <div>
                        <div className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2">
                          <div className={`w-1.5 h-5 rounded-full ${mod.borderColor} bg-current`} />
                          Descripción del Proceso
                        </div>
                        <div className="space-y-2">
                          {mod.process.map((step, si) => (
                            <div key={si} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-white transition-all">
                              <div className={`w-6 h-6 rounded-full ${mod.bgColor} border-2 ${mod.borderColor} flex items-center justify-center text-xs font-black ${mod.color} shrink-0 mt-0.5`}>
                                {si + 1}
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Records + KPIs + Features */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">📋 Registros</div>
                          <div className="space-y-1">
                            {mod.records.map((rec, ri) => (
                              <div key={ri} className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-start gap-2">
                                <FileText size={10} className="mt-0.5 shrink-0 text-gray-400" />
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">📊 KPIs</div>
                          <div className="space-y-1">
                            {mod.kpis.map((kpi, ki) => (
                              <div key={ki} className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-start gap-2">
                                <Activity size={10} className="mt-0.5 shrink-0 text-gray-400" />
                                {kpi}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">✨ Características</div>
                          <div className="space-y-1">
                            {mod.features.map((feat, fi) => (
                              <div key={fi} className={`text-xs font-medium ${mod.color} ${mod.bgColor} border ${mod.borderColor} rounded-lg p-2.5 flex items-start gap-2`}>
                                <CheckCircle size={10} className="mt-0.5 shrink-0" />
                                {feat}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Default empty state */}
          {filteredModules.length === 0 && !['intro', 'arch', 'roles', 'ai', 'security'].includes(activeSection) && (
            <div className="text-center py-20 text-gray-400">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Seleccioná una sección del menú lateral</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
