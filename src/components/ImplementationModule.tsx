import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSystemSetting, useUpsertSystemSetting } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import {
  Rocket, CheckCircle2, Circle, ChevronDown, ChevronRight, MessageSquare,
  User, Smartphone, Monitor, Clock, Target, Save, RotateCcw, Trophy,
  Landmark, ShoppingCart, Bell, Calculator, Users, Calendar, Wallet,
  LayoutDashboard, ShoppingBag,
  Truck, Fuel, ShieldAlert, ClipboardCheck, Upload, Paperclip, Download, ExternalLink,
  MessageSquareText, Plus, Trash2, Edit, X, FileText, ChevronUp, Eye, Maximize2
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════ */
/*  TYPES                                                         */
/* ═══════════════════════════════════════════════════════════════ */

type CheckItem = {
  id: string;
  label: string;
  description?: string;
};

type TaskSection = {
  id: string;
  title: string;
  icon: React.ElementType;
  duration: string;
  items: CheckItem[];
};

type Phase = {
  id: string;
  title: string;
  person: string;
  device: string;
  deviceIcon: React.ElementType;
  color: string;       // gradient from
  colorTo: string;     // gradient to
  textColor: string;
  meetingDate?: string;  // e.g. '03/06'
  meetingTime?: string;  // e.g. '16:00 hs'
  sections: TaskSection[];
};

type ImplState = {
  checked: Record<string, boolean>;
  notes: Record<string, string>;
};

type MeetingAttachment = {
  name: string;
  url: string;
  type: string;  // mime type
  size: number;  // bytes
  uploadedAt: string;
};

type Meeting = {
  id: string;
  date: string;
  responsibles: string;
  objective: string;
  development: string;
  createdAt: string;
  attachments?: MeetingAttachment[];
};

/* ═══════════════════════════════════════════════════════════════ */
/*  DATA                                                          */
/* ═══════════════════════════════════════════════════════════════ */

const PHASES: Phase[] = [
  {
    id: 'enrico',
    title: 'Capacitación Enrico — Sistema Completo',
    person: 'Enrico',
    device: 'PC (Navegador)',
    deviceIcon: Monitor,
    color: 'from-indigo-800',
    colorTo: 'to-indigo-600',
    textColor: 'text-indigo-100',
    meetingDate: '03/06',
    sections: [
      {
        id: 'e-fin', title: 'Finanzas — Cheques y Pagos', icon: Landmark, duration: '15 min',
        items: [
          { id: 'e5', label: 'Mostrar gestión de cheques (carga, estados, vencimientos)' },
          { id: 'e6', label: 'Mostrar flujo de pagos y recibos' },
          { id: 'e7', label: 'Explicar extracción automática de datos de cheque (OCR)' },
          { id: 'e8', label: 'Validar: ¿Los estados del cheque cubren tu flujo?' },
          { id: 'e9', label: 'Validar: ¿Necesitás alertas de vencimiento de cheques?' },
        ],
      },
      {
        id: 'e-gas', title: 'Gastos Operativos', icon: Wallet, duration: '10 min',
        items: [
          { id: 'e10', label: 'Mostrar carga de gastos y categorización' },
          { id: 'e11', label: 'Mostrar reportes de gastos por período' },
          { id: 'e12', label: 'Validar: ¿Qué categorías son las más frecuentes?' },
          { id: 'e13', label: 'Validar: ¿Necesitás aprobar gastos antes de registrarlos?' },
        ],
      },
      {
        id: 'e-obl', title: 'Obligaciones Fiscales', icon: Bell, duration: '10 min',
        items: [
          { id: 'e14', label: 'Mostrar calendario de vencimientos fiscales' },
          { id: 'e15', label: 'Mostrar sistema de alertas y estados' },
          { id: 'e16', label: 'Validar: ¿Cuáles son las obligaciones más críticas? (IIBB, IVA, cargas sociales)' },
          { id: 'e17', label: 'Validar: ¿Te sirve recibir notificaciones por WhatsApp?' },
        ],
      },
      {
        id: 'e-arca', title: 'Facturación (ARCA)', icon: Calculator, duration: '5 min',
        items: [
          { id: 'e18', label: 'Mostrar carga y procesamiento de facturas' },
          { id: 'e19', label: 'Validar: ¿Usás el módulo actualmente?' },
          { id: 'e20', label: 'Validar: ¿Necesitás cruzar facturas con órdenes de compra?' },
        ],
      },
      {
        id: 'e-comp', title: 'Compras & Libro IVA', icon: ShoppingCart, duration: '15 min',
        items: [
          { id: 'e21', label: 'Mostrar flujo de compras: proveedor → factura → pago' },
          { id: 'e22', label: 'Mostrar carga de factura con OCR automático' },
          { id: 'e23', label: 'Mostrar cruce IVA compras' },
          { id: 'e24', label: 'Validar: ¿La detección automática de datos es precisa?' },
          { id: 'e25', label: 'Validar: ¿Necesitás aprobar compras por monto?' },
        ],
      },
      {
        id: 'e-rrhh', title: 'RRHH — Legajos y Asistencia', icon: Users, duration: '15 min',
        items: [
          { id: 'e33', label: 'Mostrar gestión de legajos (alta, documentación, vencimientos)' },
          { id: 'e34', label: 'Mostrar sistema de asistencia (QR / parte diario)' },
          { id: 'e35', label: 'Validar: ¿Qué datos del legajo son los más consultados?' },
          { id: 'e36', label: 'Validar: ¿Cómo gestionan hoy vencimientos de ART, psicofísico, etc.?' },
          { id: 'e37', label: 'Validar: ¿El sistema de asistencia con QR es viable para la obra?' },
          { id: 'e38', label: 'Validar: ¿Cuántos empleados tendrían que estar cargados?' },
        ],
      },
      {
        id: 'e-fleet', title: 'Flota y Maquinaria', icon: Truck, duration: '10 min',
        items: [
          { id: 'e56', label: 'Mostrar listado de vehículos y maquinaria' },
          { id: 'e57', label: 'Mostrar estado y mantenimiento de cada unidad' },
          { id: 'e58', label: 'Validar: ¿Cuántos vehículos/máquinas tienen?' },
          { id: 'e59', label: 'Validar: ¿Necesitan control de horas de uso por equipo?' },
        ],
      },
      {
        id: 'e-fuel', title: 'Combustible', icon: Fuel, duration: '10 min',
        items: [
          { id: 'e60', label: 'Mostrar registro de cargas de combustible' },
          { id: 'e61', label: 'Mostrar gestión de batanes (compra y descarga)' },
          { id: 'e62', label: 'Mostrar conciliación mensual de combustible' },
          { id: 'e63', label: 'Validar: ¿Cargan combustible en estación y/o batán propio?' },
          { id: 'e64', label: 'Validar: ¿Necesitan control de rendimiento por vehículo?' },
        ],
      },
      {
        id: 'e-safety', title: 'Seguridad & Incidentes', icon: ShieldAlert, duration: '10 min',
        items: [
          { id: 'e82', label: 'Mostrar registro de incidentes (accidente, cuasi-accidente, enfermedad)' },
          { id: 'e83', label: 'Mostrar observaciones de seguridad con matriz de riesgo' },
          { id: 'e84', label: 'Mostrar seguimiento de acciones correctivas' },
          { id: 'e85', label: 'Validar: ¿Tienen responsable de seguridad e higiene?' },
          { id: 'e86', label: 'Validar: ¿Cómo reportan incidentes hoy?' },
        ],
      },
      {
        id: 'e-cierre', title: 'Cierre y Priorización', icon: Target, duration: '15 min',
        items: [
          { id: 'e99', label: 'Pedir puntuación 1-5 de cada módulo (uso actual vs utilidad)' },
          { id: 'e100', label: 'Definir Top 3 prioridades de mejora' },
          { id: 'e101', label: 'Registrar compromisos y plazos de Grow Labs' },
        ],
      },
    ],
  },
  {
    id: 'carlos',
    title: 'Capacitación Carlos — WhatsApp / Rombo Bot',
    person: 'Carlos',
    device: 'Celular (WhatsApp)',
    deviceIcon: Smartphone,
    color: 'from-emerald-800',
    colorTo: 'to-emerald-600',
    textColor: 'text-emerald-100',
    meetingDate: '05/06',
    sections: [
      {
        id: 'c-ctx', title: 'Contexto y Explicación', icon: MessageSquare, duration: '5 min',
        items: [
          { id: 'c1', label: 'Explicar qué es Rombo (asistente IA por WhatsApp)' },
          { id: 'c2', label: 'Explicar qué puede hacer Carlos desde el celular', description: 'Pedidos de compra, fotos de facturas/remitos, consultas de estado, alertas' },
        ],
      },
      {
        id: 'c-demo', title: 'Demo en Vivo', icon: Smartphone, duration: '15 min',
        items: [
          { id: 'c3', label: 'Abrir WhatsApp en el celular de Carlos' },
          { id: 'c4', label: 'Enviar mensaje de prueba al bot Rombo' },
          { id: 'c5', label: 'CASO 1: Crear pedido de compra por texto', description: 'Enviar un mensaje con material, cantidad y obra destino' },
          { id: 'c6', label: 'CASO 2: Enviar foto de remito/factura', description: 'Validar OCR y procesamiento automático' },
          { id: 'c7', label: 'CASO 3: Consultar estado de pedido existente' },
          { id: 'c8', label: 'Mostrar en pantalla cómo llega el pedido al sistema' },
        ],
      },
      {
        id: 'c-val', title: 'Validación Técnica', icon: CheckCircle2, duration: '5 min',
        items: [
          { id: 'c9', label: 'Verificar: número de Carlos configurado como autorizado' },
          { id: 'c10', label: 'Verificar: bot responde correctamente al primer mensaje' },
          { id: 'c11', label: 'Verificar: pedido aparece en módulo Pedidos de Compra' },
          { id: 'c12', label: 'Verificar: foto de factura se procesa (OCR) correctamente' },
          { id: 'c13', label: 'Verificar: respuestas del bot en español argentino' },
        ],
      },
      {
        id: 'c-feed', title: 'Feedback de Carlos', icon: User, duration: '10 min',
        items: [
          { id: 'c14', label: 'Preguntar: ¿Te resulta natural hablar con el bot?' },
          { id: 'c15', label: 'Preguntar: ¿Qué más te gustaría hacer desde el celular?' },
          { id: 'c16', label: 'Preguntar: ¿Preferís texto o audios?' },
          { id: 'c17', label: 'Preguntar: ¿En qué momentos del día usarías esto?' },
          { id: 'c18', label: 'Preguntar: ¿Qué pasa si te equivocás en un pedido?' },
          { id: 'c19', label: 'Registrar puntuación: facilidad, velocidad, precisión, utilidad (1-5)' },
        ],
      },
    ],
  },
  {
    id: 'carlos2',
    title: 'Implementación Carlos — Puesta en Marcha del Sistema',
    person: 'Carlos',
    device: 'PC (Navegador)',
    deviceIcon: Monitor,
    color: 'from-teal-800',
    colorTo: 'to-teal-600',
    textColor: 'text-teal-100',
    meetingDate: '10/06',
    meetingTime: '16:00 hs',
    sections: [
      {
        id: 'c2-cheques', title: 'Cheques — Carga y Gestión en Vivo', icon: Landmark, duration: '20 min',
        items: [
          { id: 'c2-1', label: 'Carlos carga un cheque real en el sistema', description: 'Verificar que los datos coincidan con el cheque físico o escaneado' },
          { id: 'c2-2', label: 'Verificar estados del cheque (en cartera, depositado, endosado, rechazado)' },
          { id: 'c2-3', label: 'Comprobar que la capacidad de sacar cheques se refleja correctamente' },
          { id: 'c2-4', label: 'Validar: ¿Los datos del sistema coinciden con tu Excel de cheques?' },
        ],
      },
      {
        id: 'c2-compras', title: 'Compras & Libro IVA — Carga Real', icon: ShoppingCart, duration: '20 min',
        items: [
          { id: 'c2-5', label: 'Carlos carga una factura de compra real en el sistema', description: 'Usar OCR o carga manual, verificar proveedor, monto, IVA' },
          { id: 'c2-6', label: 'Verificar que la factura se refleje en el Libro IVA Compras' },
          { id: 'c2-7', label: 'Verificar cruce factura → proveedor → pago' },
          { id: 'c2-8', label: 'Validar: ¿El flujo de carga es más rápido que el Excel?' },
        ],
      },
      {
        id: 'c2-pedidos', title: 'Pedidos de Compra — Flujo Completo', icon: ShoppingBag, duration: '15 min',
        items: [
          { id: 'c2-9', label: 'Carlos crea un pedido de compra desde el sistema' },
          { id: 'c2-10', label: 'Verificar flujo solicitud → aprobación → compra' },
          { id: 'c2-11', label: 'Validar: ¿Los pedidos pendientes se ven claros?' },
          { id: 'c2-12', label: 'Validar: ¿El sistema refleja lo que tenés en tu Excel de pedidos?' },
        ],
      },
      {
        id: 'c2-servicios', title: 'Servicios & Obligaciones', icon: Bell, duration: '15 min',
        items: [
          { id: 'c2-13', label: 'Carlos carga un servicio/obligación real (luz, gas, seguros, etc.)' },
          { id: 'c2-14', label: 'Verificar calendario de vencimientos y alertas' },
          { id: 'c2-15', label: 'Validar: ¿Están todos los servicios que manejás actualmente?' },
          { id: 'c2-16', label: 'Validar: ¿Las fechas de vencimiento son correctas?' },
        ],
      },
      {
        id: 'c2-gastos', title: 'Gastos Operativos — Registro Real', icon: Wallet, duration: '15 min',
        items: [
          { id: 'c2-17', label: 'Carlos carga gastos reales del mes en curso' },
          { id: 'c2-18', label: 'Verificar categorización automática vs manual' },
          { id: 'c2-19', label: 'Revisar reporte de gastos por período y categoría' },
          { id: 'c2-20', label: 'Validar: ¿Los totales coinciden con tu control en Excel?' },
        ],
      },
      {
        id: 'c2-disp', title: 'Disponibilidades & Liquidez', icon: LayoutDashboard, duration: '15 min',
        items: [
          { id: 'c2-21', label: 'Revisar tablero de liquidez — saldos bancarios y caja' },
          { id: 'c2-22', label: 'Verificar proyección de disponibilidad a 30/60/90 días' },
          { id: 'c2-23', label: 'Comprobar previsiones de ingresos y egresos cargadas' },
          { id: 'c2-24', label: 'Validar: ¿Los saldos del sistema reflejan la realidad?' },
        ],
      },
      {
        id: 'c2-metricas', title: 'Métricas & Dashboard BI', icon: Target, duration: '15 min',
        items: [
          { id: 'c2-25', label: 'Revisar Dashboard BI — KPIs financieros y operativos' },
          { id: 'c2-26', label: 'Verificar métricas de rentabilidad, costos y flujo de caja' },
          { id: 'c2-27', label: 'Revisar reportes exportables (Excel/PDF)' },
          { id: 'c2-28', label: 'Validar: ¿Las métricas que ves acá cubren lo que hacés en Excel?' },
        ],
      },
      {
        id: 'c2-cruce', title: 'Cruce Final — Sistema vs Excel', icon: ClipboardCheck, duration: '20 min',
        items: [
          { id: 'c2-29', label: 'Carlos abre su Excel y compara punto por punto con el sistema' },
          { id: 'c2-30', label: 'Identificar datos que están en el Excel pero no en el sistema' },
          { id: 'c2-31', label: 'Identificar datos que el sistema tiene y el Excel no' },
          { id: 'c2-32', label: 'Registrar ajustes necesarios para migración completa' },
          { id: 'c2-33', label: 'Definir fecha de corte: cuándo se deja de usar el Excel' },
          { id: 'c2-34', label: 'Validar: ¿Estás cómodo para operar solo con el sistema?' },
        ],
      },
    ],
  },
  {
    id: 'gustavo',
    title: 'Relevamiento Gustavo — Definición de Alcance y WBS',
    person: 'Gustavo',
    device: 'PC (Navegador)',
    deviceIcon: Monitor,
    color: 'from-amber-800',
    colorTo: 'to-amber-600',
    textColor: 'text-amber-100',
    sections: [
      {
        id: 'g-intro', title: 'Apertura y Contexto', icon: User, duration: '10 min',
        items: [
          { id: 'g1', label: 'Presentar el objetivo: definir qué módulos necesita la empresa' },
          { id: 'g2', label: 'Explicar brevemente qué es ECAR y qué áreas cubre' },
          { id: 'g3', label: 'Aclarar que Gustavo define las prioridades — nosotros implementamos' },
        ],
      },
      {
        id: 'g-enum', title: 'Enumeración de Módulos Necesarios', icon: ClipboardCheck, duration: '20 min',
        items: [
          { id: 'g4', label: 'Pedirle a Gustavo que enumere los módulos/áreas que necesita', description: 'Sin mostrarle el sistema todavía — que piense desde su operación' },
          { id: 'g5', label: 'Registrar cada módulo mencionado con su nombre y descripción' },
          { id: 'g6', label: 'Preguntar: ¿Qué problema resuelve cada módulo que mencionás?' },
          { id: 'g7', label: 'Preguntar: ¿Quién usa cada uno? (rol, persona, frecuencia)' },
          { id: 'g8', label: 'Preguntar: ¿Cuáles son los más urgentes para arrancar?' },
          { id: 'g9', label: 'Preguntar: ¿Hay algún módulo que hoy resuelven con planillas/papel?' },
          { id: 'g10', label: 'Clasificar cada módulo por prioridad: Crítico / Importante / Deseable' },
        ],
      },
      {
        id: 'g-detail', title: 'Detalle Funcional por Módulo', icon: MessageSquareText, duration: '30 min',
        items: [
          { id: 'g11', label: 'Para cada módulo mencionado, que Gustavo explique el flujo actual', description: '¿Cómo se hace hoy? ¿Quién interviene? ¿Dónde se registra?' },
          { id: 'g12', label: 'Registrar datos de entrada y salida de cada proceso' },
          { id: 'g13', label: 'Preguntar: ¿Qué información necesitás consultar con frecuencia?' },
          { id: 'g14', label: 'Preguntar: ¿Qué reportes o informes generás con esos datos?' },
          { id: 'g15', label: 'Preguntar: ¿Hay integraciones con otros sistemas? (contabilidad, AFIP, bancos)' },
          { id: 'g16', label: 'Preguntar: ¿Qué dolor de cabeza te genera el proceso actual?' },
          { id: 'g17', label: 'Identificar brechas entre lo que necesita y lo que ECAR ya tiene' },
        ],
      },
      {
        id: 'g-wbs', title: 'Revisión del Módulo WBS Actual', icon: Target, duration: '20 min',
        items: [
          { id: 'g18', label: 'Abrir el módulo WBS en ECAR y mostrárselo a Gustavo' },
          { id: 'g19', label: 'Mostrar estructura jerárquica de tareas por obra' },
          { id: 'g20', label: 'Mostrar diagrama Gantt con dependencias y fases' },
          { id: 'g21', label: 'Mostrar seguimiento de avance y retroalimentación' },
          { id: 'g22', label: 'Preguntar: ¿Usarían esta planificación? ¿Es demasiado o muy poco?' },
          { id: 'g23', label: 'Preguntar: ¿Qué funcionalidad falta? ¿Qué sobra?' },
          { id: 'g24', label: 'Preguntar: ¿Cómo planifican las obras actualmente? (Project, Excel, nada)' },
          { id: 'g25', label: 'Preguntar: ¿Quién carga tareas y quién controla el avance?' },
          { id: 'g26', label: 'Registrar qué cosas del WBS sirven y cuáles hay que cambiar' },
          { id: 'g27', label: 'Preguntar: ¿Necesitan vincular WBS con presupuesto y costos reales?' },
        ],
      },
      {
        id: 'g-match', title: 'Cruce con Módulos Existentes de ECAR', icon: LayoutDashboard, duration: '15 min',
        items: [
          { id: 'g28', label: 'Mostrar el listado completo de módulos que ECAR ya tiene' },
          { id: 'g29', label: 'Marcar cuáles coinciden con lo que Gustavo pidió' },
          { id: 'g30', label: 'Identificar módulos que ECAR tiene pero Gustavo no mencionó', description: '¿No los necesita o no sabía que existían?' },
          { id: 'g31', label: 'Identificar módulos que Gustavo pidió y ECAR no tiene aún' },
          { id: 'g32', label: 'Para cada brecha, estimar complejidad: Rápido / Medio / Desarrollo nuevo' },
        ],
      },
      {
        id: 'g-cierre', title: 'Cierre y Próximos Pasos', icon: Target, duration: '10 min',
        items: [
          { id: 'g33', label: 'Resumir los módulos priorizados por Gustavo' },
          { id: 'g34', label: 'Definir Top 5 módulos para la primera etapa de implementación' },
          { id: 'g35', label: 'Acordar cronograma tentativo de entregas' },
          { id: 'g36', label: 'Definir próxima reunión de seguimiento' },
          { id: 'g37', label: 'Registrar compromisos de ambas partes' },
        ],
      },
    ],
  },
];

const STORAGE_KEY = 'ecar_implementation_state';
const SUPABASE_SETTING_KEY = 'implementation_state';
const DEBOUNCE_MS = 1000;

function loadLocalState(): ImplState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { checked: {}, notes: {} };
}

function saveLocalState(state: ImplState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ═══════════════════════════════════════════════════════════════ */
/*  FILE VIEWER COMPONENT                                         */
/* ═══════════════════════════════════════════════════════════════ */

const FileViewer: React.FC<{
  file: MeetingAttachment | null;
  onClose: () => void;
}> = ({ file, onClose }) => {
  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type.includes('pdf');
  const isText = file.type.includes('text/plain') || file.type.includes('text/csv');
  const isOffice = file.type.includes('word') || file.type.includes('document') ||
    file.type.includes('excel') || file.type.includes('spreadsheet') || file.type.includes('.sheet') ||
    file.type.includes('powerpoint') || file.type.includes('presentation');

  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`;

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <Eye size={16} className="text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
              <p className="text-[10px] text-gray-400">{file.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              title="Abrir en nueva pestaña"
            >
              <Maximize2 size={16} />
            </a>
            <a
              href={file.url}
              download={file.name}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="Descargar"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-0">
          {isImage && (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain p-4"
            />
          )}
          {isPdf && (
            <iframe
              src={file.url}
              className="w-full h-full min-h-[70vh] border-0"
              title={file.name}
            />
          )}
          {isText && (
            <TextFileViewer url={file.url} />
          )}
          {isOffice && (
            <iframe
              src={officeViewerUrl}
              className="w-full h-full min-h-[70vh] border-0"
              title={file.name}
              onError={() => {
                // Fallback: try Google viewer
              }}
            />
          )}
          {!isImage && !isPdf && !isText && !isOffice && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={64} className="text-gray-300 mb-4" />
              <p className="text-sm font-bold text-gray-600 mb-1">Vista previa no disponible</p>
              <p className="text-xs text-gray-400 mb-4">Este tipo de archivo no se puede previsualizar directamente</p>
              <a
                href={file.url}
                download={file.name}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
              >
                <Download size={16} /> Descargar Archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* Text File Viewer sub-component */
const TextFileViewer: React.FC<{ url: string }> = ({ url }) => {
  const [content, setContent] = useState<string>('Cargando...');
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.text();
      })
      .then(text => setContent(text))
      .catch(() => {
        setError(true);
        setContent('No se pudo cargar el archivo de texto.');
      });
  }, [url]);

  return (
    <div className="w-full h-full min-h-[60vh] overflow-auto p-6">
      <pre className={`text-sm font-mono leading-relaxed whitespace-pre-wrap break-words ${error ? 'text-red-500' : 'text-gray-700'} bg-white rounded-lg border border-gray-200 p-4 shadow-inner`}>
        {content}
      </pre>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  COMPONENTS                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const SectionBlock: React.FC<{
  section: TaskSection;
  checked: Record<string, boolean>;
  notes: Record<string, string>;
  onToggle: (id: string) => void;
  onNote: (id: string, val: string) => void;
  accentColor: string;
}> = ({ section, checked, notes, onToggle, onNote, accentColor }) => {
  const [open, setOpen] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const done = section.items.filter(i => checked[i.id]).length;
  const total = section.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const Icon = section.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <Icon size={18} className={accentColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">{section.title}</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
              <Clock size={10} /> {section.duration}
            </span>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-ecar-blue'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold ${pct === 100 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {done}/{total}
            </span>
          </div>
        </div>
        {pct === 100 && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
        {open ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
      </button>

      {/* Items */}
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {section.items.map(item => {
            const isDone = !!checked[item.id];
            const hasNote = !!notes[item.id];
            const isEditing = editingNote === item.id;

            return (
              <div key={item.id} className={`px-5 py-3 ${isDone ? 'bg-emerald-50/40' : 'hover:bg-gray-50/50'} transition-colors`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => onToggle(item.id)} className="mt-0.5 shrink-0">
                    {isDone
                      ? <CheckCircle2 size={18} className="text-emerald-500" />
                      : <Circle size={18} className="text-gray-300 hover:text-ecar-blue transition-colors" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                    {/* Note */}
                    {(hasNote || isEditing) && (
                      <div className="mt-2">
                        {isEditing ? (
                          <textarea
                            autoFocus
                            value={notes[item.id] || ''}
                            onChange={e => onNote(item.id, e.target.value)}
                            onBlur={() => setEditingNote(null)}
                            placeholder="Escribí las notas acá..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all resize-none"
                            rows={2}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingNote(item.id)}
                            className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors"
                          >
                            📝 {notes[item.id]}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Add note button */}
                  {!hasNote && !isEditing && (
                    <button
                      onClick={() => setEditingNote(item.id)}
                      className="text-gray-300 hover:text-amber-500 transition-colors shrink-0 mt-0.5"
                      title="Agregar nota"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN MODULE                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export const ImplementationModule: React.FC = () => {
  const [state, setState] = useState<ImplState>(loadLocalState);
  const [activePhase, setActivePhase] = useState<string>('enrico');
  const [syncing, setSyncing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'checklist' | 'meetings'>('checklist');

  // Meetings state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [expandedMeetings, setExpandedMeetings] = useState<Record<string, boolean>>({});
  const [syncingMeetings, setSyncingMeetings] = useState(false);
  const [viewingFile, setViewingFile] = useState<MeetingAttachment | null>(null);

  // Form states
  const [formDate, setFormDate] = useState('');
  const [formResponsibles, setFormResponsibles] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formDevelopment, setFormDevelopment] = useState('');
  const [formAttachments, setFormAttachments] = useState<MeetingAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Supabase hooks
  const { data: remoteSetting, isLoading: remoteLoading } = useSystemSetting(SUPABASE_SETTING_KEY);
  const { data: remoteMeetings, isLoading: remoteMeetingsLoading } = useSystemSetting('implementation_meetings');
  const upsertSetting = useUpsertSystemSetting();

  // Load checklist from Supabase on mount
  useEffect(() => {
    if (!remoteLoading && remoteSetting?.value && !initialLoadDone.current) {
      initialLoadDone.current = true;
      try {
        const remote: ImplState = JSON.parse(remoteSetting.value);
        if (Object.keys(remote.checked).length > 0 || Object.keys(remote.notes).length > 0) {
          setState(remote);
          saveLocalState(remote);
        }
      } catch { /* ignore bad JSON */ }
    } else if (!remoteLoading && !remoteSetting?.value) {
      initialLoadDone.current = true;
    }
  }, [remoteLoading, remoteSetting]);

  // Load meetings from Supabase on mount
  useEffect(() => {
    if (!remoteMeetingsLoading && remoteMeetings?.value) {
      try {
        const loaded: Meeting[] = JSON.parse(remoteMeetings.value);
        setMeetings(loaded);
      } catch { /* ignore bad JSON */ }
    }
  }, [remoteMeetingsLoading, remoteMeetings]);

  // Debounced save for checklist
  const persistState = useCallback((newState: ImplState) => {
    saveLocalState(newState);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSyncing(true);
      upsertSetting.mutate(
        { key: SUPABASE_SETTING_KEY, value: JSON.stringify(newState), description: 'Estado del checklist de implementación' },
        { onSettled: () => setSyncing(false) }
      );
    }, DEBOUNCE_MS);
  }, [upsertSetting]);

  // Save meetings list
  const persistMeetings = (newMeetings: Meeting[]) => {
    setMeetings(newMeetings);
    setSyncingMeetings(true);
    upsertSetting.mutate(
      { key: 'implementation_meetings', value: JSON.stringify(newMeetings), description: 'Registro de reuniones de implementación' },
      { onSettled: () => setSyncingMeetings(false) }
    );
  };

  // Auto-save checklist on state change
  useEffect(() => {
    if (initialLoadDone.current) {
      persistState(state);
    }
  }, [state]);

  const toggleCheck = (id: string) => {
    setState(prev => ({
      ...prev,
      checked: { ...prev.checked, [id]: !prev.checked[id] },
    }));
  };

  const setNote = (id: string, val: string) => {
    setState(prev => ({
      ...prev,
      notes: { ...prev.notes, [id]: val },
    }));
  };

  const resetAll = () => {
    if (confirm('¿Estás seguro de reiniciar todo el progreso?')) {
      const empty: ImplState = { checked: {}, notes: {} };
      setState(empty);
      upsertSetting.mutate({ key: SUPABASE_SETTING_KEY, value: JSON.stringify(empty), description: 'Estado del checklist de implementación' });
    }
  };

  // Meetings handlers
  const handleStartAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormResponsibles('');
    setFormObjective('');
    setFormDevelopment('');
    setFormAttachments([]);
    setIsAddingMeeting(true);
    setEditingMeeting(null);
  };

  const handleStartEdit = (meeting: Meeting) => {
    setFormDate(meeting.date);
    setFormResponsibles(meeting.responsibles);
    setFormObjective(meeting.objective);
    setFormDevelopment(meeting.development);
    setFormAttachments(meeting.attachments || []);
    setEditingMeeting(meeting);
    setIsAddingMeeting(false);
  };

  // File upload handler
  const handleUploadFiles = async (files: FileList) => {
    setUploadingFiles(true);
    const newAttachments: MeetingAttachment[] = [...formAttachments];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `meetings/${Date.now()}_${safeName}`;
      try {
        const { error } = await supabase.storage.from('meeting-files').upload(path, file);
        if (error) {
          console.error('Upload error:', error.message);
          continue;
        }
        const { data: { publicUrl } } = supabase.storage.from('meeting-files').getPublicUrl(path);
        newAttachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type || 'application/octet-stream',
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setFormAttachments(newAttachments);
    setUploadingFiles(false);
  };

  const removeFormAttachment = (idx: number) => {
    setFormAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('.sheet')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text/plain')) return '📃';
    return '📎';
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formResponsibles || !formObjective || !formDevelopment) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    let updatedMeetings: Meeting[];
    if (editingMeeting) {
      updatedMeetings = meetings.map(m =>
        m.id === editingMeeting.id
          ? {
              ...m,
              date: formDate,
              responsibles: formResponsibles,
              objective: formObjective,
              development: formDevelopment,
              attachments: formAttachments,
            }
          : m
      );
    } else {
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newMeeting: Meeting = {
        id: randomId,
        date: formDate,
        responsibles: formResponsibles,
        objective: formObjective,
        development: formDevelopment,
        createdAt: new Date().toISOString(),
        attachments: formAttachments,
      };
      updatedMeetings = [newMeeting, ...meetings];
    }

    persistMeetings(updatedMeetings);
    setIsAddingMeeting(false);
    setEditingMeeting(null);
  };

  const handleDeleteMeeting = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de reunión?')) {
      const updated = meetings.filter(m => m.id !== id);
      persistMeetings(updated);
    }
  };

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [meetings]);

  // Stats
  const stats = useMemo(() => {
    const result: Record<string, { done: number; total: number }> = {};
    let totalDone = 0, totalAll = 0;
    for (const phase of PHASES) {
      let pDone = 0, pTotal = 0;
      for (const section of phase.sections) {
        for (const item of section.items) {
          pTotal++;
          if (state.checked[item.id]) pDone++;
        }
      }
      result[phase.id] = { done: pDone, total: pTotal };
      totalDone += pDone;
      totalAll += pTotal;
    }
    result['_total'] = { done: totalDone, total: totalAll };
    return result;
  }, [state.checked]);

  const totalPct = stats['_total'].total > 0
    ? Math.round((stats['_total'].done / stats['_total'].total) * 100) : 0;

  const phase = PHASES.find(p => p.id === activePhase)!;
  const DeviceIcon = phase.deviceIcon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-800 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Rocket size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <Rocket size={24} /> Implementación
          </h3>
          <p className="text-rose-100 text-sm mt-1">
            Checklist de capacitación y puesta en marcha del sistema con los encargados
          </p>
        </div>
      </div>

      {/* Selector de Pestañas Principal */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'checklist'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardCheck size={16} />
          Plan de Capacitación
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'meetings'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} />
          Registro de Reuniones
        </button>
      </div>

      {activeTab === 'checklist' ? (
        <>
          {/* Progress overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Total */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2">
                <Trophy size={16} className="text-amber-500" /> Progreso Total
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-gray-800 font-mono">{totalPct}%</p>
                <p className="text-xs text-gray-400 mb-1">{stats['_total'].done} de {stats['_total'].total} tareas</p>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${totalPct === 100 ? 'bg-emerald-500' : 'bg-ecar-blue'}`}
                  style={{ width: `${totalPct}%` }}
                />
              </div>
            </div>

            {/* Per person */}
            {PHASES.map(p => {
              const s = stats[p.id];
              const pPct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePhase(p.id)}
                  className={`bg-white border rounded-xl p-5 shadow-sm text-left transition-all hover:shadow-md ${activePhase === p.id ? 'border-ecar-blue ring-2 ring-ecar-blue/20' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2">
                    <User size={16} className={p.id === 'enrico' ? 'text-indigo-500' : p.id === 'gustavo' ? 'text-amber-500' : p.id === 'carlos2' ? 'text-teal-500' : 'text-emerald-500'} />
                    {p.person}
                    {p.meetingDate && (
                      <span className="text-[10px] text-gray-400 font-medium">({p.meetingDate})</span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
                      <p.deviceIcon size={12} /> {p.device}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black text-gray-800 font-mono">{pPct}%</p>
                    <p className="text-xs text-gray-400 mb-0.5">{s.done}/{s.total}</p>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pPct === 100 ? 'bg-emerald-500' : p.id === 'enrico' ? 'bg-indigo-500' : p.id === 'gustavo' ? 'bg-amber-500' : p.id === 'carlos2' ? 'bg-teal-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Phase tabs */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-1">
              {PHASES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePhase(p.id)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activePhase === p.id
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <p.deviceIcon size={16} />
                  {p.person}
                </button>
              ))}
            </div>
            <button
              onClick={resetAll}
              className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Reiniciar progreso"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Phase header */}
          <div className={`bg-gradient-to-r ${phase.color} ${phase.colorTo} rounded-xl p-5 text-white shadow-md relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DeviceIcon size={80} />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {phase.person.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-lg">{phase.person}</h4>
                <p className={`text-sm ${phase.textColor} flex items-center gap-1 flex-wrap`}>
                  <DeviceIcon size={14} /> {phase.device}
                  {phase.meetingDate && (
                    <>
                      <span className="mx-1">·</span>
                      <Calendar size={14} /> {phase.meetingDate}{phase.meetingTime ? ` — ${phase.meetingTime}` : ''}
                    </>
                  )}
                  <span className="mx-1">·</span>
                  <Clock size={14} />
                  {phase.id === 'enrico' ? '~2 hs' : phase.id === 'carlos2' ? '~2:15 hs' : phase.id === 'gustavo' ? '~1:45 hs' : '~35 min'}
                </p>
              </div>
            </div>
          </div>

          {/* Sections checklist */}
          <div className="space-y-4">
            {phase.sections.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                checked={state.checked}
                notes={state.notes}
                onToggle={toggleCheck}
                onNote={setNote}
                accentColor={phase.id === 'enrico' ? 'text-indigo-500' : phase.id === 'gustavo' ? 'text-amber-500' : phase.id === 'carlos2' ? 'text-teal-500' : 'text-emerald-500'}
              />
            ))}
          </div>

          {/* Auto-save indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-300 py-2">
            {syncing ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-300 border-t-ecar-blue rounded-full animate-spin" />
                Sincronizando...
              </>
            ) : remoteLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Save size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Guardado en la nube</span>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-gray-800">Minutas y Registro de Reuniones</h4>
              <p className="text-xs text-gray-500 mt-0.5">Historial de reuniones, acuerdos y desarrollo del proceso de implementación</p>
            </div>
            {!isAddingMeeting && !editingMeeting && (
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm hover:shadow transition-all"
              >
                <Plus size={16} />
                Registrar Reunión
              </button>
            )}
          </div>

          {/* Formulario de Carga / Edición */}
          {(isAddingMeeting || editingMeeting) && (
            <form onSubmit={handleSaveMeeting} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h5 className="font-bold text-gray-800 text-sm">
                  {editingMeeting ? 'Editar Registro de Reunión' : 'Registrar Nueva Reunión'}
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMeeting(false);
                    setEditingMeeting(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Fecha de la Reunión</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-600 block">Responsables / Participantes</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Enrico, Carlos, Gustavo, Ing. Gomez"
                    value={formResponsibles}
                    onChange={e => setFormResponsibles(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Objetivo de la Reunión</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Definir prioridades de desarrollo y fecha de capacitación de parte diario"
                  value={formObjective}
                  onChange={e => setFormObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Desarrollo y Acuerdos</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Detalla aquí los temas tratados, compromisos asumidos, plazos y cualquier nota importante de la reunión..."
                  value={formDevelopment}
                  onChange={e => setFormDevelopment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-sans resize-y"
                />
              </div>

              {/* Archivos Adjuntos */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 block">Archivos Adjuntos</label>
                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${uploadingFiles ? 'border-rose-300 bg-rose-50' : 'border-gray-300 hover:border-rose-400 hover:bg-rose-50/30'}`}>
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    {uploadingFiles ? (
                      <>
                        <div className="w-5 h-5 border-2 border-rose-400 border-t-rose-600 rounded-full animate-spin mb-1" />
                        <p className="text-xs text-rose-500 font-medium">Subiendo archivos...</p>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500"><span className="font-bold text-rose-500">Hacé click</span> o arrastrá archivos aquí</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Fotos, PDF, Excel, Word, Bloc de notas y más</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    disabled={uploadingFiles}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx,.zip,.rar"
                    onChange={e => e.target.files && e.target.files.length > 0 && handleUploadFiles(e.target.files)}
                  />
                </label>

                {/* Lista de archivos cargados */}
                {formAttachments.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {formAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 group">
                        <span className="text-sm">{getFileIcon(att.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{att.name}</p>
                          <p className="text-[10px] text-gray-400">{formatFileSize(att.size)}</p>
                        </div>
                        <button type="button" onClick={() => setViewingFile(att)} className="text-gray-400 hover:text-rose-500 transition-colors shrink-0" title="Ver archivo">
                          <Eye size={14} />
                        </button>
                        <button type="button" onClick={() => removeFormAttachment(idx)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" title="Quitar archivo">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMeeting(false);
                    setEditingMeeting(null);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                >
                  <Save size={16} />
                  Guardar Registro
                </button>
              </div>
            </form>
          )}

          {/* Listado de Reuniones */}
          {remoteMeetingsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin mb-2" />
              <p className="text-sm">Cargando registros de reuniones...</p>
            </div>
          ) : sortedMeetings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm text-gray-400 flex flex-col items-center justify-center">
              <Calendar size={48} className="text-gray-300 mb-3" />
              <h5 className="font-bold text-gray-700 text-sm">No hay reuniones registradas</h5>
              <p className="text-xs text-gray-400 max-w-sm mt-1">Registra las reuniones llevadas a cabo con el equipo para llevar un historial ordenado del proceso de implementación.</p>
              <button
                onClick={handleStartAdd}
                className="mt-4 flex items-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-all"
              >
                <Plus size={14} />
                Registrar Primera Reunión
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMeetings.map(meeting => {
                const isExpanded = !!expandedMeetings[meeting.id];
                const displayDate = meeting.date.split('-').reverse().join('/'); // DD/MM/YYYY

                return (
                  <div key={meeting.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:border-gray-300 transition-all">
                    {/* Header de la tarjeta */}
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md shrink-0">
                            <Calendar size={14} />
                            {displayDate}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users size={14} className="text-gray-400" />
                            <strong className="text-gray-600">Participantes:</strong> {meeting.responsibles}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-base font-bold text-gray-800 flex items-start gap-1.5">
                            <FileText size={18} className="text-gray-400 shrink-0 mt-0.5" />
                            {meeting.objective}
                            {meeting.attachments && meeting.attachments.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2 shrink-0">
                                <Paperclip size={10} /> {meeting.attachments.length}
                              </span>
                            )}
                          </h5>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                        <button
                          onClick={() => handleStartEdit(meeting)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => setExpandedMeetings(prev => ({ ...prev, [meeting.id]: !prev[meeting.id] }))}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all ml-1"
                        >
                          {isExpanded ? (
                            <>
                              Ocultar desarrollo
                              <ChevronUp size={14} />
                            </>
                          ) : (
                            <>
                              Ver desarrollo
                              <ChevronDown size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Desarrollo expandido */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50/50 space-y-4">
                        <div className="bg-white border border-gray-150 rounded-lg p-4 shadow-inner">
                          <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Desarrollo y Acuerdos</h6>
                          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-sans">
                            {meeting.development}
                          </p>
                        </div>

                        {/* Archivos adjuntos */}
                        {meeting.attachments && meeting.attachments.length > 0 && (
                          <div className="bg-white border border-gray-150 rounded-lg p-4 shadow-inner">
                            <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Paperclip size={12} /> Archivos Adjuntos ({meeting.attachments.length})
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {meeting.attachments.map((att, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setViewingFile(att)}
                                  className="flex items-center gap-3 bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 rounded-lg px-3 py-2.5 transition-all group text-left"
                                >
                                  <span className="text-lg">{getFileIcon(att.type)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-700 group-hover:text-rose-600 truncate transition-colors">{att.name}</p>
                                    <p className="text-[10px] text-gray-400">{formatFileSize(att.size)}</p>
                                  </div>
                                  <Eye size={14} className="text-gray-300 group-hover:text-rose-500 transition-colors shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Auto-save indicator for meetings */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-300 py-2">
            {syncingMeetings ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-300 border-t-rose-600 rounded-full animate-spin" />
                Sincronizando reuniones...
              </>
            ) : (
              <>
                <Save size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">Reuniones guardadas en la nube</span>
              </>
            )}
          </div>
        </div>
      )}
      {/* File Viewer Modal */}
      <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
    </div>
  );
};
