import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';
import { supabase } from './supabase';
import type { Opportunity } from './types';

// ECAR Institutional Colors
const COLOR_BLUE = '#0B2240'; 
const COLOR_RED = '#D22027'; 
const FONT_TITLE = 'helvetica';

const WORK_TYPES: Record<string, string> = {
  obra_nueva: 'Obra Nueva',
  adicional: 'Adicional',
  servicio: 'Servicio',
  mantenimiento: 'Mantenimiento',
  licitacion: 'Licitación',
  cambio_alcance: 'Cambio de Alcance',
  consulta: 'Consulta',
};

export const exportOpportunityPdf = async (opportunity: Opportunity, projectName?: string) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  
  // Attempt to load ECAR logo
  try {
    const imgUrl = '/logoECAR.png';
    const response = await fetch(imgUrl);
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      // (base64, format, x, y, width, height)
      // logoECAR.png has different proportions, let's make it a bit wider if it's rectangular
      doc.addImage(base64, 'PNG', 40, 40, 100, 35);
    }
  } catch (e) {
    console.warn("No se pudo cargar el logo para el PDF", e);
  }

  // Right Header Text
  doc.setFont(FONT_TITLE, 'bold');
  doc.setTextColor(COLOR_BLUE);
  doc.setFontSize(16);
  doc.text('RESUMEN DE OPORTUNIDAD', 250, 55);
  doc.text('COMERCIAL (CRM)', 250, 75);

  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#666666');
  doc.setFontSize(10);
  doc.text('Cód: OPP-CRM-01', 250, 100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 250, 115);

  // Horizontal Color Bar
  const barY = 140;
  const barHeight = 12;
  // Red part
  doc.setFillColor(COLOR_RED);
  doc.rect(40, barY, 150, barHeight, 'F');
  // Blue part
  doc.setFillColor(COLOR_BLUE);
  doc.rect(190, barY, 365, barHeight, 'F');

  // Main Title
  doc.setFont(FONT_TITLE, 'bold');
  doc.setTextColor(COLOR_RED);
  doc.setFontSize(14);
  doc.text(`Ficha de oportunidad: ${opportunity.client_name.toUpperCase()}`, 40, 190);

  // Subtitle
  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#333333');
  doc.setFontSize(10);
  doc.text('Detalles comerciales, alcance estimado y estado actual de la oportunidad en el Pipeline.', 40, 210);

  // Helper formatting functions
  const fmtMoney = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : '-';
  const fmtStage = (s: string) => s.replace(/_/g, ' ').toUpperCase();

  // General Table Data mapping
  const generalData = [
    ['Cliente / Prospecto', opportunity.client_name],
    ['Contacto Comercial', opportunity.client_contact || 'No registrado'],
    ['Proyecto Vinculado', projectName || 'Sin proyecto asociado'],
    ['Tipo de Trabajo', WORK_TYPES[opportunity.work_type] || opportunity.work_type],
    ['Etapa en Pipeline', fmtStage(opportunity.stage)],
    ['Monto Estimado', fmtMoney(opportunity.estimated_amount)],
    ['Plazo de Ejecución Estimado', fmtDate(opportunity.estimated_deadline || '')],
    ['Prioridad Operativa', opportunity.priority.toUpperCase()],
    ['Nivel de Riesgo', opportunity.risk_level.toUpperCase()],
    ['Ubicación de la Obra', opportunity.location || 'No especificada'],
    ['Descripción del Alcance', opportunity.description || 'Sin descripción']
  ];

  let currentY = 230;

  // Draw General Table
  autoTable(doc, {
    startY: currentY,
    body: generalData,
    theme: 'grid',
    styles: {
      font: FONT_TITLE,
      fontSize: 9,
      cellPadding: 6,
      textColor: '#333333',
      lineColor: '#e5e7eb',
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLOR_BLUE, cellWidth: 140, fillColor: '#f8fafc' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 40, right: 40 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Extra Details Table (Checklist, Assumptions, Exclusions)
  const extraData = [];
  
  if (opportunity.documentation_checklist) {
    const checks = opportunity.documentation_checklist;
    const checklistItems = [
      checks.planos ? 'Planos (Sí)' : 'Planos (No)',
      checks.pliego ? 'Pliego (Sí)' : 'Pliego (No)',
      checks.memoria_tecnica ? 'Memoria T. (Sí)' : 'Memoria T. (No)',
      checks.visita_obra ? 'Visita (Sí)' : 'Visita (No)',
      checks.fotos ? 'Fotos (Sí)' : 'Fotos (No)'
    ].join(' | ');
    extraData.push(['Checklist de Documentación', checklistItems]);
  }

  if (opportunity.assumptions) {
    extraData.push(['Supuestos de Cotización', opportunity.assumptions]);
  }
  if (opportunity.exclusions) {
    extraData.push(['Exclusiones Técnicas', opportunity.exclusions]);
  }

  if (extraData.length > 0) {
    autoTable(doc, {
      startY: currentY,
      body: extraData,
      theme: 'grid',
      styles: {
        font: FONT_TITLE,
        fontSize: 9,
        cellPadding: 6,
        textColor: '#333333',
        lineColor: '#e5e7eb',
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: COLOR_RED, cellWidth: 140, fillColor: '#fff1f2' },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 40, right: 40 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 20;
  }

  // Footer Text
  const finalY = currentY + 20;
  
  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#888888');
  doc.setFontSize(8);
  
  const footerText = 'Este documento es de uso exclusivamente interno y comercial de ECAR Construcciones. Contiene información confidencial sobre presupuestos, plazos e información estratégica del prospecto comercial.';
  
  // Wrap text to fit page width
  const wrappedFooter = doc.splitTextToSize(footerText, 515);
  doc.text(wrappedFooter, 40, finalY);

  // Generar el base PDF como array buffer
  const pdfArrayBuffer = doc.output('arraybuffer');

  try {
    // Cargar en pdf-lib
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

    // Fetch files directly if not passed in the object
    let filesToAttach = opportunity.files || [];
    if (!filesToAttach.length) {
      const { data: fetchedFiles, error: fetchErr } = await supabase
        .from('opportunity_files')
        .select('*')
        .eq('opportunity_id', opportunity.id);
      
      if (!fetchErr && fetchedFiles) {
        filesToAttach = fetchedFiles;
      }
    }

    // Adjuntar archivos si existen
    if (filesToAttach.length > 0) {
      for (const file of filesToAttach) {
        try {
          const { data, error } = await supabase.storage
            .from('opportunity-files')
            .download(file.file_url);

          if (error || !data) {
            console.warn(`No se pudo descargar el archivo: ${file.title}`);
            continue;
          }

          const fileBytes = await data.arrayBuffer();
          const cleanFileName = (file.title || 'archivo').replace(/[^a-zA-Z0-9.\-_]/g, '_');
          
          await pdfDoc.attach(new Uint8Array(fileBytes), cleanFileName, {
            mimeType: file.file_type || 'application/octet-stream',
            description: file.observations || 'Archivo adjunto de la oportunidad',
            creationDate: new Date(file.created_at || new Date()),
            modificationDate: new Date(file.created_at || new Date()),
          });
        } catch (err) {
          console.warn(`Error adjuntando archivo ${file.title}:`, err);
        }
      }
    }

    const finalPdfBytes = await pdfDoc.save();

    // Descargar en navegador
    const filename = `ECAR_Oportunidad_${opportunity.client_name.replace(/\s+/g, '_')}.pdf`;
    const blob = new Blob([finalPdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error procesando PDF embebido, guardando fallback...", err);
    // Fallback: guardar el original de jsPDF sin embebidos si algo falla catastroficamente
    const filename = `ECAR_Oportunidad_${opportunity.client_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  }
};

export const exportBudgetPdf = async (budget: any, sections: any[], items: any[]) => {
  const doc = new jsPDF({ format: 'a4', unit: 'pt' });
  const PAGE_WIDTH = doc.internal.pageSize.width;

  // Logo
  try {
    const response = await fetch('/logoECAR.png');
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', 40, 40, 100, 35);
    }
  } catch (e) {
    console.warn('Logo no se pudo cargar', e);
  }

  doc.setFont(FONT_TITLE, 'bold');
  doc.setTextColor(COLOR_BLUE);
  doc.setFontSize(22);
  doc.text('Presupuesto de Obra', 170, 60);

  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#666666');
  doc.setFontSize(10);
  doc.text(`Presupuesto: ${budget.name}`, 170, 80);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, 170, 95);

  let currentY = 130;

  // Items grouped by section
  const itemsBySection: Record<string, any[]> = { _nosection: [] };
  sections.forEach(s => { itemsBySection[s.id] = []; });
  items.forEach(item => {
    const key = item.section_id || '_nosection';
    if (!itemsBySection[key]) itemsBySection[key] = [];
    itemsBySection[key].push(item);
  });

  const tableBody: any[] = [];
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  const addSectionToTable = (secId: string, secName: string) => {
    const secItems = itemsBySection[secId] || [];
    if (secItems.length === 0) return;

    // Header row for section
    tableBody.push([
      { content: secName, colSpan: 5, styles: { fillColor: '#e0f2fe', textColor: '#0369a1', fontStyle: 'bold' } }
    ]);

    let secTotal = 0;
    secItems.forEach(item => {
      const lineTotal = item.quantity * item.unit_price_ars;
      secTotal += lineTotal;
      tableBody.push([
        item.description,
        item.unit,
        item.quantity.toLocaleString('es-AR'),
        `$${item.unit_price_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
        `$${lineTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
      ]);
    });

    // Subtotal row for section
    tableBody.push([
      { content: `Subtotal ${secName}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', textColor: '#4b5563' } },
      { content: `$${secTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', textColor: '#111827' } }
    ]);
  };

  sortedSections.forEach(s => addSectionToTable(s.id, `${s.ordinal} - ${s.name}`));
  addSectionToTable('_nosection', 'Ítems sin rubro');

  if (tableBody.length === 0) {
    tableBody.push([{ content: 'No hay ítems cargados en este presupuesto', colSpan: 5, styles: { halign: 'center' } }]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Descripción', 'Unidad', 'Cantidad', 'P. Unitario', 'Subtotal']],
    body: tableBody,
    theme: 'grid',
    styles: { font: FONT_TITLE, fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: COLOR_BLUE, textColor: '#ffffff', fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 60 },
      3: { halign: 'right', cellWidth: 80 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 90 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Breakdown
  const directTotal = items.reduce((s, i) => s + (i.quantity * i.unit_price_ars), 0);
  const gg = directTotal * (budget.gastos_generales_pct / 100);
  const beneficio = directTotal * (budget.beneficio_pct / 100);
  const subtotal = directTotal + gg + beneficio;
  const financiero = subtotal * (budget.financieros_pct / 100);
  const iva = subtotal * (budget.impuestos_pct / 100);
  const iibb = subtotal * (budget.iibb_pct / 100);
  const totalFinal = subtotal + financiero + iva + iibb;

  const breakdownBody = [
    ['Costo Directo', `$${directTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`],
    [`Gastos Generales (${budget.gastos_generales_pct}%)`, `$${gg.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`],
    [`Beneficio (${budget.beneficio_pct}%)`, `$${beneficio.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`],
    ['Subtotal', `$${subtotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`],
    [`Costos Financieros (${budget.financieros_pct}%)`, `$${financiero.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`],
    [`Impuestos IVA (${budget.impuestos_pct}%) + IIBB (${budget.iibb_pct}%)`, `$${(iva + iibb).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`],
    ['TOTAL FINAL', `$${totalFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`]
  ];

  autoTable(doc, {
    startY: currentY,
    body: breakdownBody,
    theme: 'plain',
    styles: { font: FONT_TITLE, fontSize: 10, cellPadding: 4, halign: 'right' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: '#4b5563' },
      1: { fontStyle: 'bold', textColor: '#111827', cellWidth: 100 }
    },
    margin: { left: PAGE_WIDTH - 280 },
    didParseCell: (data) => {
      if (data.row.index === breakdownBody.length - 1) {
        data.cell.styles.fontSize = 12;
        data.cell.styles.textColor = COLOR_BLUE;
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 40;
  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#888888');
  doc.setFontSize(8);
  doc.text('Presupuesto válido por ' + (budget.validity_days || 15) + ' días. Precios expresados en ARS.', 40, finalY);

  const filename = `ECAR_Presupuesto_${budget.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
