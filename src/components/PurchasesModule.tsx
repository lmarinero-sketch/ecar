import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Upload, Check, X, AlertCircle, Plus, Loader2, Eye,
  TrendingUp, TrendingDown, Download, Pencil, Trash2, Database, Search,
  Building2, CreditCard, ChevronDown, ChevronRight, Package, Truck,
  CheckCircle2, Clock, FileText, Landmark
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usePurchaseInvoices, useSuppliers, useGastosItems, useProjects, useUpdateInvoiceAllocations, useBudgetResources, useCreateBudgetResource, useUpdateBudgetResource, useDeleteBudgetResource, useLegalEntities } from '../hooks/useData';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import { generateLibroIVA } from '../lib/generateLibroIVA';
import { useModalStore } from '../store/useModalStore';
import { useImplementationStore } from '../store/useImplementationStore';
import type { Supplier } from '../lib/types';
import * as XLSX from 'xlsx';

import { LegalEntitiesPanel } from './LegalEntitiesPanel';
import { NewPurchaseInvoiceModal } from './purchases/NewPurchaseInvoiceModal';
import { SupplierMaster } from './purchases/SupplierMaster';
import { SupplierPaymentModal } from './purchases/SupplierPaymentModal';
import { PaymentOrdersTab } from './purchases/PaymentOrdersTab';

type InvoiceTab = 'compras' | 'ventas' | 'proveedores' | 'banco' | 'razones_sociales' | 'ordenes_pago';

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
    if (await useModalStore.getState().showConfirm('Confirmar Eliminación', '¿Eliminar este insumo del Banco de Precios?')) {
      await deleteResource.mutateAsync(id);
      useModalStore.getState().showAlert('Éxito', 'Insumo eliminado del Banco de Precios.');
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
          <button onClick={() => { setEditItem(null); setForm({ name: '', resource_type: 'material' as any, unit: 'un', unit_price_ars: 0 }); setShowForm(true); }} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
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

      <div className="light-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Unidad</th>
              <th className="text-right">Precio Unitario</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-400">No hay insumos registrados.</td></tr>
            ) : filtered.map((r: any) => (
              <tr key={r.id}>
                <td className="text-xs font-bold text-gray-500 uppercase">{r.resource_type === 'material' ? 'Material' : r.resource_type === 'mano_obra' ? 'Mano Obra' : r.resource_type === 'equipo' ? 'Equipo' : 'Subcontrato'}</td>
                <td className="font-medium">{r.name}</td>
                <td className="text-sm text-gray-500">{r.unit}</td>
                <td className="text-right font-mono font-bold text-ecar-blue">{formatARS(r.unit_price_ars)}</td>
                <td>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
  const { profile } = useAuth();

  useEffect(() => {
    useImplementationStore.getState().completeItem('e2-7');
  }, []);
  const { data: invoices = [], isLoading, refetch } = usePurchaseInvoices();
  const { data: suppliers = [] } = useSuppliers();
  const { data: gastosItems = [] } = useGastosItems();
  const { data: projects = [] } = useProjects();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [distributeInvoice, setDistributeInvoice] = useState<any>(null);
  const [allocations, setAllocations] = useState<{project_id: string, percentage: number, amount_ars: number}[]>([]);
  const updateAllocations = useUpdateInvoiceAllocations();
  const [ocrError, setOcrError] = useState('');
  const [activeTab, setActiveTab] = useState<InvoiceTab>('compras');
  const [selectedLegalEntityLibro, setSelectedLegalEntityLibro] = useState<string>('');
  const [editingPurchaseInvoice, setEditingPurchaseInvoice] = useState<any>(null);
  const { data: legalEntities = [] } = useLegalEntities();
  const [selectedLegalEntityId, setSelectedLegalEntityId] = useState<string>('');
  const [uploadTipo, setUploadTipo] = useState<'compra' | 'venta'>('compra');
  const [searchProvider, setSearchProvider] = useState('');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchProvider, activeTab, selectedLegalEntityLibro]);

  const toggleExpandInvoice = (id: string) => {
    setExpandedInvoiceId(prev => prev === id ? null : id);
  };

  const handleDeleteInvoice = async (inv: any) => {
    const provName = inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || 'Proveedor';
    const num = `${inv.invoice_type || 'FC'} ${inv.point_of_sale || '0001'}-${inv.invoice_number || ''}`;
    const total = formatARS(inv.total_ars);

    const confirmed = await useModalStore.getState().showConfirm(
      'Eliminar Factura',
      `¿Estás seguro de que deseás eliminar la factura de "${provName}" (${num}) por un total de ${total}? Se borrarán también los artículos y distribuciones asociadas.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('purchase_invoices').delete().eq('id', inv.id);
      if (error) throw error;
      useModalStore.getState().showAlert('Comprobante Eliminado', `El comprobante ${num} fue eliminado correctamente.`);
      refetch();
    } catch (err: any) {
      useModalStore.getState().showAlert('Error al eliminar', err?.message || 'No se pudo eliminar el comprobante.');
    }
  };

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
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `scans/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from('purchase-scans').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('purchase-scans').getPublicUrl(path);

      // 2. Create pending record
      const { data: record, error: insertError } = await supabase.from('purchase_invoices').insert({
        tenant_id: ECAR_TENANT_ID,
        legal_entity_id: selectedLegalEntityId || null,
        original_file_url: publicUrl,
        status: 'pending_review',
        issue_date: new Date().toISOString().split('T')[0],
        uploaded_by: profile?.id || null,
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
    const inDateRange = i.issue_date >= periodoDesde && i.issue_date <= periodoHasta;
    if (!inDateRange) return false;
    
    if (searchProvider.trim() !== '') {
      const search = searchProvider.toLowerCase().trim();
      const ocr = i.ocr_raw_data || {};
      const fieldsToSearch = [
        ocr.proveedor_cliente,
        ocr.emisor,
        ocr.razon_social_emisor,
        ocr.receptor,
        ocr.razon_social_receptor,
        i.supplier?.business_name,
        ocr.nombre_fantasia,
        i.invoice_number,
        ocr.numero_factura,
        `${i.point_of_sale}-${i.invoice_number}`,
        `${ocr.punto_venta}-${ocr.numero_factura}`
      ].filter(Boolean).map((s: string) => s.toLowerCase());
      
      const matchesSearch = fieldsToSearch.some(f => f.includes(search));
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  const compras = filteredInvoices.filter((i: any) => classifyInvoice(i) === 'compra');
  const ventas = filteredInvoices.filter((i: any) => classifyInvoice(i) === 'venta');
  const currentList = activeTab === 'compras' ? compras : ventas;
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(currentList.length / pageSize);

  const getMultiplier = (inv: any) => isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) ? -1 : 1;
  const totNeto = currentList.reduce((s: number, i: any) => s + (Number(i.net_amount_ars || 0) * getMultiplier(i)), 0);
  const totIva = currentList.reduce((s: number, i: any) => s + ((Number(i.iva_21_ars || 0) + Number(i.iva_105_ars || 0) + Number(i.iva_27_ars || 0)) * getMultiplier(i)), 0);
  const totTotal = currentList.reduce((s: number, i: any) => s + (Number(i.total_ars || 0) * getMultiplier(i)), 0);

  const calculatePosicionIva = (companyId: string) => {
    const compVentas = ventas.filter((i: any) => i.legal_entity_id === companyId);
    const compCompras = compras.filter((i: any) => i.legal_entity_id === companyId);

    const ivaVentas = compVentas.reduce((s: number, i: any) => s + ((Number(i.iva_21_ars || 0) + Number(i.iva_105_ars || 0) + Number(i.iva_27_ars || 0)) * getMultiplier(i)), 0);
    const ivaCompras = compCompras.reduce((s: number, i: any) => s + ((Number(i.iva_21_ars || 0) + Number(i.iva_105_ars || 0) + Number(i.iva_27_ars || 0)) * getMultiplier(i)), 0);

    return { 
      posicion: ivaVentas - ivaCompras,
      ivaVentas,
      ivaCompras
    };
  };


  const statusLabel: Record<string, string> = {
    pending_review: 'Revisar', validated: 'Validado', rejected: 'Rechazado', exported: 'Exportado',
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ShoppingCart size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ShoppingCart size={24} /> Compras & Libro IVA</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Subí una foto o PDF de la factura. La IA extrae automáticamente todos los datos para el Libro IVA.</p>
        </div>
      </div>

      {/* Carga de Comprobantes & OCR Header */}
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Action: Carga Detallada Artículo por Artículo */}
          <div className="lg:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-ecar-blue border border-blue-200/60 rounded-full text-xs font-bold">
              <ShoppingCart size={14} /> Nuevo Circuito de Compras
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Carga Detallada de Comprobantes
            </h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Cargá facturas y notas de crédito/débito artículo por artículo, vinculando directamente los productos del inventario para actualizar stock, precios y bitácora de variaciones en tiempo real.
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  setEditingPurchaseInvoice(null);
                  setShowNewInvoiceModal(true);
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-ecar-blue via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-98 transition-all flex items-center justify-center gap-2.5"
              >
                <Plus size={20} className="stroke-[3]" />
                <span>+ Cargar Comprobante de Compra</span>
              </button>
            </div>
          </div>

          {/* Secondary Action: Escaneo Inteligente OCR */}
          <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Upload size={14} className="text-ecar-blue" />
                Carga Asistida con IA / Subir Archivo
              </span>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                <button onClick={() => setUploadTipo('compra')} className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${uploadTipo === 'compra' ? 'bg-white text-ecar-blue shadow-2xs' : 'text-slate-500'}`}>
                  📥 Compra
                </button>
                <button onClick={() => setUploadTipo('venta')} className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${uploadTipo === 'venta' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}>
                  📤 Venta
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Razón Social Receptora / Emisora *</label>
              <select
                value={selectedLegalEntityId}
                onChange={e => setSelectedLegalEntityId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 font-medium"
              >
                <option value="">-- Seleccionar Empresa --</option>
                {legalEntities.map(entity => (
                  <option key={entity.id} value={entity.id}>{entity.name} (CUIT: {entity.cuit})</option>
                ))}
              </select>
            </div>

            <label className={`border-2 border-dashed rounded-xl p-4 text-center transition-all block ${!selectedLegalEntityId ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed' : uploading || processing ? 'border-blue-300 bg-blue-50 cursor-pointer' : 'border-slate-300 hover:border-ecar-blue hover:bg-blue-50/40 cursor-pointer'}`}>
              {processing ? (
                <div className="py-2">
                  <Loader2 size={24} className="mx-auto mb-1 text-blue-500 animate-spin" />
                  <p className="font-bold text-blue-700 text-xs">🤖 IA analizando factura...</p>
                </div>
              ) : uploading ? (
                <div className="py-2">
                  <Loader2 size={24} className="mx-auto mb-1 text-slate-400 animate-spin" />
                  <p className="font-bold text-slate-700 text-xs">Subiendo archivo...</p>
                </div>
              ) : (
                <div className="py-2">
                  <Upload size={24} className="mx-auto mb-1 text-slate-400" />
                  <p className="font-bold text-slate-700 text-xs">Arrastrá o hacé clic para subir PDF o Foto</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">La IA clasificará y extraerá CUIT, montos e IVA</p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*,.pdf" disabled={!selectedLegalEntityId || uploading || processing} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </label>
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
            <button onClick={() => applyQuickFilter('current')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'current' ? 'bg-white shadow-sm text-ecar-blue' : 'text-gray-500 hover:text-gray-700'}`}>Mes Actual</button>
            <button onClick={() => applyQuickFilter('last_month')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'last_month' ? 'bg-white shadow-sm text-ecar-blue' : 'text-gray-500 hover:text-gray-700'}`}>Mes Pasado</button>
            <button onClick={() => applyQuickFilter('last_3_months')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'last_3_months' ? 'bg-white shadow-sm text-ecar-blue' : 'text-gray-500 hover:text-gray-700'}`}>Últ. 3 Meses</button>
            <div className={`px-3 py-1 rounded text-xs font-medium transition-all ${dateFilterMode === 'custom' ? 'bg-white shadow-sm text-ecar-blue' : 'text-gray-500'}`}>Personalizado</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar proveedor o n° comprobante..." 
              value={searchProvider} 
              onChange={e => setSearchProvider(e.target.value)} 
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-ecar-blue w-48 transition-all shadow-sm"
            />
          </div>
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

      {/* Tabs: Compras / Ventas / Proveedores / Banco / Razones Sociales */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setActiveTab('compras')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'compras' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <TrendingDown size={16} /> Compras ({compras.length})
        </button>
        <button onClick={() => setActiveTab('ventas')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ventas' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <TrendingUp size={16} /> Ventas ({ventas.length})
        </button>
        <button onClick={() => setActiveTab('proveedores')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'proveedores' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Building2 size={16} /> Proveedores ({suppliers.length})
        </button>
        <button onClick={() => setActiveTab('banco')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'banco' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Database size={16} /> Banco de Precios
        </button>
        <button onClick={() => setActiveTab('razones_sociales')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'razones_sociales' ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Building2 size={16} /> Entidades
        </button>
        <button onClick={() => setActiveTab('ordenes_pago')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ordenes_pago' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Landmark size={16} /> Órdenes de Pago
        </button>
      </div>

      {/* Posicion IVA - Sutil */}
      {(activeTab === 'compras' || activeTab === 'ventas') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
          {legalEntities.map((entity: any) => {
            const { posicion, ivaVentas, ivaCompras } = calculatePosicionIva(entity.id);
            const isToPay = posicion >= 0;
            return (
              <div key={entity.id} className="light-card p-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Posición IVA — {entity.name}</p>
                  <p className={`text-xl font-mono font-bold ${isToPay ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isToPay ? 'A Pagar: ' : 'Saldo a Favor: '}{formatARS(Math.abs(posicion))}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
                      <span className="text-gray-500 font-medium">IVA Venta:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatARS(ivaVentas)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
                      <span className="text-gray-500 font-medium">IVA Compra:</span>
                      <span className="font-mono font-bold text-ecar-blue">{formatARS(ivaCompras)}</span>
                    </div>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${isToPay ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {isToPay ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Totals bar (Only for invoices) */}
      {(activeTab === 'compras' || activeTab === 'ventas') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="light-card p-4">
            <p className="text-xs text-gray-400 font-bold uppercase">Neto Gravado</p>
            <p className="text-lg font-bold text-gray-800 font-mono">{formatARS(totNeto)}</p>
          </div>
          <div className="light-card p-4">
            <p className="text-xs text-gray-400 font-bold uppercase">IVA Total</p>
            <p className="text-lg font-bold text-blue-700 font-mono">{formatARS(totIva)}</p>
          </div>
          <div className="light-card p-4">
            <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
            <p className="text-lg font-bold text-ecar-blue font-mono">{formatARS(totTotal)}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'banco' ? (
        <BancoPreciosTab />
      ) : activeTab === 'razones_sociales' ? (
        <LegalEntitiesPanel />
      ) : activeTab === 'ordenes_pago' ? (
        <PaymentOrdersTab />
      ) : activeTab === 'proveedores' ? (
        <SupplierMaster />
      ) : (
        <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-3">
          <h3 className="font-bold text-gray-800">Libro IVA — {activeTab === 'compras' ? 'Compras' : 'Ventas'}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedLegalEntityLibro}
              onChange={e => setSelectedLegalEntityLibro(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:border-ecar-blue shadow-sm"
            >
              <option value="">Seleccionar Empresa...</option>
              {legalEntities.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!selectedLegalEntityLibro) {
                  useModalStore.getState().showAlert('Atención', 'Debe seleccionar una empresa para descargar el libro IVA.');
                  return;
                }
                const selectedEntity = legalEntities.find((e: any) => e.id === selectedLegalEntityLibro);
                generateLibroIVA(filteredInvoices as any, periodoDesde, periodoHasta, selectedEntity);
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
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8 px-2 text-center"></th>
                  <th>Razón Social</th>
                  <th>{activeTab === 'compras' ? 'Proveedor' : 'Cliente'}</th>
                  <th>CUIT</th>
                  <th>Tipo/Nro</th>
                  <th>Fecha</th>
                  <th className="text-right">Neto</th>
                  <th className="text-right">IVA 21%</th>
                  <th className="text-right">Total</th>
                  {activeTab === 'compras' && <th>Rubro de Gasto</th>}
                  {activeTab === 'compras' && <th>Centro de Costo</th>}
                  <th className="text-center">Cargado Por</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((inv: any) => {
                  const isNC = isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura);
                  const isExpanded = expandedInvoiceId === inv.id;
                  const itemsCount = inv.items?.length || 0;

                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        onClick={() => toggleExpandInvoice(inv.id)}
                        className={`cursor-pointer transition-colors select-none ${
                          isNC
                            ? 'bg-red-50/50 hover:bg-red-100/50 border-l-4 border-red-500'
                            : isExpanded
                            ? 'bg-blue-50/70 hover:bg-blue-50/90 border-l-4 border-ecar-blue shadow-xs'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="w-8 px-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandInvoice(inv.id);
                            }}
                            className={`p-1 rounded-md transition-all ${
                              isExpanded ? 'text-ecar-blue bg-blue-100/70' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={isExpanded ? "Colapsar detalle de artículos" : "Ver artículos e información detallada"}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className="text-xs font-bold text-ecar-blue">
                          {inv.legal_entity?.name || '-'}
                        </td>
                        <td className="font-medium">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-800">{inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || '(Sin datos)'}</span>
                            {itemsCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100/80 text-blue-700">
                                {itemsCount} art.
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-gray-500">{inv.ocr_raw_data?.cuit || inv.supplier?.cuit || '—'}</td>
                        <td className="font-mono text-xs font-bold text-slate-700">
                          {inv.invoice_type || inv.ocr_raw_data?.tipo_factura || '—'} {inv.point_of_sale || inv.ocr_raw_data?.punto_venta || ''}-{inv.invoice_number || inv.ocr_raw_data?.numero_factura || ''}
                        </td>
                        <td className="text-gray-600 font-mono text-xs">{inv.issue_date || '—'}</td>
                        <td className="text-right font-mono">
                          {isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) && <span className="text-red-500 font-bold mr-1">-</span>}
                          {formatARS(inv.net_amount_ars)}
                        </td>
                        <td className="text-right font-mono text-gray-500">
                          {isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) && <span className="text-red-500 font-bold mr-1">-</span>}
                          {formatARS(inv.iva_21_ars)}
                        </td>
                        <td className="text-right font-mono font-bold text-slate-900">
                          {isCreditNote(inv.invoice_type || inv.ocr_raw_data?.tipo_factura) && <span className="text-red-500 font-bold mr-1">-</span>}
                          {formatARS(inv.total_ars)}
                        </td>
                        {activeTab === 'compras' && (
                          <td onClick={e => e.stopPropagation()}>
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
                          <td onClick={e => e.stopPropagation()}>
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
                        <td className="text-center text-xs font-medium text-slate-600">
                          {inv.uploader?.full_name || '—'}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${inv.status === 'pending_review' ? 'badge-warning' : inv.status === 'validated' ? 'badge-success' : inv.status === 'rejected' ? 'badge-danger' : 'badge-info'}`}>{statusLabel[inv.status] || inv.status}</span>
                        </td>
                        <td className="text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-center gap-1">
                            {inv.original_file_url && (
                              <a href={inv.original_file_url} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Ver original"><Eye size={16} /></a>
                            )}
                            {activeTab === 'compras' && (
                              <button
                                onClick={() => {
                                  const targetSup = suppliers.find(s => s.id === inv.supplier_id) || {
                                    id: inv.supplier_id || '',
                                    name: inv.ocr_raw_data?.proveedor_cliente || inv.supplier?.name || 'Proveedor',
                                    cuit: inv.ocr_raw_data?.cuit || inv.supplier?.cuit || null,
                                    tax_condition: 'RI',
                                    address: null, phone: null, email: null, bank_cbu: null, is_fixed: false,
                                    tenant_id: ECAR_TENANT_ID, created_at: ''
                                  } as Supplier;
                                  setPayingSupplier(targetSup);
                                  setPayingInvoiceId(inv.id);
                                }}
                                className={`p-1 rounded transition-colors ${inv.payment_status === 'paid' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-blue-500 hover:bg-blue-50'}`}
                                title={inv.payment_status === 'paid' ? 'Factura Pagada' : 'Pagar con Cheque / Transf.'}
                              >
                                <CreditCard size={15} />
                              </button>
                            )}
                            {inv.status === 'pending_review' && (
                              <>
                                <button onClick={() => handleValidate(inv.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Validar"><Check size={16} /></button>
                                <button onClick={() => handleReject(inv.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Rechazar"><X size={16} /></button>
                              </>
                            )}
                            <button onClick={() => setEditingPurchaseInvoice(inv)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar Comprobante"><Pencil size={14} /></button>
                            <button onClick={() => handleDeleteInvoice(inv)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDABLE SUB-ROW DRAWER */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b-2 border-slate-300">
                          <td colSpan={13} className="p-0">
                            <div className="p-4 md:p-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/90 border-x border-b border-blue-200/80 rounded-b-2xl shadow-inner space-y-4">
                              
                              {/* TOP HEADER IN EXPANDED VIEW */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                                    <Package size={22} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-extrabold text-slate-900 text-base font-mono">
                                        {inv.invoice_type || 'FC'} {inv.point_of_sale || '0001'}-{inv.invoice_number || 'S/N'}
                                      </span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        inv.status === 'validated' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                        inv.status === 'pending_review' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                                      }`}>
                                        {statusLabel[inv.status] || inv.status}
                                      </span>
                                      {inv.payment_status === 'paid' ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                          <CheckCircle2 size={13} /> Pagado
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                          <Clock size={13} /> Pago Pendiente
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Proveedor: <strong className="text-slate-800">{inv.supplier?.name || inv.ocr_raw_data?.proveedor_cliente}</strong>
                                      {inv.supplier?.cuit && <span className="font-mono ml-1">({inv.supplier.cuit})</span>} • Empresa: <strong className="text-slate-800">{inv.legal_entity?.name || 'ECAR'}</strong> • Cargado por: <strong className="text-slate-800">{inv.uploader?.full_name || '—'}</strong>
                                    </p>
                                  </div>
                                </div>

                                {/* Quick actions */}
                                <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPurchaseInvoice(inv)}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                                  >
                                    <Pencil size={13} />
                                    Editar Comprobante / Ítems
                                  </button>
                                  {inv.original_file_url && (
                                    <a
                                      href={inv.original_file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                                    >
                                      <Eye size={13} className="text-blue-600" />
                                      Ver Comprobante PDF / Original
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* 4 METADATA CARDS */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {/* 1. Recepción & Stock */}
                                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <Truck size={13} className="text-ecar-blue" /> Recepción en Depósito
                                  </span>
                                  <div className="font-bold text-xs">
                                    {inv.has_reception !== false ? (
                                      <span className="text-emerald-700 flex items-center gap-1">
                                        ✓ Ingresó al Kardex / Stock
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 flex items-center gap-1">
                                        ⚠ Sin ingreso a stock
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono truncate">
                                    {inv.deposit_location || 'DEPOSITO RAWSON'}
                                  </div>
                                </div>

                                {/* 2. Condición de Pago */}
                                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <CreditCard size={13} className="text-ecar-blue" /> Condición de Pago
                                  </span>
                                  <div className="font-bold text-xs text-slate-800">
                                    {inv.payment_condition || 'Contado'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    Fecha Emisión: {inv.issue_date || 'S/F'}
                                  </div>
                                </div>

                                {/* 3. Imputación de Costos */}
                                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <Building2 size={13} className="text-ecar-blue" /> Imputación / Centro de Costo
                                  </span>
                                  <div className="font-bold text-xs text-slate-800 truncate">
                                    {inv.allocations && inv.allocations.length > 0
                                      ? `Dividido en ${inv.allocations.length} obras`
                                      : inv.project_id
                                      ? 'Obra Directa'
                                      : '🏢 Gasto General ECAR'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {inv.gasto_item_id ? (
                                      (() => {
                                        const g = gastosItems.find((gi: any) => gi.id === inv.gasto_item_id);
                                        return g ? `${g.categoria} - ${g.descripcion}` : 'Sin rubro';
                                      })()
                                    ) : 'Sin rubro de gasto asignado'}
                                  </div>
                                </div>

                                {/* 4. Notas & Comprobante Vinculado */}
                                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <FileText size={13} className="text-ecar-blue" /> Observaciones / Notas
                                  </span>
                                  <div className="font-medium text-xs text-slate-700 truncate" title={inv.notes || 'Sin observaciones'}>
                                    {inv.notes ? inv.notes : 'Sin observaciones cargadas'}
                                  </div>
                                  {inv.related_invoice_id && (
                                    <div className="text-[11px] text-amber-700 font-semibold truncate">
                                      🔗 Vinculada a Factura Previa
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* DETALLE DE ARTÍCULOS TABLE */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Package size={15} className="text-ecar-blue" />
                                    Artículos y Renglones de la Factura ({itemsCount})
                                  </h4>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    * Todos los precios unitarios son netos sin IVA
                                  </span>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                                      <tr>
                                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                                        <th className="py-2.5 px-3">Código</th>
                                        <th className="py-2.5 px-3">Descripción del Producto / Insumo</th>
                                        <th className="py-2.5 px-3 text-center">Cantidad</th>
                                        <th className="py-2.5 px-3 text-right">Precio Unit. (s/IVA)</th>
                                        <th className="py-2.5 px-3 text-center">% Desc</th>
                                        <th className="py-2.5 px-3 text-center">Alícuota IVA</th>
                                        <th className="py-2.5 px-3 text-right">Subtotal Neto</th>
                                        <th className="py-2.5 px-3 text-right">Total c/IVA</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {itemsCount > 0 ? (
                                        inv.items.map((itm: any, itmIdx: number) => {
                                          const rate = itm.iva_rate !== undefined && itm.iva_rate !== null ? Number(itm.iva_rate) : 21;
                                          const itemNet = Number(itm.subtotal) || (Number(itm.quantity) * Number(itm.unit_price) * (1 - (Number(itm.discount_percentage) || 0) / 100));
                                          const itemTotal = itemNet * (1 + rate / 100);

                                          return (
                                            <tr key={itm.id || itmIdx} className="hover:bg-slate-50/80 transition-colors">
                                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                                                {itmIdx + 1}
                                              </td>
                                              <td className="py-2.5 px-3 font-mono text-slate-500 text-xs">
                                                {itm.item_code || itm.inventory_item?.item_code || itm.inventory_item?.barcode || '—'}
                                              </td>
                                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                  <span>{itm.description}</span>
                                                  {itm.inventory_item && (
                                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                                      En Inventario ({itm.inventory_item.current_stock} {itm.inventory_item.unit})
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                                                {itm.quantity} {itm.unit || 'un'}
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                                {formatARS(itm.unit_price)}
                                              </td>
                                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                                {Number(itm.discount_percentage) > 0 ? `${itm.discount_percentage}%` : '0%'}
                                              </td>
                                              <td className="py-2.5 px-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                  rate === 0
                                                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    : rate === 10.5
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : rate === 27
                                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                  {rate}%
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                                {formatARS(itemNet)}
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-mono font-bold text-ecar-blue">
                                                {formatARS(itemTotal)}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      ) : (
                                        <tr>
                                          <td colSpan={9} className="py-6 px-4 text-center text-slate-400 bg-slate-50/50">
                                            <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                              <p className="text-xs italic">
                                                Este comprobante fue registrado de forma global sin desglose por artículos.
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => setEditingPurchaseInvoice(inv)}
                                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-ecar-blue border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                                              >
                                                + Cargar desglose de artículos
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* FINANCIAL SUMMARY / TAXES BREAKDOWN */}
                              <div className="flex flex-wrap justify-end gap-3 pt-1">
                                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-wrap gap-4 text-xs font-mono">
                                  <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Neto Gravado</span>
                                    <span className="font-bold text-slate-800">{formatARS(inv.net_amount_ars)}</span>
                                  </div>
                                  {Number(inv.iva_21_ars) > 0 && (
                                    <div className="text-right border-l pl-4 border-slate-100">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">IVA 21%</span>
                                      <span className="font-bold text-blue-700">{formatARS(inv.iva_21_ars)}</span>
                                    </div>
                                  )}
                                  {Number(inv.iva_105_ars) > 0 && (
                                    <div className="text-right border-l pl-4 border-slate-100">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">IVA 10.5%</span>
                                      <span className="font-bold text-emerald-700">{formatARS(inv.iva_105_ars)}</span>
                                    </div>
                                  )}
                                  {Number(inv.iva_27_ars) > 0 && (
                                    <div className="text-right border-l pl-4 border-slate-100">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">IVA 27%</span>
                                      <span className="font-bold text-purple-700">{formatARS(inv.iva_27_ars)}</span>
                                    </div>
                                  )}
                                  {(Number(inv.perceptions_iibb_ars) > 0 || Number(inv.perceptions_iva_ars) > 0) && (
                                    <div className="text-right border-l pl-4 border-slate-100">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Percepciones</span>
                                      <span className="font-bold text-amber-700">{formatARS((Number(inv.perceptions_iibb_ars) || 0) + (Number(inv.perceptions_iva_ars) || 0))}</span>
                                    </div>
                                  )}
                                  {Number(inv.discount_amount) > 0 && (
                                    <div className="text-right border-l pl-4 border-slate-100">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Descuento</span>
                                      <span className="font-bold text-emerald-700">-{formatARS(inv.discount_amount)}</span>
                                    </div>
                                  )}
                                  <div className="text-right border-l pl-4 border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-ecar-blue block font-sans">Total Factura</span>
                                    <span className="font-bold text-sm text-ecar-blue">{formatARS(inv.total_ars)}</span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && currentList.length > 0 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-slate-100 bg-white rounded-b-xl">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-slate-600 font-medium px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Siguiente
            </button>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500 font-bold uppercase">Proveedor</p><p className="font-medium text-gray-800">{ocrResult.proveedor_cliente}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">CUIT</p><p className="font-mono text-sm">{ocrResult.cuit || 'No detectado'}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">Nro Factura</p><p className="font-mono text-sm">{ocrResult.tipo_factura || 'A'} {ocrResult.punto_venta || '0000'}-{ocrResult.numero_factura}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase">Fecha Emisión</p><p className="font-mono text-sm">{ocrResult.fecha_emision || 'No detectada'}</p></div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-100">
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

      {/* Nuevo Comprobante de Compra / Editar Comprobante Modal */}
      {(showNewInvoiceModal || editingPurchaseInvoice) && (
        <NewPurchaseInvoiceModal
          invoiceToEdit={editingPurchaseInvoice}
          onClose={() => {
            setShowNewInvoiceModal(false);
            setEditingPurchaseInvoice(null);
          }}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_item_price_history'] });
          }}
        />
      )}

      {/* Modal de Pago a Proveedor (Cheque / Transf) */}
      {payingSupplier && (
        <SupplierPaymentModal
          supplier={payingSupplier}
          preselectedInvoiceId={payingInvoiceId}
          onClose={() => {
            setPayingSupplier(null);
            setPayingInvoiceId(null);
          }}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['cheques'] });
          }}
        />
      )}
    </div>
  );
};
