import React, { useState, useMemo } from 'react';
import { FileText, Search, CreditCard, Landmark, DollarSign } from 'lucide-react';
import { useSupplierPayments } from '../../hooks/useData';
import { formatARS } from '../../lib/types';
import type { SupplierPayment } from '../../lib/types';

export const PaymentOrdersTab: React.FC = () => {
  const { data: payments = [], isLoading } = useSupplierPayments();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = useMemo(() => {
    let list = [...payments];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.supplier?.name.toLowerCase().includes(q) ||
        p.cheque?.cheque_number.includes(q) ||
        p.receipt_number?.toLowerCase().includes(q) ||
        p.purchase_invoice?.invoice_number?.includes(q) ||
        p.notes?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments, searchTerm]);

  const renderPaymentMethod = (p: SupplierPayment) => {
    switch (p.payment_method) {
      case 'cheque_issued': return <span className="flex items-center gap-1 text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-xs font-bold"><Landmark size={12} /> Cheque Propio {p.cheque?.cheque_number ? `#${p.cheque.cheque_number}` : ''}</span>;
      case 'cheque_third_party': return <span className="flex items-center gap-1 text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-xs font-bold"><CreditCard size={12} /> Cheque Terceros {p.cheque?.cheque_number ? `#${p.cheque.cheque_number}` : ''}</span>;
      case 'transfer': return <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs font-bold"><Landmark size={12} /> Transferencia</span>;
      case 'cash': return <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs font-bold"><DollarSign size={12} /> Efectivo</span>;
      default: return <span className="text-gray-500">{p.payment_method}</span>;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando Órdenes de Pago...</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-bold text-slate-800 text-lg">Órdenes de Pago a Proveedores</h3>
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor, cheque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blue/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Método de Pago</th>
                <th className="px-4 py-3 font-semibold">Factura Asoc.</th>
                <th className="px-4 py-3 font-semibold">Nº Recibo</th>
                <th className="px-4 py-3 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron órdenes de pago.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(payment.payment_date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-700">{payment.supplier?.name || 'Proveedor Eliminado'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {renderPaymentMethod(payment)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {payment.purchase_invoice ? (
                        <div className="flex items-center gap-1">
                          <FileText size={14} className="text-slate-400" />
                          {payment.purchase_invoice.invoice_number || 'S/N'}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">S/D</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {payment.receipt_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {formatARS(payment.amount_ars)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
