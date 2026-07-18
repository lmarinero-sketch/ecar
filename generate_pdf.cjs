const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('Reporte_Roles_Ecar.pdf'));

doc.fontSize(20).text('Reporte de Roles y Necesidades de Personal - Sistema Ecar', { align: 'center' });
doc.moveDown();

doc.fontSize(14).text('1. Resumen Ejecutivo', { underline: true });
doc.fontSize(12).text('Para implementar y operar correctamente el Sistema Ecar en su totalidad, se estima un equipo administrativo/gestión mínimo de 8 a 9 personas. Recuento por área:', { align: 'justify' });
doc.text('- Recursos Humanos: 1 persona');
doc.text('- Finanzas y Administración: 1 a 2 personas');
doc.text('- Compras e Inventario: 2 personas (1 Compras, 1 Almacén)');
doc.text('- Operaciones / Proyectos: 1 a 2 personas (Jefatura de Obra)');
doc.text('- Logística y Flota: 1 persona');
doc.text('- Calidad y Seguridad (HSEQ): 1 persona');
doc.text('- Dirección / Comercial: 1 persona');
doc.moveDown();

doc.fontSize(14).text('2. Detalle por Rol', { underline: true });
doc.moveDown();

const roles = [
  {
    title: '2.1. Analista de Recursos Humanos (1 persona)',
    responsibilities: 'Alta/baja de empleados, asistencia diaria, carga de novedades de nómina, liquidación de sueldos, entrega de EPP.',
    training: 'Manejo de nómina, leyes laborales vigentes, uso de módulos de RRHH del sistema.',
    tech: 'PC de escritorio estándar o Laptop, conexión a internet.'
  },
  {
    title: '2.2. Analista / Gerente de Finanzas (1 a 2 personas)',
    responsibilities: 'Carga de facturas de proveedores, pagos, cobros, presupuestos generales, control de liquidez.',
    training: 'Conocimientos contables, financieros, flujo de caja.',
    tech: 'PC con buena capacidad (recomendado doble monitor).'
  },
  {
    title: '2.3. Encargado de Compras (1 persona)',
    responsibilities: 'Alta y evaluación de proveedores, generación de Órdenes de Compra.',
    training: 'Gestión de cadena de suministro, negociación.',
    tech: 'PC de escritorio estándar.'
  },
  {
    title: '2.4. Jefe de Almacén e Inventario (1 persona)',
    responsibilities: 'Recepción de materiales (entradas), entregas a campo (salidas), mapeo de almacén.',
    training: 'Gestión de inventarios, lector de códigos de barras.',
    tech: 'PC en almacén, Lector de Códigos de Barras, Tablet o dispositivo móvil.'
  },
  {
    title: '2.5. Coordinador de Logística y Flota (1 persona)',
    responsibilities: 'Registro de vehículos y choferes, consumos de combustible, mantenimientos, check-in/out.',
    training: 'Gestión de flotas vehiculares y logística.',
    tech: 'PC estándar, Smartphone para check-in vehicular.'
  },
  {
    title: '2.6. Jefe de Obra / Operaciones (1 a 2 personas por proyecto)',
    responsibilities: 'Reportes diarios de obra, avance de tareas (WBS), solicitudes de materiales.',
    training: 'Gestión de proyectos (PMI/Ágil), metodologías constructivas.',
    tech: 'Smartphone/Tablet en campo, Laptop para oficina técnica.'
  },
  {
    title: '2.7. Responsable de Calidad y Seguridad (HSEQ) (1 persona)',
    responsibilities: 'Manuales, registro de No Conformidades e inspecciones, seguimiento de certificaciones.',
    training: 'Normas ISO, auditoría interna, seguridad industrial.',
    tech: 'PC estándar, Tablet para inspecciones en campo.'
  },
  {
    title: '2.8. Director / Gestor Comercial (1 persona)',
    responsibilities: 'Oportunidades comerciales, generación de propuestas y presupuestos, Dashboards.',
    training: 'Gestión comercial, CRM, Business Intelligence.',
    tech: 'Laptop ejecutiva, Smartphone.'
  }
];

roles.forEach(role => {
  doc.fontSize(12).font('Helvetica-Bold').text(role.title);
  doc.font('Helvetica').text('Data Entry: ' + role.responsibilities);
  doc.text('Capacitación: ' + role.training);
  doc.text('Requisitos Tecnológicos: ' + role.tech);
  doc.moveDown();
});

doc.fontSize(14).font('Helvetica').text('Nota sobre Diagramas:', { underline: true });
doc.fontSize(12).text('El diagrama de interacción de roles se encuentra en el archivo Markdown (reporte_roles_ecar.md) generado previamente con sintaxis Mermaid.');

doc.end();
