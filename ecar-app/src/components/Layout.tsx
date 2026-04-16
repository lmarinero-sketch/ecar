import React from 'react';
import { useStore } from '../store/useStore';
import { LayoutDashboard, Target, Warehouse, Smartphone, Truck, FileSignature, Landmark, Calculator, Users } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeModule, setActiveModule } = useStore();

  const navItems = [
    { id: 'bi', label: 'Inicio', icon: LayoutDashboard },
    { id: 'wbs', label: 'Planificación WBS', icon: Target },
    { id: 'finances', label: 'Finanzas & Valores', icon: Landmark },
    { id: 'accounting', label: 'Contabilidad (ARCA)', icon: Calculator },
    { id: 'rrhh', label: 'RRHH y Convenios', icon: Users },
    { id: 'logistics', label: 'Acopios & Logística', icon: Warehouse },
    { id: 'fleet', label: 'Flota y Maquinaria', icon: Truck },
    { id: 'certifications', label: 'Certificaciones / ICC', icon: FileSignature },
    { id: 'field', label: 'Terreno / Parte Diario', icon: Smartphone },
  ] as const;

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar Desktop / Navbar Mobile */}
      <aside className="w-full md:w-64 bg-ecar-blueDark border-b md:border-b-0 border-r border-[#08355e] flex shrink-0 flex-col relative z-20 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('/sidebar-construction.png')] bg-cover bg-bottom mix-blend-overlay"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/40 to-transparent"></div>

        <div className="p-4 md:p-6 flex items-center justify-center border-b border-white/10 relative z-10 bg-white">
           <img src="/logoECAR.png" alt="ECAR Logo" className="h-10 w-auto object-contain hover:scale-105 transition-transform" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden relative z-10">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left whitespace-nowrap md:whitespace-normal
                ${activeModule === item.id 
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20' 
                  : 'text-blue-100 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon size={18} className={activeModule === item.id ? 'text-white' : 'text-blue-300'} />
              <span className="hidden sm:inline-block">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 hidden md:block relative z-10">
          <div className="text-xs text-center text-blue-200/50 font-medium tracking-wide">
            SISTEMA CREADO POR GROW LABS
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto z-10 w-full">
        {/* The faint background grid pattern */}
        <div className="bg-grid"></div>
        
        {/* Topbar for context */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-50">
           <h2 className="text-xl font-bold text-gray-900">
             {navItems.find(i => i.id === activeModule)?.label}
           </h2>
           <div className="text-xs font-mono px-3 py-1 bg-gray-100 rounded-full text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Conectado (San Juan)
           </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>

    </div>
  );
};
