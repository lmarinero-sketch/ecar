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
  { name: 'Relevamiento & Discovery', hrs: 30, fill: '#00D1FF' },
  { name: 'Arquitectura & Base de Datos', hrs: 40, fill: '#1E3A8A' },
  { name: 'Frontend Web & Móvil', hrs: 90, fill: '#00FF88' },
  { name: 'Implementación & Capacit.', hrs: 40, fill: '#FACC15' },
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
    <div className="min-h-screen bg-black text-[#9CA3AF] font-sans relative overflow-x-hidden">
      
      {/* Auric Background Lights */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#1E3A8A] opacity-15 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#065F46] opacity-15 blur-[120px] pointer-events-none z-0"></div>
      
      <ContractPDF />
      
      {/* Top Fixed Header with Link to Live Demo */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="bg-white/10 border border-white/10 rounded-lg p-1.5 h-10 flex items-center shrink-0">
              <img src="/logoECAR.png" alt="ECAR Logo" className="h-full w-auto object-contain brightness-0 invert" />
            </div>
            <div className="hidden sm:block h-6 w-px bg-white/20"></div>
            <span className="font-bold text-xs md:text-sm tracking-widest text-[#00FF88] uppercase">Propuesta Comercial</span>
          </div>
          <Link to="/" className="w-full sm:w-auto bg-[#00FF88] text-black px-6 py-2.5 rounded-full font-extrabold text-sm hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_25px_rgba(0,255,136,0.6)]">
            Ir al Simulador (Demo) <ArrowRight size={16}/>
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 md:px-6 py-8 md:py-12 space-y-8 md:space-y-12">
        
        {/* Cover Section */}
        <section className="bg-white/5 backdrop-blur-[12px] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-12 border border-white/10 relative overflow-hidden group hover:border-[#00FF88]/30 transition-all duration-500">
           <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.03] pointer-events-none text-white transition-opacity duration-500 group-hover:opacity-[0.05]">
             <Handshake size={200} className="md:w-[300px] md:h-[300px]" />
           </div>
           
           <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00D1FF]/10 text-[#00D1FF] rounded-full text-[10px] md:text-xs font-bold mb-6 md:mb-8 border border-[#00D1FF]/20 shadow-[0_0_10px_rgba(0,209,255,0.1)]">
                 <Rocket size={14} /> FASE 1: GESTIÓN DE CONSTRUCCIÓN E INFRAESTRUCTURA
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
                Propuesta Técnica y Comercial:<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D1FF] to-[#00FF88]">
                  Desarrollo de ERP Modular
                </span>
              </h1>
              
              <div className="flex flex-col gap-2 text-xs md:text-sm text-[#9CA3AF] mb-8 font-mono bg-black/20 p-4 rounded-xl border border-white/5 inline-block w-full sm:w-auto">
                <p><strong className="text-white">Atención:</strong> Gustavo Regalado</p>
                <p><strong className="text-white">De:</strong> Lucas Marinero – Grow Labs</p>
                <p><strong className="text-white">Fecha:</strong> 15 de abril de 2026</p>
              </div>

              {/* The "Real" Goal Notice */}
              <div className="bg-[#FACC15]/10 border-l-[3px] border-[#FACC15] p-5 md:p-6 rounded-r-xl md:rounded-r-2xl shadow-[0_4px_20px_rgba(250,204,21,0.05)]">
                 <h3 className="font-bold text-[#FACC15] text-base md:text-lg flex items-center gap-2 mb-3">
                   <Target className="text-[#FACC15]" /> Visión Estratégica a Largo Plazo
                 </h3>
                 <p className="text-[#FACC15]/80 leading-relaxed text-xs md:text-sm">
                   Esta propuesta contempla una tarifa ultra-preferencial, <strong className="text-white">por debajo del piso mínimo de mercado para un programador SSR/SR (30-40 USD/hora)</strong>. 
                   <br/><br/>
                   El objetivo real de Grow Labs no es obtener rentabilidad inmediata en esta primera fase, sino <strong className="text-white underline decoration-[#00FF88] decoration-2 underline-offset-4">sellar una alianza estratégica con Gustavo</strong>. El foco final es empaquetar este tremendo <i>know-how</i> y desarrollar la versión SaaS para facturarlo a múltiples empresas constructoras de la región de manera recurrente.
                 </p>
              </div>
           </div>
        </section>

        {/* 1. Introducción */}
        <section className="bg-white/5 backdrop-blur-[12px] rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-colors">
           <h2 className="text-xl md:text-2xl font-black text-white mb-4 flex items-center gap-3"><BrainCircuit className="text-[#00D1FF]"/> 1. Introducción y Visión del Proyecto</h2>
           <p className="text-sm md:text-base text-[#9CA3AF] leading-relaxed">
             La presente propuesta detalla el desarrollo de un sistema de gestión empresarial (ERP) diseñado específicamente para las necesidades operativas de la industria de la construcción, con una <strong className="text-white">arquitectura escalable que permita su futura comercialización como modelo SaaS</strong>. El objetivo central de esta primera fase es digitalizar el "know-how" de la empresa para optimizar la logística, el control de stock y la toma de decisiones basada en datos.
           </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          
          {/* 2. Alcance */}
          <section className="bg-white/5 backdrop-blur-[12px] rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col hover:border-white/20 transition-colors">
            <h2 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center gap-3"><Clock className="text-[#00FF88]"/> 2. Alcance (200 Horas)</h2>
            <div className="space-y-6 flex-1">
              <div className="flex gap-4">
                <CheckCircle2 className="text-[#00FF88] shrink-0 mt-0.5" size={24}/>
                <div>
                  <h4 className="font-bold text-white text-sm md:text-base mb-1">Relevamiento y Auditoría (Discovery)</h4>
                  <p className="text-xs md:text-sm text-[#9CA3AF]">Entrevistas directas para documentar 50 casos de uso logísticos estructurales. Traducción de procesos de obra a lógica de código.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-[#00FF88] shrink-0 mt-0.5" size={24}/>
                <div>
                  <h4 className="font-bold text-white text-sm md:text-base mb-1">Arquitectura de Datos y Backend</h4>
                  <p className="text-xs md:text-sm text-[#9CA3AF]">Diseño de BD relacional (dato único y trazable) y desarrollo de APIs seguras y asíncronas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-[#00FF88] shrink-0 mt-0.5" size={24}/>
                <div>
                  <h4 className="font-bold text-white text-sm md:text-base mb-1">Frontend (Web y PWA Móvil)</h4>
                  <p className="text-xs md:text-sm text-[#9CA3AF]">Creación de plataforma web intuitiva, PWA adaptada a celulares para reporte de campo y presentismo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-[#00FF88] shrink-0 mt-0.5" size={24}/>
                <div>
                  <h4 className="font-bold text-white text-sm md:text-base mb-1">Implementación y Capacitación</h4>
                  <p className="text-xs md:text-sm text-[#9CA3AF]">Puesta a punto y formación de usuarios finales en taller central y obra presencialmente.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Gráfico de Distribución */}
          <section className="bg-white/5 backdrop-blur-[12px] rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-colors">
             <h3 className="font-bold text-white mb-6 text-center text-sm md:text-base">Distribución de las 200 Horas Base</h3>
             <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={hoursDistribution} layout="vertical" margin={{top: 0, right: 10, left: -20, bottom: 0}}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff10" />
                     <XAxis type="number" fontSize={10} stroke="transparent" tick={{fill: '#9CA3AF'}} />
                     <YAxis dataKey="name" type="category" width={110} fontSize={10} fontWeight={600} stroke="transparent" tick={{fill: '#D1D5DB'}} />
                     <RechartsTooltip cursor={{fill: '#ffffff0a'}} contentStyle={{backgroundColor: '#000000', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff'}} itemStyle={{color: '#fff'}}/>
                     <Bar dataKey="hrs" name="Horas" radius={[0, 6, 6, 0]}>
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
          <h2 className="text-xl md:text-2xl font-black text-white mb-6 md:mb-8 flex items-center gap-3"><Presentation className="text-[#00D1FF]"/> 3. Módulos Core a Desarrollar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-[#00D1FF]/50 hover:-translate-y-1 transition-all duration-300 group">
               <div className="w-12 h-12 bg-[#00D1FF]/10 rounded-xl flex items-center justify-center mb-5 text-[#00D1FF] group-hover:scale-110 transition-transform"><Target size={24}/></div>
               <h3 className="font-bold text-white mb-3">Logística y Pañol</h3>
               <p className="text-xs text-[#9CA3AF] leading-relaxed">Gestión de ingresos/egresos, transferencias entre obras, control de herramientas críticas y alertas de stock mínimo.</p>
             </div>
             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-[#FACC15]/50 hover:-translate-y-1 transition-all duration-300 group">
               <div className="w-12 h-12 bg-[#FACC15]/10 rounded-xl flex items-center justify-center mb-5 text-[#FACC15] group-hover:scale-110 transition-transform"><Users size={24}/></div>
               <h3 className="font-bold text-white mb-3">Gestión de Obra</h3>
               <p className="text-xs text-[#9CA3AF] leading-relaxed">Creación de centros de costo por proyecto (WBS) y seguimiento de partes de avance diario desde el terreno.</p>
             </div>
             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-[#00FF88]/50 hover:-translate-y-1 transition-all duration-300 group">
               <div className="w-12 h-12 bg-[#00FF88]/10 rounded-xl flex items-center justify-center mb-5 text-[#00FF88] group-hover:scale-110 transition-transform"><FileSignature size={24}/></div>
               <h3 className="font-bold text-white mb-3">Proveedores & Compras</h3>
               <p className="text-xs text-[#9CA3AF] leading-relaxed">Registro de facturas, comparativa de precios y trazabilidad de materiales (desde el pedido hasta acopio en obra).</p>
             </div>
             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-[#FF3131]/50 hover:-translate-y-1 transition-all duration-300 group">
               <div className="w-12 h-12 bg-[#FF3131]/10 rounded-xl flex items-center justify-center mb-5 text-[#FF3131] group-hover:scale-110 transition-transform"><BarChart3 size={24}/></div>
               <h3 className="font-bold text-white mb-3">Dashboard BI</h3>
               <p className="text-xs text-[#9CA3AF] leading-relaxed">Tablero de control con indicadores de rentabilidad, desvíos presupuestarios y algoritmos de rendimiento.</p>
             </div>
          </div>
        </section>

        {/* Crecimiento / ROI Chart */}
        <section className="bg-white/5 backdrop-blur-[12px] rounded-3xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-colors">
           <h3 className="font-black text-white mb-2 text-center text-lg md:text-xl flex flex-col md:flex-row justify-center items-center gap-3">
             <LineChartIcon className="text-[#00FF88]"/> Proyección: Impacto de la Digitalización (6 Meses)
           </h3>
           <p className="text-center text-xs md:text-sm text-[#9CA3AF] mb-8">Métrica proyectada del ahogo operativo vs. horas hombre ahorradas</p>
           
           <div className="h-[250px] md:h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={roiData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                   <defs>
                     <linearGradient id="colorAhogo" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#FF3131" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#FF3131" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorAhorro" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#00FF88" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                   <RechartsTooltip contentStyle={{backgroundColor: '#000000', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff'}} itemStyle={{color: '#fff'}}/>
                   <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                   <Area type="monotone" dataKey="ahogoOperativo" name="Trabajo Manual (%)" stroke="#FF3131" strokeWidth={3} fillOpacity={1} fill="url(#colorAhogo)" />
                   <Area type="monotone" dataKey="tiempoAhorrado" name="Horas Ahorradas" stroke="#00FF88" strokeWidth={3} fillOpacity={1} fill="url(#colorAhorro)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* 4. Tech Stack & Security */}
        <section className="bg-white/5 backdrop-blur-[12px] rounded-3xl p-6 md:p-10 border border-white/10 relative overflow-hidden text-left">
           <h2 className="text-xl md:text-2xl font-black text-white mb-4 flex items-center gap-3"><Server className="text-[#00D1FF]"/> 4. Arquitectura Tecnológica y Seguridad</h2>
           <p className="text-sm text-[#9CA3AF] mb-10 leading-relaxed max-w-4xl">
             El código madre será íntegramente documentado y comentado con estándares profesionales. Esto garantiza que cualquier programador futuro pueda leer, escalar o auditar el software sin depender tecnológicamente de nosotros de manera abusiva (Vendor Lock-in).
           </p>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
             <div className="space-y-6">
               <h3 className="font-bold text-white border-b border-white/10 pb-3 mb-6 flex items-center gap-2">
                 <Code size={18} className="text-[#00D1FF]"/> Stack de Desarrollo (FASE 1)
               </h3>
               <div className="flex gap-4 items-start">
                 <div className="p-3 bg-[#00D1FF]/10 text-[#00D1FF] rounded-xl"><Code size={24}/></div>
                 <div>
                   <h4 className="font-bold text-sm md:text-base text-white font-mono">React + Vite + Tailwind CSS</h4>
                   <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">Framework Frontend. Interfaz ultra rápida e interacciones en tiempo real sin recargar la página local.</p>
                 </div>
               </div>
               <div className="flex gap-4 items-start">
                 <div className="p-3 bg-[#00FF88]/10 text-[#00FF88] rounded-xl"><Database size={24}/></div>
                 <div>
                   <h4 className="font-bold text-sm md:text-base text-white font-mono">Supabase (PostgreSQL)</h4>
                   <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">Base de datos relacional de nivel corporativo. Dato inmutable y trazable basado en la nube.</p>
                 </div>
               </div>
               <div className="flex gap-4 items-start">
                 <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><BrainCircuit size={24}/></div>
                 <div>
                   <h4 className="font-bold text-sm md:text-base text-white font-mono">OpenAI (Motor IA)</h4>
                   <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">Lógica de inteligencia subyacente para procesar reportes en lenguaje natural.</p>
                 </div>
               </div>
             </div>

             <div className="bg-black/40 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-inner">
               <h3 className="font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-3">
                 <Lock size={18} className="text-[#FACC15]"/> Ciberseguridad y Accesos
               </h3>
               <ul className="space-y-6">
                 <li className="flex gap-4 items-start">
                   <ShieldCheck className="text-[#00FF88] shrink-0 mt-0.5" size={20}/>
                   <p className="text-sm text-[#9CA3AF] leading-relaxed"><strong className="text-white">RBAC (Roles):</strong> El sistema segmentará rigurosamente qué ven y qué pueden editar los usuarios según su cargo jerárquico.</p>
                 </li>
                 <li className="flex gap-4 items-start">
                   <ShieldCheck className="text-[#FF3131] shrink-0 mt-0.5" size={20}/>
                   <p className="text-sm text-[#9CA3AF] leading-relaxed"><strong className="text-white">Seguridad Anti-Vulnerabilidades:</strong> Prácticas OWASP aplicadas: prevención de inyecciones SQL y comunicaciones encriptadas por TLS/SSL.</p>
                 </li>
               </ul>
             </div>
           </div>
        </section>

        {/* 5. Inversión y Forma de Pago */}
        <section className="bg-gradient-to-br from-[#1E3A8A]/30 to-[#000000] rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white relative overflow-hidden border border-[#1E3A8A]/50 shadow-[0_0_50px_rgba(30,58,138,0.2)]">
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
             
             <div>
               <h2 className="text-2xl md:text-3xl font-black mb-6 flex items-center gap-3"><DollarSign size={32} className="text-[#00FF88]"/> 5. Inversión y Plan</h2>
               <p className="text-[#9CA3AF] text-base md:text-lg mb-8 leading-relaxed">
                 Se define un valor de <strong className="text-black bg-[#00FF88] px-2.5 py-1 rounded-md font-mono text-sm shadow-[0_0_10px_rgba(0,255,136,0.5)]">A$ 25.000 / hora</strong> de desarrollo.<br/>
                 Inversión de <strong className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF88] to-[#00D1FF] text-3xl md:text-4xl font-black font-mono block mt-3">A$ 5.000.000</strong> (para esta primera etapa).
               </p>
               
               <div className="space-y-4">
                 <div className="bg-black/30 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                   <div className="flex justify-between items-end mb-2">
                     <span className="font-bold text-[#FACC15] text-sm md:text-base">Adelanto 50%</span>
                     <span className="font-mono text-xl md:text-2xl font-black text-white">$2.500.000</span>
                   </div>
                   <p className="text-xs text-[#9CA3AF]">Relevamiento, diseño arquitectónico y setup del entorno backend.</p>
                 </div>
                 
                 <div className="bg-black/30 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                   <div className="flex justify-between items-end mb-2">
                     <span className="font-bold text-[#00FF88] text-sm md:text-base">Contraentrega 50%</span>
                     <span className="font-mono text-xl md:text-2xl font-black text-white">$2.500.000</span>
                   </div>
                   <p className="text-xs text-[#9CA3AF]">Al finalizar sistema en producción tras éxito en pruebas de usuario (UAT).</p>
                 </div>
                 
                 <div className="mt-6 border-t border-white/10 pt-6">
                   <p className="text-xs text-[#9CA3AF] leading-relaxed">
                     <strong className="text-white">Modalidad Comercial:</strong> Se emitirá Factura A o B según corresponda. Recibimos todos los medios de pago (transferencia bancaria, eCheq, MercadoPago). Los pagos efectuados con tarjeta de crédito estarán sujetos a los intereses de financiación correspondientes.
                   </p>
                   <p className="text-[11px] text-[#9CA3AF] mt-4 leading-relaxed bg-[#1E3A8A]/20 p-4 rounded-xl border border-[#00D1FF]/20">
                     <strong className="text-[#00D1FF]">Aclaración sobre Servidores:</strong> Los honorarios de la presente propuesta cubren estrictamente la ingeniería de desarrollo de software. Los costos variables de terceros inherentes al despliegue en la nube (registro de dominios web, alojamiento/hosting, base de datos y consumo de tokens de Inteligencia Artificial) **corren por cuenta del Cliente** y se facturarán de manera externa o directamente a nombre del Cliente.
                   </p>
                 </div>
               </div>
             </div>

             <div className="bg-black/50 backdrop-blur-md rounded-3xl p-6 md:p-8 text-white border border-white/10 shadow-2xl relative overflow-hidden group hover:border-[#00D1FF]/50 transition-colors">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#00D1FF] opacity-10 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-lg md:text-xl font-black mb-6 flex items-center gap-3"><ShieldCheck className="text-[#00D1FF]"/> Garantía y Transparencia</h3>
                <p className="text-sm md:text-base text-[#9CA3AF] mb-8 leading-relaxed">
                  El desarrollo se realizará bajo metodologías ágiles, con <strong className="text-white">entregas parciales demostrables cada 15 días</strong>. Esto garantiza visibilidad total sobre el código y ajustes en tiempo real iterativos.
                </p>
                <div className="pt-6 border-t border-white/10 flex items-center gap-5">
                  <div className="w-16 h-16 bg-black rounded-full border border-white/20 overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] p-2">
                    <img src="/logogrow.png" alt="Grow Labs Logo" className="w-full h-full object-contain filter brightness-0 invert" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base md:text-lg">Lucas Marinero</h4>
                    <p className="text-xs md:text-sm text-[#9CA3AF] font-mono mt-1">Arquitecto de Software & Data Analyst</p>
                    <p className="text-[10px] text-[#00FF88] font-bold tracking-widest mt-1.5 uppercase">GROW LABS</p>
                  </div>
                </div>
             </div>

           </div>
        </section>

        {/* Legal Notice */}
        <div className="bg-black/60 border border-[#FACC15]/30 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-6 shadow-[0_0_30px_rgba(250,204,21,0.05)] relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
             <FileSignature size={150} />
           </div>
           
           <div className="bg-[#FACC15]/10 p-4 rounded-2xl shrink-0 border border-[#FACC15]/20">
              <FileSignature className="text-[#FACC15]" size={32} />
           </div>
           <div className="relative z-10 w-full flex-1">
             <h4 className="font-black text-white mb-2 text-lg md:text-xl">Acuerdo y Formalidad Legal de Inicio</h4>
             <p className="text-[#9CA3AF] leading-relaxed text-sm">
               Para dar inicio oficial al relevamiento y desarrollo del proyecto, es estrictamente necesario rubricar un <strong className="text-[#FACC15]">Contrato de Locación de Servicios de Software</strong>. En dicho documento formal se pactarán detalladamente las obligaciones, derechos, hitos de avance y responsabilidades mutuas.
             </p>
           </div>
           <div className="w-full md:w-auto shrink-0 relative z-10">
              <button
                onClick={downloadContract}
                disabled={isDownloading}
                className={`w-full md:w-auto bg-[#FACC15] text-black font-extrabold py-3.5 px-8 rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)] ${isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)]'}`}
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

