import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PurchaseRequest } from './types';

const COLOR_NAVY = '#0B2240';
const COLOR_BLUE = '#0284C7';
const COLOR_DARK = '#1E293B';
const FONT = 'helvetica';

async function loadEcarLogo(doc: jsPDF): Promise<boolean> {
  try {
    const res = await fetch('/logoECAR.png');
    if (res.ok) {
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', 40, 30, 110, 38);
      return true;
    }
  } catch (e) {
    console.warn('Logo ECAR no disponible para PDF', e);
  }
  return false;
}

function drawHeaderBar(doc: jsPDF, title: string, subtitle: string, docCode: string) {
  // Top Primary Banner
  doc.setFillColor(11, 34, 64); // ECAR Navy #0B2240
  doc.rect(0, 0, 595, 20, 'F');
  
  // Secondary Accent Line
  doc.setFillColor(2, 132, 199); // ECAR Cyan #0284C7
  doc.rect(0, 20, 595, 3, 'F');

  // Title Box Right
  doc.setFont(FONT, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_NAVY);
  doc.text(title, 250, 48);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#64748B');
  doc.text(subtitle, 250, 62);
  doc.text(`Cód. Doc: ${docCode}  |  Fecha: ${new Date().toLocaleDateString('es-AR')}`, 250, 75);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.line(40, 88, 555, 88);
}

function drawSignatures(doc: jsPDF, yPos: number, leftLabel: string, rightLabel: string) {
  doc.setDrawColor(148, 163, 184);
  
  // Left Signature
  doc.line(60, yPos, 230, yPos);
  doc.setFont(FONT, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK);
  doc.text(leftLabel, 145, yPos + 14, { align: 'center' });
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#94A3B8');
  doc.text('Firma, Aclaración y DNI', 145, yPos + 26, { align: 'center' });

  // Right Signature
  doc.line(365, yPos, 535, yPos);
  doc.setFont(FONT, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK);
  doc.text(rightLabel, 450, yPos + 14, { align: 'center' });
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#94A3B8');
  doc.text('Firma, Aclaración y DNI', 450, yPos + 26, { align: 'center' });
}

function drawFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height || 842;
  doc.setFillColor(11, 34, 64);
  doc.rect(0, pageHeight - 25, 595, 25, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(8);
  doc.setTextColor('#FFFFFF');
  doc.text('ECAR OBRAS Y SERVICIOS — Sistema Integrado de Control e Infraestructura', 40, pageHeight - 10);

  doc.setFont(FONT, 'normal');
  doc.text('www.ecar.com.ar', 555, pageHeight - 10, { align: 'right' });
}

/**
 * 1. PDF: Solicitud de Pedido de Obra
 */
export async function exportRequestPdf(req: PurchaseRequest) {
  const doc = new jsPDF('p', 'pt', 'a4');
  await loadEcarLogo(doc);

  const docCode = `PED-${req.id.slice(0, 8).toUpperCase()}`;
  drawHeaderBar(doc, 'SOLICITUD DE PEDIDO DE OBRA', 'Requerimiento de Insumos y Equipos', docCode);

  let y = 105;

  // Metadata Grid Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, y, 515, 65, 8, 8, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_NAVY);
  doc.text(`OBRA / PROYECTO: ${req.project?.name || 'Barrio San Martín'}`, 55, y + 20);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK);
  doc.text(`Solicitante: ${req.requested_by || 'Jefe de Obra / Capataz'}`, 55, y + 36);
  doc.text(`Prioridad / Urgencia: ${(req.urgency || 'normal').toUpperCase()}`, 55, y + 50);

  doc.text(`Fecha Emisión: ${new Date(req.created_at).toLocaleDateString('es-AR')}`, 320, y + 20);
  doc.text(`Estado: ${(req.status || 'pendiente').toUpperCase()}`, 320, y + 36);
  if (req.notes) {
    doc.text(`Motivo / Destino: ${req.notes.slice(0, 45)}`, 320, y + 50);
  }

  y += 85;

  // Items Table
  const tableData = (req.items || []).map((it, idx) => [
    String(idx + 1),
    it.description,
    `${it.quantity} ${it.unit || 'UN'}`,
    it.estimated_unit_cost > 0 ? `$ ${it.estimated_unit_cost.toLocaleString('es-AR')}` : 'A Cotizar',
    it.estimated_unit_cost > 0 ? `$ ${(it.quantity * it.estimated_unit_cost).toLocaleString('es-AR')}` : '-'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descripción del Ítem / Material', 'Cantidad Solicitada', 'Costo Unit. Est.', 'Total Est.']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: COLOR_DARK },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 230 },
      2: { cellWidth: 90, halign: 'center' },
      3: { cellWidth: 85, halign: 'right' },
      4: { cellWidth: 85, halign: 'right' }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 40;
  drawSignatures(doc, Math.max(finalY, 680), 'Emisor (Obra)', 'Recepción (Pañol / Logística)');
  drawFooter(doc);

  doc.save(`ECAR_Pedido_Obra_${docCode}.pdf`);
}

/**
 * 2. PDF: Remito de Despacho / Pañol (Pedido Enviado)
 */
export async function exportDispatchPdf(req: PurchaseRequest) {
  const doc = new jsPDF('p', 'pt', 'a4');
  await loadEcarLogo(doc);

  const docCode = `REM-${req.id.slice(0, 8).toUpperCase()}`;
  drawHeaderBar(doc, 'REMITO DE DESPACHO / PAÑOL', 'Constancia de Envío de Materiales a Obra', docCode);

  let y = 105;

  // Metadata Grid Box
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(40, y, 515, 65, 8, 8, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_NAVY);
  doc.text(`OBRA DESTINO: ${req.project?.name || 'Barrio San Martín'}`, 55, y + 20);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK);
  doc.text(`Despachante: ${req.dispatched_by || 'Pañolero Central'}`, 55, y + 36);
  doc.text(`Fecha Despacho: ${req.dispatched_at ? new Date(req.dispatched_at).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}`, 55, y + 50);

  doc.text(`Pedido Referencia: PED-${req.id.slice(0, 8).toUpperCase()}`, 320, y + 20);
  doc.text(`Prioridad: ${(req.urgency || 'normal').toUpperCase()}`, 320, y + 36);
  doc.text(`Estado Envío: COMPLETO / CON SALDO`, 320, y + 50);

  y += 85;

  // Items Table (Requested vs Sent vs Balance)
  const tableData = (req.items || []).map((it, idx) => {
    const requested = it.quantity || 0;
    const sent = it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : requested;
    const missing = Math.max(0, requested - sent);
    const destination = missing > 0 ? `⚠️ ${missing} ${it.unit} a Compras` : '✅ Entregado 100%';

    return [
      String(idx + 1),
      it.description,
      `${requested} ${it.unit || 'UN'}`,
      `${sent} ${it.unit || 'UN'}`,
      `${missing} ${it.unit || 'UN'}`,
      destination
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descripción de Materiales', 'Solicitado', 'Enviado', 'Faltante', 'Estado de Saldo']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLOR_BLUE, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: COLOR_DARK },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 180 },
      2: { cellWidth: 70, halign: 'center' },
      3: { cellWidth: 70, halign: 'center' },
      4: { cellWidth: 60, halign: 'center' },
      5: { cellWidth: 110, halign: 'left' }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 40;
  drawSignatures(doc, Math.max(finalY, 680), 'Despachante (Pañol Central)', 'Chofer / Receptor Obra');
  drawFooter(doc);

  doc.save(`ECAR_Remito_Despacho_${docCode}.pdf`);
}

/**
 * 3. PDF: Acta de Recepción y Trazabilidad Tripartita
 */
export async function exportThreeWayComparisonPdf(req: PurchaseRequest) {
  const doc = new jsPDF('p', 'pt', 'a4');
  await loadEcarLogo(doc);

  const docCode = `TRAZ-${req.id.slice(0, 8).toUpperCase()}`;
  drawHeaderBar(doc, 'ACTA DE RECEPCIÓN & TRAZABILIDAD', 'Comparativa: Solicitado vs Enviado vs Recibido', docCode);

  let y = 105;

  // Metadata Grid Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, y, 515, 65, 8, 8, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_NAVY);
  doc.text(`OBRA: ${req.project?.name || 'Barrio San Martín'}`, 55, y + 20);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK);
  doc.text(`Solicitado Por: ${req.requested_by || 'Jefe de Obra'}`, 55, y + 36);
  doc.text(`Despachado Por: ${req.dispatched_by || 'Pañol Central'}`, 55, y + 50);

  doc.text(`Receptor Obra: ${req.received_by || 'Receptor de Campo'}`, 320, y + 20);
  doc.text(`Fecha Recepción: ${req.received_at ? new Date(req.received_at).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}`, 320, y + 36);
  doc.text(`Conformidad: COMPLETA CON OBSERVACIONES`, 320, y + 50);

  y += 85;

  // 3-Way Comparison Table
  const tableData = (req.items || []).map((it, idx) => {
    const requested = it.quantity || 0;
    const sent = it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : requested;
    const received = it.quantity_received !== undefined && it.quantity_received !== null ? it.quantity_received : sent;
    const diff = requested - received;
    const status = diff === 0 ? 'OK Completo' : diff > 0 ? `Pendiente ${diff} ${it.unit}` : 'Excedente';

    return [
      String(idx + 1),
      it.description,
      `${requested} ${it.unit || 'UN'}`,
      `${sent} ${it.unit || 'UN'}`,
      `${received} ${it.unit || 'UN'}`,
      status
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Material / Insumo', '1. Solicitado', '2. Enviado Pañol', '3. Recibido Obra', 'Trazabilidad']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: COLOR_DARK },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 170 },
      2: { cellWidth: 75, halign: 'center' },
      3: { cellWidth: 75, halign: 'center' },
      4: { cellWidth: 75, halign: 'center' },
      5: { cellWidth: 95, halign: 'center' }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 40;
  drawSignatures(doc, Math.max(finalY, 680), 'Responsable Pañol', 'Receptor de Campo / Obra');
  drawFooter(doc);

  doc.save(`ECAR_Trazabilidad_Tripartita_${docCode}.pdf`);
}
