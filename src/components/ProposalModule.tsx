import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Target, Rocket, CheckCircle2, DollarSign, Clock, ArrowRight, BrainCircuit, BarChart3, Presentation, Users, FileSignature, LineChart as LineChartIcon, ShieldCheck, Database, Code, Lock, Server } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ContractPDF } from './ContractPDF';

const roiData = [
  { month: 'Mes 1', ahogoOperativo: 100, tiempoAhorrado: 5 },
  { month: 'Mes 2', ahogoOperativo: 80, tiempoAhorrado: 25 },
  { month: 'Mes 3', ahogoOperativo: 50, tiempoAhorrado: 60 },
  { month: 'Mes 4', ahogoOperativo: 30, tiempoAhorrado: 85 },
  { month: 'Mes 5', ahogoOperativo: 15, tiempoAhorrado: 95 },
  { month: 'Mes 6', ahogoOperativo: 5, tiempoAhorrado: 120 },
];

const hoursDistribution = [
  { name: 'Relevamiento & Discovery', hrs: 30, fill: '#3b82f6' },
  { name: 'Arquitectura & Base de Datos', hrs: 40, fill: '#14b8a6' },
  { name: 'Frontend Web & Móvil', hrs: 90, fill: '#8b5cf6' },
  { name: 'Implementación & Capacit.', hrs: 40, fill: '#f59e0b' },
];

export const ProposalModule: React.FC = () => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadContract = async () => {
    setIsDownloading(true);
    const container = document.getElementById('contract-pdf-wrapper');
    if (!container) {
      setIsDownloading(false);
      return;
    }
    
    try {
      container.style.position = 'static';
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pages = document.querySelectorAll('.pdf-page');
      
      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        if (i < pages.length - 1) {
          pdf.addPage();
        }
      }
      
      pdf.save('Contrato_GrowLabs_ECAR.pdf');
      
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <ContractPDF />
      
      {/* Top Fixed Header with Link to Live Demo */}
      <div className="bg-ecar-blueDark text-white sticky top-0 z-50 shadow-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="bg-white rounded p-1.5 h-10 flex items-center shadow-sm">
              <img src="/logoECAR.png" alt="ECAR Logo" className="h-full w-auto object-contain mix-blend-multiply" />
            </div>
            <div className="hidden sm:block h-6 w-px bg-white/20"></div>
            <span className="font-medium text-xs md:text-sm tracking-widest text-blue-200 uppercase">Propuesta Comercial</span>
          </div>
          <Link to="/" className="w-full sm:w-auto bg-[#00FF88] text-black px-6 py-2.5 rounded font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)]">
            Ir al Simulador (Demo) <ArrowRight size={16}/>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-8 md:py-12 space-y-8 md:space-y-12">
        
        {/* Cover Section */}
        <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-12 shadow-xl border border-gray-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none">
             <Handshake size={200} className="w-48 h-48 md:w-64 md:h-64" />
           </div>
           
           <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] md:text-xs font-bold mb-6 border border-blue-200">
                 <Rocket size={14} /> FASE 1: GESTIÓN DE CONSTRUCCIÓN E INFRAESTRUCTURA
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
                Propuesta Técnica y Comercial:<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-500">
                  Desarrollo de ERP Modular
                </span>
              </h1>
              
              <div className="flex flex-col gap-2 text-xs md:text-sm text-gray-500 mb-8 font-medium">
                <p><strong>Atención:</strong> Gustavo Regalado</p>
                <p><strong>De:</strong> Lucas Marinero – Grow Labs</p>
                <p><strong>Fecha:</strong> 15 de abril de 2026</p>
              </div>

              {/* The "Real" Goal Notice */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-[3px] border-amber-500 p-5 md:p-6 rounded-r-xl md:rounded-r-2xl">
                 <h3 className="font-bold text-amber-900 text-base md:text-lg flex items-center gap-2 mb-2">
                   <Target className="text-amber-600" /> Visión Estratégica a Largo Plazo
                 </h3>
                 <p className="text-amber-800/80 leading-relaxed text-xs md:text-sm">
                   Esta propuesta contempla una tarifa ultra-preferencial, <strong>por debajo del piso mínimo de mercado para un programador SSR/SR (30-40 USD/hora)</strong>. 
                   <br/><br/>
                   El objetivo real de Grow Labs no es obtener rentabilidad inmediata en esta primera fase, sino <strong>sellar una alianza estratégica (Sociedad Conjunta) con Gustavo</strong>. El foco final es empaquetar este tremendo <i>know-how</i> y desarrollar la versión SaaS para facturarlo a múltiples empresas constructoras de la región de manera recurrente.
                 </p>
              </div>
           </div>
        </section>

        {/* 1. Introducción */}
        <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative">
           <h2 className="text-xl md:text-2xl font-bold text-ecar-blue mb-4 flex items-center gap-2"><BrainCircuit /> 1. Introducción y Visión del Proyecto</h2>
           <p className="text-sm md:text-base text-gray-600 leading-relaxed">
             La presente propuesta detalla el desarrollo de un sistema de gestión empresarial (ERP) diseñado específicamente para las necesidades operativas de la industria de la construcción, con una <strong>arquitectura escalable que permita su futura comercialización como modelo SaaS</strong>. El objetivo central de esta primera fase es digitalizar el "know-how" de la empresa para optimizar la logística, el control de stock y la toma de decisiones basada en datos.
           </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          
          {/* 2. Alcance */}
          <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold text-ecar-blue mb-6 flex items-center gap-2"><Clock /> 2. Alcance (200 Horas)</h2>
            <div className="space-y-4 md:space-y-6 flex-1">
              <div className="flex gap-4">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20}/>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm md:text-base mb-1">Relevamiento y Auditoría (Discovery)</h4>
                  <p className="text-xs md:text-sm text-gray-500">Entrevistas directas para documentar 50 casos de uso logísticos estructurales. Traducción de procesos de obra a lógica de código.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20}/>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm md:text-base mb-1">Arquitectura de Datos y Backend</h4>
                  <p className="text-xs md:text-sm text-gray-500">Diseño de BD relacional (dato único y trazable) y desarrollo de APIs seguras y asíncronas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20}/>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm md:text-base mb-1">Frontend (Web y PWA Móvil)</h4>
                  <p className="text-xs md:text-sm text-gray-500">Creación de plataforma web intuitiva, PWA adaptada a celulares para reporte de campo y presentismo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20}/>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm md:text-base mb-1">Implementación y Capacitación</h4>
                  <p className="text-xs md:text-sm text-gray-500">Puesta a punto y formación de usuarios finales en taller central y obra presencialmente.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Gráfico de Distribución */}
          <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-6 text-center text-sm md:text-base">Distribución de las 200 Horas Base</h3>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={hoursDistribution} layout="vertical" margin={{top: 0, right: 10, left: -20, bottom: 0}}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                     <XAxis type="number" fontSize={10} />
                     <YAxis dataKey="name" type="category" width={110} fontSize={10} fontWeight={600} tick={{fill: '#4B5563'}} />
                     <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                     <Bar dataKey="hrs" name="Horas" radius={[0, 4, 4, 0]}>
                       {hoursDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                     </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </section>
        </div>

        {/* 3. Módulos Core */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-ecar-blue mb-6 flex items-center gap-2"><Presentation /> 3. Módulos Core a Desarrollar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
             <div className="bg-white p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600"><Target/></div>
               <h3 className="font-bold text-gray-800 mb-2">Logística y Pañol</h3>
               <p className="text-xs text-gray-500 leading-relaxed">Gestión de ingresos/egresos, transferencias entre obras, control de herramientas críticas y alertas de stock mínimo automáticas.</p>
             </div>
             <div className="bg-white p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600"><Users/></div>
               <h3 className="font-bold text-gray-800 mb-2">Gestión de Obra</h3>
               <p className="text-xs text-gray-500 leading-relaxed">Creación de centros de costo por proyecto (WBS) y seguimiento de partes de avance diario desde el terreno.</p>
             </div>
             <div className="bg-white p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600"><FileSignature/></div>
               <h3 className="font-bold text-gray-800 mb-2">Proveedores & Compras</h3>
               <p className="text-xs text-gray-500 leading-relaxed">Registro de facturas, comparativa de precios y trazabilidad de materiales (desde el pedido hasta el acopio en obra).</p>
             </div>
             <div className="bg-white p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-orange-600"><BarChart3/></div>
               <h3 className="font-bold text-gray-800 mb-2">Dashboard BI</h3>
               <p className="text-xs text-gray-500 leading-relaxed">Tablero de control con indicadores de rentabilidad, desvíos presupuestarios y algoritmos de rendimiento de recursos de máquina.</p>
             </div>
          </div>
        </section>

        {/* Crecimiento / ROI Chart */}
        <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
           <h3 className="font-bold text-gray-900 mb-2 text-center text-lg md:text-xl flex flex-col md:flex-row justify-center items-center gap-2">
             <LineChartIcon className="text-green-500 hidden md:block"/> Proyección: Impacto de la Digitalización (6 Meses)
           </h3>
           <p className="text-center text-xs md:text-sm text-gray-500 mb-6">Métrica proyectada del ahogo operativo vs. horas hombre ahorradas</p>
           
           <div className="h-[250px] md:h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={roiData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                   <defs>
                     <linearGradient id="colorAhogo" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorAhorro" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                   <Legend verticalAlign="top" height={36}/>
                   <Area type="monotone" dataKey="ahogoOperativo" name="Trabajo Manual (%)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAhogo)" />
                   <Area type="monotone" dataKey="tiempoAhorrado" name="Horas Ahorradas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAhorro)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* 4. Tech Stack & Security */}
        <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden text-left">
           <h2 className="text-xl md:text-2xl font-bold text-ecar-blue mb-2 flex items-center gap-2"><Server /> 4. Arquitectura Tecnológica y Seguridad</h2>
           <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-4xl">
             El código madre será íntegramente documentado y comentado con estándares profesionales. Esto garantiza que cualquier programador futuro pueda leer, escalar o auditar el software sin depender tecnológicamente de nosotros de manera abusiva (Vendor Lock-in).
           </p>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
             <div className="space-y-4 md:space-y-6">
               <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Stack de Desarrollo (FASE 1)</h3>
               <div className="flex gap-4 items-start">
                 <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl"><Code size={20}/></div>
                 <div>
                   <h4 className="font-bold text-sm md:text-base text-gray-800">React + Vite + Tailwind CSS</h4>
                   <p className="text-xs md:text-sm text-gray-500 mt-1">Framework Frontend. Interfaz ultra rápida e interacciones en tiempo real sin recargar la página local.</p>
                 </div>
               </div>
               <div className="flex gap-4 items-start">
                 <div className="p-2 md:p-3 bg-green-50 text-green-600 rounded-lg md:rounded-xl"><Database size={20}/></div>
                 <div>
                   <h4 className="font-bold text-sm md:text-base text-gray-800">Supabase (PostgreSQL)</h4>
                   <p className="text-xs md:text-sm text-gray-500 mt-1">Base de datos relacional de nivel corporativo. Dato inmutable y trazable basado en la nube.</p>
                 </div>
               </div>
               <div className="flex gap-4 items-start">
                 <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-lg md:rounded-xl"><BrainCircuit size={20}/></div>
                 <div>
                   <h4 className="font-bold text-sm md:text-base text-gray-800">OpenAI (Motor IA)</h4>
                   <p className="text-xs md:text-sm text-gray-500 mt-1">Lógica de inteligencia subyacente para procesar reportes en lenguaje natural.</p>
                 </div>
               </div>
             </div>

             <div className="bg-slate-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100">
               <h3 className="font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 border-b border-slate-200 pb-2"><Lock size={18} className="text-slate-600"/> Ciberseguridad y Accesos</h3>
               <ul className="space-y-4 md:space-y-6">
                 <li className="flex gap-3 md:gap-4 items-start">
                   <ShieldCheck className="text-ecar-blue shrink-0 mt-0.5" size={16}/>
                   <p className="text-sm text-gray-700 leading-relaxed"><strong>RBAC (Roles):</strong> El sistema segmentará rigurosamente qué ven y qué pueden editar los usuarios según su cargo jerárquico.</p>
                 </li>
                 <li className="flex gap-3 md:gap-4 items-start">
                   <ShieldCheck className="text-ecar-blue shrink-0 mt-0.5" size={16}/>
                   <p className="text-sm text-gray-700 leading-relaxed"><strong>Seguridad Anti-Vulnerabilidades:</strong> Prácticas OWASP aplicadas: prevención de inyecciones SQL y comunicaciones encriptadas por TLS/SSL.</p>
                 </li>
               </ul>
             </div>
           </div>
        </section>

        {/* 5. Inversión y Forma de Pago */}
        <section className="bg-ecar-blueDark rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-900/50 pointer-events-none"></div>
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">
             
             <div>
               <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2"><DollarSign size={32} className="text-green-400"/> 5. Inversión y Plan</h2>
               <p className="text-blue-100 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
                 Se define un valor de <strong className="text-white bg-blue-800/50 px-2.5 py-1 rounded-md text-sm md:text-base">A$ 25.000 / hora</strong> de desarrollo.<br/>
                 Inversión de <strong className="text-white text-3xl md:text-4xl font-bold font-mono block mt-3 text-green-400">A$ 5.000.000</strong> (para esta primera etapa).
               </p>
               
               <div className="space-y-4">
                 <div className="bg-white/10 p-5 rounded-xl border border-white/20 backdrop-blur-sm">
                   <div className="flex justify-between items-end mb-2">
                     <span className="font-bold text-blue-50 text-sm md:text-base">Adelanto 50%</span>
                     <span className="font-mono text-xl md:text-2xl font-black text-white">$2.500.000</span>
                   </div>
                   <p className="text-xs text-blue-200">Relevamiento, diseño arquitectónico y setup del entorno backend.</p>
                 </div>
                 
                 <div className="bg-white/10 p-5 rounded-xl border border-white/20 backdrop-blur-sm">
                   <div className="flex justify-between items-end mb-2">
                     <span className="font-bold text-blue-50 text-sm md:text-base">Contraentrega 50%</span>
                     <span className="font-mono text-xl md:text-2xl font-black text-white">$2.500.000</span>
                   </div>
                   <p className="text-xs text-blue-200">Al finalizar sistema en producción tras éxito en pruebas de usuario (UAT).</p>
                 </div>
                 
                 <div className="mt-6 border-t border-white/20 pt-6">
                   <p className="text-xs text-blue-100 leading-relaxed">
                     <strong className="text-white">Modalidad Comercial:</strong> Se emitirá Factura A o B según corresponda. Recibimos todos los medios de pago (transferencia bancaria, eCheq, MercadoPago). Los pagos efectuados con tarjeta de crédito estarán sujetos a los intereses de financiación correspondientes.
                   </p>
                   <p className="text-xs text-blue-200 mt-4 leading-relaxed bg-black/20 p-4 rounded-xl border border-black/10">
                     <strong className="text-white">Aclaración sobre Servidores:</strong> Los honorarios de la presente propuesta cubren estrictamente la ingeniería de desarrollo de software. Los costos variables de terceros inherentes al despliegue en la nube (registro de dominios web, alojamiento/hosting, base de datos y consumo de tokens de Inteligencia Artificial) **corren por cuenta del Cliente (Gustavo)** y a su nombre.
                   </p>
                 </div>
               </div>
             </div>

             <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 text-gray-800 shadow-xl border border-gray-100 relative overflow-hidden">
                <h3 className="text-lg md:text-xl font-black mb-6 flex items-center gap-2 text-ecar-blue"><ShieldCheck className="text-ecar-red"/> Garantía y Transparencia</h3>
                <p className="text-sm md:text-base text-gray-600 mb-8 leading-relaxed">
                  El desarrollo se realizará bajo metodologías ágiles, con <strong>entregas parciales demostrables cada 15 días</strong>. Esto garantiza visibilidad total sobre el código y ajustes en tiempo real iterativos.
                </p>
                <div className="pt-6 border-t border-gray-200 flex items-center gap-5">
                  <div className="w-16 h-16 bg-white rounded-full border-2 border-ecar-blue overflow-hidden flex items-center justify-center shadow-md p-1.5">
                    <img src="/logogrow.png" alt="Grow Labs Logo" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base md:text-lg">Lucas Marinero</h4>
                    <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">Arquitecto de Software & Data Analyst</p>
                    <p className="text-[10px] text-ecar-blue font-bold tracking-widest mt-1.5 uppercase">GROW LABS</p>
                  </div>
                </div>
             </div>

           </div>
        </section>

        {/* Legal Notice */}
        <div className="bg-orange-50 border border-orange-200 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <FileSignature size={150} />
           </div>
           
           <div className="bg-orange-100 p-4 rounded-xl shrink-0">
              <FileSignature className="text-orange-600" size={32} />
           </div>
           <div className="relative z-10 w-full flex-1">
             <h4 className="font-bold text-orange-950 mb-2 text-lg md:text-xl">Acuerdo y Formalidad Legal de Inicio</h4>
             <p className="text-orange-900/80 leading-relaxed font-medium text-sm md:text-base">
               Para dar inicio oficial al relevamiento y desarrollo del proyecto, es estrictamente necesario rubricar un <strong>Contrato de Locación de Servicios de Software</strong>. En dicho documento formal se pactarán detalladamente las obligaciones, derechos de propiedad intelectual, hitos de avance y responsabilidades mutuas.
             </p>
           </div>
           <div className="w-full md:w-auto shrink-0 relative z-10">
              <button
                onClick={downloadContract}
                disabled={isDownloading}
                className={`w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md ${isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg'}`}
              >
                <FileSignature size={20} />
                {isDownloading ? 'Generando PDF...' : 'Descargar Contrato'}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
