import React from 'react';
import { Truck, Wrench, Fuel } from 'lucide-react';

export const FleetModule: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-slate-800 to-slate-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10"><Truck size={120} /></div>
      <div className="relative z-10">
        <h3 className="font-bold text-2xl flex items-center gap-2"><Truck size={24} /> Flota y Maquinaria</h3>
        <p className="text-slate-100 text-sm mt-1">Registro de vehículos, mantenimiento preventivo y consumo de combustible.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Wrench size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">Mantenimiento</h4>
        <p className="text-sm text-gray-500">Calendario de service por equipo. Próximamente.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Fuel size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">Combustible</h4>
        <p className="text-sm text-gray-500">Registro de cargas y consumo por km. Próximamente.</p>
      </div>
    </div>
  </div>
);
