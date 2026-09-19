import React, { useState } from 'react';
import {
  FileText, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '../../lib/types';
import { usePartesDiarios, useWbsElements } from '../../hooks/useData';
import { useProjectMilestones, useCreateWorkReport } from '../../hooks/useObraData';
import { useModalStore } from '../../store/useModalStore';

interface InformesObraGeneratorProps {
  project: Project;
  onClose: () => void;
}

export const InformesObraGenerator: React.FC<InformesObraGeneratorProps> = ({ project, onClose }) => {
  const { data: wbs = [] } = useWbsElements(project.id);
  const { data: milestones = [] } = useProjectMilestones(project.id);
  const { data: partes = [] } = usePartesDiarios(project.id);
  const createReport = useCreateWorkReport();

  const [tipo, setTipo] = useState<'semanal' | 'quincenal' | 'mensual' | 'avance_fotografico'>('semanal');
  const [alcance, setAlcance] = useState<'cliente' | 'interno'>('cliente');
  const [periodoDesde, setPeriodoDesde] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [periodoHasta, setPeriodoHasta] = useState<string>(new Date().toISOString().split('T')[0]);
  const [resumenEjecutivo, setResumenEjecutivo] = useState(
    `Durante el período se dio continuidad a las tareas de zanjeo, tendido de cañería PEAD y colocación de accesorios según cronograma previsto. Las actividades se desarrollaron cumpliendo estrictamente con las normas de Seguridad & Higiene laboral (Dec. 911/96).`
  );
  const [emitidoPor, setEmitidoPor] = useState('Ing. Lucas Marinero - Jefe de Obra ECAR');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter partes diarios in date range
  const partesInRange = partes.filter(p => p.fecha >= periodoDesde && p.fecha <= periodoHasta);
  const avgProgress = wbs.length > 0
    ? Math.round(wbs.reduce((acc, t) => acc + (t.progress_pct || 0), 0) / wbs.length)
    : (project.advance_pct || 0);

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner (ECAR Navy Blue)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 42, 'F');

      // Accent amber stripe
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 42, pageWidth, 2.5, 'F');

      // Title & Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('ECAR CONSTRUCCIONES S.A.', 14, 16);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('GERENCIA DE OBRAS & EJECUCIÓN TÉCNICA', 14, 23);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11); // amber
      const reportTitle = tipo === 'semanal' ? 'INFORME SEMANAL DE OBRA'
        : tipo === 'quincenal' ? 'INFORME QUINCENAL DE AVANCE'
        : tipo === 'mensual' ? 'INFORME MENSUAL TÉCNICO'
        : 'INFORME DE AVANCE FOTOGRÁFICO';
      doc.text(reportTitle.toUpperCase(), 14, 34);

      // Metadata Badge
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`ALCANCE: ${alcance === 'cliente' ? 'EMISIÓN OFICIAL CLIENTE' : 'CONFIDENCIAL / USO INTERNO'}`, pageWidth - 14, 16, { align: 'right' });
      doc.text(`FECHA EMISIÓN: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 14, 22, { align: 'right' });
      doc.text(`PERÍODO: ${periodoDesde} AL ${periodoHasta}`, pageWidth - 14, 28, { align: 'right' });

      // Project Info Table
      autoTable(doc, {
        startY: 50,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        body: [
          [
            { content: 'OBRA:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
            { content: project.name, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
            { content: 'COMITENTE:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
            { content: project.client_name || 'No especificado', styles: { fontStyle: 'bold' } }
          ],
          [
            { content: 'UBICACIÓN:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
            { content: project.location || 'Central', styles: { fontStyle: 'normal' } },
            { content: 'AVANCE PONDERADO:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
            { content: `${avgProgress}% Físico Ejecutado`, styles: { fontStyle: 'bold', textColor: [217, 119, 6] } }
          ]
        ]
      });

      // Section 1: Resumen Ejecutivo
      let currentY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, currentY, pageWidth - 28, 7, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. SÍNTESIS EJECUTIVA DEL PERÍODO', 17, currentY + 5);

      currentY += 11;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(resumenEjecutivo, pageWidth - 28);
      doc.text(splitText, 14, currentY);
      currentY += splitText.length * 4.5 + 4;

      // Section 2: Hitos y Estado de Plazos
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('2. HITOS CONTRACTUALES & SITUACIÓN DE PLAZO', 17, currentY + 5);

      const milestoneRows = milestones.slice(0, 6).map(m => [
        m.nombre,
        m.tipo.toUpperCase(),
        m.fecha_objetivo_original,
        m.fecha_pronosticada || m.fecha_objetivo_original,
        `${m.avance_real_pct}%`,
        m.estado === 'cumplido' ? 'CUMPLIDO' : m.estado === 'en_riesgo' ? 'EN RIESGO' : 'AL DÍA'
      ]);

      autoTable(doc, {
        startY: currentY + 9,
        head: [['Hito / Actividad Clave', 'Tipo', 'F. Contractual', 'F. Pronóstico', 'Avance %', 'Estado']],
        body: milestoneRows.length > 0 ? milestoneRows : [['Sin hitos formalizados en el período', '-', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      // Section 3: Registro de Actividad de Campo (Partes Diarios)
      currentY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('3. JORNADAS OPERATIVAS & REGISTRO DE CAMPO', 17, currentY + 5);

      const partesRows = partesInRange.slice(0, 7).map(p => [
        p.fecha,
        (p.clima || 'despejado').toUpperCase(),
        `${p.horas_trabajadas || 8} hs`,
        p.trabajo_realizado.substring(0, 70) + (p.trabajo_realizado.length > 70 ? '...' : ''),
        p.firmado_por || 'Jefe de Cuadrilla'
      ]);

      autoTable(doc, {
        startY: currentY + 9,
        head: [['Fecha', 'Clima', 'Jornada', 'Trabajo Ejecutado en Frente', 'Responsable']],
        body: partesRows.length > 0 ? partesRows : [['Sin partes registrados en este rango de fechas', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      // Signatures
      currentY = (doc as any).lastAutoTable.finalY + 25;
      if (currentY > 260) {
        doc.addPage();
        currentY = 40;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(20, currentY, 80, currentY);
      doc.line(pageWidth - 80, currentY, pageWidth - 20, currentY);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(emitidoPor, 50, currentY + 5, { align: 'center' });
      doc.text('ECAR CONSTRUCCIONES S.A.', 50, currentY + 9, { align: 'center' });

      doc.text('CONFORMIDAD INSPECCIÓN', pageWidth - 50, currentY + 5, { align: 'center' });
      doc.text('DIRECCIÓN DE OBRA / COMITENTE', pageWidth - 50, currentY + 9, { align: 'center' });

      // Save PDF
      const filename = `Informe_Obra_${project.name.replace(/\s+/g, '_')}_${periodoHasta}.pdf`;
      doc.save(filename);

      // Save record in Work Reports
      createReport.mutate({
        project_id: project.id,
        numero_informe: `INF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        tipo,
        alcance,
        periodo_desde: periodoDesde,
        periodo_hasta: periodoHasta,
        titulo: `${reportTitle} - ${project.name}`,
        resumen_ejecutivo: resumenEjecutivo,
        emitido_por: emitidoPor,
        estado: 'emitido',
        fotos_seleccionadas: [],
      });

      useModalStore.getState().showAlert('Informe Generado', `El informe en PDF "${filename}" ha sido generado con éxito.`);
      onClose();
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', 'No se pudo generar el informe: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <FileText size={22} className="text-amber-500" />
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Generador de Informes de Obra (PDF)</h3>
              <p className="text-xs text-gray-500">Salida técnica formal para comitente o control interno sin armado manual.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {/* Form Config */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-600 uppercase block mb-1">Plantilla de Informe</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500 font-bold text-gray-800"
              >
                <option value="semanal">Informe Semanal de Obra</option>
                <option value="quincenal">Informe Quincenal de Avance</option>
                <option value="mensual">Informe Mensual Técnico</option>
                <option value="avance_fotografico">Informe Fotográfico de Campo</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-600 uppercase block mb-1">Alcance / Destinatario</label>
              <select
                value={alcance}
                onChange={e => setAlcance(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500 font-bold text-gray-800"
              >
                <option value="cliente">Para Cliente / Comitente (Formal)</option>
                <option value="interno">Uso Interno (Gerencia & Dirección)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-600 uppercase block mb-1">Período Desde</label>
              <input
                type="date"
                value={periodoDesde}
                onChange={e => setPeriodoDesde(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-gray-600 uppercase block mb-1">Período Hasta</label>
              <input
                type="date"
                value={periodoHasta}
                onChange={e => setPeriodoHasta(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-600 uppercase block mb-1">Síntesis Ejecutiva / Novedades</label>
            <textarea
              rows={3}
              value={resumenEjecutivo}
              onChange={e => setResumenEjecutivo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="font-bold text-gray-600 uppercase block mb-1">Firma / Emitido Por</label>
            <input
              type="text"
              value={emitidoPor}
              onChange={e => setEmitidoPor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          {/* Data Summary Box */}
          <div className="bg-slate-50 border rounded-xl p-3 text-[11px] text-gray-600 space-y-1">
            <span className="font-bold text-gray-800 block">Datos consolidados que se volcarán automáticamente:</span>
            <p>• {partesInRange.length} Partes Diarios en el rango seleccionado.</p>
            <p>• {milestones.length} Hitos contractuales y situaciones de plazo.</p>
            <p>• Avance físico ponderado acumulado: <strong>{avgProgress}%</strong>.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs text-gray-600 font-bold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold px-5 py-2 flex items-center gap-2 text-xs shadow-md"
          >
            <Download size={14} /> {isGenerating ? 'Generando PDF...' : 'Generar PDF Oficial'}
          </button>
        </div>
      </div>
    </div>
  );
};
