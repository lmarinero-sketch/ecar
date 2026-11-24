import jsPDF from 'jspdf';
import type { FuelLoad } from './types';
import { printThermalTicket58mm } from './thermalTicket58mm';

const formatLocalDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

/**
 * Impresión de Vale de Combustible y Lubricantes adaptado a impresora térmica de 58 mm.
 */
export function printFuelValeTicket58mm(load: Partial<FuelLoad>, signatureData?: string | null) {
  const solNumber = load.load_number || load.id || 'SOL-XXXXX';
  const fechaStr = formatLocalDate(load.load_date);
  const vehiculoStr = [load.vehicle_code, load.vehicle_description].filter(Boolean).join(' - ') || '-';
  const isCompleted = load.workflow_status === 'completed' || (load.liters != null && load.liters > 0);
  const litrosStr = isCompleted
    ? `${load.liters || load.requested_liters || 0} L`
    : `${load.requested_liters || 0} L`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ecar.app';
  const qrUrlTarget = `${origin}/verificar?tipo=vale&codigo=${encodeURIComponent(solNumber)}`;

  printThermalTicket58mm({
    documentTitle: isCompleted ? 'Ticket de Carga de Combustible' : 'Vale de Combustible y Lubricantes',
    badgeLabel: 'N° de Solicitud / Carga',
    badgeCode: solNumber,
    fields: [
      { label: 'Fecha:', value: fechaStr },
      { label: 'Vehículo:', value: vehiculoStr },
      { label: 'Odóm./Hs.:', value: load.odometer_km ? `${load.odometer_km.toLocaleString()} km/hs` : '-' },
      { label: 'Combustible:', value: load.fuel_type || 'Diesel Premium / V-Power' },
      ...(load.station_name ? [{ label: 'Estación:', value: load.station_name }] : []),
      {
        label: isCompleted ? 'Litros Cargados:' : 'Litros Autor.:',
        value: litrosStr,
        highlight: true,
      },
      ...(isCompleted && load.requested_liters && load.liters && load.requested_liters !== load.liters
        ? [{ label: 'Litros Solicit.:', value: `${load.requested_liters} L` }]
        : []),
      { label: 'Solicitante:', value: load.driver_name || load.requested_by || 'Operario' },
      { label: 'Obra / Centro:', value: load.project_name || 'Uso General' },
      ...(load.remito_number ? [{ label: 'Remito:', value: load.remito_number }] : []),
      ...(load.voucher_number ? [{ label: 'N° Vale:', value: load.voucher_number }] : []),
    ],
    notes: load.observations || undefined,
    authorizationTitle: 'Autorización de Gerencia',
    authorizationText: load.supervisor_signature || 'Pendiente de Autorización por Gerencia',
    signatureImage: signatureData || null,
    signatureLineLabel: 'Firma Operario / Estación',
    qrPayload: qrUrlTarget,
    footerCode: solNumber,
  });
}

export async function generateFuelValePdf(load: Partial<FuelLoad>, signatureData?: string | null) {
  const doc = new jsPDF('p', 'pt', 'a4');
  
  // Header triangles (ECAR Blue and Red)
  doc.setFillColor(11, 34, 64);
  doc.triangle(0, 0, 600, 0, 600, 100, 'F');
  doc.triangle(0, 0, 600, 100, 0, 160, 'F');

  doc.setFillColor(210, 32, 39);
  doc.triangle(0, 160, 600, 100, 600, 115, 'F');
  doc.triangle(0, 160, 600, 115, 0, 175, 'F');

  // Footer triangles
  doc.setFillColor(11, 34, 64);
  doc.triangle(0, 780, 600, 700, 600, 842, 'F');
  doc.triangle(0, 780, 600, 842, 0, 842, 'F');

  doc.setFillColor(210, 32, 39);
  doc.triangle(0, 765, 600, 685, 600, 700, 'F');
  doc.triangle(0, 765, 600, 700, 0, 780, 'F');

  // Logo ECAR
  try {
    const response = await fetch('/logoECAR.png');
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(30, 30, 140, 60, 5, 5, 'F');
      doc.addImage(base64, 'PNG', 40, 40, 120, 42);
    }
  } catch (e) {
    console.warn("Logo PDF error", e);
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 34, 64);
  doc.setFontSize(20);
  doc.text("VALE DE COMBUSTIBLE Y LUBRICANTES", 40, 215);

  // N° DE SOLICITUD (SOL-XXXXX) - PROMINENT DISPLAY
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(210, 32, 39); // ECAR Red Accent
  doc.text(`N° DE SOLICITUD: ${load.load_number || 'SOL-XXXXX'}`, 40, 238);

  // Decorative line
  doc.setDrawColor(210, 32, 39);
  doc.setLineWidth(3);
  doc.line(40, 248, 300, 248);
  doc.setDrawColor(11, 34, 64);
  doc.line(300, 248, 550, 248);

  // Details
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  
  const startY = 275;
  const lineSpacing = 26;

  const formatLocalDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const fields = [
    { label: "N° de Solicitud:", val: load.load_number || 'SOL-XXXXX', highlight: true },
    { label: "Fecha Solicitud:", val: formatLocalDate(load.load_date) },
    { label: "Vehículo / Máquina:", val: `${load.vehicle_code || ''} - ${load.vehicle_description || ''}` },
    { label: "Odómetro / Horómetro:", val: load.odometer_km ? `${load.odometer_km.toLocaleString()} km/hs` : '-' },
    { label: "Tipo de Combustible:", val: load.fuel_type || 'Diesel Premium / V-Power' },
    { label: "Litros Solicitados:", val: `${load.requested_liters || 0} L` },
    { label: "Solicitante:", val: load.requested_by || load.driver_name || 'Operario' },
    { label: "Centro de Costo / Obra:", val: load.project_name || 'Uso General' },
  ];

  fields.forEach((f, idx) => {
    const y = startY + idx * lineSpacing;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 34, 64);
    doc.text(f.label, 40, y);

    if (f.highlight) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(210, 32, 39);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
    }
    doc.text(f.val, 190, y);
  });

  // Supervisor Signature section
  const sigY = startY + fields.length * lineSpacing + 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 34, 64);
  doc.text("Autorización de Gerencia", 40, sigY);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const sigText = load.supervisor_signature || 'Pendiente de Autorización por Gerencia';
  const splitText = doc.splitTextToSize(sigText, 500);
  doc.text(splitText, 40, sigY + 20);

  if (signatureData) {
    try {
      doc.addImage(signatureData, 'PNG', 40, sigY + 38, 180, 55);
    } catch (e) {
      console.error("Error embedding signature", e);
    }
  }

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Código de Verificación Sistema: ${load.load_number || load.id}`, 40, 800);

  doc.save(`Vale_Combustible_${load.load_number || 'SOL'}_${load.vehicle_code || ''}.pdf`);
}
