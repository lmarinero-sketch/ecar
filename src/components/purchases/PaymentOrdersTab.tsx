import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Search, CreditCard, Landmark, DollarSign, Activity, Plus, X } from 'lucide-react';
import { useSupplierPayments, useSuppliers } from '../../hooks/useData';
import { formatARS } from '../../lib/types';
import type { SupplierPayment, Supplier } from '../../lib/types';
import { SupplierPaymentModal } from './SupplierPaymentModal';

export const PaymentOrdersTab: React.FC = () => {
  const { data: payments = [], isLoading } = useSupplierPayments();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSelectingSupplier, setIsSelectingSupplier] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);

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

  const metrics = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => {
      acc.total += curr.amount_ars;
      if (curr.payment_method.includes('cheque')) {
        acc.cheques += curr.amount_ars;
      } else if (curr.payment_method === 'transfer') {
        acc.transfers += curr.amount_ars;
      } else if (curr.payment_method === 'cash') {
        acc.cash += curr.amount_ars;
      }
      return acc;
    }, { total: 0, cheques: 0, transfers: 0, cash: 0 });
  }, [filteredPayments]);

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
      
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Total Pagado</h4>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatARS(metrics.total)}</p>
          <p className="text-xs text-slate-400 mt-1">En el período filtrado</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">En Cheques</h4>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CreditCard size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatARS(metrics.cheques)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Transferencias</h4>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Landmark size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatARS(metrics.transfers)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Efectivo</h4>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatARS(metrics.cash)}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-bold text-slate-800 text-lg">Historial y Trazabilidad de Pagos</h3>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por proveedor, cheque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-ecar-blue focus:ring-2 focus:ring-ecar-blue/20"
            />
          </div>
          <button
            onClick={() => setIsSelectingSupplier(true)}
            className="flex items-center gap-2 bg-ecar-blue text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-ecar-blue/20 hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            Nueva Orden
          </button>
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
                <th className="px-4 py-3 font-semibold">Nº Recibo / Doc</th>
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
                      <div className="text-[10px] text-slate-400">Generado: {new Date(payment.created_at).toLocaleDateString('es-AR')}</div>
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

      {/* Select Supplier Modal */}
      {isSelectingSupplier && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Seleccionar Proveedor</h3>
              <button
                onClick={() => setIsSelectingSupplier(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {isLoadingSuppliers ? (
                <div className="text-center text-slate-500 py-4">Cargando proveedores...</div>
              ) : (
                <div className="space-y-2">
                  {suppliers.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSupplierForPayment(s);
                        setIsSelectingSupplier(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-ecar-blue hover:bg-blue-50/50 transition-all group text-left"
                    >
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-ecar-blue transition-colors">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">CUIT: {s.cuit || 'S/D'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Payment Order Modal */}
      {selectedSupplierForPayment && (
        <SupplierPaymentModal
          supplier={selectedSupplierForPayment}
          onClose={() => setSelectedSupplierForPayment(null)}
          onSuccess={() => setSelectedSupplierForPayment(null)}
        />
      )}
    </div>
  );
};
