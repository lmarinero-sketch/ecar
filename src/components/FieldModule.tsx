import React from 'react';
import { Smartphone, Clipboard, Camera } from 'lucide-react';

export const FieldModule: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-amber-800 to-amber-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10"><Smartphone size={120} /></div>
      <div className="relative z-10">
        <h3 className="font-bold text-2xl flex items-center gap-2"><Smartphone size={24} /> Parte Diario de Obra</h3>
        <p className="text-amber-100 text-sm mt-1">Registro diario desde campo: tareas, materiales consumidos, observaciones y fotos.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Clipboard size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">Parte Diario</h4>
        <p className="text-sm text-gray-500">Formulario de actividades ejecutadas por jornada. Próximamente.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Camera size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">Registro Fotográfico</h4>
        <p className="text-sm text-gray-500">Captura con geolocalización y timestamp. Próximamente.</p>
      </div>
    </div>
  </div>
);
