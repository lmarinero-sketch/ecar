import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, ModuleId, ModulePermission, PermissionLevel } from '../lib/types';
import type { User, Session } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  permissions: ModulePermission[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  hasModule: (moduleId: ModuleId) => boolean;
  hasPermission: (moduleId: ModuleId, level: PermissionLevel) => boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single();
    if (data) {
      const p = data as Profile;
      setProfile(p);
      // Fetch granular permissions for non-admin users
      if (p.role !== 'admin') {
        const { data: perms } = await supabase
          .from('user_module_permissions')
          .select('*')
          .eq('profile_id', p.id);
        setPermissions((perms || []) as ModulePermission[]);
      } else {
        setPermissions([]);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Profile creation is handled by a DB trigger on auth.users INSERT
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPermissions([]);
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  const isAdmin = profile?.role === 'admin';

  const hasModule = (moduleId: ModuleId): boolean => {
    if (!profile) return false;
    if (isAdmin) return true; // Admin has access to everything
    return (profile.allowed_modules as string[]).includes(moduleId);
  };

  const hasPermission = (moduleId: ModuleId, level: PermissionLevel): boolean => {
    if (!profile) return false;
    if (isAdmin) return true; // Admin has full permissions on everything
    // First check if user has the module at all
    if (!(profile.allowed_modules as string[]).includes(moduleId)) return false;
    // Find granular permission for this module
    const perm = permissions.find(p => p.module_id === moduleId);
    if (!perm) return level === 'read'; // Default: read-only if module is allowed
    switch (level) {
      case 'read': return perm.can_read;
      case 'write': return perm.can_write;
      case 'delete': return perm.can_delete;
      default: return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, permissions, loading, signIn, signUp, signOut, changePassword, hasModule, hasPermission, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
