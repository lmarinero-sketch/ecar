import React, { useState, useMemo } from 'react';
import { PackageOpen, Plus, Trash2, Edit3, Calendar, ShieldCheck, Search, User, Filter } from 'lucide-react';
import { useEmployeePPE, useCreateEmployeePPE, useUpdateEmployeePPE, useDeleteEmployeePPE, useEmployees } from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';

export const PPEDeliveriesPanel: React.FC<{ employeeId?: string }> = ({ employeeId }) => {
  const { data: employees = [] } = useEmployees();
  const [filterEmpId, setFilterEmpId] = useState<string>(employeeId || '');
  const [filterItemType, setFilterItemType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: rawDeliveries = [], isLoading } = useEmployeePPE(filterEmpId || null);
  const createDelivery = useCreateEmployeePPE();
  const updateDelivery = useUpdateEmployeePPE();
  const deleteDelivery = useDeleteEmployeePPE();

  const [showAdd, setShowAdd] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any | null>(null);
  const [form, setForm] = useState({
    employee_id: employeeId || '',
    item_type: 'pantalon',
    size: 'M',
    quantity: 1,
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const itemLabels: Record<string, string> = {
    'pantalon': '👖 Pantalón de Trabajo',
    'zapatos': '🥾 Zapatos / Calzado de Seguridad',
    'campera': '🧥 Campera de Abrigo / Ignífuga',
    'camisa': '👔 Camisa de Trabajo',
    'remera': '👕 Remera',
    'casco': '🪖 Casco de Seguridad (EPP)',
    'guantes': '🧤 Guantes de Protección (EPP)',
    'anteojos': '🥽 Anteojos de Seguridad (EPP)',
    'arnes': '🦺 Arnés de Seguridad (EPP)',
    'materiales': '🧱 Materiales / Consumibles',
    'herramientas': '🔧 Herramientas de Mano',
    'otro': '📦 Otro Elemento / Prenda'
  };

  // Filter deliveries in memory by itemType and searchTerm
  const filteredDeliveries = useMemo(() => {
    return (rawDeliveries || []).filter(d => {
      // Item type filter
      if (filterItemType && d.item_type !== filterItemType) return false;

      // Search term filter (employee name, legajo, notes, item label)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const empName = d.employee?.full_name?.toLowerCase() || '';
        const empLegajo = d.employee?.legajo?.toLowerCase() || '';
        const itemLabel = (itemLabels[d.item_type] || d.item_type).toLowerCase();
        const notes = (d.notes || '').toLowerCase();

        if (!empName.includes(q) && !empLegajo.includes(q) && !itemLabel.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [rawDeliveries, filterItemType, searchTerm]);

  const handleCancelForm = () => {
    setShowAdd(false);
    setEditingDelivery(null);
    setForm({
      employee_id: employeeId || filterEmpId || '',
      item_type: 'pantalon',
      size: 'M',
      quantity: 1,
      delivery_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = form.employee_id || filterEmpId || employeeId;
    if (!targetEmpId) {
      useModalStore.getState().showAlert('Atención', 'Selecciona un colaborador para registrar la entrega.');
      return;
    }

    try {
      if (editingDelivery) {
        await updateDelivery.mutateAsync({
          id: editingDelivery.id,
          employee_id: targetEmpId,
          item_type: form.item_type as any,
          size: form.size || 'Único',
          quantity: form.quantity || 1,
          delivery_date: form.delivery_date,
          notes: form.notes || null,
        });
        useModalStore.getState().showAlert('Éxito', 'Registro de entrega actualizado correctamente.');
      } else {
        await createDelivery.mutateAsync({
          employee_id: targetEmpId,
          item_type: form.item_type as any,
          size: form.size || 'Único',
          quantity: form.quantity || 1,
          delivery_date: form.delivery_date,
          notes: form.notes || null,
        });
        useModalStore.getState().showAlert('Éxito', 'Entrega de EPP registrada correctamente.');
      }
      handleCancelForm();
    } catch (err: any) {
      console.error('Error al guardar entrega EPP:', err);
      useModalStore.getState().showAlert('Error al Guardar', err?.message || 'No se pudo guardar el registro de EPP.');
    }
  };

  return (
    <div className="light-card p-5 mt-4 border-t-4 border-t-emerald-600 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            Registro & Auditoría Global de Entrega de EPP y Ropa de Trabajo
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">Control unificado Pañol & RRHH para seguimiento e higiene y seguridad laboral.</p>
        </div>
        <button
          onClick={() => {
            if (showAdd || editingDelivery) {
              handleCancelForm();
            } else {
              setShowAdd(true);
              setForm(f => ({ ...f, employee_id: filterEmpId || '' }));
            }
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          {showAdd || editingDelivery ? 'Cancelar' : <><Plus size={16} /> Registrar Entrega</>}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
        <div>
          <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <User size={12} /> Filtrar por Colaborador
          </label>
          <select
            value={filterEmpId}
            onChange={e => setFilterEmpId(e.target.value)}
            className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Todos los Colaboradores ({employees.length}) --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} {emp.legajo ? `(Legajo: ${emp.legajo})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Filter size={12} /> Elemento / Prenda EPP
          </label>
          <select
            value={filterItemType}
            onChange={e => setFilterItemType(e.target.value)}
            className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Todos los Elementos EPP --</option>
            {Object.entries(itemLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Search size={12} /> Buscar en Entregas
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por empleado, legajo o nota..."
              className="w-full pl-8 pr-3 py-1.5 border border-emerald-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Add / Edit Delivery Form */}
      {(showAdd || editingDelivery) && (
        <form onSubmit={handleSubmit} className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 space-y-3 shadow-md">
          <h5 className="font-bold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            {editingDelivery ? <><Edit3 size={14} /> Editar Registro de Entrega de EPP</> : <><Plus size={14} /> Registrar Nueva Entrega de EPP / Ropa de Trabajo</>}
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Colaborador / Empleado *</label>
              <select
                required
                value={form.employee_id}
                onChange={e => setForm({ ...form, employee_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold text-gray-800"
              >
                <option value="">-- Seleccionar empleado * --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} {emp.legajo ? `(${emp.legajo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Prenda / Elemento EPP *</label>
              <select
                value={form.item_type}
                onChange={e => setForm({ ...form, item_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-medium"
              >
                {Object.entries(itemLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Talle / Medida</label>
              <input
                value={form.size}
                onChange={e => setForm({ ...form, size: e.target.value })}
                placeholder="Ej: 42, L, XL"
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold bg-white text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Fecha de Entrega</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={e => setForm({ ...form, delivery_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Observaciones / Planilla Firma</label>
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Ej: Entregado según planilla firmada N° 45..."
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createDelivery.isPending || updateDelivery.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all shadow disabled:opacity-50"
            >
              {createDelivery.isPending || updateDelivery.isPending ? 'Guardando...' : editingDelivery ? '✏️ Guardar Cambios' : '✅ Confirmar Entrega'}
            </button>
          </div>
        </form>
      )}

      {/* Main Deliveries Table */}
      {isLoading ? (
        <div className="text-center py-8 text-xs text-gray-400 animate-pulse">Cargando registro histórico de EPP...</div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <PackageOpen size={32} className="mx-auto mb-2 opacity-30 text-emerald-600" />
          <p className="text-xs font-bold text-gray-600">No se encontraron entregas de Ropa o EPP</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Prueba ajustar los filtros superiores o registra una nueva entrega.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
          <table className="data-table text-xs w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th>Fecha</th>
                <th>Colaborador / Empleado</th>
                <th>Elemento Entregado</th>
                <th>Talle</th>
                <th className="text-center">Cant.</th>
                <th>Observaciones / Firma</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredDeliveries.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="font-mono text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1"><Calendar size={12} /> {d.delivery_date}</div>
                  </td>
                  <td className="font-bold text-gray-900">
                    {d.employee?.full_name || 'Empleado'}
                    {d.employee?.legajo && (
                      <span className="ml-1.5 text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {d.employee.legajo}
                      </span>
                    )}
                  </td>
                  <td className="font-bold text-gray-800">{itemLabels[d.item_type] || d.item_type}</td>
                  <td className="text-emerald-700 font-bold font-mono">{d.size || 'Único'}</td>
                  <td className="text-center font-mono font-bold text-gray-900">{d.quantity}</td>
                  <td className="text-gray-500 italic max-w-xs truncate" title={d.notes || ''}>
                    {d.notes || '—'}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingDelivery(d);
                          setForm({
                            employee_id: d.employee_id,
                            item_type: d.item_type,
                            size: d.size || 'M',
                            quantity: d.quantity || 1,
                            delivery_date: d.delivery_date || new Date().toISOString().split('T')[0],
                            notes: d.notes || '',
                          });
                          setShowAdd(true);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded hover:bg-blue-50"
                        title="Editar entrega"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={async () => {
                          if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar este registro de entrega?')) {
                            deleteDelivery.mutate({ id: d.id, employee_id: d.employee_id });
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"
                        title="Eliminar registro"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
