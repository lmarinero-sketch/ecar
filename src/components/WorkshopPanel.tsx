import React, { useState } from 'react';
import { Wrench, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useFleetMaintenanceOrders, useCreateFleetMaintenanceOrder, useUpdateFleetMaintenanceOrder, useFuelVehicles } from '../hooks/useData';
import type { FleetMaintenanceOrder } from '../lib/types';

export const WorkshopPanel: React.FC = () => {
  const { data: orders = [], isLoading } = useFleetMaintenanceOrders();
  const { data: vehicles = [] } = useFuelVehicles();
  const createOrder = useCreateFleetMaintenanceOrder();
  const updateOrder = useUpdateFleetMaintenanceOrder();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<FleetMaintenanceOrder>>({ status: 'pendiente', cost_materials: 0, cost_labor: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.title) return;
    
    await createOrder.mutateAsync(formData as FleetMaintenanceOrder);
    setShowForm(false);
    setFormData({ status: 'pendiente', cost_materials: 0, cost_labor: 0 });
  };

  const markCompleted = async (order: FleetMaintenanceOrder) => {
    await updateOrder.mutateAsync({ id: order.id, status: 'terminado', completion_date: new Date().toISOString().slice(0, 10) });
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando Taller...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Wrench className="text-amber-600" /> Órdenes de Taller
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva OT
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="light-card p-5 space-y-4 border-l-4 border-amber-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Vehículo *</label>
              <select required className="input" value={formData.vehicle_id || ''} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}>
                <option value="">Seleccionar...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.code} - {v.description}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Título de Tarea *</label>
              <input required type="text" className="input" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Cambio de aceite" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Mecánico Asignado</label>
              <input type="text" className="input" value={formData.mechanic_assigned || ''} onChange={e => setFormData({ ...formData, mechanic_assigned: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Inicio</label>
              <input type="date" className="input" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Costo Materiales</label>
              <input type="number" className="input" value={formData.cost_materials || 0} onChange={e => setFormData({ ...formData, cost_materials: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Costo Mano de Obra</label>
              <input type="number" className="input" value={formData.cost_labor || 0} onChange={e => setFormData({ ...formData, cost_labor: parseFloat(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={createOrder.isPending}>{createOrder.isPending ? 'Guardando...' : 'Crear Orden'}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['pendiente', 'en_taller', 'terminado'].map((statusFilter) => (
          <div key={statusFilter} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3">
            <h4 className="font-bold text-gray-600 uppercase text-xs mb-2">
              {statusFilter.replace('_', ' ')}
            </h4>
            {orders.filter(o => o.status === statusFilter).map(order => (
              <div key={order.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {order.vehicle?.code || 'Vehículo borrado'}
                  </span>
                  {statusFilter !== 'terminado' && (
                    <button onClick={() => markCompleted(order)} title="Marcar terminado" className="text-gray-400 hover:text-green-600">
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
                <p className="font-bold text-sm text-gray-800">{order.title}</p>
                {order.mechanic_assigned && <p className="text-xs text-gray-500 mt-1">Mecánico: {order.mechanic_assigned}</p>}
                <div className="mt-3 pt-2 border-t flex justify-between items-center text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
                  <span className="font-mono text-gray-600">${order.total_cost?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
