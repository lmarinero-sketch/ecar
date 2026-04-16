import React from 'react';
import { useStore } from '../store/useStore';
import { LayoutDashboard, Target, Warehouse, Smartphone, Truck, FileSignature, Landmark, Calculator, Users, Info } from 'lucide-react';

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

  const moduleDescriptions: Record<string, string> = {
    'bi': 'Dashboard Ejecutivo (BI): Visualiza métricas como la rentabilidad de las obras y KPIs en tiempo real. En un entorno real, cruza datos de bancos, facturación contable y gastos logísticos de manera automática.',
    'wbs': 'Planificación WBS: Desglosa líneas de costos presupuestados contra los devengados. Permite frenar Órdenes de Compra (Hard-Stops) si exceden el límite de presupuesto preventivo parametrizado.',
    'finances': 'Finanzas y Valores: Administración de Cartera de eCheqs y físicos. En producción, se enlazan APIs bancarias (Macro, Santander) para leer acreditaciones y rechazos en la cuenta corriente automáticamente.',
    'accounting': 'Módulo Contable ARCA: Control y facturación electrónica. Listo para homologar web services de AFIP y generar Libro IVA o cruzar padrón de Retenciones IIBB de los subcontratistas.',
    'rrhh': 'Gestión de Personal UOCRA: Fichas de nómina con sus categorías. Escalable a integraciones con relojes biométricos, huellas o reconocimiento facial en el ingreso del campamento de obra.',
    'logistics': 'Acopios y Logística: Control estricto de bodega. Diseñado para autorizar salidas escaneando QR desde el celular, reduciendo mermas y cruzando el gasto contra la línea WBS del proyecto de destino.',
    'fleet': 'Flota y Taller: Asignación de camiones y grúas pesadas. Adaptable para cruzar horas máquina leyendo sensores GPS/IoT e integrando el gasto de combustible por litraje mensual.',
    'certifications': 'Certificaciones (RPI/ICC): Cálculos de avance de obra y redeterminación de precios usando el Índice CAC en automático. Evita errores humanos de excel durante licitaciones públicas.',
    'field': 'Parte Diario en Terreno: Interfaz pensada para que el capataz, desde su celular, cargue presentismo, firme novedades y envíe fotografías del avance real de la obra sin utilizar papel.'
  };

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

        <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10 pb-[180px] md:pb-[140px]">
          {children}
        </div>
        
        {/* Global Demo Disclaimer Banner */}
        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 z-50 bg-white/95 backdrop-blur-md border-t border-blue-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
           <div className="max-w-7xl mx-auto flex items-start md:items-center gap-4">
             <div className="bg-ecar-blue/10 p-3 rounded-full shrink-0 flex items-center justify-center">
               <Info size={24} className="text-ecar-blue" />
             </div>
             <div className="flex-1">
               <h4 className="text-sm font-black tracking-wide text-gray-900 mb-1 flex items-center gap-2">
                 Versión Demostrativa — <span className="text-ecar-red">Módulo Actual: {navItems.find(i => i.id === activeModule)?.label}</span>
               </h4>
               <p className="text-xs text-gray-700 leading-relaxed font-medium">
                 {moduleDescriptions[activeModule] || 'Módulo bajo configuración.'}
                 <br className="hidden md:block"/>
                 <strong className="text-ecar-blue">Aclaración importante:</strong> Este software es una maqueta (Mock-up). Todos los procesos, interfaces y lógicas pueden ser adaptados al 100% y reconstruidos para comportarse de la forma exacta en que su empresa lo requiere.
               </p>
             </div>
           </div>
        </div>
      </main>

    </div>
  );
};
