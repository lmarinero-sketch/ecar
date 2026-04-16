import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calculator, CheckCircle2, FileWarning, Search, FileDown, Receipt, Send } from 'lucide-react';

const mockInvoices = [
  { id: 'FCA-0001-000124', date: '10/04/2026', client: 'Vialidad Nacional', cuit: '30-50012345-1', caeca: '70213456789012', amountNet: 14000000, iva: 2940000, total: 16940000, status: 'Aprobado ARCA' },
  { id: 'FCA-0001-000125', date: '11/04/2026', client: 'EPSE San Juan', cuit: '30-71112223-9', caeca: '70213456789013', amountNet: 32000000, iva: 6720000, total: 38720000, status: 'Aprobado ARCA' },
  { id: 'FCB-0002-000344', date: '13/04/2026', client: 'Inversor Privado', cuit: '20-25444333-1', caeca: 'Pending', amountNet: 4500000, iva: 945000, total: 5445000, status: 'Rechazado (CUIT Inválido)' },
  { id: 'FCE-0003-000012', date: '14/04/2026', client: 'Ministerio Obra Pública', cuit: '30-66665555-2', caeca: 'Syncing', amountNet: 80000000, iva: 16800000, total: 96800000, status: 'Pendiente Sincronización' },
];

export const AccountingModule: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Banner Superior Arca/AFIP */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Calculator size={24}/> Contabilidad y Control ARCA</h2>
            <p className="text-blue-100 mt-1 max-w-2xl text-sm">
              Módulo de facturación electrónica integrado vía Web Services (WSFEv1). 
              Liquidación de IVA (21%), control de Retenciones IIBB, y obtención automática de CAE/CAEA.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center shrink-0">
             <p className="text-xs text-blue-200">Estado del Web Service</p>
             <p className="font-bold text-green-400 flex items-center justify-center gap-1 mt-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> ONLINE</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase">Posición de IVA (Mes Actual)</p>
          <div className="mt-3 flex justify-between items-baseline">
             <h4 className="text-3xl font-bold text-gray-900">A$ 27.5M</h4>
             <span className="text-sm font-bold text-ecar-red">A Pagar</span>
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">DF: 35.8M</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">CF: 8.3M</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase">Retenciones Sufridas (SUSS/IIBB)</p>
          <div className="mt-3 flex justify-between items-baseline">
             <h4 className="text-3xl font-bold text-gray-900">A$ 4.2M</h4>
             <span className="text-sm font-bold text-green-600">A Favor</span>
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">Certificados Descargados</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm bg-blue-50/50">
          <p className="text-sm font-bold text-gray-500 uppercase">Acciones Web Services</p>
          <div className="mt-4 space-y-2">
             <button className="w-full bg-white border border-blue-200 text-blue-700 text-sm font-bold py-2 rounded shadow-sm hover:bg-blue-50 transition-colors flex justify-center items-center gap-2">
                <Receipt size={16}/> Sincronizar Facturación
             </button>
             <button className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-bold py-2 rounded shadow-sm hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                Constatación Comprobantes
             </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h3 className="font-bold text-gray-800">Lote de Facturación Electrónica Emitida</h3>
           <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Buscar FCA..." className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded" />
             </div>
           </div>
        </div>
        <table className="w-full text-left text-sm text-gray-700">
           <thead className="bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
             <tr>
               <th className="px-4 py-3">Comprobante</th>
               <th className="px-4 py-3">Receptor / CUIT</th>
               <th className="px-4 py-3 text-right">Neto Gravo</th>
               <th className="px-4 py-3 text-right">IVA</th>
               <th className="px-4 py-3 text-right">Total ARS</th>
               <th className="px-4 py-3">CAE / Estado ARCA</th>
               <th className="px-4 py-3 text-center">Acción</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {mockInvoices.map((fc, i) => (
               <tr key={i} className="hover:bg-gray-50 transition-colors">
                 <td className="px-4 py-3">
                   <p className="font-bold text-gray-900">{fc.id}</p>
                   <p className="text-xs text-gray-400 font-mono">{fc.date}</p>
                 </td>
                 <td className="px-4 py-3">
                   <p className="font-medium">{fc.client}</p>
                   <p className="text-xs text-gray-500 font-mono">{fc.cuit}</p>
                 </td>
                 <td className="px-4 py-3 text-right font-mono text-gray-600">{fc.amountNet.toLocaleString()}</td>
                 <td className="px-4 py-3 text-right font-mono text-gray-500">{fc.iva.toLocaleString()}</td>
                 <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{fc.total.toLocaleString()}</td>
                 <td className="px-4 py-3 border-l border-gray-100">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        fc.status.includes('Aprobado') ? 'bg-green-100 text-green-800' :
                        fc.status.includes('Rechazado') ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {fc.status}
                      </span>
                      {fc.caeca !== 'Pending' && fc.caeca !== 'Syncing' && (
                        <span className="text-[10px] font-mono text-gray-400">CAE: {fc.caeca}</span>
                      )}
                    </div>
                 </td>
                 <td className="px-4 py-3 text-center">
                    {fc.status.includes('Aprobado') ? (
                      <button className="text-ecar-blue hover:text-blue-900 mx-auto" title="Descargar PDF (Con código QR)"><FileDown size={18}/></button>
                    ) : (
                      <button className="text-orange-500 hover:text-orange-700 mx-auto" title="Reintentar Sincronización"><Send size={18}/></button>
                    )}
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

    </div>
  );
};
