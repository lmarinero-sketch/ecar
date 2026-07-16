import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';

export const CustomTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
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
      className="bg-white rounded-lg shadow-lg p-5 w-80 max-w-sm border border-slate-100 font-sans"
    >
      {step.title && (
        <h3 className="font-bold text-slate-800 text-lg mb-2">
          {step.title}
        </h3>
      )}
      
      <div className="text-slate-600 text-sm leading-relaxed mb-6">
        {step.content}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {!isLastStep && (
            <button
              {...skipProps}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 transition-colors"
            >
              Saltar
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 rounded-md text-slate-500 bg-slate-50 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Anterior
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-1.5 rounded-md bg-ecar-blue text-white hover:bg-blue-700 text-xs font-semibold transition-colors shadow-sm"
          >
            {continuous && !isLastStep ? 'Siguiente' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
};
