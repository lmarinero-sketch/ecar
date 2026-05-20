import React, { useState } from 'react';
import { Truck, Wrench, Fuel, ArrowLeft } from 'lucide-react';
import { FuelModule } from './FuelModule';

type FleetView = 'overview' | 'fuel';

export const FleetModule: React.FC = () => {
  const [view, setView] = useState<FleetView>('overview');

  if (view === 'fuel') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('overview')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver a Flota y Maquinaria
        </button>
        <FuelModule />
      </div>
    );
  }

  return (
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
        <button
          onClick={() => setView('fuel')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:border-sky-300 hover:shadow-md hover:bg-sky-50/30 transition-all group cursor-pointer"
        >
          <Fuel size={48} className="mx-auto mb-3 text-sky-400 group-hover:text-sky-500 group-hover:scale-110 transition-all" />
          <h4 className="font-bold text-gray-800 mb-1 group-hover:text-sky-700 transition-colors">Combustible</h4>
          <p className="text-sm text-gray-500">Registro de cargas y consumo por km.</p>
        </button>
      </div>
    </div>
  );
};
