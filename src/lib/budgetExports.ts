import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Tipos requeridos basados en el esquema
type Budget = any;
type BudgetItem = any;
type BudgetSection = any;

const formatDate = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
};

/**
 * Exportar Entregable para Gerencia de Compras (Excel)
 * Contiene ítems de tipo: material, subcontrato, equipo
 */
export const exportToCompras = (budget: Budget, items: BudgetItem[], sections: BudgetSection[]) => {
  const comprasItems = items.filter(
    (i) => i.cost_type === 'material' || i.cost_type === 'subcontrato' || i.cost_type === 'equipo'
  );

  const data = comprasItems.map((item) => {
    const section = sections.find((s) => s.id === item.section_id);
    return {
      'Ítem / Sección': section ? `${section.ordinal} - ${section.name}` : 'Sin Sección',
      'Tipo de Costo': item.cost_type.toUpperCase(),
      Descripción: item.description,
      Unidad: item.unit,
      Cantidad: item.quantity,
      Observaciones: item.notes || '',
    };
  });

  const ws = utils.json_to_sheet(data);
  
  // Agregar anchos de columna
  ws['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 50 },
    { wch: 10 },
    { wch: 10 },
    { wch: 30 },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Planilla_Compras');

  const filename = `Compras_${budget.name.replace(/\s+/g, '_')}_${formatDate()}.xlsx`;
  writeFile(wb, filename);
};

/**
 * Exportar Entregable para Gerencia de Logística (Excel)
 * Contiene equipos y maquinarias.
 */
export const exportToLogistica = (budget: Budget, items: BudgetItem[], sections: BudgetSection[]) => {
  const logisticaItems = items.filter((i) => i.cost_type === 'equipo');

  const data = logisticaItems.map((item) => {
    const section = sections.find((s) => s.id === item.section_id);
    return {
      'Ubicación / Tarea': section ? `${section.ordinal} - ${section.name}` : 'General',
      Equipo: item.description,
      Unidad: item.unit,
      Cantidad: item.quantity,
      'Notas Logísticas': item.notes || '',
    };
  });

  const ws = utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 30 },
    { wch: 50 },
    { wch: 10 },
    { wch: 10 },
    { wch: 40 },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Planilla_Logistica');

  const filename = `Logistica_${budget.name.replace(/\s+/g, '_')}_${formatDate()}.xlsx`;
  writeFile(wb, filename);
};

/**
 * Exportar Entregable para Gerencia de Obra (PDF)
 * Carpeta de Inicio: alcance, supuestos, y lista de cantidades sin precios.
 */
export const exportToObra = (budget: Budget, items: BudgetItem[], sections: BudgetSection[]) => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.setTextColor(0, 102, 153);
  doc.text('CARPETA DE INICIO DE OBRA', 14, 22);
  
  // Datos Generales
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Proyecto: ${budget.project?.name || 'S/N'}`, 14, 32);
  doc.text(`Presupuesto: ${budget.name}`, 14, 40);
  doc.text(`Fecha: ${formatDate()}`, 14, 48);
  
  // Alcance
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 153);
  doc.text('Definición de Alcance', 14, 60);
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const descLines = doc.splitTextToSize(budget.description || 'Sin alcance definido.', 180);
  doc.text(descLines, 14, 66);
  
  // Riesgos / Exclusiones / Supuestos
  let currentY = 66 + (descLines.length * 5) + 5;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 153);
  doc.text('Supuestos:', 14, currentY);
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const supLines = doc.splitTextToSize(budget.assumptions || 'Ninguno', 180);
  doc.text(supLines, 14, currentY + 6);
  currentY += 6 + (supLines.length * 5) + 5;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 153);
  doc.text('Exclusiones:', 14, currentY);
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const excLines = doc.splitTextToSize(budget.exclusions || 'Ninguna', 180);
  doc.text(excLines, 14, currentY + 6);
  currentY += 6 + (excLines.length * 5) + 10;
  
  // Cómputo Métrico (Cantidades)
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 153);
  doc.text('Cómputo Métrico Operativo (Sin Precios)', 14, currentY);
  
  const tableData: any[] = [];
  
  // Agrupar por sección
  sections.sort((a, b) => a.ordinal.localeCompare(b.ordinal)).forEach(sec => {
    tableData.push([
      { content: `${sec.ordinal} - ${sec.name}`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
    ]);
    
    const secItems = items.filter(i => i.section_id === sec.id);
    secItems.forEach(item => {
      tableData.push([
        item.description,
        item.unit,
        item.quantity,
        item.notes || ''
      ]);
    });
  });
  
  // Ítems sin sección
  const noSecItems = items.filter(i => !i.section_id);
  if (noSecItems.length > 0) {
    tableData.push([
      { content: `Ítems Generales / Sin Sección`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
    ]);
    noSecItems.forEach(item => {
      tableData.push([
        item.description,
        item.unit,
        item.quantity,
        item.notes || ''
      ]);
    });
  }

  // @ts-ignore
  doc.autoTable({
    startY: currentY + 6,
    head: [['Descripción / Tarea', 'Unidad', 'Cant.', 'Observaciones']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 150, 136] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 'auto' },
    }
  });

  const filename = `CarpetaObra_${budget.name.replace(/\s+/g, '_')}_${formatDate()}.pdf`;
  doc.save(filename);
};
