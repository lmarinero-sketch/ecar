import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CreditCard, Landmark, DollarSign, FileText,
  ShieldCheck, CheckCheck
} from 'lucide-react';
import {
  useCreateSupplierPayment, usePurchaseInvoices, useCheques,
  useBankAccounts
} from '../../hooks/useData';
import { useModalStore } from '../../store/useModalStore';
import { formatARS } from '../../lib/types';
import type { Supplier, PurchaseInvoice } from '../../lib/types';

interface Props {
  supplier: Supplier;
  preselectedInvoiceId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupplierPaymentModal: React.FC<Props> = ({
  supplier,
  preselectedInvoiceId,
  onClose,
  onSuccess
}) => {
  const { data: allInvoices = [] } = usePurchaseInvoices();
  const { data: allCheques = [] } = useCheques();
  const { data: bankAccounts = [] } = useBankAccounts();
  const createPaymentMutation = useCreateSupplierPayment();

  // Filter pending unpaid invoices for this supplier
  const supplierPendingInvoices = allInvoices.filter(
    (inv: PurchaseInvoice) => inv.supplier_id === supplier.id && inv.payment_status !== 'paid'
  );

  // Available receivable cheques in portfolio (to endorse)
  const portfolioCheques = allCheques.filter(
    c => c.direction === 'receivable' && c.status === 'pending'
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoiceId || '');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cheque_issued' | 'cheque_third_party' | 'transfer' | 'cash'>('cheque_issued');
  const [amount, setAmount] = useState<string>(() => {
    if (preselectedInvoiceId) {
      const inv = supplierPendingInvoices.find(i => i.id === preselectedInvoiceId);
      if (inv) return String(inv.total_ars);
    }
    return '';
  });

  // If cheque_issued
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeBank, setChequeBank] = useState('Banco Santander');
  const [chequeType, setChequeType] = useState<'physical' | 'echeq'>('echeq');
  const [chequeDueDate, setChequeDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (supplier.credit_days || 30));
    return d.toISOString().split('T')[0];
  });
  const [chequeIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuerCompany, setIssuerCompany] = useState('ECAR SAS');

  // If cheque_third_party
  const [thirdPartyChequeId, setThirdPartyChequeId] = useState('');

  // If transfer / cash
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  // When invoice selection changes, autofill amount
  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    if (id) {
      const inv = supplierPendingInvoices.find(i => i.id === id);
      if (inv) {
        setAmount(String(inv.total_ars));
      }
    }
  };

  const handleSelectPortfolioCheque = (chId: string) => {
    setThirdPartyChequeId(chId);
    const ch = portfolioCheques.find(c => c.id === chId);
    if (ch) {
      setAmount(String(ch.amount_ars));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      useModalStore.getState().showAlert('Atención', 'Debe ingresar un monto válido a pagar.');
      return;
    }

    if (paymentMethod === 'cheque_issued') {
      if (!chequeNumber.trim()) {
        useModalStore.getState().showAlert('Atención', 'Debe ingresar el número del cheque emitido.');
        return;
      }
      if (!chequeBank.trim()) {
        useModalStore.getState().showAlert('Atención', 'Debe indicar el banco emisor del cheque.');
        return;
      }
      if (!chequeDueDate) {
        useModalStore.getState().showAlert('Atención', 'Debe ingresar la fecha de vencimiento / cobro del cheque.');
        return;
      }
    }

    if (paymentMethod === 'cheque_third_party' && !thirdPartyChequeId) {
      useModalStore.getState().showAlert('Atención', 'Debe seleccionar el cheque de terceros a endosar.');
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        supplier_id: supplier.id,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        amount_ars: numAmount,
        purchase_invoice_id: selectedInvoiceId || null,
        bank_account_id: selectedBankAccountId || null,
        receipt_number: receiptNumber.trim() || null,
        notes: notes.trim() || null,
        cheque_number: chequeNumber.trim(),
        bank_name: chequeBank.trim(),
        due_date: chequeDueDate,
        issue_date: chequeIssueDate,
        issuer_company: issuerCompany,
        cheque_type: chequeType,
        third_party_cheque_id: thirdPartyChequeId || undefined,
      });

      useModalStore.getState().showAlert(
        'Pago Registrado',
        paymentMethod === 'cheque_issued'
          ? `Pago de ${formatARS(numAmount)} registrado con éxito. El cheque #${chequeNumber} fue emitido y cargado automáticamente en la Cartera de Cheques de Finanzas.`
          : `Pago de ${formatARS(numAmount)} registrado con éxito.`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'Error al procesar el pago.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blue text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <CreditCard size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Registrar Pago a Proveedor
              </h2>
              <p className="text-xs text-white/70">
                {supplier.name} • CUIT: {supplier.cuit || 'Sin CUIT'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Supplier Info Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500">Condición Fiscal:</span> <span className="font-bold text-slate-800">{supplier.tax_condition}</span>
            </div>
            {supplier.has_checking_account && (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-blue-100 text-ecar-blue rounded-md font-bold text-[10px]">
                  Cta Cte {supplier.credit_days || 30} días
                </span>
                {supplier.credit_limit_ars ? (
                  <span className="text-slate-500 text-[10px]">
                    Límite: <strong className="font-mono">{formatARS(supplier.credit_limit_ars)}</strong>
                  </span>
                ) : null}
              </div>
            )}
            {supplier.bank_cbu && (
              <div className="w-full pt-1 border-t border-slate-200/60 text-[11px] text-slate-600 font-mono">
                CBU: <strong>{supplier.bank_cbu}</strong> {supplier.bank_alias ? `(Alias: ${supplier.bank_alias})` : ''}
              </div>
            )}
          </div>

          {/* Imputación / Factura a Pagar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Imputar a Comprobante de Compra</span>
              <span className="text-[11px] font-normal text-slate-500">
                {supplierPendingInvoices.length} facturas pendientes de pago
              </span>
            </label>
            <select
              value={selectedInvoiceId}
              onChange={e => handleSelectInvoice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
            >
              <option value="">-- Pago a Cuenta Corriente General (Sin comprobante específico) --</option>
              {supplierPendingInvoices.map((inv: any) => (
                <option key={inv.id} value={inv.id}>
                  Factura {inv.invoice_type || 'A'} {inv.point_of_sale || '0001'}-{inv.invoice_number || '00000000'} | Fecha: {inv.issue_date} | Total: {formatARS(inv.total_ars)}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Método de Pago */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Seleccionar Método de Pago:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cheque_issued')}
                className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cheque_issued'
                    ? 'bg-blue-50 border-ecar-blue text-ecar-blue shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'cheque_issued' ? 'bg-ecar-blue text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <CreditCard size={18} />
                </div>
                <span>Cheque Propio</span>
                <span className="text-[9px] text-slate-400 font-normal">eCheq / Físico</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'transfer'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'transfer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Landmark size={18} />
                </div>
                <span>Transferencia</span>
                <span className="text-[9px] text-slate-400 font-normal">Bancaria / CBU</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cheque_third_party')}
                className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cheque_third_party'
                    ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'cheque_third_party' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <FileText size={18} />
                </div>
                <span>Endoso Cheque</span>
                <span className="text-[9px] text-slate-400 font-normal">De Cartera ({portfolioCheques.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-50 border-amber-600 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'cash' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <DollarSign size={18} />
                </div>
                <span>Efectivo</span>
                <span className="text-[9px] text-slate-400 font-normal">Caja Chica</span>
              </button>
            </div>
          </div>

          {/* Fields if Cheque Propio */}
          {paymentMethod === 'cheque_issued' && (
            <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <span className="text-xs font-bold text-ecar-blue flex items-center gap-1.5">
                  <CreditCard size={14} /> Datos del Cheque Emitido
                </span>
                <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-blue-200">
                  <button
                    type="button"
                    onClick={() => setChequeType('echeq')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      chequeType === 'echeq' ? 'bg-ecar-blue text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚡ eCheq
                  </button>
                  <button
                    type="button"
                    onClick={() => setChequeType('physical')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      chequeType === 'physical' ? 'bg-ecar-blue text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📄 Físico
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número de Cheque *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 00084920"
                    value={chequeNumber}
                    onChange={e => setChequeNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Banco Emisor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Banco Santander"
                    value={chequeBank}
                    onChange={e => setChequeBank(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Razón Social Emisora
                  </label>
                  <select
                    value={issuerCompany}
                    onChange={e => setIssuerCompany(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-medium"
                  >
                    <option value="ECAR SAS">ECAR SAS</option>
                    <option value="CARLOS ADOLFO REGALADO">CARLOS ADOLFO REGALADO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fecha de Vencimiento / Pago *
                  </label>
                  <input
                    type="date"
                    required
                    value={chequeDueDate}
                    onChange={e => setChequeDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-100/70 border border-blue-200 rounded-xl flex items-center gap-2 text-[11px] text-blue-900 font-medium">
                <ShieldCheck size={16} className="text-ecar-blue shrink-0" />
                <span>
                  Este cheque se integrará automáticamente a la <strong>Cartera de Cheques de Finanzas</strong> con alertas de vencimiento.
                </span>
              </div>
            </div>
          )}

          {/* Fields if Endoso Cheque de Terceros */}
          {paymentMethod === 'cheque_third_party' && (
            <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl space-y-3 animate-fade-in">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <FileText size={14} /> Seleccionar Cheque de Terceros en Cartera
              </span>

              {portfolioCheques.length === 0 ? (
                <div className="p-3 bg-white border border-purple-200 rounded-xl text-xs text-purple-700">
                  No hay cheques recibidos disponibles en cartera actualmente.
                </div>
              ) : (
                <select
                  value={thirdPartyChequeId}
                  onChange={e => handleSelectPortfolioCheque(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">-- Seleccionar Cheque a Endosar --</option>
                  {portfolioCheques.map(c => (
                    <option key={c.id} value={c.id}>
                      Cheque #{c.cheque_number} • {c.bank_name} • Librador: {c.beneficiary_or_issuer} • Vence: {c.due_date} • Monto: {formatARS(c.amount_ars)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Common Payment Fields: Fecha y Monto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha del Pago *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monto del Pago ($ ARS) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {paymentMethod === 'transfer' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cuenta Bancaria Origen
                  </label>
                  <select
                    value={selectedBankAccountId}
                    onChange={e => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="">-- Cuenta Bancaria ECAR --</option>
                    {bankAccounts.map(ba => (
                      <option key={ba.id} value={ba.id}>
                        {ba.bank_name} ({ba.account_number}) - Saldo: {formatARS(ba.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nro. de Transferencia / Comprobante
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={e => setReceiptNumber(e.target.value)}
                    placeholder="Ej. TR-99847182"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notas / Concepto del Pago
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej. Cancelación de factura de materiales para obra..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={createPaymentMutation.isPending}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCheck size={16} />
            {createPaymentMutation.isPending ? 'Procesando...' : 'Confirmar y Registrar Pago'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
