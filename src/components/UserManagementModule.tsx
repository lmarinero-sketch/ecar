import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Shield, Edit, Trash2, X, Save, Search,
  CheckCircle2, AlertCircle, Mail, KeyRound, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ALL_MODULES, MODULE_LABELS } from '../lib/types';
import type { ModuleId } from '../lib/types';

type UserProfile = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'operario';
  allowed_modules: string[];
  created_at: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const UserManagementModule: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'operario'>('operario');
  const [formModules, setFormModules] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit state
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'operario'>('operario');
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Expanded module panels
  const [expandedModules, setExpandedModules] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', ECAR_TENANT_ID)
      .order('full_name');
    if (!error && data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const callManageUsers = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg(null);

    const result = await callManageUsers({
      action: 'create',
      email: formEmail,
      password: formPassword,
      fullName: formName,
      role: formRole,
      allowedModules: formRole === 'admin'
        ? ALL_MODULES as unknown as string[]
        : formModules,
    });

    if (result.error) {
      setFormMsg({ type: 'error', text: result.error });
    } else {
      setFormMsg({ type: 'success', text: `¡Usuario ${formName} creado exitosamente!` });
      setFormName(''); setFormEmail(''); setFormPassword(''); setFormRole('operario'); setFormModules([]);
      fetchUsers();
      setTimeout(() => { setShowCreateForm(false); setFormMsg(null); }, 1500);
    }
    setFormLoading(false);
  };

  const handleUpdate = async (profileId: string) => {
    setEditLoading(true);
    const result = await callManageUsers({
      action: 'update',
      profileId,
      role: editRole,
      fullName: editName,
      allowedModules: editRole === 'admin'
        ? ALL_MODULES as unknown as string[]
        : editModules,
    });
    if (!result.error) {
      fetchUsers();
      setEditingUser(null);
    }
    setEditLoading(false);
  };

  const handleDelete = async (profile: UserProfile) => {
    if (profile.auth_user_id === user?.id) {
      alert('No podés eliminar tu propia cuenta.');
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar al usuario ${profile.full_name} (${profile.email})?`)) return;

    await callManageUsers({
      action: 'delete',
      profileId: profile.id,
      authUserId: profile.auth_user_id,
    });
    fetchUsers();
  };

  const startEdit = (profile: UserProfile) => {
    setEditingUser(profile.id);
    setEditRole(profile.role);
    setEditModules(profile.allowed_modules || []);
    setEditName(profile.full_name);
  };

  const toggleFormModule = (moduleId: string) => {
    setFormModules(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleEditModule = (moduleId: string) => {
    setEditModules(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(u =>
      u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }, [users, searchTerm]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Shield size={64} className="text-gray-300 mb-4" />
        <h3 className="font-bold text-gray-700 text-lg mb-1">Acceso Restringido</h3>
        <p className="text-sm">Solo los administradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-600 rounded-xl p-4 md:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10">
          <Users size={80} className="md:w-[120px] md:h-[120px]" />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-xl md:text-2xl flex items-center gap-2">
            <Users size={20} className="md:w-6 md:h-6" /> Gestión de Usuarios
          </h3>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Crear, editar y asignar roles y permisos a los usuarios del sistema
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all"
          />
        </div>
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setFormMsg(null); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ecar-blue hover:bg-ecar-blueDark text-white rounded-xl text-sm font-bold shadow-sm transition-all"
        >
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <UserPlus size={18} className="text-ecar-blue" /> Crear Nuevo Usuario
          </h4>

          {formMsg && (
            <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${formMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {formMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {formMsg.text}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Nombre Completo</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block flex items-center gap-1"><Mail size={12} /> Email</label>
                <input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)}
                  placeholder="usuario@growlabs.lat"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block flex items-center gap-1"><KeyRound size={12} /> Contraseña</label>
                <input type="text" required minLength={6} value={formPassword} onChange={e => setFormPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Rol</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setFormRole('admin')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${formRole === 'admin' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  <Shield size={14} /> Admin (acceso total)
                </button>
                <button type="button" onClick={() => setFormRole('operario')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${formRole === 'operario' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  <Users size={14} /> Operario (módulos específicos)
                </button>
              </div>
            </div>

            {formRole === 'operario' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 block">Módulos Permitidos</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  {(ALL_MODULES as readonly string[]).filter(m => m !== 'user_management').map(moduleId => (
                    <button key={moduleId} type="button" onClick={() => toggleFormModule(moduleId)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${formModules.includes(moduleId) ? 'bg-ecar-blue/10 border-ecar-blue/30 text-ecar-blue' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      {MODULE_LABELS[moduleId as ModuleId]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-bold transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={formLoading}
                className="px-4 py-2 bg-ecar-blue hover:bg-ecar-blueDark text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5">
                {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Crear Usuario</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin mb-3" />
          <p className="text-sm">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm text-gray-400">
          <Users size={48} className="text-gray-300 mx-auto mb-3" />
          <h5 className="font-bold text-gray-700 text-sm">No se encontraron usuarios</h5>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(profile => {
            const isEditing = editingUser === profile.id;
            const isSelf = profile.auth_user_id === user?.id;

            return (
              <div key={profile.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${isEditing ? 'border-ecar-blue ring-2 ring-ecar-blue/10' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${profile.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-ecar-blue to-blue-600'}`}>
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-gray-800 text-sm">{profile.full_name}</h5>
                        {isSelf && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">TÚ</span>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profile.role === 'admin' ? 'text-amber-700 bg-amber-100' : 'text-blue-700 bg-blue-100'}`}>
                          {profile.role === 'admin' ? '🛡️ Admin' : '👤 Operario'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isEditing && (
                      <>
                        <button onClick={() => setExpandedModules(expandedModules === profile.id ? null : profile.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all">
                          {(profile.allowed_modules?.length || 0)} módulos
                          {expandedModules === profile.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <button onClick={() => startEdit(profile)}
                          className="p-2 text-gray-400 hover:text-ecar-blue hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar">
                          <Edit size={16} />
                        </button>
                        {!isSelf && (
                          <button onClick={() => handleDelete(profile)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button onClick={() => handleUpdate(profile.id)} disabled={editLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-ecar-blue hover:bg-ecar-blueDark text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                          {editLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                          Guardar
                        </button>
                        <button onClick={() => setEditingUser(null)}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-gray-100 bg-gray-50/50 space-y-3 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Nombre</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Rol</label>
                        <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin' | 'operario')}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all">
                          <option value="admin">🛡️ Admin (acceso total)</option>
                          <option value="operario">👤 Operario (módulos específicos)</option>
                        </select>
                      </div>
                    </div>
                    {editRole === 'operario' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600">Módulos Permitidos</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                          {(ALL_MODULES as readonly string[]).filter(m => m !== 'user_management').map(moduleId => (
                            <button key={moduleId} type="button" onClick={() => toggleEditModule(moduleId)}
                              className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${editModules.includes(moduleId) ? 'bg-ecar-blue/10 border-ecar-blue/30 text-ecar-blue' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                              {MODULE_LABELS[moduleId as ModuleId]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* View modules */}
                {!isEditing && expandedModules === profile.id && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-gray-100 bg-gray-50/50 pt-3">
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Módulos Habilitados</h6>
                    {profile.role === 'admin' ? (
                      <p className="text-xs text-amber-600 font-bold">🛡️ Acceso total a todos los módulos (Admin)</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(profile.allowed_modules || []).map((m: string) => (
                          <span key={m} className="text-[10px] font-bold text-ecar-blue bg-ecar-blue/10 px-2 py-1 rounded-md">
                            {MODULE_LABELS[m as ModuleId] || m}
                          </span>
                        ))}
                        {(!profile.allowed_modules || profile.allowed_modules.length === 0) && (
                          <p className="text-xs text-gray-400 italic">Sin módulos asignados</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 py-2">
        <span>{users.length} usuarios totales</span>
        <span>·</span>
        <span>{users.filter(u => u.role === 'admin').length} admin</span>
        <span>·</span>
        <span>{users.filter(u => u.role === 'operario').length} operarios</span>
      </div>
    </div>
  );
};
