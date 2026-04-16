import React from 'react';

export const ContractPDF: React.FC = () => {
  return (
    <div id="contract-pdf-content" className="bg-white text-black p-12 max-w-[800px] w-[800px] font-sans mx-auto text-justify relative" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      
      {/* Watermark (absolute in background) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none" style={{ transform: 'rotate(-45deg)' }}>
         <span className="text-8xl font-black text-gray-900 tracking-tighter whitespace-nowrap">DOCUMENTO PROVISORIO</span>
      </div>

      <div className="relative z-10">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-ecar-blue pb-4">
          <div>
            <img src="/logogrow.png" alt="Grow Labs" className="h-12 w-auto invert" />
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">CONTRATO PROVISORIO</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sujeto a modificaciones de mutuo acuerdo</p>
          </div>
        </div>

        {/* Intro */}
        <h2 className="text-lg font-bold text-center mb-6 uppercase tracking-wide bg-gray-100 py-2">Acuerdo de Locación de Servicios Tecnológicos y Consultoría</h2>
        
        <p className="mb-6 leading-relaxed text-sm">
          A los efectos del presente pre-acuerdo de servicios, entre <strong>GROW LABS</strong> (en adelante "El Desarrollador"), legal y operativamente representado por <strong>Lucas Marinero (DNI: 37.298.023)</strong>, y por la otra parte el Sr. <strong>Gustavo Regalado</strong> en representación de su entidad corporativa o personería física correspondiente (en adelante "El Cliente"), convienen celebrar este instrumento sujeto a las cláusulas comerciales, técnicas y operacionales detalladas a continuación:
        </p>

        {/* Clausulas */}
        <div className="space-y-8">
          
          <div className="break-inside-avoid">
            <h3 className="font-bold text-base text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2">CLÁUSULA PRIMERA: Objeto Fundamental</h3>
            <p className="text-sm leading-relaxed mb-2">
              El Cliente contrata a El Desarrollador para la investigación de campo, arquitectonización, redacción de lógica de código y puesta en marcha de la <strong>Fase 1 del Sistema Integral de Gestión Empresarial (ERP)</strong> destinado específicamente a las operativas de construcción e infraestructura (Maquinaria, Logística, Contabilidad, Pañol y Manejo de Obra). 
            </p>
            <p className="text-sm leading-relaxed">
              Dicha tarea no se circunscribe únicamente al tecleo de código, sino que el valor agregado incluye <strong>"Consultoría y Discovery Integral"</strong>, donde El Desarrollador procederá en visitas intermitentes a relevar y mimetizarse con los procesos de la empresa para modelarlos con precisión computacional.
            </p>
            <p className="text-sm leading-relaxed mt-2 bg-blue-50 p-3 italic">
              <strong>Stack Tecnológico Comprometido:</strong> El Desarrollador se compromete a entregar un sistema state-of-the-art fundamentado en: React, Vite, Tailwind CSS (Frontend/Interfaces móviles PWA), Supabase/PostgreSQL (Bases de datos escalables en la nube) y la API de OpenAI (Análisis predictivo de datos y reportes generativos). El sistema implementará jerarquías RBAC (Role-Based Access Control) para garantizar la ciberseguridad.
            </p>
          </div>

          <div className="break-inside-avoid">
            <h3 className="font-bold text-base text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2">CLÁUSULA SEGUNDA: Delimitación Exacta de la Inversión Horaria</h3>
            <p className="text-sm leading-relaxed mb-2">
              Con el propósito de proteger técnica y económicamente a ambas partes, se define un universo estricto de <strong>200 (doscientas) horas netas de trabajo</strong> destinadas íntegramente a esta primera etapa. Estas horas engloban tanto el tiempo in situ (reuniones y relevamientos en planta) como el tiempo en remoto (arquitectura de la base de datos, programación backend, frontend web y despliegue temporal).
            </p>
          </div>

          <div className="break-inside-avoid">
            <h3 className="font-bold text-base text-gray-900 mb-2 border-l-4 border-green-500 pl-2">CLÁUSULA TERCERA: Gestión y Auditoría Transparente de Horas</h3>
            <p className="text-sm leading-relaxed mb-2">
              El consumo de la bolsa de 200 horas se ejecutará bajo los más altos estándares de transparencia técnica para la confianza del Cliente. Se administrará mediante el siguiente protocolo de auditoría continua:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2 text-gray-700">
              <li><strong>Registro Sistematizado:</strong> El Desarrollador utilizará sistemas de timer profesional (como Clockify o Wakatime) para medir cada minuto invertido frente a la pantalla en tareas de código o análisis de UX.</li>
              <li><strong>Reportes Quincenales:</strong> Junto con cada entrega de Sprint (mencionada en la Cláusula Cuarta), se anexará un PDF/Enlace con la trazabilidad horaria técnica de lo consumido a la fecha.</li>
              <li><strong>Trazabilidad de Nube (Commits):</strong> El Cliente, mediante previa capacitación, podrá corroborar los "Git Commits" (puntos de guardado del código subidos al servidor en horas específicas) en el repositorio para validar el avance palpable del producto software.</li>
            </ul>
          </div>

          <div className="break-inside-avoid">
            <h3 className="font-bold text-base text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2">CLÁUSULA CUARTA: Metodología Agile y Desvíos de Alcance (Scope Creep)</h3>
            <p className="text-sm leading-relaxed mb-2">
              El desarrollo operará sobre <strong>Sprints de quince (15) días corridos</strong>. Al inicio del Sprint se acuerda de manera explícita el submódulo a realizar (ej: "Sistema de Pañol"). A los 15 días, el sistema es subido a pruebas de calidad y el Cliente asume la obligación de probar y entregar feedback oportuno.
            </p>
            <p className="text-sm leading-relaxed bg-red-50 p-3 text-red-900 mt-2 font-medium">
              <strong>Control Anti-Desvíos (Scope Management):</strong> La Bolsa de 200 horas presupone el desarrollo de la hoja de ruta inicial. Si durante la marcha el Cliente detecta nuevas necesidades que alteren profundamente un submódulo o impongan nuevas reglas lógicas extensas, El Desarrollador las ejecutará; no obstante, dichas horas se descontarán del paquete total asumiendo la inhabilitación/cancelación de otros módulos futuros de menor prioridad, hasta que se formalice la compra de anexos complementarios de horas con idéntico valor monetario.
            </p>
          </div>

          <div className="break-inside-avoid">
            <h3 className="font-bold text-base text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2">CLÁUSULA QUINTA: Inversión, Responsabilidad Fiscal y Servidores Nube</h3>
            <p className="text-sm leading-relaxed mb-2">
              Esta alianza posee espíritu asociativo a futuro. Por ello se fija una inversión inamovible para la Fase 1 tasada en <strong>Pesos Argentinos (A$) 5.000.000</strong> (A$ 25.000 la hora, siendo esta una tarifa unificada por debajo de los honorarios estándar internacionales que promedian entre los USD 30.00 a USD 50.00 en arquitectura avanzada).
            </p>
            <p className="text-sm leading-relaxed mb-2">
              <strong>Términos de Liquidación:</strong>
              <br/>50% Anticipo inyectado a la firma del presente. (A$ 2.500.000)
              <br/>50% Contra-entrega final de las 200 horas y subida legal al servidor oficial. (A$ 2.500.000)
            </p>
            <p className="text-sm leading-relaxed text-gray-600 italic bg-gray-100 p-2">
              <strong>Costos Anexos:</strong> Se dictamina taxativamente que El Desarrollador no asume costos de hardware ajenos, registros web u honorarios en dólares para mantenimiento en la nube (Servidores AWS, Supabase Database, Tráfico Vercel, o el consumo tokenizado de la red OpenAI). Dichos proveedores se integrarán e inscribirán con tarjetas y cuentas del Cliente. En caso de precisarse pagos financiados en cuotas a El Desarrollador, el comprador asume la recarga de interés inflacionario/crediticio inherente. Para fines tributarios, se emitirán las Facturas A/B respectivas.
            </p>
          </div>

          <div className="break-inside-avoid">
            <h3 className="font-bold text-base text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2">CLÁUSULA SEXTA: Propiedad Intelectual Comentada y Confidencialidad</h3>
            <p className="text-sm leading-relaxed mb-2">
              Todos los procesos ingenieriles, datos financieros e identidades corporativas provistas están cubiertos por Secreto Profesional.
              <br/><br/>
              A favor de la protección tecnológica del Cliente, El Desarrollador entregará el código fuente matriz del sistema <strong>minuciosamente documentado y comentado en sus ramas críticas</strong> (sin código ofuscado premeditadamente), lo que garantiza nulidad de dependencias y asegura la potestad de ser cedido a otros equipos auditablemente. Paralelamente, se ratifica el propósito expresado de empaquetar comercialmente esta infraestructura a futuro para su venta estilo "Software as a Service (SaaS)" en rubros de construcción afines, compartiendo la visión de un <strong>Joint Venture</strong>.
            </p>
          </div>
          
          <div className="break-inside-avoid">
            <h3 className="font-bold text-base text-gray-900 mb-2 border-l-4 border-ecar-blue pl-2">CLÁUSULA SÉPTIMA: Jurisdicción y Competencia</h3>
            <p className="text-sm leading-relaxed mb-2">
              Para cualquier controversia, divergencia o reclamo que pudiera surgir con motivo de la interpretación, cumplimiento, ejecución o rescisión del presente pre-acuerdo o de su posterior formalización, las partes acuerdan someterse de manera exclusiva a la jurisdicción y competencia de los Tribunales Ordinarios de la Provincia de San Juan, renunciando expresamente a cualquier otro fuero, jurisdicción o excepción de arraigo que por razón de sus domicilios presentes o futuros pudiera corresponderles.
            </p>
          </div>
          
        </div>

        <div className="mt-12 text-sm text-justify italic text-gray-500 mb-24 border-t border-gray-300 pt-8 break-inside-avoid">
          Habiendo comprendido la extensión, propósito y carácter provisorio sujeto a las personalizaciones de acuerdo que exija el rubro operativo previo inicio, y asumiendo plenamente el marco preventivo y responsivo antedicho; procedemos a celebrar dicho borrador legal con las firmas en San Juan, a los _____ días del mes de ____________________ de 2026.
        </div>

        {/* Firmas en paralelo para cierre visual contundente */}
        <div className="flex flex-row justify-around items-end pt-8 w-full mt-auto break-inside-avoid pb-12">
           <div className="text-center w-[250px]">
              <div className="border-t-2 border-gray-800 pt-3">
                 <p className="font-bold text-gray-900 text-lg">Gustavo Regalado</p>
                 <p className="text-sm text-gray-600 uppercase font-medium">"El Cliente"</p>
                 <p className="text-xs text-gray-400 mt-2">Firma y Sello</p>
                 <div className="w-full border-b border-gray-300 border-dotted mt-4 h-6"></div>
                 <p className="text-xs text-gray-400 mt-1">DNI / CUIT</p>
              </div>
           </div>

           <div className="text-center w-[250px]">
              <div className="border-t-2 border-gray-800 pt-3">
                 <p className="font-bold text-gray-900 text-lg">Lucas Marinero</p>
                 <p className="text-sm text-gray-600 uppercase font-bold text-ecar-blue">GROW LABS</p>
                 <p className="text-xs text-gray-400 mt-2">DNI: 37.298.023</p>
                 <div className="w-full border-b border-gray-300 border-dotted mt-4 h-6"></div>
                 <p className="text-xs text-gray-400 mt-1">Sello Aclaratorio</p>
              </div>
           </div>
        </div>
        
      </div>
    </div>
  );
};
