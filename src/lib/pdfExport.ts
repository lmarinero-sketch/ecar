import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  
  // Attempt to load logo
  try {
    // We use the available logo (logogrow.png or ecar logo if changed later)
    const imgUrl = '/logogrow.png';
    const response = await fetch(imgUrl);
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      // (base64, format, x, y, width, height)
      doc.addImage(base64, 'PNG', 40, 40, 70, 70);
    }
  } catch (e) {
    console.warn("No se pudo cargar el logo para el PDF", e);
  }

  // Right Header Text
  doc.setFont(FONT_TITLE, 'bold');
  doc.setTextColor(COLOR_BLUE);
  doc.setFontSize(16);
  doc.text('ECAR | RESPUESTAS AL', 140, 60);
  doc.text('CUESTIONARIO DE', 140, 80);
  doc.text('RELEVAMIENTO', 140, 100);

  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#666666');
  doc.setFontSize(11);
  doc.text('Módulo Proyectos y Presupuestos (PR-GPP-01)', 140, 130);

  // Horizontal Color Bar
  const barY = 160;
  const barHeight = 24;
  // Red part (approx half)
  doc.setFillColor(COLOR_RED);
  doc.rect(40, barY, 250, barHeight, 'F');
  // Blue part (remaining half)
  doc.setFillColor(COLOR_BLUE);
  doc.rect(290, barY, 265, barHeight, 'F');

  // Main Title
  doc.setFont(FONT_TITLE, 'bold');
  doc.setTextColor(COLOR_RED);
  doc.setFontSize(14);
  doc.text(`Respuesta institucional para ${opportunity.client_name}`, 40, 230);

  // Subtitle
  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#333333');
  doc.setFontSize(10);
  doc.text('Situación actual de ECAR, criterios de implementación y prioridades funcionales para el ERP', 40, 255);

  // Helper formatting functions
  const fmtMoney = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : '-';
  const fmtStage = (s: string) => s.replace(/_/g, ' ').toUpperCase();

  // Table Data mapping
  const tableData = [
    ['Empresa', 'ECAR Construcciones / ECAR Constructora'],
    ['Destinatario', opportunity.client_name],
    ['Contacto', opportunity.client_contact || '-'],
    ['Proyecto', projectName || 'Sin proyecto vinculado'],
    ['Tipo de Trabajo', WORK_TYPES[opportunity.work_type] || opportunity.work_type],
    ['Etapa Actual', fmtStage(opportunity.stage)],
    ['Monto Estimado', fmtMoney(opportunity.estimated_amount)],
    ['Plazo Estimado', fmtDate(opportunity.estimated_deadline || '')],
    ['Prioridad / Riesgo', `${opportunity.priority.toUpperCase()} / ${opportunity.risk_level.toUpperCase()}`],
    ['Ubicación', opportunity.location || '-'],
    ['Descripción', opportunity.description || '-']
  ];

  if (opportunity.assumptions) {
    tableData.push(['Supuestos', opportunity.assumptions]);
  }
  if (opportunity.exclusions) {
    tableData.push(['Exclusiones', opportunity.exclusions]);
  }

  // Draw Table
  autoTable(doc, {
    startY: 280,
    body: tableData,
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

  // Footer Text
  const finalY = (doc as any).lastAutoTable.finalY + 40;
  
  doc.setFont(FONT_TITLE, 'normal');
  doc.setTextColor('#333333');
  doc.setFontSize(9);
  
  const footerText = 'Documento interno de respuesta para ordenar el relevamiento funcional del módulo. La respuesta describe la realidad actual de ECAR y propone el criterio deseado de implementación, evitando sobredimensionar el sistema y priorizando trazabilidad, control operativo y mejora continua.';
  
  // Wrap text to fit page width (A4 width is approx 595, margins 40+40=80, usable width ~515)
  const wrappedFooter = doc.splitTextToSize(footerText, 515);
  doc.text(wrappedFooter, 40, finalY);

  // Save the file
  const filename = `ECAR_Oportunidad_${opportunity.client_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
