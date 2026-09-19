import React, { useState } from 'react';
import {
  Plus, CheckCircle2, Clock,
  Flag, Edit3, Trash2, ShieldAlert
} from 'lucide-react';
import { useProjectMilestones, useCreateProjectMilestone, useUpdateProjectMilestone, useDeleteProjectMilestone } from '../../hooks/useObraData';
import type { ProjectMilestone } from '../../lib/types';
import { useModalStore } from '../../store/useModalStore';

interface HitosPlazosTabProps {
  projectId: string;
}

export const HitosPlazosTab: React.FC<HitosPlazosTabProps> = ({ projectId }) => {
  const { data: milestones = [], isLoading } = useProjectMilestones(projectId);
  const createMilestone = useCreateProjectMilestone();
  const updateMilestone = useUpdateProjectMilestone();
  const deleteMilestone = useDeleteProjectMilestone();

  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [planRecoveryModal, setPlanRecoveryModal] = useState<ProjectMilestone | null>(null);
  const [recoveryForm, setRecoveryForm] = useState({ causa_desvio: '', plan_recuperacion: '', nueva_fecha: '' });

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'contractual' as ProjectMilestone['tipo'],
    fecha_objetivo_original: new Date().toISOString().split('T')[0],
    fecha_pronosticada: new Date().toISOString().split('T')[0],
    responsable: '',
    estado: 'al_dia' as ProjectMilestone['estado'],
    avance_requerido_pct: 100,
    avance_real_pct: 0,
  });

  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setForm({
      nombre: '',
      descripcion: '',
      tipo: 'contractual',
      fecha_objetivo_original: new Date().toISOString().split('T')[0],
      fecha_pronosticada: new Date().toISOString().split('T')[0],
      responsable: '',
      estado: 'al_dia',
      avance_requerido_pct: 100,
      avance_real_pct: 0,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m: ProjectMilestone) => {
    setEditingMilestone(m);
    setForm({
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      tipo: m.tipo,
      fecha_objetivo_original: m.fecha_objetivo_original,
      fecha_pronosticada: m.fecha_pronosticada,
      responsable: m.responsable || '',
      estado: m.estado,
      avance_requerido_pct: m.avance_requerido_pct,
      avance_real_pct: m.avance_real_pct,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    if (editingMilestone) {
      await updateMilestone.mutateAsync({
        id: editingMilestone.id,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        tipo: form.tipo,
        fecha_objetivo_original: form.fecha_objetivo_original,
        fecha_pronosticada: form.fecha_pronosticada,
        responsable: form.responsable || null,
        estado: form.estado,
        avance_requerido_pct: Number(form.avance_requerido_pct) || 0,
        avance_real_pct: Number(form.avance_real_pct) || 0,
      });
    } else {
      await createMilestone.mutateAsync({
        project_id: projectId,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        tipo: form.tipo,
        fecha_objetivo_original: form.fecha_objetivo_original,
        fecha_pronosticada: form.fecha_pronosticada,
        responsable: form.responsable || null,
        estado: form.estado,
        avance_requerido_pct: Number(form.avance_requerido_pct) || 0,
        avance_real_pct: Number(form.avance_real_pct) || 0,
      });
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (await useModalStore.getState().showConfirm('Eliminar Hito', `¿Estás seguro de eliminar el hito "${name}"?`)) {
      await deleteMilestone.mutateAsync(id);
    }
  };

  const handleOpenRecovery = (m: ProjectMilestone) => {
    setPlanRecoveryModal(m);
    setRecoveryForm({
      causa_desvio: m.causa_desvio || '',
      plan_recuperacion: m.plan_recuperacion || '',
      nueva_fecha: m.fecha_pronosticada || m.fecha_objetivo_original,
    });
  };

  const handleSaveRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planRecoveryModal) return;

    await updateMilestone.mutateAsync({
      id: planRecoveryModal.id,
      causa_desvio: recoveryForm.causa_desvio,
      plan_recuperacion: recoveryForm.plan_recuperacion,
      fecha_pronosticada: recoveryForm.nueva_fecha,
      estado: 'en_riesgo',
    });
    setPlanRecoveryModal(null);
  };

  const calculateDaysLeft = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr + 'T00:00:00');
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysBadge = (days: number, estado: string) => {
    if (estado === 'cumplido') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Cumplido</span>;
    }
    if (days < 0) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">Vencido hace {Math.abs(days)}d</span>;
    }
    if (days <= 3) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500 text-white animate-pulse">¡Vence en {days}d!</span>;
    }
    if (days <= 7) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">Alerta 7d ({days}d)</span>;
    }
    if (days <= 15) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Alerta 15d ({days}d)</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{days} días restantes</span>;
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Action ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Flag size={20} className="text-amber-500" /> Hitos Críticos & Gestión de Plazos
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitoreo preventivo de fechas clave: alertas tempranas a 30, 15, 7 y 3 días, comparación de fecha contractual vs pronosticada y planes de recuperación.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold py-2 px-4 shadow-sm flex items-center gap-2 self-start md:self-auto text-xs"
        >
          <Plus size={16} /> Nuevo Hito
        </button>
      </div>

      {/* ─── Milestones List ─── */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando hitos de la obra...</div>
      ) : milestones.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <Flag size={48} className="mx-auto text-gray-300" />
          <h4 className="text-base font-bold text-gray-700">Sin hitos registrados</h4>
          <p className="text-xs text-gray-500">Agregá hitos contractuales o de entrega interna para activar las alertas de plazo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map(m => {
            const daysLeft = calculateDaysLeft(m.fecha_pronosticada || m.fecha_objetivo_original);
            const isDelayed = m.fecha_pronosticada > m.fecha_objetivo_original;

            return (
              <div
                key={m.id}
                className={`bg-white rounded-xl p-5 border transition-all shadow-sm space-y-4 ${
                  m.estado === 'en_riesgo' || m.estado === 'vencido' || daysLeft < 0
                    ? 'border-red-300 bg-red-50/20'
                    : m.estado === 'cumplido'
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      m.estado === 'cumplido'
                        ? 'bg-emerald-100 text-emerald-700'
                        : m.estado === 'en_riesgo' || m.estado === 'vencido'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {m.estado === 'cumplido' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          m.tipo === 'contractual'
                            ? 'bg-purple-100 text-purple-800'
                            : m.tipo === 'terceros'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {m.tipo === 'contractual' ? 'Hito Contractual' : m.tipo === 'terceros' ? 'Depende de Terceros' : 'Hito Interno'}
                        </span>
                        {getDaysBadge(daysLeft, m.estado)}
                      </div>

                      <h4 className="font-extrabold text-gray-900 text-base">{m.nombre}</h4>
                      {m.descripcion && <p className="text-xs text-gray-600">{m.descripcion}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleOpenRecovery(m)}
                      title="Registrar Causa / Plan de Recuperación"
                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldAlert size={14} className="text-amber-600" /> Plan de Acción
                    </button>
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 text-gray-400 hover:text-ecar-blue rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.nombre)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Dates comparison line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Fecha Contractual</span>
                    <span className="font-extrabold text-gray-800">
                      {new Date(m.fecha_objetivo_original + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Fecha Pronosticada</span>
                    <span className={`font-extrabold ${isDelayed ? 'text-red-600' : 'text-emerald-700'}`}>
                      {new Date(m.fecha_pronosticada + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {isDelayed && ' ⚠️'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Responsable</span>
                    <span className="font-bold text-gray-700 line-clamp-1">{m.responsable || 'No asignado'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Avance Req. vs Real</span>
                    <span className="font-extrabold text-gray-800">{m.avance_real_pct}% / {m.avance_requerido_pct}%</span>
                  </div>
                </div>

                {/* Cause and recovery plan snippet if exists */}
                {(m.causa_desvio || m.plan_recuperacion) && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                    {m.causa_desvio && (
                      <p className="text-amber-900">
                        <span className="font-bold">Causa del Desvío:</span> {m.causa_desvio}
                      </p>
                    )}
                    {m.plan_recuperacion && (
                      <p className="text-amber-900">
                        <span className="font-bold">Plan de Recuperación:</span> {m.plan_recuperacion}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Create / Edit Milestone ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <Flag size={20} className="text-amber-500" /> {editingMilestone ? 'Editar Hito' : 'Nuevo Hito de Obra'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Nombre del Hito *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Finalización de Cañería Principal Tramo A"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Tipo de Hito</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="contractual">Hito Contractual</option>
                    <option value="interno">Hito Interno</option>
                    <option value="terceros">Depende de Terceros / Comitente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm({ ...form, estado: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="al_dia">🟢 Al Día</option>
                    <option value="en_riesgo">🟡 En Riesgo</option>
                    <option value="vencido">🔴 Vencido</option>
                    <option value="cumplido">🏁 Cumplido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Fecha Objetivo Original</label>
                  <input
                    type="date"
                    required
                    value={form.fecha_objetivo_original}
                    onChange={e => setForm({ ...form, fecha_objetivo_original: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Fecha Pronosticada</label>
                  <input
                    type="date"
                    required
                    value={form.fecha_pronosticada}
                    onChange={e => setForm({ ...form, fecha_pronosticada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Avance Requerido %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.avance_requerido_pct}
                    onChange={e => setForm({ ...form, avance_requerido_pct: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Avance Real %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.avance_real_pct}
                    onChange={e => setForm({ ...form, avance_real_pct: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Responsable</label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Juan Pérez / Jefe de Obra"
                  value={form.responsable}
                  onChange={e => setForm({ ...form, responsable: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold px-5 py-2"
                >
                  {editingMilestone ? 'Guardar Cambios' : 'Crear Hito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Plan de Recuperación ─── */}
      {planRecoveryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-500" /> Plan de Acción: {planRecoveryModal.nombre}
              </h3>
              <button onClick={() => setPlanRecoveryModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveRecovery} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Causa del Desvío o Riesgo *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detallar por qué se comprometió el plazo (ej: rotura de caño, lluvia continua, demora en suministro)..."
                  value={recoveryForm.causa_desvio}
                  onChange={e => setRecoveryForm({ ...recoveryForm, causa_desvio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Plan de Recuperación Operativa *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Acciones concretas para recuperar plazo (ej: sumar cuadrilla de apoyo, horario extendido, desvío de traza)..."
                  value={recoveryForm.plan_recuperacion}
                  onChange={e => setRecoveryForm({ ...recoveryForm, plan_recuperacion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Nueva Fecha Pronosticada</label>
                <input
                  type="date"
                  required
                  value={recoveryForm.nueva_fecha}
                  onChange={e => setRecoveryForm({ ...recoveryForm, nueva_fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">La fecha objetivo original ({planRecoveryModal.fecha_objetivo_original}) se mantiene intacta para auditoría contractual.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPlanRecoveryModal(null)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold px-5 py-2"
                >
                  Guardar Plan de Acción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
