import React, { useState } from 'react';
import {
  HelpCircle, Copy, Check, Smartphone, BookOpen,
  Sparkles, Send, CheckCheck, Image, Info, Layers, Bot,
  ArrowRight, ExternalLink
} from 'lucide-react';

interface SimulatedMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  image?: string;
  timestamp: string;
}

export const GuideModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'web' | 'faq'>('whatsapp');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [simulatedChat, setSimulatedChat] = useState<SimulatedMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: '¡Hola Lucas! 👋 Soy Rombo. Mandame cualquier factura, cheque, consulta o novedad de obra por acá y yo me encargo de procesarlo en el ERP.',
      timestamp: '09:00'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Copy to clipboard helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  // WhatsApp simulation prompt flows
  const simulateFlow = (type: 'check_load' | 'invoice_ocr' | 'expense' | 'attendance' | 'check_delete') => {
    setIsTyping(true);
    let userMsg: SimulatedMessage;
    let botMsg: SimulatedMessage;

    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    if (type === 'check_load') {
      userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'Cargar cheque de banco Galicia por $450.000, nro 8847293, con vencimiento el 15/07/2026. Es emitido para Proveedor Ferretería Mitre.',
        timestamp: time
      };
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: '¡Cheque cargado impecable! 🏦\n\n• **Banco:** Galicia\n• **Monto:** $ 450.000,00\n• **Número:** 8847293\n• **Vencimiento:** 15/07/2026\n• **Tipo:** Físico (Payable)\n• **Beneficiario:** Ferretería Mitre\n\nYa lo podés ver en la cartera de *Finanzas & Tesorería*.',
        timestamp: time
      };
    } else if (type === 'invoice_ocr') {
      userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'Te mando la factura de compra de materiales.',
        image: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80',
        timestamp: time
      };
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: '📄 **Factura detectada y procesada con OCR**\n\n• **Proveedor:** CORRALÓN SULIGOY S.A. (CUIT: 30-71458926-9)\n• **Factura N°:** 0004-00012847\n• **Fecha de Emisión:** 20/05/2026\n• **Neto Gravado:** $ 180.000,00\n• **IVA (21%):** $ 37.800,00\n• **Monto Total:** $ 217.800,00\n\nLa guardé como **Pendiente de revisión** en *Compras & Libro IVA* para que la valides.',
        timestamp: time
      };
    } else if (type === 'expense') {
      userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'Registrar pago de $32.000 por viandas de personal hoy en efectivo, categoría Viandas.',
        timestamp: time
      };
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: '💸 **Gasto registrado correctamente**\n\n• **Monto:** $ 32.000,00\n• **Categoría:** Viandas\n• **Descripción:** Viandas de personal hoy\n• **Medio de pago:** Efectivo (Caja Chica)\n\nEl saldo de la cuenta de caja fue ajustado.',
        timestamp: time
      };
    } else if (type === 'attendance') {
      userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: '¿Quién faltó hoy a la obra?',
        timestamp: time
      };
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: '👷 **Reporte de ausentismo para hoy (Obra Alvear & Mitre):**\n\nPresentes: 14 operarios\nAusentes: 2 operarios\n\n❌ **Ausentes:**\n1. **Gomez, Carlos** (Sin aviso - Obra Alvear)\n2. **Rodriguez, Martin** (Parte médico cargado por carpeta - Obra Mitre)\n\n¿Querés que le mande un mensaje de WhatsApp a Carlos Gomez para reclamar aviso?',
        timestamp: time
      };
    } else {
      userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'borra el cheque 8847293 de galicia',
        timestamp: time
      };
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: '🗑️ **Cheque eliminado correctamente**\n\nEl cheque Galicia N° 8847293 de $450.000 fue eliminado de forma permanente del sistema.',
        timestamp: time
      };
    }

    setSimulatedChat(prev => [...prev, userMsg]);

    setTimeout(() => {
      setIsTyping(false);
      setSimulatedChat(prev => [...prev, botMsg]);
    }, 1500);
  };

  const clearSimulation = () => {
    setSimulatedChat([
      {
        id: 'init-1',
        sender: 'bot',
        text: '¡Hola Lucas! 👋 Soy Rombo. Mandame cualquier factura, cheque, consulta o novedad de obra por acá y yo me encargo de procesarlo en el ERP.',
        timestamp: '09:00'
      }
    ]);
  };

  // Prompts array
  const WHATSAPP_PROMPTS = [
    {
      category: 'Cheques y Finanzas',
      items: [
        { text: 'Cargar cheque Galicia de $150.000 vencimiento 15/06/2026 nro 1234567 emitido para Ferretería Central', type: 'check_load' },
        { text: '¿Qué cheques vencen esta semana?', type: 'info' },
        { text: 'Borrar el cheque 1234567', type: 'check_delete' }
      ]
    },
    {
      category: 'Compras y Facturas OCR',
      items: [
        { text: '[Enviar foto de factura] Carga esta factura de compra por favor', type: 'invoice_ocr' },
        { text: '¿Cuántas facturas tengo sin validar?', type: 'info' },
        { text: '¿Cuánto IVA acumulé este mes?', type: 'info' }
      ]
    },
    {
      category: 'Caja y Movimientos',
      items: [
        { text: 'Registrar gasto de $45.000 por viáticos de obra Alvear, pagado con transferencia de Banco Galicia', type: 'expense' },
        { text: '¿Cuánta plata hay en las cuentas y cajas?', type: 'info' },
        { text: 'Registrar cobro de $2.500.000 por certificado nro 5 de obra Mitre', type: 'expense' }
      ]
    },
    {
      category: 'Personal y Obra',
      items: [
        { text: '¿Cómo viene el presentismo hoy?', type: 'attendance' },
        { text: 'Registrar parte diario obra Alvear: Hormigonado de vigas de fundación completado. Clima soleado, 4 operarios.', type: 'info' },
        { text: 'Pedirle el DNI y constancia de ART a Jorge Gimenez', type: 'info' }
      ]
    }
  ];

  // System Modules info
  const SYSTEM_MODULES = [
    {
      name: 'Compras & Libro IVA',
      color: 'border-l-violet-500',
      icon: '🧾',
      description: 'Carga automática de facturas mediante fotos/PDFs procesados con inteligencia artificial (OCR). Gestión del Libro IVA Compras digital.',
      features: ['Extracción OCR en segundos', 'Validación de CUITs contra base AFIP', 'Exportación de Libro IVA Excel/TXT', 'Dashboard de IVA Crédito Fiscal']
    },
    {
      name: 'Finanzas & Tesorería',
      color: 'border-l-emerald-500',
      icon: '💵',
      description: 'Gestión integral de cartera de cheques físicos y eCheqs (emitidos y recibidos). Control del flujo de caja corporativo y gastos recurrentes.',
      features: ['Proyección de flujo de caja 30/60/90 días', 'Alertas de vencimiento automatizadas', 'Gestión de gastos fijos mensuales', 'Carga de cheques por foto (OCR)']
    },
    {
      name: 'RRHH & Asistencia',
      color: 'border-l-indigo-500',
      icon: '👷',
      description: 'Fichajes de entrada/salida mediante códigos QR geolocalizados desde el celular. Legajo digital de personal y novedades de liquidación.',
      features: ['Fichadas QR seguras y en vivo', 'Legajo digital completo (DNI, Recibos)', 'Exportación de novedades para el contador', 'Cálculo automático de horas trabajadas']
    },
    {
      name: 'Alertas & Obligaciones',
      color: 'border-l-amber-500',
      icon: '🔔',
      description: 'Agenda centralizada de obligaciones impositivas, gremiales y contractuales (F931, ART, alquileres) con alertas automáticas.',
      features: ['Envío automático de notificaciones WhatsApp', 'Integración con cronogramas de AFIP', 'Matriz de vencimientos por empresa', 'Historial de pagos documentado']
    },
    {
      name: 'Parte Diario & Avances',
      color: 'border-l-yellow-500',
      icon: '🏗️',
      description: 'Reportes de campo directos desde las obras con fotos, clima del día obtenido por geolocalización, operarios y tareas ejecutadas.',
      features: ['Carga rápida optimizada para celular', 'Detección automática de clima/temp', 'Workflow de aprobación oficina-obra', 'Firma digital de conformidad']
    },
    {
      name: 'Seguridad & Calidad',
      color: 'border-l-red-500',
      icon: '🦺',
      description: 'Matriz de riesgo de incidentes, checklists de control de calidad en obra y punch list de no conformidades con plazos de resolución.',
      features: ['Matriz 5x5 de evaluación de severidad', 'Fichas de incidentes con causa raíz', 'Auditorías de calidad fotográficas', 'Asignación de plazos y responsables']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Gradient Module Banner */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <BookOpen size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <HelpCircle size={24} /> Centro de Aprendizaje
          </h3>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl">
            ¡Te damos la bienvenida al manual interactivo de ECAR! Aprendé a usar cada uno de los módulos y cómo interactuar con Rombo a través de WhatsApp.
          </p>
        </div>
      </div>

      {/* Stats Cards / KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              <Smartphone size={15} className="text-ecar-blue" /> Celular de Rombo
            </div>
            <p className="text-xl font-bold text-slate-800 font-mono">+54 9 11 3016-8646</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-green-700 font-bold">Activo en WhatsApp</span>
            </div>
          </div>
          <div className="bg-green-50 p-2.5 rounded-lg">
            <Bot size={22} className="text-green-600" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              <Sparkles size={15} className="text-violet-500" /> Tecnología de IA
            </div>
            <p className="text-xl font-bold text-slate-800">Procesamiento Natural</p>
            <p className="text-xs text-gray-400 mt-2">OpenAI GPT-4o / OCR / Whisper</p>
          </div>
          <div className="bg-violet-50 p-2.5 rounded-lg">
            <Sparkles size={22} className="text-violet-600" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              <Layers size={15} className="text-emerald-500" /> Cobertura del ERP
            </div>
            <p className="text-xl font-bold text-slate-800">22 Módulos Integrados</p>
            <p className="text-xs text-gray-400 mt-2">Operaciones, Finanzas y RRHH</p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg">
            <Layers size={22} className="text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-md">
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'whatsapp' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Smartphone size={16} /> WhatsApp Bot
        </button>
        <button
          onClick={() => setActiveTab('web')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'web' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers size={16} /> Guía de Módulos
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'faq' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HelpCircle size={16} /> Preguntas Frecuentes
        </button>
      </div>

      {/* Tab 1: WhatsApp Bot */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Info & prompt groups */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 border-b border-gray-100 pb-3">
                <Bot size={20} className="text-ecar-blue" /> ¿Cómo funciona el bot de WhatsApp?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                El bot de WhatsApp está conectado en tiempo real al ERP. Esto significa que podés escribirle en lenguaje natural argentino (ej: <span className="font-semibold text-slate-800">"¿Quién faltó hoy?"</span> o <span className="font-semibold text-slate-800">"Cargá este cheque"</span>) y él ejecutará la acción en la base de datos de inmediato.
              </p>
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Info size={20} className="text-ecar-blue shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Pro Tip: ¡Rombo aprende tus fotos!</p>
                  <p>Si le mandás una foto nítida de un cheque físico o una factura de compra, Rombo leerá el texto usando OCR e ingresará los importes, vencimientos y proveedores automáticamente.</p>
                </div>
              </div>
            </div>

            {/* Prompt Examples List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h4 className="font-bold text-gray-800 text-sm">Mensajes sugeridos para probar</h4>
              </div>
              <div className="p-5 space-y-6">
                {WHATSAPP_PROMPTS.map((group, gi) => (
                  <div key={gi} className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group.category}</h5>
                    <div className="space-y-2">
                      {group.items.map((item, ii) => (
                        <div
                          key={ii}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-ecar-blue/20 hover:bg-slate-50/50 transition-all text-xs group"
                        >
                          <span className="font-mono text-slate-600 break-words flex-1 pr-4">{item.text}</span>
                          <div className="flex gap-2 shrink-0">
                            {item.type !== 'info' && (
                              <button
                                onClick={() => simulateFlow(item.type as any)}
                                className="bg-ecar-blue text-white px-2.5 py-1 rounded-md font-bold text-[10px] hover:bg-ecar-blueDark active:scale-95 transition-all flex items-center gap-1"
                                title="Simular en el celular de la derecha"
                              >
                                Simular <ArrowRight size={10} />
                              </button>
                            )}
                            <button
                              onClick={() => handleCopy(item.text)}
                              className="bg-gray-100 text-gray-600 p-1.5 rounded-md hover:bg-gray-200 transition-all"
                              title="Copiar prompt"
                            >
                              {copiedPrompt === item.text ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Phone Mockup Simulation */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[360px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800 relative">
              {/* Phone speaker/camera notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-slate-800 absolute right-4" />
                <span className="w-8 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Screen */}
              <div className="w-full h-[620px] bg-[#E5DDD5] rounded-[2.5rem] overflow-hidden flex flex-col relative">
                {/* Whatsapp Header */}
                <div className="bg-[#075E54] text-white pt-7 px-4 pb-3 flex items-center gap-2.5 z-10 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm shrink-0">
                    R
                  </div>
                  <div>
                    <h4 className="font-bold text-xs flex items-center gap-1.5">
                      Rombo Asistente <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    </h4>
                    <p className="text-[10px] text-teal-100">En línea</p>
                  </div>
                  <button
                    onClick={clearSimulation}
                    className="ml-auto text-[10px] bg-teal-800/50 hover:bg-teal-800 px-2 py-1 rounded font-bold transition-all"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Whatsapp Chat area */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col justify-end">
                  {simulatedChat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-sm relative group ${
                        msg.sender === 'user'
                          ? 'bg-[#DCF8C6] text-slate-800 self-end rounded-tr-none'
                          : 'bg-white text-slate-800 self-start rounded-tl-none'
                      }`}
                    >
                      {msg.image && (
                        <div className="mb-2 rounded overflow-hidden max-h-[120px]">
                          <img src={msg.image} alt="Enviado" className="w-full object-cover" />
                        </div>
                      )}
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-gray-400 font-medium">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'user' && <CheckCheck size={10} className="text-blue-500" />}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="bg-white text-slate-800 self-start rounded-lg rounded-tl-none p-2.5 text-xs shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="bg-[#F0F0F0] p-2 flex items-center gap-2 border-t border-gray-200/50 shrink-0">
                  <div className="flex-1 bg-white rounded-full px-3 py-2 text-[10px] text-gray-400 flex items-center justify-between shadow-sm">
                    <span>Escribí o seleccioná un prompt a la izquierda...</span>
                    <Image size={13} className="text-gray-400" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center text-white shadow active:scale-95 transition-transform cursor-pointer">
                    <Send size={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guía de Módulos Web */}
      {activeTab === 'web' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 border-b border-gray-100 pb-3">
              <Layers size={20} className="text-ecar-blue" /> Módulos del Sistema Web
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              El ERP de ECAR cuenta con módulos especializados para cada área de la constructora. Todos los datos ingresados desde la web o mediante WhatsApp impactan automáticamente en las mismas tablas de Supabase, manteniendo una única versión de la verdad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SYSTEM_MODULES.map((module, mi) => (
              <div
                key={mi}
                className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 ${module.color}`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl">{module.icon}</span>
                  <h4 className="font-bold text-slate-800 text-sm">{module.name}</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{module.description}</p>
                <div className="space-y-1.5 border-t border-gray-50 pt-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Características Clave</span>
                  <ul className="space-y-1">
                    {module.features.map((feat, fi) => (
                      <li key={fi} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-ecar-blue font-bold shrink-0 mt-0.5">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Preguntas Frecuentes */}
      {activeTab === 'faq' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* FAQ 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <HelpCircle size={15} className="text-ecar-blue shrink-0" /> ¿Cómo corrijo un error detectado por el OCR?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              El OCR realiza una lectura inteligente, pero si por algún motivo (ej: fotocopia borrosa) confunde un número de CUIT o importe, la factura queda en estado **Pendiente de revisión** en la solapa de *Compras*. Cualquier usuario administrador puede entrar, hacer clic en editar, rectificar el dato manual y guardarlo para cambiar su estado a **Validado**.
            </p>
          </div>

          {/* FAQ 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <HelpCircle size={15} className="text-ecar-blue shrink-0" /> ¿Cómo elimino un cheque cargado erróneamente por WhatsApp?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Podés mandarle un mensaje a Rombo diciendo <span className="font-mono text-xs font-semibold bg-gray-100 px-1 py-0.5 rounded">"borrar el cheque 1234567"</span> o bien <span className="font-mono text-xs font-semibold bg-gray-100 px-1 py-0.5 rounded">"elimina el último cheque cargado"</span>. El bot buscará el cheque en la base y te confirmará la eliminación mediante un mensaje.
            </p>
          </div>

          {/* FAQ 3 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <HelpCircle size={15} className="text-ecar-blue shrink-0" /> ¿Quiénes reciben las alertas impositivas por WhatsApp?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              En el módulo de *Alertas & Obligaciones* hay un submódulo llamado **Contactos de Notificación**. Ahí podés registrar los nombres y números de teléfono de los responsables (ej: socios, contadores, apoderados). Las alertas configuradas para vencerse (ART, gremios, impuestos) se enviarán de forma automática a esos números.
            </p>
          </div>

          {/* FAQ 4 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <HelpCircle size={15} className="text-ecar-blue shrink-0" /> ¿La IA me avisa si hay riesgo financiero?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Sí. En el *Tablero de Liquidez* y mediante consultas directas a Rombo (ej: <span className="font-semibold text-slate-800">"¿Cómo viene la caja?"</span>), la IA analiza tus cheques a cobrar vs obligaciones e impuestos acumulados en los próximos 7, 15 y 30 días, advirtiéndote si los saldos de banco proyectados son negativos.
            </p>
          </div>

          {/* Contact Support */}
          <div className="bg-slate-50 rounded-xl p-5 border border-dashed border-gray-300 text-center space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">¿Necesitás soporte técnico adicional?</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Si experimentás problemas con la integración de WhatsApp o detectás discrepancias impositivas, podés contactar al equipo de desarrollo.
            </p>
            <a
              href="https://wa.me/5491130168646"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              Contactar Soporte Técnico <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
