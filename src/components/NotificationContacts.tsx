import React, { useState } from 'react';
import { UserPlus, Phone, Trash2, X, User } from 'lucide-react';
import { useModalStore } from '../store/useModalStore';
import { useNotificationContacts, useCreateNotificationContact, useDeleteNotificationContact } from '../hooks/useData';
import { formatArgPhone } from '../lib/builderbot';

const ROLES = ['Contador', 'Encargado de Obra', 'Administración', 'Gerencia', 'Proveedor', 'Otro'];

export const NotificationContacts: React.FC = () => {
  const { data: contacts = [], isLoading } = useNotificationContacts();
  const createContact = useCreateNotificationContact();
  const deleteContact = useDeleteNotificationContact();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', role: 'Contador' });

  const handleCreate = async () => {
    if (!form.name || !form.phone) return;
    await createContact.mutateAsync({
      name: form.name,
      phone: formatArgPhone(form.phone),
      role: form.role,
      is_active: true,
    });
    setForm({ name: '', phone: '', role: 'Contador' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800 flex items-center gap-2"><Phone size={16} className="text-ecar-blue" /> Contactos WhatsApp</h4>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-ecar-blue text-white rounded-lg text-xs font-bold hover:bg-ecar-blueDark transition-all shadow-sm">
          <UserPlus size={14} /> Nuevo Contacto
        </button>
      </div>

      {/* New Contact Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nuevo Contacto</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Nombre</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: María López" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Teléfono (WhatsApp)</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Ej: 11 1234-5678" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue font-mono" />
                <p className="text-[10px] text-gray-400 mt-1">Se formatea automáticamente a formato internacional</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Rol</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleCreate} disabled={!form.name || !form.phone || createContact.isPending} className="w-full py-2.5 bg-ecar-blue text-white rounded-xl font-bold text-sm hover:bg-ecar-blueDark transition-all shadow-md disabled:opacity-50">
              {createContact.isPending ? 'Guardando...' : 'Guardar Contacto'}
            </button>
          </div>
        </div>
      )}

      {/* Contact List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Cargando contactos...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <User size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay contactos configurados</p>
          <p className="text-sm mt-1">Agregá contactos para recibir notificaciones por WhatsApp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{c.name}</p>
                <p className="text-xs font-mono text-gray-400">{c.phone}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">{c.role}</span>
              </div>
              <button onClick={async () => { if(await useModalStore.getState().showConfirm('Confirmar', '¿Eliminar contacto?')) deleteContact.mutate(c.id) }} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
