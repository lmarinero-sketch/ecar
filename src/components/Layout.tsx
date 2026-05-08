import React from 'react';
import { useAppStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Target, Landmark, Calculator, Users,
  Warehouse, Truck, FileSignature, Smartphone, ShoppingCart,
  Bell, FolderOpen, LogOut, Shield, Menu, X, DollarSign
} from 'lucide-react';
import type { ModuleId } from '../lib/types';
import { MODULE_LABELS } from '../lib/types';

const iconMap: Record<ModuleId, React.ElementType> = {
  bi: LayoutDashboard,
  liquidity: DollarSign,
  wbs: Target,
  invoicing: Calculator,
  purchases: ShoppingCart,
  finances: Landmark,
  obligations: Bell,
  rrhh: Users,
  logistics: Warehouse,
  fleet: Truck,
  certifications: FileSignature,
  field: Smartphone,
  documents: FolderOpen,
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen } = useAppStore();
  const { profile, signOut, hasModule, isAdmin } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-ecar-blueDark text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-64 bg-ecar-blueDark border-r border-[#08355e] flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 md:p-6 flex items-center justify-center border-b border-white/10 bg-white">
          <img src="/logoECAR.png" alt="ECAR Logo" className="h-10 w-auto object-contain" />
        </div>

        {/* User badge */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
              {profile?.full_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-blue-200 text-xs flex items-center gap-1">
                {isAdmin && <Shield size={10} />}
                {isAdmin ? 'Administrador' : 'Operario'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Dashboard */}
          {hasModule('bi') && (
            <SidebarItem id="bi" icon={iconMap.bi} label={MODULE_LABELS.bi} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />
          )}
          {hasModule('liquidity') && (
            <SidebarItem id="liquidity" icon={iconMap.liquidity} label={MODULE_LABELS.liquidity} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />
          )}

          {/* Grupo: Administración y Finanzas */}
          {(hasModule('purchases') || hasModule('finances') || hasModule('obligations') || hasModule('invoicing')) && (
            <div className="pt-3">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Administración y Finanzas</p>
              {hasModule('purchases') && <SidebarItem id="purchases" icon={iconMap.purchases} label="Compras & Libro IVA" active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('finances') && <SidebarItem id="finances" icon={iconMap.finances} label="Finanzas & Tesorería" active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('obligations') && <SidebarItem id="obligations" icon={iconMap.obligations} label="Alertas & Obligaciones" active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('invoicing') && <SidebarItem id="invoicing" icon={iconMap.invoicing} label="Facturación (ARCA)" active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
            </div>
          )}

          {/* Grupo: RRHH */}
          {hasModule('rrhh') && (
            <div className="pt-3">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Recursos Humanos</p>
              <SidebarItem id="rrhh" icon={iconMap.rrhh} label="RRHH & Legajos" active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />
            </div>
          )}

          {/* Grupo: Operaciones */}
          {(hasModule('wbs') || hasModule('logistics') || hasModule('fleet') || hasModule('certifications') || hasModule('field') || hasModule('documents')) && (
            <div className="pt-3">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Operaciones</p>
              {hasModule('wbs') && <SidebarItem id="wbs" icon={iconMap.wbs} label={MODULE_LABELS.wbs} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('logistics') && <SidebarItem id="logistics" icon={iconMap.logistics} label={MODULE_LABELS.logistics} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('fleet') && <SidebarItem id="fleet" icon={iconMap.fleet} label={MODULE_LABELS.fleet} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('certifications') && <SidebarItem id="certifications" icon={iconMap.certifications} label={MODULE_LABELS.certifications} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('field') && <SidebarItem id="field" icon={iconMap.field} label={MODULE_LABELS.field} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
              {hasModule('documents') && <SidebarItem id="documents" icon={iconMap.documents} label={MODULE_LABELS.documents} active={activeModule} onSelect={(id) => { setActiveModule(id); setSidebarOpen(false); }} />}
            </div>
          )}

          {/* Admin: User management */}
          {isAdmin && (
            <button
              onClick={() => { setActiveModule('bi' as ModuleId); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-yellow-200 hover:bg-white/5 hover:text-yellow-100 font-medium text-sm mt-4 border-t border-white/10 pt-4"
            >
              <Shield size={18} />
              Admin: Gestión de Roles
            </button>
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-200 hover:bg-red-500/10 hover:text-red-100 font-medium text-sm transition-all"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
          <div className="text-xs text-center text-blue-200/40 font-medium tracking-wide mt-2">
            SISTEMA CREADO POR GROW LABS
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto z-10 w-full">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-20">
          <h2 className="text-xl font-bold text-gray-900 ml-10 md:ml-0">
            {MODULE_LABELS[activeModule]}
          </h2>
          <div className="text-xs font-mono px-3 py-1 bg-gray-100 rounded-full text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Conectado
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

/* ───── Sidebar Item ───── */
const SidebarItem: React.FC<{
  id: ModuleId;
  icon: React.ElementType;
  label: string;
  active: ModuleId;
  onSelect: (id: ModuleId) => void;
}> = ({ id, icon: Icon, label, active, onSelect }) => {
  const isActive = active === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all font-medium text-sm text-left
        ${isActive
          ? 'bg-white/10 text-white ring-1 ring-white/20'
          : 'text-blue-100 hover:bg-white/5 hover:text-white'
        }`}
    >
      <Icon size={18} className={isActive ? 'text-white' : 'text-blue-300'} />
      {label}
    </button>
  );
};
