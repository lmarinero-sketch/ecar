import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { mockData } from '../store/mockData';
import { HardHat, Send, CheckCircle2 } from 'lucide-react';

export const FieldModule: React.FC = () => {
  const { recordDailyLog, physicalInventory } = useStore();
  const [wbsId, setWbsId] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [success, setSuccess] = useState(false);

  // Get physical inventory available in warehouses (prefer Mobile or Site)
  // For demo, we just show materials that have > 0 qty
  const groupedInventory = physicalInventory.reduce((acc, curr) => {
    if(!acc[curr.itemId]) acc[curr.itemId] = 0;
    acc[curr.itemId] += curr.qty;
    return acc;
  }, {} as Record<string, number>);

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const qNum = parseInt(qty, 10);
    if (!wbsId || !itemId || isNaN(qNum) || qNum <= 0) return;

    // We assume the Capataz is taking from the Site warehouse (wh-3) or mobile. 
    // Ideally, we restrict the select to what they actually have. We just use 'wh-3' for simplicity.
    recordDailyLog(wbsId, itemId, qNum, 'wh-3');
    
    setSuccess(true);
    setWbsId('');
    setItemId('');
    setQty('');
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex justify-center">
      {/* Mobile Device Mockup */}
      <div className="w-[375px] h-[750px] bg-black rounded-[3rem] p-2 shadow-2xl relative border-8 border-gray-900 border-x-gray-800">
         {/* Dynamic Island / Notch area */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-50"></div>

         <div className="bg-gray-50 w-full h-full rounded-[2.5rem] overflow-hidden flex flex-col relative">
            
            {/* App Header */}
            <div className="bg-ecar-blue text-white pt-10 pb-4 px-6 shadow-md">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <HardHat size={20} />
                   <h2 className="font-bold tracking-tight">Parte Diario</h2>
                 </div>
                 <div className="text-xs bg-white/20 px-2 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                   Capataz
                 </div>
               </div>
            </div>

            {/* App Content */}
            <div className="flex-1 p-5 overflow-y-auto w-full">
               <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                 Reporte de consumos. Al enviar este formulario, el costo devengado se imputará instantáneamente a la WBS en la oficina.
               </p>

               {success && (
                  <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in slide-in-from-top-2">
                     <CheckCircle2 size={32} className="text-green-600"/>
                     <p className="font-bold text-sm text-center">Consumo registrado en WBS.</p>
                  </div>
               )}

               <form onSubmit={handleRecord} className="space-y-4">
                 
                 <div>
                   <label className="block text-xs font-bold text-gray-700 uppercase mb-1">1. Tarea (WBS Destino)</label>
                   <select 
                     required
                     value={wbsId} 
                     onChange={(e) => setWbsId(e.target.value)}
                     className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:border-ecar-blue outline-none text-sm shadow-sm"
                   >
                     <option value="">Seleccione Partida...</option>
                     {mockData.wbsElements.filter(w => w.parentId !== null).map(w => (
                       <option key={w.id} value={w.id}>{w.name}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-gray-700 uppercase mb-1">2. Material Consumido</label>
                   <select 
                     required
                     value={itemId} 
                     onChange={(e) => setItemId(e.target.value)}
                     className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:border-ecar-blue outline-none text-sm shadow-sm"
                   >
                     <option value="">Buscar material...</option>
                     {mockData.items.filter(i => i.category === 'Consumable').map(i => (
                       <option key={i.id} value={i.id}>
                         {i.name} (Stock: {groupedInventory[i.id] || 0} {i.uom})
                       </option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-gray-700 uppercase mb-1">3. Cantidad</label>
                   <input 
                     required
                     type="number"
                     placeholder="Ej: 50"
                     value={qty}
                     onChange={e => setQty(e.target.value)}
                     className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 font-mono focus:border-ecar-blue outline-none shadow-sm"
                   />
                 </div>

                 <div className="pt-4">
                   <button type="submit" className="w-full bg-ecar-blue text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                     Firmar y Enviar <Send size={18} />
                   </button>
                 </div>
               </form>

               <div className="mt-8 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online mode (Sync active)
                  </div>
               </div>

            </div>
         </div>
      </div>
    </div>
  );
};
