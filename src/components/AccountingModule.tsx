import React, { useState } from 'react';
import { Calculator, Plus, X, AlertCircle } from 'lucide-react';
import { useInvoices, useCreateInvoice, useProjects } from '../hooks/useData';

export const AccountingModule: React.FC = () => {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: projects = [] } = useProjects();
  const createInvoice = useCreateInvoice();
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    invoice_type: 'FA', issue_date: new Date().toISOString().split('T')[0],
    receptor_name: '', receptor_cuit: '', receptor_tax_condition: 'RI',
    project_id: '', net_amount_ars: 0, iva_21_ars: 0,
  });

  const formatARS = (v: number) => `A$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const taxConditionLabel: Record<string, string> = {
    RI: 'Responsable Inscripto',
    M: 'Monotributo',
    EX: 'Exento',
    CF: 'Consumidor Final',
  };

  const invoiceTypeLabel: Record<string, string> = {
    FA: 'Factura A', FB: 'Factura B', FC: 'Factura C', FE: 'Factura E',
    NCA: 'Nota de Crédito A', NCB: 'Nota de Crédito B', NCC: 'Nota de Crédito C',
  };

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', pending_cae: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-200 text-gray-500',
  };
  const statusLabel: Record<string, string> = {
    draft: 'Borrador', pending_cae: 'Pend. CAE', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada',
  };

  const handleCreate = async () => {
    setErrorMsg(null);
    try {
      const net = form.net_amount_ars;
      const iva = Math.round(net * 0.21);
      await createInvoice.mutateAsync({
        ...form,
        iva_21_ars: iva,
        total_ars: net + iva,
        project_id: form.project_id || null,
      } as any);
      setShowForm(false);
      setForm({
        invoice_type: 'FA', issue_date: new Date().toISOString().split('T')[0],
        receptor_name: '', receptor_cuit: '', receptor_tax_condition: 'RI',
        project_id: '', net_amount_ars: 0, iva_21_ars: 0,
      });
    } catch (err: any) {
      console.error('[AccountingModule] Error creating invoice:', err);
      setErrorMsg(err.message || 'Error al guardar la factura. Verificá tu perfil/permisos.');
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando facturación...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Calculator size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Calculator size={24} /> Facturación ARCA</h3>
          <p className="text-blue-100 text-sm mt-1">Emisión de facturas electrónicas. {invoices.filter(i => i.status === 'approved').length} aprobadas.</p>
        </div>
      </div>

      {/* AFIP integration disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Módulo en preparación — Sin emisión AFIP</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Actualmente este módulo permite registrar facturas como borradores internos. La integración con los webservices de ARCA/AFIP para emisión electrónica con CAE está próxima a implementarse.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setErrorMsg(null); setShowForm(true); }} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
          <Plus size={16} /> Nueva Factura
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Nueva Factura</h3><button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button></div>
            
            {errorMsg && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <select value={form.invoice_type} onChange={e => setForm({ ...form, invoice_type: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                {['FA','FB','FC','FE','NCA','NCB','NCC'].map(t => <option key={t} value={t}>{invoiceTypeLabel[t] || t}</option>)}
              </select>
              <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Razón Social Receptor" value={form.receptor_name} onChange={e => setForm({ ...form, receptor_name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm col-span-2" />
              <input placeholder="CUIT Receptor" value={form.receptor_cuit} onChange={e => setForm({ ...form, receptor_cuit: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <select value={form.receptor_tax_condition} onChange={e => setForm({ ...form, receptor_tax_condition: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                <option value="RI">Responsable Inscripto</option>
                <option value="M">Monotributo</option>
                <option value="EX">Exento</option>
                <option value="CF">Consumidor Final</option>
              </select>
              <div>
                <label className="text-xs font-bold text-gray-500">Monto Neto</label>
                <input type="number" value={form.net_amount_ars} onChange={e => setForm({ ...form, net_amount_ars: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">IVA 21% (auto)</label>
                <input disabled value={Math.round(form.net_amount_ars * 0.21).toLocaleString()} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
              </div>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="px-3 py-2 border rounded-lg text-sm col-span-2">
                <option value="">Obra (opcional)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-right">
              <span className="text-sm text-gray-500">Total: </span>
              <span className="text-xl font-black font-mono">{formatARS(form.net_amount_ars + Math.round(form.net_amount_ars * 0.21))}</span>
            </div>
            <button onClick={handleCreate} disabled={!form.receptor_name || !form.receptor_cuit || createInvoice.isPending} className="w-full bg-ecar-blue text-white py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {createInvoice.isPending ? 'Guardando...' : 'Crear Factura (Borrador)'}
            </button>
          </div>
        </div>
      )}

      {/* Invoices table */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Facturas Emitidas</h3></div>
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><AlertCircle size={36} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin facturas. Emití la primera.</p></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Receptor</th>
                <th className="px-4 py-3">CUIT</th>
                <th className="px-4 py-3">Cond. IVA</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Neto</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">CAE</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{invoiceTypeLabel[inv.invoice_type] || inv.invoice_type}</td>
                  <td className="px-4 py-3 font-medium">{inv.receptor_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.receptor_cuit}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{taxConditionLabel[inv.receptor_tax_condition || ''] || inv.receptor_tax_condition || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{inv.issue_date}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatARS(inv.net_amount_ars)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{formatARS(inv.total_ars)}</td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-gray-500">{inv.cae_number || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[inv.status]}`}>{statusLabel[inv.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
