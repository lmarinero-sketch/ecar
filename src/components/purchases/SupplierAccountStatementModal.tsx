import React, { useMemo } from 'react';
import { X, Building2, CreditCard, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePurchaseInvoices, useSupplierPayments, useCheques } from '../../hooks/useData';
import { formatARS } from '../../lib/types';
import type { Supplier, PurchaseInvoice } from '../../lib/types';

interface Props {
  supplier: Supplier;
  onClose: () => void;
  onOpenPaymentModal: () => void;
}

type LedgerEntry = {
  id: string;
  date: string;
  type: 'invoice_compra' | 'invoice_nc' | 'invoice_nd' | 'payment_cheque' | 'payment_transfer' | 'payment_cash';
  documentNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  referenceId?: string;
  statusBadge?: string;
};

export const SupplierAccountStatementModal: React.FC<Props> = ({
  supplier,
  onClose,
  onOpenPaymentModal
}) => {
  const { data: allInvoices = [] } = usePurchaseInvoices();
  const { data: allPayments = [] } = useSupplierPayments(supplier.id);
  const { data: allCheques = [] } = useCheques();

  // Filter supplier invoices
  const supplierInvoices = useMemo(() => {
    return allInvoices.filter((i: PurchaseInvoice) => i.supplier_id === supplier.id);
  }, [allInvoices, supplier.id]);

  // Build full chronological ledger
  const ledger = useMemo(() => {
    const entries: LedgerEntry[] = [];

    // 1. Process Invoices (Compras, NC, ND)
    for (const inv of supplierInvoices) {
      const docNum = `${inv.invoice_type || 'FAC'} ${inv.point_of_sale || '0001'}-${inv.invoice_number || '00000000'}`;
      const invDate = inv.issue_date || new Date().toISOString().split('T')[0];

      if (inv.invoice_type === 'NC') {
        entries.push({
          id: `inv-${inv.id}`,
          date: invDate,
          type: 'invoice_nc',
          documentNumber: docNum,
          description: `Nota de Crédito (${inv.status === 'validated' ? 'Validada' : 'Pendiente'})`,
          debit: 0,
          credit: inv.total_ars,
          balance: 0,
          referenceId: inv.id,
          statusBadge: 'NC'
        });
      } else if (inv.invoice_type === 'ND') {
        entries.push({
          id: `inv-${inv.id}`,
          date: invDate,
          type: 'invoice_nd',
          documentNumber: docNum,
          description: 'Nota de Débito',
          debit: inv.total_ars,
          credit: 0,
          balance: 0,
          referenceId: inv.id,
          statusBadge: 'ND'
        });
      } else {
        entries.push({
          id: `inv-${inv.id}`,
          date: invDate,
          type: 'invoice_compra',
          documentNumber: docNum,
          description: `Factura de Compra (${inv.payment_status === 'paid' ? 'Pagada' : 'Pendiente'})`,
          debit: inv.total_ars,
          credit: 0,
          balance: 0,
          referenceId: inv.id,
          statusBadge: inv.payment_status === 'paid' ? 'Pagada' : 'Impaga'
        });
      }
    }

    // 2. Process Supplier Payments
    for (const pay of allPayments) {
      let desc = 'Pago a Proveedor';
      let docNum = pay.receipt_number || 'OP-S/N';
      let badge = 'Pago';

      if (pay.payment_method === 'cheque_issued') {
        const ch = pay.cheque || allCheques.find(c => c.id === pay.cheque_id);
        desc = `Pago con Cheque Emitido #${ch?.cheque_number || ''} (${ch?.bank_name || 'Banco'} - Vto: ${ch?.due_date || 'S/F'})`;
        docNum = `CH #${ch?.cheque_number || 'S/N'}`;
        badge = ch?.type === 'echeq' ? 'eCheq' : 'Cheque';
      } else if (pay.payment_method === 'cheque_third_party') {
        const ch = pay.cheque || allCheques.find(c => c.id === pay.cheque_id);
        desc = `Endoso de Cheque de Terceros #${ch?.cheque_number || ''} (${ch?.bank_name || 'Banco'})`;
        docNum = `END #${ch?.cheque_number || 'S/N'}`;
        badge = 'Endoso';
      } else if (pay.payment_method === 'transfer') {
        desc = `Transferencia Bancaria (Comp: ${pay.receipt_number || 'S/N'})`;
        docNum = pay.receipt_number ? `TR #${pay.receipt_number}` : 'Transferencia';
        badge = 'Transf.';
      } else if (pay.payment_method === 'cash') {
        desc = 'Pago en Efectivo / Caja Chica';
        badge = 'Efectivo';
      }

      entries.push({
        id: `pay-${pay.id}`,
        date: pay.payment_date,
        type: pay.payment_method === 'cheque_issued' ? 'payment_cheque' : pay.payment_method === 'transfer' ? 'payment_transfer' : 'payment_cash',
        documentNumber: docNum,
        description: desc,
        debit: 0,
        credit: pay.amount_ars,
        balance: 0,
        referenceId: pay.id,
        statusBadge: badge
      });
    }

    // 3. Sort chronologically by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 4. Calculate running balance
    let runningBalance = 0;
    for (const entry of entries) {
      runningBalance += (entry.debit - entry.credit);
      entry.balance = runningBalance;
    }

    return entries;
  }, [supplierInvoices, allPayments, allCheques]);

  // Summary Metrics
  const totalDebits = ledger.reduce((a, b) => a + b.debit, 0);
  const totalCredits = ledger.reduce((a, b) => a + b.credit, 0);
  const currentBalance = totalDebits - totalCredits;
  const creditLimit = supplier.credit_limit_ars || 0;
  const availableCredit = creditLimit > 0 ? Math.max(0, creditLimit - currentBalance) : 0;

  // Export to Excel
  const handleExportExcel = () => {
    const data = ledger.map(item => ({
      'Fecha': item.date,
      'Tipo / Nro Comprobante': item.documentNumber,
      'Descripción / Concepto': item.description,
      'Débito ($ ARS)': item.debit,
      'Crédito ($ ARS)': item.credit,
      'Saldo Acumulado ($ ARS)': item.balance
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cuenta Corriente');
    XLSX.writeFile(wb, `CtaCte_${supplier.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blue text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                Estado de Cuenta Corriente: {supplier.name}
              </h2>
              <p className="text-xs text-white/70">
                CUIT: {supplier.cuit || 'Sin CUIT'} • Condición: {supplier.default_payment_condition || 'Contado'} • {supplier.category || 'Proveedor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top KPIs Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Compras Facturadas
            </span>
            <span className="text-base font-mono font-black text-slate-800 mt-1 block">
              {formatARS(totalDebits)}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pagos & Créditos
            </span>
            <span className="text-base font-mono font-black text-emerald-600 mt-1 block">
              {formatARS(totalCredits)}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Saldo Pendiente (Deuda)
            </span>
            <span className={`text-base font-mono font-black mt-1 block ${currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatARS(currentBalance)}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Límite / Crédito Disp.
            </span>
            <span className="text-base font-mono font-black text-ecar-blue mt-1 block">
              {creditLimit > 0 ? `${formatARS(availableCredit)}` : 'Sin límite'}
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-700">
            Libro Mayor de Movimientos ({ledger.length} registros)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" /> Exportar Excel
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPaymentModal();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <CreditCard size={14} /> Pagar con Cheque / Transf.
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {ledger.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <FileText size={40} className="mx-auto mb-2 opacity-30" />
              No hay facturas ni pagos registrados para este proveedor.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Comprobante</th>
                    <th className="py-2.5 px-3">Concepto / Detalle</th>
                    <th className="py-2.5 px-3 text-right">Débito (+)</th>
                    <th className="py-2.5 px-3 text-right">Crédito (-)</th>
                    <th className="py-2.5 px-3 text-right">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800">
                          {entry.documentNumber}
                        </span>
                        {entry.statusBadge && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/70 text-slate-700">
                            {entry.statusBadge}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {entry.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {entry.debit > 0 ? formatARS(entry.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {entry.credit > 0 ? formatARS(entry.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={entry.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatARS(entry.balance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <div>
            Saldo Actual: <strong className={`font-mono text-sm ${currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatARS(currentBalance)}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
