import React, { useState, useMemo } from 'react';
import {
  Banknote, Plus, X, Save, Trash2, Check, Download, Calendar,
  Edit2, ChevronRight, ArrowLeft, Building2
} from 'lucide-react';
import {
  useWeeklyPayments, useCreateWeeklyPayment, useDeleteWeeklyPayment,
  useWeeklyPaymentItems, useCreateWeeklyPaymentItem, useUpdateWeeklyPaymentItem, useDeleteWeeklyPaymentItem,
  useGastosItems, useGastosRegistrosByRange,
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useModalStore } from '../store/useModalStore';


function formatARS(v: number) {
  return `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Payment Detail View ───
const PaymentDetail: React.FC<{ payment: any; onBack: () => void }> = ({ payment, onBack }) => {
  const { data: rawItems = [], isLoading } = useWeeklyPaymentItems(payment.id);
  
  const items = useMemo(() => {
    return rawItems.filter(item => 
      item.source_type !== 'sueldos_obreros' &&
      !item.concepto.toUpperCase().includes('SUELDO TRABAJADORES') &&
      !item.concepto.toUpperCase().includes('SUELDO OBREROS')
    );
  }, [rawItems]);
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
  const [importGasto, setImportGasto] = useState<any>(null);
  const [importMonto, setImportMonto] = useState('');

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

  const handleImport = (gasto: any) => {
    setImportGasto(gasto);
    setImportMonto(gasto.pendiente.toString());
  };

  const confirmImport = async () => {
    if (!importGasto) return;
    const finalMonto = parseFloat(importMonto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    if (finalMonto <= 0) return;

    await createItem.mutateAsync({
      payment_id: payment.id,
      concepto: importGasto.item_desc,
      monto: finalMonto,
      alias_cbu: importGasto.alias_cbu,
      titular_cuenta: importGasto.titular_cuenta,
      nro_factura: importGasto.nro_factura || '',
      observaciones: '',
      source_type: 'gastos_operativos',
      source_id: importGasto.id,
      orden: items.length,
    });
    setImportGasto(null);
    setImportMonto('');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="light-card p-4">
          <p className="text-xs font-bold text-gray-500 mb-1">Total a Pagar</p>
          <p className="text-xl font-black font-mono text-gray-800">{formatARS(total)}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-xs font-bold text-gray-500 mb-1">Restos Pendientes</p>
          <p className="text-xl font-black font-mono text-amber-600">{formatARS(totalResto)}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-xs font-bold text-gray-500 mb-1">Pagados</p>
          <p className="text-xl font-black font-mono text-green-600">{pagados} / {items.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-ecar-blue to-ecar-blue text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
          <Plus size={14} /> Agregar Pago
        </button>
        {pendingGastos.length > 0 && (
          <button onClick={() => setShowImport(!showImport)} className="badge badge-warning">
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

      {/* Add form modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Plus size={18} className="text-ecar-blue" /> Nuevo Pago</h4>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Empresa / Concepto</label>
                <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: TANKITO" className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Monto</label>
                <input value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00" className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Alias / CBU</label>
                <input value={form.alias_cbu} onChange={e => setForm({ ...form, alias_cbu: e.target.value })} placeholder="ALIAS.CUENTA" className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Titular Cuenta</label>
                <input value={form.titular_cuenta} onChange={e => setForm({ ...form, titular_cuenta: e.target.value })} placeholder="NOMBRE TITULAR" className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nro. Factura / Periodo</label>
                <input value={form.nro_factura} onChange={e => setForm({ ...form, nro_factura: e.target.value })} placeholder="71103" className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Observaciones</label>
                <input value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} placeholder="CANCELACIÓN, etc." className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-3 border-t mt-4">
              <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button onClick={handleAdd} disabled={!form.concepto.trim() || !form.monto} className="btn-primary">
                <Save size={16} /> Guardar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importGasto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Building2 size={18} className="text-amber-600" /> Importar Gasto</h4>
              <button onClick={() => setImportGasto(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Importe pendiente para <span className="font-bold text-gray-800">{importGasto.item_desc}</span>: <br/><span className="font-mono font-bold text-amber-600">{formatARS(importGasto.pendiente)}</span>
              </p>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">¿Cuánto desea cargar en este pago?</label>
              <input value={importMonto} onChange={e => setImportMonto(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-lg font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" autoFocus />
            </div>
            <div className="flex gap-3 justify-end pt-3 border-t mt-4">
              <button onClick={() => setImportGasto(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button onClick={confirmImport} disabled={!importMonto} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-amber-600 transition-colors shadow-md">
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit form modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Edit2 size={18} className="text-ecar-blue" /> Editar Pago</h4>
              <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Empresa / Concepto</label>
                <input value={editForm.concepto} onChange={e => setEditForm({ ...editForm, concepto: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Monto</label>
                <input value={editForm.monto} onChange={e => setEditForm({ ...editForm, monto: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Alias / CBU</label>
                <input value={editForm.alias_cbu} onChange={e => setEditForm({ ...editForm, alias_cbu: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Titular Cuenta</label>
                <input value={editForm.titular_cuenta} onChange={e => setEditForm({ ...editForm, titular_cuenta: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nro. Factura / Periodo</label>
                <input value={editForm.nro_factura} onChange={e => setEditForm({ ...editForm, nro_factura: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Resto (Pendiente)</label>
                <input value={editForm.resto} onChange={e => setEditForm({ ...editForm, resto: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Observaciones</label>
                <input value={editForm.observaciones} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-3 border-t mt-4">
              <button onClick={() => setEditId(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={!editForm.concepto?.trim() || !editForm.monto} className="btn-primary">
                <Save size={16} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="light-card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-ecar-blue rounded-full animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Sin ítems. Agregá pagos o importá desde gastos operativos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold">Empresa / Concepto</th>
                  <th className="text-right text-[10px] uppercase tracking-wider font-bold">Monto</th>
                  <th className="text-center text-[10px] uppercase tracking-wider font-bold">Alias o CBU</th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold">Titular Cuenta</th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold">Factura / Periodo</th>
                  <th className="text-right text-[10px] uppercase tracking-wider font-bold">Resto</th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold">Observaciones</th>
                  <th className="text-center text-[10px] uppercase tracking-wider font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isPartial = item.pagado && Number(item.resto) > 0;
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isPartial ? 'bg-amber-50/50' : item.pagado ? 'bg-green-50/30' : ''}`}>
                      <td className="px-3 py-2.5 font-bold text-xs text-gray-800">
                        <div className="flex items-center gap-2 flex-wrap pointer-events-none">
                          {item.source_type === 'gastos_operativos' && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">GO</span>}
                          {item.concepto}
                          {isPartial && <span className="badge badge-warning">Pago Parcial</span>}
                        </div>
                      </td>
                      <td className="text-right font-mono font-bold text-gray-900">{formatARS(Number(item.monto))}</td>
                      <td className="text-center font-mono font-bold text-xs text-gray-700">{item.alias_cbu || ''}</td>
                      <td className="text-gray-600 text-xs">{item.titular_cuenta || ''}</td>
                      <td className="text-gray-600 text-xs font-mono">{item.nro_factura || ''}</td>
                      <td className={`px-3 py-2.5 text-right font-mono text-xs font-bold ${isPartial ? 'text-amber-600' : 'text-gray-500'}`}>{Number(item.resto) > 0 ? formatARS(Number(item.resto)) : ''}</td>
                      <td className="text-gray-500 text-xs">{item.observaciones || ''}</td>
                      <td className="text-center px-2">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleTogglePagado(item)} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                              isPartial 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                : item.pagado 
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={isPartial ? 'Pago Parcial' : item.pagado ? 'Pagado' : 'Marcar como pagado'}
                          >
                            <Check size={14} />
                            {isPartial ? 'Parcial' : item.pagado ? 'Pagado' : 'Confirmar'}
                          </button>
                          <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100" title="Editar"><Edit2 size={14} /></button>
                          <button onClick={() => deleteItem.mutate({ id: item.id, payment_id: payment.id })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                )})}
                {/* Total row */}
                <tr className="bg-slate-800 text-white font-bold">
                  <td className="text-sm uppercase">Total</td>
                  <td className="text-right font-mono font-black text-sm">{formatARS(total)}</td>
                  <td colSpan={3}></td>
                  <td className="text-right font-mono text-sm">{totalResto > 0 ? formatARS(totalResto) : ''}</td>
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
  const deletePayment = useDeleteWeeklyPayment();

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
      <div className="bg-gradient-to-r from-slate-800 via-ecar-blueDark to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Banknote size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Banknote size={24} /> Control de Pagos Semanales</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Planilla de pagos con alias, titulares y exportación PDF — similar a la planilla de Adolfo</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={16} /> Nueva Planilla de Pagos
        </button>
      </div>

      {/* New payment form modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-lg text-gray-800">Nueva Planilla de Pagos</h4>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha de Pago</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Responsable</label>
                <input value={newResponsible} onChange={e => setNewResponsible(e.target.value)} placeholder="ADOLFO" className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Notas (opcional)</label>
                <input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Pagos semana 1 de junio" className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-ecar-blueLight transition-all" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-3 border-t mt-4">
              <button onClick={() => setShowNew(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button onClick={handleCreate} disabled={!newDate || !newResponsible.trim()} className="btn-primary">
                Crear Planilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments list */}
      {isLoading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-ecar-blue rounded-full animate-spin mx-auto" /></div>
      ) : payments.length === 0 ? (
        <div className="light-card p-1">
          <Banknote size={48} className="mx-auto text-gray-300 mb-3" />
          <h4 className="font-bold text-gray-500">Sin planillas de pago</h4>
          <p className="text-sm text-gray-400 mt-1">Creá tu primera planilla semanal para empezar a controlar pagos.</p>
        </div>
      ) : (
        <div className="light-card overflow-hidden border border-gray-100">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha de Pago</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th>Notas</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="group hover:bg-blue-50/50 transition-colors">
                  <td onClick={() => setSelectedPayment(p)} className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-ecar-blueLight flex items-center justify-center shrink-0">
                        <Calendar size={14} className="text-ecar-blue" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">
                        {new Date(p.payment_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </td>
                  <td onClick={() => setSelectedPayment(p)} className="cursor-pointer">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{p.responsible}</span>
                  </td>
                  <td onClick={() => setSelectedPayment(p)} className="cursor-pointer">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      p.status === 'executed' ? 'bg-green-100 text-green-700' :
                      p.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{p.status === 'executed' ? 'Ejecutado' : p.status === 'approved' ? 'Aprobado' : 'Borrador'}</span>
                  </td>
                  <td onClick={() => setSelectedPayment(p)} className="cursor-pointer w-1/3">
                    <span className="text-xs text-gray-500 truncate max-w-[250px] block">{p.notes || '—'}</span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedPayment(p); }} className="p-2 rounded-lg bg-gray-50 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors" title="Ver Detalles">
                        <ChevronRight size={14} />
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (await useModalStore.getState().showConfirm('Confirmar Eliminación', '¿Seguro que deseás borrar esta planilla de pagos de forma definitiva? Se perderán todos sus ítems.')) {
                            try {
                              await deletePayment.mutateAsync(p.id);
                              useModalStore.getState().showAlert('Éxito', 'La planilla de pagos fue eliminada.');
                            } catch (err: any) {
                              useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar la planilla.');
                            }
                          }
                        }}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar Planilla"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
