import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Phone,
  Mail,
  ChevronDown,
  Maximize2,
  FileCheck2,
  ArrowUpRight
} from 'lucide-react';

interface SlideData {
  number: string;
  category: string;
  headline: string;
  subheadline: string;
  description: string;
  image: string;
  metrics: { label: string; value: string }[];
  tags: string[];
}

const FLOW_SLIDES: SlideData[] = [
  {
    number: '01',
    category: 'INFRAESTRUCTURA HIDRÁULICA',
    headline: 'Conducción hídrica de gran porte.',
    subheadline: 'Agua potable y acueductos troncales hasta DN 1600mm.',
    description: 'Tendido continuo de cañerías en Polietileno de Alta Densidad (PEAD PE-100) y Fundición Dúctil. Termofusión automatizada con control estricto de temperatura, presión y enfriamiento, garantizando estanqueidad absoluta bajo presiones de hasta 25 bar.',
    image: '/assets/showcase/ecar_redes_agua.jpg',
    metrics: [
      { label: 'Diámetro Máximo', value: 'DN 1600 mm' },
      { label: 'Presión Nominal', value: 'PN 25 Bar' },
      { label: 'Norma Aplicada', value: 'OSSE / IRAM' },
    ],
    tags: ['Termofusión CNC', 'Acueductos Troncales', 'Cero Fugas']
  },
  {
    number: '02',
    category: 'TRANSPORTE DE GAS NATURAL',
    headline: 'Energía crítica bajo tierra.',
    subheadline: 'Gasoductos de acero API 5L con radiografiado al 100%.',
    description: 'Tendido de gasoductos de alta presión en acero al carbono con revestimiento anticorrosivo tricapa de polietileno (3LPE). Soldadores calificados bajo norma API 1104, protección catódica por corriente impresa y cumplimiento estricto de normas ENARGAS NAG-100.',
    image: '/assets/showcase/ecar_gasoductos.jpg',
    metrics: [
      { label: 'Presión de Trabajo', value: 'Hasta 80 Bar' },
      { label: 'Control de Soldadura', value: '100% Rayos X' },
      { label: 'Marco Técnico', value: 'ENARGAS NAG-100' },
    ],
    tags: ['Acero API 5L', 'Alta Presión 80 Bar', 'Protección Catódica']
  },
  {
    number: '03',
    category: 'REDES DE POTENCIA SUBTERRÁNEA',
    headline: 'Energía de alta tensión protegida.',
    subheadline: 'Tendido subterráneo blindado en 13.2 kV, 33 kV y 132 kV.',
    description: 'Canalización eléctrica subterránea con conductores XLPE de gran sección. Interconexión para parques solares fotovoltaicos, subestaciones transformadoras (SET) y bancos de ductos hormigonados con fibra óptica integrada para telecontrol SCADA.',
    image: '/assets/showcase/ecar_electricidad.jpg',
    metrics: [
      { label: 'Nivel de Tensión', value: '132 / 33 / 13.2 kV' },
      { label: 'Conductor', value: 'XLPE 630 mm² Cu' },
      { label: 'Ensayos de Rigidez', value: 'VLF / Hi-Pot' },
    ],
    tags: ['Alta Tensión 132 kV', 'Bancos de Ductos', 'Fibra SCADA']
  }
];

interface UtilityProject {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  metrics: { label: string; value: string }[];
  image: string;
  badge: string;
  norm: string;
}

const PROJECTS_DATA: UtilityProject[] = [
  {
    id: 'acueducto-gran-san-juan',
    title: 'Acueducto Troncal Gran San Juan & Impulsión',
    category: 'Agua & Saneamiento',
    tagline: 'Conducción hídrica de alta presión en PEAD DN 1000mm para 320.000 habitantes.',
    description: 'Instalación de acueducto troncal de polietileno de alta densidad (PEAD PE-100) y fundición dúctil con soldadura por termofusión continua controlada por datalogger computarizado. Incluye cámaras de válvulas de mariposa, ventosas trifuncionales y estación de bombeo presurizada.',
    metrics: [
      { label: 'Longitud', value: '38.5 km' },
      { label: 'Diámetro', value: 'DN 1000 mm' },
      { label: 'Presión', value: '25 Bar' },
      { label: 'Población', value: '320.000 hab' },
    ],
    image: '/assets/showcase/ecar_redes_agua.jpg',
    badge: 'Obra Hidráulica Crítica',
    norm: 'Norma OSSE / IRAM 13485'
  },
  {
    id: 'gasoducto-regional-cuyo',
    title: 'Gasoducto Troncal de Alta Presión & Ramal Industrial',
    category: 'Gasoductos',
    tagline: 'Transporte de gas natural en acero API 5L Gr. B con revestimiento 3LPE.',
    description: 'Tendido de gasoducto de alta presión de 12" de diámetro en acero al carbono con cordones de soldadura calificados bajo API 1104 y radiografiado completo (100% RX). Incluye estación de regulación y medición (ERM) y sistema de protección catódica.',
    metrics: [
      { label: 'Extensión', value: '42.0 km' },
      { label: 'Diámetro', value: '12 Pulgadas' },
      { label: 'Presión', value: '75 Bar' },
      { label: 'Control', value: '100% Rayos X' },
    ],
    image: '/assets/showcase/ecar_gasoductos.jpg',
    badge: 'Gasoducto de Alta Presión',
    norm: 'ENARGAS NAG-100 / API 1104'
  },
  {
    id: 'red-electrica-parque-solar',
    title: 'Interconexión Subterránea Parque Solar & SET 132/33kV',
    category: 'Electricidad & Energía',
    tagline: 'Línea de alta y media tensión subterránea blindada en XLPE 630mm².',
    description: 'Ingeniería y tendido de terna subterránea de 132 kV y 33 kV en zanja protegida con ladrillos cubre-cables, malla de advertencia y banco de ductos hormigonados en cruces viales. Integración de tritubo con fibra óptica para telecontrol SCADA.',
    metrics: [
      { label: 'Tensión', value: '132 / 33 kV' },
      { label: 'Longitud', value: '18.4 km' },
      { label: 'Potencia', value: '120 MVA' },
      { label: 'Conductor', value: 'XLPE 630 mm²' },
    ],
    image: '/assets/showcase/ecar_electricidad.jpg',
    badge: 'Energía & Redes de Potencia',
    norm: 'EPRE / IRAM 2178'
  },
  {
    id: 'cruce-subfluvial-hdd',
    title: 'Cruce Subterráneo con Perforación Horizontal (HDD)',
    category: 'Tecnología Trenchless',
    tagline: 'Instalación sin zanja bajo cauces de río y vías de ferrocarril.',
    description: 'Perforación dirigida teleguiada de 480 metros continuos para cañería de PEAD y acero sin rotura de calzadas ni interrupción del tránsito vehicular o ferroviario.',
    metrics: [
      { label: 'Longitud', value: '480 Metros' },
      { label: 'Profundidad', value: '-18.5 m' },
      { label: 'Diámetro', value: 'DN 800 mm' },
      { label: 'Corte Tránsito', value: '0 Horas' },
    ],
    image: '/assets/showcase/ecar_hero_subterraneo.jpg',
    badge: 'Tecnología Sin Zanja',
    norm: 'ASTM F1962'
  }
];

export const ShowcasePage: React.FC = () => {
  // Sticky scroll progress state
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeProject, setActiveProject] = useState<UtilityProject | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!stickyContainerRef.current) return;
      const rect = stickyContainerRef.current.getBoundingClientRect();
      const totalScrollable = stickyContainerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Calculate which slide is active based on exact scroll progress
  const activeSlideIndex = Math.min(2, Math.floor(scrollProgress * 3));
  const activeSlide = FLOW_SLIDES[activeSlideIndex];

  // Manual jump by clicking indicator
  const scrollToSlide = (index: number) => {
    if (!stickyContainerRef.current) return;
    const containerTop = stickyContainerRef.current.offsetTop;
    const totalScrollable = stickyContainerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + (index / 3) * totalScrollable + 50;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* ─── HEADER MINIMALISTA ESTILO JOBY AVIATION ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter text-white group-hover:text-sky-400 transition-colors">
                ECAR<span className="text-sky-500">.</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest text-slate-400 uppercase px-2 py-0.5 rounded border border-slate-800">
                Agua • Gas • Electricidad
              </span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <button onClick={() => scrollToSlide(0)} className="hover:text-white transition-colors">
              01 / Agua
            </button>
            <button onClick={() => scrollToSlide(1)} className="hover:text-white transition-colors">
              02 / Gasoductos
            </button>
            <button onClick={() => scrollToSlide(2)} className="hover:text-white transition-colors">
              03 / Electricidad
            </button>
            <a href="#obras" className="hover:text-white transition-colors">
              Obras
            </a>
            <a href="#contacto" className="hover:text-white transition-colors">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-4 py-2 text-xs font-mono font-bold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-full transition-all"
            >
              Portal ERP
            </a>

            {/* Joby Two-State Button */}
            <a
              href="#contacto"
              className="relative overflow-hidden group px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs shadow-lg hover:bg-sky-400 transition-all flex items-center justify-center"
            >
              <span className="transition-transform duration-300 group-hover:-translate-y-8 block">
                Licitaciones
              </span>
              <span className="absolute transition-transform duration-300 translate-y-8 group-hover:translate-y-0 block font-black">
                Contacto
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION CINEMÁTICO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo con atmósfera subterránea */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/showcase/ecar_hero_subterraneo.jpg"
            alt="ECAR Infraestructura Subterránea"
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-slate-950/90" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8 pt-20">
          {/* Announcement Tag */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs font-mono text-sky-400 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>Infraestructura Esencial • Agua, Gas y Redes Eléctricas</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.03]">
            Bajo la tierra.<br />
            <span className="bg-gradient-to-r from-sky-400 via-white to-amber-300 bg-clip-text text-transparent">
              Conectamos el país.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-light leading-relaxed">
            Especialistas en cañerías de agua de gran porte, gasoductos troncales de alta presión y tendidos de alta tensión. Infraestructura subterránea diseñada para perdurar más de un siglo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => scrollToSlide(0)}
              className="px-8 py-4 bg-white hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-full shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              <span>Comenzar el Recorrido</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 border-t border-slate-800/80 text-left">
            <div>
              <p className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">+580 km</p>
              <p className="text-xs text-slate-400 font-light mt-1">Acueductos & Redes PEAD</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight">+310 km</p>
              <p className="text-xs text-slate-400 font-light mt-1">Gasoductos de Alta Presión</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black font-mono text-red-400 tracking-tight">+420 MVA</p>
              <p className="text-xs text-slate-400 font-light mt-1">Redes Subterráneas Eléctricas</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black font-mono text-sky-400 tracking-tight">100%</p>
              <p className="text-xs text-slate-400 font-light mt-1">Ensayos No Destructivos (RX/VLF)</p>
            </div>
          </div>
        </div>

        {/* Indicador de scroll animado */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-slate-500">
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Desliza hacia abajo</span>
          <ChevronDown size={20} className="animate-bounce text-sky-400" />
        </div>
      </section>

      {/* ─── SCROLL-DRIVEN STICKY STORYTELLING (ESTILO EXACTO JOBY AVIATION) ─── */}
      {/* Este contenedor de 350vh mantiene la pantalla fija (sticky) mientras el usuario hace scroll, y las imágenes fluyen y cambian según el avance de la rueda/touch */}
      <section ref={stickyContainerRef} className="relative h-[350vh] bg-slate-950">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
          {/* Imágenes de Fondo Dinámicas con Cross-Fade y Zoom Ken Burns según el Scroll */}
          <div className="absolute inset-0 z-0">
            {FLOW_SLIDES.map((slide, idx) => {
              const isActive = activeSlideIndex === idx;
              return (
                <div
                  key={slide.number}
                  className={`absolute inset-0 transition-all duration-1000 ease-out ${
                    isActive ? 'opacity-100 scale-105 pointer-events-auto' : 'opacity-0 scale-100 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.headline}
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Gradientes cinemáticos oscuros Joby Aviation */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent" />
                </div>
              );
            })}
          </div>

          {/* Contenido Narrativo que Fluye con el Scroll */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              {/* Barra de Progreso de Scroll Pinned */}
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeSlideIndex === idx ? 'w-12 bg-sky-400' : 'w-4 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Ir a ${FLOW_SLIDES[idx].category}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Deslizando: {Math.round(scrollProgress * 100)}%
                </span>
              </div>

              {/* Número Gigante y Categoría */}
              <div className="flex items-baseline gap-4">
                <span className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-sky-400/90 transition-all duration-500">
                  {activeSlide.number}
                </span>
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400 block">
                    {activeSlide.category}
                  </span>
                  <p className="text-sm font-light text-slate-400">
                    {activeSlide.subheadline}
                  </p>
                </div>
              </div>

              {/* Título de la Especialidad */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight transition-all duration-500">
                {activeSlide.headline}
              </h2>

              <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-2xl">
                {activeSlide.description}
              </p>

              {/* Métricas Técnicas */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
                {activeSlide.metrics.map((m, i) => (
                  <div key={i}>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">{m.label}</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-white mt-0.5 block">{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Tags de Normas y Tecnologías */}
              <div className="flex flex-wrap gap-2 pt-2">
                {activeSlide.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-900/90 text-sky-300 border border-slate-700/80 backdrop-blur-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Inset flotante lateral con datos de control */}
            <div className="hidden lg:block lg:col-span-5 space-y-4">
              <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Control de Calidad ECAR
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-3 text-xs text-slate-300 font-light leading-relaxed">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-sky-400 shrink-0 mt-0.5" />
                    <p>Ensayos no destructivos certificados y trazabilidad satelital en cada junta.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-sky-400 shrink-0 mt-0.5" />
                    <p>Cuadrillas operativas propias con equipamiento pesado especializado.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-sky-400 shrink-0 mt-0.5" />
                    <p>Cumplimiento estricto de pliegos y curvas de inversión certificadas.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <a
                    href="#obras"
                    className="w-full py-3 bg-white hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>Ver Obras Ejecutadas</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Indicador de scroll flotante en la base */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Desplaza hacia abajo para alternar especialidades (01 → 02 → 03)</span>
            </div>
            <span className="text-slate-500">ECAR Engineering & Infrastructure</span>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN: TECNOLOGÍA TRENCHLESS (PERFORACIÓN HORIZONTAL DIRIGIDA) ─── */}
      <section className="py-32 max-w-7xl mx-auto px-6 border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Innovación • Perforación Horizontal Dirigida (HDD)
            </span>

            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Cruces subterráneos sin abrir zanjas en superficie.
            </h2>

            <p className="text-base text-slate-300 font-light leading-relaxed">
              Mediante tunelería teledirigida instalamos cañerías de agua, gasoductos y líneas eléctricas por debajo de autopistas, vías ferroviarias, ríos y zonas urbanas densas sin cortar el tránsito ni romper pavimentos.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-800">
              <div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white">0%</span>
                <span className="text-xs text-slate-400 font-light mt-1 block">Corte de Tránsito</span>
              </div>
              <div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">-70%</span>
                <span className="text-xs text-slate-400 font-light mt-1 block">Tiempo de Ejecución</span>
              </div>
              <div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-sky-400">100%</span>
                <span className="text-xs text-slate-400 font-light mt-1 block">Preservación Ambiental</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-96 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
            <img
              src="/assets/showcase/ecar_hero_subterraneo.jpg"
              alt="Tunelería subterránea ECAR"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
              Tirada continua teledirigida hasta 800m
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN: PORTAFOLIO DE OBRAS DE REFERENCIA ─── */}
      <section id="obras" className="py-24 bg-slate-900/20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
              Portafolio de Obras
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Infraestructura construida y en servicio.
            </h2>
          </div>

          {/* Grilla de Obras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROJECTS_DATA.map((p) => (
              <div
                key={p.id}
                className="group bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-md text-sky-400 border border-sky-400/30">
                        {p.badge}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{p.norm}</span>
                      <h3 className="text-lg font-extrabold text-white group-hover:text-sky-400 transition-colors mt-0.5">
                        {p.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 font-light line-clamp-2 leading-relaxed">
                      {p.tagline}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      {p.metrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-[9px] text-slate-500 block font-mono uppercase">{m.label}</span>
                          <span className="text-xs font-bold font-mono text-white">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => setActiveProject(p)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-sky-400 hover:text-slate-950 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Ficha Técnica</span>
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODAL DETALLE DE FICHA TÉCNICA ─── */}
      {activeProject && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-6 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30">
                  {activeProject.badge}
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
                  {activeProject.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{activeProject.norm}</p>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <img
              src={activeProject.image}
              alt={activeProject.title}
              className="w-full h-64 md:h-72 object-cover rounded-2xl border border-slate-800"
            />

            <p className="text-sm text-slate-300 font-light leading-relaxed">
              {activeProject.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeProject.metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-mono uppercase">{m.label}</span>
                  <span className="text-sm font-black font-mono text-sky-400">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveProject(null)}
                className="px-6 py-2.5 bg-white text-slate-950 hover:bg-sky-400 font-bold text-xs rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BANNER DE CIERRE INSTITUCIONAL ─── */}
      <section className="py-24 border-t border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 text-center px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
            Conectividad Vital para las Próximas Generaciones
          </span>

          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Agua, gas y energía.<br />
            Construidos con precisión absoluta.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Nuestra flota de maquinaria pesada, soldadores homologados y certificaciones internacionales garantizan el cumplimiento de plazos y normas en obras públicas y privadas.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#contacto"
              className="relative overflow-hidden group px-8 py-4 bg-sky-500 text-slate-950 font-bold text-sm rounded-full shadow-2xl hover:bg-sky-400 transition-all flex items-center justify-center gap-2"
            >
              <span className="transition-transform duration-300 group-hover:-translate-y-8 block">
                Contactar Mesa de Licitaciones
              </span>
              <span className="absolute transition-transform duration-300 translate-y-8 group-hover:translate-y-0 block font-black">
                Enviar Consulta Técnica
              </span>
              <ArrowRight size={16} className="ml-1" />
            </a>

            <a
              href="/"
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-full border border-slate-700 transition-all"
            >
              Acceso a Portal ERP Interno
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER INSTITUCIONAL ─── */}
      <footer id="contacto" className="py-20 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-xs">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white tracking-tighter">
                ECAR<span className="text-sky-500">.</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed font-light">
              Empresa Constructora especializada en Redes de Conducción Hídrica, Gasoductos Troncales y Tendidos Eléctricos Subterráneos. Líderes en ejecución de infraestructura civil en la Región de Cuyo y toda Argentina.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 pt-2">
              <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-sky-400" /> ISO 9001 / ISO 14001 / ISO 45001</span>
              <span className="flex items-center gap-1.5"><FileCheck2 size={16} className="text-amber-400" /> ENARGAS • OSSE • EPRE</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white font-mono uppercase tracking-wider text-xs">Especialidades</h4>
            <ul className="space-y-2 text-slate-400 font-light">
              <li>Acueductos & Redes PEAD / Dúctil</li>
              <li>Gasoductos de Acero (NAG-100)</li>
              <li>Tendido Subterráneo 132/33/13.2 kV</li>
              <li>Perforación Dirigida (Trenchless HDD)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white font-mono uppercase tracking-wider text-xs">Mesa Técnica & Licitaciones</h4>
            <p className="text-slate-400 font-light">Consultas sobre pliegos, cómputos y proyectos:</p>
            <div className="space-y-2 text-slate-300 font-mono pt-1">
              <p className="flex items-center gap-2"><Mail size={14} className="text-sky-400" /> licitaciones@ecarconstructora.com.ar</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-sky-400" /> +54 (264) 421-8800</p>
              <p className="flex items-center gap-2"><Globe size={14} className="text-sky-400" /> San Juan • Mendoza • Buenos Aires</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 ECAR Constructora S.A. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-white transition-colors">Sistema Interno ERP</a>
            <a href="/tracking" className="hover:text-white transition-colors">Telemetría de Flota</a>
            <a href="/presentacion-mesa-tecnica" className="hover:text-white transition-colors">Mesa Técnica</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
