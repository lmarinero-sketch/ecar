import React, { useState } from 'react';
import { Landmark, TrendingUp, TrendingDown, CreditCard, Plus, X, Camera, Edit3 } from 'lucide-react';
import { useCheques, useCreateCheque, useFixedExpenses } from '../hooks/useData';
import { ChequeUploader } from './ChequeUploader';
import { ImageViewer } from './ImageViewer';

export const FinancesModule: React.FC = () => {
  const { data: cheques = [], isLoading } = useCheques();
  const { data: expenses = [] } = useFixedExpenses();
  const createCheque = useCreateCheque();

  const [mode, setMode] = useState<'idle' | 'scan' | 'form'>('idle');
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState('');
  const [form, setForm] = useState({
    cheque_number: '', bank_name: '', type: 'physical' as const,
    direction: 'receivable' as const, beneficiary_or_issuer: '',
    amount_ars: 0, due_date: '', issue_date: '', scan_url: '',
  });

  const formatARS = (v: number) => `A$ ${v.toLocaleString()}`;

  const payable = cheques.filter(c => c.direction === 'payable' && c.status === 'pending');
  const receivable = cheques.filter(c => c.direction === 'receivable' && c.status === 'pending');
  const totalPayable = payable.reduce((a, c) => a + c.amount_ars, 0);
  const totalReceivable = receivable.reduce((a, c) => a + c.amount_ars, 0);
  const totalFixed = expenses.filter(e => e.status === 'active').reduce((a, e) => a + e.estimated_amount_ars, 0);

  const handleScanComplete = (data: any, url: string) => {
    setScanUrl(url);
    setForm({
      cheque_number: data.cheque_number || '',
      bank_name: data.bank_name || '',
      type: data.type === 'echeq' ? 'echeq' : 'physical',
      direction: 'receivable',
      beneficiary_or_issuer: data.beneficiary || data.issuer_name || '',
      amount_ars: data.amount || 0,
      due_date: data.due_date || data.issue_date || '',
      issue_date: data.issue_date || '',
      scan_url: url,
    });
    setMode('form');
  };

  const handleCreate = async () => {
    await createCheque.mutateAsync({ ...form, scan_url: scanUrl || undefined } as any);
    setMode('idle');
    setScanUrl('');
    setForm({ cheque_number: '', bank_name: '', type: 'physical', direction: 'receivable', beneficiary_or_issuer: '', amount_ars: 0, due_date: '', issue_date: '', scan_url: '' });
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', deposited: 'bg-blue-100 text-blue-700',
    cashed: 'bg-green-100 text-green-700', bounced: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600',
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando finanzas...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Landmark size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Landmark size={24} /> Finanzas & Tesorería</h3>
          <p className="text-emerald-100 text-sm mt-1">Cartera de cheques, gastos fijos y flujo de caja operativo.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingDown size={16} className="text-red-500" /> Cheques a Pagar</div>
          <p className="text-2xl font-black text-red-600 font-mono">{formatARS(totalPayable)}</p>
          <p className="text-xs text-gray-400 mt-1">{payable.length} pendientes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingUp size={16} className="text-green-500" /> Cheques a Cobrar</div>
          <p className="text-2xl font-black text-green-600 font-mono">{formatARS(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">{receivable.length} pendientes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><CreditCard size={16} className="text-purple-500" /> Gastos Fijos Mes</div>
          <p className="text-2xl font-black text-purple-700 font-mono">{formatARS(totalFixed)}</p>
          <p className="text-xs text-gray-400 mt-1">{expenses.filter(e => e.status === 'active').length} activos</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={() => { setScanUrl(''); setMode('form'); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border hover:bg-gray-200">
          <Edit3 size={16} /> Carga Manual
        </button>
        <button onClick={() => setMode('scan')} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
          <Camera size={16} /> Escanear Cheque
        </button>
      </div>

      {/* Scan modal */}
      {mode === 'scan' && (
        <ChequeUploader
          onExtracted={handleScanComplete}
          onCancel={() => setMode('idle')}
        />
      )}

      {/* Form modal (pre-filled from OCR or empty for manual) */}
      {mode === 'form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{scanUrl ? '✅ Datos extraídos — Revisá y confirmá' : 'Registro Manual'}</h3>
              <button onClick={() => setMode('idle')}><X size={20} className="text-gray-400" /></button>
            </div>

            {scanUrl && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-xs font-bold text-gray-500 mb-2">Imagen del cheque:</p>
                <img src={scanUrl} alt="Cheque escaneado" className="max-h-32 rounded border mx-auto" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value as any })} className="px-3 py-2 border rounded-lg text-sm col-span-2 font-medium">
                <option value="receivable">↓ A Cobrar (recibido)</option>
                <option value="payable">↑ A Pagar (emitido)</option>
              </select>
              <div>
                <label className="text-xs font-bold text-gray-500">Nro. Cheque</label>
                <input value={form.cheque_number} onChange={e => setForm({ ...form, cheque_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Banco</label>
                <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">Beneficiario / Emisor</label>
                <input value={form.beneficiary_or_issuer} onChange={e => setForm({ ...form, beneficiary_or_issuer: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Monto ARS</label>
                <input type="number" value={form.amount_ars || ''} onChange={e => setForm({ ...form, amount_ars: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono font-bold text-lg" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="physical">Físico</option>
                  <option value="echeq">eCheq</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Fecha Emisión</label>
                <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Vencimiento</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>

            <button onClick={handleCreate} disabled={!form.cheque_number || !form.bank_name || createCheque.isPending} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-emerald-700 transition-colors">
              {createCheque.isPending ? 'Guardando...' : '✓ Confirmar y Registrar Cheque'}
            </button>
          </div>
        </div>
      )}

      {/* Cheques table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Cartera de Cheques</h3></div>
        {cheques.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Sin cheques registrados. Escaneá o cargá el primero.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Nro</th>
                  <th className="px-4 py-3">Banco</th>
                  <th className="px-4 py-3">Dir.</th>
                  <th className="px-4 py-3">Beneficiario</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3">Vto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cheques.map(ch => (
                  <tr key={ch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{ch.cheque_number}</td>
                    <td className="px-4 py-3">{ch.bank_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${ch.direction === 'payable' ? 'text-red-500' : 'text-green-500'}`}>
                        {ch.direction === 'payable' ? '↑ Pagar' : '↓ Cobrar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ch.beneficiary_or_issuer || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatARS(ch.amount_ars)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{ch.due_date || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[ch.status]}`}>{ch.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(ch as any).scan_url ? (
                        <button onClick={() => setViewerUrl((ch as any).scan_url)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors" title="Ver imagen"><Camera size={14} /></button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {viewerUrl && <ImageViewer src={viewerUrl} alt="Cheque escaneado" onClose={() => setViewerUrl(null)} />}
    </div>
  );
};
