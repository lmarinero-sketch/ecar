const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'purchases', 'NewPurchaseInvoiceModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import useCreateInventoryItem
content = content.replace(
  'useInventoryItems,',
  'useInventoryItems, useCreateInventoryItem,'
);

// 1.5 Import Save
content = content.replace(
  'X, Search, Plus, Info, Check, Trash2, ArrowLeft,',
  'X, Search, Plus, Info, Check, Trash2, ArrowLeft, Save,'
);

// 2. Add QuickItemModal component at the end of the file
const quickModalStr = `
const QuickItemModal: React.FC<{
  initialName: string;
  onClose: () => void;
  onSuccess: (item: any) => void;
}> = ({ initialName, onClose, onSuccess }) => {
  const [name, setName] = useState(initialName);
  const [rubro, setRubro] = useState('');
  const [unit, setUnit] = useState('unidad');
  const [unitCost, setUnitCost] = useState('0');
  const createItem = useCreateInventoryItem();
  const { user } = useAuth();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const payload = {
        tenant_id: user?.tenant_id || user?.id,
        name: name.trim(),
        category: 'material',
        rubro: rubro.trim() || null,
        unit: unit.trim() || 'unidad',
        current_stock: 0,
        min_stock: 0,
        unit_cost: parseFloat(unitCost) || 0,
        location: 'Pañol Principal',
      };
      const created: any = await createItem.mutateAsync(payload);
      onSuccess(created);
    } catch (err: any) {
      alert(err.message || 'Error creating item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Plus size={18} className="text-ecar-blue" />
            Crear Producto Rápido
          </h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Rubro</label>
            <input value={rubro} onChange={e => setRubro(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Herrajes, Pintura..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Unidad</label>
              <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Costo Estimado</label>
              <input type="number" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <button type="submit" disabled={createItem.isPending} className="w-full py-2.5 mt-2 bg-ecar-blue text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">
            {createItem.isPending ? 'Guardando...' : <><Save size={16} /> Guardar y Seleccionar</>}
          </button>
        </form>
      </div>
    </div>
  );
};
`;

content = content + '\n' + quickModalStr;

// 3. Add showQuickModal state
content = content.replace(
  'const [productName, setProductName] = useState(\'\');',
  'const [productName, setProductName] = useState(\'\');\n  const [showQuickModal, setShowQuickModal] = useState(false);'
);

// 4. Add QuickItemModal component render to the modal (before the final </div> of the NewPurchaseInvoiceModal)
content = content.replace(
  /    <\/div>\r?\n  \);\r?\n};\r?\n/,
  `      {showQuickModal && <QuickItemModal initialName={productSearch} onClose={() => setShowQuickModal(false)} onSuccess={(item) => { handleSelectProduct(item); setShowQuickModal(false); }} />}\n    </div>\n  );\n};\n`
);

// 5. Add "Crear Producto" button in the dropdown
const dropdownSearchStr = `{filteredProducts.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">`;
const newDropdownSearchStr = `
                        <div className="p-2 border-t border-slate-100 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              setIsProductOpen(false);
                              setShowQuickModal(true);
                            }}
                            className="w-full py-1.5 bg-ecar-blue/10 text-ecar-blue hover:bg-ecar-blue/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus size={14} /> Crear "{productSearch || 'Nuevo Producto'}"
                          </button>
                        </div>
                        {filteredProducts.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">`;
content = content.replace(dropdownSearchStr, newDropdownSearchStr);


// 6. Draft persistence
const effectDraftStr = `
  // LocalStorage Draft Persistence
  const DRAFT_KEY = 'purchase_invoice_draft';
  const hasLoadedDraft = useRef(false);

  useEffect(() => {
    if (invoiceToEdit || hasLoadedDraft.current) return;
    hasLoadedDraft.current = true;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        useModalStore.getState().showConfirm(
          'Factura Pendiente', 
          'Se detectó un borrador de factura sin guardar. ¿Deseas recuperarlo?'
        ).then(res => {
          if (res) {
            const data = JSON.parse(draft);
            if(data.supplierId) setSupplierId(data.supplierId);
            if(data.invoiceType) setInvoiceType(data.invoiceType);
            if(data.pointOfSale) setPointOfSale(data.pointOfSale);
            if(data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
            if(data.items) setItems(data.items);
            if(data.iva21) setIva21(data.iva21);
            if(data.iva105) setIva105(data.iva105);
            if(data.iva27) setIva27(data.iva27);
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        });
      }
    } catch(e) {}
  }, [invoiceToEdit]);

  useEffect(() => {
    if (invoiceToEdit || !hasLoadedDraft.current) return;
    const t = setTimeout(() => {
      const payload = {
        supplierId, invoiceType, pointOfSale, invoiceNumber, items, iva21, iva105, iva27
      };
      if (items.length > 0 || supplierId) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [supplierId, invoiceType, pointOfSale, invoiceNumber, items, iva21, iva105, iva27, invoiceToEdit]);

  // Clear draft on success
  const handleClearDraft = () => {
    if (!invoiceToEdit) {
      localStorage.removeItem(DRAFT_KEY);
    }
  };
`;

content = content.replace(
  '// Populate items from existing invoice if editing\n  useEffect(() => {',
  effectDraftStr + '\n  // Populate items from existing invoice if editing\n  useEffect(() => {'
);

content = content.replace(
  /onSuccess\(\);\r?\n          onClose\(\);/g,
  'handleClearDraft();\n          onSuccess();\n          onClose();'
);

fs.writeFileSync(filePath, content);
console.log('Patched NewPurchaseInvoiceModal successfully');
