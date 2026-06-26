import { useState, useEffect, useCallback } from 'react';
import { 
  FileSearch, 
  ClipboardList, 
  Layers, 
  Compass, 
  FolderSearch, 
  AlertTriangle, 
  PackageCheck, 
  Milestone,
  ArrowLeft,
  Info,
  CheckCircle2,
  ChevronRight,
  MessageSquareText,
  X,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

type ScreenId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// --- Presenter Notes (Sección 8 del documento) ---
const presenterNotes: Record<number, string> = {
  1: 'Vimos una intervención vial integral, con rotondas, duplicación, hidráulica, iluminación, señalización y seguridad vial. Por eso conviene leer el pliego como un sistema, no como una lista de ítems.',
  2: 'El punto crítico es que la oferta necesita un proyecto base o anteproyecto básico. Si eso no se resuelve bien, la presentación puede quedar débil o directamente fuera de evaluación.',
  3: 'El anteproyecto básico sirve para presentar la oferta. El ejecutivo completo se desarrolla después, si la obra se adjudica, con más información y nivel de detalle.',
  4: 'Podemos asumir una etapa inicial para ordenar pliego, criterios, planos base, cómputos preliminares, riesgos y memoria técnica, siempre dejando claros los límites de esta etapa.',
  5: 'Para trabajar bien necesitamos saber con qué información cuentan: DWG, topografía, Civil 3D, interferencias, hidráulica previa, alumbrado y fecha interna de cierre.',
  6: 'Por ser una obra con ajuste alzado, los riesgos no detectados pueden impactar en el precio. El anteproyecto debe ayudar a anticipar esos puntos antes de cerrar la oferta.',
  7: 'El entregable no es solo gráfico; también debe dejar criterios, supuestos, riesgos y límites de responsabilidad.',
  8: 'Para avanzar necesitamos tres definiciones: alcance, documentación disponible y plazo real. Con eso podemos preparar una propuesta técnica y económica concreta.',
};

// --- CSS Keyframes injected once ---
const STYLES_ID = 'mesa-tecnica-styles';
function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    @keyframes mt-fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes mt-slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes mt-slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes mt-scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes mt-heroFade {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mt-animate-fade { animation: mt-fadeIn 0.5s ease-out both; }
    .mt-animate-slide-left { animation: mt-slideInLeft 0.4s ease-out both; }
    .mt-animate-slide-right { animation: mt-slideInRight 0.4s ease-out both; }
    .mt-animate-scale { animation: mt-scaleIn 0.4s ease-out both; }
    .mt-animate-hero { animation: mt-heroFade 0.8s ease-out both; }
    .mt-delay-1 { animation-delay: 0.1s; }
    .mt-delay-2 { animation-delay: 0.2s; }
    .mt-delay-3 { animation-delay: 0.3s; }
    .mt-delay-4 { animation-delay: 0.4s; }
    .mt-delay-5 { animation-delay: 0.5s; }
    .mt-delay-6 { animation-delay: 0.6s; }
    .mt-delay-7 { animation-delay: 0.7s; }
    .mt-delay-8 { animation-delay: 0.8s; }

    .mt-btn-card {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .mt-btn-card:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1), 0 4px 10px -6px rgba(0,0,0,0.06);
    }
    .mt-btn-card:hover .mt-arrow {
      transform: translateX(3px);
    }
    .mt-arrow {
      transition: transform 0.25s ease;
    }

    .mt-notes-panel {
      animation: mt-slideInRight 0.3s ease-out both;
    }
  `;
  document.head.appendChild(style);
}

export function MesaTecnicaPresentation() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId | 'welcome'>('welcome');
  const [showNotes, setShowNotes] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  const navigateTo = useCallback((screen: ScreenId | 'welcome') => {
    setAnimKey(k => k + 1);
    setShowNotes(false);
    setCurrentScreen(screen);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key;

      // Number keys 1-8: go directly to that section
      if (key >= '1' && key <= '8') {
        navigateTo(parseInt(key) as ScreenId);
        return;
      }

      // Escape: go back to dashboard (or welcome if on dashboard)
      if (key === 'Escape') {
        if (typeof currentScreen === 'number' && currentScreen !== 0) {
          navigateTo(0);
        }
        return;
      }

      // Arrow keys: previous/next section (only when viewing a section)
      if (typeof currentScreen === 'number' && currentScreen >= 1 && currentScreen <= 8) {
        if (key === 'ArrowRight' || key === 'ArrowDown') {
          e.preventDefault();
          const next = currentScreen < 8 ? currentScreen + 1 : 1;
          navigateTo(next as ScreenId);
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
          e.preventDefault();
          const prev = currentScreen > 1 ? currentScreen - 1 : 8;
          navigateTo(prev as ScreenId);
        }
      }

      // F key: toggle fullscreen
      if (key === 'f' || key === 'F') {
        toggleFullscreen();
      }

      // N key: toggle notes
      if (key === 'n' || key === 'N') {
        if (typeof currentScreen === 'number' && currentScreen >= 1) {
          setShowNotes(s => !s);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, navigateTo, toggleFullscreen]);

  // ============================
  // WELCOME SCREEN (Fase 1.1)
  // ============================
  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div key={animKey} className="relative z-10 text-center max-w-3xl">
          {/* Top accent line */}
          <div className="w-16 h-1 bg-blue-400 mx-auto mb-10 rounded-full mt-animate-hero" />
          
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-6 mt-animate-hero mt-delay-1">
            Mesa Técnica de<br />Apoyo Licitatorio
          </h1>
          
          <p className="text-xl text-blue-200/80 font-medium mb-3 mt-animate-hero mt-delay-2">
            Proyecto Base para Presentación de Oferta
          </p>

          <div className="mt-animate-hero mt-delay-3 mb-12">
            <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 mt-6">
              <p className="text-blue-100 text-sm font-medium tracking-wide">
                Licitación vial — Ruta Provincial Nº 1, Ingreso a Merlo, San Luis
              </p>
            </div>
          </div>

          {/* Opening quote */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12 text-left mt-animate-hero mt-delay-4">
            <div className="flex items-start">
              <div className="text-blue-400 text-4xl font-serif leading-none mr-4 mt-1">"</div>
              <p className="text-blue-100/90 text-lg leading-relaxed italic">
                La idea de esta reunión es ordenar qué pide el pliego y qué hace falta para que la oferta llegue técnicamente bien presentada. No venimos a vender planos sueltos, sino a definir una mesa técnica de apoyo licitatorio.
              </p>
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-3 gap-4 mb-12 mt-animate-hero mt-delay-5">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-blue-300/60 text-xs uppercase tracking-wider mb-1">Destinatario</p>
              <p className="text-white/90 text-sm font-medium">Empresa oferente</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-blue-300/60 text-xs uppercase tracking-wider mb-1">Uso previsto</p>
              <p className="text-white/90 text-sm font-medium">Reunión técnica inicial</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-blue-300/60 text-xs uppercase tracking-wider mb-1">Formato</p>
              <p className="text-white/90 text-sm font-medium">Tablero interactivo</p>
            </div>
          </div>

          {/* CTA Button */}
          <button 
            onClick={() => navigateTo(0)}
            className="group mt-animate-hero mt-delay-6 inline-flex items-center bg-white text-[#1e3a5f] px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:scale-105 transition-all duration-300"
          >
            Ingresar al tablero
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // SCREEN CONTENT (8 sections)
  // ============================
  const screens: Record<number, { title: string; icon: typeof FileSearch; content: JSX.Element }> = {
    1: {
      title: "Qué vimos en el pliego",
      icon: FileSearch,
      content: (
        <div className="space-y-6">
          <p className="text-xl text-slate-700 leading-relaxed">
            La obra no debe presentarse como una simple repavimentación.
          </p>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Alcance integral detectado:</h3>
            <ul className="grid grid-cols-2 gap-4">
              {[
                "Refuncionalización vial", "Rotondas", "Duplicación de calzada",
                "Hidráulica", "Alumbrado", "Señalización",
                "Seguridad vial", "Banquinas", "New Jersey",
                "Cómputos", "Documentación técnica"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r">
            <p className="text-blue-900 font-medium">
              Mensaje central: El pliego exige una lectura técnica integral.
            </p>
          </div>
        </div>
      )
    },
    2: {
      title: "Qué exige la licitación",
      icon: ClipboardList,
      content: (
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Info className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Anteproyecto Básico Obligatorio
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                La licitación exige acompañar la oferta con un Proyecto Base / Anteproyecto Básico.
                Este anteproyecto debe explicar la solución técnica y ayudar a sostener los cómputos y la oferta.
              </p>
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl text-white mt-8">
            <p className="text-lg font-medium text-center">
              La urgencia no es solo cotizar, sino presentar documentación técnica admisible y defendible.
            </p>
          </div>
        </div>
      )
    },
    3: {
      title: "Proyecto Base vs Ejecutivo",
      icon: Layers,
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold inline-block mb-4">Fase Licitatoria</div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Proyecto Base</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Se presenta con la oferta</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Define criterios generales</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Ordena la solución</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Permite computar preliminarmente</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Identifica riesgos</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm opacity-60">
              <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold inline-block mb-4">Fase Constructiva</div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Proyecto Ejecutivo</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span> Se desarrolla si la obra es adjudicada</li>
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span> Requiere topografía definitiva</li>
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span> Detalles constructivos</li>
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span> Memorias y verificaciones</li>
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span> Documentación aprobable</li>
              </ul>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
            <p className="text-slate-700 font-medium">
              Primero se necesita una propuesta técnica base; luego, si se adjudica, se desarrolla el ejecutivo completo.
            </p>
          </div>
        </div>
      )
    },
    4: {
      title: "Alcance que podemos asumir",
      icon: Compass,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              "Revisión técnica del pliego",
              "Anteproyecto vial base",
              "Anteproyecto hidráulico preliminar",
              "Iluminación, servicios e interferencias",
              "Señalización y seguridad vial",
              "Cómputo preliminar, memoria técnica, matriz de riesgos y presentación visual"
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-blue-900 p-6 rounded-xl text-white mt-6 text-center">
            <p className="text-lg font-medium">
              No ofrecemos planos sueltos; ofrecemos una mesa técnica para transformar el pliego en una presentación licitatoria ordenada.
            </p>
          </div>
        </div>
      )
    },
    5: {
      title: "Información que necesitamos",
      icon: FolderSearch,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Documentación requerida para avanzar:</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {[
                  "Pliego completo definitivo y circulares.",
                  "Planos DWG, topografía y archivos Civil 3D si existen.",
                  "Relevamiento de servicios, alumbrado y alcantarillas.",
                  "Datos hidráulicos previos y criterio de vehículo de diseño.",
                  "Fecha interna de cierre, responsable técnico y contacto de validación."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 flex-shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r">
            <p className="text-emerald-900 font-medium">
              Mensaje: La calidad y velocidad del trabajo dependen directamente de la información disponible.
            </p>
          </div>
        </div>
      )
    },
    6: {
      title: "Riesgos principales",
      icon: AlertTriangle,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 p-5 rounded-xl border border-red-100">
              <h4 className="font-bold text-red-800 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> Riesgo Alto
              </h4>
              <ul className="text-red-900 text-sm space-y-2 list-disc list-inside">
                <li>Ajuste alzado</li>
                <li>Falta de topografía</li>
                <li>Interferencias no relevadas</li>
                <li>Hidráulica no verificada</li>
                <li>Plazo corto</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
              <h4 className="font-bold text-orange-800 mb-3">Riesgo Medio</h4>
              <ul className="text-orange-900 text-sm space-y-2 list-disc list-inside">
                <li>Rediseños posteriores</li>
                <li>New Jersey con drenaje/servicios</li>
                <li>Posibles terrenos laterales</li>
                <li>Falta definición de alcance</li>
              </ul>
            </div>
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
              <h4 className="font-bold text-emerald-800 mb-3 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" /> Riesgo Controlable
              </h4>
              <ul className="text-emerald-900 text-sm space-y-2 list-disc list-inside">
                <li>Orden documental</li>
                <li>Memoria técnica clara</li>
                <li>Cómputo preliminar ordenado</li>
                <li>Matriz de supuestos</li>
              </ul>
            </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl text-center text-white">
            <p className="font-medium">
              El anteproyecto básico debe ayudar a detectar riesgos antes de cerrar la oferta.
            </p>
          </div>
        </div>
      )
    },
    7: {
      title: "Entregables propuestos",
      icon: PackageCheck,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              "Informe de revisión del pliego",
              "Memoria técnica del proyecto base",
              "Planos base en PDF y editables",
              "Cómputo preliminar en Excel",
              "Matriz de riesgos técnicos y faltantes",
              "Lámina ejecutiva y reunión técnica"
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center">
                <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                  <PackageCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
            <p className="text-slate-700 font-medium">
              El entregable no es solo gráfico; también debe dejar criterios, supuestos, riesgos y límites de responsabilidad.
            </p>
          </div>
        </div>
      )
    },
    8: {
      title: "Próximos pasos",
      icon: Milestone,
      content: (
        <div className="space-y-8">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-emerald-200"></div>
            <div className="space-y-6 relative z-10">
              {[
                "Reunión de alcance.",
                "Recepción de información.",
                "Definición de criterios.",
                "Desarrollo del proyecto base.",
                "Revisión con la empresa oferente.",
                "Ajustes finales.",
                "Entrega para presentación licitatoria."
              ].map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md mr-4 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm flex-1">
                    <p className="text-slate-700 font-medium">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r">
            <p className="text-emerald-900 font-medium">
              Mensaje: Para avanzar se necesita definir alcance, plazo, documentación disponible y responsable de validación.
            </p>
          </div>
        </div>
      )
    }
  };

  // ============================
  // INTERNAL SCREEN VIEW
  // ============================
  if (typeof currentScreen === 'number' && currentScreen !== 0) {
    const screenData = screens[currentScreen];
    const Icon = screenData.icon;
    const isRightSide = currentScreen >= 5;
    
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div key={animKey} className="max-w-5xl mx-auto px-6 py-12">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-10 mt-animate-fade">
            <button 
              onClick={() => navigateTo(0)}
              className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all duration-200 font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al tablero
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`flex items-center px-3 py-2 rounded-lg border shadow-sm font-medium transition-all duration-200 text-sm ${showNotes ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200'}`}
                title="Notas del presentador (N)"
              >
                <MessageSquareText className="w-4 h-4 mr-1.5" />
                Notas
              </button>
              <button 
                onClick={toggleFullscreen}
                className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <span className="text-xs text-slate-300 ml-1 hidden lg:inline">← → navegar · Esc tablero</span>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Main Content */}
            <div className={`flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mt-animate-scale ${showNotes ? '' : 'max-w-5xl'}`}>
              <div className={`px-8 py-6 flex items-center ${isRightSide ? 'bg-gradient-to-r from-emerald-800 to-emerald-700' : 'bg-gradient-to-r from-slate-800 to-slate-700'}`}>
                <div className="bg-white/15 p-3 rounded-xl mr-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  {currentScreen}. {screenData.title}
                </h2>
              </div>
              <div className="p-10">
                {screenData.content}
              </div>
            </div>

            {/* Presenter Notes Panel (Fase 2) */}
            {showNotes && (
              <div className="w-80 flex-shrink-0 mt-notes-panel">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-lg sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-amber-800 flex items-center text-sm uppercase tracking-wider">
                      <MessageSquareText className="w-4 h-4 mr-2" />
                      Notas del presentador
                    </h3>
                    <button onClick={() => setShowNotes(false)} className="text-amber-400 hover:text-amber-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-amber-900/80 text-sm leading-relaxed italic">
                    "{presenterNotes[currentScreen]}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // DASHBOARD VIEW (Pantalla 0)
  // ============================
  const leftButtons = [
    { id: 1, title: 'PLIEGO', subtitle: 'Lectura técnica integral' },
    { id: 2, title: 'EXIGENCIA LICITATORIA', subtitle: 'Anteproyecto básico obligatorio' },
    { id: 3, title: 'BASE VS EJECUTIVO', subtitle: 'Diferencia entre etapas' },
    { id: 4, title: 'ALCANCE CONSULTOR', subtitle: 'Módulos del servicio' },
  ];

  const rightButtons = [
    { id: 5, title: 'INFORMACIÓN NECESARIA', subtitle: 'Datos para poder avanzar' },
    { id: 6, title: 'RIESGOS', subtitle: 'Ajuste alzado e interferencias' },
    { id: 7, title: 'ENTREGABLES', subtitle: 'Qué recibirá el cliente' },
    { id: 8, title: 'PRÓXIMOS PASOS', subtitle: 'Decisiones para cerrar reunión' },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-8 relative overflow-hidden" 
         style={{ fontFamily: "'Inter', sans-serif", backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundColor: '#f8fbff' }}>
      
      <div key={animKey} className="max-w-6xl w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden z-10 mt-animate-scale">
        
        {/* Blue accent bar at the top — matching wireframe */}
        <div className="h-2 bg-gradient-to-r from-[#1a4a76] via-[#2563eb] to-[#1a4a76]" />

        <div className="p-10">
        {/* Header (Fase 1.2) */}
        <div className="mb-10 pb-6 border-b border-slate-100 mt-animate-fade">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[2.5rem] font-black text-[#1e3a5f] tracking-tight mb-2">
                MESA TÉCNICA DE APOYO LICITATORIO
              </h1>
              <p className="text-[#64748b] text-lg font-medium">
                Proyecto Base para Presentación de Oferta <span className="mx-2 text-slate-300">|</span> Del pliego a una propuesta técnica defendible
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleFullscreen}
                className="text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 rounded-lg p-1.5 hover:bg-slate-50"
                title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => navigateTo('welcome')}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
              >
                ← Inicio
              </button>
            </div>
          </div>
          {/* Project data bar */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center text-slate-500">
              <span className="text-slate-400 font-medium mr-1.5">Proyecto:</span> Licitación vial — RP Nº 1, Ingreso a Merlo, San Luis
            </div>
            <div className="flex items-center text-slate-500">
              <span className="text-slate-400 font-medium mr-1.5">Destinatario:</span> Empresa oferente / equipo decisor
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-8 items-stretch relative">
          
          {/* Left Buttons */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {leftButtons.map((btn, idx) => (
              <button
                key={btn.id}
                onClick={() => navigateTo(btn.id as ScreenId)}
                className={`mt-btn-card w-full group flex items-stretch bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-left hover:border-blue-300 mt-animate-slide-left mt-delay-${idx + 1}`}
              >
                <div className="w-14 bg-[#1a4a76] text-white flex items-center justify-center text-2xl font-bold">
                  {btn.id}
                </div>
                <div className="flex-1 p-3 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-bold text-[#1a4a76] text-sm leading-tight group-hover:text-blue-600 transition-colors">{btn.title}</h3>
                    <p className="text-slate-400 text-xs mt-1">{btn.subtitle}</p>
                  </div>
                  <div className="mt-arrow w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors ml-2 flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Center Panel (Fase 4 — Street View Embed) */}
          <div className="col-span-12 lg:col-span-6 flex items-stretch mt-animate-fade mt-delay-2">
            <div className="w-full bg-white border-2 border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden flex flex-col">
              
              {/* Top info section */}
              <div className="p-6 pb-4">
                <div className="text-center">
                  <div className="inline-block bg-[#f0f7ff] rounded-2xl px-6 py-2.5 mb-4 shadow-sm border border-blue-50">
                    <h2 className="text-xl font-bold text-[#1e3a5f]">Tablero de reunión interactivo</h2>
                    <p className="text-slate-500 text-xs mt-1">Cada botón abre una explicación técnica breve.</p>
                  </div>
                  
                  <ul className="text-left space-y-2.5 max-w-sm mx-auto text-[#475569] text-sm font-medium">
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#e25d48] mr-2.5"></div>
                      No es una presentación lineal
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#e25d48] mr-2.5"></div>
                      Permite explicar según el tema que surja
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#e25d48] mr-2.5"></div>
                      Ordena pliego, alcance, riesgos y próximos pasos
                    </li>
                  </ul>
                </div>
              </div>

              {/* Street View Embed */}
              <div className="flex-1 min-h-[200px] relative border-t border-slate-100">
                <iframe
                  className="w-full h-full absolute inset-0"
                  style={{ border: 0, minHeight: '200px' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps/embed?pb=!4v1719360000000!6m8!1m7!1sKqLQ8yKy7_6ZCyyjLr65QA!2m2!1d-32.3423451!2d-65.1650419!3f285.52!4f-6.52!5f0.7820865974627469"
                ></iframe>
                {/* Overlay label */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold text-slate-600 border border-slate-200">
                  📍 RP Nº 1 — Ingreso a Merlo, San Luis
                </div>
              </div>
            </div>
          </div>

          {/* Right Buttons */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {rightButtons.map((btn, idx) => (
              <button
                key={btn.id}
                onClick={() => navigateTo(btn.id as ScreenId)}
                className={`mt-btn-card w-full group flex items-stretch bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-left hover:border-emerald-300 mt-animate-slide-right mt-delay-${idx + 1}`}
              >
                <div className="w-14 bg-[#2d7667] text-white flex items-center justify-center text-2xl font-bold">
                  {btn.id}
                </div>
                <div className="flex-1 p-3 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-bold text-[#1e3a5f] text-sm leading-tight group-hover:text-[#2d7667] transition-colors">{btn.title}</h3>
                    <p className="text-slate-400 text-xs mt-1">{btn.subtitle}</p>
                  </div>
                  <div className="mt-arrow w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors ml-2 flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-10 bg-[#1e293b] rounded-xl px-6 py-4 flex justify-between items-center text-slate-200 text-sm font-medium mt-animate-fade mt-delay-5">
          <p>Uso en reunión: pantalla principal + navegación por tema + retorno al tablero</p>
          <div className="flex items-center gap-4">
            <p className="text-slate-500 text-xs">Atajos: 1-8 secciones · Esc volver · F fullscreen · N notas</p>
            <p className="text-slate-400">Web Interactiva</p>
          </div>
        </div>

      </div>{/* closes p-10 wrapper */}
      </div>{/* closes white card */}
    </div>
  );
}
