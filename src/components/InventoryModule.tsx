import React, { useState, useMemo } from 'react';
import {
  Package, Wrench, Search, Plus, X, ArrowDownToLine, ArrowUpFromLine,
  RotateCcw, AlertTriangle, Boxes, User, Building2, Filter
} from 'lucide-react';
import {
  useInventoryItems, useCreateInventoryItem, useInventoryMovements,
  useCreateInventoryMovement, useToolAssignments, useCreateToolAssignment,
  useUpdateToolAssignment, useProjects, useEmployees
} from '../hooks/useData';
import type { InventoryItem } from '../lib/types';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

type Tab = 'stock' | 'tools' | 'movements';

export const InventoryModule: React.FC = () => {
  const { data: items, isLoading } = useInventoryItems();
  const { data: movements } = useInventoryMovements();
  const { data: assignments } = useToolAssignments();
  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();
  const createItem = useCreateInventoryItem();
  const createMovement = useCreateInventoryMovement();
  const createAssignment = useCreateToolAssignment();
  const updateAssignment = useUpdateToolAssignment();

  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [showNewItem, setShowNewItem] = useState(false);
  const [showMovement, setShowMovement] = useState<InventoryItem | null>(null);
  const [showAssign, setShowAssign] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'material' as const, unit: 'unidad', current_stock: '', min_stock: '', unit_cost: '', is_tool: false });
  const [movForm, setMovForm] = useState({ movement_type: 'out' as 'in' | 'out' | 'return' | 'adjustment', quantity: '', notes: '', project_id: '' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', project_id: '', notes: '' });

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
    });
    setShowNewItem(false);
    setNewItem({ name: '', category: 'material', unit: 'unidad', current_stock: '', min_stock: '', unit_cost: '', is_tool: false });
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
      <div className="bg-gradient-to-r from-orange-700 to-orange-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Boxes size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Package size={24} /> Pañol & Inventario</h3>
          <p className="text-orange-100 text-sm mt-1">Control de materiales, herramientas y asignaciones</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Boxes size={16} className="text-blue-500" /> Ítems Registrados</div>
          <p className="text-2xl font-black text-blue-600 font-mono">{(items || []).length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Wrench size={16} className="text-purple-500" /> Herramientas Asignadas</div>
          <p className="text-2xl font-black text-purple-600 font-mono">{activeAssignments.length}</p>
        </div>
        <div className={`bg-white border rounded-xl p-5 shadow-sm ${lowStockItems.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Stock Bajo</div>
          <p className="text-2xl font-black text-red-600 font-mono">{lowStockItems.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Package size={16} className="text-emerald-500" /> Valor Total Pañol</div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{fmt(totalValue)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([['stock', '📦 Stock', null], ['tools', '🔧 Herramientas', null], ['movements', '📋 Movimientos', null]] as [Tab, string, null][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {/* Stock tab */}
      {tab === 'stock' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
            <button onClick={() => setShowNewItem(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
              <Plus size={16} /> Nuevo Ítem
            </button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Ítem</th>
                <th className="px-4 py-3">Categoría</th>
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.category === 'herramienta' ? 'bg-purple-100 text-purple-700' : item.category === 'consumible' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center font-mono font-bold ${item.current_stock <= item.min_stock && item.min_stock > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {item.current_stock} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-400">{item.min_stock}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{fmt(item.unit_cost)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setShowMovement(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Registrar movimiento"><ArrowDownToLine size={14} className="text-blue-600" /></button>
                      {item.is_tool && <button onClick={() => setShowAssign(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Asignar herramienta"><User size={14} className="text-purple-600" /></button>}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {((a.employee as any)?.first_name || '?')[0]}
                        </div>
                        {(a.employee as any)?.first_name} {(a.employee as any)?.last_name}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Categoría</label><select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="material">Material</option><option value="herramienta">Herramienta</option><option value="consumible">Consumible</option></select></div>
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
              <div><label className="text-xs font-bold text-gray-500">Empleado *</label><select value={assignForm.employee_id} onChange={e => setAssignForm({ ...assignForm, employee_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Seleccioná...</option>{(employees || []).map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Obra</label><select value={assignForm.project_id} onChange={e => setAssignForm({ ...assignForm, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Sin asignar</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Notas</label><input value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
              <button type="submit" disabled={createAssignment.isPending} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-purple-700 transition-all shadow-md disabled:opacity-50">
                {createAssignment.isPending ? 'Asignando...' : '🔧 Asignar Herramienta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
