import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

async function generatePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helpers
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      drawPageHeader();
      y = 25;
    }
  };

  const drawPageHeader = () => {
    doc.setFillColor(15, 58, 103); // #0f3a67
    doc.rect(margin, 10, contentWidth, 0.8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ECAR CONSTRUCTORA — INFORME DE ACTUALIZACIONES Y GUÍA OPERATIVA', margin, 8);
    doc.text('SEPTIEMBRE 2026', pageWidth - margin, 8, { align: 'right' });
  };

  const drawHeaderCover = () => {
    // Top banner
    doc.setFillColor(15, 58, 103);
    doc.roundedRect(margin, y, contentWidth, 36, 3, 3, 'F');

    // Logo if exists
    try {
      const logoPath = path.resolve('public/logoECAR.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath).toString('base64');
        doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', margin + 6, y + 5, 26, 26);
      }
    } catch (e) {
      console.warn('Logo no cargado:', e.message);
    }

    // Title text inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('RESUMEN DE ACTUALIZACIONES DEL SISTEMA', margin + 35, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(186, 215, 248);
    doc.text('Nuevas funcionalidades, automatizaciones y guía práctica de uso', margin + 35, y + 20);

    doc.setFontSize(7.5);
    doc.setTextColor(220, 235, 252);
    doc.text('Alcance: Mantenimiento Vehicular (QR), Bot WhatsApp, Rendimientos Obra, HyS y Logística', margin + 35, y + 27);

    y += 42;
  };

  const drawSectionTitle = (num, title, badgeText, badgeColor = [15, 58, 103]) => {
    checkPageBreak(18);
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${num}. ${title.toUpperCase()}`, margin + 4, y + 5.5);

    if (badgeText) {
      doc.setFontSize(7.5);
      doc.text(badgeText, pageWidth - margin - 4, y + 5.5, { align: 'right' });
    }
    y += 12;
  };

  const drawFeatureBlock = ({ whatWasDone, howToUse, practicalExample }) => {
    checkPageBreak(35);

    // What was done
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 58, 103);
    doc.text('¿Qué se modificó e implementó?', margin + 2, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitWhat = doc.splitTextToSize(whatWasDone, contentWidth - 4);
    doc.text(splitWhat, margin + 2, y);
    y += splitWhat.length * 3.8 + 3;

    // How to use box
    checkPageBreak(25);
    const splitHow = doc.splitTextToSize(howToUse, contentWidth - 10);
    const boxHeight = splitHow.length * 3.6 + 9;

    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    // Left accent bar
    doc.setFillColor(15, 58, 103);
    doc.roundedRect(margin, y, 2.5, boxHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 58, 103);
    doc.text('📘 Guía de uso paso a paso:', margin + 6, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(splitHow, margin + 6, y + 9);

    y += boxHeight + 3;

    // Practical tip / example
    if (practicalExample) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text('✓ Impacto operativo:', margin + 2, y);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const splitEx = doc.splitTextToSize(practicalExample, contentWidth - 32);
      doc.text(splitEx, margin + 30, y);
      y += splitEx.length * 3.6 + 3;
    }

    y += 2;
  };

  // ── BUILD DOCUMENT ──
  drawHeaderCover();

  // SECTION 1
  drawSectionTitle(
    '1',
    'Alertas de Mantenimiento por Km y Horas (Vía QR y Flota)',
    'Flota, Maquinaria & Taller',
    [15, 58, 103]
  );
  drawFeatureBlock({
    whatWasDone:
      '• Se desarrolló un motor unificado de control preventivo y crítico para toda la flota y maquinaria pesada.\n' +
      '• Soporte dual inteligente: Vehículos livianos y camiones se auditan por Odómetro (KM), mientras que retroexcavadoras, motoniveladoras y grupos electrógenos se auditan por Horómetro (Horas de motor con precisión decimal 0.1 hs).\n' +
      '• Umbral Preventivo: Alerta amarilla cuando faltan menos de 500 km o 50 hs (o menos de 7 días) para el service.\n' +
      '• Umbral Crítico (Vencido): Si el registro actual alcanza o supera el objetivo de service, la unidad pasa automáticamente a condición "Con observaciones".\n' +
      '• Disparo automático de Orden de Trabajo: Al enviar el reporte con service vencido, el sistema crea de inmediato una Orden de Trabajo en estado "pendiente" en el panel del Taller Mecánico.',
    howToUse:
      '1. El operario o chofer en obra escanea el código QR pegado en la unidad o parabrisas.\n' +
      '2. En la pantalla del celular se adapta automáticamente el campo: indicará "Horómetro (hs)" o "Odómetro (km)" con su último registro mínimo válido.\n' +
      '3. A medida que escribe la lectura, verá en vivo un banner de alerta:\n' +
      '   - Rojo: "¡Atención: Service Vencido!" con indicación de derivación a taller.\n' +
      '   - Amarillo: "Aviso Preventivo: Service Próximo" (restan pocos km/hs).\n' +
      '4. El operario completa el checklist diario y envía el reporte.\n' +
      '5. El encargado de flota ingresa a Flota y Maquinaria > Cronograma Service: allí ve las unidades vencidas con el exceso exacto (+km o +hs) y cuenta con un botón directo "Generar OT Taller" y "Completado".',
    practicalExample:
      'Elimina roturas imprevistas en obra; la maquinaria pesada ahora no depende de estimaciones manuales sino de las horas reales cargadas a diario en campo.'
  });

  // SECTION 2
  drawSectionTitle(
    '2',
    'Control y Silenciado Temporal del Bot de WhatsApp (Rombo)',
    'CRM & Edge Functions',
    [7, 94, 84] // #075e54
  );
  drawFeatureBlock({
    whatWasDone:
      '• Se implementó una compuerta segura de desconexión / silencio temporal en la Edge Function de Supabase (rombo-whatsapp).\n' +
      '• Preservación absoluta de la configuración: No se borra ni modifica ningún prompt, herramienta de IA, base de datos ni credenciales de BuilderBot / OpenAI GPT-4o.\n' +
      '• Modo de captura pasiva: Mientras el bot esté silenciado, los mensajes que envíen los operarios o clientes por WhatsApp se siguen registrando y archivando en la base de datos para no perder ninguna conversación.\n' +
      '• Control web en tiempo real: Se incorporó en el módulo de Comunicaciones (CRM) un selector de estado que permite ver si el bot está activo o silenciado y alternarlo con un solo clic.',
    howToUse:
      '1. Estado actual: El bot se encuentra silenciado / desconectado por configuración segura.\n' +
      '2. Para reconectar el bot desde la web:\n' +
      '   - Ingresá al módulo "Comunicaciones" (CRM de WhatsApp).\n' +
      '   - En la cabecera verás el indicador rojo: "Bot Silenciado / Desconectado".\n' +
      '   - Hacé clic en el botón verde "Reconectar Bot". De inmediato volverá a responder consultas.\n' +
      '3. Para volver a silenciarlo:\n' +
      '   - Hacé clic en el botón rojo "Silenciar Bot" en la misma cabecera, o solicitámelo en el chat.\n' +
      '4. Mientras esté silenciado, podés leer todos los mensajes entrantes de la gente desde la vista tipo WhatsApp Web sin que el bot interactúe.',
    practicalExample:
      'Permite realizar mantenimientos, pruebas o atención 100% manual sin que la inteligencia artificial responda automáticamente.'
  });

  // SECTION 3
  drawSectionTitle(
    '3',
    'Módulo de Rendimientos de Obra (Matriz Roque)',
    'Producción & Avance Físico',
    [15, 58, 103]
  );
  drawFeatureBlock({
    whatWasDone:
      '• Se digitalizó integralmente la planilla de control de obra y rendimientos de cuadrillas ("ECAR_Control_Obra_Rendimientos_Roque.xlsx").\n' +
      '• Estructura de medición por rubros de obra civil: cuadrillas de colocación de cañerías, zanjeo, movimiento de suelo y hormigonado.\n' +
      '• Ratios automáticos de productividad: cálculo de metros lineales por jornal (m/jornal), metros cúbicos de hormigón colocados y comparación contra curva teórica.\n' +
      '• Detección visual de desvíos: alertas cuando el rendimiento de una cuadrilla cae por debajo del estándar presupuestado.',
    howToUse:
      '1. Ingresá al módulo de "Obras" o "Proyectos" y seleccioná la pestaña "Rendimientos".\n' +
      '2. Elegí la obra activa (ej. Alvear & Mitre, Red Distribuidora, etc.) y la semana de análisis.\n' +
      '3. El sistema carga el total de operarios asignados y los metros producidos.\n' +
      '4. Revisá la tabla comparativa con el semáforo de productividad por capataz y frente de obra.',
    practicalExample:
      'Permite a la jefatura de obra identificar cuellos de botella en zanjeo o demoras de hormigón antes de emitir los certificados mensuales.'
  });

  // SECTION 4
  drawSectionTitle(
    '4',
    'Informes Semanales Entregables de Higiene y Seguridad',
    'Seguridad, Calidad & SRT',
    [180, 83, 9] // #b45309
  );
  drawFeatureBlock({
    whatWasDone:
      '• Se integró el modelo de "Informe Semanal de Higiene y Seguridad listo para entrega" según normativas laborales y de ART.\n' +
      '• Panel dedicado en el módulo de Seguridad para generar actas semanales con relevamiento de EPP, vallados, orden y limpieza, matafuegos y señalética en obra.\n' +
      '• Exportación profesional a PDF membretado con formato técnico entregable para comitentes, inspectores de obra y auditorías.',
    howToUse:
      '1. Ingresá a "Seguridad e Higiene" > pestaña "Informes Semanales".\n' +
      '2. Hacé clic en "Nuevo Informe Semanal" y seleccioná la obra a relevar.\n' +
      '3. Completá las observaciones del checklist de seguridad y adjuntá fotos de campo si las hubiera.\n' +
      '4. Hacé clic en "Descargar PDF Entregable": el archivo se descarga listo para imprimir o enviar por correo/WhatsApp con firmas correspondientes.',
    practicalExample:
      'Cumplimiento normativo ágil; los informes para la inspección comitente se generan en 2 minutos sin redactar documentos desde cero en Word.'
  });

  // SECTION 5
  drawSectionTitle(
    '5',
    'Logística: Remitos PDF Oficiales y Despachos Automáticos',
    'Abastecimiento & Kardex',
    [15, 58, 103]
  );
  drawFeatureBlock({
    whatWasDone:
      '• Generación automática de Remitos de Entrega en formato PDF con detalle de ítems, cantidades, chofer y firmas de salida y recepción.\n' +
      '• Automatización de Despacho "En Camino": al aprobar la salida de materiales desde Pañol Central, el estado cambia automáticamente para seguimiento en tiempo real.\n' +
      '• Transferencias entre depósitos y obradores con trazabilidad en el Kardex sin duplicar ni distorsionar el stock total de la constructora.',
    howToUse:
      '1. En el módulo de "Inventario" o "Logística", seleccioná "Transferencia de Stock" o "Nuevo Envío".\n' +
      '2. Indicá el depósito de origen (ej. Pañol Central) y el de destino (Obrador de la Obra).\n' +
      '3. Al confirmar la salida, se genera el Remito PDF oficial.\n' +
      '4. Al llegar el material a obra, el capataz o pañolero de destino confirma la recepción y el stock se acredita en el depósito local.',
    practicalExample:
      'Cero pérdida de materiales en tránsito y respaldo físico firmado para auditorías contables.'
  });

  // Footer for all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('ECAR Constructora — Documento Técnico de Procedimientos y Actualizaciones', margin, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  const outputPath = path.resolve('Resumen_Ultimas_Modificaciones_ECAR.pdf');
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, buffer);
  console.log(`PDF generado exitosamente en: ${outputPath}`);

  // Also copy to Desktop if accessible
  try {
    const desktopPath = path.resolve('C:/Users/Sanatorio Argentino/Desktop/Resumen_Ultimas_Modificaciones_ECAR.pdf');
    fs.writeFileSync(desktopPath, buffer);
    console.log(`Copia guardada en el Escritorio: ${desktopPath}`);
  } catch (err) {
    console.warn('No se pudo copiar al Escritorio:', err.message);
  }
}

generatePdf().catch(console.error);
