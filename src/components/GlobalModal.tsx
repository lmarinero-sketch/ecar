import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { useModalStore } from '../store/useModalStore';

export const GlobalModal: React.FC = () => {
  const { isOpen, type, title, message, confirm, cancel } = useModalStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${type === 'alert' ? 'bg-amber-100 text-amber-600' : 'bg-ecar-blueLight text-ecar-blue'}`}>
              {type === 'alert' ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600 break-words">{message}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          {type === 'confirm' && (
            <button 
              onClick={cancel}
              className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={confirm}
            autoFocus
            className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm ${
              type === 'alert' 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                : 'bg-ecar-blue hover:bg-ecar-blue shadow-ecar-blue/20'
            }`}
          >
            {type === 'confirm' ? 'Confirmar' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
};
