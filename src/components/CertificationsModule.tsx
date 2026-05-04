import React from 'react';
import { FileSignature, ClipboardCheck, BarChart2 } from 'lucide-react';

export const CertificationsModule: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-rose-800 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10"><FileSignature size={120} /></div>
      <div className="relative z-10">
        <h3 className="font-bold text-2xl flex items-center gap-2"><FileSignature size={24} /> Certificaciones / ICC</h3>
        <p className="text-rose-100 text-sm mt-1">Certificaciones de avance de obra, ICC y redeterminaciones de precios.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <ClipboardCheck size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">Certificación de Obra</h4>
        <p className="text-sm text-gray-500">Generación automática de certificados mensuales. Próximamente.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <BarChart2 size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">ICC & Redeterminaciones</h4>
        <p className="text-sm text-gray-500">Cálculo con índices INDEC para ajuste de contratos. Próximamente.</p>
      </div>
    </div>
  </div>
);
