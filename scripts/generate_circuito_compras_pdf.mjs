import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

async function generateCircuitPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const NAVY = [11, 34, 64];      // #0B2240
  const BLUE = [2, 132, 199];     // #0284C7
  const SLATE_DARK = [30, 41, 59];
  const GRAY_BG = [248, 250, 252];
  const BORDER_COLOR = [226, 232, 240];

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      drawPageHeader();
      y = 18;
    }
  };

  const drawPageHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(margin, 8, contentWidth, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(11, 34, 64);
    doc.text('ECAR CONSTRUCTORA — GUIA OPERATIVA Y CIRCUITO DE COMPRAS & LOGISTICA', margin, 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('DOC: PR-GC-LOG-01 | VERSION 2.0', pageWidth - margin, 6.5, { align: 'right' });
  };

  const drawFooter = () => {
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Pagina ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
      doc.text('Sistema de Gestion Integral ECAR — Documentacion de Procesos', margin, pageHeight - 6);
      doc.text('Confidencial / Uso Interno', pageWidth - margin, pageHeight - 6, { align: 'right' });
    }
  };

  // Header Cover
  const drawCover = () => {
    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'F');

    // Logo
    try {
      const logoPath = path.resolve('public/logoECAR.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath).toString('base64');
        doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', margin + 5, y + 5, 36, 17);
      }
    } catch (e) {
      console.warn('Logo no disponible:', e);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CIRCUITO DE ORDENES DE COMPRA & LOGISTICA', margin + 46, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(186, 215, 248);
    doc.text('Manual de Operacion en Sistema, Circuitos de Aprobacion y Roles (Ezequiel / Paniol / Compras)', margin + 46, y + 18);

    doc.setFontSize(7.5);
    doc.setTextColor(220, 235, 252);
    doc.text('Estado: 100% OPERATIVO EN SISTEMA | Base de Datos Conectada y Compilacion Exitosa', margin + 46, y + 25);

    y += 38;
  };

  const drawSectionTitle = (num, title, badgeText, badgeColor = NAVY) => {
    checkPageBreak(16);
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`${num}. ${title.toUpperCase()}`, margin + 4, y + 5.2);

    if (badgeText) {
      doc.setFontSize(7.5);
      doc.text(badgeText, pageWidth - margin - 4, y + 5.2, { align: 'right' });
    }
    y += 10.5;
  };

  const drawCard = (title, items, prefix = '[>]') => {
    // Calculate total wrapped lines
    const textWidth = contentWidth - 14;
    const processedItems = items.map(it => {
      const fullText = `${it}`;
      return doc.splitTextToSize(fullText, textWidth);
    });

    const totalLines = processedItems.reduce((acc, lines) => acc + lines.length, 0);
    const cardHeight = totalLines * 3.8 + 10;

    checkPageBreak(cardHeight + 4);

    doc.setFillColor(...GRAY_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

    // Accent line
    doc.setFillColor(...BLUE);
    doc.roundedRect(margin, y, 2.5, cardHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(`${prefix} ${title}`, margin + 6, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(51, 65, 85);

    let lineY = y + 9.5;
    processedItems.forEach(lines => {
      lines.forEach((l, idx) => {
        if (idx === 0) {
          doc.text(`- ${l}`, margin + 6, lineY);
        } else {
          doc.text(`  ${l}`, margin + 6, lineY);
        }
        lineY += 3.8;
      });
      lineY += 0.6;
    });

    y += cardHeight + 4;
  };

  // ──────────────────────────── DOCUMENT FLOW ────────────────────────────

  drawCover();

  // 1. ESTADO DEL SISTEMA
  drawSectionTitle('1', 'Estado Actual y Validacion Tecnica', 'SISTEMA 100% OPERATIVO', [16, 185, 129]);
  drawCard(
    'Confirmacion de Funcionamiento en Produccion',
    [
      'Modulo Ordenes de Compra (OC / OT): Totalmente activo en Gerencia de Compras > OC / OT.',
      'Modulo Pedidos de Obra y Logistica: Totalmente activo en Gerencia de Logistica > Pedidos de Obra.',
      'Sincronizacion Cloud: Ambas tablas (purchase_orders y purchase_requests) estan conectadas a Supabase con datos reales y operativos.',
      'Integridad de Codigo: Build de produccion verificado con exito (0 errores de compilacion en TypeScript y Vite).'
    ],
    '[OK]'
  );

  // 2. EL CIRCUITO INTEGRAL (DIAGRAMA CONCEPTUAL)
  drawSectionTitle('2', 'El Circuito Paso a Paso: Como es el Flujo?', 'FLUJO ESTANDAR ECAR', NAVY);

  const stepBoxWidth = (contentWidth - 6) / 3;
  const stepBoxHeight = 31;

  checkPageBreak(stepBoxHeight + 6);

  // Box 1: Pedido
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(margin, y, stepBoxWidth, stepBoxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...NAVY);
  doc.text('PASO 1: PEDIDO DE OBRA', margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('El Jefe de Obra o sector solicita', margin + 3, y + 10);
  doc.text('materiales ingresando obra, items,', margin + 3, y + 14);
  doc.text('cantidades y fecha requerida.', margin + 3, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('Estado: "En Logistica / Paniol"', margin + 3, y + 25);

  // Box 2: Logística (Ezequiel)
  const x2 = margin + stepBoxWidth + 3;
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(x2, y, stepBoxWidth, stepBoxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(67, 56, 202);
  doc.text('PASO 2: LOGISTICA / PANIOL', x2 + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Ezequiel evalua stock disponible:', x2 + 3, y + 10);
  doc.text('• Si hay stock: Despacha con remito.', x2 + 3, y + 15);
  doc.text('• Si falta stock: Presiona el boton', x2 + 3, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('"Derivar a Compras" (saldo faltante)', x2 + 3, y + 25);

  // Box 3: Compras & OC
  const x3 = x2 + stepBoxWidth + 3;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(x3, y, stepBoxWidth, stepBoxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(6, 95, 70);
  doc.text('PASO 3: COMPRAS & EMISION OC', x3 + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Compras recibe la solicitud, cotiza', x3 + 3, y + 10);
  doc.text('con proveedores y genera la OC:', x3 + 3, y + 14);
  doc.text('• Hasta $5M: Emision directa.', x3 + 3, y + 18);
  doc.text('• Mas de $5M: Requiere Aprobacion GG.', x3 + 3, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('Descarga de Remito / OC oficial en PDF', x3 + 3, y + 27);

  y += stepBoxHeight + 5;

  // 3. MATRIZ DE APROBACIONES
  drawSectionTitle('3', 'Matriz de Aprobaciones: Debe Esperar Aprobacion?', 'REGLAS DE NEGOCIO', [217, 119, 6]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.2, cellPadding: 2 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
    columns: [
      { header: 'Tipo de Accion / Monto', dataKey: 'tipo' },
      { header: 'Requiere Aprobacion?', dataKey: 'requiere' },
      { header: 'Quien Autoriza?', dataKey: 'autoriza' },
      { header: 'Comportamiento en Sistema', dataKey: 'comportamiento' },
    ],
    body: [
      {
        tipo: 'Ezequiel deriva saldo faltante a Compras',
        requiere: 'NO',
        autoriza: 'N/A (Pasa Directo)',
        comportamiento: 'El pedido crea directamente la solicitud borrador en Compras para que el area empiece a cotizar de inmediato sin frenar el flujo.'
      },
      {
        tipo: 'Orden de Compra hasta $5.000.000',
        requiere: 'NO',
        autoriza: 'Compras / Operador',
        comportamiento: 'Se guarda con estado "Emitida" o "Borrador" y approval_status = "no_requerida". Lista para imprimir PDF y enviar al proveedor.'
      },
      {
        tipo: 'Orden de Compra superior a $5.000.000',
        requiere: 'SI (Obligatoria)',
        autoriza: 'Gerencia General (GG) / Direccion',
        comportamiento: 'El sistema bloquea la emision final, cambia el estado a "Pend. Aprobacion" y emite alerta visual hasta que GG la autorice formalmente.'
      },
      {
        tipo: 'Compras mayores a $500.000 (PR-GC-01 §4.5)',
        requiere: 'Cuadro Comparativo',
        autoriza: 'Auditoria / Compras',
        comportamiento: 'El formulario cuenta con una seccion para volcar al menos 3 cotizaciones de proveedores para justificar la eleccion del adjudicatario.'
      }
    ]
  });

  y = doc.lastAutoTable.finalY + 4;

  // 4. GUÍA PRÁCTICA PARA EZEQUIEL (LOGÍSTICA)
  drawSectionTitle('4', 'Guia Paso a Paso para Ezequiel (Logistica y Paniol)', 'INSTRUCTIVO EZEQUIEL', BLUE);

  drawCard(
    'Acciones dentro de "Gerencia Logistica > Pedidos de Obra"',
    [
      '1. Entrar al menu lateral izquierdo: Hacer clic en "Gerencia Logistica" y luego en "Pedidos de Obra".',
      '2. Buscar el pedido: En la lista vera los pedidos en color amarillo ("En Logistica / Paniol") con el detalle de materiales solicitados.',
      '3. Evaluar disponibilidad: Si desea ver la cobertura de stock, hace clic en "Evaluar Resolucion (10/6/4)". El sistema le muestra que hay fisico en paniol y que falta.',
      '4. Despacho lo que tengo en Paniol: Hace clic en "Despachar", selecciona chofer, vehiculo de flota y las cantidades enviadas. Se emite el remito de despacho.',
      '5. Lo que no tengo en Paniol (Faltantes): Hace clic en "Derivar a Compras". En pantalla confirma los saldos faltantes y presiona "Confirmar Derivacion a Compras". No necesita esperar ninguna aprobacion previa para pasarle el requerimiento a Compras.'
    ],
    '[PANIOL]'
  );

  // FORCE SECTION 5 TO START CLEANLY ON PAGE 2
  checkPageBreak(85);

  // 5. GUÍA PRÁCTICA PARA EMITIR UNA ORDEN DE COMPRA (OC)
  drawSectionTitle('5', 'Guia Paso a Paso para Emision de una Orden de Compra (OC / OT)', 'INSTRUCTIVO COMPRAS', NAVY);

  drawCard(
    'Acciones dentro de "Gerencia Compras > OC / OT"',
    [
      '1. Entrar al menu lateral izquierdo: Hacer clic en "Gerencia Compras" y luego en "OC / OT".',
      '2. Crear nueva orden: Hacer clic en el boton superior "+ Nueva OC / OT". El sistema asigna automaticamente el numero correlativo (ej. OC-0002).',
      '3. Seleccionar Proveedor y Proyecto: Elegir el proveedor del listado (o tipear uno nuevo) y asignar la obra correspondiente (o uso general).',
      '4. Vincular Pedido de Obra (Trazabilidad): En el campo "Solicitud Origen" se puede asociar el pedido derivado por Ezequiel para que quede la trazabilidad completa desde la obra hasta la compra.',
      '5. Cargar Items y Precios: Ingresar descripcion, cantidad, unidad y precio unitario. El sistema calcula subtotales y el monto total en tiempo real.',
      '6. Guardar y Descargar PDF: Presionar "Guardar OC". En la tabla principal, hacer clic en el icono de descarga (naranja) para obtener el PDF oficial con formato institucional y lineas de firma para entregar al proveedor.'
    ],
    '[COMPRAS]'
  );

  // 6. RESUMEN EJECUTIVO PARA WHATSAPP
  drawSectionTitle('6', 'Respuesta Sintetica para Transmitir al Interlocutor', 'TEXTO CLAVE', [79, 70, 229]);

  drawCard(
    'Puntos Clave para Despejar Dudas',
    [
      '• "Esta en funcionamiento?" -> SI, tanto la derivacion desde Logistica como la emision formal de la OC estan 100% activas y sincronizadas en la base de datos.',
      '• "Ezequiel debe esperar aprobacion?" -> NO para pedir insumos a Compras. Ezequiel deriva el faltante directamente y Compras ya puede cotizar de inmediato.',
      '• "Cuando hay aprobacion?" -> Solo cuando la Orden de Compra final supera los $5.000.000, en cuyo caso interviene Gerencia General para autorizar el desembolso.'
    ],
    '[INFO]'
  );

  drawFooter();

  const outputPath = path.resolve('Circuito_Ordenes_de_Compra_y_Logistica_ECAR.pdf');
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
  console.log(`PDF generado con exito en: ${outputPath}`);
}

generateCircuitPdf().catch(err => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
