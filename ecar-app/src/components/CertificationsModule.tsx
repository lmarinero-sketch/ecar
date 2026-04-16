import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { mockData } from '../store/mockData';
import { FileSignature, Calculator, ArrowUpRight } from 'lucide-react';

export const CertificationsModule: React.FC = () => {
  const { projects, certifications, generateCertification } = useStore();
  const [selectedProj, setSelectedProj] = useState('');

  const formatARS = (val: number) => `A$ ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleGenerate = () => {
    if (!selectedProj) return;
    generateCertification(selectedProj);
    setSelectedProj('');
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 flex gap-4">
         <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center text-purple-600 shrink-0 shadow-sm">
            <FileSignature size={20} />
         </div>
         <div>
            <h3 className="font-bold text-purple-900">Certificaciones de Obra y Redeterminaciones</h3>
            <p className="text-sm text-purple-800/80 mt-1">
              La oficina técnica compila el % de avance físico de la WBS. Este módulo cruza ese avance físico con el Contrato Base y le inyecta automáticamente la Redeterminación de Precios usando el Índice Costo Construcción (ICC).
            </p>
         </div>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="light-card p-5 flex-1">
           <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calculator size={18} /> Índices Actuales (INDEC/CAC)</h4>
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
               <p className="text-xs text-gray-400">Variación CAC (Base {mockData.indices.baseMonth})</p>
               <p className="font-bold text-lg text-ecar-blue">{mockData.indices.cacVariation}%</p>
             </div>
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
               <p className="text-xs text-gray-400">Mes Actual Aplicable</p>
               <p className="font-bold text-lg text-gray-900">{mockData.indices.currentMonth}</p>
             </div>
           </div>
        </div>

        <div className="light-card p-5 flex-1 flex flex-col justify-center">
           <p className="text-sm font-bold text-gray-700 mb-3">Generar Nuevo Certificado Mensual</p>
           <div className="flex gap-2">
              <select className="flex-1 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm outline-none focus:border-ecar-blue" value={selectedProj} onChange={e => setSelectedProj(e.target.value)}>
                <option value="">Seleccione Proyecto...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleGenerate} className="btn-primary" disabled={!selectedProj}>Escanear WBS</button>
           </div>
        </div>
      </div>

      {/* Certifications Table */}
      <div className="light-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Cert.</th>
              <th>Proyecto / Cliente</th>
              <th>Periodo</th>
              <th className="text-right">Monto Base Contrato</th>
              <th className="text-right">Ajuste CAC</th>
              <th className="text-right bg-blue-50/50">Total Facturable</th>
              <th className="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {certifications.map(cert => {
              const proj = projects.find(p => p.id === cert.projectId);
              return (
                <tr key={cert.id}>
                  <td className="font-mono text-gray-500 text-xs">{cert.id.split('-').pop()}</td>
                  <td>
                    <p className="font-bold text-gray-900">{proj?.name}</p>
                    <p className="text-xs text-gray-400">{proj?.client}</p>
                  </td>
                  <td className="font-medium text-gray-700">{cert.period}</td>
                  <td className="text-right font-mono text-gray-600">{formatARS(cert.totalRevenueBaseARS)}</td>
                  <td className="text-right font-mono text-ecar-red flex items-center justify-end gap-1"><ArrowUpRight size={14}/> {formatARS(cert.redeterminationARS)}</td>
                  <td className="text-right font-mono font-bold text-ecar-blue bg-blue-50/50">{formatARS(cert.totalInvoicedARS)}</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cert.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {cert.status === 'Approved' ? 'Aprobado A/F' : 'Borrador'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
