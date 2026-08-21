import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, Search, Plus, Info, Check, Trash2, ArrowLeft,
  FileText, Package, Percent,
  Building2, AlertCircle, ShoppingCart, HelpCircle
} from 'lucide-react';
import {
  useSuppliers, useCreateSupplier, useLegalEntities,
  useInventoryItems,
  useProjects, usePurchaseInvoices, usePurchaseInvoiceItems,
  useCreatePurchaseInvoiceWithItems, useUpdatePurchaseInvoiceWithItems
} from '../../hooks/useData';
import { useAuth } from '../../contexts/AuthContext';
import { useModalStore } from '../../store/useModalStore';
import type { InventoryItem } from '../../lib/types';

const fmt = (n: number | null | undefined) =>
  `$ ${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  invoiceToEdit?: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type FormItem = {
  inventory_item_id?: string | null;
  item_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;
  previous_price?: number;
};

const COMPROBANTE_TYPES = [
  { group: 'Facturas', items: [
    { value: 'FA', label: 'Factura A' },
    { value: 'FB', label: 'Factura B' },
    { value: 'FC', label: 'Factura C' },
    { value: 'FM', label: 'Factura M' },
    { value: 'COMPROBANTE COMPRA', label: 'Comprobante Compra' },
    { value: 'REMITO', label: 'Remito / Recibo' },
  ]},
  { group: 'Notas de Crédito (Devolución / Descuento)', items: [
    { value: 'NCA', label: 'Nota de Crédito A (NCA)' },
    { value: 'NCB', label: 'Nota de Crédito B (NCB)' },
    { value: 'NCC', label: 'Nota de Crédito C (NCC)' },
    { value: 'NCM', label: 'Nota de Crédito M (NCM)' },
  ]},
  { group: 'Notas de Débito (Recargo / Ajuste)', items: [
    { value: 'NDA', label: 'Nota de Débito A (NDA)' },
    { value: 'NDB', label: 'Nota de Débito B (NDB)' },
    { value: 'NDC', label: 'Nota de Débito C (NDC)' },
    { value: 'NDM', label: 'Nota de Débito M (NDM)' },
  ]}
];

const PAYMENT_CONDITIONS = [
  'Contado',
  'Cuenta Corriente 15 días',
  'Cuenta Corriente 30 días',
  'Cuenta Corriente 60 días',
  'Transferencia Bancaria',
  'Cheque Propio',
  'eCheq'
];

export const NewPurchaseInvoiceModal: React.FC<Props> = ({ invoiceToEdit, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const { data: suppliers = [] } = useSuppliers();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: projects = [] } = useProjects();
  const { data: pastInvoices = [] } = usePurchaseInvoices();
  const { data: existingItems = [] } = usePurchaseInvoiceItems(invoiceToEdit?.id);

  const createSupplierMutation = useCreateSupplier();
  const createInvoiceMutation = useCreatePurchaseInvoiceWithItems();
  const updateInvoiceMutation = useUpdatePurchaseInvoiceWithItems();

  // Header form state
  const [supplierId, setSupplierId] = useState(invoiceToEdit?.supplier_id || '');
  const [supplierSearch, setSupplierSearch] = useState(invoiceToEdit?.supplier?.name || invoiceToEdit?.ocr_raw_data?.proveedor_cliente || '');
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [legalEntityId, setLegalEntityId] = useState(invoiceToEdit?.legal_entity_id || legalEntities[0]?.id || '');
  const [invoiceType, setInvoiceType] = useState(invoiceToEdit?.invoice_type || 'COMPROBANTE COMPRA');
  const [pointOfSale, setPointOfSale] = useState(invoiceToEdit?.point_of_sale || '0001');
  const [invoiceNumber, setInvoiceNumber] = useState(invoiceToEdit?.invoice_number || '');
  const [paymentCondition, setPaymentCondition] = useState(invoiceToEdit?.payment_condition || 'Contado');
  const [issueDate, setIssueDate] = useState(invoiceToEdit?.issue_date || new Date().toISOString().split('T')[0]);
  const [hasReception, setHasReception] = useState(invoiceToEdit?.has_reception ?? true);
  const [depositLocation, setDepositLocation] = useState(invoiceToEdit?.deposit_location || 'DEPOSITO RAWSON');
  const [relatedInvoiceId, setRelatedInvoiceId] = useState<string | null>(invoiceToEdit?.related_invoice_id || null);
  const [relatedInvoiceSearch, setRelatedInvoiceSearch] = useState('');
  const [isRelatedOpen, setIsRelatedOpen] = useState(false);

  // Line Item entry form state
  const [itemCode, setItemCode] = useState('');
  const [productName, setProductName] = useState('');
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState('unidad');
  const [unitPrice, setUnitPrice] = useState<string>('0');
  const [discountPerc, setDiscountPerc] = useState<string>('0');

  // Items grid list
  const [items, setItems] = useState<FormItem[]>([]);

  // Taxes & Extras
  const [iva21, setIva21] = useState<string>(String(invoiceToEdit?.iva_21_ars || 0));
  const [iva105, setIva105] = useState<string>(String(invoiceToEdit?.iva_105_ars || 0));
  const [iva27] = useState<string>(String(invoiceToEdit?.iva_27_ars || 0));
  const [perceptionsIva] = useState<string>(String(invoiceToEdit?.perceptions_iva_ars || 0));
  const [perceptionsIibb, setPerceptionsIibb] = useState<string>(String(invoiceToEdit?.perceptions_iibb_ars || 0));
  const [globalDiscount, setGlobalDiscount] = useState<string>(String(invoiceToEdit?.discount_amount || 0));
  const [notes, setNotes] = useState(invoiceToEdit?.notes || '');

  // Populate items from existing invoice if editing
  useEffect(() => {
    if (invoiceToEdit && existingItems.length > 0 && items.length === 0) {
      setItems(existingItems.map((ei: any) => ({
        inventory_item_id: ei.inventory_item_id,
        item_code: ei.item_code || '',
        description: ei.description,
        quantity: Number(ei.quantity) || 1,
        unit: ei.unit || 'unidad',
        unit_price: Number(ei.unit_price) || 0,
        discount_percentage: Number(ei.discount_percentage) || 0,
        subtotal: Number(ei.subtotal) || 0,
        previous_price: ei.previous_price
      })));
    } else if (invoiceToEdit && existingItems.length === 0 && items.length === 0 && invoiceToEdit.total_ars > 0) {
      setItems([{
        inventory_item_id: null,
        item_code: 'COMPRA-GEN',
        description: `Gasto / Factura ${invoiceToEdit.invoice_type || 'FC'} ${invoiceToEdit.invoice_number || ''}`,
        quantity: 1,
        unit: 'global',
        unit_price: invoiceToEdit.net_amount_ars || invoiceToEdit.total_ars,
        discount_percentage: 0,
        subtotal: invoiceToEdit.net_amount_ars || invoiceToEdit.total_ars,
      }]);
    }
  }, [invoiceToEdit, existingItems, items.length]);

  // Modals inside
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', cuit: '', tax_condition: 'RI' });
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSupplierInfo, setShowSupplierInfo] = useState(false);

  // Refs for dropdown clicks
  const supplierRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
        setIsSupplierOpen(false);
      }
      if (productRef.current && !productRef.current.contains(event.target as Node)) {
        setIsProductOpen(false);
      }
      if (relatedRef.current && !relatedRef.current.contains(event.target as Node)) {
        setIsRelatedOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCreditOrDebitNote = useMemo(() => {
    const t = invoiceType.toUpperCase();
    return t.startsWith('NC') || t.startsWith('ND') || t.includes('CREDITO') || t.includes('DEBITO');
  }, [invoiceType]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === supplierId) || null;
  }, [suppliers, supplierId]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(s => s.name.toLowerCase().includes(q) || (s.cuit && s.cuit.includes(q)));
  }, [suppliers, supplierSearch]);

  // Filtered products from inventory
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return inventoryItems.slice(0, 30);
    const q = productSearch.toLowerCase();
    return inventoryItems.filter(i => 
      i.name.toLowerCase().includes(q) || 
      (i.item_code && i.item_code.toLowerCase().includes(q)) ||
      (i.barcode && i.barcode.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [inventoryItems, productSearch]);

  // Filtered candidate invoices to link for Credit/Debit Note
  const candidateInvoices = useMemo(() => {
    return pastInvoices.filter(inv => {
      const isNC = (inv.invoice_type || '').toUpperCase().startsWith('NC') || (inv.invoice_type || '').toUpperCase().includes('CREDITO');
      if (isNC) return false;
      if (supplierId && inv.supplier_id && inv.supplier_id !== supplierId) return false;
      if (!relatedInvoiceSearch.trim()) return true;
      const q = relatedInvoiceSearch.toLowerCase();
      const num = `${inv.point_of_sale || ''}-${inv.invoice_number || ''}`.toLowerCase();
      const prov = (inv.supplier?.name || '').toLowerCase();
      return num.includes(q) || prov.includes(q);
    });
  }, [pastInvoices, supplierId, relatedInvoiceSearch]);

  // Handle select product from inventory
  const handleSelectProduct = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setItemCode(item.item_code || item.barcode || '');
    setProductName(item.name);
    setUnit(item.unit || 'unidad');
    setUnitPrice(String(item.unit_cost || 0));
    setIsProductOpen(false);
  };

  // Calculate row subtotal
  const rowSubtotal = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const disc = parseFloat(discountPerc) || 0;
    const base = qty * price;
    return Math.max(0, base * (1 - disc / 100));
  }, [quantity, unitPrice, discountPerc]);

  // Add Item to table
  const handleAddItem = () => {
    if (!productName.trim()) {
      useModalStore.getState().showAlert('Atención', 'Debes ingresar o seleccionar un producto.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      useModalStore.getState().showAlert('Atención', 'La cantidad debe ser mayor a 0.');
      return;
    }
    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      useModalStore.getState().showAlert('Atención', 'El precio unitario no puede ser negativo.');
      return;
    }
    const disc = parseFloat(discountPerc) || 0;

    const newItem: FormItem = {
      inventory_item_id: selectedInventoryItem?.id || null,
      item_code: itemCode.trim(),
      description: productName.trim(),
      quantity: qty,
      unit: unit.trim() || 'unidad',
      unit_price: price,
      discount_percentage: disc,
      subtotal: rowSubtotal,
      previous_price: selectedInventoryItem?.unit_cost || 0
    };

    setItems([...items, newItem]);

    // Recalculate estimated iva 21%
    const currentNet = items.reduce((s, i) => s + i.subtotal, 0) + rowSubtotal;
    setIva21(String(Math.round(currentNet * 0.21 * 100) / 100));

    // Reset item form
    setItemCode('');
    setProductName('');
    setSelectedInventoryItem(null);
    setQuantity('1');
    setUnitPrice('0');
    setDiscountPerc('0');
  };

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
    const nextNet = next.reduce((s, i) => s + i.subtotal, 0);
    setIva21(String(Math.round(nextNet * 0.21 * 100) / 100));
  };

  // Calculations
  const subtotalNeto = useMemo(() => {
    return items.reduce((sum, itm) => sum + itm.subtotal, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    return parseFloat(globalDiscount) || 0;
  }, [globalDiscount]);

  const totalIva = useMemo(() => {
    return (parseFloat(iva21) || 0) + (parseFloat(iva105) || 0) + (parseFloat(iva27) || 0);
  }, [iva21, iva105, iva27]);

  const totalPerceptions = useMemo(() => {
    return (parseFloat(perceptionsIva) || 0) + (parseFloat(perceptionsIibb) || 0);
  }, [perceptionsIva, perceptionsIibb]);

  const totalFinal = useMemo(() => {
    return Math.max(0, subtotalNeto - discountAmount + totalIva + totalPerceptions);
  }, [subtotalNeto, discountAmount, totalIva, totalPerceptions]);

  // Create Quick Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.name.trim()) return;
    try {
      const res: any = await createSupplierMutation.mutateAsync({
        name: newSupplierForm.name.trim(),
        cuit: newSupplierForm.cuit.trim() || null,
        tax_condition: newSupplierForm.tax_condition,
        is_fixed: false
      } as any);
      setShowSupplierModal(false);
      setSupplierId(res?.id || '');
      setSupplierSearch(newSupplierForm.name.trim());
      setNewSupplierForm({ name: '', cuit: '', tax_condition: 'RI' });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo crear el proveedor.');
    }
  };

  // Final Submit
  const handleGenerateInvoice = async () => {
    if (!supplierId && !supplierSearch.trim()) {
      useModalStore.getState().showAlert('Atención', 'Debes seleccionar o ingresar un Proveedor.');
      return;
    }
    if (!invoiceNumber.trim()) {
      useModalStore.getState().showAlert('Atención', 'Debes ingresar el número de comprobante.');
      return;
    }
    if (items.length === 0) {
      useModalStore.getState().showAlert('Atención', 'Debes agregar al menos un artículo o renglón al comprobante.');
      return;
    }
    if (isCreditOrDebitNote && !relatedInvoiceId) {
      const ok = await useModalStore.getState().showConfirm(
        'Comprobante sin Factura Vinculada',
        'Estás cargando una Nota de Crédito/Débito sin haber seleccionado una Factura previa asociada. ¿Deseas continuar de todas formas?'
      );
      if (!ok) return;
    }

    try {
      const invoicePayload = {
        supplier_id: supplierId || null,
        legal_entity_id: legalEntityId || null,
        invoice_type: invoiceType,
        point_of_sale: pointOfSale.padStart(4, '0'),
        invoice_number: invoiceNumber.padStart(8, '0'),
        issue_date: issueDate,
        payment_condition: paymentCondition,
        deposit_location: depositLocation,
        has_reception: hasReception,
        net_amount_ars: subtotalNeto,
        discount_amount: discountAmount,
        iva_21_ars: parseFloat(iva21) || 0,
        iva_105_ars: parseFloat(iva105) || 0,
        iva_27_ars: parseFloat(iva27) || 0,
        perceptions_iva_ars: parseFloat(perceptionsIva) || 0,
        perceptions_iibb_ars: parseFloat(perceptionsIibb) || 0,
        total_ars: totalFinal,
        status: 'validated' as const,
        related_invoice_id: relatedInvoiceId || null,
        notes: notes.trim() || null,
        ocr_raw_data: {
          proveedor_cliente: selectedSupplier?.name || supplierSearch,
          cuit: selectedSupplier?.cuit || '',
          tipo_factura: invoiceType,
          punto_venta: pointOfSale,
          numero_factura: invoiceNumber,
          fecha_emision: issueDate,
          total: totalFinal,
          tipo: 'compra'
        }
      };

      if (invoiceToEdit?.id) {
        await updateInvoiceMutation.mutateAsync({
          invoiceId: invoiceToEdit.id,
          invoice: invoicePayload,
          items: items.map(i => ({
            inventory_item_id: i.inventory_item_id,
            item_code: i.item_code,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unit_price: i.unit_price,
            discount_percentage: i.discount_percentage,
            subtotal: i.subtotal,
          })),
          user_name: profile?.full_name || 'Compras'
        });

        useModalStore.getState().showAlert(
          '¡Comprobante Actualizado!',
          `El comprobante ${invoiceType} ${pointOfSale.padStart(4, '0')}-${invoiceNumber.padStart(8, '0')} fue actualizado con éxito.${hasReception ? ' Se actualizaron las existencias y los precios en el inventario.' : ''}`
        );
      } else {
        await createInvoiceMutation.mutateAsync({
          invoice: invoicePayload,
          items: items.map(i => ({
            inventory_item_id: i.inventory_item_id,
            item_code: i.item_code,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unit_price: i.unit_price,
            discount_percentage: i.discount_percentage,
            subtotal: i.subtotal,
          })),
          user_name: profile?.full_name || 'Compras'
        });

        useModalStore.getState().showAlert(
          '¡Comprobante Registrado!',
          `El comprobante ${invoiceType} ${pointOfSale.padStart(4, '0')}-${invoiceNumber.padStart(8, '0')} fue guardado con éxito.${hasReception ? ' Se actualizaron las existencias y los precios en el inventario.' : ''}`
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      useModalStore.getState().showAlert('Error al registrar comprobante', err?.message || 'Ocurrió un error inesperado.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full flex flex-col overflow-hidden border border-slate-200 animate-fade-in-up my-auto max-h-[96vh]">
        
        {/* TOP BAR / HEADER (Inspired by Image 1) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Volver"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <ShoppingCart size={20} className="text-blue-400" />
                {invoiceToEdit ? 'Editar Comprobante de Compra' : 'Nuevo Comprobante de Compra'}
              </h1>
              <p className="text-xs text-slate-400">
                Carga detallada por artículos con impacto en stock y trazabilidad de precios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNotesModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <FileText size={14} className="text-amber-400" />
              Observaciones
              {notes && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => setShowDiscountModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Percent size={14} className="text-emerald-400" />
              Descuento Global
              {discountAmount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={16} />
              {createInvoiceMutation.isPending || updateInvoiceMutation.isPending ? 'Guardando...' : invoiceToEdit ? 'Guardar Cambios' : 'Generar Comprobante'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">

          {/* SECCIÓN 1: INFORMACIÓN DEL COMPROBANTE */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
              <Building2 size={16} className="text-ecar-blue" />
              Información del Comprobante
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Proveedor Selector with +, Lupa, Info */}
              <div className="md:col-span-2 relative" ref={supplierRef}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proveedor (*)
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar proveedor por nombre o CUIT..."
                      value={selectedSupplier ? `${selectedSupplier.name} (CUIT: ${selectedSupplier.cuit || 'S/D'})` : supplierSearch}
                      onChange={e => {
                        setSupplierSearch(e.target.value);
                        setSupplierId('');
                        setIsSupplierOpen(true);
                      }}
                      onFocus={() => setIsSupplierOpen(true)}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSupplierOpen(!isSupplierOpen)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <Search size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-ecar-blue rounded-xl border border-blue-200 transition-colors shrink-0"
                    title="Crear nuevo proveedor"
                  >
                    <Plus size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedSupplier) {
                        useModalStore.getState().showAlert('Atención', 'Selecciona un proveedor para ver su información.');
                        return;
                      }
                      setShowSupplierInfo(!showSupplierInfo);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors shrink-0"
                    title="Ver datos del proveedor"
                  >
                    <Info size={18} />
                  </button>
                </div>

                {/* Dropdown for suppliers */}
                {isSupplierOpen && (
                  <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {filteredSuppliers.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSupplierId(s.id);
                          setSupplierSearch(s.name);
                          setIsSupplierOpen(false);
                        }}
                        className={`p-2.5 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center transition-colors ${supplierId === s.id ? 'bg-blue-50/80 font-bold text-ecar-blue' : 'text-slate-700'}`}
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">CUIT: {s.cuit || 'S/D'} • {s.tax_condition || 'RI'}</div>
                        </div>
                        {supplierId === s.id && <Check size={14} className="text-ecar-blue" />}
                      </div>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No se encontraron proveedores. Usa el botón [+] para crearlo.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Razón Social Receptora */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razón Social Receptora (*)
                </label>
                <select
                  value={legalEntityId}
                  onChange={e => setLegalEntityId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                >
                  {legalEntities.map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name} ({entity.cuit})
                    </option>
                  ))}
                  {legalEntities.length === 0 && (
                    <option value="">ECAR Construcciones</option>
                  )}
                </select>
              </div>

              {/* Tipo de Comprobante */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Comprobante (*)
                </label>
                <select
                  value={invoiceType}
                  onChange={e => setInvoiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                >
                  {COMPROBANTE_TYPES.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map(item => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Punto de Venta y Nro Comprobante */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comprobante (*)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="0001"
                    value={pointOfSale}
                    onChange={e => setPointOfSale(e.target.value.replace(/\D/g, ''))}
                    className="w-20 px-2 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                    title="Punto de Venta"
                  />
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="00001536"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                    title="Número de Factura"
                  />
                </div>
              </div>

              {/* Condición de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Condición Pago
                </label>
                <select
                  value={paymentCondition}
                  onChange={e => setPaymentCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                >
                  {PAYMENT_CONDITIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Fecha de Emisión */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha (*)
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                />
              </div>

              {/* Depósito Destino */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Depósito (*)
                </label>
                <select
                  value={depositLocation}
                  onChange={e => setDepositLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                >
                  <option value="DEPOSITO RAWSON">DEPOSITO RAWSON (Pañol Central)</option>
                  <option value="ALMACEN CENTRAL">ALMACEN CENTRAL</option>
                  {projects.map(p => (
                    <option key={p.id} value={`OBRA: ${p.name}`}>OBRA: {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Realiza Recepción Checkbox */}
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasReception}
                    onChange={e => setHasReception(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-ecar-blue focus:ring-ecar-blue/30 border-slate-300 cursor-pointer accent-blue-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Realiza Recepción</span>
                    <span className="text-[10px] text-slate-400 block">Ingresa stock de inmediato</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Factura de Referencia (Obligatoria / Visible si es Nota de Crédito o Débito) */}
            {isCreditOrDebitNote && (
              <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl relative" ref={relatedRef}>
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900">
                    Factura Asociada (Mapeo obligatorio para {invoiceType})
                  </span>
                </div>

                {relatedInvoiceId ? (
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-300">
                    <div className="text-xs">
                      {(() => {
                        const inv = pastInvoices.find(i => i.id === relatedInvoiceId);
                        if (!inv) return <span className="font-mono">ID: {relatedInvoiceId}</span>;
                        return (
                          <div>
                            <span className="font-bold text-slate-800">{inv.invoice_type || 'FC'} {inv.point_of_sale}-{inv.invoice_number}</span>
                            <span className="text-slate-500 ml-2">({inv.issue_date || 'S/F'})</span>
                            <span className="text-ecar-blue font-mono font-bold ml-2">{fmt(inv.total_ars)}</span>
                            <span className="text-slate-400 text-[11px] ml-2">• {inv.supplier?.name}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRelatedInvoiceId(null)}
                      className="px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-50 rounded border border-amber-200"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar comprobante original por número o proveedor..."
                        value={relatedInvoiceSearch}
                        onChange={e => {
                          setRelatedInvoiceSearch(e.target.value);
                          setIsRelatedOpen(true);
                        }}
                        onFocus={() => setIsRelatedOpen(true)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                      />
                    </div>

                    {isRelatedOpen && (
                      <div className="absolute z-40 left-3 right-3 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {candidateInvoices.map(inv => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              setRelatedInvoiceId(inv.id);
                              setIsRelatedOpen(false);
                            }}
                            className="p-2 hover:bg-amber-50 cursor-pointer text-xs flex justify-between items-center border-b border-slate-100 last:border-0"
                          >
                            <div>
                              <span className="font-bold text-slate-800">{inv.invoice_type || 'FC'} {inv.point_of_sale}-{inv.invoice_number}</span>
                              <span className="text-slate-400 ml-2">{inv.supplier?.name}</span>
                            </div>
                            <div className="font-mono font-bold text-slate-700">{fmt(inv.total_ars)}</div>
                          </div>
                        ))}
                        {candidateInvoices.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No se encontraron facturas previas para este proveedor.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: DETALLES DEL COMPROBANTE (Carga artículo por artículo) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Package size={16} className="text-ecar-blue" />
                Detalles del Comprobante
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {items.length} artículo(s) agregado(s)
              </span>
            </div>

            {/* Inputs de Carga de Ítem Renglón por Renglón (Inspired by Image 1) */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Código de Producto */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cód / Barcode..."
                      value={itemCode}
                      onChange={e => {
                        const code = e.target.value;
                        setItemCode(code);
                        const match = inventoryItems.find(i => 
                          (i.item_code && i.item_code.toLowerCase() === code.toLowerCase()) || 
                          (i.barcode && i.barcode.toLowerCase() === code.toLowerCase())
                        );
                        if (match) {
                          handleSelectProduct(match);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                    />
                  </div>
                </div>

                {/* Producto Selector / Buscador */}
                <div className="md:col-span-4 relative" ref={productRef}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Producto (*)
                    </label>
                    {selectedInventoryItem && (
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Último Costo: {fmt(selectedInventoryItem.unit_cost)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar producto en inventario..."
                      value={productName}
                      onChange={e => {
                        setProductName(e.target.value);
                        setProductSearch(e.target.value);
                        setSelectedInventoryItem(null);
                        setIsProductOpen(true);
                      }}
                      onFocus={() => setIsProductOpen(true)}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setIsProductOpen(!isProductOpen)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <Search size={15} />
                    </button>
                  </div>

                  {/* Dropdown for products */}
                  {isProductOpen && (
                    <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {filteredProducts.map(itm => (
                        <div
                          key={itm.id}
                          onClick={() => handleSelectProduct(itm)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{itm.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Cód: {itm.item_code || itm.barcode || 'S/C'} • Stock: {itm.current_stock} {itm.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-ecar-blue">{fmt(itm.unit_cost)}</span>
                          </div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No se encontró en inventario. Se guardará como nuevo producto.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cantidad */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cantidad
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="1"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                    />
                  </div>
                </div>

                {/* Precio Unitario */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio Unitario ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-right font-bold focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
                {/* % Descuento */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Porc Descuento (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={discountPerc}
                      onChange={e => setDiscountPerc(e.target.value)}
                      className="w-full pl-3 pr-7 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Total Renglón Calculado */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Renglón
                  </label>
                  <div className="px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 text-right">
                    {fmt(rowSubtotal)}
                  </div>
                </div>

                {/* Botón Agregar [+] */}
                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={18} />
                    Agregar Ítem
                  </button>
                </div>
              </div>
            </div>

            {/* TABLA DE DETALLES DEL COMPROBANTE (Inspired by Image 1) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-center">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                    <th className="py-2.5 px-3 text-center">% Desc</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {item.item_code || '—'}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-medium">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {fmt(item.unit_price)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-500">
                        {item.discount_percentage > 0 ? `${item.discount_percentage}%` : '0%'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {fmt(item.subtotal)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No se encontraron registros. Agrega artículos utilizando el formulario superior.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SECCIÓN TOTALES Y LIQUIDACIÓN (Inspired by Image 1) */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-2">
              <div className="w-full md:w-1/2 space-y-2">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-ecar-blue flex items-center gap-1.5">
                    <HelpCircle size={14} /> Información de Carga:
                  </div>
                  <p>• Los productos cargados actualizarán automáticamente su costo unitario en el inventario.</p>
                  <p>• Si "Realiza Recepción" está activo, se registrará el ingreso físico en el Kardex.</p>
                  <p>• Se guardará el registro comparativo de precio anterior vs nuevo precio ($ y %).</p>
                </div>
              </div>

              {/* Totals Table */}
              <div className="w-full md:w-80 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Subtotal Neto:</span>
                  <span className="font-mono font-semibold">{fmt(subtotalNeto)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600">
                    <span>Descuento Global:</span>
                    <span className="font-mono font-semibold">-{fmt(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>IVA 21%:</span>
                  <input
                    type="number"
                    step="any"
                    value={iva21}
                    onChange={e => setIva21(e.target.value)}
                    className="w-24 px-2 py-0.5 text-right font-mono text-xs border rounded bg-white"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>IVA 10.5%:</span>
                  <input
                    type="number"
                    step="any"
                    value={iva105}
                    onChange={e => setIva105(e.target.value)}
                    className="w-24 px-2 py-0.5 text-right font-mono text-xs border rounded bg-white"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Percepciones (IIBB/IVA):</span>
                  <input
                    type="number"
                    step="any"
                    value={perceptionsIibb}
                    onChange={e => setPerceptionsIibb(e.target.value)}
                    className="w-24 px-2 py-0.5 text-right font-mono text-xs border rounded bg-white"
                  />
                </div>

                <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Final:</span>
                  <span className="font-mono text-base text-ecar-blue">{fmt(totalFinal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl shadow-xs transition-colors"
          >
            Volver / Cancelar
          </button>

          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={createInvoiceMutation.isPending}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={16} />
            {createInvoiceMutation.isPending ? 'Guardando...' : 'Generar Comprobante'}
          </button>
        </div>
      </div>

      {/* MODAL CREAR PROVEEDOR RÁPIDO */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-ecar-blue" />
                Nuevo Proveedor Rápido
              </h3>
              <button onClick={() => setShowSupplierModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Razón Social / Nombre *</label>
                <input
                  type="text"
                  required
                  value={newSupplierForm.name}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="Ej. Loma Negra S.A."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CUIT</label>
                <input
                  type="text"
                  value={newSupplierForm.cuit}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, cuit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                  placeholder="Ej. 30-12345678-9"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Condición Fiscal</label>
                <select
                  value={newSupplierForm.tax_condition}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, tax_condition: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="RI">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">Exento</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                  className="px-5 py-2 bg-ecar-blue text-white rounded-xl text-xs font-bold hover:bg-blue-800"
                >
                  {createSupplierMutation.isPending ? 'Guardando...' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OBSERVACIONES */}
      {showNotesModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                Observaciones del Comprobante
              </h3>
              <button onClick={() => setShowNotesModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Escribe observaciones, números de remito, justificaciones de compra, etc."
                className="w-full p-3 border rounded-xl text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="px-5 py-2 bg-ecar-blue text-white font-bold rounded-xl text-xs"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESCUENTO GLOBAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Percent size={18} className="text-emerald-500" />
                Descuento Global del Comprobante
              </h3>
              <button onClick={() => setShowDiscountModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monto de Descuento ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={globalDiscount}
                onChange={e => setGlobalDiscount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-5 py-2 bg-ecar-blue text-white font-bold rounded-xl text-xs"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFO PROVEEDOR */}
      {showSupplierInfo && selectedSupplier && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Info size={18} className="text-ecar-blue" />
                Ficha del Proveedor
              </h3>
              <button onClick={() => setShowSupplierInfo(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-500 block">Razón Social:</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedSupplier.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-500 block">CUIT:</span>
                  <span className="font-mono text-slate-800">{selectedSupplier.cuit || 'S/D'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-500 block">Condición Fiscal:</span>
                  <span className="text-slate-800">{selectedSupplier.tax_condition || 'RI'}</span>
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-500 block">Dirección:</span>
                <span className="text-slate-800">{selectedSupplier.address || 'No informada'}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-500 block">CBU / Alias:</span>
                <span className="font-mono text-slate-800">{selectedSupplier.bank_cbu || 'No informado'}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSupplierInfo(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-xs text-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
