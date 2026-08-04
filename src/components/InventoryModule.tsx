import React, { useState, useMemo } from 'react';
import {
  Package, Wrench, Search, Plus, X, ArrowDownToLine,
  RotateCcw, AlertTriangle, Boxes, User, Barcode,
  LayoutGrid, MapPin, Trash2, Edit3, Grid3X3, ShoppingBag,
  ShieldCheck, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import {
  useInventoryItems, useCreateInventoryItem, useInventoryMovements,
  useCreateInventoryMovement, useToolAssignments, useCreateToolAssignment,
  useUpdateToolAssignment, useUpdateInventoryItem, useProjects, useEmployees,
  useWarehouseShelves, useCreateWarehouseShelf, useUpdateWarehouseShelf, useDeleteWarehouseShelf,
  useCreatePurchaseRequest, useDeleteInventoryItem, useDeleteAllInventory, useCreateProject,
  useEmployeePPE, useCreateEmployeePPE
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useModalStore } from '../store/useModalStore';
import type { InventoryItem, WarehouseShelf } from '../lib/types';
import { BarcodeLabel } from './BarcodeLabel';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { WebGLWarehouseGrid } from './WebGLWarehouseGrid';
import { Rnd } from 'react-rnd';
import { WarehouseExcelImporter } from './warehouse/WarehouseExcelImporter';
import { ShelfFrontView } from './warehouse/ShelfFrontView';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

type Tab = 'stock' | 'tools' | 'movements' | 'shelves' | 'epp';
type RepoItem = { name: string; quantity: number; unit: string; unit_cost: number; id: string; current_stock: number; min_stock: number };

const SHELF_TYPES: Record<WarehouseShelf['shelf_type'], { label: string, icon: string }> = {
  rack: { label: 'Rack / Estantería', icon: '🗄️' },
  pallet: { label: 'Zona Pallets', icon: '📦' },
  cabinet: { label: 'Gabinete / Armario', icon: '🔒' },
  floor: { label: 'Piso Abierto', icon: '⬜' },
  wall: { label: 'Pared / Perchero', icon: '🪝' },
};

const SHELF_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#6B7280'];

export const InventoryModule: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  const isPanolero = profile?.role === 'panolero';
  const { data: items, isLoading } = useInventoryItems();
  const { data: movements } = useInventoryMovements();
  const { data: assignments } = useToolAssignments();
  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();
  const { data: shelves } = useWarehouseShelves();
  const createItem = useCreateInventoryItem();
  const createMovement = useCreateInventoryMovement();
  const createAssignment = useCreateToolAssignment();
  const updateAssignment = useUpdateToolAssignment();
  const updateItem = useUpdateInventoryItem();
  const createShelf = useCreateWarehouseShelf();
  const updateShelf = useUpdateWarehouseShelf();
  const deleteShelf = useDeleteWarehouseShelf();
  const createPurchaseReq = useCreatePurchaseRequest();
  const deleteItem = useDeleteInventoryItem();
  const deleteAllInventory = useDeleteAllInventory();
  const createProject = useCreateProject();
  const createEmployeePPE = useCreateEmployeePPE();

  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [showNewItem, setShowNewItem] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showMovement, setShowMovement] = useState<InventoryItem | null>(null);
  const [showAssign, setShowAssign] = useState<InventoryItem | null>(null);
  const [showBarcode, setShowBarcode] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Item Form state with Location/Bin coding [Letra]-[Estante]-[Bin]
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'material' as 'material' | 'herramienta' | 'consumible',
    unit: 'unidad',
    current_stock: '',
    min_stock: '',
    unit_cost: '',
    is_tool: false,
    barcode: '',
    location: '',
    shelf_id: '',
    shelf_position: '',
    measure: '',
    tool_status: 'operativa' as 'operativa' | 'mantenimiento' | 'no_funciona'
  });
  
  const [shelfLevel, setShelfLevel] = useState('1');
  const [shelfBin, setShelfBin] = useState('1');

  const [movForm, setMovForm] = useState({ movement_type: 'out' as 'in' | 'out' | 'return' | 'adjustment', quantity: '', notes: '', project_id: '' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', project_id: '', notes: '' });
  const [showNewShelf, setShowNewShelf] = useState(false);
  const [editingShelf, setEditingShelf] = useState<WarehouseShelf | null>(null);
  const [shelfForm, setShelfForm] = useState({ code: '', name: '', shelf_type: 'rack', rows_count: '4', columns_count: '3', color: '#3B82F6', notes: '', rotation: '0' });
  const [assignShelfItem, setAssignShelfItem] = useState<InventoryItem | null>(null);
  const [shelfAssignForm, setShelfAssignForm] = useState({ shelf_id: '', shelf_position: '' });
  
  // Reposición modal state
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoProjectId, setRepoProjectId] = useState<string>('');
  const [repoItems, setRepoItems] = useState<RepoItem[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [viewingShelf, setViewingShelf] = useState<WarehouseShelf | null>(null);

  // EPP Form State
  const [selectedEppEmployeeId, setSelectedEppEmployeeId] = useState<string>('');
  const [eppForm, setEppForm] = useState({
    item_type: 'pantalon',
    size: 'M',
    quantity: 1,
    delivery_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const selectedShelfCode = useMemo(() => {
    const s = (shelves || []).find(x => x.id === newItem.shelf_id);
    return s ? s.code : '';
  }, [shelves, newItem.shelf_id]);

  const openRepoModal = (items: RepoItem[]) => {
    setRepoItems(items);
    setRepoProjectId('');
    setShowRepoModal(true);
  };

  const handleRepoSubmit = async () => {
    try {
      await createPurchaseReq.mutateAsync({
        project_id: repoProjectId || null,
        urgency: repoItems.some(i => i.current_stock === 0) ? 'urgent' as const : 'normal' as const,
        urgency_reason: repoItems.some(i => i.current_stock === 0) ? `Stock agotado de ${repoItems.filter(i => i.current_stock === 0).map(i => i.name).join(', ')}` : undefined,
        status: 'pending',
        requested_by: 'Logística (Reposición)',
        notes: `Reposición de ${repoItems.length} ítem(s). ${repoProjectId ? 'Asignado a proyecto/centro de costo.' : 'Sin proyecto asignado.'}`,
        items: repoItems.map(i => ({
          description: i.name,
          quantity: Math.max(i.min_stock * 2 - i.current_stock, i.min_stock),
          unit: i.unit || 'unidad',
          estimated_unit_cost: i.unit_cost || 0,
          inventory_item_id: i.id,
        }))
      });
      useModalStore.getState().showAlert('Éxito', `Solicitud de reposición enviada a Compras con ${repoItems.length} ítems.`);
      setShowRepoModal(false);
    } catch {
      useModalStore.getState().showAlert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  const seedDefaultShelves = async () => {
    const defaultShelves = [
      { code: 'A', name: 'Herramientas eléctricas', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#3B82F6', grid_row: 30, grid_col: 40, grid_width: 220, grid_height: 120, notes: 'Taladros, amoladoras, sierras, cargadores y accesorios eléctricos.' },
      { code: 'B', name: 'Electricidad', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#8B5CF6', grid_row: 30, grid_col: 300, grid_width: 220, grid_height: 120, notes: 'Cables, llaves térmicas, tomas, cajas, materiales de instalación eléctrica.' },
      { code: 'C', name: 'Gas', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#F59E0B', grid_row: 30, grid_col: 560, grid_width: 220, grid_height: 120, notes: 'Cañerías, llaves de paso, accesorios y materiales para instalaciones de gas.' },
      { code: 'D', name: 'Agua y Cloaca', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#10B981', grid_row: 260, grid_col: 100, grid_width: 260, grid_height: 130, notes: 'Caños, accesorios sanitarios, materiales de agua y desagüe cloacal en conjunto.' },
      { code: 'E', name: 'EPP / Ferretería', shelf_type: 'rack' as const, rows_count: 4, columns_count: 3, color: '#EF4444', grid_row: 260, grid_col: 460, grid_width: 260, grid_height: 130, notes: 'Elementos de protección personal (cascos, guantes, arneses) junto con ferretería general (tornillos, bulones, varios).' }
    ];

    try {
      for (const s of defaultShelves) {
        const exists = (shelves || []).find(ex => ex.code === s.code);
        if (!exists) {
          await createShelf.mutateAsync(s);
        } else {
          await updateShelf.mutateAsync({ id: exists.id, ...s });
        }
      }
      useModalStore.getState().showAlert('Éxito', 'Estanterías A, B, C, D, E cargadas/actualizadas según plano de distribución.');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', 'No se pudieron cargar las estanterías: ' + err.message);
    }
  };

  const generateRandomBarcode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewItem(prev => ({ ...prev, barcode: `ECAR-${result}` }));
  };

  const printTempBarcode = () => {
    if (!newItem.barcode) return;
    setShowBarcode({
      id: 'temp',
      tenant_id: '',
      name: newItem.name || 'Nuevo Ítem',
      barcode: newItem.barcode,
      category: newItem.category || 'material',
      location: newItem.location || 'Depósito',
      current_stock: parseFloat(newItem.current_stock) || 0,
      unit: newItem.unit || 'unidad',
      is_tool: newItem.category === 'herramienta',
      min_stock: parseFloat(newItem.min_stock) || 0,
      unit_cost: parseFloat(newItem.unit_cost) || 0,
      qr_code: '',
      shelf_id: null,
      shelf_position: null,
      rubro: null,
      measure: null,
      notes: null,
      created_at: new Date().toISOString()
    });
  };

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(i => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = i.name.toLowerCase().includes(q);
        const matchesBarcode = i.barcode?.toLowerCase().includes(q);
        const matchesPosition = i.shelf_position?.toLowerCase().includes(q);
        const matchesLocation = i.location?.toLowerCase().includes(q);
        const matchesMeasure = i.measure?.toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesPosition && !matchesLocation && !matchesMeasure) return false;
      }
      if (filterCat && i.category !== filterCat) return false;
      if (tab === 'tools' && !i.is_tool) return false;
      return true;
    });
  }, [items, search, filterCat, tab]);

  const lowStockItems = useMemo(() => (items || []).filter(i => i.current_stock <= i.min_stock && i.min_stock > 0), [items]);
  const totalValue = useMemo(() => (items || []).reduce((s, i) => s + i.current_stock * i.unit_cost, 0), [items]);
  const activeAssignments = useMemo(() => (assignments || []).filter(a => a.status === 'assigned'), [assignments]);

  const handleNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newItem.name.trim()) {
        useModalStore.getState().showAlert('Atención', 'Por favor ingrese el nombre del ítem.');
        return;
      }

      // Format location code [Letra]-[Estante]-[Bin] (e.g. C-3-2)
      const computedPos = selectedShelfCode ? `${selectedShelfCode}-${shelfLevel}-${shelfBin}` : (newItem.shelf_position || null);

      const payload: any = {
        name: newItem.name.trim(),
        category: newItem.category,
        unit: newItem.unit,
        measure: newItem.measure ? newItem.measure.trim() : null,
        current_stock: newItem.current_stock !== '' ? parseFloat(newItem.current_stock) || 0 : 0,
        min_stock: newItem.min_stock !== '' ? parseFloat(newItem.min_stock) || 0 : 0,
        unit_cost: newItem.unit_cost !== '' ? parseFloat(newItem.unit_cost) || 0 : 0,
        is_tool: newItem.is_tool || newItem.category === 'herramienta',
        barcode: newItem.barcode ? newItem.barcode.trim() : null,
        location: computedPos ? `Ubicación ${computedPos}` : (newItem.location || 'Depósito'),
        shelf_id: newItem.shelf_id || null,
        shelf_position: computedPos || null,
      };

      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...payload });
        useModalStore.getState().showAlert('Éxito', 'Ítem actualizado correctamente.');
      } else {
        const created: any = await createItem.mutateAsync(payload);
        // Create initial stock movement if stock > 0
        if (payload.current_stock > 0 && (created?.id || (Array.isArray(created) && created[0]?.id))) {
          const itemId = created?.id || created[0]?.id;
          try {
            await createMovement.mutateAsync({
              item_id: itemId,
              movement_type: 'in',
              quantity: payload.current_stock,
              notes: 'Ingreso Inicial de Stock',
              project_id: null
            });
          } catch (mErr) {
            console.warn('No se pudo registrar el movimiento inicial de stock:', mErr);
          }
        }
        useModalStore.getState().showAlert('Éxito', 'Ítem creado correctamente.');
      }

      setShowNewItem(false);
      setEditingItem(null);
      setNewItem({
        name: '',
        category: 'material',
        unit: 'unidad',
        measure: '',
        current_stock: '',
        min_stock: '',
        unit_cost: '',
        is_tool: false,
        barcode: '',
        location: '',
        shelf_id: '',
        shelf_position: '',
        tool_status: 'operativa'
      });
    } catch (err: any) {
      console.error('Error al guardar ítem:', err);
      useModalStore.getState().showAlert('Error al Guardar', err?.message || 'No se pudo guardar el ítem.');
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovement) return;
    try {
      await createMovement.mutateAsync({
        item_id: showMovement.id,
        movement_type: movForm.movement_type,
        quantity: parseFloat(movForm.quantity),
        project_id: movForm.project_id || null,
        notes: movForm.notes || null,
      });
      useModalStore.getState().showAlert('Éxito', 'Movimiento registrado en Kardex.');
      setShowMovement(null);
      setMovForm({ movement_type: 'out', quantity: '', notes: '', project_id: '' });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo registrar el movimiento.');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssign) return;
    try {
      await createAssignment.mutateAsync({
        item_id: showAssign.id,
        employee_id: assignForm.employee_id,
        project_id: assignForm.project_id || null,
        notes: assignForm.notes || null,
      });
      useModalStore.getState().showAlert('Éxito', 'Herramienta asignada al colaborador.');
      setShowAssign(null);
      setAssignForm({ employee_id: '', project_id: '', notes: '' });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo asignar la herramienta.');
    }
  };

  const handleSaveShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: shelfForm.code.trim(),
        name: shelfForm.name.trim(),
        shelf_type: shelfForm.shelf_type as any,
        rows_count: parseInt(shelfForm.rows_count) || 4,
        columns_count: parseInt(shelfForm.columns_count) || 3,
        color: shelfForm.color,
        notes: shelfForm.notes || null,
        rotation: parseInt(shelfForm.rotation) || 0,
      };

      if (editingShelf) {
        await updateShelf.mutateAsync({ id: editingShelf.id, ...payload });
        useModalStore.getState().showAlert('Éxito', 'Estantería actualizada.');
      } else {
        await createShelf.mutateAsync({
          ...payload,
          grid_row: 50,
          grid_col: 50,
          grid_width: 220,
          grid_height: 120
        });
        useModalStore.getState().showAlert('Éxito', 'Nueva estantería creada.');
      }
      setShowNewShelf(false);
      setEditingShelf(null);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo guardar la estantería.');
    }
  };

  const handleCreateEppDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEppEmployeeId) {
      useModalStore.getState().showAlert('Atención', 'Seleccioná un empleado para la entrega.');
      return;
    }
    try {
      await createEmployeePPE.mutateAsync({
        employee_id: selectedEppEmployeeId,
        item_type: eppForm.item_type as any,
        size: eppForm.size,
        quantity: eppForm.quantity,
        delivery_date: eppForm.delivery_date,
        notes: eppForm.notes || null,
      });
      useModalStore.getState().showAlert('Éxito', 'Entrega de EPP registrada.');
      setEppForm({
        item_type: 'pantalon',
        size: 'M',
        quantity: 1,
        delivery_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo registrar la entrega.');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Boxes size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <Package size={24} /> Depósito & Inventario Pañol ECAR
          </h3>
          <p className="text-ecar-blueLight text-sm mt-1 max-w-2xl">
            Doc PR-GL-01 §4.3 — Control de materiales, herramientas eléctricas, estanterías A-E y entregas de EPP
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Boxes size={16} className="text-blue-500" /> Ítems Registrados</div>
          <p className="text-2xl font-black text-blue-600 font-mono">{(items || []).length}</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-ecar-blue" /> Herramientas Asignadas</div>
          <p className="text-2xl font-black text-ecar-blue font-mono">{activeAssignments.length}</p>
        </div>
        <div className={`light-card p-5 ${lowStockItems.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Stock Bajo</div>
          <p className="text-2xl font-black text-red-600 font-mono">{lowStockItems.length}</p>
          {lowStockItems.length > 0 && (
            <button
              onClick={() => openRepoModal(lowStockItems.map(i => ({ name: i.name, quantity: i.current_stock, unit: i.unit, unit_cost: i.unit_cost, id: i.id, current_stock: i.current_stock, min_stock: i.min_stock })))}
              className="mt-2 w-full px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShoppingBag size={12} /> Solicitar Reposición
            </button>
          )}
        </div>
        {!isPanolero && (
          <div className="light-card p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Package size={16} className="text-emerald-500" /> Valor Total Depósito</div>
            <p className="text-2xl font-black text-emerald-600 font-mono">{fmt(totalValue)}</p>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          ['stock', '📦 Stock General', null],
          ['tools', '🔧 Herramientas Eléctricas', null],
          ['movements', '📋 Kardex Entradas/Salidas', null],
          ['shelves', '🗄️ Estanterías Almacén (A-E)', null],
          ['epp', '🦺 Entrega de EPP', null]
        ] as [Tab, string, null][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2.5 rounded-md text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stock tab */}
      {tab === 'stock' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código de barras o ubicación (ej: C-3-2)..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30"
              />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="">Todas las categorías</option>
              <option value="material">📦 Materiales</option>
              <option value="herramienta">🔧 Herramientas</option>
              <option value="consumible">🔩 Consumibles</option>
            </select>
            <button onClick={() => setShowImporter(true)} className="btn-secondary">
              <ArrowDownToLine size={16} /> Importar Excel
            </button>
            <button onClick={() => setShowScanner(true)} className="btn-secondary">
              <Barcode size={16} /> Escanear Código
            </button>
            <button
              onClick={() => {
                setShowNewItem(true);
                setEditingItem(null);
                setNewItem({
                  name: '',
                  category: 'material',
                  unit: 'unidad',
                  measure: '',
                  current_stock: '',
                  min_stock: '',
                  unit_cost: '',
                  is_tool: false,
                  barcode: '',
                  location: '',
                  shelf_id: '',
                  shelf_position: '',
                  tool_status: 'operativa'
                });
                setShelfLevel('1');
                setShelfBin('1');
              }}
              className="btn-primary"
            >
              <Plus size={16} /> Nuevo Ítem
            </button>
            {isAdmin && (
              <button
                onClick={async () => {
                  if (await useModalStore.getState().showConfirm('Confirmar Purga', '⚠️ ¿Estás seguro que deseas eliminar TODO el inventario? Esta acción no se puede deshacer.')) {
                    deleteAllInventory.mutate();
                  }
                }}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-100 flex items-center gap-2"
              >
                <Trash2 size={16} /> Vaciar Inventario
              </button>
            )}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ítem / Descripción</th>
                <th>Categoría</th>
                <th>Ubicación Bin (Est-Estante-Bin)</th>
                <th>Medida</th>
                <th>Unidad</th>
                <th className="text-center">Stock</th>
                <th className="text-center">Mínimo</th>
                {!isPanolero && <th className="text-right">Costo Unit.</th>}
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className={item.current_stock <= item.min_stock && item.min_stock > 0 ? 'bg-red-50/50' : ''}>
                  <td className="font-medium text-gray-800">
                    <div>{item.name}</div>
                    {item.barcode && <span className="font-mono text-[10px] text-gray-400">🏷️ {item.barcode}</span>}
                  </td>
                  <td>
                    <span className={`badge ${item.category === 'herramienta' ? 'badge-info' : item.category === 'consumible' ? 'badge-neutral' : 'badge-warning'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    {item.shelf ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: (item.shelf as any)?.color || '#6B7280' }} />
                        <span className="text-xs font-bold text-gray-800 font-mono">
                          {(item.shelf as any)?.code}
                          {item.shelf_position ? `-${item.shelf_position.replace(/^N(\d+)-C(\d+)$/, '$1-$2')}` : ''}
                        </span>
                      </div>
                    ) : item.shelf_position ? (
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        📍 {item.shelf_position}
                      </span>
                    ) : (
                      <button onClick={() => { setAssignShelfItem(item); setShelfAssignForm({ shelf_id: '', shelf_position: '' }); }} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1 transition-colors">
                        <MapPin size={12} /> Asignar
                      </button>
                    )}
                  </td>
                  <td className="text-gray-600 font-medium">{item.measure || '-'}</td>
                  <td className="text-gray-500 text-xs uppercase">{item.unit || 'un'}</td>
                  <td className="text-center font-mono font-bold text-gray-800">{item.current_stock}</td>
                  <td className="text-center font-mono text-gray-400">{item.min_stock}</td>
                  {!isPanolero && <td className="text-right font-mono text-gray-600">{fmt(item.unit_cost)}</td>}
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setNewItem({
                            name: item.name,
                            category: item.category as any,
                            unit: item.unit,
                            measure: item.measure || '',
                            current_stock: String(item.current_stock),
                            min_stock: String(item.min_stock),
                            unit_cost: String(item.unit_cost),
                            is_tool: item.is_tool,
                            barcode: item.barcode || '',
                            location: item.location || '',
                            shelf_id: item.shelf_id || '',
                            shelf_position: item.shelf_position || '',
                            tool_status: 'operativa'
                          });
                          setShowNewItem(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                        title="Editar"
                      >
                        <Edit3 size={14} className="text-gray-600" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={async () => { if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar este ítem?')) deleteItem.mutateAsync(item.id); }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      )}
                      <button onClick={() => setShowMovement(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Registrar movimiento"><ArrowDownToLine size={14} className="text-blue-600" /></button>
                      {item.is_tool && <button onClick={() => setShowAssign(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Asignar herramienta"><User size={14} className="text-ecar-blue" /></button>}
                      <button onClick={() => { setAssignShelfItem(item); setShelfAssignForm({ shelf_id: item.shelf_id || '', shelf_position: item.shelf_position || '' }); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Cambiar ubicación bin"><MapPin size={14} className="text-orange-500" /></button>
                      <button onClick={() => setShowBarcode(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Código de barras"><Barcode size={14} className="text-gray-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400"><Package size={48} className="mx-auto mb-3 opacity-30" /><p>No hay ítems registrados</p></div>}
        </div>
      )}

      {/* Tools tab (Herramientas Eléctricas & Prestamos) */}
      {tab === 'tools' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">⚡ Gestión de Herramientas Eléctricas (Estantería A)</h3>
              <p className="text-xs text-slate-300">Control individual con código único, estado físico (Operativa / Mantenimiento / No Funciona) y trazabilidad de préstamos.</p>
            </div>
            <button
              onClick={() => {
                setShowNewItem(true);
                setEditingItem(null);
                setNewItem({
                  name: '',
                  category: 'herramienta',
                  unit: 'unidad',
                  measure: '',
                  current_stock: '1',
                  min_stock: '1',
                  unit_cost: '',
                  is_tool: true,
                  barcode: '',
                  location: 'Estantería A - Herramientas Eléctricas',
                  shelf_id: (shelves || []).find(s => s.code === 'A')?.id || '',
                  shelf_position: 'A-1-1',
                  tool_status: 'operativa'
                });
              }}
              className="btn-primary"
            >
              <Plus size={16} /> Registrar Herramienta
            </button>
          </div>

          <div className="light-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código Único / Serie</th>
                  <th>Herramienta</th>
                  <th>Ubicación Estantería A</th>
                  <th className="text-center">Estado Físico</th>
                  <th className="text-center">Stock</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs font-bold text-ecar-blue">{item.barcode || 'SIN-CÓDIGO'}</td>
                    <td className="font-medium text-gray-800">{item.name}</td>
                    <td className="font-mono text-xs text-gray-600">
                      📍 {item.shelf_position || 'Estantería A'}
                    </td>
                    <td className="text-center">
                      <span className="badge badge-success flex items-center gap-1 justify-center mx-auto">
                        <CheckCircle2 size={12} /> Operativa
                      </span>
                    </td>
                    <td className="text-center font-mono font-bold">{item.current_stock} {item.unit}</td>
                    <td className="text-center">
                      <button onClick={() => setShowAssign(item)} className="btn-secondary text-xs px-2.5 py-1 py-0.5">
                        <User size={12} /> Asignar / Préstamo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Active Tool Assignments */}
          <div className="light-card overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={16} /> Préstamos Diarios Activos</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">{activeAssignments.length} prestadas</span>
            </div>
            {activeAssignments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Herramienta</th>
                    <th>Empleado (Retiró)</th>
                    <th>Obra / Destino</th>
                    <th>Fecha Retiro</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssignments.map(a => (
                    <tr key={a.id}>
                      <td className="font-medium text-gray-900">{(a.item as any)?.name || '—'}</td>
                      <td>{(a.employee as any)?.full_name || 'Sin asignar'}</td>
                      <td>{(a.project as any)?.name || 'Sin obra'}</td>
                      <td className="font-mono text-xs text-gray-500">{new Date(a.assigned_date).toLocaleDateString('es-AR')}</td>
                      <td className="text-center">
                        <button
                          onClick={() => updateAssignment.mutateAsync({ id: a.id, status: 'returned', returned_date: new Date().toISOString().split('T')[0] })}
                          className="badge badge-success hover:bg-emerald-600 cursor-pointer"
                        >
                          <RotateCcw size={12} /> Registrar Devolución
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400"><Wrench size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Todas las herramientas están guardadas en pañol</p></div>
            )}
          </div>
        </div>
      )}

      {/* Movements tab */}
      {tab === 'movements' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>📦</span> Kardex General de Movimientos y Registro de Pañol
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Auditoría completa de entradas, salidas por despacho a obras y ajustes de stock.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-lg text-sky-300">
              {(movements || []).length} registros
            </span>
          </div>
          {(movements || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Ítem / Material</th>
                    <th>Tipo Operación</th>
                    <th className="text-center">Cantidad</th>
                    <th>Obra Destino</th>
                    <th>Responsable Pañol</th>
                    <th>Detalle / Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {(movements || []).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-mono text-xs text-gray-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="font-bold text-gray-800">{(m.item as any)?.name || '—'}</td>
                      <td>
                        <span className={`badge ${m.movement_type === 'in' ? 'badge-success' : m.movement_type === 'out' ? 'badge-danger' : m.movement_type === 'return' ? 'badge-info' : 'badge-neutral'}`}>
                          {m.movement_type === 'in' ? '🟢 Ingreso Stock' : m.movement_type === 'out' ? '🔴 Egreso / Despacho' : m.movement_type === 'return' ? '🔵 Devolución' : '⚙️ Ajuste'}
                        </span>
                      </td>
                      <td className="text-center font-mono font-bold text-sm text-gray-900">{m.quantity}</td>
                      <td className="text-gray-700 font-medium">{(m.project as any)?.name || '—'}</td>
                      <td className="text-gray-800 font-bold text-xs bg-slate-100 px-2 py-1 rounded-md inline-block my-1">
                        👤 {m.created_by || 'Pañol Central'}
                      </td>
                      <td className="text-gray-600 text-xs italic">{m.notes || 'Sin observaciones'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400"><ArrowDownToLine size={48} className="mx-auto mb-3 opacity-30" /><p>Sin movimientos aún</p></div>
          )}
        </div>
      )}

      {/* Shelves tab (Plano de distribución A-E) */}
      {tab === 'shelves' && (() => {
        const shelfList = shelves || [];
        const itemsByShelf = (items || []).reduce((acc, item) => {
          if (item.shelf_id) acc[item.shelf_id] = (acc[item.shelf_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return (
          <div className="space-y-6">
            {/* Diagrama Visual del Depósito */}
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <LayoutGrid size={18} /> Plano Orientativo Almacén Pequeño — 50 m² (10 m x 5 m)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Ubicación estandarizada de las 5 estanterías (A-E) con pasillo central de circulación y entrada.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={seedDefaultShelves} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5">
                    🗺️ Cargar Distribución A-E (50m²)
                  </button>
                  <button onClick={() => setShowImporter(true)} className="btn-secondary text-xs">
                    <ArrowDownToLine size={14} /> Importar Excel
                  </button>
                  <button onClick={() => { setShowNewShelf(true); setEditingShelf(null); setShelfForm({ code: '', name: '', shelf_type: 'rack', rows_count: '4', columns_count: '3', color: '#3B82F6', notes: '', rotation: '0' }); }} className="btn-primary text-xs">
                    <Plus size={14} /> Nueva Estantería
                  </button>
                </div>
              </div>

              {/* Warehouse Layout Map 10m x 5m */}
              <div className="p-6 bg-slate-50">
                <div className="relative border-4 border-slate-700 rounded-2xl p-6 bg-white shadow-xl max-w-5xl mx-auto overflow-hidden">
                  
                  {/* Top Header Label */}
                  <div className="text-center font-black text-sm tracking-wider uppercase bg-slate-800 text-white py-1.5 rounded-lg mb-6 shadow-sm">
                    ALMACÉN PEQUEÑO — 50 m² (10 m x 5 m)
                  </div>

                  {/* 3D Moving Mesh decorative background */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <WebGLWarehouseGrid />
                  </div>

                  {/* Shelves Layout Canvas */}
                  <div className="relative z-10 space-y-8 py-4">
                    
                    {/* Top Row: A, B, C */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { letter: 'A', name: 'Herramientas eléctricas', desc: 'Taladros, amoladoras, sierras, cargadores', color: '#3B82F6' },
                        { letter: 'B', name: 'Electricidad', desc: 'Cables, llaves térmicas, tomas, cajas', color: '#8B5CF6' },
                        { letter: 'C', name: 'Gas', desc: 'Cañerías, llaves de paso, accesorios', color: '#F59E0B' }
                      ].map(cfg => {
                        const sh = shelfList.find(s => s.code === cfg.letter);
                        return (
                          <div
                            key={cfg.letter}
                            onClick={() => sh && setViewingShelf(sh)}
                            className="bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                            style={{ borderColor: cfg.color }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="w-8 h-8 rounded-lg font-black text-white flex items-center justify-center text-base shadow" style={{ backgroundColor: cfg.color }}>
                                {cfg.letter}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                                {itemsByShelf[sh?.id || ''] || 0} ítems
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm">{cfg.name}</h4>
                            <p className="text-[11px] text-gray-500 mt-1">{cfg.desc}</p>
                            <div className="mt-3 text-[10px] font-mono text-gray-400 flex justify-between border-t pt-2">
                              <span>Formato Bin: {cfg.letter}-[Nº]-[Bin]</span>
                              <span className="text-orange-600 font-bold group-hover:underline">Ver Niveles →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pasillo Central */}
                    <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-xl py-3 text-center flex items-center justify-center gap-3">
                      <span className="text-orange-500 font-bold">⬆️</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-orange-800">Pasillo Central de Circulación</span>
                      <span className="text-orange-500 font-bold">⬇️</span>
                    </div>

                    {/* Bottom Row: D, E */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                      {[
                        { letter: 'D', name: 'Agua y Cloaca', desc: 'Caños, accesorios sanitarios, agua y desagüe', color: '#10B981' },
                        { letter: 'E', name: 'EPP / Ferretería', desc: 'Protección personal, tornillos, bulones', color: '#EF4444' }
                      ].map(cfg => {
                        const sh = shelfList.find(s => s.code === cfg.letter);
                        return (
                          <div
                            key={cfg.letter}
                            onClick={() => sh && setViewingShelf(sh)}
                            className="bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                            style={{ borderColor: cfg.color }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="w-8 h-8 rounded-lg font-black text-white flex items-center justify-center text-base shadow" style={{ backgroundColor: cfg.color }}>
                                {cfg.letter}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                                {itemsByShelf[sh?.id || ''] || 0} ítems
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm">{cfg.name}</h4>
                            <p className="text-[11px] text-gray-500 mt-1">{cfg.desc}</p>
                            <div className="mt-3 text-[10px] font-mono text-gray-400 flex justify-between border-t pt-2">
                              <span>Formato Bin: {cfg.letter}-[Nº]-[Bin]</span>
                              <span className="text-orange-600 font-bold group-hover:underline">Ver Niveles →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ENTRADA Door Indicator at Bottom */}
                    <div className="flex justify-center pt-2">
                      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-xs px-8 py-2 rounded-xl shadow-md border-2 border-white flex items-center gap-2">
                        <span>🚪</span> ENTRADA ALMACÉN (10 m)
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Inspector Front View */}
              {viewingShelf && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: viewingShelf.color }} />
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">{viewingShelf.name} (Estantería {viewingShelf.code})</h3>
                          <p className="text-xs text-gray-500 font-mono">Formato de ubicación bin: {viewingShelf.code}-[Nº Estante]-[Nº Bin]</p>
                        </div>
                      </div>
                      <button onClick={() => setViewingShelf(null)} className="btn-secondary text-xs"><X size={14} /> Cerrar Vista</button>
                    </div>
                    <ShelfFrontView shelf={viewingShelf} items={(items || []).filter(i => i.shelf_id === viewingShelf.id)} />
                  </div>
                </div>
              )}
            </div>

            {/* Lista de estanterías */}
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800">Detalle de Estanterías A-E</h3>
              </div>
              {shelfList.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre Estantería</th>
                      <th>Tipo</th>
                      <th className="text-center">Niveles / Bins</th>
                      <th className="text-center">Ítems Asignados</th>
                      <th>Descripción / Contenido</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shelfList.map(s => (
                      <tr key={s.id}>
                        <td><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} /><span className="font-bold font-mono text-sm">{s.code}</span></div></td>
                        <td className="font-medium text-gray-900">{s.name}</td>
                        <td><span className="badge badge-neutral">{SHELF_TYPES[s.shelf_type]?.icon} {SHELF_TYPES[s.shelf_type]?.label}</span></td>
                        <td className="text-center font-mono">{s.rows_count} Niveles × {s.columns_count} Bins</td>
                        <td className="text-center"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{itemsByShelf[s.id] || 0}</span></td>
                        <td className="text-gray-500 text-xs">{s.notes || '—'}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setViewingShelf(s)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Ver niveles y bins"><Search size={14} className="text-gray-600" /></button>
                            <button onClick={() => { setEditingShelf(s); setShelfForm({ code: s.code, name: s.name, shelf_type: s.shelf_type, rows_count: String(s.rows_count), columns_count: String(s.columns_count), color: s.color, notes: s.notes || '', rotation: String(s.rotation || 0) }); setShowNewShelf(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit3 size={14} className="text-blue-600" /></button>
                            {isAdmin && <button onClick={async () => { if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar estantería?')) deleteShelf.mutateAsync(s.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      {/* EPP Tab */}
      {tab === 'epp' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-xl flex items-center gap-2"><ShieldCheck size={24} /> Registro de Entrega de EPP (Elementos de Protección Personal)</h3>
            <p className="text-emerald-100 text-xs mt-1">Control por empleado de cascos, guantes, anteojos de seguridad, arneses, calzado y ropa de trabajo (Estantería E).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivery Form */}
            <div className="light-card p-5 space-y-4">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Plus size={16} className="text-emerald-600" /> Registrar Entrega de EPP</h4>
              <form onSubmit={handleCreateEppDelivery} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Empleado *</label>
                  <select
                    value={selectedEppEmployeeId}
                    onChange={e => setSelectedEppEmployeeId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white font-medium"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {(employees || []).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.legajo || 'Sin legajo'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Elemento Entregado *</label>
                  <select
                    value={eppForm.item_type}
                    onChange={e => setEppForm({ ...eppForm, item_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="pantalon">👖 Pantalón de Trabajo</option>
                    <option value="zapatos">🥾 Zapatos / Calzado de Seguridad</option>
                    <option value="campera">🧥 Campera de Abrigo / Ignífuga</option>
                    <option value="camisa">👔 Camisa de Trabajo</option>
                    <option value="remera">👕 Remera</option>
                    <option value="casco">🪖 Casco de Seguridad (EPP)</option>
                    <option value="guantes">🧤 Guantes de Protección (EPP)</option>
                    <option value="anteojos">🥽 Anteojos de Seguridad (EPP)</option>
                    <option value="arnes">🦺 Arnés de Seguridad (EPP)</option>
                    <option value="otro">📦 Otro Elemento de Protección</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">Talle / Dimensión</label>
                    <input
                      value={eppForm.size}
                      onChange={e => setEppForm({ ...eppForm, size: e.target.value })}
                      placeholder="Ej: 42, L, XL"
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={eppForm.quantity}
                      onChange={e => setEppForm({ ...eppForm, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={eppForm.delivery_date}
                    onChange={e => setEppForm({ ...eppForm, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Observaciones</label>
                  <input
                    value={eppForm.notes}
                    onChange={e => setEppForm({ ...eppForm, notes: e.target.value })}
                    placeholder="Ej: Firma en planilla N° 12..."
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <button type="submit" disabled={createEmployeePPE.isPending} className="btn-primary w-full py-2.5 text-sm">
                  {createEmployeePPE.isPending ? 'Guardando...' : '✅ Registrar Entrega'}
                </button>
              </form>
            </div>

            {/* Employee Audit View */}
            <div className="md:col-span-2 light-card p-5">
              <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center justify-between">
                <span>Historial de Entregas por Empleado</span>
                {selectedEppEmployeeId && (
                  <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Filtrando por: {(employees || []).find(e => e.id === selectedEppEmployeeId)?.full_name}
                  </span>
                )}
              </h4>
              {selectedEppEmployeeId ? (
                <EppAuditList employeeId={selectedEppEmployeeId} />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ShieldCheck size={48} className="mx-auto mb-2 opacity-30 text-emerald-600" />
                  <p className="text-sm font-medium">Seleccioná un empleado para ver su historial de entregas de EPP</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo / Editar Ítem */}
      {showNewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingItem ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}</h3>
              <button onClick={() => setShowNewItem(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleNewItem} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Nombre del Ítem *</label>
                  <input
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30"
                    placeholder="Ej: Codo termofusion 20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Medida / Dimensión</label>
                  <input
                    value={newItem.measure}
                    onChange={e => setNewItem({ ...newItem, measure: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30"
                    placeholder="Ej: 20, 1/2&quot;, 110mm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Código Único / Barras / QR (Opcional)</label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    value={newItem.barcode}
                    onChange={e => setNewItem({ ...newItem, barcode: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30"
                    placeholder="Ej: ECAR-A1B2C3D4"
                  />
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 shrink-0"
                    title="Generar código aleatorio"
                  >
                    ⚡ Generar
                  </button>
                  <button
                    type="button"
                    disabled={!newItem.barcode}
                    onClick={printTempBarcode}
                    className="btn-primary shrink-0"
                    title="Imprimir"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Categoría</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="material">📦 Material</option>
                    <option value="herramienta">🔧 Herramienta</option>
                    <option value="consumible">🔩 Consumible</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Unidad de Medida</label>
                  <select
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="unidad">Unidad (un)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="tn">Toneladas (tn)</option>
                    <option value="l">Litros (l)</option>
                    <option value="m">Metros (m)</option>
                    <option value="m2">Metros Cuadrados (m2)</option>
                    <option value="m3">Metros Cúbicos (m3)</option>
                    <option value="bl">Bolsa (bl)</option>
                    <option value="cj">Caja (cj)</option>
                    <option value="par">Par</option>
                    <option value="juego">Juego</option>
                  </select>
                </div>
              </div>

              {/* Codificación interna: estantería A-E, estante (nivel) y bin (cajón) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">📍 Ubicación en Almacén: Estantería, Estante (Nivel) y Bin (Cajón)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Estantería A-E</label>
                    <select
                      value={newItem.shelf_id}
                      onChange={e => setNewItem({ ...newItem, shelf_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="">Sin asignar</option>
                      {(shelves || []).map(s => (
                        <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Estante / Nivel</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={shelfLevel}
                      onChange={e => setShelfLevel(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                      placeholder="Ej: 3"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Bin / Cajón</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={shelfBin}
                      onChange={e => setShelfBin(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                      placeholder="Ej: 2"
                    />
                  </div>
                </div>
                {selectedShelfCode && (
                  <div className="text-xs font-mono font-bold text-ecar-blue flex items-center gap-1.5 pt-1">
                    <span>Código Ubicación:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                      {selectedShelfCode}-{shelfLevel}-{shelfBin}
                    </span>
                    <span className="text-gray-400 font-normal text-[10px]">(Estantería {selectedShelfCode}, Estante {shelfLevel}, Bin {shelfBin})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Stock Actual</label>
                  <input
                    type="number"
                    value={newItem.current_stock}
                    onChange={e => setNewItem({ ...newItem, current_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Stock Mínimo</label>
                  <input
                    type="number"
                    value={newItem.min_stock}
                    onChange={e => setNewItem({ ...newItem, min_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Costo Unit. ($)</label>
                  <input
                    type="number"
                    value={newItem.unit_cost}
                    onChange={e => setNewItem({ ...newItem, unit_cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createItem.isPending || updateItem.isPending}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50"
              >
                {(createItem.isPending || updateItem.isPending) ? 'Guardando...' : editingItem ? '✅ Guardar Cambios' : '✅ Crear Ítem'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento */}
      {showMovement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Movimiento: {showMovement.name}</h3><button onClick={() => setShowMovement(null)}><X size={20} className="text-gray-400" /></button></div>
            <p className="text-sm text-gray-500">Stock actual: <span className="font-mono font-bold">{showMovement.current_stock} {showMovement.unit}</span></p>
            <form onSubmit={handleMovement} className="space-y-3">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['in', 'out', 'return', 'adjustment'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setMovForm({ ...movForm, movement_type: t })} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${movForm.movement_type === t ? 'bg-white shadow-sm text-orange-700' : 'text-gray-500'}`}>
                    {t === 'in' ? '📥 Ingreso' : t === 'out' ? '📤 Egreso' : t === 'return' ? '🔄 Devolución' : '⚙️ Ajuste'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Cantidad *</label><input type="number" value={movForm.quantity} onChange={e => setMovForm({ ...movForm, quantity: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-xs font-bold text-gray-500">Obra</label><select value={movForm.project_id} onChange={e => {
                  if (e.target.value === 'NEW_PROJECT') {
                    const name = prompt('Ingrese el nombre de la nueva obra/proyecto:');
                    if (name && name.trim()) {
                      createProject.mutate({ name: name.trim(), status: 'active', budget_ars: 0, client_name: '', client_cuit: '', location: '', start_date: new Date().toISOString().split('T')[0], end_date: null }, {
                        onSuccess: (newProject) => {
                          setMovForm(prev => ({ ...prev, project_id: newProject.id }));
                        }
                      });
                    }
                  } else {
                    setMovForm({ ...movForm, project_id: e.target.value });
                  }
                }} className="w-full px-3 py-2 border rounded-lg text-sm bg-white"><option value="">Sin asignar</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="NEW_PROJECT" className="font-bold text-ecar-blue">+ Agregar nueva obra...</option></select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Notas</label><input value={movForm.notes} onChange={e => setMovForm({ ...movForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Detalle del movimiento" /></div>
              <button type="submit" disabled={createMovement.isPending} className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50">
                {createMovement.isPending ? 'Registrando...' : '✅ Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Herramienta */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Asignar / Préstamo: {showAssign.name}</h3><button onClick={() => setShowAssign(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleAssign} className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Empleado *</label><select value={assignForm.employee_id} onChange={e => setAssignForm({ ...assignForm, employee_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white"><option value="">Seleccioná empleado...</option>{(employees || []).map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Obra / Destino</label><select value={assignForm.project_id} onChange={e => setAssignForm({ ...assignForm, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white"><option value="">Sin asignar</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Observaciones</label><input value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Opcional..." /></div>
              <button type="submit" disabled={createAssignment.isPending} className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50">
                {createAssignment.isPending ? 'Asignando...' : '👤 Confirmar Préstamo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva/Editar Estantería */}
      {showNewShelf && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{editingShelf ? 'Editar' : 'Nueva'} Estantería</h3><button onClick={() => { setShowNewShelf(false); setEditingShelf(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSaveShelf} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Código (Letra A-E) *</label><input value={shelfForm.code} onChange={e => setShelfForm({ ...shelfForm, code: e.target.value.toUpperCase() })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="A, B, C, D o E" /></div>
                <div><label className="text-xs font-bold text-gray-500">Nombre *</label><input value={shelfForm.name} onChange={e => setShelfForm({ ...shelfForm, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Herramientas eléctricas" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Tipo</label><select value={shelfForm.shelf_type} onChange={e => setShelfForm({ ...shelfForm, shelf_type: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">{Object.entries(SHELF_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500">Niveles</label><input type="number" min="1" max="10" value={shelfForm.rows_count} onChange={e => setShelfForm({ ...shelfForm, rows_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-xs font-bold text-gray-500">Bins / Cajones</label><input type="number" min="1" max="10" value={shelfForm.columns_count} onChange={e => setShelfForm({ ...shelfForm, columns_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Rotación</label>
                  <div className="flex items-center gap-2">
                      <input type="range" min="0" max="360" value={shelfForm.rotation} onChange={e => setShelfForm({ ...shelfForm, rotation: e.target.value })} className="w-full" />
                      <span className="text-xs font-mono w-8">{shelfForm.rotation}º</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Color Identificador</label>
                <div className="flex gap-2 mt-1">{SHELF_COLORS.map(c => <button key={c} type="button" onClick={() => setShelfForm({ ...shelfForm, color: c })} className={`w-7 h-7 rounded-full border-2 transition-all ${shelfForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Notas / Categorías asignadas</label><input value={shelfForm.notes} onChange={e => setShelfForm({ ...shelfForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Descripción del contenido..." /></div>
              <button type="submit" disabled={createShelf.isPending || updateShelf.isPending} className="btn-primary w-full py-3 text-sm flex items-center justify-center disabled:opacity-50">
                {(createShelf.isPending || updateShelf.isPending) ? 'Guardando...' : editingShelf ? '💾 Guardar Cambios' : '✅ Crear Estantería'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Ubicación Bin */}
      {assignShelfItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">📍 Ubicación: {assignShelfItem.name}</h3><button onClick={() => setAssignShelfItem(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const sel = (shelves || []).find(s => s.id === shelfAssignForm.shelf_id);
              const pos = shelfAssignForm.shelf_position ? shelfAssignForm.shelf_position.toUpperCase() : null;
              const locationStr = sel ? `Ubicación ${sel.code}${pos ? `-${pos}` : ''}` : null;
              await updateItem.mutateAsync({ id: assignShelfItem.id, shelf_id: shelfAssignForm.shelf_id || null, shelf_position: pos, location: locationStr } as any);
              useModalStore.getState().showAlert('Éxito', 'Ubicación asignada correctamente.');
              setAssignShelfItem(null);
            }} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Estantería *</label>
                <select value={shelfAssignForm.shelf_id} onChange={e => setShelfAssignForm({ ...shelfAssignForm, shelf_id: e.target.value })} required className="w-full px-3 py-2 border rounded-xl text-sm bg-white font-medium">
                  <option value="">Seleccioná estantería...</option>
                  {(shelves || []).map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Código de Ubicación [Estantería]-[Estante]-[Bin]</label>
                <input value={shelfAssignForm.shelf_position} onChange={e => setShelfAssignForm({ ...shelfAssignForm, shelf_position: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="Ej: C-3-2 (Estantería C, Estante 3, Bin 2)" />
              </div>
              <div className="flex gap-2 pt-2">
                {assignShelfItem.shelf_id && <button type="button" onClick={async () => { await updateItem.mutateAsync({ id: assignShelfItem.id, shelf_id: null, shelf_position: null } as any); setAssignShelfItem(null); }} className="badge badge-danger">Quitar ubicación</button>}
                <button type="submit" disabled={updateItem.isPending} className="btn-primary flex-1 py-2.5 text-xs">
                  {updateItem.isPending ? 'Guardando...' : '📍 Asignar Ubicación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScannerModal
          items={items || []}
          onClose={() => setShowScanner(false)}
          onNewItemRequest={(code) => {
            setNewItem(prev => ({ ...prev, barcode: code }));
            setShowNewItem(true);
          }}
        />
      )}

      {showBarcode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-gray-900">Etiqueta de Código de Barras</h4>
              <button onClick={() => setShowBarcode(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <BarcodeLabel item={showBarcode} />
          </div>
        </div>
      )}

      {/* Modal Solicitar Reposición a Compras */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={20} /> Solicitar Reposición a Compras</h2>
              <button onClick={() => setShowRepoModal(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  🏗️ Centro de Costo (Proyecto / Obra)
                </label>
                <select
                  value={repoProjectId}
                  onChange={e => {
                    if (e.target.value === 'NEW_PROJECT') {
                      const name = prompt('Ingrese el nombre de la nueva obra/proyecto:');
                      if (name && name.trim()) {
                        createProject.mutate({ name: name.trim(), status: 'active', budget_ars: 0, client_name: '', client_cuit: '', location: '', start_date: new Date().toISOString().split('T')[0], end_date: null }, {
                          onSuccess: (newProject) => {
                            setRepoProjectId(newProject.id);
                          }
                        });
                      }
                    } else {
                      setRepoProjectId(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
                >
                  <option value="">— Sin asignar (stock general) —</option>
                  {(projects || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="NEW_PROJECT" className="font-bold text-blue-600">+ Agregar nueva obra...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ítems a reponer ({repoItems.length})</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-2">
                  {repoItems.map(item => {
                    const qty = Math.max(item.min_stock * 2 - item.current_stock, item.min_stock);
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-gray-700">{item.name}</span>
                          <span className="text-gray-400 ml-2">Stock: {item.current_stock} / Mín: {item.min_stock}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-bold text-orange-700">{qty} {item.unit}</span>
                          {item.current_stock === 0 && <span className="badge badge-danger">SIN STOCK</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800">
                <strong>Resumen:</strong> Se enviará un pedido de compra con {repoItems.length} ítem{repoItems.length > 1 ? 's' : ''} 
                {repoProjectId ? ` imputado al proyecto "${(projects || []).find(p => p.id === repoProjectId)?.name}"` : ' sin centro de costo asignado'}.
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowRepoModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                  Cancelar
                </button>
                <button
                  onClick={handleRepoSubmit}
                  disabled={createPurchaseReq.isPending}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-xl font-bold text-sm hover:from-red-700 hover:to-orange-700 transition-all shadow-md disabled:opacity-50"
                >
                  {createPurchaseReq.isPending ? 'Enviando...' : '📤 Enviar a Compras'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Importer Modal */}
      {showImporter && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl relative">
            <button onClick={() => setShowImporter(false)} className="absolute -top-12 right-0 text-white hover:text-slate-200"><X size={24} /></button>
            <WarehouseExcelImporter existingShelves={shelves || []} onComplete={() => { setShowImporter(false); window.location.reload(); }} />
          </div>
        </div>
      )}
    </div>
  );
};

const EppAuditList: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const { data: deliveries = [], isLoading } = useEmployeePPE(employeeId);
  const itemLabels: Record<string, string> = {
    pantalon: '👖 Pantalón',
    zapatos: '🥾 Zapatos de Seguridad',
    campera: '🧥 Campera',
    camisa: '👔 Camisa',
    remera: '👕 Remera',
    casco: '🪖 Casco (EPP)',
    guantes: '🧤 Guantes (EPP)',
    anteojos: '🥽 Anteojos (EPP)',
    arnes: '🦺 Arnés (EPP)',
    otro: '📦 Otro'
  };

  if (isLoading) return <div className="text-center py-6 text-xs text-gray-400">Cargando entregas...</div>;
  if (deliveries.length === 0) return <div className="text-center py-6 text-xs text-gray-400 font-medium">Sin entregas registradas aún para este empleado</div>;

  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full text-xs">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Elemento EPP</th>
            <th>Talle</th>
            <th className="text-center">Cantidad</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map(d => (
            <tr key={d.id}>
              <td className="font-mono text-gray-500">{new Date(d.delivery_date).toLocaleDateString('es-AR')}</td>
              <td className="font-bold text-gray-800">{itemLabels[d.item_type] || d.item_type}</td>
              <td className="font-mono">{d.size || '—'}</td>
              <td className="text-center font-bold font-mono">{d.quantity}</td>
              <td className="text-gray-500 italic">{d.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
