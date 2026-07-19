import React from 'react';
import {
  Target, HardHat, FileSignature, ArrowRight, Building2,
  ShoppingCart, Truck, Landmark, ClipboardCheck,
  FileText, Users, AlertTriangle, CheckCircle2,
  TrendingUp, Layers, BookOpen, ArrowDown,
} from 'lucide-react';
import { useAppStore } from '../store/useStore';
import type { ModuleId } from '../lib/types';

const FLOW_STEPS = [
  { icon: Target, label: 'Oportunidad', desc: 'Pedido, licitación, necesidad interna o consulta', color: 'from-blue-500 to-blue-600' },
  { icon: ClipboardCheck, label: 'Relevamiento', desc: 'Visita, documentación, checklist, supuestos', color: 'from-ecar-blue to-ecar-blue' },
  { icon: Layers, label: 'Cómputo y Análisis', desc: 'Medición, análisis de precios, consulta a Compras/Logística', color: 'from-ecar-blue to-ecar-blue' },
  { icon: HardHat, label: 'Presupuesto', desc: 'Propuesta técnica-económica con versiones', color: 'from-ecar-blue to-ecar-blue' },
  { icon: CheckCircle2, label: 'Aprobación', desc: 'Revisión GG, margen, riesgos, validación', color: 'from-emerald-500 to-emerald-600' },
  { icon: FileSignature, label: 'Entrega a Obra', desc: 'Carpeta de inicio: alcance, cómputo, restricciones', color: 'from-amber-500 to-amber-600' },
];

const DELIVERABLES = [
  {
    area: 'Gerencia de Obras',
    icon: Building2,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    iconColor: 'text-amber-600',
    docs: [
      'Carpeta de inicio (alcance, cómputo, supuestos, restricciones)',
      'Planos y memoria técnica revisados',
      'Lista de recursos críticos',
      'Riesgos identificados y observaciones',
      'Contactos clave del proyecto',
    ],
  },
  {
    area: 'Gerencia de Compras',
    icon: ShoppingCart,
    color: 'bg-slate-50 border-ecar-blueLight text-ecar-blue',
    iconColor: 'text-ecar-blue',
    docs: [
      'Solicitud de cotizaciones (materiales, servicios, equipos)',
      'Planilla de materiales con cantidades',
      'Comparativa técnica de alternativas',
      'Precios críticos a validar',
      'Condiciones de entrega requeridas',
    ],
  },
  {
    area: 'Gerencia de Logística',
    icon: Truck,
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    iconColor: 'text-sky-600',
    docs: [
      'Lista de equipos, herramientas y vehículos necesarios',
      'Consulta de disponibilidad de stock',
      'Plazos de movilización requeridos',
      'Restricciones logísticas (acceso, espacio, horarios)',
    ],
  },
  {
    area: 'Administración y Finanzas',
    icon: Landmark,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    iconColor: 'text-emerald-600',
    docs: [
      'Condiciones de pago del proyecto',
      'Análisis de precios y márgenes',
      'Base para cierre económico posterior',
      'Comparación presupuesto vs real',
    ],
  },
];

const SUBMODULES: { id: ModuleId; label: string; desc: string; icon: React.ElementType; gradient: string }[] = [
  {
    id: 'opportunities',
    label: 'Pipeline de Oportunidades',
    desc: 'Registrá y seguí cada oportunidad comercial desde el primer contacto hasta la adjudicación o rechazo.',
    icon: Target,
    gradient: 'from-blue-600 to-ecar-blue',
  },
  {
    id: 'project_budget',
    label: 'Presupuestos de Obra',
    desc: 'Creá presupuestos con cómputo métrico, análisis de precios, rubros, banco de precios y versionado.',
    icon: HardHat,
    gradient: 'from-ecar-blue to-ecar-blue',
  },
  {
    id: 'certifications',
    label: 'Certificaciones / ICC',
    desc: 'Gestioná certificaciones de avance de obra, mediciones y estados de pago con el comitente.',
    icon: FileSignature,
    gradient: 'from-lime-600 to-emerald-600',
  },
];

export const BudgetLandingModule: React.FC = () => {
  const { setActiveModule } = useAppStore();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-ecar-blueDark rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-ecar-blue/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-ecar-blue/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <HardHat size={24} className="text-ecar-blueLight" />
            </div>
            <div>
              <h2 className="font-bold text-2xl tracking-tight">Gerencia de Proyectos y Presupuestos</h2>
              <p className="text-ecar-blueLight text-sm font-medium">Procedimiento PR-GPP-01 · v2.0</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
            Esta gerencia transforma oportunidades, pedidos, relevamientos y necesidades en información técnica y económica confiable.
            Su trabajo define <strong className="text-white">qué se entiende</strong>, <strong className="text-white">qué se mide</strong>, <strong className="text-white">qué se incluye y excluye</strong>, y
            entrega a Obras, Compras, Logística y GG la base para tomar decisiones.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-ecar-blueLight/80">
            <BookOpen size={14} />
            <span>Un presupuesto mal armado no termina en el presupuesto: impacta en compras urgentes, faltantes logísticos, desvíos económicos y pérdida de control.</span>
          </div>
        </div>
      </div>

      {/* Sub-módulos — acceso rápido */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
          <Layers size={18} className="text-ecar-blue" /> Módulos del Área
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUBMODULES.map(mod => (
            <button key={mod.id} onClick={() => setActiveModule(mod.id)}
              className="group bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-lg hover:border-ecar-blueLight hover:-translate-y-0.5 transition-all text-left">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform`}>
                <mod.icon size={20} className="text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-1 group-hover:text-ecar-blue transition-colors">{mod.label}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{mod.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-ecar-blue opacity-0 group-hover:opacity-100 transition-opacity">
                Ingresar <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Flujo del proceso */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-ecar-blue" /> Flujo del Proceso
        </h3>
        <div className="light-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {FLOW_STEPS.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform`}>
                    <step.icon size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 mb-0.5">PASO {idx + 1}</span>
                  <h4 className="font-bold text-sm text-gray-800 leading-tight">{step.label}</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-snug">{step.desc}</p>
                </div>
                {idx < FLOW_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-6 -right-2 text-gray-300">
                    <ArrowRight size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Criterio rector */}
          <div className="mt-6 bg-slate-50 border border-ecar-blueLight rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-ecar-blue mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-ecar-blueDark mb-1">Criterio Rector del Área</p>
              <p className="text-xs text-ecar-blue leading-relaxed">
                Todo presupuesto debe poder explicar: <strong>qué se entendió</strong>, <strong>qué se midió</strong>, <strong>qué se incluyó y excluyó</strong>,
                <strong> qué se asumió</strong>, <strong>qué riesgo existe</strong>, <strong>qué versión fue enviada</strong> y con qué información
                deberán trabajar Obras, Compras, Logística y GG.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Entregas a cada gerencia */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
          <FileText size={18} className="text-ecar-blue" /> Documentos que se Entregan a Cada Área
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DELIVERABLES.map(del => (
            <div key={del.area} className={`rounded-2xl border p-5 shadow-sm ${del.color}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                  <del.icon size={18} className={del.iconColor} />
                </div>
                <h4 className="font-bold text-sm">{del.area}</h4>
              </div>
              <ul className="space-y-1.5">
                {del.docs.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <ArrowDown size={10} className="mt-0.5 flex-shrink-0 opacity-60" />
                    <span className="leading-snug">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Responsabilidades RACI resumidas */}
      <div className="light-card ">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users size={18} className="text-ecar-blue" /> Matriz de Responsabilidades (Resumen)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">Actividad</th>
                <th className="text-center">GPP</th>
                <th className="text-center">GG</th>
                <th className="text-center">Obras</th>
                <th className="text-center">Compras</th>
                <th className="text-center">Logística</th>
              </tr>
            </thead>
            <tbody>
              {[
                { act: 'Registrar oportunidad', gpp: 'R', gg: 'I', ob: 'I', co: 'I', lo: 'I' },
                { act: 'Relevar y analizar documentación', gpp: 'R', gg: 'C', ob: 'C', co: 'I', lo: 'I' },
                { act: 'Solicitar cotizaciones críticas', gpp: 'R', gg: 'I', ob: 'C', co: 'R', lo: 'I' },
                { act: 'Validar disponibilidad de recursos', gpp: 'C', gg: 'I', ob: 'C', co: 'I', lo: 'R' },
                { act: 'Armar presupuesto y propuesta', gpp: 'R', gg: 'C/A', ob: 'C', co: 'C', lo: 'C' },
                { act: 'Aprobar margen o riesgo relevante', gpp: 'C', gg: 'A/R', ob: 'I', co: 'C', lo: 'C' },
                { act: 'Entregar carpeta a Obras', gpp: 'R', gg: 'I', ob: 'R', co: 'I', lo: 'I' },
                { act: 'Registrar adicional o cambio', gpp: 'R', gg: 'A', ob: 'C', co: 'C', lo: 'C' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="font-medium text-gray-700">{row.act}</td>
                  {[row.gpp, row.gg, row.ob, row.co, row.lo].map((v, j) => (
                    <td key={j} className="text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        v.includes('R') ? 'bg-ecar-blueLight text-ecar-blue' :
                        v.includes('A') ? 'bg-amber-100 text-amber-700' :
                        v === 'C' ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>{v}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 text-[10px] text-gray-400 font-medium">
          R = Responsable de ejecutar · A = Aprueba · C = Consultado · I = Informado
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pb-4">
        <p>Gerencia de Proyectos y Presupuestos — ECAR Construcciones</p>
        <p>Documento PR-GPP-01 v2.0 · Junio 2026</p>
      </div>
    </div>
  );
};
