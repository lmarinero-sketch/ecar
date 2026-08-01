import React, { useState } from 'react';
import {
  ShoppingCart, Warehouse, Building2, Landmark, Users, HardHat,
  FileText, Target, CheckCircle2, ArrowRight, ShieldAlert, Truck,
  Wrench, HelpCircle, Layers, DollarSign, FileSignature,
  ClipboardCheck, ChevronDown, ChevronUp, Package, Clock, ShieldCheck,
  AlertTriangle, BookOpen, Banknote, Rocket, CheckSquare, Wallet, PackageCheck
} from 'lucide-react';
import { useAppStore } from '../store/useStore';
import type { ModuleId } from '../lib/types';

export type GerenciaKey = 'compras' | 'logistics' | 'obra' | 'finanzas' | 'rrhh';

interface GerenciaConfig {
  title: string;
  subtitle: string;
  gerenciaLabel: string;
  emoji: string;
  gradient: string;
  bgBadge: string;
  textBadge: string;
  borderBadge: string;
  icon: React.ElementType;
  overview: string;
  flowSteps: { step: string; title: string; desc: string; role: string; icon: React.ElementType; color: string }[];
  tools: { id: ModuleId; title: string; desc: string; icon: React.ElementType; gradient: string }[];
  deliverables: { area: string; icon: React.ElementType; color: string; items: string[] }[];
  faq: { question: string; answer: string }[];
}

const GERENCIA_DATA: Record<GerenciaKey, GerenciaConfig> = {
  compras: {
    title: 'Gerencia de Compras & Abastecimiento',
    subtitle: 'Aseguramos la provisión oportuna de insumos, materiales y contrataciones al mejor costo y calidad esperada.',
    gerenciaLabel: 'Gerencia de Compras',
    emoji: '🛒',
    gradient: 'from-slate-900 via-ecar-blueDark to-ecar-blue',
    bgBadge: 'bg-blue-500/20',
    textBadge: 'text-blue-300',
    borderBadge: 'border-blue-400/30',
    icon: ShoppingCart,
    overview: 'La Gerencia de Compras centraliza las solicitudes de pedidos provenientes de Obra y Logística. Cotiza con proveedores homologados, emite Órdenes de Compra (OC) u Órdenes de Trabajo (OT) y evalúa el desempeño de los proveedores para garantizar la trazabilidad técnico-económica.',
    flowSteps: [
      { step: '1', title: 'Solicitud de Pedido', desc: 'Ingreso del pedido desde Obra o derivación por falta de stock desde Logística.', role: 'Obra / Pañol', icon: Package, color: 'bg-blue-100 text-ecar-blue' },
      { step: '2', title: 'Cotización & Comparativa', desc: 'Solicitud de presupuestos a 3+ proveedores y armado de cuadro comparativo.', role: 'Analista de Compras', icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
      { step: '3', title: 'Orden de Compra (OC/OT)', desc: 'Aprobación de montos según límites de jerarquía y emisión formal de OC.', role: 'Gerente de Compras', icon: FileSignature, color: 'bg-purple-100 text-purple-700' },
      { step: '4', title: 'Entrega & Conformidad', desc: 'Recepción del material en Pañol u Obra con remito y factura cotejada.', role: 'Receptor / Finanzas', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
      { step: '5', title: 'Evaluación de Proveedor', desc: 'Calificación trimestral en calidad, plazos, precio y cumplimiento fiscal.', role: 'Comité de Calidad', icon: ClipboardCheck, color: 'bg-amber-100 text-amber-700' },
    ],
    tools: [
      { id: 'purchases', title: 'Compras & Registro de Facturas', desc: 'Carga de comprobantes, Libro IVA compras y vinculación con remitos.', icon: ShoppingCart, gradient: 'from-ecar-blue to-ecar-blue' },
      { id: 'purchase_orders', title: 'Órdenes de Compra (OC / OT)', desc: 'Emisión formal, firmas de aprobación por montos y trazabilidad de ítems.', icon: FileSignature, gradient: 'from-indigo-600 to-purple-600' },
      { id: 'supplier_eval', title: 'Evaluación de Proveedores', desc: 'Ranking de proveedores, incidencias, tiempos de entrega y nómina autorizada.', icon: ClipboardCheck, gradient: 'from-emerald-600 to-teal-600' },
    ],
    deliverables: [
      { area: 'A Gerencia de Obra', icon: Building2, color: 'bg-amber-50 border-amber-200 text-amber-900', items: ['Materiales e insumos según especificaciones en fecha', 'Subcontratos formalizados con OT aprobada', 'Seguimiento de entregas críticas en frentes'] },
      { area: 'A Gerencia de Logística', icon: Warehouse, color: 'bg-blue-50 border-blue-200 text-blue-900', items: ['Programación de arribos a Pañol central', 'Remitos de proveedores para cotejar con OC', 'Devoluciones o reclamos por insumos defectuosos'] },
      { area: 'A Adm. y Finanzas', icon: Landmark, color: 'bg-emerald-50 border-emerald-200 text-emerald-900', items: ['Facturas conformadas con OC y remito adjunto', 'Condiciones de pago acordadas con proveedores', 'Proyección de vencimientos comerciales'] },
    ],
    faq: [
      { question: '¿Cómo se solicita una compra urgente?', answer: 'Se debe cargar en el módulo de Pedidos marcando la prioridad "Urgente" e indicando el motivo fundado. Notificará automáticamente a Compras.' },
      { question: '¿Quién autoriza una Orden de Compra?', answer: 'Montos menores son aprobados por el Jefe de Compras; montos superiores a la escala fijada requieren la firma de Gerencia General o Administración.' },
      { question: '¿Qué pasa si el proveedor entrega menos de lo pedido?', answer: 'El receptor registra una "Entrega Parcial" en el remito. Compras mantendrá la OC abierta únicamente por el saldo pendiente.' },
    ]
  },

  logistics: {
    title: 'Gerencia de Logística, Pañol y Flota',
    subtitle: 'Administramos los recursos físicos, inventarios, maquinaria y transporte garantizando la operatividad de cada obra.',
    gerenciaLabel: 'Gerencia de Logística',
    emoji: '📦',
    gradient: 'from-slate-900 via-slate-800 to-slate-700',
    bgBadge: 'bg-sky-500/20',
    textBadge: 'text-sky-300',
    borderBadge: 'border-sky-400/30',
    icon: Warehouse,
    overview: 'La Gerencia de Logística custodia el stock en Pañol central y depósitos de obra, administra la asignación de herramientas con firma digital, efectúa las entregas materiales con trazabilidad y gestiona la flota vehicular con partes diarios por QR, mantenimiento preventivo y GPS.',
    flowSteps: [
      { step: '1', title: 'Recepción de Pedidos', desc: 'Revisión del requerimiento de obra y verificación de existencias en Pañol.', role: 'Pañolero', icon: PackageCheck, color: 'bg-sky-100 text-sky-700' },
      { step: '2', title: 'Despacho vs Derivación', desc: 'Si hay stock se prepara el envío; si falta, se deriva automáticamente a Compras.', role: 'Coordinador Logístico', icon: Layers, color: 'bg-blue-100 text-blue-700' },
      { step: '3', title: 'Hoja de Ruta & Chofer', desc: 'Asignación del vehículo de la flota y responsable de traslado.', role: 'Logística', icon: Truck, color: 'bg-indigo-100 text-indigo-700' },
      { step: '4', title: 'Entrega con Checklist', desc: 'Verificación ítem por ítem en obra, firma digital y actualización de stock.', role: 'Receptor de Obra', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
      { step: '5', title: 'Parte Diario & Mantenimiento', desc: 'Escaneo de QR de vehículo, carga de Km, combustible y tickets de service.', role: 'Chofer / Taller', icon: Wrench, color: 'bg-purple-100 text-purple-700' },
    ],
    tools: [
      { id: 'purchase_requests', title: 'Pedidos de Obra & Requerimientos', desc: 'Gestión y seguimiento de solicitudes de materiales emitidas por los frentes de obra.', icon: Package, gradient: 'from-amber-600 to-orange-600' },
      { id: 'logistics', title: 'Logística de Envíos & Entregas', desc: 'Creación de remitos, asignación de chofer, estado en tránsito y recepción.', icon: Warehouse, gradient: 'from-sky-600 to-blue-600' },
      { id: 'fleet', title: 'Flota y Maquinaria', desc: 'Registro de vehículos, partes diarios por QR, consumo de fuel y mapa GPS.', icon: Truck, gradient: 'from-blue-600 to-indigo-600' },
      { id: 'inventory', title: 'Inventario & Pañol', desc: 'Stock físico, alertas de reposición, ubicación en estantería y herramientas.', icon: Package, gradient: 'from-slate-700 to-slate-900' },
    ],
    deliverables: [
      { area: 'A Gerencia de Obra', icon: Building2, color: 'bg-amber-50 border-amber-200 text-amber-900', items: ['Materiales despachados a tiempo con remito firmado', 'Herramientas livianas y pesadas operativas', 'Maquinaria asignada con parte diario al día'] },
      { area: 'A Gerencia de Compras', icon: ShoppingCart, color: 'bg-blue-50 border-blue-200 text-blue-900', items: ['Alertas de stock mínimo para reposición preventiva', 'Pedidos derivados por falta de stock interno', 'Reporte de calidad de herramientas recibidas'] },
      { area: 'A Adm. y Finanzas', icon: Landmark, color: 'bg-emerald-50 border-emerald-200 text-emerald-900', items: ['Rendición de cargas de combustible y peajes', 'Costos de mantenimientos preventivos y correctivos', 'Inventario valorizado anual/mensual'] },
    ],
    faq: [
      { question: '¿Cómo se solicita el envío de un equipo a obra?', answer: 'Se genera desde el módulo de Entregas seleccionando la obra destino, fecha requerida y los ítems del pañol.' },
      { question: '¿Qué pasa si un vehículo marca "Fuera de Servicio"?', answer: 'El sistema bloquea la unidad para hojas de ruta y notifica al taller para generar la orden de reparación.' },
      { question: '¿Cómo funciona el Parte Diario vehicular?', answer: 'El chofer escanea el código QR del vehículo desde su celular al iniciar o finalizar el día y completa Km y litros cargados.' },
    ]
  },

  obra: {
    title: 'Gerencia de Obras & Ejecución Técnica',
    subtitle: 'Planificamos, coordinamos y supervisamos la construcción en campo garantizando calidad, seguridad y plazo.',
    gerenciaLabel: 'Gerencia de Obra',
    emoji: '🏗️',
    gradient: 'from-amber-950 via-amber-900 to-amber-800',
    bgBadge: 'bg-amber-500/20',
    textBadge: 'text-amber-300',
    borderBadge: 'border-amber-400/30',
    icon: Building2,
    overview: 'La Gerencia de Obra abarca el frente directo de producción. Administra la estructura desglosada del trabajo (WBS), la carga de Partes Diarios de personal y equipos, el control de adicionales de obra, los protocolos de Calidad, Inspecciones, Seguridad & Higiene y la gestión de No Conformidades.',
    flowSteps: [
      { step: '1', title: 'Planificación WBS', desc: 'Estructuración del proyecto en fases, tareas, fechas e hitos de avance.', role: 'Jefe de Obra', icon: Target, color: 'bg-amber-100 text-amber-800' },
      { step: '2', title: 'Parte Diario de Campo', desc: 'Registro diario de personal presente, clima, tareas ejecutadas y avance.', role: 'Capataz / Oficina Técnica', icon: Clock, color: 'bg-blue-100 text-blue-700' },
      { step: '3', title: 'Calidad & Inspecciones', desc: 'Apertura y firma de protocolos técnicos de hormigón, soldadura, etc.', role: 'Inspector / Calidad', icon: CheckSquare, color: 'bg-emerald-100 text-emerald-700' },
      { step: '4', title: 'Adicionales & RFI', desc: 'Gestión de modificaciones de proyecto (Scope Changes) y consultas técnicas.', role: 'Oficina Técnica', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700' },
      { step: '5', title: 'Seguridad & Incidentes', desc: 'Relevamiento de condiciones de trabajo, EPP y registro de observaciones.', role: 'Prevencionista HyS', icon: ShieldAlert, color: 'bg-red-100 text-red-700' },
    ],
    tools: [
      { id: 'wbs', title: 'Planificación WBS & Cronograma', desc: 'Diagrama de Gantt, estructura de tareas y avance físico del proyecto.', icon: Target, gradient: 'from-amber-600 to-orange-600' },
      { id: 'field', title: 'Parte Diario de Campo', desc: 'Carga diaria de cuadrillas, tareas, novedad de equipos y clima.', icon: Clock, gradient: 'from-orange-600 to-red-600' },
      { id: 'scope_changes', title: 'Adicionales & Cambios de Alcance', desc: 'Registro de trabajos adicionales no contemplados y su valorización.', icon: Layers, gradient: 'from-blue-600 to-indigo-600' },
      { id: 'safety', title: 'Seguridad & Higiene', desc: 'Reportes de incidentes, observaciones de campo y entrega de EPP.', icon: ShieldAlert, gradient: 'from-red-600 to-rose-700' },
      { id: 'quality', title: 'Calidad e Inspecciones', desc: 'Protocolos de ensayo, checklists de liberación y liberaciones parciales.', icon: CheckSquare, gradient: 'from-emerald-600 to-teal-600' },
      { id: 'rfi', title: 'Consultas de Obra (RFI)', desc: 'Aclaraciones técnicas enviadas al comitente o proyectista.', icon: BookOpen, gradient: 'from-purple-600 to-indigo-600' },
      { id: 'nonconformities', title: 'No Conformidades', desc: 'Registro de desvíos, plan de acción correctiva y cierre documentado.', icon: AlertTriangle, gradient: 'from-rose-600 to-pink-600' },
      { id: 'documents', title: 'Documentación de Obra', desc: 'Gestor documental de planos as-built, memorias y pliegos.', icon: FileText, gradient: 'from-slate-700 to-slate-900' },
    ],
    deliverables: [
      { area: 'A Adm. y Finanzas', icon: Landmark, color: 'bg-emerald-50 border-emerald-200 text-emerald-900', items: ['Medición mensual aprobada para emitir Certificado', 'Parte diario con horas de personal para sueldos', 'Documentación de adicionales para cobro extra'] },
      { area: 'A Gerencia de Presupuestos', icon: HardHat, color: 'bg-blue-50 border-blue-200 text-blue-900', items: ['Rendimientos reales en campo vs supuestos teóricos', 'Lecciones aprendidas de cómputos y costos', 'Desvíos de plazos y análisis de causas'] },
      { area: 'A Gerencia de Logística', icon: Warehouse, color: 'bg-sky-50 border-sky-200 text-sky-900', items: ['Requerimientos anticipados de materiales y equipos', 'Plan de retiro de sobrantes de obra', 'Reporte de estado de herramientas al finalizar'] },
    ],
    faq: [
      { question: '¿Cómo se registra un trabajo adicional no previsto?', answer: 'Ingresá al módulo "Adicionales", cargá el cómputo, motivo y documentación de respaldo para enviar a aprobación de la comitente.' },
      { question: '¿Quién debe completar el Parte Diario?', answer: 'El Capataz o el Jefe de Obra debe cargarlo al finalizar cada jornada desde la app celular o computadora.' },
      { question: '¿Cómo se cierra una No Conformidad?', answer: 'Se define la acción correctiva, se adjunta foto de la reparación en campo y el responsable de Calidad aprueba el cierre.' },
    ]
  },

  finanzas: {
    title: 'Gerencia de Administración, Finanzas & Tesorería',
    subtitle: 'Resguardamos la liquidez, administramos los cobros, ejecutamos pagos y garantizamos la salud contable-fiscal.',
    gerenciaLabel: 'Gerencia Adm. y Finanzas',
    emoji: '💼',
    gradient: 'from-emerald-950 via-emerald-900 to-teal-900',
    bgBadge: 'bg-emerald-500/20',
    textBadge: 'text-emerald-300',
    borderBadge: 'border-emerald-400/30',
    icon: Landmark,
    overview: 'La Gerencia de Administración y Finanzas administra la tesorería, el flujo de fondos (Cashflow), la emisión de Certificados de Obra ante el comitente, la liquidación semanal de jornales de obreros, las alertas impositivas/bancarias y el registro de pagos a proveedores.',
    flowSteps: [
      { step: '1', title: 'Certificación comitente', desc: 'Generación del Certificado de avance de obra e ingreso de la factura de cobro.', role: 'Oficina Técnica / Finanzas', icon: FileSignature, color: 'bg-emerald-100 text-emerald-800' },
      { step: '2', title: 'Comprobantes & ARCA', desc: 'Validación de facturas de proveedores y carga en Libro IVA compras.', role: 'Analista Contable', icon: Landmark, color: 'bg-blue-100 text-blue-700' },
      { step: '3', title: 'Alertas & Obligaciones', desc: 'Programación de vencimientos impositivos, seguros, eCheqs y servicios.', role: 'Tesorería', icon: Clock, color: 'bg-amber-100 text-amber-700' },
      { step: '4', title: 'Liquidación de Obreros', desc: 'Procesamiento semanal de recibos de sueldo UOCRA y quincenas.', role: 'Liquidación / RRHH', icon: Banknote, color: 'bg-purple-100 text-purple-700' },
      { step: '5', title: 'Ejecución de Pagos', desc: 'Pago a proveedores vía transferencia, eCheq o efectivo con recibo.', role: 'Tesorería / Gerencia', icon: DollarSign, color: 'bg-teal-100 text-teal-800' },
    ],
    tools: [
      { id: 'finances', title: 'Finanzas & Cashflow', desc: 'Posición de caja, cuentas bancarias, ingresos, egresos y proyecciones.', icon: Landmark, gradient: 'from-emerald-600 to-teal-600' },
      { id: 'obligations', title: 'Alertas & Obligaciones', desc: 'Calendario de vencimientos impositivos (ARCA), eCheqs, alquileres y servicios.', icon: Clock, gradient: 'from-amber-600 to-orange-600' },
      { id: 'certifications', title: 'Certificaciones de Obra', desc: 'Seguimiento de certificados emitidos, retenciones de garantía y cobros.', icon: FileSignature, gradient: 'from-blue-600 to-indigo-600' },
      { id: 'expenses', title: 'Gastos Operativos', desc: 'Rendiciones de caja chica, viáticos de obra y fondos a rendir.', icon: Wallet, gradient: 'from-slate-700 to-slate-900' },
      { id: 'payments', title: 'Registro de Pagos', desc: 'Ejecución de pagos a proveedores y emisión de comprobantes de retención.', icon: Banknote, gradient: 'from-teal-600 to-emerald-700' },
      { id: 'worker_payments', title: 'Pagos a Trabajadores', desc: 'Control de pagos de jornales, quincenas y recibos conformados.', icon: Users, gradient: 'from-indigo-600 to-purple-600' },
    ],
    deliverables: [
      { area: 'A Gerencia General', icon: Building2, color: 'bg-emerald-50 border-emerald-200 text-emerald-900', items: ['Tablero de Liquidez y disponibilidad de caja diaria', 'Reporte de margen neto por proyecto', 'Auditoría de pasivos comerciales y fiscales'] },
      { area: 'A Gerencia de Obra', icon: HardHat, color: 'bg-amber-50 border-amber-200 text-amber-900', items: ['Cobro de adicionales aprobado por comitente', 'Pago de quincenas de personal operativo en término', 'Fondos para caja chica de obra'] },
      { area: 'A Gerencia de Compras', icon: ShoppingCart, color: 'bg-blue-50 border-blue-200 text-blue-900', items: ['Fechas probables de pago a proveedores según cashflow', 'Retenciones impositivas calculadas', 'Pagos aplicados a Órdenes de Compra'] },
    ],
    faq: [
      { question: '¿Cómo se ingresa un eCheq para pago futuro?', answer: 'En el módulo "Alertas & Obligaciones" o en "Pagos", se registra como instrumento eCheq con su fecha de vencimiento.' },
      { question: '¿Cómo se concilia el pago de quincenas de UOCRA?', answer: 'En "Pagos a Trabajadores", se importa la nómina validada por el Parte Diario y se registran las transferencias enviadas.' },
      { question: '¿Cuándo se libera el fondo de garantía retenido?', answer: 'Se gestiona tras la Recepción Provisoria de la obra cargando el hito en el módulo "Certificaciones".' },
    ]
  },

  rrhh: {
    title: 'Gerencia de Recursos Humanos & Talento',
    subtitle: 'Desarrollamos, cuidamos y gestionamos al equipo humano de la empresa en oficina y en cada obra.',
    gerenciaLabel: 'Gerencia de RRHH',
    emoji: '👥',
    gradient: 'from-indigo-950 via-indigo-900 to-blue-900',
    bgBadge: 'bg-indigo-500/20',
    textBadge: 'text-indigo-300',
    borderBadge: 'border-indigo-400/30',
    icon: Users,
    overview: 'La Gerencia de RRHH administra el ciclo de vida del colaborador: alta de legajo, encuadramiento según convenio UOCRA o fuera de convenio, entrega documentada de indumentaria y EPP, control de ausentismo y licencias, y la liquidación periódica de haberes.',
    flowSteps: [
      { step: '1', title: 'Alta de Legajo', desc: 'Registro de datos personales, CUIL, CBU, apto médico y alta en ARCA (Mi Trabajo).', role: 'Analista de RRHH', icon: Users, color: 'bg-indigo-100 text-indigo-700' },
      { step: '2', title: 'Entrega de EPP & Ropa', desc: 'Entrega física de calzado, casco y ropa de trabajo con planilla firmada.', role: 'Pañol / RRHH', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-700' },
      { step: '3', title: 'Control Asistencia & Clima', desc: 'Seguimiento de presentismo diario, ausentismo justificado y novedades.', role: 'Oficina Técnica / RRHH', icon: Clock, color: 'bg-blue-100 text-blue-700' },
      { step: '4', title: 'Novedades de Sueldos', desc: 'Consolidación de horas extras, viáticos, presentismo y descuentos.', role: 'Liquidación de Haberes', icon: FileText, color: 'bg-purple-100 text-purple-700' },
      { step: '5', title: 'Liquidación & Recibos', desc: 'Generación de recibos digitales, depósito de sueldos y cargas sociales.', role: 'Finanzas / RRHH', icon: Banknote, color: 'bg-teal-100 text-teal-800' },
    ],
    tools: [
      { id: 'rrhh', title: 'Legajos & Personal', desc: 'Base unificada de empleados, vencimiento de documentación y asignaciones.', icon: Users, gradient: 'from-indigo-600 to-blue-600' },
      { id: 'field', title: 'Parte Diario (Presentismo)', desc: 'Asistencia diaria informada por el Capataz en el frente de obra.', icon: Clock, gradient: 'from-blue-600 to-sky-600' },
      { id: 'worker_payments', title: 'Liquidación & Recibos', desc: 'Control de importes liquidados por convenio UOCRA u oficiales.', icon: Banknote, gradient: 'from-teal-600 to-emerald-600' },
    ],
    deliverables: [
      { area: 'A Gerencia de Obra', icon: Building2, color: 'bg-amber-50 border-amber-200 text-amber-900', items: ['Trabajadores habilitados con alta médica y ART activa', 'Entrega de EPP reglamentario previo al ingreso', 'Resolución de ausentismos o relevos de cuadrilla'] },
      { area: 'A Adm. y Finanzas', icon: Landmark, color: 'bg-emerald-50 border-emerald-200 text-emerald-900', items: ['Nómina consolidada para depósito de haberes', 'Declaración de Cargas Sociales (F.931 ARCA)', 'Aportes a gremios e institutos (UOCRA / IERIC)'] },
      { area: 'A Gerencia General', icon: HardHat, color: 'bg-blue-50 border-blue-200 text-blue-900', items: ['Índices de rotación y ausentismo laboral', 'Presupuesto de masa salarial por proyecto', 'Auditoría de cumplimiento legal laboral'] },
    ],
    faq: [
      { question: '¿Cómo se registra la entrega de indumentaria?', answer: 'Ingresá al perfil del empleado en RRHH, seleccioná "Entrega de EPP" y cargá los ítems recibidos con fecha.' },
      { question: '¿Qué hacer ante una baja o renuncia?', answer: 'Actualizá el estado en el legajo a "Baja", cargá la fecha de egreso y notificá a Finanzas para la liquidación final.' },
      { question: '¿Dónde se suben los certificados médicos?', answer: 'Dentro de la pestaña "Novedades / Licencias" del empleado adjuntando el documento escaneado.' },
    ]
  }
};

export const GerenciaLandingModule: React.FC<{ gerenciaKey: GerenciaKey }> = ({ gerenciaKey }) => {
  const { setActiveModule } = useAppStore();
  const config = GERENCIA_DATA[gerenciaKey] || GERENCIA_DATA.compras;
  const IconComp = config.icon;
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Banner */}
      <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <IconComp size={180} />
        </div>
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20">
            <span>{config.emoji}</span>
            <span>{config.gerenciaLabel}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            {config.title}
          </h1>

          <p className="text-sm md:text-base text-gray-200 leading-relaxed font-normal">
            {config.subtitle}
          </p>

          <div className="pt-2 text-xs text-gray-300 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <span className="font-bold text-white block mb-1">Visión General del Módulo:</span>
            {config.overview}
          </div>
        </div>
      </div>

      {/* Grid: Workflow Paso a Paso */}
      <div className="light-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Layers className="text-ecar-blue" size={20} /> Circuito de Trabajo Paso a Paso
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Conocé cómo fluyen las tareas y decisiones dentro de esta Gerencia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {config.flowSteps.map((step, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${step.color} font-bold flex items-center justify-center text-xs shadow-sm`}>
                    {step.step}
                  </div>
                  <step.icon size={16} className="text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-800 text-xs leading-snug">{step.title}</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
              <div className="pt-2 border-t border-gray-200/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {step.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submódulos y Accesos Directos */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <Rocket className="text-ecar-blue" size={20} /> Herramientas y Submódulos Activos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {config.tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => setActiveModule(tool.id)}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                  <tool.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base group-hover:text-ecar-blue transition-colors flex items-center justify-between">
                    {tool.title}
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-ecar-blue group-hover:translate-x-1 transition-all" />
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end text-xs font-bold text-ecar-blue">
                Ingresar al Módulo &rarr;
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interacción con otras Gerencias */}
      <div className="light-card p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <Users className="text-ecar-blue" size={20} /> Entregables e Interacción Inter-Gerencias
        </h3>
        <p className="text-xs text-gray-500">
          Ninguna gerencia trabaja aislada. Revisa qué información le provee esta gerencia a los demás frentes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {config.deliverables.map((del, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${del.color} space-y-3`}>
              <h4 className="font-bold text-sm flex items-center gap-2">
                <del.icon size={18} /> {del.area}
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-4">
                {del.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Preguntas Frecuentes FAQ */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 space-y-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ecar-blue/30 text-ecar-blueLight flex items-center justify-center">
            <HelpCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Preguntas Frecuentes & Guía Operativa</h3>
            <p className="text-xs text-gray-400">Respuestas rápidas a las consultas habituales sobre este módulo.</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {config.faq.map((item, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden transition-colors">
                <button
                  onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-gray-200 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-ecar-blue font-bold">?</span> {item.question}
                  </span>
                  {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-gray-300 leading-relaxed border-t border-slate-700/40 mt-1">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
