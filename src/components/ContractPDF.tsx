import React from 'react';

export const ContractPDF: React.FC = () => {
  return (
    <div id="contract-pdf-content" className="bg-white text-black p-12 max-w-[800px] w-[800px] font-sans mx-auto text-sm" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-ecar-blue pb-4">
        <div>
           <img src="/logogrow.png" alt="Grow Labs" className="h-12 w-auto invert" />
        </div>
        <div className="text-right">
           <h1 className="text-xl font-black text-gray-900 tracking-tight">CONTRATO DE LOCACIÓN</h1>
           <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Servicios de Hardware y Software</p>
        </div>
      </div>

      {/* Intro */}
      <p className="text-justify mb-6 leading-relaxed">
        Entre <strong>GROW LABS</strong> (en adelante "El Desarrollador"), representado por <strong>Lucas Marinero (DNI: 37.298.023)</strong>, y por la otra parte el Sr. <strong>Gustavo Regalado</strong> en representación de su entidad (en adelante "El Cliente"), convienen celebrar el presente contrato de locación de servicios sujeto a las siguientes cláusulas y condiciones:
      </p>

      {/* Clausulas */}
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-base text-gray-900 mb-2">PRIMERA: Objeto del Contrato</h3>
          <p className="text-justify leading-relaxed">El Cliente contrata a El Desarrollador para la planificación, consultoría, arquitectura y desarrollo de la Fase 1 del ERP (Sistema de Gestión Especializado). Las tareas abarcan "Consultoría y Discovery" (entender procesos internos) y "Desarrollo de Código" (Frontend, Backend e Inteligencia Artificial).</p>
          <p className="text-justify leading-relaxed mt-2"><strong>Stack Tecnológico:</strong> React, Vite, Tailwind CSS, Supabase (PostgreSQL) y motor OpenAI. Se garantiza código 100% comentado y ciberseguridad mediante RBAC (roles) libre de "Vendor Lock-in".</p>
        </div>

        <div>
          <h3 className="font-bold text-base text-gray-900 mb-2">SEGUNDA: Alcance y Limitación (200 Horas)</h3>
          <p className="text-justify leading-relaxed">Se pacta un paquete base de <strong>200 (doscientas) horas</strong> de trabajo efectivo que cubrirán la labor de campo, entrevistas operativas, análisis de datos y la ingeniería de desarrollo de software integral.</p>
        </div>

        <div>
          <h3 className="font-bold text-base text-gray-900 mb-2">TERCERA: Metodología de Sprints</h3>
          <p className="text-justify leading-relaxed">Para asegurar calidad, se trabajará en bloques funcionales de <strong>15 días (Sprints)</strong>. Las partes determinarán en cada inicio la prioridad. Al finalizar la quincena, El Desarrollador entregará el módulo funcionando para el testeo del Cliente.</p>
        </div>

        <div>
           <h3 className="font-bold text-base text-gray-900 mb-2">CUARTA: Scope Creep y Desvíos</h3>
           <p className="text-justify leading-relaxed text-red-900 bg-red-50 p-2 border-l-2 border-red-500 text-xs">
             Excedentes y Ajustes: Todo requerimiento nuevo o desvío profundo se ajustará debitando de la bolsa de 200 horas. Esto implicará re-equilibrar prioridades y abortar el desarrollo de módulos secundarios para respetar el techo horario pactado, salvo convenio extra.
           </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-gray-900 mb-2">QUINTA: Inversión y Servidores</h3>
          <p className="text-justify leading-relaxed">El valor comercial pactado asume características preferenciales. La inversión asciende a <strong>A$ 5.000.000 (A$ 25.000/hora)</strong>, pagaderos en: 50% de anticipo a la firma (para habilitar el relevamiento general) y 50% restante contra-entrega final de Fase 1.</p>
          <p className="text-justify leading-relaxed text-xs mt-2 bg-gray-100 p-2 border border-gray-200">
             * Aclaración de Nube: Dominios Web, alojamiento de servidores Cloud, Base de Datos y Tokens de IA no están cubiertos por los honorarios de código. Éstos serán abonados de modo recurrente directamente por El Cliente a las respectivas empresas. Los pagos de servicios por Tarjeta de Crédito sufren los cargos financieros habituales. Factura A/B disponible previa coordinación fiscal.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-gray-900 mb-2">SEXTA: Propiedad Intelectual</h3>
          <p className="text-justify leading-relaxed">El Cliente obtiene libre uso de la estructura final, manteniéndose cláusulas de estricta confidencialidad sobre balances y flujos operativos. Queda pactada la alianza de visión a futuro para re-comercializaciones posteriores en formato SaaS a terceros de mutuo acuerdo.</p>
        </div>
      </div>

      <div className="mt-12 text-justify italic text-gray-500 mb-16">
        En prueba de conformidad, firmamos de común y buen acuerdo dos ejemplares de igual valor legal en la fecha _____ de ____________________ de 2026.
      </div>

      {/* Firmas */}
      <div className="flex justify-between items-end mt-12 px-8">
         <div className="text-center w-64">
            <div className="border-t border-black pt-2">
               <p className="font-bold text-gray-900 text-sm">Gustavo Regalado</p>
               <p className="text-xs text-gray-500">"El Cliente"</p>
               <p className="text-xs text-gray-400 mt-1">DNI / Firma</p>
            </div>
         </div>

         <div className="text-center w-64">
            <div className="border-t border-black pt-2">
               <p className="font-bold text-gray-900 text-sm">Lucas Marinero</p>
               <p className="text-xs text-gray-500">DNI: 37.298.023</p>
               <p className="text-xs text-gray-400 font-bold">GROW LABS</p>
            </div>
         </div>
      </div>

    </div>
  );
};
