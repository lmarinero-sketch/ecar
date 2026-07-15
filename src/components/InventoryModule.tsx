import React, { useState, useMemo } from 'react';
import {
  Package, Wrench, Search, Plus, X, ArrowDownToLine,
  RotateCcw, AlertTriangle, Boxes, User, Barcode,
  LayoutGrid, MapPin, Trash2, Edit3, Grid3X3, ShoppingBag
} from 'lucide-react';
import {
  useInventoryItems, useCreateInventoryItem, useInventoryMovements,
  useCreateInventoryMovement, useToolAssignments, useCreateToolAssignment,
  useUpdateToolAssignment, useUpdateInventoryItem, useProjects, useEmployees,
  useWarehouseShelves, useCreateWarehouseShelf, useUpdateWarehouseShelf, useDeleteWarehouseShelf,
  useCreatePurchaseRequest
} from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';
import type { InventoryItem, WarehouseShelf } from '../lib/types';
import { BarcodeLabel } from './BarcodeLabel';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { WebGLWarehouseGrid } from './WebGLWarehouseGrid';
import { Rnd } from 'react-rnd';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

type Tab = 'stock' | 'tools' | 'movements' | 'shelves';
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
  const createPurchaseRequest = useCreatePurchaseRequest();

  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [showNewItem, setShowNewItem] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showMovement, setShowMovement] = useState<InventoryItem | null>(null);
  const [showAssign, setShowAssign] = useState<InventoryItem | null>(null);
  const [showBarcode, setShowBarcode] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'material' as 'material' | 'herramienta' | 'consumible', unit: 'unidad', current_stock: '', min_stock: '', unit_cost: '', is_tool: false, barcode: '', location: '', shelf_id: '' });
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

  const openRepoModal = (items: RepoItem[]) => {
    setRepoItems(items);
    setRepoProjectId('');
    setShowRepoModal(true);
  };

  const handleRepoSubmit = async () => {
    try {
      await createPurchaseRequest.mutateAsync({
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
      created_at: new Date().toISOString()
    });
  };

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(i => {
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
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
    await createItem.mutateAsync({
      name: newItem.name, category: newItem.category, unit: newItem.unit,
      current_stock: parseFloat(newItem.current_stock) || 0,
      min_stock: parseFloat(newItem.min_stock) || 0,
      unit_cost: parseFloat(newItem.unit_cost) || 0,
      is_tool: newItem.is_tool || newItem.category === 'herramienta',
      barcode: newItem.barcode || null,
      location: newItem.location || 'Depósito',
      shelf_id: newItem.shelf_id || null,
    });
    setShowNewItem(false);
    setNewItem({ name: '', category: 'material', unit: 'unidad', current_stock: '', min_stock: '', unit_cost: '', is_tool: false, barcode: '', location: '', shelf_id: '' });
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovement) return;
    await createMovement.mutateAsync({
      item_id: showMovement.id,
      movement_type: movForm.movement_type,
      quantity: parseFloat(movForm.quantity),
      project_id: movForm.project_id || null,
      notes: movForm.notes || null,
    });
    setShowMovement(null);
    setMovForm({ movement_type: 'out', quantity: '', notes: '', project_id: '' });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssign) return;
    await createAssignment.mutateAsync({
      item_id: showAssign.id,
      employee_id: assignForm.employee_id,
      project_id: assignForm.project_id || null,
      notes: assignForm.notes || null,
    });
    setShowAssign(null);
    setAssignForm({ employee_id: '', project_id: '', notes: '' });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Boxes size={120} /></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 to-orange-300" />
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Package size={24} /> Depósito & Inventario</h3>
          <p className="text-orange-100 text-sm mt-1">Doc PR-GL-01 §4.3 — Control de materiales, herramientas y pañol con trazabilidad</p>
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
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Package size={16} className="text-emerald-500" /> Valor Total Depósito</div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{fmt(totalValue)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([['stock', '📦 Stock', null], ['tools', '🔧 Herramientas', null], ['movements', '📋 Historial Entradas/Salidas', null], ['shelves', '🗄️ Estanterías', null]] as [Tab, string, null][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {/* Stock tab */}
      {tab === 'stock' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar material o herramienta..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30" />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Todas las categorías</option>
              <option value="material">📦 Materiales</option>
              <option value="herramienta">🔧 Herramientas</option>
              <option value="consumible">🔩 Consumibles</option>
            </select>
            <button onClick={() => setShowScanner(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-orange-700 transition-all">
              <Barcode size={16} /> Escanear Código
            </button>
            <button onClick={() => setShowNewItem(true)} className="btn-primary">
              <Plus size={16} /> Nuevo Ítem
            </button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Ítem</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Mínimo</th>
                <th className="px-4 py-3 text-right">Costo Unit.</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.current_stock <= item.min_stock && item.min_stock > 0 ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.category === 'herramienta' ? 'bg-ecar-blueLight text-ecar-blue' : item.category === 'consumible' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.shelf ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: (item.shelf as any)?.color || '#6B7280' }} />
                        <span className="text-xs font-bold text-gray-700">{(item.shelf as any)?.code}</span>
                        {item.shelf_position && <span className="text-[10px] font-mono text-gray-400">({item.shelf_position})</span>}
                      </div>
                    ) : (
                      <button onClick={() => { setAssignShelfItem(item); setShelfAssignForm({ shelf_id: '', shelf_position: '' }); }} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1 transition-colors">
                        <MapPin size={12} /> Asignar
                      </button>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono font-bold ${item.current_stock <= item.min_stock && item.min_stock > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {item.current_stock} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-400">{item.min_stock}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{fmt(item.unit_cost)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setShowMovement(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Registrar movimiento"><ArrowDownToLine size={14} className="text-blue-600" /></button>
                      {item.is_tool && <button onClick={() => setShowAssign(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Asignar herramienta"><User size={14} className="text-ecar-blue" /></button>}
                      {item.shelf ? (
                        <button onClick={() => { setAssignShelfItem(item); setShelfAssignForm({ shelf_id: item.shelf_id || '', shelf_position: item.shelf_position || '' }); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Cambiar ubicación"><MapPin size={14} className="text-orange-500" /></button>
                      ) : null}
                      <button onClick={() => setShowBarcode(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Código de barras"><Barcode size={14} className="text-gray-500" /></button>
                      {item.current_stock <= item.min_stock && item.min_stock > 0 && (
                        <button
                          onClick={() => openRepoModal([{ name: item.name, quantity: item.current_stock, unit: item.unit, unit_cost: item.unit_cost, id: item.id, current_stock: item.current_stock, min_stock: item.min_stock }])}
                          className="p-1.5 hover:bg-red-100 rounded-lg" title="Solicitar reposición a Compras"
                        >
                          <ShoppingBag size={14} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400"><Package size={48} className="mx-auto mb-3 opacity-30" /><p>No hay ítems</p></div>}
        </div>
      )}

      {/* Tools tab */}
      {tab === 'tools' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Wrench size={16} /> Asignaciones Activas</h3>
          </div>
          {activeAssignments.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Herramienta</th>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Obra</th>
                  <th className="px-4 py-3">Fecha Asignación</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{(a.item as any)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-ecar-blueLight flex items-center justify-center text-ecar-blue font-bold text-xs uppercase">
                          {((a.employee as any)?.full_name || '?')[0]}
                        </div>
                        {(a.employee as any)?.full_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{(a.project as any)?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{new Date(a.assigned_date).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => updateAssignment.mutateAsync({ id: a.id, status: 'returned', returned_date: new Date().toISOString().split('T')[0] })} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-200 transition-all flex items-center gap-1 mx-auto">
                        <RotateCcw size={12} /> Devolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-400"><Wrench size={48} className="mx-auto mb-3 opacity-30" /><p>No hay herramientas asignadas</p></div>
          )}
        </div>
      )}

      {/* Movements tab */}
      {tab === 'movements' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Historial de Movimientos</h3>
          </div>
          {(movements || []).length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Ítem</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3 text-center">Cantidad</th><th className="px-4 py-3">Obra</th><th className="px-4 py-3">Notas</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(movements || []).map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{new Date(m.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 font-medium">{(m.item as any)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.movement_type === 'in' ? 'bg-green-100 text-green-700' : m.movement_type === 'out' ? 'bg-red-100 text-red-700' : m.movement_type === 'return' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {m.movement_type === 'in' ? 'Ingreso' : m.movement_type === 'out' ? 'Egreso' : m.movement_type === 'return' ? 'Devolución' : 'Ajuste'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{m.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{(m.project as any)?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-400"><ArrowDownToLine size={48} className="mx-auto mb-3 opacity-30" /><p>Sin movimientos aún</p></div>
          )}
        </div>
      )}

      {/* Modal Nuevo Ítem */}
      {showNewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Nuevo Ítem</h3><button onClick={() => setShowNewItem(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleNewItem} className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Nombre *</label><input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30" placeholder="Ej: Amoladora Bosch 7&quot;" /></div>
              <div>
                <label className="text-xs font-bold text-gray-500">Código de Barras / QR (Opcional)</label>
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
                    title="Generar código de barras aleatorio"
                  >
                    ⚡ Generar
                  </button>
                  <button
                    type="button"
                    disabled={!newItem.barcode}
                    onClick={printTempBarcode}
                    className="bg-ecar-blue text-white px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-ecar-blueDark disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                    title="Imprimir código de barras"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Categoría</label><select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="material">Material</option><option value="herramienta">Herramienta</option><option value="consumible">Consumible</option></select></div>
                <div><label className="text-xs font-bold text-gray-500">Estantería</label><select value={newItem.shelf_id} onChange={e => setNewItem({ ...newItem, shelf_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="">Sin asignar</option>{(shelves || []).map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500">Unidad</label><input value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="unidad, kg, m3" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Stock Actual</label><input type="number" value={newItem.current_stock} onChange={e => setNewItem({ ...newItem, current_stock: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-xs font-bold text-gray-500">Stock Mínimo</label><input type="number" value={newItem.min_stock} onChange={e => setNewItem({ ...newItem, min_stock: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-xs font-bold text-gray-500">Costo Unit. ($)</label><input type="number" value={newItem.unit_cost} onChange={e => setNewItem({ ...newItem, unit_cost: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
              </div>
              <button type="submit" disabled={createItem.isPending} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm hover:bg-ecar-blueDark transition-all shadow-md disabled:opacity-50">
                {createItem.isPending ? 'Guardando...' : '✅ Crear Ítem'}
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
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Cantidad *</label><input type="number" value={movForm.quantity} onChange={e => setMovForm({ ...movForm, quantity: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-xs font-bold text-gray-500">Obra</label><select value={movForm.project_id} onChange={e => setMovForm({ ...movForm, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Sin asignar</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Notas</label><input value={movForm.notes} onChange={e => setMovForm({ ...movForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Detalle del movimiento" /></div>
              <button type="submit" disabled={createMovement.isPending} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm hover:bg-ecar-blueDark transition-all shadow-md disabled:opacity-50">
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
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Asignar: {showAssign.name}</h3><button onClick={() => setShowAssign(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleAssign} className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Empleado *</label><select value={assignForm.employee_id} onChange={e => setAssignForm({ ...assignForm, employee_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Seleccioná...</option>{(employees || []).map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Obra</label><select value={assignForm.project_id} onChange={e => setAssignForm({ ...assignForm, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Sin asignar</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Notas</label><input value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
              <button type="submit" disabled={createAssignment.isPending} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm hover:bg-ecar-blue transition-all shadow-md disabled:opacity-50">
                {createAssignment.isPending ? 'Asignando...' : '🔧 Asignar Herramienta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Código de Barras */}
      {showBarcode && (
        <BarcodeLabel item={showBarcode} onClose={() => setShowBarcode(null)} />
      )}

      {/* Shelves Tab */}
      {tab === 'shelves' && (() => {
        const shelfList = shelves || [];

        const itemsByShelf = (items || []).reduce((acc, it) => {
          if (it.shelf_id) { acc[it.shelf_id] = (acc[it.shelf_id] || 0) + 1; }
          return acc;
        }, {} as Record<string, number>);

        const handleSaveShelf = async (e: React.FormEvent) => {
          e.preventDefault();
          const payload = {
            code: shelfForm.code, name: shelfForm.name, shelf_type: shelfForm.shelf_type as WarehouseShelf['shelf_type'],
            rows_count: parseInt(shelfForm.rows_count) || 4, columns_count: parseInt(shelfForm.columns_count) || 3,
            color: shelfForm.color, notes: shelfForm.notes || null, rotation: parseInt(shelfForm.rotation) || 0
          };
          if (editingShelf) {
            await updateShelf.mutateAsync({ id: editingShelf.id, ...payload });
          } else {
            await createShelf.mutateAsync({ ...payload, grid_row: 50, grid_col: 50, grid_width: 200, grid_height: 120 });
          }
          setShowNewShelf(false); setEditingShelf(null);
          setShelfForm({ code: '', name: '', shelf_type: 'rack', rows_count: '4', columns_count: '3', color: '#3B82F6', notes: '', rotation: '0' });
        };

        return (
          <div className="space-y-6">
            {/* Diagrama Visual del Depósito */}
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><LayoutGrid size={16} /> Plano del Depósito</h3>
                <button onClick={() => { setShowNewShelf(true); setEditingShelf(null); setShelfForm({ code: '', name: '', shelf_type: 'rack', rows_count: '4', columns_count: '3', color: '#3B82F6', notes: '', rotation: '0' }); }} className="btn-primary">
                  <Plus size={16} /> Nueva Estantería
                </button>
              </div>
              <div className="p-6">
                {shelfList.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Grid3X3 size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No hay estanterías configuradas</p>
                    <p className="text-sm">Creá tu primera estantería para armar el plano del depósito.</p>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 bg-white overflow-hidden shadow-inner" style={{ minHeight: 300 }}>
                    <WebGLWarehouseGrid />
                    <div className="absolute top-2 left-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider z-10 drop-shadow-sm bg-white/70 px-2 py-0.5 rounded-full">Plano depósito interactivo</div>
                    <div className="relative z-10 mt-6 w-full h-[600px]">
                      {shelfList.map(shelf => (
                        <Rnd
                          key={shelf.id}
                          bounds="parent"
                          position={{ x: shelf.grid_col, y: shelf.grid_row }}
                          size={{ width: shelf.grid_width, height: shelf.grid_height }}
                          onDragStop={(_e: any, d: any) => {
                            if (d.x !== shelf.grid_col || d.y !== shelf.grid_row) {
                              updateShelf.mutate({ id: shelf.id, grid_col: d.x, grid_row: d.y });
                            }
                          }}
                          onResizeStop={(_e: any, _direction: any, ref: any, _delta: any, position: any) => {
                            const newWidth = parseInt(ref.style.width, 10);
                            const newHeight = parseInt(ref.style.height, 10);
                            updateShelf.mutate({
                              id: shelf.id,
                              grid_width: newWidth,
                              grid_height: newHeight,
                              grid_col: position.x,
                              grid_row: position.y
                            });
                          }}
                          className="group"
                          style={{ zIndex: 10 }}
                        >
                          <div 
                            className="rounded-xl border-2 p-3 flex flex-col justify-between cursor-move hover:shadow-lg transition-shadow w-full h-full relative overflow-hidden" 
                            style={{ 
                              borderColor: shelf.color, 
                              background: `${shelf.color}08`,
                              transform: `rotate(${shelf.rotation || 0}deg)`,
                              transformOrigin: 'center center'
                            }}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEditingShelf(shelf); 
                              setShelfForm({ code: shelf.code, name: shelf.name, shelf_type: shelf.shelf_type, rows_count: String(shelf.rows_count), columns_count: String(shelf.columns_count), color: shelf.color, notes: shelf.notes || '', rotation: String(shelf.rotation || 0) }); 
                              setShowNewShelf(true); 
                            }}
                          >
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                              <button onClick={async (e) => { e.stopPropagation(); if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar esta estantería?')) deleteShelf.mutateAsync(shelf.id); }} className="p-1 bg-red-100 rounded-lg hover:bg-red-200"><Trash2 size={12} className="text-red-600" /></button>
                            </div>
                            <div className="relative z-10 bg-white/90 backdrop-blur-[2px] p-2 rounded-lg h-full flex flex-col justify-between shadow-sm border border-white/50">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-lg">{SHELF_TYPES[shelf.shelf_type]?.icon || '📦'}</span>
                                  <span className="font-bold text-sm" style={{ color: shelf.color }}>{shelf.code}</span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium truncate">{shelf.name}</p>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-gray-500 font-medium">{shelf.rows_count}×{shelf.columns_count} pos</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${shelf.color}15`, color: shelf.color }}>{itemsByShelf[shelf.id] || 0} ítems</span>
                              </div>
                              <div className="grid gap-0.5 mt-2" style={{ gridTemplateColumns: `repeat(${shelf.columns_count}, 1fr)` }}>
                                {Array.from({ length: Math.min(shelf.rows_count * shelf.columns_count, 12) }).map((_, i) => (
                                  <div key={i} className="h-1.5 rounded-full" style={{ backgroundColor: `${shelf.color}${i < (itemsByShelf[shelf.id] || 0) ? '60' : '20'}` }} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </Rnd>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de estanterías */}
            <div className="light-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800">Detalle de Estanterías</h3>
              </div>
              {shelfList.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                    <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3 text-center">Posiciones</th><th className="px-4 py-3 text-center">Ítems</th><th className="px-4 py-3">Notas</th><th className="px-4 py-3 text-center">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shelfList.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} /><span className="font-bold font-mono">{s.code}</span></div></td>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{SHELF_TYPES[s.shelf_type]?.icon} {SHELF_TYPES[s.shelf_type]?.label}</span></td>
                        <td className="px-4 py-3 text-center font-mono">{s.rows_count} × {s.columns_count}</td>
                        <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{itemsByShelf[s.id] || 0}</span></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{s.notes || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditingShelf(s); setShelfForm({ code: s.code, name: s.name, shelf_type: s.shelf_type, rows_count: String(s.rows_count), columns_count: String(s.columns_count), color: s.color, notes: s.notes || '', rotation: String(s.rotation || 0) }); setShowNewShelf(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit3 size={14} className="text-blue-600" /></button>
                            <button onClick={async () => { if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar?')) deleteShelf.mutateAsync(s.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>

            {/* Modal Nueva/Editar Estantería */}
            {showNewShelf && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{editingShelf ? 'Editar' : 'Nueva'} Estantería</h3><button onClick={() => { setShowNewShelf(false); setEditingShelf(null); }}><X size={20} className="text-gray-400" /></button></div>
                  <form onSubmit={handleSaveShelf} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-bold text-gray-500">Código *</label><input value={shelfForm.code} onChange={e => setShelfForm({ ...shelfForm, code: e.target.value.toUpperCase() })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="EST-01" /></div>
                      <div><label className="text-xs font-bold text-gray-500">Nombre *</label><input value={shelfForm.name} onChange={e => setShelfForm({ ...shelfForm, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Estantería Principal" /></div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div><label className="text-xs font-bold text-gray-500">Tipo</label><select value={shelfForm.shelf_type} onChange={e => setShelfForm({ ...shelfForm, shelf_type: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">{Object.entries(SHELF_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                      <div><label className="text-xs font-bold text-gray-500">Niveles</label><input type="number" min="1" max="10" value={shelfForm.rows_count} onChange={e => setShelfForm({ ...shelfForm, rows_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                      <div><label className="text-xs font-bold text-gray-500">Divisiones</label><input type="number" min="1" max="10" value={shelfForm.columns_count} onChange={e => setShelfForm({ ...shelfForm, columns_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" /></div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Rotación</label>
                        <div className="flex items-center gap-2">
                           <input type="range" min="0" max="360" value={shelfForm.rotation} onChange={e => setShelfForm({ ...shelfForm, rotation: e.target.value })} className="w-full" />
                           <span className="text-xs font-mono w-8">{shelfForm.rotation}º</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Color</label>
                      <div className="flex gap-2 mt-1">{SHELF_COLORS.map(c => <button key={c} type="button" onClick={() => setShelfForm({ ...shelfForm, color: c })} className={`w-7 h-7 rounded-full border-2 transition-all ${shelfForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500">Notas</label><input value={shelfForm.notes} onChange={e => setShelfForm({ ...shelfForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Descripción del contenido..." /></div>
                    <button type="submit" disabled={createShelf.isPending || updateShelf.isPending} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm hover:bg-ecar-blueDark transition-all shadow-md disabled:opacity-50">
                      {(createShelf.isPending || updateShelf.isPending) ? 'Guardando...' : editingShelf ? '💾 Guardar Cambios' : '✅ Crear Estantería'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal Asignar Ubicación */}
      {assignShelfItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">📍 Ubicación: {assignShelfItem.name}</h3><button onClick={() => setAssignShelfItem(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={async (e) => { e.preventDefault(); await updateItem.mutateAsync({ id: assignShelfItem.id, shelf_id: shelfAssignForm.shelf_id || null, shelf_position: shelfAssignForm.shelf_position || null } as any); setAssignShelfItem(null); }} className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Estantería *</label>
                <select value={shelfAssignForm.shelf_id} onChange={e => setShelfAssignForm({ ...shelfAssignForm, shelf_id: e.target.value })} required className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="">Seleccioná...</option>
                  {(shelves || []).map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Posición (Nivel-Columna)</label><input value={shelfAssignForm.shelf_position} onChange={e => setShelfAssignForm({ ...shelfAssignForm, shelf_position: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" placeholder="Ej: N2-C1 (Nivel 2, Columna 1)" /></div>
              {shelfAssignForm.shelf_id && (() => {
                const sel = (shelves || []).find(s => s.id === shelfAssignForm.shelf_id);
                if (!sel) return null;
                return (
                  <div className="bg-gray-50 rounded-xl p-3 border">
                    <p className="text-xs font-bold text-gray-500 mb-2">Posiciones disponibles ({sel.rows_count} × {sel.columns_count})</p>
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${sel.columns_count}, 1fr)` }}>
                      {Array.from({ length: sel.rows_count }).map((_, r) =>
                        Array.from({ length: sel.columns_count }).map((_, c) => {
                          const pos = `N${r + 1}-C${c + 1}`;
                          const occupied = (items || []).some(it => it.shelf_id === sel.id && it.shelf_position === pos && it.id !== assignShelfItem.id);
                          const isSelected = shelfAssignForm.shelf_position === pos;
                          return <button key={pos} type="button" disabled={occupied} onClick={() => setShelfAssignForm({ ...shelfAssignForm, shelf_position: pos })} className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${isSelected ? 'text-white shadow-sm' : occupied ? 'bg-red-100 text-red-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-400 hover:text-orange-600'}`} style={isSelected ? { backgroundColor: sel.color } : undefined}>{pos}</button>;
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-2">
                {assignShelfItem.shelf_id && <button type="button" onClick={async () => { await updateItem.mutateAsync({ id: assignShelfItem.id, shelf_id: null, shelf_position: null } as any); setAssignShelfItem(null); }} className="flex-1 bg-red-100 text-red-700 py-3 rounded-lg font-bold text-sm hover:bg-red-200 transition-all">Quitar ubicación</button>}
                <button type="submit" disabled={updateItem.isPending} className="flex-1 bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm hover:bg-ecar-blueDark transition-all shadow-md disabled:opacity-50">
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

      {/* Modal Solicitar Reposición a Compras */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={20} /> Solicitar Reposición a Compras</h2>
              <button onClick={() => setShowRepoModal(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Proyecto / Centro de Costo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  🏗️ Centro de Costo (Proyecto / Obra) *
                </label>
                <select
                  value={repoProjectId}
                  onChange={e => setRepoProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                >
                  <option value="">— Sin asignar (stock general) —</option>
                  {(projects || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Seleccioná el proyecto u obra al que se imputan estos materiales.</p>
              </div>

              {/* Items to request */}
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
                          {item.current_stock === 0 && <span className="ml-1 px-1 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold">SIN STOCK</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800">
                <strong>Resumen:</strong> Se enviará un pedido de compra con {repoItems.length} ítem{repoItems.length > 1 ? 's' : ''} 
                {repoProjectId ? ` imputado al proyecto "${(projects || []).find(p => p.id === repoProjectId)?.name}"` : ' sin centro de costo asignado'}.
                {repoItems.some(i => i.current_stock === 0) && ' ⚡ Se marcará como URGENTE por ítems con stock agotado.'}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowRepoModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                  Cancelar
                </button>
                <button
                  onClick={handleRepoSubmit}
                  disabled={createPurchaseRequest.isPending}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-xl font-bold text-sm hover:from-red-700 hover:to-orange-700 transition-all shadow-md disabled:opacity-50"
                >
                  {createPurchaseRequest.isPending ? 'Enviando...' : '📤 Enviar a Compras'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
