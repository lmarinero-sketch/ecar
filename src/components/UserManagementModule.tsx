import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Shield, Edit, Trash2, X, Save, Search,
  CheckCircle2, AlertCircle, Mail, KeyRound, ChevronDown, ChevronUp,
  Eye, Pencil, Trash, Check, BookOpen,
} from 'lucide-react';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModalStore } from '../store/useModalStore';
import { ALL_MODULES, MODULE_LABELS } from '../lib/types';
import type { ModuleId, ModulePermission } from '../lib/types';

type UserProfile = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'colaborador';
  allowed_modules: string[];
  created_at: string;
};

type ModulePerms = Record<string, { read: boolean; write: boolean; delete: boolean }>;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ASSIGNABLE_MODULES = (ALL_MODULES as readonly string[]).filter(
  m => !['user_management', 'guide', 'manual', 'implementation'].includes(m)
);

function buildDefaultPerms(modules: string[], level: 'read' | 'full' | 'none' = 'read'): ModulePerms {
  const perms: ModulePerms = {};
  for (const m of modules) {
    perms[m] = {
      read: level !== 'none',
      write: level === 'full',
      delete: level === 'full',
    };
  }
  return perms;
}

export const UserManagementModule: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, ModulePermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'colaborador'>('colaborador');
  const [formPerms, setFormPerms] = useState<ModulePerms>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit state
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'colaborador'>('colaborador');
  const [editPerms, setEditPerms] = useState<ModulePerms>({});
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Expanded module panels
  const [expandedModules, setExpandedModules] = useState<string | null>(null);

  // Guide state
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(1);

  const generatedEmail = formUsername.trim()
    ? `${formUsername.trim().toLowerCase().replace(/\s+/g, '.')}@growlabs.com`
    : '';

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', ECAR_TENANT_ID)
      .order('full_name');
    if (!error && data) {
      const profiles = (data as UserProfile[]).filter(p =>
        p.email.endsWith('@growlabs.com') || p.email === 'lucasmmarinero@gmail.com'
      );
      setUsers(profiles);
      // Fetch permissions for all users
      const profileIds = profiles.map(p => p.id);
      if (profileIds.length > 0) {
        const { data: allPerms } = await supabase
          .from('user_module_permissions')
          .select('*')
          .in('profile_id', profileIds);
        const permsMap: Record<string, ModulePermission[]> = {};
        for (const p of (allPerms || []) as ModulePermission[]) {
          if (!permsMap[p.profile_id]) permsMap[p.profile_id] = [];
          permsMap[p.profile_id].push(p);
        }
        setUserPermissions(permsMap);
      }
    }
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

    const activeModules = formRole === 'admin'
      ? ALL_MODULES as unknown as string[]
      : Object.entries(formPerms).filter(([, p]) => p.read || p.write || p.delete).map(([m]) => m);

    const permissions = formRole === 'admin' ? undefined : formPerms;

    const result = await callManageUsers({
      action: 'create',
      email: generatedEmail,
      password: formPassword,
      fullName: formName,
      role: formRole,
      allowedModules: activeModules,
      permissions,
    });

    if (result.error) {
      setFormMsg({ type: 'error', text: result.error });
    } else {
      setFormMsg({ type: 'success', text: `¡Usuario ${formName} creado exitosamente! (${generatedEmail})` });
      setFormName(''); setFormUsername(''); setFormPassword(''); setFormRole('colaborador'); setFormPerms({});
      fetchUsers();
      setTimeout(() => { setShowCreateForm(false); setFormMsg(null); }, 2000);
    }
    setFormLoading(false);
  };

  const handleUpdate = async (profileId: string) => {
    setEditLoading(true);
    const activeModules = editRole === 'admin'
      ? ALL_MODULES as unknown as string[]
      : Object.entries(editPerms).filter(([, p]) => p.read || p.write || p.delete).map(([m]) => m);

    const permissions = editRole === 'admin' ? undefined : editPerms;

    const result = await callManageUsers({
      action: 'update',
      profileId,
      role: editRole,
      fullName: editName,
      allowedModules: activeModules,
      permissions,
    });
    if (!result.error) {
      fetchUsers();
      setEditingUser(null);
    }
    setEditLoading(false);
  };

  const handleDelete = async (profile: UserProfile) => {
    if (profile.auth_user_id === user?.id) {
      useModalStore.getState().showAlert('Aviso', 'No podés eliminar tu propia cuenta.');
      return;
    }
    if (!await useModalStore.getState().showConfirm('Confirmar', `¿Estás seguro de eliminar al usuario ${profile.full_name} (${profile.email})?`)) return;

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
    setEditName(profile.full_name);
    // Build perms from stored permissions
    const storedPerms = userPermissions[profile.id] || [];
    const perms: ModulePerms = {};
    for (const m of profile.allowed_modules || []) {
      const sp = storedPerms.find(p => p.module_id === m);
      perms[m] = sp
        ? { read: sp.can_read, write: sp.can_write, delete: sp.can_delete }
        : { read: true, write: false, delete: false };
    }
    setEditPerms(perms);
  };

  const toggleFormPerm = (moduleId: string, level: 'read' | 'write' | 'delete') => {
    setFormPerms(prev => {
      const current = prev[moduleId] || { read: false, write: false, delete: false };
      const updated = { ...current };
      if (level === 'read') {
        updated.read = !updated.read;
        if (!updated.read) { updated.write = false; updated.delete = false; }
      } else if (level === 'write') {
        updated.write = !updated.write;
        if (updated.write) updated.read = true;
      } else {
        updated.delete = !updated.delete;
        if (updated.delete) { updated.read = true; updated.write = true; }
      }
      return { ...prev, [moduleId]: updated };
    });
  };

  const toggleEditPerm = (moduleId: string, level: 'read' | 'write' | 'delete') => {
    setEditPerms(prev => {
      const current = prev[moduleId] || { read: false, write: false, delete: false };
      const updated = { ...current };
      if (level === 'read') {
        updated.read = !updated.read;
        if (!updated.read) { updated.write = false; updated.delete = false; }
      } else if (level === 'write') {
        updated.write = !updated.write;
        if (updated.write) updated.read = true;
      } else {
        updated.delete = !updated.delete;
        if (updated.delete) { updated.read = true; updated.write = true; }
      }
      return { ...prev, [moduleId]: updated };
    });
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

      {/* Guide / Manual de Uso */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ecar-blue/10 flex items-center justify-center text-ecar-blue shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">📖 Guía de Ayuda: ¿Cómo gestionar usuarios y permisos?</h4>
              <p className="text-xs text-gray-500 mt-0.5">Aprendé a crear usuarios @growlabs.com, asignar roles y configurar permisos por módulo</p>
            </div>
          </div>
          <div className="text-gray-400">
            {showGuide ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {showGuide && (
          <div className="p-4 md:p-6 border-t border-gray-100 bg-white">
            {/* Step selection tabs */}
            <div className="flex flex-wrap gap-2 mb-5 pb-3 border-b border-gray-100">
              {[
                { step: 1, label: '1. Crear Usuario' },
                { step: 2, label: '2. Seleccionar Rol' },
                { step: 3, label: '3. Grilla de Permisos' },
                { step: 4, label: '4. Administrar Lista' }
              ].map(item => (
                <button
                  key={item.step}
                  onClick={() => setGuideStep(item.step)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${guideStep === item.step ? 'bg-ecar-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Step Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Text explanations */}
              <div className="lg:col-span-5 space-y-4">
                {guideStep === 1 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-ecar-blue bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Paso 1: Creación del Usuario</span>
                    <h5 className="font-bold text-gray-800 text-lg">Hacer clic en "Nuevo Usuario"</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Presioná el botón <strong>"Nuevo Usuario"</strong> en la barra de herramientas para desplegar el formulario de registro.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                      <p className="font-bold flex items-center gap-1">📧 Autocompletado de Correo:</p>
                      <p className="leading-relaxed">
                        El sistema generará de forma automática el correo institucional agregando el dominio <code>@growlabs.com</code> al nombre de usuario que ingreses. Por ejemplo, al escribir <code>ezequiel</code> se creará <code>ezequiel@growlabs.com</code>.
                      </p>
                    </div>
                  </div>
                )}

                {guideStep === 2 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Paso 2: Definir el Rol</span>
                    <h5 className="font-bold text-gray-800 text-lg">Administrador vs Colaborador</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Elegí el nivel de jerarquía global que tendrá el usuario dentro del sistema:
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                        <strong className="text-amber-800 flex items-center gap-1"><Shield size={12} />🛡️ Admin (Administrador)</strong>
                        <p className="text-gray-600 mt-1">Acceso total e irrestricto. Puede ver, editar, borrar datos en cualquier módulo, y gestionar usuarios.</p>
                      </div>
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                        <strong className="text-blue-800 flex items-center gap-1"><Users size={12} />👤 Colaborador</strong>
                        <p className="text-gray-600 mt-1">Acceso granular y restringido. Solo podrá ver los módulos asignados y con el nivel de acción específico configurado en el siguiente paso.</p>
                      </div>
                    </div>
                  </div>
                )}

                {guideStep === 3 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Paso 3: Grilla de Permisos</span>
                    <h5 className="font-bold text-gray-800 text-lg">Configurar accesos por módulo</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Si el usuario es <strong>Colaborador</strong>, asigná sus permisos módulo por módulo usando la grilla interactiva:
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0 mt-0.5">Ver</span>
                        <p className="text-gray-600 leading-relaxed">Permite ingresar al módulo y consultar sus registros (Lectura).</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">Edit</span>
                        <p className="text-gray-600 leading-relaxed">Permite crear nuevos registros y modificar los existentes (Escritura).</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0 mt-0.5">Bor</span>
                        <p className="text-gray-600 leading-relaxed">Permite eliminar registros del sistema permanentemente.</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800">
                      <strong>💡 Nota de Jerarquía:</strong> Activar "Borrar" activa automáticamente "Editar" y "Ver". Activar "Editar" activa automáticamente "Ver".
                    </div>
                  </div>
                )}

                {guideStep === 4 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Paso 4: Administrar la Lista</span>
                    <h5 className="font-bold text-gray-800 text-lg">Modificar o Dar de Baja usuarios</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      En el panel inferior tenés la lista completa de todos los usuarios registrados en tu organización:
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-gray-400 font-bold">Módulos:</span>
                        <p className="text-gray-600">Hacé clic en <strong>"[X] módulos"</strong> para desplegar y verificar el detalle de accesos del usuario sin entrar a editar.</p>
                      </div>
                      <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-ecar-blue font-bold">Lápiz (Editar):</span>
                        <p className="text-gray-600">Abre el editor rápido para renombrar al usuario, cambiar su rol o re-configurar sus permisos en la grilla.</p>
                      </div>
                      <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-red-500 font-bold">Tacho (Eliminar):</span>
                        <p className="text-gray-600">Elimina de forma permanente la cuenta de usuario y revoca todos sus accesos inmediatamente.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step Image */}
              <div className="lg:col-span-7 bg-slate-100 rounded-xl p-3 border border-gray-200 shadow-inner flex items-center justify-center overflow-hidden">
                <div className="relative w-full max-h-[380px] flex items-center justify-center">
                  {guideStep === 1 && (
                    <img
                      src="/guias/user_form_empty.png"
                      alt="Formulario de creación vacío"
                      className="rounded-lg object-contain max-h-[350px] shadow-md hover:scale-[1.01] transition-transform duration-300"
                    />
                  )}
                  {guideStep === 2 && (
                    <img
                      src="/guias/user_form_filled.png"
                      alt="Formulario de creación con datos"
                      className="rounded-lg object-contain max-h-[350px] shadow-md hover:scale-[1.01] transition-transform duration-300"
                    />
                  )}
                  {guideStep === 3 && (
                    <img
                      src="/guias/user_permissions_read_only.png"
                      alt="Grilla de permisos para Colaborador"
                      className="rounded-lg object-contain max-h-[350px] shadow-md hover:scale-[1.01] transition-transform duration-300"
                    />
                  )}
                  {guideStep === 4 && (
                    <img
                      src="/guias/user_management_list.png"
                      alt="Lista de usuarios y acciones"
                      className="rounded-lg object-contain max-h-[350px] shadow-md hover:scale-[1.01] transition-transform duration-300"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4">
              <button
                disabled={guideStep === 1}
                onClick={() => setGuideStep(prev => prev - 1)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:hover:text-gray-500 flex items-center gap-1 transition-all border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="text-xs text-gray-400 font-semibold">Paso {guideStep} de 4</span>
              <button
                disabled={guideStep === 4}
                onClick={() => setGuideStep(prev => prev + 1)}
                className="px-4 py-2 text-xs font-bold text-white bg-ecar-blue hover:bg-ecar-blueDark disabled:opacity-40 disabled:hover:bg-ecar-blue flex items-center gap-1 transition-all rounded-xl shadow-sm"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
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
                  placeholder="Ej: Ezequiel López"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block flex items-center gap-1"><Mail size={12} /> Usuario</label>
                <div className="relative">
                  <input type="text" required value={formUsername} onChange={e => setFormUsername(e.target.value)}
                    placeholder="ezequiel"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all pr-[140px]" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">@growlabs.com</span>
                </div>
                {generatedEmail && (
                  <p className="text-[10px] text-ecar-blue font-mono mt-0.5">→ {generatedEmail}</p>
                )}
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
                <button type="button" onClick={() => setFormRole('colaborador')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${formRole === 'colaborador' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  <Users size={14} /> Colaborador (permisos específicos)
                </button>
              </div>
            </div>

            {formRole === 'colaborador' && (
              <PermissionsGrid
                perms={formPerms}
                onToggle={toggleFormPerm}
                onSetAll={(level) => setFormPerms(buildDefaultPerms(ASSIGNABLE_MODULES as unknown as string[], level))}
              />
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-bold transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={formLoading || !formUsername.trim()}
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
            const storedPerms = userPermissions[profile.id] || [];

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
                          {profile.role === 'admin' ? '🛡️ Admin' : '👤 Colaborador'}
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
                        <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin' | 'colaborador')}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all">
                          <option value="admin">🛡️ Admin (acceso total)</option>
                          <option value="colaborador">👤 Colaborador (permisos específicos)</option>
                        </select>
                      </div>
                    </div>
                    {editRole === 'colaborador' && (
                      <PermissionsGrid
                        perms={editPerms}
                        onToggle={toggleEditPerm}
                        onSetAll={(level) => setEditPerms(buildDefaultPerms(ASSIGNABLE_MODULES as unknown as string[], level))}
                      />
                    )}
                  </div>
                )}

                {/* View modules & permissions */}
                {!isEditing && expandedModules === profile.id && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-gray-100 bg-gray-50/50 pt-3">
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Módulos y Permisos</h6>
                    {profile.role === 'admin' ? (
                      <p className="text-xs text-amber-600 font-bold">🛡️ Acceso total a todos los módulos (Admin)</p>
                    ) : (
                      <div className="space-y-1">
                        {(profile.allowed_modules || []).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin módulos asignados</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {(profile.allowed_modules || []).map((m: string) => {
                              const sp = storedPerms.find(p => p.module_id === m);
                              return (
                                <div key={m} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 border border-gray-100">
                                  <span className="text-xs font-medium text-gray-700">{MODULE_LABELS[m as ModuleId] || m}</span>
                                  <div className="flex items-center gap-2">
                                    {(!sp || sp.can_read) && (
                                      <span className="text-[10px] font-bold text-blue-500 flex items-center gap-0.5"><Eye size={10} /> Ver</span>
                                    )}
                                    {sp?.can_write && (
                                      <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5"><Pencil size={10} /> Editar</span>
                                    )}
                                    {sp?.can_delete && (
                                      <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5"><Trash size={10} /> Borrar</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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
        <span>{users.filter(u => u.role === 'colaborador').length} colaboradores</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  PERMISSIONS GRID COMPONENT                                     */
/* ═══════════════════════════════════════════════════════════════ */

const PermissionsGrid: React.FC<{
  perms: ModulePerms;
  onToggle: (moduleId: string, level: 'read' | 'write' | 'delete') => void;
  onSetAll: (level: 'read' | 'full' | 'none') => void;
}> = ({ perms, onToggle, onSetAll }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-600">Permisos por Módulo</label>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onSetAll('none')}
            className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-all">
            Ninguno
          </button>
          <button type="button" onClick={() => onSetAll('read')}
            className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-all">
            Solo Lectura
          </button>
          <button type="button" onClick={() => onSetAll('full')}
            className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-all">
            Acceso Total
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_60px_60px_60px] md:grid-cols-[1fr_80px_80px_80px] gap-0 bg-gray-100 border-b border-gray-200 px-3 py-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Módulo</span>
          <span className="text-[10px] font-bold text-blue-500 uppercase text-center flex items-center justify-center gap-1"><Eye size={10} /> Ver</span>
          <span className="text-[10px] font-bold text-emerald-500 uppercase text-center flex items-center justify-center gap-1"><Pencil size={10} /> Editar</span>
          <span className="text-[10px] font-bold text-red-500 uppercase text-center flex items-center justify-center gap-1"><Trash size={10} /> Borrar</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
          {ASSIGNABLE_MODULES.map(moduleId => {
            const p = perms[moduleId] || { read: false, write: false, delete: false };
            return (
              <div key={moduleId} className={`grid grid-cols-[1fr_60px_60px_60px] md:grid-cols-[1fr_80px_80px_80px] gap-0 px-3 py-2 items-center hover:bg-white transition-colors ${p.read ? 'bg-white' : ''}`}>
                <span className={`text-xs font-medium truncate ${p.read ? 'text-gray-800' : 'text-gray-400'}`}>
                  {MODULE_LABELS[moduleId as ModuleId]}
                </span>
                <div className="flex justify-center">
                  <button type="button" onClick={() => onToggle(moduleId, 'read')}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${p.read ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 hover:border-blue-300'}`}>
                    {p.read && <Check size={12} strokeWidth={3} />}
                  </button>
                </div>
                <div className="flex justify-center">
                  <button type="button" onClick={() => onToggle(moduleId, 'write')}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${p.write ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-300'} ${!p.read ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={!p.read}>
                    {p.write && <Check size={12} strokeWidth={3} />}
                  </button>
                </div>
                <div className="flex justify-center">
                  <button type="button" onClick={() => onToggle(moduleId, 'delete')}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${p.delete ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 hover:border-red-300'} ${!p.write ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={!p.write}>
                    {p.delete && <Check size={12} strokeWidth={3} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
