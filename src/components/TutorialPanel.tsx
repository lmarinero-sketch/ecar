import React from 'react';
import { X, BookOpen, Lightbulb, ListOrdered, GraduationCap, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { TUTORIAL_CONTENT } from '../lib/tutorialContent';
import type { ModuleId } from '../lib/types';

const MODULE_COLOR: Partial<Record<ModuleId, string>> = {
  bi: 'from-slate-700 to-slate-500',
  liquidity: 'from-emerald-700 to-emerald-500',
  purchases: 'from-ecar-blue to-ecar-blue',
  finances: 'from-emerald-800 to-emerald-600',
  obligations: 'from-amber-700 to-amber-500',
  invoicing: 'from-blue-700 to-blue-500',
  monthly_report: 'from-ecar-blue to-ecar-blue',
  expenses: 'from-orange-700 to-orange-500',
  certifications: 'from-lime-700 to-lime-500',
  rrhh: 'from-ecar-blueDark to-ecar-blue',
  inventory: 'from-ecar-blue to-ecar-blue',
  fleet: 'from-slate-800 to-slate-600',
  purchase_requests: 'from-ecar-blue to-ecar-blue',
  project_budget: 'from-ecar-blue to-ecar-blue',
  wbs: 'from-ecar-blueDark to-ecar-blue',
  field: 'from-yellow-700 to-yellow-500',
  safety: 'from-red-700 to-red-500',
  inspections: 'from-pink-700 to-pink-500',
  rfi: 'from-rose-700 to-rose-500',
  documents: 'from-slate-600 to-slate-400',
  fuel: 'from-sky-700 to-sky-500',
  guide: 'from-ecar-blue to-blue-500',
  manual: 'from-blue-900 to-blue-700',
  implementation: 'from-rose-700 to-rose-500',
  logistics: 'from-slate-700 to-slate-500',
  opportunities: 'from-blue-700 to-ecar-blue',
  purchase_orders: 'from-ecar-blueDark to-ecar-blue',
  nonconformities: 'from-red-800 to-rose-600',
  scope_changes: 'from-amber-800 to-orange-600',
  supplier_eval: 'from-ecar-blueDark to-emerald-600',
};

export const TutorialPanel: React.FC = () => {
  const { activeModule, tutorialMode, setTutorialMode } = useAppStore();
  const content = TUTORIAL_CONTENT[activeModule];
  const gradient = MODULE_COLOR[activeModule] || 'from-slate-700 to-slate-500';

  if (!tutorialMode || !content) return null;

  return (
    <div
      className="w-[380px] shrink-0 bg-white border-l border-gray-200 shadow-[-4px_0_24px_rgba(0,0,0,0.06)] flex flex-col h-full animate-slide-in-right overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} p-5 text-white relative overflow-hidden shrink-0`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <GraduationCap size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen size={18} />
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Modo Tutorial</span>
            </div>
            <button
              onClick={() => setTutorialMode(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <X size={16} />
            </button>
          </div>
          <h3 className="text-lg font-bold">{content.title}</h3>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 tutorial-scrollbar">

        {/* Description */}
        <div>
          <p className="text-sm text-gray-600 leading-relaxed">{content.description}</p>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-ecar-blue/10 flex items-center justify-center">
              <ListOrdered size={14} className="text-ecar-blue" />
            </div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cómo usar</h4>
          </div>
          <div className="space-y-2">
            {content.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <span className="w-6 h-6 rounded-full bg-ecar-blue/10 text-ecar-blue text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-ecar-blue group-hover:text-white transition-all">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {content.tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                <Lightbulb size={14} className="text-amber-600" />
              </div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tips</h4>
            </div>
            <div className="space-y-2">
              {content.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                  <p className="text-xs text-amber-800 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation hint */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-2">
          <ChevronRight size={14} className="text-gray-400 animate-pulse" />
          <p className="text-[11px] text-gray-400">Navegá a otro módulo del sidebar para ver su tutorial</p>
        </div>
      </div>
    </div>
  );
};
