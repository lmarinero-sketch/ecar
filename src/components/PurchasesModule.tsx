import React, { useState } from 'react';
import { ShoppingCart, Upload, Check, X, AlertCircle, Plus, Loader2, Eye, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { usePurchaseInvoices, useSuppliers, useCreateSupplier } from '../hooks/useData';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import { generateLibroIVA } from '../lib/generateLibroIVA';

type InvoiceTab = 'compras' | 'ventas';

export const PurchasesModule: React.FC = () => {
  const { data: invoices = [], isLoading, refetch } = usePurchaseInvoices();
  const { data: suppliers = [] } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrError, setOcrError] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', cuit: '', tax_condition: 'RI' });
  const [activeTab, setActiveTab] = useState<InvoiceTab>('compras');

  // Periodo for Libro IVA export
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [periodoDesde, setPeriodoDesde] = useState(firstDay.toISOString().split('T')[0]);
  const [periodoHasta, setPeriodoHasta] = useState(lastDay.toISOString().split('T')[0]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setOcrError('');
    setOcrResult(null);
    try {
      // 1. Upload to storage
      const path = `scans/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('purchase-scans').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('purchase-scans').getPublicUrl(path);

      // 2. Create pending record
      const { data: record, error: insertError } = await supabase.from('purchase_invoices').insert({
        tenant_id: ECAR_TENANT_ID,
        original_file_url: publicUrl,
        status: 'pending_review',
        issue_date: new Date().toISOString().split('T')[0],
      }).select().single();
      if (insertError) throw insertError;

      setUploading(false);
      setProcessing(true);

      // 3. Call Edge Function for OCR
      const { data: fnData, error: fnError } = await supabase.functions.invoke('process-invoice', {
        body: { fileUrl: publicUrl, invoiceId: record.id },
      });

      if (fnError) {
        // Try to read error details from response
        const errMsg = typeof fnError === 'object' && fnError.message ? fnError.message : String(fnError);
        setOcrError(`Error de función: ${errMsg}`);
        refetch();
      } else if (fnData?.success) {
        setOcrResult(fnData.data);
        refetch();
      } else {
        setOcrError(fnData?.error || 'Error procesando factura');
        refetch();
      }
    } catch (err: any) {
      console.error('Upload/OCR error:', err);
      setOcrError(err.message || 'Error al procesar');
      refetch();
    }
    setUploading(false);
    setProcessing(false);
  };

  const handleValidate = async (id: string) => {
    await supabase.from('purchase_invoices').update({ status: 'validated', ocr_validated: true }).eq('id', id);
    refetch();
  };

  const handleReject = async (id: string) => {
    await supabase.from('purchase_invoices').update({ status: 'rejected' }).eq('id', id);
    refetch();
  };

  const formatARS = (v: number | null) => v ? `$ ${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '$ 0';

  // Filter by tipo from ocr_raw_data
  const compras = invoices.filter((i: any) => !i.ocr_raw_data?.tipo || i.ocr_raw_data?.tipo === 'compra');
  const ventas = invoices.filter((i: any) => i.ocr_raw_data?.tipo === 'venta');
  const currentList = activeTab === 'compras' ? compras : ventas;

  // Totals
  const totNeto = currentList.reduce((s: number, i: any) => s + Number(i.net_amount_ars || 0), 0);
  const totIva = currentList.reduce((s: number, i: any) => s + Number(i.iva_21_ars || 0) + Number(i.iva_105_ars || 0) + Number(i.iva_27_ars || 0), 0);
  const totTotal = currentList.reduce((s: number, i: any) => s + Number(i.total_ars || 0), 0);

  const statusColor: Record<string, string> = {
    pending_review: 'bg-yellow-100 text-yellow-700',
    validated: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    exported: 'bg-blue-100 text-blue-700',
  };
  const statusLabel: Record<string, string> = {
    pending_review: 'Revisar', validated: 'Validado', rejected: 'Rechazado', exported: 'Exportado',
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-800 to-violet-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ShoppingCart size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ShoppingCart size={24} /> Compras & Libro IVA</h3>
          <p className="text-violet-100 text-sm mt-1">Subí una foto o PDF de la factura. La IA extrae automáticamente todos los datos para el Libro IVA.</p>
        </div>
      </div>

      {/* Upload + Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${uploading || processing ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-ecar-blue hover:bg-blue-50/50'}`}>
          {processing ? (
            <>
              <Loader2 size={36} className="mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="font-bold text-blue-700">🤖 IA analizando factura...</p>
              <p className="text-xs text-blue-400 mt-1">Extrayendo CUIT, montos, IVA y clasificando compra/venta</p>
            </>
          ) : uploading ? (
            <>
              <Loader2 size={36} className="mx-auto mb-3 text-gray-400 animate-spin" />
              <p className="font-bold text-gray-700">Subiendo archivo...</p>
            </>
          ) : (
            <>
              <Upload size={36} className="mx-auto mb-3 text-gray-400" />
              <p className="font-bold text-gray-700">Subir Factura</p>
              <p className="text-xs text-gray-400 mt-1">PDF o foto (JPG, PNG). La IA detecta si es compra o venta.</p>
            </>
          )}
          <input type="file" className="hidden" accept="image/*,.pdf" disabled={uploading || processing} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        </label>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-gray-900">Proveedores ({suppliers.length})</h4>
            <button onClick={() => setShowSupplierForm(!showSupplierForm)} className="text-ecar-blue text-sm font-bold flex items-center gap-1"><Plus size={14} /> Nuevo</button>
          </div>
          {showSupplierForm && (
            <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg">
              <input placeholder="Razón Social" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" />
              <input placeholder="CUIT" value={supplierForm.cuit} onChange={e => setSupplierForm({ ...supplierForm, cuit: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" />
              <button onClick={async () => { await createSupplier.mutateAsync(supplierForm); setShowSupplierForm(false); setSupplierForm({ name: '', cuit: '', tax_condition: 'RI' }); }} className="bg-ecar-blue text-white px-4 py-1.5 rounded text-sm font-bold w-full">Guardar</button>
            </div>
          )}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {suppliers.map((s: any) => (
              <div key={s.id} className="flex justify-between items-center text-sm py-1.5 px-2 hover:bg-gray-50 rounded">
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-gray-400 font-mono text-xs">{s.cuit || '—'}</span>
              </div>
            ))}
            {suppliers.length === 0 && <p className="text-gray-400 text-sm">Sin proveedores</p>}
          </div>
        </div>
      </div>

      {/* OCR Result feedback */}
      {ocrResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-bold text-green-700 text-sm mb-2">✅ Factura procesada por IA</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span className="text-gray-500">Tipo:</span> <span className="font-bold">{ocrResult.tipo === 'venta' ? '📤 Venta' : '📥 Compra'}</span></div>
            <div><span className="text-gray-500">Factura:</span> <span className="font-mono font-bold">{ocrResult.tipo_factura} {ocrResult.punto_venta}-{ocrResult.numero_factura}</span></div>
            <div><span className="text-gray-500">CUIT:</span> <span className="font-mono">{ocrResult.cuit}</span></div>
            <div><span className="text-gray-500">Total:</span> <span className="font-bold">{formatARS(ocrResult.total)}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Proveedor/Cliente:</span> <span className="font-bold">{ocrResult.proveedor_cliente}</span></div>
            <div><span className="text-gray-500">Neto:</span> {formatARS(ocrResult.neto_gravado)}</div>
            <div><span className="text-gray-500">IVA 21%:</span> {formatARS(ocrResult.iva_21)}</div>
          </div>
        </div>
      )}
      {ocrError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-bold text-red-700 text-sm">❌ Error al procesar: {ocrError}</p>
          <p className="text-xs text-red-400 mt-1">Verificar que la imagen sea legible o que la API Key de Gemini esté configurada.</p>
        </div>
      )}

      {/* Tabs: Compras / Ventas */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setActiveTab('compras')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'compras' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <TrendingDown size={16} /> Compras ({compras.length})
        </button>
        <button onClick={() => setActiveTab('ventas')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ventas' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <TrendingUp size={16} /> Ventas ({ventas.length})
        </button>
      </div>

      {/* Totals bar */}
      {currentList.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-bold uppercase">Neto Gravado</p>
            <p className="text-lg font-bold text-gray-800 font-mono">{formatARS(totNeto)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-bold uppercase">IVA Total</p>
            <p className="text-lg font-bold text-blue-700 font-mono">{formatARS(totIva)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
            <p className="text-lg font-bold text-violet-700 font-mono">{formatARS(totTotal)}</p>
          </div>
        </div>
      )}

      {/* Invoices table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-3">
          <h3 className="font-bold text-gray-800">Libro IVA — {activeTab === 'compras' ? 'Compras' : 'Ventas'}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <label className="text-gray-500">Desde:</label>
              <input type="date" value={periodoDesde} onChange={e => setPeriodoDesde(e.target.value)} className="border rounded px-2 py-1 text-xs" />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <label className="text-gray-500">Hasta:</label>
              <input type="date" value={periodoHasta} onChange={e => setPeriodoHasta(e.target.value)} className="border rounded px-2 py-1 text-xs" />
            </div>
            <button
              onClick={() => generateLibroIVA(invoices as any, periodoDesde, periodoHasta)}
              disabled={invoices.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Descargar Libro IVA (.xlsx)
            </button>
          </div>
        </div>
        {currentList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay facturas de {activeTab}. Subí una para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">{activeTab === 'compras' ? 'Proveedor' : 'Cliente'}</th>
                  <th className="px-4 py-3">CUIT</th>
                  <th className="px-4 py-3">Tipo/Nro</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Neto</th>
                  <th className="px-4 py-3 text-right">IVA 21%</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentList.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || '(Sin datos)'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.ocr_raw_data?.cuit || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_type || inv.ocr_raw_data?.tipo_factura || '—'} {inv.point_of_sale || inv.ocr_raw_data?.punto_venta || ''}-{inv.invoice_number || inv.ocr_raw_data?.numero_factura || ''}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.issue_date || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatARS(inv.net_amount_ars)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">{formatARS(inv.iva_21_ars)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatARS(inv.total_ars)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[inv.status] || ''}`}>{statusLabel[inv.status] || inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {inv.original_file_url && (
                          <a href={inv.original_file_url} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Ver original"><Eye size={16} /></a>
                        )}
                        {inv.status === 'pending_review' && (
                          <>
                            <button onClick={() => handleValidate(inv.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Validar"><Check size={16} /></button>
                            <button onClick={() => handleReject(inv.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Rechazar"><X size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
