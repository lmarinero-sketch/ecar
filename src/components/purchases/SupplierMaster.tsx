import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, Search, CreditCard, Landmark, FileSpreadsheet,
  Trash2, Edit3, FileText,
  TrendingDown, CheckCircle2,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  useSuppliers, useDeleteSupplier, usePurchaseInvoices, useSupplierPayments,
  useCheques
} from '../../hooks/useData';
import { useModalStore } from '../../store/useModalStore';
import { formatARS } from '../../lib/types';
import type { Supplier, PurchaseInvoice, SupplierPayment, Cheque } from '../../lib/types';
import { SupplierModal } from './SupplierModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { SupplierAccountStatementModal } from './SupplierAccountStatementModal';

export const SupplierMaster: React.FC = () => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: purchaseInvoices = [] } = usePurchaseInvoices();
  const { data: supplierPayments = [] } = useSupplierPayments();
  const { data: cheques = [] } = useCheques();
  const deleteSupplierMutation = useDeleteSupplier();

  // Modals state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<Supplier | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAccountType, setSelectedAccountType] = useState<'ALL' | 'WITH_CC' | 'CASH_ONLY'>('ALL');
  const [selectedDebtStatus, setSelectedDebtStatus] = useState<'ALL' | 'WITH_DEBT' | 'UP_TO_DATE'>('ALL');

  // Compute live balances for each supplier: Sum(Invoices + ND - NC) - Sum(Payments)
  const supplierBalances = useMemo(() => {
    const balances = new Map<string, { debt: number; pendingInvoicesCount: number; issuedChequesPendingArs: number }>();

    for (const sup of suppliers) {
      // Invoices
      const supInvs = purchaseInvoices.filter((i: PurchaseInvoice) => i.supplier_id === sup.id);
      let debits = 0;
      let credits = 0;
      let pendingCount = 0;

      for (const inv of supInvs) {
        if (inv.invoice_type === 'NC') {
          credits += (inv.total_ars || 0);
        } else {
          debits += (inv.total_ars || 0);
          if (inv.payment_status !== 'paid') {
            pendingCount++;
          }
        }
      }

      // Payments
      const supPays = supplierPayments.filter((p: SupplierPayment) => p.supplier_id === sup.id);
      for (const pay of supPays) {
        credits += (pay.amount_ars || 0);
      }

      // Cheques pending payable to this supplier
      const supCheques = cheques.filter(
        (c: Cheque) => c.direction === 'payable' && c.status === 'pending' &&
        ((c.beneficiary_or_issuer || '').toLowerCase().includes(sup.name.toLowerCase()) ||
         (sup.commercial_name && (c.beneficiary_or_issuer || '').toLowerCase().includes(sup.commercial_name.toLowerCase())))
      );
      const issuedChequesPendingArs = supCheques.reduce((a, b) => a + (b.amount_ars || 0), 0);

      balances.set(sup.id, {
        debt: Math.max(0, debits - credits),
        pendingInvoicesCount: pendingCount,
        issuedChequesPendingArs
      });
    }

    return balances;
  }, [suppliers, purchaseInvoices, supplierPayments, cheques]);

  // Overall KPIs
  const totalSuppliers = suppliers.length;
  const suppliersWithCC = suppliers.filter(s => s.has_checking_account).length;
  const totalAccumulatedDebt = useMemo(() => {
    let sum = 0;
    for (const b of supplierBalances.values()) {
      sum += b.debt;
    }
    return sum;
  }, [supplierBalances]);

  const totalChequesPendingToSuppliers = useMemo(() => {
    return cheques
      .filter(c => c.direction === 'payable' && c.status === 'pending')
      .reduce((a, b) => a + (b.amount_ars || 0), 0);
  }, [cheques]);

  // Categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const s of suppliers) {
      if (s.category) set.add(s.category);
    }
    return Array.from(set).sort();
  }, [suppliers]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(sup => {
      const balance = supplierBalances.get(sup.id) || { debt: 0, pendingInvoicesCount: 0, issuedChequesPendingArs: 0 };

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = sup.name.toLowerCase().includes(q);
        const matchesCommercial = (sup.commercial_name || '').toLowerCase().includes(q);
        const matchesCuit = (sup.cuit || '').replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        const matchesCategory = (sup.category || '').toLowerCase().includes(q);
        const matchesContact = (sup.contact_person || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCommercial && !matchesCuit && !matchesCategory && !matchesContact) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'ALL' && sup.category !== selectedCategory) {
        return false;
      }

      // Account type
      if (selectedAccountType === 'WITH_CC' && !sup.has_checking_account) return false;
      if (selectedAccountType === 'CASH_ONLY' && sup.has_checking_account) return false;

      // Debt status
      if (selectedDebtStatus === 'WITH_DEBT' && balance.debt <= 0) return false;
      if (selectedDebtStatus === 'UP_TO_DATE' && balance.debt > 0) return false;

      return true;
    });
  }, [suppliers, searchQuery, selectedCategory, selectedAccountType, selectedDebtStatus, supplierBalances]);

  // Delete Supplier with confirmation
  const handleDeleteSupplier = async (sup: Supplier) => {
    const confirm = await useModalStore.getState().showConfirm(
      'Confirmar Eliminación',
      `¿Desea eliminar definitivamente al proveedor "${sup.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirm) return;

    try {
      await deleteSupplierMutation.mutateAsync(sup.id);
      useModalStore.getState().showAlert('Éxito', 'Proveedor eliminado correctamente.');
    } catch (err: any) {
      useModalStore.getState().showAlert(
        'Error',
        'No se puede eliminar el proveedor porque tiene facturas, pagos o comprobantes asociados.'
      );
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredSuppliers.map(s => {
      const b = supplierBalances.get(s.id) || { debt: 0, pendingInvoicesCount: 0, issuedChequesPendingArs: 0 };
      return {
        'Razón Social': s.name,
        'Nombre Comercial': s.commercial_name || '',
        'CUIT': s.cuit || '',
        'Condición Fiscal': s.tax_condition,
        'Rubro / Categoría': s.category || '',
        'Cuenta Corriente': s.has_checking_account ? 'SÍ' : 'NO',
        'Plazo Crédito (Días)': s.credit_days || 0,
        'Límite de Crédito ($)': s.credit_limit_ars || 0,
        'Saldo Adeudado ($)': b.debt,
        'Facturas Pendientes': b.pendingInvoicesCount,
        'Banco': s.bank_name || '',
        'CBU': s.bank_cbu || '',
        'Alias CBU': s.bank_alias || '',
        'Contacto': s.contact_person || '',
        'Teléfono': s.phone || '',
        'Email': s.email || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maestro Proveedores');
    XLSX.writeFile(wb, `Proveedores_ECAR_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 4 KPIs Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Total Proveedores */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Proveedores</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{totalSuppliers}</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Registrados y unificados en BD
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-ecar-blue">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        {/* KPI 2: Cuentas Corrientes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Cuentas Corrientes</p>
              <h3 className="text-2xl font-black text-ecar-blue mt-0.5 font-mono">{suppliersWithCC}</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Proveedores a plazo comercial
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-ecar-blue">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        {/* KPI 3: Deuda Total en Cuentas Corrientes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Saldo Adeudado Total</p>
              <h3 className="text-xl font-black text-rose-600 mt-0.5 font-mono">{formatARS(totalAccumulatedDebt)}</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Compromisos en Cta. Cte.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        {/* KPI 4: Cheques Emitidos Pendientes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Cheques Emitidos a Proveedores</p>
              <h3 className="text-xl font-black text-amber-600 mt-0.5 font-mono">{formatARS(totalChequesPendingToSuppliers)}</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Cartera de cheques a debitar
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Landmark size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Razón Social, CUIT, Fantasía, Rubro o Contacto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Exportar listado a Excel"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => {
                setSelectedSupplierForEdit(null);
                setShowSupplierModal(true);
              }}
              className="px-4 py-2 bg-ecar-blue hover:bg-ecar-blueDark text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Nuevo Proveedor</span>
            </button>
          </div>
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Rubro Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px]">Rubro:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="ALL">Todos los rubros ({suppliers.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Account Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px]">Condición:</span>
            <select
              value={selectedAccountType}
              onChange={e => setSelectedAccountType(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="ALL">Todas las condiciones</option>
              <option value="WITH_CC">Con Cuenta Corriente ({suppliersWithCC})</option>
              <option value="CASH_ONLY">Solo Contado ({suppliers.length - suppliersWithCC})</option>
            </select>
          </div>

          {/* Debt Status Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px]">Estado Saldo:</span>
            <select
              value={selectedDebtStatus}
              onChange={e => setSelectedDebtStatus(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="ALL">Todos los saldos</option>
              <option value="WITH_DEBT">Con Saldo Pendiente</option>
              <option value="UP_TO_DATE">Al Día (Sin deuda)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedCategory !== 'ALL' || selectedAccountType !== 'ALL' || selectedDebtStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedAccountType('ALL');
                setSelectedDebtStatus('ALL');
              }}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold underline transition-colors"
            >
              Limpiar filtros
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-400 font-medium">
            Mostrando <strong>{filteredSuppliers.length}</strong> de <strong>{suppliers.length}</strong> proveedores
          </div>
        </div>
      </div>

      {/* Supplier Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-ecar-blue" />
            Cargando maestro de proveedores...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <Building2 size={40} className="mx-auto mb-2 opacity-30" />
            No se encontraron proveedores que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Proveedor / CUIT</th>
                  <th className="py-3 px-4">Rubro / Categoría</th>
                  <th className="py-3 px-4">Condición & Cta Cte</th>
                  <th className="py-3 px-4 text-right">Saldo Adeudado</th>
                  <th className="py-3 px-4">Datos Bancarios</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(sup => {
                  const balance = supplierBalances.get(sup.id) || { debt: 0, pendingInvoicesCount: 0, issuedChequesPendingArs: 0 };
                  const methods = sup.payment_methods || ['transferencia'];

                  return (
                    <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Name & CUIT */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{sup.name}</span>
                          {sup.commercial_name && (
                            <span className="text-[10px] font-normal text-slate-500 italic">
                              ({sup.commercial_name})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-500 text-[11px] font-medium">
                            {sup.cuit || 'Sin CUIT'}
                          </span>
                          <span className="px-1.5 py-0.2 bg-slate-200/80 text-slate-700 rounded text-[9px] font-bold">
                            {sup.tax_condition}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 border border-blue-200/60 text-ecar-blue">
                          {sup.category || 'General'}
                        </span>
                      </td>

                      {/* Checking account info */}
                      <td className="py-3 px-4">
                        {sup.has_checking_account ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                              <CheckCircle2 size={10} /> Cta Cte ({sup.credit_days || 30} d)
                            </span>
                            {sup.credit_limit_ars ? (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Límite: {formatARS(sup.credit_limit_ars)}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Contado</span>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          {methods.includes('cheque') && (
                            <span className="px-1 py-0.2 bg-blue-100/60 text-ecar-blue rounded text-[9px] font-bold" title="Acepta Cheques / eCheqs">
                              ⚡ Cheque
                            </span>
                          )}
                          {methods.includes('transferencia') && (
                            <span className="px-1 py-0.2 bg-emerald-100/60 text-emerald-700 rounded text-[9px] font-bold" title="Acepta Transferencias">
                              🏦 Transf
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Balance / Debt */}
                      <td className="py-3 px-4 text-right">
                        <div className={`font-mono font-bold text-sm ${balance.debt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatARS(balance.debt)}
                        </div>
                        {balance.pendingInvoicesCount > 0 && (
                          <div className="text-[10px] text-slate-400">
                            {balance.pendingInvoicesCount} facturas impagas
                          </div>
                        )}
                        {balance.issuedChequesPendingArs > 0 && (
                          <div className="text-[10px] text-amber-600 font-mono font-medium">
                            CH pend: {formatARS(balance.issuedChequesPendingArs)}
                          </div>
                        )}
                      </td>

                      {/* Bank data */}
                      <td className="py-3 px-4">
                        {sup.bank_cbu ? (
                          <div className="text-[11px] font-mono text-slate-700">
                            <span className="font-bold text-slate-900">{sup.bank_name || 'Banco'}</span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={sup.bank_cbu}>
                              CBU: {sup.bank_cbu}
                            </div>
                            {sup.bank_alias && (
                              <div className="text-[10px] text-blue-700 font-bold">
                                Alias: {sup.bank_alias}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin datos bancarios</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        {sup.contact_person || sup.phone || sup.email ? (
                          <div className="text-[11px] space-y-0.5">
                            {sup.contact_person && (
                              <div className="font-bold text-slate-800">{sup.contact_person}</div>
                            )}
                            {sup.phone && (
                              <div className="text-slate-500 font-mono text-[10px]">{sup.phone}</div>
                            )}
                            {sup.email && (
                              <div className="text-slate-400 text-[10px] truncate max-w-[130px]">{sup.email}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Pagar con Cheque */}
                          <button
                            onClick={() => setSelectedSupplierForPayment(sup)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors shadow-2xs"
                            title="Pagar a Proveedor (Emitir Cheque / Transf)"
                          >
                            <CreditCard size={14} />
                          </button>

                          {/* Ver Estado de Cuenta Corriente */}
                          <button
                            onClick={() => setSelectedSupplierForStatement(sup)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-ecar-blue rounded-lg transition-colors shadow-2xs"
                            title="Ver Estado de Cuenta Corriente"
                          >
                            <FileText size={14} />
                          </button>

                          {/* Editar Ficha */}
                          <button
                            onClick={() => {
                              setSelectedSupplierForEdit(sup);
                              setShowSupplierModal(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Editar Proveedor"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDeleteSupplier(sup)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="Eliminar Proveedor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Modal (Create / Edit) */}
      {showSupplierModal && (
        <SupplierModal
          supplier={selectedSupplierForEdit}
          onClose={() => {
            setShowSupplierModal(false);
            setSelectedSupplierForEdit(null);
          }}
        />
      )}

      {/* Payment Modal */}
      {selectedSupplierForPayment && (
        <SupplierPaymentModal
          supplier={selectedSupplierForPayment}
          onClose={() => setSelectedSupplierForPayment(null)}
        />
      )}

      {/* Account Statement Modal */}
      {selectedSupplierForStatement && (
        <SupplierAccountStatementModal
          supplier={selectedSupplierForStatement}
          onClose={() => setSelectedSupplierForStatement(null)}
          onOpenPaymentModal={() => {
            setSelectedSupplierForPayment(selectedSupplierForStatement);
          }}
        />
      )}
    </div>
  );
};
