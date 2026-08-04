import React, { useState } from 'react';
import { PackageOpen, Plus, Trash2, Calendar, ShieldCheck } from 'lucide-react';
import { useEmployeePPE, useCreateEmployeePPE, useDeleteEmployeePPE } from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';

export const PPEDeliveriesPanel: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const { data: deliveries = [], isLoading } = useEmployeePPE(employeeId);
  const createDelivery = useCreateEmployeePPE();
  const deleteDelivery = useDeleteEmployeePPE();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
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
    'otro': '📦 Otro Elemento de Protección'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDelivery.mutateAsync({
        employee_id: employeeId,
        item_type: form.item_type as any,
        size: form.size || 'Único',
        quantity: form.quantity || 1,
        delivery_date: form.delivery_date,
        notes: form.notes || null,
      });
      useModalStore.getState().showAlert('Éxito', 'Entrega de EPP registrada correctamente.');
      setShowAdd(false);
      setForm({
        item_type: 'pantalon',
        size: 'M',
        quantity: 1,
        delivery_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err: any) {
      console.error('Error al registrar entrega EPP:', err);
      useModalStore.getState().showAlert('Error al Guardar', err?.message || 'No se pudo guardar el registro de EPP.');
    }
  };

  if (isLoading) return <div className="text-center py-4 text-xs text-gray-400">Cargando entregas de EPP...</div>;

  return (
    <div className="light-card p-5 mt-6 border-t-4 border-t-emerald-600">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            Entrega de Ropa de Trabajo y EPP (Integración Pañol & RRHH)
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">Control por colaborador para auditoría e higiene y seguridad.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
        >
          {showAdd ? 'Cancelar' : <><Plus size={14} /> Registrar Entrega</>}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 block mb-1">Prenda / Elemento EPP *</label>
              <select value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-medium">
                {Object.entries(itemLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Talle / Dimensión</label>
              <input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="Ej: 42, L, XL" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Fecha Entrega</label>
              <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Observaciones / Planilla Firma</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ej: Entregado según planilla N° 45..." className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createDelivery.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow"
            >
              {createDelivery.isPending ? 'Guardando...' : '✅ Confirmar Entrega'}
            </button>
          </div>
        </form>
      )}

      {deliveries.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <PackageOpen size={24} className="mx-auto mb-2 opacity-30 text-emerald-600" />
          <p className="text-xs">No hay entregas de Ropa o EPP registradas para este empleado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Elemento Entregado</th>
                <th>Talle</th>
                <th className="text-center">Cant.</th>
                <th>Observaciones</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="font-mono text-gray-500">
                    <div className="flex items-center gap-1"><Calendar size={12} /> {d.delivery_date}</div>
                  </td>
                  <td className="font-bold text-gray-800">{itemLabels[d.item_type] || d.item_type}</td>
                  <td className="text-emerald-700 font-bold font-mono">{d.size || 'Único'}</td>
                  <td className="text-center font-mono font-bold text-gray-900">{d.quantity}</td>
                  <td className="text-gray-500 italic">{d.notes || '—'}</td>
                  <td className="text-right">
                    <button
                      onClick={async () => {
                        if (await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar este registro de entrega?')) {
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
