import React, { useState, useMemo } from 'react';
import {
  Bell, Plus, Send, Clock, CheckCircle2, XCircle, X, MessageSquare,
  Calendar, Banknote, AlertTriangle, Trash2, History, Pencil
} from 'lucide-react';
import {
  useNotificationReminders, useCreateNotificationReminder, useDeleteNotificationReminder,
  useUpdateNotificationReminder,
  useNotificationContacts, useNotificationLog, useCreateNotificationLog,
  useCheques
} from '../hooks/useData';
import { sendWhatsAppMessage } from '../lib/builderbot';
import { NotificationContacts } from './NotificationContacts';
import type { NotificationReminder } from '../lib/types';


type Tab = 'reminders' | 'contacts' | 'log';

const TRIGGER_TYPES = [
  { id: 'manual', label: 'Manual / Personalizado', icon: MessageSquare },
  { id: 'cheque_due', label: 'Vencimiento de Cheque', icon: Banknote },
  { id: 'obligation_due', label: 'Vencimiento de Obligación', icon: Calendar },
  { id: 'custom_date', label: 'Fecha Personalizada', icon: Clock },
] as const;

export const NotificationPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>('reminders');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    trigger_type: NotificationReminder['trigger_type'];
    trigger_days_before: number;
    trigger_date: string;
    recurrence: NotificationReminder['recurrence'];
    contact_ids: string[];
    message_template: string;
    schedule_days: number[];
    schedule_time: string;
    date_from: string;
    date_until: string;
  }>({
    title: '', description: '', trigger_type: 'manual',
    trigger_days_before: 3, trigger_date: '', recurrence: 'once',
    contact_ids: [], message_template: '',
    schedule_days: [], schedule_time: '09:00',
    date_from: '', date_until: '',
  });

  const { data: reminders = [] } = useNotificationReminders();
  const { data: contacts = [] } = useNotificationContacts();
  const { data: logs = [] } = useNotificationLog();
  const { data: cheques = [] } = useCheques();
  const createReminder = useCreateNotificationReminder();
  const deleteReminder = useDeleteNotificationReminder();
  const updateReminder = useUpdateNotificationReminder();
  const createLog = useCreateNotificationLog();

  // Upcoming cheques (next 30 days)
  const upcomingCheques = useMemo(() => {
    const today = new Date();
    const limit = new Date(today.getTime() + 30 * 86400000);
    return cheques.filter(c =>
      c.due_date && c.status === 'pending' &&
      new Date(c.due_date) >= today && new Date(c.due_date) <= limit
    ).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  }, [cheques]);

  const resetForm = () => {
    setForm({ title: '', description: '', trigger_type: 'manual', trigger_days_before: 3, trigger_date: '', recurrence: 'once', contact_ids: [], message_template: '', schedule_days: [], schedule_time: '09:00', date_from: '', date_until: '' });
    setEditingId(null);
  };

  const handleEdit = (r: NotificationReminder) => {
    setForm({
      title: r.title,
      description: r.description || '',
      trigger_type: r.trigger_type,
      trigger_days_before: r.trigger_days_before || 3,
      trigger_date: r.trigger_date || '',
      recurrence: r.recurrence,
      contact_ids: r.contact_ids || [],
      message_template: r.message_template,
      schedule_days: (r.schedule_days as number[]) || [],
      schedule_time: r.schedule_time || '09:00',
      date_from: r.date_from || '',
      date_until: r.date_until || '',
    });
    setEditingId(r.id);
    setShowNew(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.message_template || form.contact_ids.length === 0) return;
    // Calculate next_run_at based on schedule
    let next_run_at: string | null = null;
    if (form.recurrence !== 'once' && form.schedule_days.length > 0 && form.schedule_time) {
      const now = new Date();
      const [hours, minutes] = form.schedule_time.split(':').map(Number);
      for (let d = 0; d < 7; d++) {
        const candidate = new Date(now.getTime() + d * 86400000);
        if (form.schedule_days.includes(candidate.getDay())) {
          candidate.setHours(hours, minutes, 0, 0);
          if (candidate > now) {
            next_run_at = candidate.toISOString();
            break;
          }
        }
      }
    }
    const payload = {
      ...form,
      trigger_date: form.trigger_date || null,
      schedule_days: form.schedule_days.length > 0 ? form.schedule_days : null,
      schedule_time: form.schedule_time || '09:00',
      date_from: form.date_from || null,
      date_until: form.date_until || null,
      next_run_at,
      is_active: true,
    };
    if (editingId) {
      await updateReminder.mutateAsync({ id: editingId, ...payload });
    } else {
      await createReminder.mutateAsync(payload);
    }
    resetForm();
    setShowNew(false);
  };

  const handleSendNow = async (reminderId: string, template: string, contactIds: string[]) => {
    setSending(reminderId);
    const targets = contacts.filter(c => contactIds.includes(c.id));
    for (const contact of targets) {
      const content = template
        .replace('{nombre}', contact.name)
        .replace('{fecha}', new Date().toLocaleDateString('es-AR'));
      const result = await sendWhatsAppMessage({ number: contact.phone, content });
      await createLog.mutateAsync({
        reminder_id: reminderId,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_phone: contact.phone,
        message_content: content,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
      });
    }
    setSending(null);
  };

  const handleTestSend = async () => {
    if (!form.message_template || form.contact_ids.length === 0) return;
    setTestSending(true);
    setTestResult(null);
    const targets = contacts.filter(c => form.contact_ids.includes(c.id));
    let allOk = true;
    for (const contact of targets) {
      const content = form.message_template
        .replace('{nombre}', contact.name)
        .replace('{fecha}', new Date().toLocaleDateString('es-AR'));
      const result = await sendWhatsAppMessage({ number: contact.phone, content });
      if (!result.success) allOk = false;
      await createLog.mutateAsync({
        reminder_id: null,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_phone: contact.phone,
        message_content: `[PRUEBA] ${content}`,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
      });
    }
    setTestSending(false);
    setTestResult({
      ok: allOk,
      msg: allOk ? `✓ Enviado a ${targets.length} contacto(s)` : '✗ Hubo errores — revisá el historial',
    });
    setTimeout(() => setTestResult(null), 5000);
  };

  const toggleContact = (id: string) => {
    setForm(f => ({
      ...f,
      contact_ids: f.contact_ids.includes(id) ? f.contact_ids.filter(c => c !== id) : [...f.contact_ids, id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 light-card p-1 shadow-sm">
        {([
          { id: 'reminders', label: 'Recordatorios', icon: Bell },
          { id: 'contacts', label: 'Contactos', icon: MessageSquare },
          { id: 'log', label: 'Historial de Envíos', icon: History },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'bg-ecar-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB: CONTACTS */}
      {tab === 'contacts' && <NotificationContacts />}

      {/* TAB: REMINDERS */}
      {tab === 'reminders' && (
        <div className="space-y-4">
          {/* Cheque Alerts Preview */}
          {upcomingCheques.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-2">
                <AlertTriangle size={16} /> {upcomingCheques.length} cheque(s) próximos a vencer
              </h4>
              <div className="flex flex-wrap gap-2">
                {upcomingCheques.slice(0, 5).map(c => (
                  <span key={c.id} className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-700">
                    #{c.cheque_number} · $ {c.amount_ars.toLocaleString('es-AR')} · Vence {new Date(c.due_date!).toLocaleDateString('es-AR')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-800">Recordatorios Configurados</h4>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-4 py-2 bg-ecar-blue text-white rounded-lg text-sm font-bold hover:bg-ecar-blueDark transition-all shadow-md">
              <Plus size={16} /> Nuevo Recordatorio
            </button>
          </div>

          {/* Reminders List */}
          {reminders.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              <Bell size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No hay recordatorios configurados</p>
              <p className="text-sm mt-1">Creá uno para enviar notificaciones por WhatsApp.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map(r => {
                const rContacts = contacts.filter(c => (r.contact_ids || []).includes(c.id));
                const triggerInfo = TRIGGER_TYPES.find(t => t.id === r.trigger_type);
                const TriggerIcon = triggerInfo?.icon || Bell;
                return (
                  <div key={r.id} className="light-card p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TriggerIcon size={16} className="text-ecar-blue shrink-0" />
                          <h5 className="font-bold text-gray-900 truncate">{r.title}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.is_active ? 'Activo' : 'Pausado'}
                          </span>
                        </div>
                        {r.description && <p className="text-xs text-gray-500 mb-2">{r.description}</p>}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-gray-600 font-medium">{triggerInfo?.label}</span>
                          {r.trigger_type !== 'manual' && (
                            <span className="px-2 py-1 bg-blue-50 rounded-lg text-blue-600 font-medium">{r.trigger_days_before} días antes</span>
                          )}
                          <span className="px-2 py-1 bg-slate-50 rounded-lg text-ecar-blue font-medium capitalize">{r.recurrence === 'once' ? 'Una vez' : r.recurrence === 'daily' ? 'Diario' : r.recurrence === 'weekly' ? 'Semanal' : 'Mensual'}</span>
                          {r.schedule_time && r.recurrence !== 'once' && (
                            <span className="px-2 py-1 bg-amber-50 rounded-lg text-amber-700 font-medium font-mono">{r.schedule_time?.slice(0, 5)} hs</span>
                          )}
                          {(r.schedule_days?.length ?? 0) > 0 && r.recurrence === 'weekly' && (
                            <span className="px-2 py-1 bg-slate-50 rounded-lg text-ecar-blue font-medium">
                              {(r.schedule_days as number[]).map((d: number) => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ')}
                            </span>
                          )}
                          {(r.date_from || r.date_until) && (
                            <span className="px-2 py-1 bg-emerald-50 rounded-lg text-emerald-600 font-medium">
                              {r.date_from ? new Date(r.date_from).toLocaleDateString('es-AR') : '∞'} → {r.date_until ? new Date(r.date_until).toLocaleDateString('es-AR') : '∞'}
                            </span>
                          )}
                        </div>
                        {rContacts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rContacts.map(c => (
                              <span key={c.id} className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-[10px] font-bold text-green-700">{c.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleSendNow(r.id, r.message_template, r.contact_ids)}
                          disabled={sending === r.id || rContacts.length === 0}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                          <Send size={12} /> {sending === r.id ? 'Enviando...' : 'Enviar Ahora'}
                        </button>
                        <button onClick={() => handleEdit(r)} className="text-gray-300 hover:text-ecar-blue transition-colors" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: r.id, title: r.title })} className="text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {r.message_template && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold mb-1">Mensaje:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{r.message_template}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: LOG */}
      {tab === 'log' && (
        <div className="light-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <History size={16} className="text-ecar-blue" /> Historial de Mensajes Enviados
            </h4>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Send size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin envíos registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map(l => (
                <div key={l.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${l.status === 'sent' ? 'bg-green-500' : l.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{l.contact_name} <span className="font-mono text-gray-400 font-normal text-xs">{l.contact_phone}</span></p>
                    <p className="text-xs text-gray-500 truncate">{l.message_content}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'sent' ? 'bg-green-100 text-green-700' : l.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {l.status === 'sent' ? 'Enviado' : l.status === 'failed' ? 'Error' : 'Pendiente'}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(l.sent_at).toLocaleString('es-AR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">¿Eliminar recordatorio?</h3>
              <p className="text-sm text-gray-500 mt-1">Se eliminará <span className="font-bold">"{deleteConfirm.title}"</span>. Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="badge badge-neutral">Cancelar</button>
              <button onClick={() => { deleteReminder.mutate(deleteConfirm.id); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-md">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW/EDIT REMINDER MODAL */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingId ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}</h3>
              <button onClick={() => { setShowNew(false); resetForm(); }}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Motivo / Título</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Aviso vencimiento cheque proveedor" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describí el motivo del recordatorio..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue resize-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Tipo de Disparador</label>
                <select value={form.trigger_type} onChange={e => setForm({...form, trigger_type: e.target.value as NotificationReminder['trigger_type']})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">
                  {TRIGGER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {form.trigger_type !== 'manual' && form.trigger_type !== 'custom_date' && (
                <div>
                  <label className="text-xs font-bold text-gray-500">Días antes del vencimiento</label>
                  <input type="number" min={1} max={30} value={form.trigger_days_before} onChange={e => setForm({...form, trigger_days_before: parseInt(e.target.value) || 3})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                </div>
              )}

              {form.trigger_type === 'custom_date' && (
                <div>
                  <label className="text-xs font-bold text-gray-500">Fecha</label>
                  <input type="date" value={form.trigger_date} onChange={e => setForm({...form, trigger_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500">Horario de envío (GMT-3 Buenos Aires)</label>
                <input
                  type="time"
                  value={form.schedule_time || ''}
                  onChange={e => setForm({...form, schedule_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Recurrencia</label>
                <select value={form.recurrence} onChange={e => setForm({...form, recurrence: e.target.value as NotificationReminder['recurrence'], schedule_days: e.target.value === 'once' ? [] : form.schedule_days})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">
                  <option value="once">Una vez</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              {/* Schedule details - only for recurring reminders */}
              {form.recurrence !== 'once' && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-ecar-blue flex items-center gap-1.5"><Clock size={14} /> Configuración de Horario</h4>

                  {/* Day of week selection */}
                  {(form.recurrence === 'weekly' || form.recurrence === 'daily') && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">Días de la semana</label>
                      <div className="flex gap-1.5">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              schedule_days: f.schedule_days.includes(i)
                                ? f.schedule_days.filter(d => d !== i)
                                : [...f.schedule_days, i].sort(),
                            }))}
                            className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                              form.schedule_days.includes(i)
                                ? 'bg-ecar-blue text-white shadow-md'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-ecar-blue/30'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      {form.schedule_days.length === 0 && (
                        <p className="text-[10px] text-amber-600 mt-1 font-medium">⚠ Seleccioná al menos un día</p>
                      )}
                    </div>
                  )}

                  {/* Day of month for monthly */}
                  {form.recurrence === 'monthly' && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">Día del mes</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 5, 10, 15, 20, 25, 28].map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              schedule_days: f.schedule_days.includes(day)
                                ? f.schedule_days.filter(d => d !== day)
                                : [...f.schedule_days, day].sort((a,b) => a-b),
                            }))}
                            className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                              form.schedule_days.includes(day)
                                ? 'bg-ecar-blue text-white shadow-md'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-ecar-blue/30'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}



                  {/* Date range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500">Desde</label>
                      <input
                        type="date"
                        value={form.date_from}
                        onChange={e => setForm({...form, date_from: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Hasta</label>
                      <input
                        type="date"
                        value={form.date_until}
                        onChange={e => setForm({...form, date_until: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Si no completás las fechas, el recordatorio estará activo indefinidamente.</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Destinatarios</label>
                {contacts.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay contactos. Creá uno en la pestaña "Contactos".</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {contacts.map(c => (
                      <button key={c.id} onClick={() => toggleContact(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.contact_ids.includes(c.id) ? 'bg-ecar-blue text-white border-ecar-blue' : 'bg-white text-gray-600 border-gray-200 hover:border-ecar-blue/30'}`}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Mensaje</label>
                <textarea value={form.message_template} onChange={e => setForm({...form, message_template: e.target.value})} placeholder="Hola {nombre}, te recordamos que..." rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue resize-none font-mono" />
                <p className="text-[10px] text-gray-400 mt-1">Variables: {'{nombre}'}, {'{fecha}'}</p>
              </div>
            </div>

            {/* Test result toast */}
            {testResult && (
              <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {testResult.msg}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTestSend}
                disabled={!form.message_template || form.contact_ids.length === 0 || testSending}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={14} /> {testSending ? 'Enviando...' : 'Probar Envío'}
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title || !form.message_template || form.contact_ids.length === 0 || createReminder.isPending || updateReminder.isPending}
                className="btn-primary 
              ">
                {(createReminder.isPending || updateReminder.isPending) ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Recordatorio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
