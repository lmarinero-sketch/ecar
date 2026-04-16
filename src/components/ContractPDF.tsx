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
      <div className="pdf-page relative bg-white text-black pt-28 pb-32 px-12 w-[800px] h-[1131px] font-sans flex flex-col text-justify overflow-hidden border-b-2 border-gray-100">
        <WatermarkAndLogos />

        <div className="relative z-10 flex flex-col h-full">
          <div className="text-right mb-8 border-b-2 border-ecar-blue pb-4">
             <h1 className="text-xl font-black text-gray-900 tracking-tight">CONTRATO PROVISORIO</h1>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sujeto a modificaciones de mutuo acuerdo</p>
          </div>

          <h2 className="text-lg font-bold text-center mb-6 uppercase tracking-wide bg-gray-100 py-2">Acuerdo de Locación de Servicios Tecnológicos y Consultoría</h2>
          
          <p className="mb-6 leading-relaxed text-[13px] font-medium text-gray-800">
            A los efectos del presente pre-acuerdo de servicios, entre <strong>GROW LABS</strong> (en adelante "El Desarrollador"), legal y operativamente representado por <strong>Lucas Marinero (DNI: 37.298.023)</strong>, y por la otra parte el Sr. <strong>Gustavo Regalado</strong> en representación de su entidad corporativa o personería física correspondiente (en adelante "El Cliente"), convienen celebrar este instrumento sujeto a las cláusulas comerciales, técnicas y operacionales detalladas a continuación:
          </p>

          <div className="space-y-6 flex-grow">
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA PRIMERA: Objeto Fundamental</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                El Cliente contrata a El Desarrollador para la investigación de campo, arquitectonización, redacción de lógica de código y puesta en marcha de la <strong>Fase 1 del Sistema Integral de Gestión Empresarial (ERP)</strong> destinado específicamente a las operativas de construcción e infraestructura (Maquinaria, Logística, Contabilidad, Pañol y Manejo de Obra). 
              </p>
              <p className="text-[13px] leading-relaxed text-gray-700">
                Dicha tarea no se circunscribe únicamente al tecleo de código, sino que el valor agregado incluye <strong>"Consultoría y Discovery Integral"</strong>, donde El Desarrollador procederá en visitas intermitentes a relevar y mimetizarse con los procesos de la empresa.
              </p>
              <p className="text-xs leading-relaxed mt-2 bg-gray-50 p-3 italic border border-gray-200">
                <strong>Stack Tecnológico Comprometido:</strong> El Desarrollador se compromete a entregar un sistema state-of-the-art fundamentado en: React, Vite, Tailwind CSS (Frontend/Interfaces móviles PWA), Supabase/PostgreSQL (Bases de datos escalables en la nube) y la API de OpenAI (Análisis predictivo de datos y reportes generativos). El sistema implementará jerarquías RBAC (Role-Based Access Control) para garantizar la ciberseguridad.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA SEGUNDA: Delimitación Exacta de la Inversión Horaria</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                Con el propósito de proteger técnica y económicamente a ambas partes, se define un universo estricto de <strong>200 (doscientas) horas netas de trabajo</strong> destinadas íntegramente a esta primera etapa. Estas horas engloban tanto el tiempo in situ (reuniones y relevamientos en planta) como el tiempo en remoto (arquitectura de la base de datos, programación backend, frontend web y despliegue temporal).
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-green-500 pl-2 bg-green-50/50 py-1">CLÁUSULA TERCERA: Gestión y Auditoría Transparente de Horas</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                El consumo de la bolsa de 200 horas se ejecutará bajo los más altos estándares de transparencia técnica para la confianza del Cliente. Se administrará con el siguiente protocolo de auditoría continua:
              </p>
              <ul className="list-disc pl-5 text-[13px] space-y-2 text-gray-700">
                <li><strong>Registro Sistematizado:</strong> El Desarrollador utilizará sistemas de timer profesional (como Clockify o Wakatime) para medir cada minuto invertido frente a la pantalla en tareas de código o análisis de UX.</li>
                <li><strong>Reportes Quincenales:</strong> Junto con cada entrega de Sprint, se anexará un PDF/Enlace con la trazabilidad horaria de lo consumido a la fecha.</li>
                <li><strong>Trazabilidad de Nube (Commits):</strong> El Cliente podrá corroborar los "Git Commits" en el repositorio para validar el avance palpable del producto software.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== PAGINA 2 ===================== */}
      <div className="pdf-page relative bg-white text-black pt-28 pb-12 px-12 w-[800px] h-[1131px] font-sans flex flex-col text-justify overflow-hidden">
        <WatermarkAndLogos />

        <div className="relative z-10 flex-grow flex flex-col">
          <div className="space-y-6">
            
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA CUARTA: Metodología Agile</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                El desarrollo operará sobre <strong>Sprints de quince (15) días corridos</strong>. Al inicio del Sprint se acuerda el submódulo a realizar. A los 15 días, el sistema es subido a pruebas de calidad y el Cliente asume la obligación de probar y entregar feedback oportuno.
              </p>
              <p className="text-xs leading-relaxed bg-red-50 p-3 text-red-900 border border-red-200 mt-2">
                <strong>(Continuación Cláusula 4) Control Anti-Desvíos (Scope Management):</strong> La Bolsa presupone el desarrollo de la hoja de ruta inicial. Si durante la marcha el Cliente detecta nuevas necesidades que alteren profundamente un submódulo o impongan nuevas reglas lógicas extensas, El Desarrollador las ejecutará; no obstante, dichas horas se descontarán del paquete total asumiendo la inhabilitación/cancelación de otros módulos futuros de menor prioridad, hasta que se formalice la compra de anexos.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA QUINTA: Inversión, Responsabilidad Fiscal y Servidores Nube</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                Esta alianza posee espíritu asociativo a futuro. Por ello se fija una inversión inamovible para la Fase 1 tasada en <strong>Pesos Argentinos (A$) 5.000.000</strong> (A$ 25.000 la hora, siendo esta una tarifa preferencial).
                <br/><br/>
                <strong>Términos de Liquidación:</strong>
                <br/>• 50% Anticipo inyectado a la firma del presente. (A$ 2.500.000)
                <br/>• 50% Contra-entrega final de las 200 horas. (A$ 2.500.000)
              </p>
              <p className="text-xs leading-relaxed text-gray-600 bg-gray-100 p-3 mt-2 border border-gray-200">
                <strong>Costos Anexos:</strong> Se dictamina taxativamente que El Desarrollador no asume costos de hardware ajenos, registros web u honorarios en dólares para mantenimiento en la nube (Servidores AWS, Supabase, Vercel, tokens OpenAI). Dichos proveedores se integrarán con métodos de pago del Cliente. En caso de precisarse pagos financiados en cuotas a El Desarrollador, el comprador asume la recarga de interés inflacionario/crediticio inherente. Para fines tributarios, se emitirán Facturas A/B respectivas.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA SEXTA: Propiedad Intelectual Comentada y Confidencialidad</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                Todos los procesos ingenieriles provistos están cubiertos por Secreto Profesional.
                <br/><br/>
                A favor de la protección tecnológica del Cliente, El Desarrollador entregará el código fuente matriz del sistema <strong>minuciosamente documentado y comentado</strong> corporativamente (sin código ofuscado), lo que garantiza nulidad de dependencias y asegura la potestad de ser cedido a otros equipos auditablemente. Paralelamente, se ratifica el propósito expresado de empaquetar comercialmente esta infraestructura a futuro para su venta estilo SaaS en alianza Joint Venture.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2 bg-blue-50/50 py-1">CLÁUSULA SÉPTIMA: Jurisdicción y Competencia</h3>
              <p className="text-[13px] leading-relaxed mb-2 text-gray-700">
                Para cualquier controversia, divergencia o reclamo que pudiera surgir con motivo de la interpretación, cumplimiento, ejecución o rescisión del presente pre-acuerdo o de su posterior formalización, las partes acuerdan someterse de manera exclusiva a la jurisdicción y competencia de los Tribunales Ordinarios de la Provincia de San Juan, renunciando expresamente a cualquier otro fuero, jurisdicción o excepción de arraigo que pudiera corresponderles.
              </p>
            </div>
            
          </div>

          <div className="mt-8 text-xs text-justify italic text-gray-500 border-t border-gray-300 pt-6">
            Habiendo comprendido la extensión, propósito y carácter provisorio sujeto a las personalizaciones de acuerdo que exija el rubro operativo previo inicio, y asumiendo plenamente el marco preventivo y responsivo antedicho; procedemos a celebrar dicho borrador legal con las firmas en la ciudad de San Juan, a los _____ días del mes de ____________________ de 2026.
          </div>

          {/* Firmas al final de la página 2 */}
          <div className="flex flex-row justify-around items-end w-full mt-auto mb-16">
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
