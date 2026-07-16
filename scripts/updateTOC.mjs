import fs from 'fs';

const filePath = 'src/components/ManualModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const updatedTOC = `
      const tocSections = [
        { num: '1.', title: 'Introducción y Alcance del Sistema', pg: '3' },
        { num: '2.', title: 'Arquitectura Técnica', pg: '4' },
        { num: '3.', title: 'Gestión de Accesos y Roles', pg: '5' },
        { num: '4.', title: 'Integración con Inteligencia Artificial', pg: '6' },
        
        { num: '5.', title: 'TABLEROS', pg: '' },
        { num: '5.1', title: 'Dashboard BI (MOD-01)', pg: '7' },
        { num: '5.2', title: 'Tablero de Liquidez (MOD-02)', pg: '8' },
        { num: '5.3', title: 'Resumen Mensual (MOD-20)', pg: '9' },
        { num: '5.4', title: 'Reporte Gerencia General (MOD-11)', pg: '10' },
        
        { num: '6.', title: 'ADMINISTRACIÓN Y FINANZAS', pg: '' },
        { num: '6.1', title: 'Compras & Libro IVA (MOD-03)', pg: '11' },
        { num: '6.2', title: 'Finanzas & Tesorería (MOD-04)', pg: '12' },
        { num: '6.3', title: 'Alertas & Obligaciones (MOD-05)', pg: '13' },
        { num: '6.4', title: 'Facturación ARCA (MOD-06)', pg: '14' },
        { num: '6.5', title: 'Gastos Operativos (MOD-07)', pg: '15' },
        { num: '6.6', title: 'Certificaciones ICC (MOD-08)', pg: '16' },
        { num: '6.7', title: 'Pagos y Egresos (MOD-03E)', pg: '17' },
        
        { num: '7.', title: 'PERSONAL Y RRHH', pg: '' },
        { num: '7.1', title: 'RRHH & Legajos (MOD-09)', pg: '18' },
        
        { num: '8.', title: 'LOGÍSTICA Y FLOTA', pg: '' },
        { num: '8.1', title: 'Inventario & Pañol (MOD-10)', pg: '19' },
        { num: '8.2', title: 'Pedidos de Compra (MOD-11)', pg: '20' },
        { num: '8.3', title: 'Combustible (MOD-17)', pg: '21' },
        { num: '8.4', title: 'Logística y Acopios (MOD-05A)', pg: '22' },
        { num: '8.5', title: 'Gestión de Flota y Taller (MOD-05B)', pg: '23' },
        
        { num: '9.', title: 'OPERACIONES Y PROYECTOS', pg: '' },
        { num: '9.1', title: 'Parte Diario de Obra (MOD-12)', pg: '24' },
        { num: '9.2', title: 'Planificación WBS & Gantt (MOD-13)', pg: '25' },
        { num: '9.3', title: 'Seguridad & Incidentes (MOD-14)', pg: '26' },
        { num: '9.4', title: 'Inspecciones & Calidad (MOD-15)', pg: '27' },
        { num: '9.5', title: 'Consultas de Obra RFI (MOD-16)', pg: '28' },
        { num: '9.6', title: 'Proyectos & Presupuestos (MOD-18)', pg: '29' },
        { num: '9.7', title: 'Documentos & Correo (MOD-19)', pg: '30' },
        { num: '9.8', title: 'Introducción GPP (MOD-02A)', pg: '31' },
        
        { num: '10.', title: 'COMUNICACIONES Y SISTEMA', pg: '' },
        { num: '10.1', title: 'Comunicaciones (MOD-10)', pg: '32' },
        { num: '10.2', title: 'Guía Rápida (MOD-98)', pg: '33' },
        { num: '10.3', title: 'Implementación (MOD-97)', pg: '34' },
        { num: '10.4', title: 'Gestión de Usuarios (MOD-99A)', pg: '35' },
        { num: '10.5', title: 'Actividad de Usuarios (MOD-99B)', pg: '36' },

        { num: '11.', title: 'Seguridad de la Información', pg: '37' },
        { num: '12.', title: 'Control de Documentos', pg: '38' },
        { num: '13.', title: 'Glosario y Referencias', pg: '39' },
      ];
`;

const regex = /const tocSections = \[([\s\S]*?)\];/;
content = content.replace(regex, updatedTOC.trim());
fs.writeFileSync(filePath, content);
console.log('TOC updated successfully.');
