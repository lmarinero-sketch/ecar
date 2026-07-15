import React, { useState } from 'react';
import { PackageOpen, Plus, Trash2, Calendar } from 'lucide-react';
import { useEmployeePPE, useCreateEmployeePPE, useDeleteEmployeePPE } from '../hooks/useData';

export const PPEDeliveriesPanel: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const { data: deliveries = [], isLoading } = useEmployeePPE(employeeId);
  const createDelivery = useCreateEmployeePPE();
  const deleteDelivery = useDeleteEmployeePPE();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    item_type: 'pantalon',
    size: '',
    quantity: 1,
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = async () => {
    if (!form.size) return;
    await createDelivery.mutateAsync({
      employee_id: employeeId,
      item_type: form.item_type as any,
      size: form.size,
      quantity: form.quantity,
      delivery_date: form.delivery_date,
      notes: form.notes || null,
    });
    setShowAdd(false);
    setForm({
      item_type: 'pantalon',
      size: '',
      quantity: 1,
      delivery_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const itemLabels: Record<string, string> = {
    'pantalon': 'Pantalón',
    'zapatos': 'Zapatos de Seguridad',
    'campera': 'Campera',
    'camisa': 'Camisa',
    'remera': 'Remera',
    'otro': 'Otro'
  };

  if (isLoading) return null;

  return (
    <div className="light-card p-5 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <PackageOpen size={16} className="text-ecar-blue" />
          Entrega de Ropa y EPP
        </h4>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-slate-50 text-ecar-blue px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-ecar-blueLight transition-colors flex items-center gap-1"
        >
          {showAdd ? 'Cancelar' : <><Plus size={14} /> Registrar Entrega</>}
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Prenda / EPP</label>
              <select value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {Object.entries(itemLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Talle *</label>
              <input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="Ej: 42, L, XL" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Fecha</label>
              <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Notas</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Opcional..." className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.size || createDelivery.isPending}
              className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-ecar-blue disabled:opacity-50"
            >
              {createDelivery.isPending ? 'Guardando...' : 'Guardar Entrega'}
            </button>
          </div>
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <PackageOpen size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay registros de entrega de ropa para este empleado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-y">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Prenda / EPP</th>
                <th className="px-4 py-2">Talle</th>
                <th className="px-4 py-2">Cant.</th>
                <th className="px-4 py-2">Notas</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveries.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    <div className="flex items-center gap-1"><Calendar size={12} /> {d.delivery_date}</div>
                  </td>
                  <td className="px-4 py-2 font-bold text-gray-800">{itemLabels[d.item_type] || d.item_type}</td>
                  <td className="px-4 py-2 text-ecar-blue font-bold">{d.size}</td>
                  <td className="px-4 py-2">{d.quantity}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{d.notes || '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este registro?')) {
                          deleteDelivery.mutate({ id: d.id, employee_id: employeeId });
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Eliminar registro"
                    >
                      <Trash2 size={16} />
                    </button>
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
