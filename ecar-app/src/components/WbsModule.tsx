import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertCircle, FileText, CheckCircle } from 'lucide-react';

export const WbsModule: React.FC = () => {
  const { wbsElements, createPurchaseOrder } = useStore();
  const [purchaseWbsId, setPurchaseWbsId] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<{type: 'error'|'success', msg: string} | null>(null);

  const formatARS = (val: number) => `A$ ${val.toLocaleString()}`;

  const handleCreatePO = () => {
    if (!purchaseWbsId || !purchaseAmount) return;
    const amountNum = parseInt(purchaseAmount.replace(/\D/g,''), 10);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const res = createPurchaseOrder(purchaseWbsId, amountNum);
    setAlertMsg({ type: res.success ? 'success' : 'error', msg: res.message });
    if(res.success) {
      setPurchaseWbsId(null);
      setPurchaseAmount('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Simulation Header */}
      <div className="bg-ecar-blue/10 border border-ecar-blue/20 rounded-xl p-4 flex gap-4">
         <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center text-ecar-blue shrink-0">
            <FileText size={20} />
         </div>
         <div>
            <h3 className="font-bold text-ecar-blue">Gestión de Presupuesto y "Hard Stops"</h3>
            <p className="text-sm text-gray-600 mt-1">
              La tabla WBS es el sumidero de costos. El <strong>Costo Comprometido</strong> aumenta al emitir Órdenes de Compra. El <strong>Costo Devengado (Accrual)</strong> aumentará cuando el Capataz consuma material real en el terreno. Intenta emitir una OC que supere la "Diferencia" para ver el Hard Stop.
            </p>
         </div>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${alertMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {alertMsg.type === 'error' ? <AlertCircle className="shrink-0" /> : <CheckCircle className="shrink-0" />}
          <span className="text-sm font-medium">{alertMsg.msg}</span>
        </div>
      )}

      {/* WBS Table */}
      <div className="light-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-[28%]">Estructura WBS</th>
              <th className="text-right">Avance %</th>
              <th className="text-right">Presupuesto Apercibir</th>
              <th className="text-right text-ecar-blue bg-blue-50/20">Presupuesto Costo</th>
              <th className="text-right bg-blue-50/20">Costo Comprometido</th>
              <th className="text-right bg-green-50/20">Costo Devengado</th>
              <th className="text-right text-gray-400">Resto Financiero</th>
              <th className="w-16">Acción</th>
            </tr>
          </thead>
          <tbody>
            {wbsElements.map(el => {
              const diff = el.budgetCostARS - el.committedCostARS;
              const isDanger = diff < el.budgetCostARS * 0.1;
              const margin = el.budgetRevenueARS - el.budgetCostARS;

              return (
                <tr key={el.id} className={el.parentId ? 'bg-gray-50/20' : 'font-semibold bg-gray-50/60'}>
                  <td className={`py-4 ${el.parentId ? 'pl-8 text-gray-600 border-l-2 border-l-gray-300' : 'text-gray-900 border-l-4 border-l-ecar-blue'}`}>
                    {el.name}
                  </td>
                  <td className="text-right font-medium">
                     <span className={`px-2 py-0.5 rounded text-xs ${el.progressPct === 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {el.progressPct}%
                     </span>
                  </td>
                  <td className="text-right font-mono text-green-700">{formatARS(el.budgetRevenueARS)}<br/><span className="text-[10px] text-gray-400">Margen: {formatARS(margin)}</span></td>
                  <td className="text-right font-mono text-ecar-blue bg-blue-50/20">{formatARS(el.budgetCostARS)}</td>
                  <td className="text-right font-mono text-gray-800 bg-blue-50/20">{formatARS(el.committedCostARS)}</td>
                  <td className="text-right font-mono text-green-600 bg-green-50/20">{formatARS(el.accruedCostARS)}</td>
                  <td className={`text-right font-mono ${isDanger ? 'text-ecar-red font-bold' : 'text-gray-500'}`}>
                    {formatARS(diff)}
                  </td>
                  <td className="text-center">
                    {el.parentId && (
                      <button onClick={() => setPurchaseWbsId(el.id)} className="text-ecar-blue hover:text-ecar-blueDark p-1 font-bold">
                        + OC
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Generate PO Form Modal-like inline */}
      {purchaseWbsId && (
        <div className="light-card p-6 mt-4 border-l-4 border-l-ecar-blue animate-in fade-in slide-in-from-top-4">
           <h4 className="font-bold text-gray-900 mb-4">Emitir Nueva Orden de Compra</h4>
           <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Partida Destino</label>
                <input disabled value={wbsElements.find(e => e.id === purchaseWbsId)?.name} className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-600 outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Monto de la OC (A$)</label>
                <input 
                  type="text" 
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="Ej: 50000000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-ecar-blue focus:ring-1 focus:ring-ecar-blue font-mono" 
                />
              </div>
              <button onClick={handleCreatePO} className="btn-primary py-2 px-6 h-[42px]">
                Validar y Emitir
              </button>
              <button onClick={() => setPurchaseWbsId(null)} className="btn-secondary py-2 px-6 h-[42px]">
                Cancelar
              </button>
           </div>
        </div>
      )}

    </div>
  );
};
