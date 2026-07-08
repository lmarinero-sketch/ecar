import React, { useState, useEffect } from 'react';
import { X, Users, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useModalStore } from '../store/useModalStore';

export const PayrollViewerModal: React.FC<{
  paymentItemId: string;
  concepto: string;
  onClose: () => void;
}> = ({ paymentItemId, concepto, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('weekly_payroll_details')
          .select('*, employee:employees(full_name, bank_alias_cbu)')
          .eq('weekly_payment_item_id', paymentItemId);

        if (error) throw error;
        setDetails(data || []);
      } catch (e) {
        console.error(e);
        useModalStore.getState().showAlert('Error', 'No se pudieron cargar los detalles de la liquidación.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [paymentItemId]);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const total = details.reduce((acc, row) => acc + Number(row.final_amount), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-4 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Detalle de {concepto}
            </h4>
            <p className="text-sm text-gray-500 mt-1">Listado de obreros y sus alias para transferencias</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto border rounded-lg bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs font-bold">Obrero</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs font-bold">Alias / CBU</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs font-bold text-center">Horas</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs font-bold text-right">Monto a Transferir</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs font-bold text-center w-24">Copiar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {details.map((row) => {
                  const alias = row.employee?.bank_alias_cbu || '';
                  return (
                    <tr key={row.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-800">
                        {row.employee?.full_name || 'Desconocido'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {alias ? (
                          <span className="bg-gray-100 px-2 py-1 rounded border">{alias}</span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">Sin CBU / Efectivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {row.worked_hours} hs
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                        {formatARS(Number(row.final_amount))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {alias && (
                          <button
                            onClick={() => copyToClipboard(alias, row.id)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                            title="Copiar Alias"
                          >
                            {copiedId === row.id ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold sticky bottom-0 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right uppercase text-slate-700">
                    Total a Transferir
                  </td>
                  <td className="px-4 py-3 text-right text-lg text-indigo-700 font-mono">
                    {formatARS(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
