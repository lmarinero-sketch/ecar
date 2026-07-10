import React, { useState, useEffect } from 'react';
import { ShoppingCart, Upload, Check, X, AlertCircle, Plus, Loader2, Eye, TrendingUp, TrendingDown, Download, Pencil, Trash2, Database, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePurchaseInvoices, useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useGastosItems, useProjects, useUpdateInvoiceAllocations, useBudgetResources, useCreateBudgetResource, useUpdateBudgetResource, useDeleteBudgetResource } from '../hooks/useData';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import { generateLibroIVA } from '../lib/generateLibroIVA';
import { useModalStore } from '../store/useModalStore';
import { useImplementationStore } from '../store/useImplementationStore';
import * as XLSX from 'xlsx';

type InvoiceTab = 'compras' | 'ventas' | 'banco';

const BancoPreciosTab: React.FC = () => {
  const { data: resources = [], isLoading } = useBudgetResources();
  const createResource = useCreateBudgetResource();
  const updateResource = useUpdateBudgetResource();
  const deleteResource = useDeleteBudgetResource();
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', resource_type: 'material' as 'material' | 'mano_obra' | 'equipo' | 'subcontrato', unit: 'un', unit_price_ars: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{created: number, updated: number} | null>(null);

  const filtered = resources.filter((r: any) => 
    (filterType === 'all' || r.resource_type === filterType) &&
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (editItem) {
      await updateResource.mutateAsync({ id: editItem.id, ...form });
    } else {
      await createResource.mutateAsync(form as any);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('¿Eliminar este insumo del Banco de Precios?')) {
      await deleteResource.mutateAsync(id);
    }
  };

  const openEdit = (r: any) => {
    setEditItem(r);
    setForm({ name: r.name, resource_type: r.resource_type, unit: r.unit, unit_price_ars: r.unit_price_ars });
    setShowForm(true);
  };

  const handleDownloadTemplate = () => {
    const data = [
      { Tipo: 'material', Descripcion: 'Cemento Loma Negra 50kg', Unidad: 'bl', Precio_Unitario: 8500 },
      { Tipo: 'mano_obra', Descripcion: 'Oficial Albañil', Unidad: 'hs', Precio_Unitario: 4500 }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BancoPrecios");
    XLSX.writeFile(wb, "Plantilla_Banco_Precios.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let created = 0;
        let updated = 0;

        for (const row of data as any[]) {
          const type = row.Tipo || 'material';
          const name = row.Descripcion || row.Descripción;
          const unit = row.Unidad || 'un';
          const price = parseFloat(row.Precio_Unitario) || 0;

          if (!name) continue;

          // Find if exists
          const existing = resources.find((r: any) => r.name.toLowerCase() === name.toLowerCase());

          if (existing) {
            await updateResource.mutateAsync({
              id: existing.id,
              resource_type: type,
              name: name,
              unit: unit,
              unit_price_ars: price
            });
            updated++;
          } else {
            await createResource.mutateAsync({
              resource_type: type,
              name: name,
              unit: unit,
              unit_price_ars: price
            });
            created++;
          }
        }
        setImportSummary({ created, updated });
      } catch (error) {
        console.error("Error importing excel:", error);
        alert("Ocurrió un error al importar el archivo Excel.");
      } finally {
        setIsImporting(false);
        e.target.value = ''; // reset input
      }
    };
    reader.readAsBinaryString(file);
  };

  const formatARS = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-3 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar en el banco de precios..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50">
            <option value="all">Todos los rubros</option>
            <option value="material">Materiales</option>
            <option value="mano_obra">Mano de Obra</option>
            <option value="equipo">Equipos</option>
            <option value="subcontrato">Subcontratos</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleDownloadTemplate} className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
            <Download size={16} /> Plantilla
          </button>
          <label className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors cursor-pointer">
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {isImporting ? 'Importando...' : 'Importar Excel'}
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} disabled={isImporting} />
          </label>
          <button onClick={() => { setEditItem(null); setForm({ name: '', resource_type: 'material' as any, unit: 'un', unit_price_ars: 0 }); setShowForm(true); }} className="bg-ecar-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors">
            <Plus size={16} /> Nuevo Insumo
          </button>
        </div>
      </div>

      {importSummary && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-3">
          <Check className="text-green-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold">Importación exitosa</h4>
            <p className="text-sm text-green-700">Se actualizaron {importSummary.updated} insumos y se crearon {importSummary.created} nuevos.</p>
          </div>
          <button onClick={() => setImportSummary(null)} className="ml-auto text-green-600 hover:bg-green-100 p-1 rounded-md"><X size={16} /></button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Precio Unitario</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-gray-400" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay insumos registrados.</td></tr>
            ) : filtered.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">{r.resource_type === 'material' ? 'Material' : r.resource_type === 'mano_obra' ? 'Mano Obra' : r.resource_type === 'equipo' ? 'Equipo' : 'Subcontrato'}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.unit}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-ecar-blue">{formatARS(r.unit_price_ars)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(r)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">{editItem ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-md"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Tipo de Recurso</label>
                <select value={form.resource_type} onChange={e => setForm({...form, resource_type: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50">
                  <option value="material">Material</option>
                  <option value="mano_obra">Mano de Obra</option>
                  <option value="equipo">Equipo</option>
                  <option value="subcontrato">Subcontrato</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Descripción</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Cemento Loma Negra 50kg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Unidad</label>
                  <input type="text" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="bl, m2, m3, un" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Precio Unitario ($)</label>
                  <input type="number" step="0.01" value={form.unit_price_ars || ''} onChange={e => setForm({...form, unit_price_ars: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={createResource.isPending || updateResource.isPending || !form.name} className="px-4 py-2 font-bold text-white bg-ecar-blue hover:bg-blue-800 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                <Check size={16} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PurchasesModule: React.FC = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    useImplementationStore.getState().completeItem('e2-7');
  }, []);
  const { data: invoices = [], isLoading, refetch } = usePurchaseInvoices();
  const { data: suppliers = [] } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const { data: gastosItems = [] } = useGastosItems();
  const { data: projects = [] } = useProjects();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [distributeInvoice, setDistributeInvoice] = useState<any>(null);
  const [allocations, setAllocations] = useState<{project_id: string, percentage: number, amount_ars: number}[]>([]);
  const updateAllocations = useUpdateInvoiceAllocations();
  const [ocrError, setOcrError] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', cuit: '', tax_condition: 'RI' });
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [editingSupplierForm, setEditingSupplierForm] = useState({ name: '', cuit: '' });
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [activeTab, setActiveTab] = useState<InvoiceTab>('compras');
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [uploadTipo, setUploadTipo] = useState<'compra' | 'venta'>('compra');
  const [searchProvider, setSearchProvider] = useState('');

  // Periodo for Libro IVA export
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [periodoDesde, setPeriodoDesde] = useState(firstDay.toISOString().split('T')[0]);
  const [periodoHasta, setPeriodoHasta] = useState(lastDay.toISOString().split('T')[0]);
  const [dateFilterMode, setDateFilterMode] = useState<'current' | 'last_month' | 'last_3_months' | 'custom'>('current');

  const applyQuickFilter = (mode: 'current' | 'last_month' | 'last_3_months' | 'custom') => {
    setDateFilterMode(mode);
    const today = new Date();
    if (mode === 'current') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setPeriodoDesde(first.toISOString().split('T')[0]);
      setPeriodoHasta(last.toISOString().split('T')[0]);
    } else if (mode === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      setPeriodoDesde(first.toISOString().split('T')[0]);
      setPeriodoHasta(last.toISOString().split('T')[0]);
    } else if (mode === 'last_3_months') {
      const first = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setPeriodoDesde(first.toISOString().split('T')[0]);
      setPeriodoHasta(last.toISOString().split('T')[0]);
    }
  };

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
        const finalData = fnData.data;
        
        // FORZAR SIEMPRE el tipo de operación según lo que seleccionó el usuario,
        // descartando cualquier clasificación errónea de la IA.
        finalData.tipo = uploadTipo;
        
        // Actualizamos el registro en la DB para guardar la decisión final
        await supabase.from('purchase_invoices').update({
          ocr_raw_data: finalData
        }).eq('id', record.id);
        
        setOcrResult(finalData);
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
    
    // Explicit type from OCR has highest priority (case insensitive)
    const explicitTipo = (ocr.tipo || '').toLowerCase();
    if (explicitTipo === 'venta') return 'venta';
    if (explicitTipo === 'compra') return 'compra';

    // Check emisor/receptor fields if available
    const emisor = ocr.emisor || ocr.razon_social_emisor || '';
    const receptor = ocr.receptor || ocr.razon_social_receptor || '';
    const provCliente = ocr.proveedor_cliente || '';

    // If emisor is ECAR → it's a sale (ECAR emitted this invoice)
    if (isEcar(emisor)) return 'venta';
    // If receptor is ECAR → it's a purchase (ECAR received this invoice)
    if (isEcar(receptor)) return 'compra';

    // Last resort: if proveedor_cliente matches ECAR, it might be misclassified
    // In a COMPRA, proveedor_cliente should be the OTHER party, not ECAR
    // If proveedor_cliente IS ECAR, then it's likely a venta where the OCR put ECAR as proveedor
    if (isEcar(provCliente)) return 'venta';

    // Default: compra
    return 'compra';
  }

  function isCreditNote(type: string | undefined): boolean {
    if (!type || typeof type !== 'string') return false;
    const t = type.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return t.startsWith('NC') || t.includes('NOTA DE CREDITO') || t.includes('CREDITO');
  }

  const filteredInvoices = invoices.filter((i: any) => {
    if (!i.issue_date) return false;
    return i.issue_date >= periodoDesde && i.issue_date <= periodoHasta;
  });

  const compras = filteredInvoices.filter((i: any) => classifyInvoice(i) === 'compra');
  const ventas = filteredInvoices.filter((i: any) => classifyInvoice(i) === 'venta');
  const currentList = activeTab === 'compras' ? compras : ventas;

  // Totals
  const getMultiplier = (inv: any) => isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) ? -1 : 1;
  const totNeto = currentList.reduce((s: number, i: any) => s + (Number(i.net_amount_ars || 0) * getMultiplier(i)), 0);
  const totIva = currentList.reduce((s: number, i: any) => s + ((Number(i.iva_21_ars || 0) + Number(i.iva_105_ars || 0) + Number(i.iva_27_ars || 0)) * getMultiplier(i)), 0);
  const totTotal = currentList.reduce((s: number, i: any) => s + (Number(i.total_ars || 0) * getMultiplier(i)), 0);

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
              <div key={s.id} className="group flex justify-between items-center text-sm py-1.5 px-2 hover:bg-gray-50 rounded">
                {editingSupplier === s.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input className="border rounded px-2 py-1 text-xs w-1/2" value={editingSupplierForm.name} onChange={e => setEditingSupplierForm({ ...editingSupplierForm, name: e.target.value })} />
                    <input className="border rounded px-2 py-1 text-xs w-1/3" value={editingSupplierForm.cuit} onChange={e => setEditingSupplierForm({ ...editingSupplierForm, cuit: e.target.value })} />
                    <button onClick={async () => { await updateSupplier.mutateAsync({ id: s.id, ...editingSupplierForm }); setEditingSupplier(null); }} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14}/></button>
                    <button onClick={() => setEditingSupplier(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={14}/></button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{s.name}</span>
                      <span className="text-gray-400 font-mono text-xs ml-2">{s.cuit || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingSupplier(s.id); setEditingSupplierForm({ name: s.name, cuit: s.cuit || '' }); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Editar"><Pencil size={14} /></button>
                      <button onClick={async () => {
                        if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar proveedor?')) {
                          try {
                            await deleteSupplier.mutateAsync(s.id);
                          } catch (err: any) {
                            useModalStore.getState().showAlert('Error', 'No se puede eliminar el proveedor porque tiene facturas u otros registros asociados.');
                          }
                        }
                      }} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
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

      {/* Global Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-bold text-gray-700">Filtro de período</div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => applyQuickFilter('current')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'current' ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>Mes Actual</button>
            <button onClick={() => applyQuickFilter('last_month')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'last_month' ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>Mes Pasado</button>
            <button onClick={() => applyQuickFilter('last_3_months')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'last_3_months' ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>Últ. 3 Meses</button>
            <div className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'custom' ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500'}`}>Personalizado</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-gray-500 font-medium">Desde:</label>
            <input type="date" value={periodoDesde} onChange={e => { setPeriodoDesde(e.target.value); setDateFilterMode('custom'); }} className="border rounded px-2 py-1.5 text-xs bg-gray-50 focus:bg-white" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-gray-500 font-medium">Hasta:</label>
            <input type="date" value={periodoHasta} onChange={e => { setPeriodoHasta(e.target.value); setDateFilterMode('custom'); }} className="border rounded px-2 py-1.5 text-xs bg-gray-50 focus:bg-white" />
          </div>
        </div>
      </div>

      {/* Tabs: Compras / Ventas / Banco */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setActiveTab('compras')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'compras' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <TrendingDown size={16} /> Compras ({compras.length})
        </button>
        <button onClick={() => setActiveTab('ventas')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ventas' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <TrendingUp size={16} /> Ventas ({ventas.length})
        </button>
        <button onClick={() => setActiveTab('banco')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'banco' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Database size={16} /> Banco de Precios
        </button>
      </div>

      {/* Totals bar (Only for invoices) */}
      {activeTab !== 'banco' && (
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

      {/* Main Content */}
      {activeTab === 'banco' ? (
        <BancoPreciosTab />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-3">
          <h3 className="font-bold text-gray-800">Libro IVA — {activeTab === 'compras' ? 'Compras' : 'Ventas'}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                generateLibroIVA(filteredInvoices as any, periodoDesde, periodoHasta);
                useImplementationStore.getState().completeItem('e2-11');
                useImplementationStore.getState().completeItem('c2-6');
              }}
              disabled={filteredInvoices.length === 0}
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
                  {activeTab === 'compras' && <th className="px-4 py-3">Centro de Costo</th>}
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentList.map((inv: any) => {
                  const isNC = isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura);
                  return (
                  <tr key={inv.id} className={`hover:bg-gray-50 ${isNC ? 'bg-red-50/50 border-l-4 border-red-500' : ''}`}>
                    <td className="px-4 py-3 font-medium">{inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || '(Sin datos)'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.ocr_raw_data?.cuit || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_type || inv.ocr_raw_data?.tipo_factura || '—'} {inv.point_of_sale || inv.ocr_raw_data?.punto_venta || ''}-{inv.invoice_number || inv.ocr_raw_data?.numero_factura || ''}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.issue_date || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) && <span className="text-red-500 font-bold mr-1">-</span>}
                      {formatARS(inv.net_amount_ars)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">
                      {isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) && <span className="text-red-500 font-bold mr-1">-</span>}
                      {formatARS(inv.iva_21_ars)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) && <span className="text-red-500 font-bold mr-1">-</span>}
                      {formatARS(inv.total_ars)}
                    </td>
                    {activeTab === 'compras' && (
                      <td className="px-4 py-3">
                        <select
                          value={inv.gasto_item_id || ''}
                          onChange={async (e) => {
                            try {
                              const val = e.target.value || null;
                              const { error } = await supabase
                                .from('purchase_invoices')
                                .update({ gasto_item_id: val })
                                .eq('id', inv.id);
                              if (error) throw error;
                              refetch();
                            } catch (error: any) {
                              useModalStore.getState().showAlert('Error', 'Error al asociar rubro: ' + error.message);
                            }
                          }}
                          className="px-2 py-1 text-[10px] border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all max-w-[130px] truncate"
                        >
                          <option value="">-- Sin Rubro --</option>
                          {gastosItems.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.categoria.toUpperCase()} - {item.descripcion}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {activeTab === 'compras' && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setDistributeInvoice(inv);
                            if (inv.allocations && inv.allocations.length > 0) {
                              setAllocations(inv.allocations.map((a: any) => ({
                                project_id: a.project_id,
                                percentage: a.percentage,
                                amount_ars: a.amount_ars
                              })));
                            } else if (inv.project_id) {
                              setAllocations([{ project_id: inv.project_id, percentage: 100, amount_ars: inv.total_ars }]);
                            } else {
                              setAllocations([]);
                            }
                          }}
                          className="px-2 py-1 text-[10px] border border-blue-200 rounded-lg bg-blue-50 text-blue-800 font-bold focus:outline-none hover:bg-blue-100 transition-all truncate"
                        >
                          {(inv.allocations && inv.allocations.length > 0) 
                            ? `Dividido (${inv.allocations.length})` 
                            : inv.project_id 
                              ? '🚧 Obra (100%)' 
                              : '🏢 ECAR (100%)'}
                        </button>
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
                        <button onClick={() => { setEditingInvoice(inv); setEditForm({ supplier_name: inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || '', supplier_cuit: inv.ocr_raw_data?.cuit || '', invoice_type: inv.invoice_type || inv.ocr_raw_data?.tipo_factura || '', point_of_sale: inv.point_of_sale || inv.ocr_raw_data?.punto_venta || '', invoice_number: inv.invoice_number || inv.ocr_raw_data?.numero_factura || '', issue_date: inv.issue_date || '', net_amount_ars: inv.net_amount_ars || 0, iva_21_ars: inv.iva_21_ars || 0, total_ars: inv.total_ars || 0, status: inv.status, tipo_operacion: inv.ocr_raw_data?.tipo || classifyInvoice(inv), related_invoice_id: inv.related_invoice_id || '' }); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(inv)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
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
      )}

      {/* Modal OCR Result */}
      {ocrResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Check size={20} className="text-green-500" /> Factura Procesada
              </h3>
              <button onClick={() => setOcrResult(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500 font-bold uppercase">Proveedor</p><p className="font-medium text-gray-800">{ocrResult.proveedor_cliente}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">CUIT</p><p className="font-mono text-sm">{ocrResult.cuit || 'No detectado'}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">Nro Factura</p><p className="font-mono text-sm">{ocrResult.tipo_factura || 'A'} {ocrResult.punto_venta || '0000'}-{ocrResult.numero_factura}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">Fecha Emisión</p><p className="font-mono text-sm">{ocrResult.fecha_emision || 'No detectada'}</p></div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 border border-gray-100">
              <div><p className="text-xs text-gray-500 font-bold uppercase">Neto Gravado</p><p className="font-mono font-medium text-gray-800">${(ocrResult.neto_gravado || 0).toLocaleString('es-AR')}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">IVA (Total)</p><p className="font-mono font-medium text-gray-800">${((ocrResult.iva_21 || 0) + (ocrResult.iva_105 || 0) + (ocrResult.iva_27 || 0)).toLocaleString('es-AR')}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">Total Factura</p><p className="font-mono font-bold text-ecar-blue text-lg">${(ocrResult.total || 0).toLocaleString('es-AR')}</p></div>
            </div>
            
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <strong>Nota:</strong> Los datos fueron extraídos automáticamente. La factura fue guardada en estado <strong>Pendiente de revisión</strong>. Si encontrás algún error, podés editarla desde la tabla.
            </p>

            <div className="flex justify-end pt-2">
              <button onClick={() => setOcrResult(null)} className="bg-ecar-blue hover:bg-blue-800 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Distribuir Costos */}
      {distributeInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                Distribuir Centro de Costos
              </h3>
              <button onClick={() => setDistributeInvoice(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Factura</p>
                <p className="font-mono font-medium">{distributeInvoice.supplier?.name || 'S/D'} (Nº {distributeInvoice.invoice_number})</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase">Monto Total</p>
                <p className="font-mono font-bold text-ecar-blue text-lg">${distributeInvoice.total_ars.toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">Distribución de Costos por Obra</label>
              
              {allocations.map((alloc, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                  <select
                    value={alloc.project_id}
                    onChange={(e) => {
                      const newAlloc = [...allocations];
                      newAlloc[idx].project_id = e.target.value;
                      setAllocations(newAlloc);
                    }}
                    className="flex-1 px-2 py-1.5 border rounded text-sm focus:outline-none"
                  >
                    <option value="">Seleccionar obra...</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  
                  <div className="w-24 relative">
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={alloc.percentage} 
                      onChange={(e) => {
                        const newAlloc = [...allocations];
                        const perc = parseFloat(e.target.value) || 0;
                        newAlloc[idx].percentage = perc;
                        newAlloc[idx].amount_ars = (perc / 100) * distributeInvoice.total_ars;
                        setAllocations(newAlloc);
                      }}
                      className="w-full px-2 py-1.5 border rounded text-sm pr-6 focus:outline-none" 
                    />
                    <span className="absolute right-2 top-2 text-gray-400 text-xs">%</span>
                  </div>
                  
                  <div className="w-36 relative">
                    <span className="absolute left-2 top-2 text-gray-400 text-xs">$</span>
                    <input 
                      type="number" 
                      min="0"
                      value={alloc.amount_ars} 
                      onChange={(e) => {
                        const newAlloc = [...allocations];
                        const amt = parseFloat(e.target.value) || 0;
                        newAlloc[idx].amount_ars = amt;
                        newAlloc[idx].percentage = (amt / distributeInvoice.total_ars) * 100;
                        setAllocations(newAlloc);
                      }}
                      className="w-full px-2 py-1.5 pl-6 border rounded text-sm focus:outline-none" 
                    />
                  </div>
                  
                  <button onClick={() => {
                    const newAlloc = [...allocations];
                    newAlloc.splice(idx, 1);
                    setAllocations(newAlloc);
                  }} className="text-red-500 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button 
                onClick={() => {
                  setAllocations([...allocations, { project_id: '', percentage: 0, amount_ars: 0 }]);
                }}
                className="text-sm font-bold text-ecar-blue hover:text-blue-800 flex items-center gap-1 mt-2"
              >
                <Plus size={16} /> Agregar Obra
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="text-sm">
                <p>Total Asignado: <strong>${allocations.reduce((sum, a) => sum + a.amount_ars, 0).toLocaleString('es-AR')}</strong> ({allocations.reduce((sum, a) => sum + a.percentage, 0).toFixed(2)}%)</p>
                {allocations.reduce((sum, a) => sum + a.percentage, 0) < 99.9 && (
                  <p className="text-xs text-amber-600">Lo restante se asignará como costo general (ECAR).</p>
                )}
                {allocations.reduce((sum, a) => sum + a.percentage, 0) > 100.1 && (
                  <p className="text-xs text-red-600 font-bold">Error: Has superado el 100% de la factura.</p>
                )}
              </div>
              <button 
                onClick={async () => {
                  if (allocations.reduce((sum, a) => sum + a.percentage, 0) > 100.1) {
                    useModalStore.getState().showAlert('Error', 'La distribución no puede superar el 100%.');
                    return;
                  }
                  
                  // Formatear payload para la base de datos
                  const formattedAllocations = allocations
                    .filter(a => a.project_id && a.percentage > 0)
                    .map(a => ({
                      tenant_id: ECAR_TENANT_ID,
                      invoice_id: distributeInvoice.id,
                      project_id: a.project_id,
                      percentage: a.percentage,
                      amount_ars: a.amount_ars
                    }));

                  await updateAllocations.mutateAsync({
                    invoice_id: distributeInvoice.id,
                    allocations: formattedAllocations
                  });

                  setDistributeInvoice(null);
                }}
                disabled={updateAllocations.isPending}
                className="bg-ecar-blue hover:bg-blue-800 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
              >
                {updateAllocations.isPending ? 'Guardando...' : 'Guardar Distribución'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label className="text-xs font-bold text-gray-500">Clasificación</label>
                <select value={editForm.tipo_operacion} onChange={e => setEditForm({ ...editForm, tipo_operacion: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="compra">Compra</option>
                  <option value="venta">Venta</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">CUIT</label>
                <input value={editForm.supplier_cuit} onChange={e => setEditForm({ ...editForm, supplier_cuit: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Tipo Factura</label>
                <select value={editForm.invoice_type} onChange={e => setEditForm({ ...editForm, invoice_type: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                  <optgroup label="Facturas">
                    <option value="A">Factura A</option>
                    <option value="B">Factura B</option>
                    <option value="C">Factura C</option>
                    <option value="M">Factura M</option>
                  </optgroup>
                  <optgroup label="Notas de Crédito">
                    <option value="NCA">Nota de Crédito A (NCA)</option>
                    <option value="NCB">Nota de Crédito B (NCB)</option>
                    <option value="NCC">Nota de Crédito C (NCC)</option>
                    <option value="NCM">Nota de Crédito M (NCM)</option>
                  </optgroup>
                  <optgroup label="Notas de Débito">
                    <option value="NDA">Nota de Débito A (NDA)</option>
                    <option value="NDB">Nota de Débito B (NDB)</option>
                    <option value="NDC">Nota de Débito C (NDC)</option>
                    <option value="NDM">Nota de Débito M (NDM)</option>
                  </optgroup>
                  <option value={editForm.invoice_type} hidden>{editForm.invoice_type}</option>
                </select>
              </div>

              {isCreditNote(editForm.invoice_type) && (
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500">Factura Asociada (Buscador)</label>
                  {editForm.related_invoice_id ? (
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-2 rounded-lg">
                      <span className="text-sm font-medium text-blue-800 truncate">
                        {invoices.find((i:any) => i.id === editForm.related_invoice_id) 
                          ? (() => {
                              const i = invoices.find((inv:any) => inv.id === editForm.related_invoice_id);
                              return i ? `${i.invoice_type || 'FA'} ${i.point_of_sale}-${i.invoice_number} | ${formatARS(i.total_ars)}` : '';
                            })()
                          : `ID: ${editForm.related_invoice_id.substring(0,8)}...`
                        }
                      </span>
                      <button onClick={() => setEditForm({...editForm, related_invoice_id: null})} className="text-blue-500 hover:text-blue-700 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-blue-100">Cambiar</button>
                    </div>
                  ) : (
                    <>
                      <input type="text" placeholder="🔍 Escribí para buscar por proveedor..." value={searchProvider} onChange={e => setSearchProvider(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" />
                      <div className="max-h-32 overflow-y-auto border rounded-lg bg-gray-50 divide-y shadow-inner">
                        {invoices
                          .filter((inv: any) => !isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura))
                          .filter((inv: any) => {
                             const prov = (inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || '').toLowerCase();
                             return searchProvider === '' || prov.includes(searchProvider.toLowerCase());
                          })
                          .map((inv: any) => (
                          <div key={inv.id} onClick={() => setEditForm({...editForm, related_invoice_id: inv.id})} className="p-2 hover:bg-blue-100 cursor-pointer text-sm flex flex-col md:flex-row md:justify-between transition-colors">
                            <span className="font-bold truncate max-w-[50%]">{(inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || 'Sin Proveedor')}</span>
                            <span className="text-gray-600 text-xs md:text-sm mt-0.5 md:mt-0">{inv.invoice_type || 'FA'} {inv.point_of_sale}-{inv.invoice_number} | <span className="font-bold font-mono">{formatARS(inv.total_ars)}</span></span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
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
                  // Validación de duplicados en Frontend
                  const isDuplicate = invoices.some((i: any) => 
                    i.id !== editingInvoice.id &&
                    i.supplier_id === editingInvoice.supplier_id &&
                    i.invoice_type === editForm.invoice_type &&
                    i.invoice_number === editForm.invoice_number &&
                    (i.point_of_sale || '') === (editForm.point_of_sale || '') &&
                    i.status !== 'rejected'
                  );

                  if (isDuplicate) {
                    useModalStore.getState().showAlert('Factura Duplicada', `Ya existe una factura ${editForm.invoice_type} ${editForm.point_of_sale}-${editForm.invoice_number} cargada para este proveedor.`);
                    return;
                  }

                  const ocr = { ...(editingInvoice.ocr_raw_data || {}), proveedor_cliente: editForm.supplier_name, cuit: editForm.supplier_cuit, tipo_factura: editForm.invoice_type, punto_venta: editForm.point_of_sale, numero_factura: editForm.invoice_number, tipo: editForm.tipo_operacion };
                  const { error } = await supabase.from('purchase_invoices').update({ invoice_type: editForm.invoice_type, point_of_sale: editForm.point_of_sale, invoice_number: editForm.invoice_number, issue_date: editForm.issue_date, net_amount_ars: editForm.net_amount_ars, iva_21_ars: editForm.iva_21_ars, total_ars: editForm.total_ars, status: editForm.status, ocr_raw_data: ocr, related_invoice_id: editForm.related_invoice_id || null }).eq('id', editingInvoice.id);
                  if (error) throw error;
                  setEditingInvoice(null);
                  refetch();
                } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); }
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
                  } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); }
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
