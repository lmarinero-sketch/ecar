import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Target, Landmark, Calculator, Users,
  Warehouse, Truck, FileSignature, Smartphone, ShoppingCart,
  Bell, FolderOpen, LogOut, Shield, Menu, X, DollarSign, Package,
  Calendar, ShoppingBag, ShieldAlert, ClipboardCheck, MessageSquareText, Wallet,
  PanelLeftClose, PanelLeftOpen, Search, ChevronRight, HardHat, Fuel,  Rocket,
  GraduationCap, KeyRound, Save, CheckCircle2, AlertCircle, Banknote,
  Activity, BookOpen, FileText, PieChart, Mail
} from 'lucide-react';
import type { ModuleId } from '../lib/types';
import { MODULE_LABELS } from '../lib/types';
import { TutorialPanel } from './TutorialPanel';
import { GlobalModal } from './GlobalModal';
import { UserProfileModal } from './UserProfileModal';
import { GlobalOnboarding } from './onboarding/GlobalOnboarding';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { HelpCircle } from 'lucide-react';

/* ─── Icon map ─── */
const iconMap: Record<ModuleId, React.ElementType> = {
  bi: LayoutDashboard, liquidity: DollarSign, monthly_report: Calendar,
  wbs: Target, invoicing: Calculator, purchases: ShoppingCart,
  purchase_requests: ShoppingBag, purchase_orders: FileSignature,
  finances: Landmark, obligations: Bell,
  rrhh: Users, inventory: Package, logistics: Warehouse,
  fleet: Truck, certifications: FileSignature, field: Smartphone,
  safety: ShieldAlert, inspections: ClipboardCheck, rfi: MessageSquareText,
  expenses: Wallet, documents: FolderOpen, project_budget: HardHat,
  opportunities: Target, fuel: Fuel, budget_landing: HardHat,
  payments: Banknote,
  nonconformities: ShieldAlert,
  supplier_eval: ClipboardCheck,
  guide: BookOpen, manual: FileText,
  implementation: Rocket, user_management: Users, user_activity: Activity,
  communications: Mail,
  weekly_report: PieChart,
};

/* ─── Short labels for collapsed tooltips ─── */
const SHORT_LABELS: Record<ModuleId, string> = {
  bi: 'Dashboard', liquidity: 'Liquidez', monthly_report: 'Mensual',
  wbs: 'Planificación', invoicing: 'ARCA', purchases: 'Compras',
  purchase_requests: 'Pedidos', purchase_orders: 'OC / OT',
  finances: 'Finanzas', obligations: 'Alertas',
  rrhh: 'RRHH', inventory: 'Inventario', logistics: 'Acopios',
  fleet: 'Flota', certifications: 'Certificaciones', field: 'Parte Diario',
  safety: 'Seguridad', inspections: 'Calidad', rfi: 'Consultas',
  expenses: 'Gastos', documents: 'Documentos', project_budget: 'Presupuestos',
  opportunities: 'Pipeline', fuel: 'Combustible', budget_landing: 'Introducción GPP',
  payments: 'Pagos',
  nonconformities: 'No Conf.',
  supplier_eval: 'Eval. Prov.',
  guide: 'Guía', manual: 'Manual ISO',
  implementation: 'Implementación', user_management: 'Usuarios', user_activity: 'Actividad',
  communications: 'Comunicaciones',
  weekly_report: 'Reporte GG',
};

/* ─── Module accent colors for active indicator ─── */
const MODULE_ACCENT: Partial<Record<ModuleId, string>> = {
  bi: 'bg-ecar-blue',
  liquidity: 'bg-emerald-500',
  purchases: 'bg-ecar-blue', purchase_orders: 'bg-ecar-blue',
  finances: 'bg-emerald-500', obligations: 'bg-amber-500',
  invoicing: 'bg-blue-500', monthly_report: 'bg-ecar-blue', expenses: 'bg-orange-500',
  rrhh: 'bg-ecar-blue',
  wbs: 'bg-ecar-blue', inventory: 'bg-ecar-blue', purchase_requests: 'bg-ecar-blue',
  logistics: 'bg-slate-500', fleet: 'bg-sky-500', certifications: 'bg-lime-600',
  field: 'bg-yellow-500', safety: 'bg-red-500', inspections: 'bg-pink-500',
  rfi: 'bg-rose-500', documents: 'bg-slate-400', project_budget: 'bg-ecar-blue',
  opportunities: 'bg-blue-600', fuel: 'bg-sky-600', budget_landing: 'bg-slate-700',
  payments: 'text-emerald-500 bg-emerald-50',
  nonconformities: 'bg-red-600',
  supplier_eval: 'bg-ecar-blue',
  guide: 'text-emerald-500 bg-emerald-50', manual: 'text-ecar-blue bg-slate-50',
  implementation: 'text-amber-500 bg-amber-50', user_management: 'text-slate-500 bg-slate-50', user_activity: 'text-blue-500 bg-blue-50',
  communications: 'text-sky-500 bg-sky-50',
  weekly_report: 'text-ecar-blue bg-slate-50',
};

/* ─── Sidebar sections ─── */
export type SidebarSection = { label: string; emoji: string; items: { id: ModuleId; requires?: boolean }[] };

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: '', emoji: '',
    items: [
      { id: 'bi', requires: true },
      { id: 'liquidity', requires: true },
      { id: 'guide' },
      { id: 'manual' },
      { id: 'implementation' },
      { id: 'weekly_report' },
    ],
  },
  {
    label: 'Ger. Presupuestos', emoji: '📐',
    items: [
      { id: 'budget_landing', requires: true },
      { id: 'opportunities', requires: true },
      { id: 'project_budget', requires: true },
    ],
  },
  {
    label: 'Ger. Compras', emoji: '🛒',
    items: [
      { id: 'purchases', requires: true },
      { id: 'purchase_requests' },
      { id: 'purchase_orders', requires: true },
      { id: 'supplier_eval', requires: true },
    ],
  },
  {
    label: 'Ger. Logística', emoji: '📦',
    items: [
      { id: 'logistics', requires: true },
      { id: 'fleet', requires: true },
      { id: 'inventory', requires: true },
    ],
  },
  {
    label: 'Ger. Obra', emoji: '🏗️',
    items: [
      { id: 'wbs', requires: true },
      { id: 'field', requires: true },
      { id: 'safety', requires: true },
      { id: 'inspections', requires: true },
      { id: 'rfi', requires: true },
      { id: 'nonconformities', requires: true },
      { id: 'documents', requires: true },
    ],
  },
  {
    label: 'Ger. Adm. y Finanzas', emoji: '💼',
    items: [
      { id: 'finances', requires: true },
      { id: 'obligations', requires: true },
      { id: 'certifications', requires: true },
      { id: 'expenses', requires: true },
      { id: 'payments', requires: true },
    ],
  },
  {
    label: 'Ger. RRHH', emoji: '👥',
    items: [
      { id: 'rrhh', requires: true },
    ],
  },
  {
    label: 'Comunicaciones', emoji: '💬',
    items: [
      { id: 'communications', requires: true },
    ],
  },
  {
    label: 'Sistema', emoji: '⚙️',
    items: [
      { id: 'user_management' as ModuleId, requires: false },
      { id: 'user_activity' as ModuleId, requires: false },
    ],
  },
];

/* ════════════════════════════════════════════════════════════ */
/*                          LAYOUT                             */
/* ════════════════════════════════════════════════════════════ */
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen, tutorialMode, setTutorialMode } = useAppStore();
  const { profile, signOut, changePassword, hasModule, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [contentKey, setContentKey] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const prevModule = useRef(activeModule);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const { startTour } = useOnboardingStore();

  // Trigger content animation on module change
  useEffect(() => {
    if (prevModule.current !== activeModule) {
      setContentKey(k => k + 1);
      prevModule.current = activeModule;
    }
    
    // Auto-expand the section containing the active module
    const activeSectionIndex = SIDEBAR_SECTIONS.findIndex(s => (s.items || []).some(i => i.id === activeModule));
    if (activeSectionIndex !== -1) {
      setExpandedSections(prev => ({ ...prev, [activeSectionIndex]: true }));
    }
  }, [activeModule]);

  const handleSelect = (id: ModuleId) => {
    setActiveModule(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-surface-secondary flex-col md:flex-row overflow-hidden">

      {/* ─── Mobile hamburger ─── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3.5 left-3.5 z-50 bg-white text-slate-700 p-2 rounded-xl shadow-lg border border-slate-200/80 active:scale-95 transition-transform"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40
        ${expanded ? 'w-[240px]' : 'w-[68px]'}
        bg-white border-r border-slate-200/80 flex flex-col shrink-0 overflow-hidden
        transition-all duration-300 ease-smooth
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-[1px_0_0_0_rgba(0,0,0,0.02)]
      `}>

        {/* ── Logo area ── */}
        <div className={`h-[56px] flex items-center ${expanded ? 'px-4 justify-between' : 'justify-center'} border-b border-slate-100 shrink-0`}>
          {expanded ? (
            <>
              <div className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-full bg-white ring-1 ring-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)] group-hover:shadow-[0_2px_12px_rgba(17,92,156,0.15)] group-hover:ring-ecar-blue/30 transition-all duration-300 overflow-hidden flex items-center justify-center p-[3px]">
                  <img src="/logoECAR.png" alt="ECAR" className="w-full h-full object-contain rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold text-sm tracking-tight leading-none">ECAR</span>
                  <span className="text-slate-400 text-[9px] font-medium tracking-wider uppercase">ERP Sistema</span>
                </div>
              </div>
              <button
                id="btn-collapse-sidebar"
                onClick={() => setExpanded(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
                title="Colapsar sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="group"
              title="Expandir sidebar"
            >
              <div className="w-9 h-9 rounded-full bg-white ring-1 ring-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)] group-hover:shadow-[0_2px_12px_rgba(17,92,156,0.15)] group-hover:ring-ecar-blue/30 group-hover:scale-105 transition-all duration-300 overflow-hidden flex items-center justify-center p-[3px]">
                <img src="/logoECAR.png" alt="ECAR" className="w-full h-full object-contain rounded-full" />
              </div>
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="flex-1 overflow-y-auto py-2 sidebar-scrollbar">
          {SIDEBAR_SECTIONS.map((section, si) => {
            const visibleItems = (section.items || []).filter(
              item => {
                // user_management and user_activity are admin-only
                if (item.id === 'user_management' || item.id === 'user_activity') return isAdmin;
                return !item.requires || hasModule(item.id);
              }
            );
            if (!visibleItems.length) return null;

            return (
              <div key={si} className={si > 0 ? 'mt-1' : ''}>
                {/* Section divider/label */}
                {section.label && expanded && (
                  <div className="mx-2 mt-3 mb-1">
                    <button 
                      onClick={() => setExpandedSections(prev => ({ ...prev, [si]: !prev[si] }))}
                      className="w-full flex items-center justify-between px-3 py-[6px] bg-ecar-blue/90 hover:bg-ecar-blue transition-colors rounded-md group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] opacity-80">{section.emoji}</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{section.label}</span>
                      </div>
                      <ChevronRight size={12} className={`text-white/70 group-hover:text-white transition-transform duration-200 ${expandedSections[si] ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                )}
                {section.label && !expanded && (
                  <div className="mx-3 my-2 border-t-2 border-ecar-blue/30" />
                )}

                {(!section.label || expandedSections[si] || !expanded) && (
                  <div className={expanded ? 'px-2 space-y-0.5' : 'px-1.5 space-y-0.5'}>
                    {visibleItems.map((item, idx) => (
                      <SidebarItem
                        key={item.id}
                        id={item.id}
                        icon={iconMap[item.id]}
                        active={activeModule}
                        expanded={expanded}
                        onSelect={handleSelect}
                        delay={idx * 20}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className={`border-t border-slate-100 ${expanded ? 'p-3' : 'p-2'}`}>
          {/* Expand toggle (collapsed) */}
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all mb-2"
              title="Expandir"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          {/* User info */}
          <div 
            onClick={() => setShowProfileModal(true)}
            className={`flex items-center ${expanded ? 'gap-2.5 px-1.5' : 'justify-center'} mb-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors`}
            title="Mi Perfil"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ecar-blue/10 to-ecar-blue/20 flex items-center justify-center text-ecar-blue text-[11px] font-bold shrink-0 ring-1 ring-ecar-blue/10">
              {profile?.full_name?.charAt(0) || '?'}
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-xs font-semibold truncate">{profile?.full_name}</p>
                <p className="text-slate-400 text-[10px] flex items-center gap-1 font-medium">
                  {isAdmin && <Shield size={9} className="text-amber-500" />}
                  {isAdmin ? 'Admin' : 'Colaborador'}
                </p>
              </div>
            )}
          </div>

          {/* Change Password */}
          <button
            onClick={() => { setShowPasswordModal(true); setNewPassword(''); setConfirmPassword(''); setPasswordMsg(null); }}
            className={`flex items-center ${expanded ? 'gap-2 px-2.5 w-full' : 'justify-center w-full'} py-2 rounded-lg text-slate-400 hover:text-ecar-blue hover:bg-blue-50 transition-all text-xs font-medium mb-0.5`}
            title="Cambiar contraseña"
          >
            <KeyRound size={15} />
            {expanded && <span>Cambiar Contraseña</span>}
          </button>

          {/* Logout */}
          <button
            onClick={signOut}
            className={`flex items-center ${expanded ? 'gap-2 px-2.5 w-full' : 'justify-center w-full'} py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-medium`}
            title="Cerrar sesión"
          >
            <LogOut size={15} />
            {expanded && <span>Cerrar Sesión</span>}
          </button>

          {expanded && (
            <p className="text-[8px] text-slate-300 text-center mt-2 font-semibold tracking-[0.15em] uppercase">
              Grow Labs
            </p>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 relative overflow-y-auto z-10 w-full">
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-6 py-2.5 flex justify-between items-center z-20">
          <div className="flex items-center gap-2 ml-10 md:ml-0">
            {/* Module breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 font-medium hidden sm:inline">ECAR</span>
              <ChevronRight size={12} className="text-slate-300 hidden sm:block" />
              <h2 className="font-semibold text-slate-900 tracking-tight">
                {MODULE_LABELS[activeModule]}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search bar */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-400 border border-slate-200/60 hover:border-slate-300 hover:bg-white transition-all cursor-pointer min-w-[180px] group">
              <Search size={13} className="text-slate-400 group-hover:text-slate-500 transition-colors" />
              <span className="group-hover:text-slate-500 transition-colors">Buscar...</span>
              <kbd className="ml-auto text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-slate-400 shadow-[0_1px_0_rgba(0,0,0,0.04)]">⌘K</kbd>
            </div>

            {/* Tour toggle */}
            <button
              onClick={() => startTour(activeModule)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all bg-slate-50 text-slate-500 border-slate-200/80 hover:bg-slate-100 hover:text-ecar-blue"
              title="Ver Guía del Módulo"
            >
              <HelpCircle size={13} />
              <span className="hidden sm:inline">Guía</span>
            </button>

            {/* Tutorial toggle */}
            <button
              onClick={() => setTutorialMode(!tutorialMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all ${
                tutorialMode
                  ? 'bg-ecar-blue text-white border-ecar-blue shadow-md'
                  : 'bg-blue-50 text-blue-600 border-blue-100/80 hover:bg-blue-100'
              }`}
              title="Modo Tutorial"
            >
              <GraduationCap size={13} />
              <span className="hidden sm:inline">Tutorial</span>
            </button>

            {/* Connection status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
              <span className="text-[10px] text-emerald-600 font-semibold hidden sm:inline">Conectado</span>
            </div>
          </div>
        </header>

        {/* Content with entrance animation */}
        <div key={contentKey} className="p-4 md:p-6 w-full h-full animate-fade-in flex flex-col">
          {children}
        </div>
      </main>

      {/* Tutorial Panel */}
      <TutorialPanel />

      {/* Global Onboarding Tour */}
      <GlobalOnboarding activeModule={activeModule} />

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <KeyRound size={18} className="text-ecar-blue" />
                </div>
                <h3 className="font-bold text-gray-800">Cambiar Contraseña</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>

            {passwordMsg && (
              <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${passwordMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {passwordMsg.text}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue transition-all"
              />
            </div>

            <button
              disabled={passwordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              onClick={async () => {
                setPasswordLoading(true);
                setPasswordMsg(null);
                const result = await changePassword(newPassword);
                if (result.error) {
                  setPasswordMsg({ type: 'error', text: result.error });
                } else {
                  setPasswordMsg({ type: 'success', text: '¡Contraseña actualizada exitosamente!' });
                  setNewPassword('');
                  setConfirmPassword('');
                  setTimeout(() => setShowPasswordModal(false), 1500);
                }
                setPasswordLoading(false);
              }}
              className="btn-primary w-full py-2.5"
            >
              {passwordLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} /> Guardar Contraseña
                </>
              )}
            </button>

            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-[10px] text-amber-600">La contraseña debe tener al menos 6 caracteres</p>
            )}
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {/* Global Modals */}
      <GlobalModal />
    </div>
  );
};

/* ═══════════════════════════════════════════════ */
/*               SIDEBAR ITEM                      */
/* ═══════════════════════════════════════════════ */
const SidebarItem: React.FC<{
  id: ModuleId;
  icon: React.ElementType;
  active: ModuleId;
  expanded: boolean;
  onSelect: (id: ModuleId) => void;
  delay?: number;
}> = ({ id, icon: Icon, active, expanded, onSelect, delay: _delay = 0 }) => {
  const isActive = active === id;
  const accent = MODULE_ACCENT[id] || 'bg-ecar-blue';

  return (
    <button
      onClick={() => onSelect(id)}
      className={`
        group relative flex items-center w-full transition-all duration-200 ease-smooth
        ${expanded
          ? 'gap-2.5 px-3 py-[9px] rounded-lg text-left'
          : 'justify-center py-2.5 rounded-lg mx-auto'
        }
        ${isActive
          ? 'bg-ecar-blueLight text-ecar-blue shadow-[0_1px_3px_rgba(17,92,156,0.06)]'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }
      `}
      title={expanded ? undefined : SHORT_LABELS[id]}
    >
      {/* Active accent bar */}
      {isActive && (
        <span className={`absolute ${expanded ? 'left-0 w-[3px] h-5 rounded-r-full' : 'left-1 w-[3px] h-4 rounded-full'} top-1/2 -translate-y-1/2 ${accent} transition-all duration-300`} />
      )}

      <Icon
        size={expanded ? 16 : 18}
        className={`shrink-0 transition-all duration-200 ${
          isActive
            ? 'text-ecar-blue'
            : 'text-slate-400 group-hover:text-slate-600'
        }`}
        strokeWidth={isActive ? 2.2 : 1.8}
      />

      {expanded ? (
        <span className={`text-[13px] font-medium truncate transition-colors duration-200 whitespace-nowrap ${
          isActive ? 'text-ecar-blue font-semibold' : ''
        }`}>
          {SHORT_LABELS[id]}
        </span>
      ) : (
        <>
          {/* Active dot for collapsed */}
          {isActive && (
            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${accent}`} />
          )}
          {/* Tooltip (collapsed) */}
          <span className="tooltip-bubble left-full ml-3">
            {SHORT_LABELS[id]}
          </span>
        </>
      )}
    </button>
  );
};
