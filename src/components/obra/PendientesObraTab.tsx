import React, { useState } from 'react';
import {
  ListChecks, Plus, CheckCircle2, AlertTriangle,
  ShieldAlert, Camera, Check, Wrench
} from 'lucide-react';
import { useProjectPendingTasks, useCreateProjectPendingTask, useUpdateProjectPendingTask } from '../../hooks/useObraData';
import { useCreateWbsElement, useCreateNonConformity } from '../../hooks/useData';
import type { ProjectPendingTask } from '../../lib/types';
import { useModalStore } from '../../store/useModalStore';

interface PendientesObraTabProps {
  projectId: string;
}

export const PendientesObraTab: React.FC<PendientesObraTabProps> = ({ projectId }) => {
  const { data: pendingTasks = [], isLoading } = useProjectPendingTasks(projectId);
  const createPending = useCreateProjectPendingTask();
  const updatePending = useUpdateProjectPendingTask();

  const createWbs = useCreateWbsElement();
  const createNC = useCreateNonConformity();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState<'todos' | 'pendiente' | 'en_proceso' | 'resuelto'>('todos');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('todos');

  const [form, setForm] = useState({
    descripcion: '',
    sector: '',
    responsable: '',
    prioridad: 'media' as ProjectPendingTask['prioridad'],
    fecha_objetivo: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    origen: 'recorrida' as ProjectPendingTask['origen'],
    foto_url: '',
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion.trim()) return;

    await createPending.mutateAsync({
      project_id: projectId,
      descripcion: form.descripcion.trim(),
      sector: form.sector.trim() || 'Frente General',
      responsable: form.responsable.trim() || null,
      prioridad: form.prioridad,
      fecha_objetivo: form.fecha_objetivo,
      origen: form.origen,
      estado: 'pendiente',
      foto_url: form.foto_url.trim() || null,
    });

    setShowCreateModal(false);
    setForm({
      descripcion: '',
      sector: '',
      responsable: '',
      prioridad: 'media',
      fecha_objetivo: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      origen: 'recorrida',
      foto_url: '',
    });
  };

  // Convert to programmed task in WBS
  const handleConvertToTask = async (task: ProjectPendingTask) => {
    if (await useModalStore.getState().showConfirm('Convertir en Tarea Programada', `¿Deseas programar "${task.descripcion}" como una actividad formal en el cronograma WBS?`)) {
      try {
        const newWbs = await createWbs.mutateAsync({
          project_id: projectId,
          name: `[Pendiente] ${task.descripcion}`,
          description: `Sector: ${task.sector}. Origen: ${task.origen}. Responsable: ${task.responsable || 'Sin asignar'}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: task.fecha_objetivo,
          phase: 'programacion',
          priority: task.prioridad === 'urgente' ? 'critica' : task.prioridad === 'alta' ? 'alta' : 'media',
          duration_days: 1,
          budget_cost_ars: 0,
        });

        await updatePending.mutateAsync({
          id: task.id,
          estado: 'convertido_tarea',
          wbs_element_id: newWbs?.id || null,
        });

        useModalStore.getState().showAlert('Éxito', 'El pendiente fue convertido en tarea programada en Planificación y Programación.');
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', 'No se pudo convertir: ' + err.message);
      }
    }
  };

  // Escalate to Non-Conformity (CNC)
  const handleEscalateToNC = async (task: ProjectPendingTask) => {
    if (await useModalStore.getState().showConfirm('Escalar a No Conformidad', `¿Deseas abrir formalmente un expediente de No Conformidad para "${task.descripcion}"?`)) {
      try {
        const newNC = await createNC.mutateAsync({
          project_id: projectId,
          category: 'obra',
          area: task.sector,
          description: `[Originado en Pendiente] ${task.descripcion}. Ubicación: ${task.sector}`,
          root_cause: `Observación detectada en ${task.origen}. No subsanada en término.`,
          corrective_action: `Acción inmediata requerida a cargo de: ${task.responsable || 'Jefe de Obra'}`,
          status: 'abierta',
          detected_by: task.responsable || 'Inspector de Obra',
          evidence_urls: task.foto_url ? [task.foto_url] : [],
        } as any);

        await updatePending.mutateAsync({
          id: task.id,
          estado: 'escalado_nc',
          non_conformity_id: newNC?.id || null,
        });

        useModalStore.getState().showAlert('No Conformidad Creada', 'El desvío ha sido escalado al módulo de Calidad y No Conformidades.');
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', 'No se pudo escalar: ' + err.message);
      }
    }
  };

  const handleToggleResolved = async (task: ProjectPendingTask) => {
    const nextState = task.estado === 'resuelto' ? 'pendiente' : 'resuelto';
    await updatePending.mutateAsync({
      id: task.id,
      estado: nextState,
    });
  };

  const filteredTasks = pendingTasks.filter(t => {
    const matchEstado = filterEstado === 'todos' || t.estado === filterEstado;
    const matchPrioridad = filterPrioridad === 'todos' || t.prioridad === filterPrioridad;
    return matchEstado && matchPrioridad;
  });

  return (
    <div className="space-y-6">
      {/* ─── Top Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ListChecks size={20} className="text-amber-500" /> Pendientes de Recorrida & Tareas Menores
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Captura instantánea de observaciones en frentes. Convertí cualquier pendiente en tarea programada o escalalo a No Conformidad en 1 clic.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold py-2 px-4 shadow-sm flex items-center gap-2 self-start md:self-auto text-xs"
        >
          <Plus size={16} /> Capturar Pendiente
        </button>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-bold text-gray-500">Estado:</span>
        {(['todos', 'pendiente', 'en_proceso', 'resuelto'] as const).map(st => (
          <button
            key={st}
            onClick={() => setFilterEstado(st)}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              filterEstado === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {st === 'todos' ? 'Todos' : st === 'pendiente' ? '⏳ Pendientes' : st === 'en_proceso' ? '⚡ En Proceso' : '✅ Resueltos'}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-300 mx-2 hidden md:block" />

        <span className="font-bold text-gray-500">Prioridad:</span>
        {['todos', 'urgente', 'alta', 'media', 'baja'].map(pr => (
          <button
            key={pr}
            onClick={() => setFilterPrioridad(pr)}
            className={`px-3 py-1 rounded-lg font-bold uppercase text-[10px] transition-colors ${
              filterPrioridad === pr ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {pr}
          </button>
        ))}
      </div>

      {/* ─── Task List ─── */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando pendientes...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
          <h4 className="text-base font-bold text-gray-700">Sin pendientes en este filtro</h4>
          <p className="text-xs text-gray-500">Todo el frente se encuentra al día o no hay observaciones registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map(task => {
            const isDone = task.estado === 'resuelto';
            const isConverted = task.estado === 'convertido_tarea';
            const isEscalated = task.estado === 'escalado_nc';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl p-4 border transition-all shadow-sm flex flex-col justify-between space-y-3 ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                    : isEscalated
                    ? 'border-red-300 bg-red-50/20'
                    : isConverted
                    ? 'border-blue-200 bg-blue-50/20'
                    : task.prioridad === 'urgente'
                    ? 'border-amber-400 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      task.prioridad === 'urgente'
                        ? 'bg-red-500 text-white'
                        : task.prioridad === 'alta'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.prioridad}
                    </span>

                    <span className="text-gray-400 text-[11px] font-medium">
                      Origen: <strong className="text-gray-600 capitalize">{task.origen}</strong>
                    </span>
                  </div>

                  <h4 className={`font-bold text-sm text-gray-900 ${isDone ? 'line-through text-gray-500' : ''}`}>
                    {task.descripcion}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-bold uppercase">Sector</span>
                      <span className="font-bold text-gray-800">{task.sector}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-bold uppercase">Fecha Objetivo</span>
                      <span className="font-bold text-gray-800">{task.fecha_objetivo}</span>
                    </div>
                  </div>

                  {task.responsable && (
                    <div className="text-xs text-gray-500">
                      <span className="text-[10px] text-gray-400 block font-bold uppercase">Responsable</span>
                      <span className="font-bold text-gray-700">{task.responsable}</span>
                    </div>
                  )}

                  {task.foto_url && (
                    <div className="mt-2">
                      <a href={task.foto_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold">
                        <Camera size={12} /> Ver foto adjunta
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Badges & Integrated Conversions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleResolved(task)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                    }`}
                  >
                    <Check size={14} /> {isDone ? 'Resuelto' : 'Marcar Resuelto'}
                  </button>

                  {!isDone && !isConverted && !isEscalated && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleConvertToTask(task)}
                        title="Inyectar como actividad al cronograma WBS"
                        className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Wrench size={12} /> Tarea Programada
                      </button>

                      <button
                        onClick={() => handleEscalateToNC(task)}
                        title="Escalar a No Conformidad formal"
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <ShieldAlert size={12} /> Escalar a NC
                      </button>
                    </div>
                  )}

                  {isConverted && (
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Convertido a Tarea WBS
                    </span>
                  )}
                  {isEscalated && (
                    <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <AlertTriangle size={12} /> Escalado a No Conformidad
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Create Task ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <ListChecks size={20} className="text-amber-500" /> Capturar Pendiente de Obra
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Descripción Breve *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej: Retirar piedras del borde de zanja en Pasaje 3..."
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Sector / Ubicación *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Mza B / Tramo N28-N21"
                    value={form.sector}
                    onChange={e => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Responsable</label>
                  <input
                    type="text"
                    placeholder="Ej: Capataz / Subcontratista"
                    value={form.responsable}
                    onChange={e => setForm({ ...form, responsable: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={e => setForm({ ...form, prioridad: e.target.value as any })}
                    className="w-full px-2.5 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Origen</label>
                  <select
                    value={form.origen}
                    onChange={e => setForm({ ...form, origen: e.target.value as any })}
                    className="w-full px-2.5 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="recorrida">Recorrida</option>
                    <option value="inspeccion">Inspección</option>
                    <option value="parte_diario">Parte Diario</option>
                    <option value="reunion">Reunión</option>
                    <option value="cliente">Comitente</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Fecha Objetivo</label>
                  <input
                    type="date"
                    required
                    value={form.fecha_objetivo}
                    onChange={e => setForm({ ...form, fecha_objetivo: e.target.value })}
                    className="w-full px-2 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Foto o Evidencia URL (opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.foto_url}
                  onChange={e => setForm({ ...form, foto_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createPending.isPending || !form.descripcion.trim()}
                  className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold px-5 py-2"
                >
                  {createPending.isPending ? 'Guardando...' : 'Registrar Pendiente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
