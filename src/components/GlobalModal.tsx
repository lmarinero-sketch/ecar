import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, HelpCircle, Trash2 } from 'lucide-react';
import { useModalStore } from '../store/useModalStore';

export const GlobalModal: React.FC = () => {
  const { isOpen, type, title, message, confirm, cancel } = useModalStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = title.toLowerCase().includes('eliminar') || 
                   title.toLowerCase().includes('borrar') || 
                   title.toLowerCase().includes('baja') || 
                   title.toLowerCase().includes('rechazar');

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={cancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-scale-in my-auto max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${
              isDanger 
                ? 'bg-rose-100 text-rose-600' 
                : type === 'alert' 
                ? 'bg-amber-100 text-amber-600' 
                : 'bg-blue-100 text-ecar-blue'
            }`}>
              {isDanger ? <Trash2 size={24} /> : type === 'alert' ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold mb-1.5 ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed break-words">{message}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-3.5 flex justify-end items-center gap-3 border-t border-slate-100">
          {type === 'confirm' && (
            <button 
              type="button"
              onClick={cancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button 
            type="button"
            onClick={confirm}
            autoFocus
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : type === 'alert' 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {type === 'confirm' ? (isDanger ? 'Eliminar' : 'Confirmar') : 'Entendido'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
