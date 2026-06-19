import React, { useState } from 'react';
import { CalendarDays, Thermometer, AlertTriangle, Shield, Plus, X, Banknote, Trash2, Clock } from 'lucide-react';
import { useEmployeeAbsences, useCreateEmployeeAbsence, useDeleteEmployeeAbsence, useEmployeeAdvances, useCreateEmployeeAdvance, useDeleteEmployeeAdvance } from '../hooks/useData';

const ABSENCE_TYPES = [
  { value: 'vacation', label: 'Vacaciones', icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
  { value: 'medical', label: 'Enfermedad', icon: Thermometer, color: 'text-red-600 bg-red-50' },
  { value: 'suspension', label: 'Suspensión', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  { value: 'art_leave', label: 'ART', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  { value: 'half_day', label: 'Medio Día', icon: Clock, color: 'text-teal-600 bg-teal-50' },
] as const;

interface Props {
  employeeId: string;
  employeeName: string;
}

export const EmployeeNovedadesPanel: React.FC<Props> = ({ employeeId, employeeName: _employeeName }) => {
  const { data: absences = [] } = useEmployeeAbsences(employeeId);
  const { data: advances = [] } = useEmployeeAdvances(employeeId);
  const createAbsence = useCreateEmployeeAbsence();
  const deleteAbsence = useDeleteEmployeeAbsence();
  const createAdvance = useCreateEmployeeAdvance();
  const deleteAdvance = useDeleteEmployeeAdvance();

  const [showAbsForm, setShowAbsForm] = useState(false);
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [absForm, setAbsForm] = useState({ type: 'vacation' as string, start_date: '', end_date: '', reason: '', art_case_number: '' });
  const [advForm, setAdvForm] = useState({ amount_ars: '', advance_date: '', reason: '' });
  const [confirmDeleteAbs, setConfirmDeleteAbs] = useState<string | null>(null);
  const [confirmDeleteAdv, setConfirmDeleteAdv] = useState<string | null>(null);

  const handleCreateAbsence = async () => {
    if (!absForm.start_date) return;
    const days = absForm.end_date
      ? Math.ceil((new Date(absForm.end_date).getTime() - new Date(absForm.start_date).getTime()) / 86400000) + 1
      : 1;
    await createAbsence.mutateAsync({
      employee_id: employeeId,
      type: absForm.type as any,
      start_date: absForm.start_date,
      end_date: absForm.end_date || absForm.start_date,
      days,
      reason: absForm.reason || null,
      art_case_number: absForm.art_case_number || null,
    });
    setAbsForm({ type: 'vacation', start_date: '', end_date: '', reason: '', art_case_number: '' });
    setShowAbsForm(false);
  };

  const handleCreateAdvance = async () => {
    if (!advForm.amount_ars || !advForm.advance_date) return;
    await createAdvance.mutateAsync({
      employee_id: employeeId,
      amount_ars: parseFloat(advForm.amount_ars),
      advance_date: advForm.advance_date,
      reason: advForm.reason || null,
    });
    setAdvForm({ amount_ars: '', advance_date: '', reason: '' });
    setShowAdvForm(false);
  };

  const totalAdvances = advances.filter(a => !a.deducted).reduce((s, a) => s + a.amount_ars, 0);

  return (
    <div className="space-y-4">
      {/* Ausencias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays size={16} /> Ausencias y Licencias
          </h4>
          <button onClick={() => setShowAbsForm(!showAbsForm)} className="bg-ecar-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            {showAbsForm ? <><X size={14}/> Cancelar</> : <><Plus size={14}/> Registrar</>}
          </button>
        </div>

        {showAbsForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-dashed border-gray-300 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Tipo</label>
                <select value={absForm.type} onChange={e => setAbsForm({ ...absForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {ABSENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Desde *</label>
                <input type="date" value={absForm.start_date} onChange={e => setAbsForm({ ...absForm, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Hasta</label>
                <input type="date" value={absForm.end_date} onChange={e => setAbsForm({ ...absForm, end_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {absForm.type === 'art_leave' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Nro Siniestro ART</label>
                  <input value={absForm.art_case_number} onChange={e => setAbsForm({ ...absForm, art_case_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Motivo</label>
              <input value={absForm.reason} onChange={e => setAbsForm({ ...absForm, reason: e.target.value })} placeholder="Detalle del motivo..." className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button onClick={handleCreateAbsence} disabled={!absForm.start_date || createAbsence.isPending} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {createAbsence.isPending ? 'Guardando...' : 'Guardar Ausencia'}
            </button>
          </div>
        )}

        {absences.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin ausencias registradas</p>
        ) : (
          <div className="space-y-2">
            {absences.map(a => {
              const cfg = ABSENCE_TYPES.find(t => t.value === a.type);
              const Icon = cfg?.icon || CalendarDays;
              return (
                <div key={a.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg?.color || 'bg-gray-100'}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{cfg?.label || a.type}</p>
                      <p className="text-xs text-gray-400">{a.start_date} → {a.end_date || a.start_date} · {a.days || 1} día(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {a.reason && <p className="text-xs text-gray-500">{a.reason}</p>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {a.status === 'active' ? 'En curso' : 'Cerrada'}
                      </span>
                    </div>
                    {confirmDeleteAbs === a.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={async () => { await deleteAbsence.mutateAsync(a.id); setConfirmDeleteAbs(null); }} className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">Sí, eliminar</button>
                        <button onClick={() => setConfirmDeleteAbs(null)} className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteAbs(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Adelantos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <Banknote size={16} /> Adelantos
            {totalAdvances > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                Pendiente: $ {totalAdvances.toLocaleString('es-AR')}
              </span>
            )}
          </h4>
          <button onClick={() => setShowAdvForm(!showAdvForm)} className="bg-ecar-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            {showAdvForm ? <><X size={14}/> Cancelar</> : <><Plus size={14}/> Nuevo Adelanto</>}
          </button>
        </div>

        {showAdvForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-dashed border-gray-300 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Monto ($) *</label>
                <input type="number" value={advForm.amount_ars} onChange={e => setAdvForm({ ...advForm, amount_ars: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Fecha *</label>
                <input type="date" value={advForm.advance_date} onChange={e => setAdvForm({ ...advForm, advance_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Motivo</label>
                <input value={advForm.reason} onChange={e => setAdvForm({ ...advForm, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <button onClick={handleCreateAdvance} disabled={!advForm.amount_ars || !advForm.advance_date || createAdvance.isPending} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {createAdvance.isPending ? 'Guardando...' : 'Registrar Adelanto'}
            </button>
          </div>
        )}

        {advances.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin adelantos registrados</p>
        ) : (
          <div className="space-y-2">
            {advances.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="text-sm font-bold font-mono text-gray-800">$ {a.amount_ars.toLocaleString('es-AR')}</p>
                  <p className="text-xs text-gray-400">{a.advance_date}{a.reason ? ` · ${a.reason}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.deducted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {a.deducted ? 'Descontado' : 'Pendiente'}
                  </span>
                  {confirmDeleteAdv === a.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={async () => { await deleteAdvance.mutateAsync(a.id); setConfirmDeleteAdv(null); }} className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">Sí, eliminar</button>
                      <button onClick={() => setConfirmDeleteAdv(null)} className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteAdv(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
