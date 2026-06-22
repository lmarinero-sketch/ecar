import React, { useState, useMemo } from 'react';
import {
  Banknote, Plus, X, Save, Trash2, Check, Download, Calendar,
  Edit2, ChevronRight, ArrowLeft, Building2
} from 'lucide-react';
import {
  useWeeklyPayments, useCreateWeeklyPayment,
  useWeeklyPaymentItems, useCreateWeeklyPaymentItem, useUpdateWeeklyPaymentItem, useDeleteWeeklyPaymentItem,
  useGastosItems, useGastosRegistrosByRange,
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';

function formatARS(v: number) {
  return `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Payment Detail View ───
const PaymentDetail: React.FC<{ payment: any; onBack: () => void }> = ({ payment, onBack }) => {
  const { data: items = [], isLoading } = useWeeklyPaymentItems(payment.id);
  const createItem = useCreateWeeklyPaymentItem();
  const updateItem = useUpdateWeeklyPaymentItem();
  const deleteItem = useDeleteWeeklyPaymentItem();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ concepto: '', monto: '', alias_cbu: '', titular_cuenta: '', nro_factura: '', observaciones: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Import from gastos operativos
  const periodo = payment.payment_date?.slice(0, 7); // YYYY-MM
  const { data: gastosItems = [] } = useGastosItems();
  const { data: gastosRegs = [] } = useGastosRegistrosByRange(periodo ? [periodo] : []);
  const [showImport, setShowImport] = useState(false);

  const pendingGastos = useMemo(() => {
    const existingSources = new Set(items.filter(i => i.source_type === 'gastos_operativos').map(i => i.source_id));
    return gastosRegs
      .filter(r => {
        const pendiente = Number(r.monto) - Number(r.monto_pagado || 0);
        return pendiente > 0 && !existingSources.has(r.id);
      })
      .map(r => {
        const item = gastosItems.find(gi => gi.id === r.item_id);
        const pendiente = Number(r.monto) - Number(r.monto_pagado || 0);
        return { ...r, item_desc: item?.descripcion || 'Gasto', alias_cbu: (item as any)?.alias_cbu || '', titular_cuenta: (item as any)?.titular_cuenta || '', pendiente };
      });
  }, [gastosRegs, gastosItems, items]);

  const total = items.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalResto = items.reduce((s, i) => s + Number(i.resto || 0), 0);
  const pagados = items.filter(i => i.pagado).length;

  const handleAdd = async () => {
    const monto = parseFloat(form.monto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    if (!form.concepto.trim() || monto <= 0) return;
    await createItem.mutateAsync({
      payment_id: payment.id,
      concepto: form.concepto.trim().toUpperCase(),
      monto,
      alias_cbu: form.alias_cbu,
      titular_cuenta: form.titular_cuenta,
      nro_factura: form.nro_factura,
      observaciones: form.observaciones,
      source_type: 'manual',
      orden: items.length,
    });
    setForm({ concepto: '', monto: '', alias_cbu: '', titular_cuenta: '', nro_factura: '', observaciones: '' });
    setShowAdd(false);
  };

  const handleImport = async (gasto: any) => {
    const defaultMonto = gasto.pendiente;
    const input = window.prompt(`Importe pendiente para "${gasto.item_desc}": $${defaultMonto}\n\n¿Cuánto desea cargar en este pago?`, defaultMonto.toString());
    if (input === null) return; // User cancelled
    const finalMonto = parseFloat(input.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    if (finalMonto <= 0) return;

    await createItem.mutateAsync({
      payment_id: payment.id,
      concepto: gasto.item_desc,
      monto: finalMonto,
      alias_cbu: gasto.alias_cbu,
      titular_cuenta: gasto.titular_cuenta,
      nro_factura: gasto.nro_factura || '',
      observaciones: '',
      source_type: 'gastos_operativos',
      source_id: gasto.id,
      orden: items.length,
    });
  };

  const handleTogglePagado = async (item: any) => {
    await updateItem.mutateAsync({ id: item.id, payment_id: payment.id, pagado: !item.pagado });
  };

  const startEdit = (item: any) => {
    setEditId(item.id);
    setEditForm({
      concepto: item.concepto, monto: String(item.monto),
      alias_cbu: item.alias_cbu || '', titular_cuenta: item.titular_cuenta || '',
      nro_factura: item.nro_factura || '', observaciones: item.observaciones || '', resto: String(item.resto || 0),
    });
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    const monto = parseFloat(editForm.monto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const resto = parseFloat((editForm.resto || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    await updateItem.mutateAsync({
      id: editId, payment_id: payment.id,
      concepto: editForm.concepto.trim().toUpperCase(),
      monto, alias_cbu: editForm.alias_cbu, titular_cuenta: editForm.titular_cuenta,
      nro_factura: editForm.nro_factura, observaciones: editForm.observaciones, resto,
    });
    setEditId(null);
  };

  // PDF Generation
  const generatePDF = () => {
    const dateStr = new Date(payment.payment_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Control de Pagos - ${dateStr}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; padding: 30px; }
      h1 { text-align: center; font-size: 18px; margin-bottom: 15px; text-decoration: underline; }
      .header { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; }
      .header span { font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th, td { border: 1px solid #333; padding: 5px 8px; }
      th { background: #1a365d; color: white; text-align: center; font-size: 10px; text-transform: uppercase; }
      td { font-size: 10px; }
      .right { text-align: right; }
      .bold { font-weight: bold; }
      .total-row td { background: #e2e8f0; font-weight: bold; font-size: 11px; }
      .pagado { color: #22c55e; }
      .pendiente { color: #ef4444; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <h1>CONTROL DE PAGOS SEMANALES</h1>
    <div class="header">
      <span>FECHA ${dateStr}</span>
      <span>RESPONSABLE: ${(payment.responsible || 'N/A').toUpperCase()}</span>
    </div>
    <table>
      <thead><tr>
        <th>EMPRESA / CONCEPTO</th><th>MONTO</th><th>ALIAS O CBU</th>
        <th>TITULAR CUENTA</th><th>FACTURA / PERIODO</th><th>RESTO</th><th>OBSERVACIONES</th>
      </tr></thead><tbody>`;

    items.forEach(item => {
      html += `<tr>
        <td class="bold">${item.concepto}</td>
        <td class="right bold">${formatARS(Number(item.monto))}</td>
        <td class="bold">${item.alias_cbu || ''}</td>
        <td>${item.titular_cuenta || ''}</td>
        <td>${item.nro_factura || ''}</td>
        <td class="right">${Number(item.resto) > 0 ? formatARS(Number(item.resto)) : ''}</td>
        <td>${item.observaciones || ''}</td>
      </tr>`;
    });

    html += `<tr class="total-row">
      <td>TOTAL</td><td class="right">${formatARS(total)}</td>
      <td colspan="3"></td><td class="right">${totalResto > 0 ? formatARS(totalResto) : ''}</td>
      <td class="${pagados === items.length ? 'pagado' : 'pendiente'}">${pagados === items.length ? 'Pagado' : 'Pendiente'}</td>
    </tr></tbody></table>`;

    if (payment.notes) html += `<p style="margin-top:10px;font-size:10px;"><strong>Notas:</strong> ${payment.notes}</p>`;
    html += `<p style="text-align:center;margin-top:30px;font-size:9px;color:#999;">ECAR Construcciones · Sistema de Gestión</p></body></html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => printWin.print(), 500);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">
            Control de Pagos — {new Date(payment.payment_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          <p className="text-xs text-gray-500">Responsable: {payment.responsible || 'N/A'} · {items.length} ítems · {pagados}/{items.length} pagados</p>
        </div>
        <button onClick={generatePDF} className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-900 shadow-md transition-all">
          <Download size={14} /> Exportar PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-1">Total a Pagar</p>
          <p className="text-xl font-black font-mono text-gray-800">{formatARS(total)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-1">Restos Pendientes</p>
          <p className="text-xl font-black font-mono text-amber-600">{formatARS(totalResto)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-1">Pagados</p>
          <p className="text-xl font-black font-mono text-green-600">{pagados} / {items.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
          <Plus size={14} /> Agregar Pago
        </button>
        {pendingGastos.length > 0 && (
          <button onClick={() => setShowImport(!showImport)} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-200 border border-amber-200 transition-all">
            <Building2 size={14} /> Importar de Gastos ({pendingGastos.length})
          </button>
        )}
      </div>

      {/* Import from gastos */}
      {showImport && pendingGastos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-amber-800 text-sm">Gastos operativos no pagados — {periodo}</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {pendingGastos.map(g => (
              <div key={g.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-100 p-2.5">
                <div>
                  <span className="text-sm font-medium text-gray-800">{g.item_desc}</span>
                  <span className="text-xs text-gray-400 ml-2">{g.alias_cbu && `· ${g.alias_cbu}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-gray-700">{formatARS(Number(g.monto))}</span>
                  <button onClick={() => handleImport(g)} className="bg-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors">
                    + Importar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-5 space-y-3 shadow-sm">
          <h4 className="font-bold text-gray-800 flex items-center gap-2"><Plus size={14} className="text-indigo-600" /> Nuevo Pago</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Empresa / Concepto</label>
              <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: TANKITO" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Monto</label>
              <input value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Alias / CBU</label>
              <input value={form.alias_cbu} onChange={e => setForm({ ...form, alias_cbu: e.target.value })} placeholder="ALIAS.CUENTA" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Titular Cuenta</label>
              <input value={form.titular_cuenta} onChange={e => setForm({ ...form, titular_cuenta: e.target.value })} placeholder="NOMBRE TITULAR" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nro. Factura / Periodo</label>
              <input value={form.nro_factura} onChange={e => setForm({ ...form, nro_factura: e.target.value })} placeholder="71103" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Observaciones</label>
              <input value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} placeholder="CANCELACIÓN, etc." className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleAdd} disabled={!form.concepto.trim() || !form.monto} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-40 hover:bg-indigo-700 transition-colors">
              <Save size={14} className="inline mr-1" /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Sin ítems. Agregá pagos o importá desde gastos operativos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Empresa / Concepto</th>
                  <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold">Monto</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Alias o CBU</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Titular Cuenta</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Factura / Periodo</th>
                  <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold">Resto</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Observaciones</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  editId === item.id ? (
                    <tr key={item.id} className="bg-indigo-50">
                      <td className="px-2 py-1.5"><input value={editForm.concepto} onChange={e => setEditForm({ ...editForm, concepto: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" /></td>
                      <td className="px-2 py-1.5"><input value={editForm.monto} onChange={e => setEditForm({ ...editForm, monto: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-mono text-right" /></td>
                      <td className="px-2 py-1.5"><input value={editForm.alias_cbu} onChange={e => setEditForm({ ...editForm, alias_cbu: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-mono" /></td>
                      <td className="px-2 py-1.5"><input value={editForm.titular_cuenta} onChange={e => setEditForm({ ...editForm, titular_cuenta: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" /></td>
                      <td className="px-2 py-1.5"><input value={editForm.nro_factura} onChange={e => setEditForm({ ...editForm, nro_factura: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-mono" /></td>
                      <td className="px-2 py-1.5"><input value={editForm.resto} onChange={e => setEditForm({ ...editForm, resto: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-mono text-right" /></td>
                      <td className="px-2 py-1.5"><input value={editForm.observaciones} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" /></td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={handleSaveEdit} className="p-1 rounded bg-green-500 text-white hover:bg-green-600"><Save size={12} /></button>
                          <button onClick={() => setEditId(null)} className="p-1 rounded bg-gray-300 text-gray-600 hover:bg-gray-400"><X size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.pagado ? 'bg-green-50/30' : ''}`}>
                      <td className="px-3 py-2.5 font-bold text-gray-800 text-xs">
                        <div className="flex items-center gap-2">
                          {item.source_type === 'gastos_operativos' && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">GO</span>}
                          {item.concepto}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">{formatARS(Number(item.monto))}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-gray-700">{item.alias_cbu || ''}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{item.titular_cuenta || ''}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs font-mono">{item.nro_factura || ''}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-500">{Number(item.resto) > 0 ? formatARS(Number(item.resto)) : ''}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{item.observaciones || ''}</td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleTogglePagado(item)} className={`p-1 rounded transition-colors ${item.pagado ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'}`} title={item.pagado ? 'Pagado ✓' : 'Marcar como pagado'}>
                            <Check size={13} />
                          </button>
                          <button onClick={() => startEdit(item)} className="p-1 rounded text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => deleteItem.mutate({ id: item.id, payment_id: payment.id })} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
                {/* Total row */}
                <tr className="bg-slate-800 text-white font-bold">
                  <td className="px-3 py-2.5 text-sm uppercase">Total</td>
                  <td className="px-3 py-2.5 text-right font-mono font-black text-sm">{formatARS(total)}</td>
                  <td colSpan={3}></td>
                  <td className="px-3 py-2.5 text-right font-mono text-sm">{totalResto > 0 ? formatARS(totalResto) : ''}</td>
                  <td className={`px-3 py-2.5 text-sm ${pagados === items.length && items.length > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                    {pagados === items.length && items.length > 0 ? 'Pagado' : 'Pendiente'}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Module ───
export const PaymentsModule: React.FC = () => {
  const { profile } = useAuth();
  const { data: payments = [], isLoading } = useWeeklyPayments();
  const createPayment = useCreateWeeklyPayment();

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newResponsible, setNewResponsible] = useState(profile?.full_name || '');
  const [newNotes, setNewNotes] = useState('');

  const handleCreate = async () => {
    const result = await createPayment.mutateAsync({
      payment_date: newDate,
      responsible: newResponsible.toUpperCase(),
      notes: newNotes || undefined,
    });
    setShowNew(false);
    setNewNotes('');
    setSelectedPayment(result);
  };

  if (selectedPayment) {
    return <PaymentDetail payment={selectedPayment} onBack={() => setSelectedPayment(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Banknote size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Banknote size={24} /> Control de Pagos Semanales</h3>
          <p className="text-indigo-200 text-sm mt-1">Planilla de pagos con alias, titulares y exportación PDF — similar a la planilla de Adolfo</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-all">
          <Plus size={16} /> Nueva Planilla de Pagos
        </button>
      </div>

      {/* New payment form */}
      {showNew && (
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-5 space-y-3 shadow-sm">
          <h4 className="font-bold text-gray-800">Nueva Planilla de Pagos</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Fecha de Pago</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Responsable</label>
              <input value={newResponsible} onChange={e => setNewResponsible(e.target.value)} placeholder="ADOLFO" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Notas (opcional)</label>
              <input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Pagos semana 1 de junio" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleCreate} disabled={!newDate || !newResponsible.trim()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-40 hover:bg-indigo-700">
              Crear Planilla
            </button>
          </div>
        </div>
      )}

      {/* Payments list */}
      {isLoading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto" /></div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Banknote size={48} className="mx-auto text-gray-300 mb-3" />
          <h4 className="font-bold text-gray-500">Sin planillas de pago</h4>
          <p className="text-sm text-gray-400 mt-1">Creá tu primera planilla semanal para empezar a controlar pagos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map(p => (
            <button key={p.id} onClick={() => setSelectedPayment(p)}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Calendar size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {new Date(p.payment_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{p.responsible}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.status === 'executed' ? 'bg-green-100 text-green-700' :
                  p.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{p.status === 'executed' ? 'Ejecutado' : p.status === 'approved' ? 'Aprobado' : 'Borrador'}</span>
              </div>
              {p.notes && <p className="text-xs text-gray-400 truncate">{p.notes}</p>}
              <div className="mt-2 flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalle <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
