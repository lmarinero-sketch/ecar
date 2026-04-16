import React, { useState, useMemo } from 'react';
import { Landmark, AlertTriangle, CheckCircle, RefreshCcw, HandCoins } from 'lucide-react';

const mockCheques = [
  // A Pagar (To turn in)
  { id: 'CH-9821', banco: 'Banco San Juan', cuenta: '0032-4412/1', proveedor: 'Hormigonera Cuyana', monto: 14500000, echeq: true, fechaVto: '28/04/2026', estado: 'A Pagar', motivo: null },
  { id: 'CH-9822', banco: 'Banco Macro', cuenta: '0101-9921/4', proveedor: 'Acindar S.A. (Distribuidor)', monto: 22000000, echeq: true, fechaVto: '05/05/2026', estado: 'A Pagar', motivo: null },
  { id: 'CH-9823', banco: 'Banco Nación', cuenta: '0011-5555/0', proveedor: 'Caterpillar Finanzas', monto: 18500000, echeq: true, fechaVto: '10/05/2026', estado: 'A Pagar', motivo: null },
  
  // A Cobrar (Waiting to be cashed)
  { id: 'CH-1004', banco: 'Banco San Juan', cuenta: '0001-4444/3', proveedor: 'Vialidad Provincial SJ', monto: 85000000, echeq: true, fechaVto: '30/04/2026', estado: 'A Cobrar', motivo: null },
  { id: 'CH-1005', banco: 'Banco Galicia', cuenta: '0231-1122/8', proveedor: 'Inversor Privado Torre', monto: 35000000, echeq: false, fechaVto: '15/05/2026', estado: 'A Cobrar', motivo: null },
  
  // Cobrados (History)
  { id: 'CH-0991', banco: 'Banco San Juan', cuenta: '0001-4444/3', proveedor: 'Ministerio Obra Pública', monto: 115000000, echeq: true, fechaVto: '02/04/2026', estado: 'Cobrado', motivo: null },
  { id: 'CH-0992', banco: 'Santander', cuenta: '3322-8888/1', proveedor: 'IPV San Juan', monto: 65000000, echeq: true, fechaVto: '10/04/2026', estado: 'Cobrado', motivo: null },

  // Rechazados (Bounced)
  { id: 'CH-0932', banco: 'Banco Macro', cuenta: '4441-2131/9', proveedor: 'Mercado Libre Infra', monto: 24000000, echeq: true, fechaVto: '12/04/2026', estado: 'Rechazado', motivo: 'Sin fondos suficientes (Código 01)' },
  { id: 'CH-0914', banco: 'Banco San Juan', cuenta: '2211-5511/2', proveedor: 'Constructora Cuyo Sub', monto: 8500000, echeq: false, fechaVto: '14/04/2026', estado: 'Rechazado', motivo: 'Defecto formal (Firma diferida)' },
];

export const FinancesModule: React.FC = () => {
  const [data] = useState(mockCheques);
  const [activeTab, setActiveTab] = useState('Todos');

  const formatARS = (val: number) => `A$ ${(val).toLocaleString()}`;

  const tabs = ['Todos', 'A Pagar', 'A Cobrar', 'Cobrados', 'Rechazados'];

  const filteredData = useMemo(() => {
    if (activeTab === 'Todos') return data;
    return data.filter(c => c.estado === activeTab);
  }, [data, activeTab]);

  const stats = {
    aPagar: data.filter(c => c.estado === 'A Pagar').reduce((a, b) => a + b.monto, 0),
    aCobrar: data.filter(c => c.estado === 'A Cobrar').reduce((a, b) => a + b.monto, 0),
    cobrados: data.filter(c => c.estado === 'Cobrado').reduce((a, b) => a + b.monto, 0),
    rechazados: data.filter(c => c.estado === 'Rechazado').reduce((a, b) => a + b.monto, 0),
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 border border-emerald-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
           <Landmark size={150} />
         </div>
         <div className="relative z-10 text-white">
            <h3 className="font-bold text-2xl mb-1 flex items-center gap-2"><Landmark size={24} /> Finanzas y Tesorería</h3>
            <p className="text-emerald-100/80 text-sm max-w-2xl">
              Control central de Cartera de Cheques y eCheqs. Visualiza tus cuentas corrientes, gestiona pagos diferidos a corralones sanjuaninos e intercepta cobros rebotados al instante.
            </p>
         </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border-l-4 border-l-orange-500 border-y border-r border-y-gray-200 border-r-gray-200 shadow-sm p-4 rounded-xl">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">A Pagar (Deuda)</p>
               <h4 className="text-2xl font-black text-gray-900 mt-2 font-mono">{formatARS(stats.aPagar)}</h4>
             </div>
             <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><HandCoins size={20}/></div>
           </div>
           <p className="text-xs text-gray-400 mt-3 font-medium">Cheques emitidos a proveedores</p>
        </div>

        <div className="bg-white border-l-4 border-l-blue-500 border-y border-r border-y-gray-200 border-r-gray-200 shadow-sm p-4 rounded-xl">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">A Cobrar (Cartera)</p>
               <h4 className="text-2xl font-black text-gray-900 mt-2 font-mono">{formatARS(stats.aCobrar)}</h4>
             </div>
             <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><RefreshCcw size={20}/></div>
           </div>
           <p className="text-xs text-gray-400 mt-3 font-medium">Facturación diferida clientes</p>
        </div>

        <div className="bg-white border-l-4 border-l-green-500 border-y border-r border-y-gray-200 border-r-gray-200 shadow-sm p-4 rounded-xl">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cobrados Histórico</p>
               <h4 className="text-2xl font-black text-gray-900 mt-2 font-mono">{formatARS(stats.cobrados)}</h4>
             </div>
             <div className="bg-green-50 p-2 rounded-lg text-green-600"><CheckCircle size={20}/></div>
           </div>
           <p className="text-xs text-gray-400 mt-3 font-medium">Impactados en Cta. Corriente</p>
        </div>

        <div className="bg-white border-l-4 border-l-red-500 border-y border-r border-y-gray-200 border-r-gray-200 shadow-sm p-4 rounded-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="flex justify-between items-start relative z-10">
             <div>
               <p className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                 <AlertTriangle size={14}/> Rechazados
               </p>
               <h4 className="text-2xl font-black text-red-600 mt-2 font-mono">{formatARS(stats.rechazados)}</h4>
             </div>
           </div>
           <p className="text-xs text-red-400/80 mt-3 font-bold relative z-10">Requiere acción financiera</p>
        </div>

      </div>

      {/* Cheques Grid System */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          {tabs.map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === t ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <table className="w-full text-left text-sm text-gray-700">
             <thead className="bg-gray-100/50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
               <tr>
                 <th className="px-5 py-4">ID Cheque / Tipo</th>
                 <th className="px-4 py-4">Banco y Cuenta</th>
                 <th className="px-4 py-4">Beneficiario / Emisor</th>
                 <th className="px-4 py-4">Vencimiento</th>
                 <th className="px-4 py-4 text-right">Monto ARS</th>
                 <th className="px-5 py-4 text-center">Estado</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filteredData.map((row) => (
                 <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                   
                   <td className="px-5 py-4">
                     <div className="flex items-center gap-2">
                       <span className="font-mono font-bold text-gray-900">{row.id}</span>
                       {row.echeq ? (
                         <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">eCHEQ</span>
                       ) : (
                         <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded">FÍSICO</span>
                       )}
                     </div>
                   </td>
                   
                   <td className="px-4 py-4">
                      <p className="font-bold text-gray-800">{row.banco}</p>
                      <p className="font-mono text-xs text-gray-500 mt-1">Cta: {row.cuenta}</p>
                   </td>

                   <td className="px-4 py-4 font-medium text-gray-700 max-w-[200px] truncate" title={row.proveedor}>
                      {row.proveedor}
                   </td>

                   <td className="px-4 py-4 text-gray-600 font-mono text-sm">
                      {row.fechaVto}
                   </td>

                   <td className="px-4 py-4 font-mono font-bold text-right text-base text-gray-900">
                      {row.monto.toLocaleString()}
                   </td>

                   <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border w-28 text-center shadow-sm ${
                          row.estado === 'A Pagar' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          row.estado === 'A Cobrar' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          row.estado === 'Cobrado' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {row.estado}
                        </span>
                        {row.estado === 'Rechazado' && row.motivo && (
                          <span className="text-[10px] text-red-500 font-bold max-w-[150px] leading-tight mt-1">{row.motivo}</span>
                        )}
                      </div>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>

      </div>

    </div>
  );
};
