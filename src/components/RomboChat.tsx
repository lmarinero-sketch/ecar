import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Minimize2, Sparkles, Zap, BarChart3, Users, Banknote, Bell, FileText, ShoppingCart, Building2, ClipboardList, Truck, HardHat, Receipt, CalendarCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useStore';
import { MODULE_LABELS } from '../lib/types';
import type { ModuleId } from '../lib/types';
import { useAITokenUsage } from '../hooks/useData';

interface Message { role: 'user' | 'assistant'; content: string; }

// Quick actions per module — contextual suggestions based on what the user is viewing
const MODULE_QUICK_ACTIONS: Partial<Record<ModuleId, { icon: React.ElementType; label: string; prompt: string }[]>> = {
  bi: [
    { icon: Zap, label: 'Resumen del día', prompt: '¿Cómo está la empresa hoy? Dame el resumen ejecutivo.' },
    { icon: Banknote, label: 'Flujo de caja', prompt: '¿Cuál es mi flujo de caja para los próximos 30 días?' },
    { icon: BarChart3, label: 'Anomalías', prompt: 'Detectá anomalías en asistencia, gastos y cheques.' },
    { icon: Bell, label: 'Alertas urgentes', prompt: '¿Hay algo urgente que deba atender?' },
  ],
  purchases: [
    { icon: ShoppingCart, label: 'Facturas del mes', prompt: '¿Cuántas facturas de compra tengo este mes y cuál es el total?' },
    { icon: Receipt, label: 'IVA acumulado', prompt: '¿Cuánto IVA crédito fiscal tengo acumulado este mes?' },
    { icon: FileText, label: 'Proveedores top', prompt: '¿Cuáles son mis principales proveedores por monto facturado?' },
    { icon: Zap, label: 'Facturas sin validar', prompt: '¿Cuántas facturas están pendientes de revisión?' },
  ],
  finances: [
    { icon: Banknote, label: 'Cheques por vencer', prompt: '¿Qué cheques vencen esta semana?' },
    { icon: BarChart3, label: 'Cartera total', prompt: '¿Cuál es el total de la cartera de cheques a pagar y a cobrar?' },
    { icon: Zap, label: 'Flujo de caja 30d', prompt: '¿Cuál es mi flujo de caja para los próximos 30 días?' },
    { icon: FileText, label: 'Gastos fijos', prompt: '¿Cuánto pago en gastos fijos mensuales?' },
  ],
  obligations: [
    { icon: Bell, label: 'Próximos vencimientos', prompt: '¿Qué obligaciones vencen esta semana?' },
    { icon: CalendarCheck, label: 'Estado general', prompt: 'Dame el estado de todas las obligaciones: cuántas pendientes, pagadas y vencidas.' },
    { icon: Banknote, label: 'Monto pendiente', prompt: '¿Cuál es el monto total de obligaciones pendientes de pago?' },
    { icon: Zap, label: 'Recordatorios activos', prompt: '¿Qué recordatorios WhatsApp tengo configurados?' },
  ],
  rrhh: [
    { icon: Users, label: 'Plantilla activa', prompt: '¿Cuántos empleados activos tengo y en qué categorías?' },
    { icon: ClipboardList, label: 'Asistencia hoy', prompt: '¿Cómo está la asistencia de hoy? ¿Quién faltó?' },
    { icon: BarChart3, label: 'Anomalías asistencia', prompt: 'Detectá anomalías en asistencia del último mes.' },
    { icon: FileText, label: 'Docs pendientes', prompt: '¿Hay solicitudes de documentos pendientes?' },
  ],
  inventory: [
    { icon: ShoppingCart, label: 'Stock bajo', prompt: '¿Qué materiales tienen stock por debajo del mínimo?' },
    { icon: HardHat, label: 'Herramientas asignadas', prompt: '¿Qué herramientas están asignadas actualmente?' },
    { icon: Truck, label: 'Últimos movimientos', prompt: '¿Cuáles fueron los últimos movimientos de inventario?' },
    { icon: Zap, label: 'Resumen depósito', prompt: 'Dame un resumen general del estado del depósito.' },
  ],
  liquidity: [
    { icon: Banknote, label: 'Posición de caja', prompt: '¿Cuál es mi posición de caja actual? Saldos de cuentas bancarias.' },
    { icon: BarChart3, label: 'Proyección 30 días', prompt: 'Proyectá mi flujo de caja para los próximos 30 días con ingresos y egresos esperados.' },
    { icon: Zap, label: 'Alertas de liquidez', prompt: '¿Hay riesgo de iliquidez en las próximas semanas?' },
    { icon: FileText, label: 'Gastos vs ingresos', prompt: 'Compará gastos vs ingresos del mes actual.' },
  ],
  certifications: [
    { icon: Building2, label: 'Certificados activos', prompt: '¿Cuántos certificados de obra tengo pendientes de cobro?' },
    { icon: Banknote, label: 'Montos retenidos', prompt: '¿Cuánto tengo en retenciones (IIBB, impuesto al cheque) de certificados?' },
    { icon: Zap, label: 'Redeterminaciones', prompt: '¿Cuál es el estado de redeterminaciones de precio en mis obras?' },
  ],
  guide: [
    { icon: Zap, label: 'Ejemplos de WhatsApp', prompt: '¿Qué ejemplos de mensajes le puedo enviar al bot de WhatsApp?' },
    { icon: FileText, label: 'Módulos soportados', prompt: '¿Cuáles son los módulos del sistema y qué se puede hacer en cada uno?' },
    { icon: Users, label: 'Cargar/borrar cheques', prompt: '¿Cómo hago para cargar y borrar cheques usando WhatsApp?' },
  ],
};

const DEFAULT_QUICK_ACTIONS = [
  { icon: Zap, label: 'Resumen del día', prompt: '¿Cómo está la empresa hoy? Dame el resumen ejecutivo.' },
  { icon: Banknote, label: 'Flujo de caja', prompt: '¿Cuál es mi flujo de caja para los próximos 30 días?' },
  { icon: Users, label: 'Asistencia hoy', prompt: '¿Cómo está la asistencia de hoy?' },
  { icon: Bell, label: 'Alertas urgentes', prompt: '¿Hay algo urgente que deba atender? Cheques por vencer, obligaciones próximas.' },
];

const IDLE_PHRASES_GENERIC = [
  '🔍 Revisando los datos...',
  '📊 Todo en orden por acá',
  '💪 ¡Listo para ayudarte!',
  '☕ Tomando un cafecito...',
  '🏗️ Vigilando la obra...',
  '📋 Chequeando vencimientos...',
];

const MODULE_IDLE_PHRASES: Partial<Record<ModuleId, string[]>> = {
  bi: ['📊 Analizando los KPIs...', '🔍 Todo bajo control desde acá', '📈 Revisando métricas...'],
  purchases: ['🧾 Mirando facturas de compra...', '📑 Revisando el Libro IVA...', '🔍 Chequeando proveedores...'],
  finances: ['💰 Controlando la cartera...', '📅 Revisando cheques por vencer...', '🏦 Monitoreando el flujo de caja...'],
  obligations: ['⏰ Revisando vencimientos...', '📱 Chequeando recordatorios...', '🔔 Todo al día con las obligaciones...'],
  rrhh: ['👷 Revisando la nómina...', '📋 Chequeando asistencia...', '🪪 Verificando legajos...'],
  inventory: ['📦 Contando stock...', '🔧 Revisando herramientas...', '📋 Controlando el pañol...'],
  field: ['🏗️ Revisando partes de obra...', '☀️ Chequeando el clima de hoy...', '📝 Monitoreando avance...'],
  safety: ['🦺 Cero accidentes = objetivo...', '⚠️ Revisando observaciones...', '🔍 Chequeando seguridad...'],
  inspections: ['✅ Revisando inspecciones...', '📋 Mirando el punch list...', '🔍 Verificando calidad...'],
  rfi: ['📨 Chequeando consultas abiertas...', '🔍 Revisando RFIs pendientes...', '💡 Analizando impactos...'],
  guide: ['📖 Leyendo el manual...', '💡 Aprendiendo trucos nuevos...', '❓ ¿Tenés alguna duda de cómo se usa algo?'],
  logistics: ['📦 Controlando acopios...', '🚛 Revisando la logística...', '📊 KPIs de stock actualizados'],
  fleet: ['🚗 Chequeando la flota...', '🔧 Revisando mantenimientos...', '⛽ Controlando combustible...'],
  opportunities: ['🎯 Analizando el pipeline...', '📊 Revisando oportunidades...', '💰 Calculando conversión...'],
  purchase_orders: ['📋 Revisando OC pendientes...', '🛒 Controlando entregas...', '📦 Chequeando órdenes...'],
  nonconformities: ['⚠️ Revisando NC abiertas...', '🔍 Analizando desvíos...', '✅ Verificando correctivas...'],
  supplier_eval: ['⭐ Evaluando proveedores...', '📊 Analizando rankings...', '🏆 Revisando calificaciones...'],
};

function getIdlePhrases(moduleId: ModuleId): string[] {
  return MODULE_IDLE_PHRASES[moduleId] || IDLE_PHRASES_GENERIC;
}

// ==================== IDLE WALKER HOOK ====================
function useIdleWalker(chatOpen: boolean, moduleId: ModuleId) {
  const [walking, setWalking] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [facingRight, setFacingRight] = useState(true);
  const [phrase, setPhrase] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const animFrame = useRef<number>();
  const posRef = useRef({ x: 0, y: 0 });
  const dirRef = useRef(1); // 1 = right, -1 = left
  const IDLE_MS = 60000; // 1 minute
  const SPEED = 1.2; // px per frame
  const ROMBO_SIZE = 120;

  const startWalking = useCallback(() => {
    const startX = -ROMBO_SIZE;
    const startY = window.innerHeight - ROMBO_SIZE - 20;
    posRef.current = { x: startX, y: startY };
    dirRef.current = 1;
    setFacingRight(true);
    setPos({ x: startX, y: startY });
    setWalking(true);
    const phrases = getIdlePhrases(moduleId);
    setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    setShowPhrase(true);
    setTimeout(() => setShowPhrase(false), 4000);
  }, []);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setWalking(false);
    setShowPhrase(false);
    if (animFrame.current) cancelAnimationFrame(animFrame.current);

    if (!chatOpen) {
      idleTimer.current = setTimeout(startWalking, IDLE_MS);
    }
  }, [chatOpen, startWalking]);

  // Animation loop
  useEffect(() => {
    if (!walking) return;
    let running = true;
    const maxX = window.innerWidth - ROMBO_SIZE;

    const step = () => {
      if (!running) return;
      posRef.current.x += SPEED * dirRef.current;

      // Bounce at edges
      if (posRef.current.x >= maxX) {
        dirRef.current = -1;
        setFacingRight(false);
        posRef.current.x = maxX;
        // Random phrase on bounce
        const phrases = getIdlePhrases(moduleId);
        setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        setShowPhrase(true);
        setTimeout(() => setShowPhrase(false), 3000);
      } else if (posRef.current.x <= 0) {
        dirRef.current = 1;
        setFacingRight(true);
        posRef.current.x = 0;
      }

      setPos({ ...posRef.current });
      animFrame.current = requestAnimationFrame(step);
    };

    animFrame.current = requestAnimationFrame(step);
    return () => { running = false; if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, [walking]);

  // Track user activity
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [resetIdle]);

  return { walking, pos, facingRight, phrase, showPhrase, stopWalking: resetIdle, forceStart: startWalking };
}

// ==================== MAIN COMPONENT ====================
export const RomboChat: React.FC = () => {
  const activeModule = useAppStore((s) => s.activeModule);
  const moduleLabel = MODULE_LABELS[activeModule] || 'Dashboard';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bounce, setBounce] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevModuleRef = useRef<ModuleId>(activeModule);
  const { walking, pos, facingRight, phrase, showPhrase, stopWalking, forceStart: _forceStart } = useIdleWalker(open, activeModule);
  const { data: aiUsage } = useAITokenUsage();
  
  const tokenLimitReached = (aiUsage?.costUsd || 0) >= 10;

  // Build the contextual greeting based on the active module
  // Rich context per module — Rombo explains what the user can do HERE
  const MODULE_CAPABILITIES: Partial<Record<ModuleId, { where: string; capabilities: string[]; proTip?: string }>> = useMemo(() => ({
    bi: {
      where: 'Dashboard BI',
      capabilities: [
        'Pedirme un **resumen ejecutivo** del estado de la empresa',
        '**Detectar anomalías** en asistencia, gastos o cheques',
        'Ver **KPIs clave**: empleados, cheques, obligaciones, facturas',
        'Consultar **alertas urgentes** que requieran tu atención',
      ],
      proTip: 'Desde acá tenés la vista de pájaro de todo ECAR. Si necesitás detalle, te digo a qué módulo ir.',
    },
    purchases: {
      where: 'Compras & Libro IVA',
      capabilities: [
        'Consultar **facturas de compra** del mes y su estado',
        'Calcular el **IVA crédito fiscal** acumulado',
        'Buscar facturas por **proveedor** o estado (validado/revisar)',
        'Revisar **facturas pendientes de validación**',
      ],
      proTip: 'Podés subir una foto/PDF de factura y el OCR la procesa automáticamente.',
    },
    finances: {
      where: 'Finanzas & Tesorería',
      capabilities: [
        'Ver **cheques próximos a vencer** esta semana',
        'Consultar la **cartera total** (a cobrar y a pagar)',
        'Calcular el **flujo de caja** para los próximos 30 días',
        'Cargar un **nuevo cheque** dictándome los datos',
        'Revisar **gastos fijos** mensuales',
      ],
      proTip: 'Puedo cargar cheques por vos: decime número, banco, monto y vencimiento.',
    },
    obligations: {
      where: 'Alertas & Obligaciones',
      capabilities: [
        'Ver **obligaciones que vencen** esta semana',
        'Marcar una obligación como **pagada**',
        'Configurar **recordatorios WhatsApp** automáticos',
        'Ver el **monto total pendiente** de pago',
        'Consultar el **historial de notificaciones** enviadas',
      ],
      proTip: 'Los recordatorios se ejecutan solos cada 5 minutos desde la nube.',
    },
    rrhh: {
      where: 'RRHH & Legajos',
      capabilities: [
        'Consultar la **plantilla activa**: cuántos empleados, categorías',
        'Ver la **asistencia de hoy**: quién vino, quién faltó, tardanzas',
        '**Detectar anomalías** de presentismo del último mes',
        'Solicitar **documentos** a un empleado (DNI, ART, etc.)',
      ],
      proTip: 'Acá también se gestionan las novedades para el contador.',
    },
    inventory: {
      where: 'Pañol & Inventario',
      capabilities: [
        'Ver materiales con **stock bajo mínimo**',
        'Consultar **herramientas asignadas** a empleados',
        'Revisar los **últimos movimientos** (entradas, salidas, devoluciones)',
        'Obtener un **resumen general** del estado del pañol',
      ],
    },
    liquidity: {
      where: 'Tablero de Liquidez',
      capabilities: [
        'Consultar la **posición de caja actual** y saldos bancarios',
        '**Proyectar flujo de caja** a 30 días con ingresos y egresos',
        'Identificar **riesgos de iliquidez** próximos',
        '**Comparar gastos vs ingresos** del mes',
      ],
      proTip: 'Este tablero integra cheques, certificaciones, gastos fijos y obligaciones para darte la foto completa.',
    },
    invoicing: {
      where: 'Facturación ARCA',
      capabilities: [
        'Consultar **facturas emitidas** y su estado',
        'Revisar el estado de **CAEs** y vencimientos',
        'Ver **totales facturados** por período',
      ],
    },
    wbs: {
      where: 'Planificación WBS',
      capabilities: [
        'Consultar **avance de obra** por proyecto',
        'Comparar **presupuesto vs costo real**',
        'Identificar **desvíos** en la planificación',
        'Ver la **estructura de desglose** (WBS) de cada obra',
      ],
    },
    certifications: {
      where: 'Certificaciones / ICC',
      capabilities: [
        'Ver **certificados pendientes de cobro**',
        'Calcular **retenciones** (IIBB, imp. cheque)',
        'Revisar el estado de **redeterminaciones de precio**',
        'Registrar **depósitos** de certificados cobrados',
      ],
    },
    purchase_requests: {
      where: 'Pedidos de Compra',
      capabilities: [
        'Ver **pedidos pendientes** de aprobación',
        'Consultar montos de **pedidos consolidados**',
        'Revisar el **detalle** de cada solicitud (items, cantidades, costos)',
      ],
    },
    logistics: {
      where: 'Gerencia de Logística (PR-GL-01)',
      capabilities: [
        'Consultar **KPIs consolidados**: stock, flota, OC pendientes',
        'Ver **alertas de stock bajo** y materiales a reponer',
        'Navegar a **sub-módulos**: Depósito, Flota, OC, Pedidos',
        'Revisar los **últimos movimientos** de inventario',
      ],
      proTip: 'Este hub te da la visión 360° de toda la logística. Hacé clic en las tarjetas para ir al detalle.',
    },
    fleet: {
      where: 'Flota y Maquinaria (PR-GL-01 §4.5)',
      capabilities: [
        'Consultar el **estado de vehículos** y condición operativa',
        'Revisar **mantenimientos vencidos** y próximos',
        'Ver **cargas de combustible** y rendimiento por vehículo',
        'Generar **parte diario vehicular** con checklist',
      ],
      proTip: 'Los vehículos con mantenimiento vencido aparecen en rojo en la lista.',
    },
    field: {
      where: 'Parte Diario de Obra',
      capabilities: [
        '**Crear el parte de hoy**: decime la obra y qué se hizo',
        'Consultar **partes anteriores** por obra o fecha',
        'Aprobar o rechazar **partes pendientes**',
        'Ver un **resumen semanal** de avance',
      ],
      proTip: 'Puedo crear el parte dictándome: obra, trabajo realizado, y clima. El resto es opcional.',
    },
    safety: {
      where: 'Seguridad e Incidentes',
      capabilities: [
        'Revisar **incidentes abiertos** y su gravedad',
        'Consultar **observaciones de alto riesgo** (matriz 5×5)',
        'Ver **KPIs de seguridad**: días sin accidente, días perdidos',
        'Calcular el **índice de frecuencia** de accidentes',
      ],
      proTip: 'Cumplimiento Res. SRT 905/2015: registro obligatorio de accidentes.',
    },
    inspections: {
      where: 'Inspecciones & Calidad',
      capabilities: [
        'Consultar **inspecciones pendientes** o rechazadas',
        'Revisar items del **punch list** sin resolver',
        'Verificar **correcciones** de no conformidades',
        'Generar un **reporte de calidad** por obra',
      ],
    },
    rfi: {
      where: 'Consultas de Obra (RFI)',
      capabilities: [
        'Ver **RFIs abiertas** pendientes de respuesta',
        'Analizar el **impacto económico** acumulado de consultas',
        'Revisar **tiempos de respuesta** por consulta',
        'Identificar RFIs con **impacto en cronograma**',
      ],
      proTip: 'Las RFI trackean impacto en costo ($) y cronograma (días de atraso).',
    },
    documents: {
      where: 'Documentos & Correo',
      capabilities: [
        'Crear **solicitudes de documentos** a empleados',
        'Ver el **estado** de solicitudes pendientes',
        'Gestionar **correspondencia** del proyecto',
      ],
    },
    expenses: {
      where: 'Gastos Operativos',
      capabilities: [
        'Analizar los **gastos del mes** por categoría',
        '**Comparar** gastos de este mes vs el anterior',
        'Identificar **categorías con mayor variación**',
        'Verificar qué rubros quedan **sin pagar**',
      ],
      proTip: 'La vista replica tu planilla Excel "Resumen Gastos Mensuales ECAR" pero con IA.',
    },
    monthly_report: {
      where: 'Resumen Mensual',
      capabilities: [
        'Generar el **informe financiero** del mes',
        '**Comparar meses**: ingresos, egresos, desvíos',
        'Identificar **tendencias de gasto** por categoría',
      ],
    },
    guide: {
      where: 'Guía de Uso del Sistema',
      capabilities: [
        'Aprender a usar **cualquier módulo** del sistema',
        'Ver cómo opera el **asistente inteligente por WhatsApp**',
        'Obtener **ejemplos interactivos** de mensajes de texto y fotos para mandar por WhatsApp',
        'Consultar qué **herramientas de IA** tenemos habilitadas',
      ],
      proTip: 'Podés mandarle mensajes de WhatsApp a Rombo desde tu celular para cargar cheques, facturas, partes diarios y más.',
    },
    opportunities: {
      where: 'Pipeline de Oportunidades (PR-GPP-01 §4.1)',
      capabilities: [
        'Consultar el **funnel comercial** por etapas',
        'Ver la **tasa de conversión** de oportunidades',
        'Revisar el **monto total del pipeline** activo',
        'Mover oportunidades entre **etapas del Kanban**',
      ],
      proTip: 'Usá la vista Pipeline (Kanban) para arrastrar oportunidades entre etapas.',
    },
    purchase_orders: {
      where: 'Órdenes de Compra (PR-GC-01 §4.2-4.3)',
      capabilities: [
        'Ver **OC abiertas** y su estado',
        'Consultar **OC urgentes** pendientes',
        'Revisar el **monto comprometido** en compras',
        'Hacer seguimiento de **entregas parciales**',
      ],
      proTip: 'Las OC por encima de cierto umbral requieren aprobación de Gerencia General.',
    },
    nonconformities: {
      where: 'No Conformidades (PR-GC-01 §4.6)',
      capabilities: [
        'Consultar **No Conformidades** abiertas y vencidas',
        'Ver el **costo de la No Calidad** (CNC) general',
        'Analizar recurrencia por **tipo de desvío**',
        'Verificar el estado de las **acciones correctivas**',
      ],
      proTip: 'Las NC se integran con la evaluación de proveedores automáticamente.',
    },

    supplier_eval: {
      where: 'Evaluación de Proveedores (PR-GC-01 §4.7)',
      capabilities: [
        'Ver el **ranking de proveedores** por puntaje',
        'Consultar **evaluaciones históricas** por período',
        'Identificar proveedores **bloqueados o condicionales**',
        'Relacionar evaluaciones con **NC registradas**',
      ],
      proTip: 'Los proveedores bloqueados no aparecen como opción en nuevas OC.',
    },
  }), []);

  const contextualGreeting = useMemo(() => {
    const moduleInfo = MODULE_CAPABILITIES[activeModule];
    if (moduleInfo) {
      const capsList = moduleInfo.capabilities.map(c => `• ${c}`).join('\n');
      const tip = moduleInfo.proTip ? `\n\n💡 **Tip:** ${moduleInfo.proTip}` : '';
      return `¡Hola! 👋 Soy **Rombo**, tu asistente IA de ECAR.\n\n📍 Estás en **${moduleInfo.where}**. Acá puedo ayudarte a:\n\n${capsList}${tip}\n\n¿Qué necesitás?`;
    }
    return `¡Hola! 👋 Soy **Rombo**, tu asistente IA de ECAR.\n\n📍 Estás en **${moduleLabel}**. ¡Preguntame lo que necesites!`;
  }, [activeModule, moduleLabel, MODULE_CAPABILITIES]);

  // Initialize greeting on first render
  useEffect(() => {
    setMessages([{ role: 'assistant', content: contextualGreeting }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user navigates to a different module while chat is open, inject a rich context update
  useEffect(() => {
    if (prevModuleRef.current !== activeModule && messages.length > 0) {
      prevModuleRef.current = activeModule;
      const moduleInfo = MODULE_CAPABILITIES[activeModule];
      let navMsg: string;
      if (moduleInfo) {
        const topCaps = moduleInfo.capabilities.slice(0, 3).map(c => `• ${c}`).join('\n');
        navMsg = `📍 Cambiaste a **${moduleInfo.where}**. Acá puedo:\n\n${topCaps}\n\n¿Qué necesitás?`;
      } else {
        const navLabel = MODULE_LABELS[activeModule] || activeModule;
        navMsg = `📍 Cambiaste a **${navLabel}**. ¿En qué te ayudo acá?`;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: navMsg }]);
    }
  }, [activeModule, messages.length, MODULE_CAPABILITIES]);

  // Quick actions based on active module
  const quickActions = useMemo(() => 
    MODULE_QUICK_ACTIONS[activeModule] || DEFAULT_QUICK_ACTIONS
  , [activeModule]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { const t = setTimeout(() => setBounce(false), 8000); return () => clearTimeout(t); }, []);

  const sendMessage = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string' && e?.preventDefault) e.preventDefault();
    const text = typeof e === 'string' ? e : input;
    if (!text.trim() || tokenLimitReached || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rombo-chat', {
        body: { 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          activeModule,
          moduleLabel,
        },
      });
      const reply = error ? `⚠️ ${error.message}` : (data?.error ? `⚠️ ${data.error}` : data?.reply || '⚠️ Sin respuesta');
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '⚠️ Error de conexión.' }]);
    }
    setLoading(false);
  };

  const renderContent = (text: string) => text.split('\n').map((line, i) => (
    <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
      {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
          : part
      )}
    </p>
  ));

  const showQuickActions = messages.length <= 1 && !loading;

  const handleOpenChat = () => {
    setOpen(true);
    setBounce(false);
    stopWalking();
    setShowGreeting(true);
  };

  const handleWalkerClick = () => {
    stopWalking();
    setOpen(true);
    setShowGreeting(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (showGreeting) setShowGreeting(false);
  };

  return (
    <>
      {/* Greeting GIF overlay - positioned above chat */}
      {showGreeting && open && (
        <div className="fixed bottom-[690px] right-6 z-[70] pointer-events-none rombo-greeting-overlay">
          <img
            src="/Rombo_is_greeting_with_too_much_joy.png"
            alt="Rombo saludando"
            className="w-[200px] h-[200px] object-contain drop-shadow-2xl rombo-greeting-img"
          />
        </div>
      )}

      {/* Walking Rombo (idle animation) */}
      {walking && !open && (
        <div
          className="fixed z-[60] cursor-pointer group"
          style={{ left: pos.x, top: pos.y, transition: 'none' }}
          onClick={handleWalkerClick}
        >
          {/* Speech bubble */}
          {showPhrase && (
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 light-card shadow-lg text-xs font-bold text-gray-600 rombo-speech">
              {phrase}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
            </div>
          )}
          {/* Rombo walking GIF - no background */}
          <img
            src="/Rombo_ahora_esta_caminando_de_costado.png"
            alt="Rombo caminando"
            className="w-[140px] h-[140px] object-contain drop-shadow-2xl"
            style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
            draggable={false}
          />
          {/* Shadow */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/10 rounded-full blur-sm rombo-shadow" />
          {/* Click hint on hover */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 px-2 py-1 bg-ecar-blue text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ¡Hacé click para hablar!
          </div>
        </div>
      )}

      {/* Floating Button (only when not walking and not open) */}
      {!open && !walking && (
        <button onClick={handleOpenChat} className={`fixed bottom-6 right-6 z-50 group ${bounce ? 'animate-bounce' : ''}`} title="Hablá con Rombo">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white shadow-xl border-2 border-ecar-blue/20 overflow-hidden transition-transform group-hover:scale-110 group-active:scale-95">
              <img src="/rombo.jpeg" alt="Rombo" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
          </div>
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ¡Preguntale a Rombo! 🤖
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[650px] max-h-[calc(100vh-3rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" style={{ animation: 'romboSlideUp 0.3s ease-out' }}>
          <div className="bg-gradient-to-r from-ecar-blue to-ecar-blueDark p-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white/30 shrink-0">
              <img src="/rombo.jpeg" alt="Rombo" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                Rombo <span className="text-[9px] font-normal bg-white/20 px-1.5 py-0.5 rounded-full">GPT-5.4 mini</span>
                {aiUsage && (
                  <span className={`text-[9px] font-normal px-1.5 py-0.5 rounded-full ${tokenLimitReached ? 'bg-red-500/80 text-white' : 'bg-green-500/80 text-white'}`} title={`${aiUsage.total.toLocaleString()} tokens`}>
                    ${aiUsage.costUsd.toFixed(2)} / $10
                  </span>
                )}
              </h4>
              <p className="text-blue-200 text-[10px]">📍 {moduleLabel}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors"><Minimize2 size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-200 mt-1">
                    <img src="/rombo.jpeg" alt="R" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-ecar-blue text-white rounded-br-md' : 'bg-white text-gray-700 border border-gray-200 shadow-sm rounded-bl-md'}`}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}
            {showQuickActions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {quickActions.map((qa, i) => (
                  <button key={i} onClick={() => sendMessage(qa.prompt)} className="flex items-center gap-2 px-3 py-2.5 light-card text-xs font-medium text-gray-600 hover:border-ecar-blue/40 hover:text-ecar-blue hover:shadow-sm transition-all text-left">
                    <qa.icon size={14} className="text-ecar-blue shrink-0" /> {qa.label}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-200 mt-1">
                  <img src="/rombo.jpeg" alt="R" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-ecar-blue/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-ecar-blue/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-ecar-blue/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[10px] text-gray-400 ml-2">Consultando datos...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            {tokenLimitReached ? (
              <div className="text-xs text-red-500 font-medium text-center p-2 bg-red-50 rounded-lg border border-red-100">
                Límite de $10 USD alcanzado. Por favor, contacte al administrador.
              </div>
            ) : (
              <form onSubmit={sendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Escribí tu consulta acá..."
                  disabled={loading}
                  className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-1 w-8 h-8 flex items-center justify-center bg-ecar-blue text-white rounded-full disabled:bg-gray-300 disabled:text-gray-500 hover:bg-ecar-blueDark transition-colors"
                >
                  <Send size={14} className={input.trim() && !loading ? 'translate-x-[1px]' : ''} />
                </button>
              </form>
            )}
            <p className="text-[10px] text-gray-400 text-center mt-2">Rombo puede cometer errores. Verificá los datos importantes.</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes romboSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rombo-shadow {
          animation: romboShadow 0.5s ease-in-out infinite;
        }
        @keyframes romboShadow {
          0%, 50%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.1; }
          25%, 75% { transform: translateX(-50%) scaleX(0.7); opacity: 0.05; }
        }
        .rombo-speech {
          animation: romboFadeIn 0.3s ease-out;
        }
        @keyframes romboFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .rombo-greeting-overlay {
          animation: greetingFadeIn 0.6s ease-out;
        }
        .rombo-greeting-img {
          animation: greetingPulse 2s ease-in-out infinite;
        }
        @keyframes greetingFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes greetingPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};
