import React, { useState } from 'react';
import { FolderOpen, Plus, Send, FileText, Clock, CheckCircle, X } from 'lucide-react';
import { useDocumentRequests, useProjects } from '../hooks/useData';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';

export const DocumentsModule: React.FC = () => {
  const { data: requests = [], isLoading, refetch } = useDocumentRequests();
  const { data: projects = [] } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', requester_name: '', requester_email: '', project_id: '', notes: '' });

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    gathering: { icon: <Clock size={14} />, color: 'bg-yellow-100 text-yellow-700', label: 'Recopilando' },
    ready: { icon: <FileText size={14} />, color: 'bg-blue-100 text-blue-700', label: 'Listo' },
    sent: { icon: <Send size={14} />, color: 'bg-green-100 text-green-700', label: 'Enviado' },
    responded: { icon: <CheckCircle size={14} />, color: 'bg-gray-100 text-gray-700', label: 'Respondido' },
  };

  const handleCreate = async () => {
    await supabase.from('document_requests').insert({
      ...form,
      project_id: form.project_id || null,
      tenant_id: ECAR_TENANT_ID,
    });
    setShowForm(false);
    setForm({ title: '', requester_name: '', requester_email: '', project_id: '', notes: '' });
    refetch();
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando documentos...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blue to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><FolderOpen size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><FolderOpen size={24} /> Documentos & Correo</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Requerimientos de documentación, certificados fiscales, F931 y envío por email integrado.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nuevo Requerimiento
        </button>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nuevo Requerimiento</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <input placeholder="Título (ej: Documentación Obra Ruta 40)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Solicitante" value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Email" type="email" value={form.requester_email} onChange={e => setForm({ ...form, requester_email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Obra (opcional)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <textarea placeholder="Notas / Documentos requeridos" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
            <button onClick={handleCreate} disabled={!form.title} className="btn-primary w-full">Crear</button>
          </div>
        </div>
      )}

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin requerimientos de documentación</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const cfg = statusConfig[req.status] || statusConfig.gathering;
            return (
              <div key={req.id} className="light-card p-5 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{req.title}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {req.requester_name && <span>📧 {req.requester_name}</span>}
                      {req.requester_email && <span className="font-mono text-xs">{req.requester_email}</span>}
                    </div>
                    {req.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{req.notes}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
                  <span>Creado: {new Date(req.created_at).toLocaleDateString('es-AR')}</span>
                  {req.due_date && <span className="font-bold text-orange-500">Vence: {new Date(req.due_date).toLocaleDateString('es-AR')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
