import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Minimize2, Sparkles, Zap, BarChart3, Users, Banknote, Bell, FileText, ShoppingCart, Building2, ClipboardList, Truck, HardHat, Receipt, CalendarCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useStore';
import { MODULE_LABELS } from '../lib/types';
import type { ModuleId } from '../lib/types';

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
    { icon: Zap, label: 'Resumen pañol', prompt: 'Dame un resumen general del estado del pañol.' },
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
};

const DEFAULT_QUICK_ACTIONS = [
  { icon: Zap, label: 'Resumen del día', prompt: '¿Cómo está la empresa hoy? Dame el resumen ejecutivo.' },
  { icon: Banknote, label: 'Flujo de caja', prompt: '¿Cuál es mi flujo de caja para los próximos 30 días?' },
  { icon: Users, label: 'Asistencia hoy', prompt: '¿Cómo está la asistencia de hoy?' },
  { icon: Bell, label: 'Alertas urgentes', prompt: '¿Hay algo urgente que deba atender? Cheques por vencer, obligaciones próximas.' },
];

const IDLE_PHRASES = [
  '🔍 Revisando los datos...',
  '📊 Todo en orden por acá',
  '💪 ¡Listo para ayudarte!',
  '☕ Tomando un cafecito...',
  '🏗️ Vigilando la obra...',
  '📋 Chequeando vencimientos...',
];

// ==================== IDLE WALKER HOOK ====================
function useIdleWalker(chatOpen: boolean) {
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
    setPhrase(IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)]);
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
        setPhrase(IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)]);
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
  const { walking, pos, facingRight, phrase, showPhrase, stopWalking, forceStart: _forceStart } = useIdleWalker(open);

  // Build the contextual greeting based on the active module
  const contextualGreeting = useMemo(() => {
    const moduleHints: Partial<Record<ModuleId, string>> = {
      bi: 'Estás en el **Dashboard BI**. Puedo darte un resumen ejecutivo, detectar anomalías o mostrarte KPIs clave.',
      purchases: 'Estás en **Compras & Libro IVA**. Puedo consultar facturas, calcular IVA crédito fiscal o buscar proveedores.',
      finances: 'Estás en **Finanzas & Tesorería**. Puedo consultar la cartera de cheques, calcular flujo de caja o revisar gastos fijos.',
      obligations: 'Estás en **Alertas & Obligaciones**. Puedo ver vencimientos próximos, marcar obligaciones como pagadas o configurar recordatorios WhatsApp.',
      rrhh: 'Estás en **RRHH & Legajos**. Puedo consultar la plantilla, verificar asistencia, solicitar documentos o detectar anomalías.',
      inventory: 'Estás en **Pañol & Inventario**. Puedo revisar stock, herramientas asignadas o movimientos recientes.',
      liquidity: 'Estás en el **Tablero de Liquidez**. Puedo proyectar tu flujo de caja, analizar la posición de caja o alertarte sobre riesgos.',
      invoicing: 'Estás en **Facturación ARCA**. Puedo ayudarte con la emisión de facturas electrónicas y consultar el estado de CAEs.',
      wbs: 'Estás en **Planificación WBS**. Puedo consultar avances de obra, presupuestos y estructura de desglose.',
      certifications: 'Estás en **Certificaciones / ICC**. Puedo revisar certificados pendientes, retenciones y redeterminaciones.',
      purchase_requests: 'Estás en **Pedidos de Compra**. Puedo consultar solicitudes pendientes, aprobar o consolidar pedidos.',
      logistics: 'Estás en **Acopios & Logística**. Puedo revisar la logística de materiales y acopios de obra.',
      fleet: 'Estás en **Flota y Maquinaria**. Puedo consultar el estado de vehículos y maquinaria.',
      field: 'Estás en **Parte Diario**. Puedo ayudarte con el registro diario de actividades en obra.',
      documents: 'Estás en **Documentos & Correo**. Puedo gestionar solicitudes de documentos y correspondencia.',
      monthly_report: 'Estás en **Resumen Mensual**. Puedo generar el informe financiero del mes.',
    };
    const hint = moduleHints[activeModule] || `Estás en **${moduleLabel}**. ¡Preguntame lo que necesites!`;
    return `¡Hola! 👋 Soy **Rombo**, tu asistente IA de ECAR.\n\n📍 ${hint}\n\n¡Preguntame lo que necesites!`;
  }, [activeModule, moduleLabel]);

  // Initialize greeting on first render
  useEffect(() => {
    setMessages([{ role: 'assistant', content: contextualGreeting }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user navigates to a different module while chat is open, inject a context update
  useEffect(() => {
    if (prevModuleRef.current !== activeModule && messages.length > 0) {
      prevModuleRef.current = activeModule;
      const navLabel = MODULE_LABELS[activeModule] || activeModule;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `📍 Veo que cambiaste a **${navLabel}**. ¿En qué te ayudo acá?` 
      }]);
    }
  }, [activeModule, messages.length]);

  // Quick actions based on active module
  const quickActions = useMemo(() => 
    MODULE_QUICK_ACTIONS[activeModule] || DEFAULT_QUICK_ACTIONS
  , [activeModule]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { const t = setTimeout(() => setBounce(false), 8000); return () => clearTimeout(t); }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
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
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-lg text-xs font-bold text-gray-600 rombo-speech">
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
              <h4 className="text-white font-bold text-sm flex items-center gap-1.5">Rombo <span className="text-[9px] font-normal bg-white/20 px-1.5 py-0.5 rounded-full">GPT-5.4 mini</span></h4>
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
              <div className="grid grid-cols-2 gap-2 pt-2">
                {quickActions.map((qa, i) => (
                  <button key={i} onClick={() => sendMessage(qa.prompt)} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:border-ecar-blue/40 hover:text-ecar-blue hover:shadow-sm transition-all text-left">
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

          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <div className="flex gap-2">
              <input value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ej: ¿Cuántos cheques vencen esta semana?" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" disabled={loading} />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="px-4 py-2.5 bg-ecar-blue text-white rounded-xl hover:bg-ecar-blueDark transition-all disabled:opacity-40 shrink-0"><Send size={16} /></button>
            </div>
            <p className="text-[9px] text-gray-300 text-center mt-2">Potenciado por GPT-5.4 mini · Consulta y ejecuta sobre datos reales</p>
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
