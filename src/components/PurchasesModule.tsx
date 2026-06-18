import React, { useState, useEffect } from 'react';
import { ShoppingCart, Upload, Check, X, AlertCircle, Plus, Loader2, Eye, TrendingUp, TrendingDown, Download, Pencil, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePurchaseInvoices, useSuppliers, useCreateSupplier, useGastosItems } from '../hooks/useData';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import { generateLibroIVA } from '../lib/generateLibroIVA';
import { useImplementationStore } from '../store/useImplementationStore';

type InvoiceTab = 'compras' | 'ventas';

export const PurchasesModule: React.FC = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    useImplementationStore.getState().completeItem('e2-7');
  }, []);
  const { data: invoices = [], isLoading, refetch } = usePurchaseInvoices();
  const { data: suppliers = [] } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const { data: gastosItems = [] } = useGastosItems();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrError, setOcrError] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', cuit: '', tax_condition: 'RI' });
  const [activeTab, setActiveTab] = useState<InvoiceTab>('compras');
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [uploadTipo, setUploadTipo] = useState<'compra' | 'venta'>('compra');

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
        body: { fileUrl: publicUrl, invoiceId: record.id, tipo: uploadTipo },
      });

      if (fnError) {
        // Try to read error details from response
        const errMsg = typeof fnError === 'object' && fnError.message ? fnError.message : String(fnError);
        setOcrError(`Error de función: ${errMsg}`);
        refetch();
      } else if (fnData?.success) {
        setOcrResult(fnData.data);
        refetch();
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        useImplementationStore.getState().completeItem('e2-9');
        useImplementationStore.getState().completeItem('c2-5');
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
    useImplementationStore.getState().completeItem('e2-10');
    refetch();
  };

  const handleReject = async (id: string) => {
    await supabase.from('purchase_invoices').update({ status: 'rejected' }).eq('id', id);
    refetch();
  };

  const formatARS = (v: number | null) => v ? `$ ${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '$ 0';

  // ─── Smart classification: emisor = ECAR → venta, receptor = ECAR → compra ───
  const ECAR_NAMES = ['ecar', 'ecar sas', 'ecar s.a.s.', 'ecar s.a.s', 'ecar construcciones', 'carlos adolfo regalado', 'regalado carlos adolfo', 'regalado carlos'];

  function isEcar(name: string | undefined | null): boolean {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    return ECAR_NAMES.some(e => n.includes(e));
  }

  function classifyInvoice(inv: any): 'compra' | 'venta' {
    const ocr = inv.ocr_raw_data || {};
    // Check emisor/receptor fields if available
    const emisor = ocr.emisor || ocr.razon_social_emisor || '';
    const receptor = ocr.receptor || ocr.razon_social_receptor || '';
    const provCliente = ocr.proveedor_cliente || '';

    // If emisor is ECAR → it's a sale (ECAR emitted this invoice)
    if (isEcar(emisor)) return 'venta';
    // If receptor is ECAR → it's a purchase (ECAR received this invoice)
    if (isEcar(receptor)) return 'compra';

    // Fallback: if tipo from OCR is explicitly set
    if (ocr.tipo === 'venta') return 'venta';
    if (ocr.tipo === 'compra') return 'compra';

    // Last resort: if proveedor_cliente matches ECAR, it might be misclassified
    // In a COMPRA, proveedor_cliente should be the OTHER party, not ECAR
    // If proveedor_cliente IS ECAR, then it's likely a venta where the OCR put ECAR as proveedor
    if (isEcar(provCliente)) return 'venta';

    // Default: compra
    return 'compra';
  }

  const compras = invoices.filter((i: any) => classifyInvoice(i) === 'compra');
  const ventas = invoices.filter((i: any) => classifyInvoice(i) === 'venta');
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
        <div className="space-y-3">
          {/* Tipo selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setUploadTipo('compra')} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${uploadTipo === 'compra' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <TrendingDown size={14} /> Compra
            </button>
            <button onClick={() => setUploadTipo('venta')} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${uploadTipo === 'venta' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <TrendingUp size={14} /> Venta
            </button>
          </div>
          <label className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all block ${uploading || processing ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-ecar-blue hover:bg-blue-50/50'}`}>
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
          <p className="text-xs text-gray-400 text-center">Se cargará como <span className={`font-bold ${uploadTipo === 'compra' ? 'text-violet-600' : 'text-emerald-600'}`}>{uploadTipo === 'compra' ? '📥 Compra' : '📤 Venta'}</span></p>
        </div>

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
              onClick={() => {
                generateLibroIVA(invoices as any, periodoDesde, periodoHasta);
                useImplementationStore.getState().completeItem('e2-11');
                useImplementationStore.getState().completeItem('c2-6');
              }}
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
                  {activeTab === 'compras' && <th className="px-4 py-3">Rubro de Gasto</th>}
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
                    {activeTab === 'compras' && (
                      <td className="px-4 py-3">
                        <select
                          value={inv.gasto_item_id || ''}
                          onChange={async (e) => {
                            const val = e.target.value || null;
                            const { error } = await supabase
                              .from('purchase_invoices')
                              .update({ gasto_item_id: val })
                              .eq('id', inv.id);
                            if (error) {
                              console.error('Error al asociar rubro:', error.message);
                              alert('Error al asociar rubro: ' + error.message);
                            }
                            refetch();
                          }}
                          className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all max-w-[180px] truncate"
                        >
                          <option value="">-- Sin Vincular --</option>
                          {gastosItems.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.categoria.toUpperCase()} - {item.descripcion}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
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
                        <button onClick={() => { setEditingInvoice(inv); setEditForm({ supplier_name: inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || '', supplier_cuit: inv.ocr_raw_data?.cuit || '', invoice_type: inv.invoice_type || inv.ocr_raw_data?.tipo_factura || '', point_of_sale: inv.point_of_sale || inv.ocr_raw_data?.punto_venta || '', invoice_number: inv.invoice_number || inv.ocr_raw_data?.numero_factura || '', issue_date: inv.issue_date || '', net_amount_ars: inv.net_amount_ars || 0, iva_21_ars: inv.iva_21_ars || 0, total_ars: inv.total_ars || 0, status: inv.status }); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(inv)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Editar Factura</h3>
              <button onClick={() => setEditingInvoice(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">Proveedor / Cliente</label>
                <input value={editForm.supplier_name} onChange={e => setEditForm({ ...editForm, supplier_name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">CUIT</label>
                <input value={editForm.supplier_cuit} onChange={e => setEditForm({ ...editForm, supplier_cuit: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Tipo Factura</label>
                <input value={editForm.invoice_type} onChange={e => setEditForm({ ...editForm, invoice_type: e.target.value })} placeholder="A, B, C..." className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Punto de Venta</label>
                <input value={editForm.point_of_sale} onChange={e => setEditForm({ ...editForm, point_of_sale: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">N° Factura</label>
                <input value={editForm.invoice_number} onChange={e => setEditForm({ ...editForm, invoice_number: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Fecha Emisión</label>
                <input type="date" value={editForm.issue_date} onChange={e => setEditForm({ ...editForm, issue_date: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Neto Gravado ($)</label>
                <input type="number" value={editForm.net_amount_ars} onChange={e => { const net = parseFloat(e.target.value) || 0; setEditForm({ ...editForm, net_amount_ars: net, iva_21_ars: Math.round(net * 0.21 * 100) / 100, total_ars: Math.round((net + net * 0.21) * 100) / 100 }); }} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">IVA 21% ($)</label>
                <input type="number" value={editForm.iva_21_ars} onChange={e => { const iva = parseFloat(e.target.value) || 0; setEditForm({ ...editForm, iva_21_ars: iva, total_ars: Math.round(((editForm.net_amount_ars || 0) + iva) * 100) / 100 }); }} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Total ($)</label>
                <input type="number" value={editForm.total_ars} onChange={e => setEditForm({ ...editForm, total_ars: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Estado</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="pending_review">Revisar</option>
                  <option value="validated">Validado</option>
                  <option value="rejected">Rechazado</option>
                  <option value="exported">Exportado</option>
                </select>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const ocr = { ...(editingInvoice.ocr_raw_data || {}), proveedor_cliente: editForm.supplier_name, cuit: editForm.supplier_cuit, tipo_factura: editForm.invoice_type, punto_venta: editForm.point_of_sale, numero_factura: editForm.invoice_number };
                  const { error } = await supabase.from('purchase_invoices').update({ invoice_type: editForm.invoice_type, point_of_sale: editForm.point_of_sale, invoice_number: editForm.invoice_number, issue_date: editForm.issue_date, net_amount_ars: editForm.net_amount_ars, iva_21_ars: editForm.iva_21_ars, total_ars: editForm.total_ars, status: editForm.status, ocr_raw_data: ocr }).eq('id', editingInvoice.id);
                  if (error) throw error;
                  setEditingInvoice(null);
                  refetch();
                } catch (err: any) { alert(err.message); }
              }}
              className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm hover:bg-ecar-blueDark transition-colors"
            >
              ✓ Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Eliminar Factura</h3>
            <p className="text-sm text-gray-600">
              ¿Eliminás la factura de <span className="font-bold">{deleteTarget.ocr_raw_data?.proveedor_cliente || deleteTarget.supplier?.name || 'Sin datos'}</span> por <span className="font-mono font-bold">{formatARS(deleteTarget.total_ars)}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Cancelar</button>
              <button
                onClick={async () => {
                  try {
                    const { error } = await supabase.from('purchase_invoices').delete().eq('id', deleteTarget.id);
                    if (error) throw error;
                    setDeleteTarget(null);
                    refetch();
                  } catch (err: any) { alert(err.message); }
                }}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
