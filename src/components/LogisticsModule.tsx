import React from 'react';
import { Warehouse, Package, MapPin } from 'lucide-react';

export const LogisticsModule: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-orange-700 to-orange-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10"><Warehouse size={120} /></div>
      <div className="relative z-10">
        <h3 className="font-bold text-2xl flex items-center gap-2"><Warehouse size={24} /> Acopios & Logística</h3>
        <p className="text-orange-100 text-sm mt-1">Control de materiales en obra, remitos y stock de acopio.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Package size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">Control de Stock</h4>
        <p className="text-sm text-gray-500">Registro de materiales por obra. Próximamente.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
        <h4 className="font-bold text-gray-800 mb-1">Localización de Acopios</h4>
        <p className="text-sm text-gray-500">Mapeo de depósitos y obrador. Próximamente.</p>
      </div>
    </div>
  </div>
);
