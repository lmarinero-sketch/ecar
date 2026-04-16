import React from 'react';

export const ContractPDF: React.FC = () => {
  const WatermarkAndLogos = () => (
    <>
      {/* Logos fijos en cada hoja */}
      <img src="/logogrow.png" alt="Grow Labs Top" className="absolute top-10 left-10 h-10 w-auto invert opacity-90 z-20" />
      <img src="/logogrow.png" alt="Grow Labs Bottom" className="absolute bottom-10 right-10 h-8 w-auto invert opacity-30 z-20 grayscale" />
      
      {/* Marca de agua */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none" style={{ transform: 'rotate(-45deg)' }}>
         <span className="text-8xl font-black text-gray-900 tracking-tighter whitespace-nowrap">DOCUMENTO PROVISORIO</span>
      </div>
    </>
  );

  return (
    <div id="contract-pdf-wrapper" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px' }}>
      
      {/* ===================== PAGINA 1 ===================== */}
      <div className="pdf-page relative bg-white text-black pt-28 pb-20 px-12 w-[800px] h-[1131px] font-sans flex flex-col text-justify overflow-hidden border-b-2 border-gray-100">
        <WatermarkAndLogos />

        <div className="relative z-10 flex flex-col h-full">
          <div className="text-right mb-8 border-b-2 border-ecar-blue pb-4">
             <h1 className="text-xl font-black text-gray-900 tracking-tight">CONTRATO PROVISORIO DE LOCACIÓN</h1>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sujeto a modificaciones de mutuo acuerdo</p>
          </div>

          <h2 className="text-base font-bold text-center mb-6 uppercase tracking-wide bg-gray-100 py-2">Desarrollo de Software de Gestión (ERP) y Consultoría</h2>
          
          <p className="mb-6 leading-relaxed text-[13px] font-medium text-gray-800">
            Entre <strong>GROW LABS</strong> (en adelante "El Desarrollador"), legal y operativamente representado por <strong>Lucas Marinero (DNI: 37.298.023)</strong>, y por la otra parte el Sr. <strong>Gustavo Regalado</strong> en representación de su entidad corporativa de construcción (en adelante "El Cliente"), convienen celebrar el presente instrumento sujeto a las siguientes cláusulas formales:
          </p>

          <div className="space-y-6 flex-grow">
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA PRIMERA: Objeto del Contrato</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                El Cliente contrata a El Desarrollador para la planificación, diseño, consultoría y desarrollo de la Fase 1 de un Sistema de Gestión Empresarial (ERP) enfocado en logística e infraestructura. Las tareas comprenden:
              </p>
              <ol className="list-decimal pl-5 text-[13px] space-y-1 text-gray-700 mb-2">
                <li><strong>Consultoría y Discovery:</strong> Entrevistas y análisis profundo de los procedimientos in-situ de la empresa.</li>
                <li><strong>Desarrollo:</strong> Arquitectura de base de datos, código backend y frontend.</li>
              </ol>
              <p className="text-xs leading-relaxed bg-gray-50 p-3 italic border border-gray-200 mt-2">
                <strong>Stack Tecnológico y Seguridad:</strong> El software utilizará React, Vite, Tailwind CSS (Frontend), Supabase/PostgreSQL (Base de Datos) y la API de OpenAI. Incluirá Controles de Acceso Basados en Roles (RBAC) y directrices de ciberseguridad. El código será documentado y comentado transparentemente para evitar el Vendor Lock-in a futuro.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA SEGUNDA: Alcance y Limitación de Horas</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                Para la materialización del objetivo, se pacta un paquete inicial cerrado de <strong>200 (doscientas) horas de trabajo puro</strong>. Este paquete abarca en su totalidad tanto la labor de campo (visitas a la empresa y entendimiento integral de procesos) como el tiempo directo de ingeniería de software estructurando código.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA TERCERA: Metodología de Trabajo (Sprints Ágiles)</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                Para garantizar entregas rápidas y transparencia total, la dinámica de trabajo operará sobre "Sprints" (ciclos iterativos) de <strong>15 (quince) días corridos</strong>.
              </p>
              <ul className="list-disc pl-5 text-[13px] space-y-1 text-gray-700">
                <li><strong>Priorización:</strong> Al inicio de cada ciclo, las partes acuerdan explícitamente el submódulo a realizar.</li>
                <li><strong>Testeo:</strong> A los 15 días, el módulo se despliega en pruebas para que el Cliente asuma la validación y entregue su feedback respectivo.</li>
                <li><strong>Auditoría:</strong> Se emplearán sistemas Timer (ej. Wakatime/Clockify) para garantizar mediciones quirúrgicas.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== PAGINA 2 ===================== */}
      <div className="pdf-page relative bg-white text-black pt-28 pb-20 px-12 w-[800px] h-[1131px] font-sans flex flex-col text-justify overflow-hidden border-b-2 border-gray-100">
        <WatermarkAndLogos />

        <div className="relative z-10 flex flex-col h-full">
          <div className="space-y-8 flex-grow">
            
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA CUARTA: Gestión de Cambios (Scope Creep)</h3>
              <p className="text-[13px] leading-relaxed text-gray-700">
                A los fines de proteger a ambas partes, todo requerimiento estará amparado a la bolsa límite de 200 horas. Si durante el desarrollo El Cliente solicita lógicas que desvían profundamente el alcance consensuado o se demandan nuevas funcionalidades severas, <strong>dicho costo se absorberá descontando las horas adicionales del paquete global</strong> (200 hrs). 
                Consecuentemente, ambas partes re-equilibrarán prioridades sacrificando módulos periféricos previstos inicialmente; a menos que El Cliente adquiera bolsas de horas anexas formales con idéntico valor.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA QUINTA: Honorarios, Tarifa Preferencial y Formas de Pago</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                Se reconoce que el valor estándar de arquitectura IT promedia USD 40.00 horarios. Con el espíritu a futuro de empaquetar comercialmente esto como SaaS, se aplica de manera estratégica y única una valoración descontada a la bolsa de Fase 1 cifrada en <strong>A$ 5.000.000 (Pesos Argentinos)</strong>, lo cual representa A$ 25.000 por hora. 
              </p>
              <p className="text-[13px] font-semibold text-gray-800 mt-4 mb-2 border-b border-gray-200 pb-1">Condiciones de Cancelación Económica:</p>
              <ul className="list-none pl-2 text-[13px] space-y-2 text-gray-700">
                <li>• <strong>50% Anticipo inyectado a la firma del presente:</strong> Para habilitar logística, relevamiento y arquitectura. (A$ 2.500.000)</li>
                <li>• <strong>50% Contra-entrega final:</strong> Al agotar consumos y entregar la versión lista productiva en servidor. (A$ 2.500.000)</li>
              </ul>
              
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 text-[13px] text-gray-700 leading-relaxed italic">
                <strong>Aclaraciones Comerciales Importantes:</strong> Se dispone la emisión de la normativa <strong>Factura A o B</strong> según tributación exigida. Se receptan todos los medios de pago operacionales (Transferencias bancarias formales, eCheq o MercadoPago). Se aclara obligatoriamente que si se utilizaren métodos de pago vinculados a Tarjetas de Crédito institucionales o particulares, se repercutirá integramente el recargo natural por interés de financiación a cargo estricto del Cliente.
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA SEXTA: Costos de Infraestructura y Servidores en la Nube</h3>
              <p className="text-[13px] leading-relaxed text-gray-700">
                Se deja explícitamente sellado que los servicios de proveedores extranjeros para sostener la app 'online' escapa de toda responsabilidad pecuniaria de GROW LABS. <strong>El Cliente responderá administrativamente y anexará sus propios métodos de pago o tarjetas</strong> en las cuentas necesarias para asumir el costo de: Mantenimiento de dominios web, Servidores Cloud (Amazon AWS/Vercel/Supabase) y consumo tokenizado de IA (OpenAI API).
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ===================== PAGINA 3 ===================== */}
      <div className="pdf-page relative bg-white text-black pt-28 pb-16 px-12 w-[800px] h-[1131px] font-sans flex flex-col text-justify overflow-hidden">
        <WatermarkAndLogos />

        <div className="relative z-10 flex flex-col h-full">
          <div className="space-y-8">
            
            <div>
               <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA SÉPTIMA: Confidencialidad y Propiedad Intelectual</h3>
               <p className="text-[13px] leading-relaxed text-gray-700">
                 Toda la información operativa de la compañía, márgenes y metodologías vertidas son protegidas por riguroso Secreto Profesional. Paralelamente, el derecho de usufructo del sistema correrá vitaliciamente a nombre de El Cliente. Se ratifica paralelamente el propósito preexistente de que la matriz estructural genérica escrita (código) constituirá una base de negocios para vender e integrar este modelo a otras franquicias o empresas del rubro como un "Software as a Service (SaaS)" en una futura alianza colaborativa (Joint Venture).
               </p>
            </div>

            <div>
               <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA OCTAVA: Jurisdicción y Competencia</h3>
               <p className="text-[13px] leading-relaxed text-gray-700">
                 Para cualquier desavenencia, divergencia, incumplimiento interpretativo o rescisión de presente mandato originario y del potencial futuro acuerdo vinculante, los intervinientes acuerdan declinar otros fueros y someterse a la jurisdicción indiscutible de los Tribunales Ordinarios de la Provincia de San Juan.
               </p>
            </div>
            
          </div>

          <div className="mt-12 text-[13px] text-justify italic text-gray-600 border-t border-gray-300 pt-6">
            Habiendo comprendido la extensión, responsabilidades conjuntas y carácter provisorio dictaminado para este prospecto legal de protección mutua, ratificamos la alianza suscribiendo voluntariamente con sendas firmas y alcance vinculante el presente borrador fundacional en la Ciudad de San Juan, a los _____ días del mes de ____________________ de 2026.
          </div>

          {/* Firmas en la página 3, pegadas al fondo */}
          <div className="flex flex-row justify-around items-end w-full mt-auto mb-12">
             <div className="text-center w-[250px]">
                <div className="border-t-2 border-gray-800 pt-3">
                   <p className="font-bold text-gray-900 text-base">Gustavo Regalado</p>
                   <p className="text-xs text-gray-600 uppercase font-medium">"El Cliente"</p>
                   <p className="text-[10px] text-gray-400 mt-2">Firma y Sello</p>
                   <div className="w-full border-b border-gray-300 border-dotted mt-4 h-5"></div>
                   <p className="text-[10px] text-gray-400 mt-1">DNI / CUIT</p>
                </div>
             </div>

             <div className="text-center w-[250px]">
                <div className="border-t-2 border-gray-800 pt-3">
                   <p className="font-bold text-gray-900 text-base">Lucas Marinero</p>
                   <p className="text-xs text-gray-600 uppercase font-bold text-ecar-blue">GROW LABS</p>
                   <p className="text-[10px] text-gray-600 font-bold mt-1">DNI: 37.298.023</p>
                   <div className="w-full border-b border-gray-300 border-dotted mt-4 h-5"></div>
                   <p className="text-[10px] text-gray-400 mt-1">Sello Aclaratorio</p>
                </div>
             </div>
          </div>

        </div>
      </div>

    </div>
  );
};
