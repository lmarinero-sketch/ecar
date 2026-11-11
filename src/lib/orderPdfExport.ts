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
  doc.text(`OBRA / PROYECTO: ${(req.project?.name || 'Barrio San Martín').replace(/\n/g, ' - ')}`, 55, y + 20);

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
  doc.text(`OBRA DESTINO: ${(req.project?.name || 'Barrio San Martín').replace(/\n/g, ' - ')}`, 55, y + 20);

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
  doc.text(`OBRA: ${(req.project?.name || 'Barrio San Martín').replace(/\n/g, ' - ')}`, 55, y + 20);

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
  let hasInconsistencies = false;

  const tableData = (req.items || []).map((it, idx) => {
    const requested = it.quantity || 0;
    const sent = it.quantity_sent !== undefined && it.quantity_sent !== null ? it.quantity_sent : requested;
    const received = it.quantity_received !== undefined && it.quantity_received !== null ? it.quantity_received : sent;
    const missingReception = sent - received;
    const diff = requested - received;
    
    let status = '';
    if (missingReception > 0) {
      status = `⚠️ Inconsistencia: Faltaron ${missingReception} ${it.unit}`;
      hasInconsistencies = true;
    } else if (diff === 0) {
      status = 'OK Completo';
    } else if (diff > 0) {
      status = `Pendiente ${diff} ${it.unit}`;
    } else {
      status = 'Excedente';
    }

    return [
      String(idx + 1),
      it.description,
      `${requested} ${it.unit || 'UN'}`,
      `${sent} ${it.unit || 'UN'}`,
      `${received} ${it.unit || 'UN'}`,
      status
    ];
  });

  doc.text(`Conformidad: ${hasInconsistencies ? 'CON INCONSISTENCIAS GRAVES' : 'COMPLETA / CONFORME'}`, 320, y - 35);

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
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.row.raw[5].includes('Inconsistencia')) {
        data.cell.styles.textColor = '#DC2626'; // red-600
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 40;
  drawSignatures(doc, Math.max(finalY, 680), 'Responsable Pañol', 'Receptor de Campo / Obra');
  drawFooter(doc);

  doc.save(`ECAR_Trazabilidad_Tripartita_${docCode}.pdf`);
}

/**
 * 4. PDF: Remito de Despacho Manual (Inventario)
 */
export async function exportManualDispatchPdf(data: {
  project_name: string;
  dispatched_by: string;
  delivered_to?: string;
  notes: string;
  items: { description: string; quantity: number; unit: string }[];
}) {
  const doc = new jsPDF('p', 'pt', 'a4');
  await loadEcarLogo(doc);

  const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
  const docCode = `REM-${randomId}`;
  drawHeaderBar(doc, 'REMITO DE DESPACHO INTERNO', 'Salida de Materiales / Pañol', docCode);

  let y = 105;

  // Metadata Grid Box
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(40, y, 515, 65, 8, 8, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_NAVY);
  doc.text(`OBRA / DESTINO: ${(data.project_name || 'No especificado').replace(/\n/g, ' - ')}`, 55, y + 20);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK);
  doc.text(`Despachante: ${data.dispatched_by || 'Pañolero'}`, 55, y + 36);
  doc.text(`Receptor / Retira: ${data.delivered_to || 'Personal de Obra'}`, 55, y + 50);

  doc.text(`ID Despacho: ${docCode}`, 320, y + 20);
  doc.text(`Fecha Despacho: ${new Date().toLocaleDateString('es-AR')}`, 320, y + 36);
  if (data.notes) {
    doc.text(`Notas: ${data.notes.slice(0, 45)}`, 320, y + 50);
  }

  y += 85;

  // Items Table
  const tableData = (data.items || []).map((it, idx) => [
    String(idx + 1),
    it.description,
    `${it.quantity} ${it.unit || 'UN'}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descripción de Materiales', 'Cantidad Enviada']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLOR_BLUE, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: COLOR_DARK },
    columnStyles: {
      0: { cellWidth: 40, halign: 'center' },
      1: { cellWidth: 350 },
      2: { cellWidth: 125, halign: 'center' }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 40;
  drawSignatures(doc, Math.max(finalY, 680), `Despachante (${data.dispatched_by || 'Pañol Central'})`, `Receptor (${data.delivered_to || 'Obra'})`);
  drawFooter(doc);

  doc.save(`ECAR_Remito_Manual_${docCode}.pdf`);
}

/**
 * 5. PDF: Orden de Compra / Remito OC
 */
export async function exportPurchaseOrderPdf(po: import('./types').PurchaseOrder) {
  const doc = new jsPDF('p', 'pt', 'a4');
  await loadEcarLogo(doc);

  const docCode = po.po_number || `OC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  drawHeaderBar(doc, 'ORDEN DE COMPRA / SERVICIO', 'Documento Oficial ECAR', docCode);

  let y = 105;

  // Metadata Grid Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, y, 515, 65, 8, 8, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_NAVY);
  doc.text(`PROVEEDOR: ${po.supplier_name || 'No especificado'}`, 55, y + 20);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK);
  doc.text(`Proyecto / Destino: ${(po.project?.name || 'Central').replace(/\n/g, ' - ')}`, 55, y + 36);
  doc.text(`Condición Pago: ${po.payment_condition || 'A convenir'}`, 55, y + 50);

  doc.text(`Fecha Emisión: ${new Date(po.created_at).toLocaleDateString('es-AR')}`, 320, y + 20);
  doc.text(`Entrega: ${po.delivery_date ? new Date(po.delivery_date).toLocaleDateString('es-AR') : 'A convenir'}`, 320, y + 36);
  doc.text(`Estado: ${(po.status || 'Emitida').toUpperCase()}`, 320, y + 50);

  y += 85;

  // Items Table
  const tableData = (po.items || []).map((it: any, idx: number) => [
    String(idx + 1),
    it.description,
    `${it.quantity} ${it.unit || 'UN'}`,
    `$ ${(it.unit_price || 0).toLocaleString('es-AR')}`,
    `$ ${(it.subtotal || 0).toLocaleString('es-AR')}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: COLOR_DARK },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 230 },
      2: { cellWidth: 70, halign: 'center' },
      3: { cellWidth: 95, halign: 'right' },
      4: { cellWidth: 95, halign: 'right' }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  
  doc.setFont(FONT, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_NAVY);
  doc.text(`TOTAL OC: $ ${(po.total_amount || 0).toLocaleString('es-AR')}`, 390, finalY + 25);

  drawSignatures(doc, Math.max(finalY + 80, 680), 'Emisor (Compras)', 'Autorización / Gerencia');
  drawFooter(doc);

  doc.save(`ECAR_${docCode}.pdf`);
}

/**
 * 6. Impresión de Remito en formato Ticket Térmico 55 mm (ancho útil 48-50 mm) con QR
 */
export interface Ticket55mmRemitoPayload {
  remitoNumber?: string;
  date?: string | Date;
  obra?: string;
  destination?: string;
  origin?: string;
  responsable?: string;
  driverOrReceiver?: string;
  despachante?: string;
  dispatchedBy?: string;
  notes?: string;
  items: Array<{ code?: string; quantity: number; unit?: string; description: string }>;
}

export function printTicket55mmRemito(payload: Ticket55mmRemitoPayload) {
  const remitoNum =
    payload.remitoNumber ||
    `0001-${String(Math.floor(100000 + Math.random() * 900000)).padStart(8, '0')}`;
  const fechaStr =
    payload.date instanceof Date
      ? payload.date.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : payload.date ||
        new Date().toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  const obraStr = payload.obra || payload.destination || 'Pañol Central / Obra';
  const respStr = payload.responsable || payload.driverOrReceiver || 'Personal Autorizado';
  const qrData = encodeURIComponent(
    `ECAR|REMITO:${remitoNum}|FECHA:${fechaStr}|OBRA:${obraStr}|RESP:${respStr}|ITEMS:${payload.items.length}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${qrData}`;

  const itemsHtml = (payload.items || [])
    .map(
      it => `
      <div class="item-row">
        <span class="qty">${it.quantity}${it.unit ? ` ${it.unit}` : ''} x</span>
        <span class="desc">${it.description}</span>
      </div>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ticket Remito 55mm — ${remitoNum}</title>
  <style>
    @page {
      size: 55mm auto;
      margin: 2mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      background: #ffffff !important;
    }
    body {
      width: 49mm;
      max-width: 49mm;
      margin: 0 auto;
      padding: 1.5mm 0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      line-height: 1.25;
    }
    .center { text-align: center; }
    .brand {
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .subtitle {
      font-size: 8pt;
      font-weight: bold;
      margin-top: 1px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    .meta {
      font-size: 8pt;
      margin: 2px 0;
      word-break: break-word;
    }
    .meta strong { font-weight: bold; }
    .item-row {
      display: flex;
      gap: 4px;
      font-size: 8.5pt;
      margin: 2.5px 0;
      align-items: flex-start;
    }
    .qty {
      font-weight: bold;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .desc {
      word-break: break-word;
      flex: 1;
    }
    .sign-area {
      margin-top: 14px;
      font-size: 8pt;
    }
    .sign-line {
      border-bottom: 1px solid #000;
      height: 18px;
      margin-bottom: 3px;
    }
    .qr-box {
      margin-top: 8px;
      text-align: center;
    }
    .qr-box img {
      width: 28mm;
      height: 28mm;
      display: inline-block;
    }
    .no-print {
      margin-bottom: 8px;
      text-align: center;
    }
    .no-print button {
      padding: 5px 10px;
      font-family: sans-serif;
      font-size: 11px;
      font-weight: bold;
      border: 1px solid #000;
      cursor: pointer;
    }
    @media print {
      .no-print { display: none !important; }
      body { width: 49mm; max-width: 49mm; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ Imprimir Ticket (55mm)</button>
  </div>
  <div class="center">
    <div class="brand">ECAR</div>
    <div class="subtitle">CONSTRUCCIONES · PAÑOL</div>
    <div class="subtitle">REMITO N° ${remitoNum}</div>
  </div>
  <div class="divider"></div>
  <div class="meta"><strong>Fecha:</strong> ${fechaStr}</div>
  <div class="meta"><strong>Obra:</strong> ${obraStr}</div>
  <div class="meta"><strong>Resp.:</strong> ${respStr}</div>
  ${payload.despachante ? `<div class="meta"><strong>Desp.:</strong> ${payload.despachante}</div>` : ''}
  <div class="divider"></div>
  <div class="meta"><strong>DETALLE DE ÍTEMS (${payload.items.length})</strong></div>
  ${itemsHtml || '<div class="meta">Sin ítems detallados</div>'}
  ${payload.notes ? `<div class="divider"></div><div class="meta"><strong>Obs.:</strong> ${payload.notes}</div>` : ''}
  <div class="divider"></div>
  <div class="sign-area">
    <div class="sign-line"></div>
    <div class="center">Firma y Aclaración Receptor</div>
  </div>
  <div class="qr-box">
    <img src="${qrUrl}" alt="QR Remito" onload="setTimeout(function(){ window.print(); }, 250);" />
    <div style="font-size:7pt; margin-top:2px;">${remitoNum}</div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=360,height=640');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function exportDispatchTicket55mm(req: PurchaseRequest) {
  const shortId = req.id ? req.id.slice(0, 8).toUpperCase() : '00000001';
  printTicket55mmRemito({
    remitoNumber: `0001-${shortId}`,
    date: req.dispatched_at
      ? new Date(req.dispatched_at).toLocaleString('es-AR')
      : new Date().toLocaleString('es-AR'),
    obra: req.project?.name || 'Obra Central',
    responsable: req.received_by || req.requested_by || 'Jefe de Obra',
    despachante: req.dispatched_by || 'Pañol Central',
    notes: req.notes || undefined,
    items: (req.items || []).map(it => ({
      quantity: it.quantity_sent ?? it.quantity ?? 1,
      unit: it.unit || 'u',
      description: it.description,
    })),
  });
}
