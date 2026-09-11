import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Globe,
  Phone,
  Mail,
  ChevronDown
} from 'lucide-react';
import { Building3DViewer } from './Building3DViewer';

interface ProjectShowcase {
  id: string;
  title: string;
  category: 'Edificación & Torres' | 'Infraestructura & Puentes' | 'Saneamiento & Plantas';
  tagline: string;
  description: string;
  metrics: { label: string; value: string }[];
  image: string;
  badge: string;
  features: string[];
}

const PROJECTS_DATA: ProjectShowcase[] = [
  {
    id: 'torres-skyline',
    title: 'Torre Mirador del Parque',
    category: 'Edificación & Torres',
    tagline: 'Arquitectura vertical de alta gama con certificación bioclimática.',
    description: 'Complejo residencial y corporativo de 24 niveles con núcleo central antisísmico de hormigón armado H-30, envolvente térmica de doble vidriado hermético (DVH) y amenities de nivel internacional con vista panorámica 360°.',
    metrics: [
      { label: 'Superficie Total', value: '28.500 m²' },
      { label: 'Altura Máxima', value: '86 Metros' },
      { label: 'Plazo de Entrega', value: '22 Meses' },
      { label: 'Eficiencia Energética', value: 'Clase A+' },
    ],
    image: '/assets/showcase/building_skyline.jpg',
    badge: 'Edificación en Altura',
    features: ['Estructura sismorresistente calculada en CIRSOC 103', 'BIM Revit Level 300 con detección de interferencias', 'Control de cuadrillas con trazabilidad en tiempo real'],
  },
  {
    id: 'distribuidor-vial',
    title: 'Viaducto & Distribuidor Vial San Juan',
    category: 'Infraestructura & Puentes',
    tagline: 'Ingeniería vial estratégica para la conexión interurbana.',
    description: 'Puente atirantado de hormigón pretensado con luces libres de 140 metros sobre cauce hídrico, calzadas divididas de 4 carriles, iluminación inteligente solar LED y sistema de monitoreo estructural con sensores de deformación activa.',
    metrics: [
      { label: 'Longitud de Traza', value: '4.200 ml' },
      { label: 'Hormigón Estructural', value: '18.400 m³' },
      { label: 'Capacidad de Tránsito', value: '45.000 veh/día' },
      { label: 'Seguridad Operativa', value: 'Zero Incidentes' },
    ],
    image: '/assets/showcase/bridge_infrastructure.jpg',
    badge: 'Mega Infraestructura',
    features: ['Vigas postensadas premoldeadas en obrador propio', 'Fundaciones profundas mediante pilotes de 1.80m de diámetro', 'Gestión logística y control de flota pesada conectada'],
  },
  {
    id: 'planta-acueducto',
    title: 'Planta Potabilizadora & Acueducto Gran San Juan',
    category: 'Saneamiento & Plantas',
    tagline: 'Garantía hídrica y saneamiento para más de 300.000 habitantes.',
    description: 'Instalación de acueducto troncal de fundición dúctil DN 1200mm con válvulas de mariposa de comando electrohidráulico, cámaras de desagüe y cisterna de reserva de hormigón armado de 15.000 m³ con sistema de filtrado automatizado.',
    metrics: [
      { label: 'Caudal de Diseño', value: '2.5 m³/s' },
      { label: 'Tendido de Cañería', value: '38.5 km' },
      { label: 'Población Beneficiada', value: '320.000 hab' },
      { label: 'Cumplimiento OSSE', value: '100% Norma' },
    ],
    image: '/assets/showcase/hydraulic_plant.jpg',
    badge: 'Obras Hidráulicas',
    features: ['Soldaduras y uniones con ensayo de tintas penetrantes y radiografía', 'Excavación masiva con zanjeadoras de alto rendimiento', 'Control de avance físico y partes de obra digitalizados'],
  },
];

export const ShowcasePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeProject, setActiveProject] = useState<ProjectShowcase>(PROJECTS_DATA[0]);
  const [viewerMode, setViewerMode] = useState<'wireframe' | 'solid' | 'hybrid'>('hybrid');

  const categories = ['Todos', 'Edificación & Torres', 'Infraestructura & Puentes', 'Saneamiento & Plantas'];

  const filteredProjects = selectedCategory === 'Todos'
    ? PROJECTS_DATA
    : PROJECTS_DATA.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* ─── NAV SUPERIOR ULTRA CLEAN ─── */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-white">
                ECAR<span className="text-sky-500">.</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase px-2 py-0.5 rounded border border-slate-800">
                Engineering & Construction
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <a href="#experiencia" className="hover:text-white transition-colors">Experiencia</a>
            <a href="#ingenieria" className="hover:text-white transition-colors">Ingeniería 3D</a>
            <a href="#obras" className="hover:text-white transition-colors">Proyectos</a>
            <a href="#metricas" className="hover:text-white transition-colors">Métricas</a>
            <a href="#contacto" className="hover:text-white transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-4 py-2 text-xs font-bold font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
            >
              Portal ERP
            </a>
            <a
              href="#contacto"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-white hover:bg-sky-400 rounded-xl shadow-lg transition-all"
            >
              Iniciar Proyecto
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION CINEMATOGRÁFICO (Estilo Joby Aviation) ─── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Imagen de Fondo con Overlay y Gradientes */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/showcase/building_skyline.jpg"
            alt="ECAR Skyline"
            className="w-full h-full object-cover object-center scale-105 animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90" />
        </div>

        {/* Contenido Hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 backdrop-blur-md text-xs font-mono text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Ingeniería Civil & Edificación de Vanguardia</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Construyendo el futuro del skyline argentino.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Fusionamos ingeniería estructural de alta precisión, modelado BIM en tiempo real y una gestión operativa digitalizada que redefine la calidad en la construcción.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#ingenieria"
              className="w-full sm:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-2xl shadow-xl hover:shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Cpu size={18} /> Explorar Ingeniería 3D
            </a>
            <a
              href="#obras"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl border border-slate-700 backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              Ver Portafolio de Obras <ArrowRight size={16} />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-800/80 text-left">
            <div>
              <p className="text-3xl font-black font-mono text-white tracking-tight">+150.000</p>
              <p className="text-xs text-slate-400 font-medium">Metros Cuadrados Construidos</p>
            </div>
            <div>
              <p className="text-3xl font-black font-mono text-sky-400 tracking-tight">100%</p>
              <p className="text-xs text-slate-400 font-medium">Trazabilidad Digital BIM</p>
            </div>
            <div>
              <p className="text-3xl font-black font-mono text-white tracking-tight">0</p>
              <p className="text-xs text-slate-400 font-medium">Índice de Accidentes Graves</p>
            </div>
            <div>
              <p className="text-3xl font-black font-mono text-amber-400 tracking-tight">+35</p>
              <p className="text-xs text-slate-400 font-medium">Grandes Obras Entregadas</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-slate-500 animate-bounce">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ─── SECCIÓN: INGENIERÍA DIGITAL & GEMELO DIGITAL 3D ─── */}
      <section id="ingenieria" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
              Omniflash Engineering • BIM 3D
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Ingeniería Interactiva en Tiempo Real.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cada proyecto de ECAR cuenta con un modelo 3D vivo coordinado con cómputos métricos, cronogramas de avance y cuadrillas de campo.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {(['hybrid', 'solid', 'wireframe'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewerMode(mode)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold capitalize transition-all ${
                  viewerMode === mode ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'hybrid' ? 'Híbrido BIM' : mode === 'solid' ? 'Sólido' : 'Estructura Alambre'}
              </button>
            ))}
          </div>
        </div>

        {/* Visor 3D Interactivo */}
        <Building3DViewer renderMode={viewerMode} />

        {/* Pilares de Ingeniería */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Modelado BIM LOD 350</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Coordinación multidisciplinaria integral (Estructuras, Instalaciones Sanitarias, Termomecánica y Eléctrica) para eliminar el 100% de las colisiones antes de verter hormigón.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Control Operativo & Calidad</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistema propio de medición de rendimientos por cuadrilla (PR-GO-01), seguimiento de horas productivas y resolución inmediata de desvíos en campo.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Gestión de Cadena de Suministro</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integración total entre compras de materiales, despacho desde pañol y certificación quincenal, evitando paradas operativas y garantizando plazos de entrega.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN: PORTAFOLIO DE GRANDES OBRAS ─── */}
      <section id="obras" className="py-24 bg-slate-900/30 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
                Portafolio de Proyectos
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                Obras que marcan un estándar.
              </h2>
            </div>

            {/* Categorías Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-950 shadow-md font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Proyectos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="group bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Imagen de Proyecto */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-md text-sky-400 border border-sky-400/30">
                        {p.badge}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{p.category}</span>
                      <h3 className="text-2xl font-extrabold text-white group-hover:text-sky-400 transition-colors">
                        {p.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Métricas del Proyecto */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      {p.metrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block font-mono uppercase">{m.label}</span>
                          <span className="text-sm font-bold font-mono text-white">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => setActiveProject(p)}
                    className="w-full py-3 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>Ver Ficha Técnica Completa</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODAL DETALLE DE FICHA TÉCNICA ─── */}
      {activeProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-6 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30">
                  {activeProject.badge}
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
                  {activeProject.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{activeProject.category}</p>
              </div>
              <button
                onClick={() => setActiveProject(null as any)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                ✕
              </button>
            </div>

            <img
              src={activeProject.image}
              alt={activeProject.title}
              className="w-full h-64 md:h-80 object-cover rounded-2xl border border-slate-800"
            />

            <p className="text-sm text-slate-300 leading-relaxed">
              {activeProject.description}
            </p>

            {/* Métricas Completas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeProject.metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-mono uppercase">{m.label}</span>
                  <span className="text-base font-black font-mono text-sky-400">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Características Destacadas */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Especificaciones & Normas de Calidad
              </h4>
              <div className="space-y-1.5">
                {activeProject.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveProject(null as any)}
                className="px-6 py-2.5 bg-white text-slate-950 hover:bg-sky-400 font-bold text-xs rounded-xl transition-all"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER & CONTACTO INSTITUCIONAL ─── */}
      <footer id="contacto" className="py-20 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-xs">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white tracking-tighter">
                ECAR<span className="text-sky-500">.</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Empresa Constructora de Obras Civiles, Infraestructura y Edificación Urbana. Operando con los más altos estándares de calidad, seguridad y cumplimiento de plazos en Argentina.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-sky-400" /> Certificación ISO 9001</span>
              <span className="flex items-center gap-1.5"><Globe size={16} className="text-sky-400" /> San Juan • Mendoza • Cuyo</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white font-mono uppercase tracking-wider text-xs">Divisiones</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Edificación en Altura & Residencial</li>
              <li>Obras de Infraestructura Vial</li>
              <li>Saneamiento & Plantas de Agua</li>
              <li>Ingeniería Estructural & BIM</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white font-mono uppercase tracking-wider text-xs">Mesa de Entrada</h4>
            <p className="text-slate-400">Consultas técnicas e inversores corporativos:</p>
            <div className="space-y-1.5 text-slate-300 font-mono">
              <p className="flex items-center gap-2"><Mail size={14} className="text-sky-400" /> contacto@ecarconstructora.com.ar</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-sky-400" /> +54 (264) 421-8800</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 ECAR Constructora S.A. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-white transition-colors">Sistema Interno</a>
            <a href="/tracking" className="hover:text-white transition-colors">Telemetría de Flota</a>
            <a href="/presentacion-mesa-tecnica" className="hover:text-white transition-colors">Mesa Técnica</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
