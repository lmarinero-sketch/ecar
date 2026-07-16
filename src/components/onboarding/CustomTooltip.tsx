import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export const CustomTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}) => {
  return (
    <div
      {...tooltipProps}
      className="bg-white rounded-2xl shadow-2xl w-80 max-w-sm border border-slate-100 font-sans overflow-hidden"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-ecar-blue to-blue-400 w-full" />

      <div className="p-5">
        {/* Progress dots */}
        {size > 1 && (
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({ length: size }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? 'w-5 bg-ecar-blue'
                    : i < index
                    ? 'w-1.5 bg-ecar-blue/40'
                    : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
            <span className="ml-auto text-[10px] font-bold text-slate-400 shrink-0">
              {index + 1} / {size}
            </span>
          </div>
        )}

        {step.title && (
          <h3 className="font-bold text-slate-800 text-base mb-2">
            {step.title}
          </h3>
        )}

        <div className="text-slate-600 text-sm leading-relaxed">
          {step.content}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 pb-4">
        <button
          {...skipProps}
          className="text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <X size={12} /> Saltar tour
        </button>

        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={13} /> Anterior
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-1.5 rounded-lg bg-ecar-blue text-white hover:bg-blue-700 text-xs font-semibold transition-colors shadow-sm flex items-center gap-1"
          >
            {isLastStep ? (
              <><Check size={13} /> ¡Listo!</>
            ) : (
              <>Siguiente <ChevronRight size={13} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
