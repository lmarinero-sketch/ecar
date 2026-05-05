import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CartaDocumentoData {
  remitente: string;
  remitenteDomicilio: string;
  remitenteCp: string;
  remitenteLocalidad: string;
  remitenteProvincia: string;
  destinatario: string;
  destinatarioDomicilio: string;
  destinatarioCp: string;
  destinatarioLocalidad: string;
  destinatarioProvincia: string;
  bodyText: string;
  fecha: string;
}

interface Props {
  data: CartaDocumentoData;
  onClose: () => void;
}

const PW = 216; // page width mm
const PH = 356; // page height mm (legal)

// Positioned text block helper
const F = ({ top, left, w, children, bold, size }: {
  top: number; left: number; w: number; children: React.ReactNode;
  bold?: boolean; size?: string;
}) => (
  <div style={{
    position: 'absolute', top: `${top}mm`, left: `${left}mm`, width: `${w}mm`,
    fontFamily: "'Arial',sans-serif", fontSize: size || '9pt',
    fontWeight: bold ? 700 : 400, color: '#000', overflow: 'hidden',
    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  }}>{children}</div>
);

export const CartaDocumentoPDF: React.FC<Props> = ({ data, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 3, useCORS: true, backgroundColor: null });
    const pdf = new jsPDF('p', 'mm', [PW, PH]);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PW, PH);
    pdf.save(`carta_documento_${data.destinatario.replace(/\s+/g, '_')}.pdf`);
  };

  /*
   * Coordenadas de datos en el formulario Correo Argentino (papel oficio)
   *
   * SECCIÓN A.R. (0-95mm):
   *   Header logo+titulo: 0-13mm
   *   Remitente/Dest nombres: ~17mm
   *   Domicilios: ~31mm
   *   CP/Loc/Prov: ~44mm
   *   Recibí conforme: ~55-95mm
   *
   * SECCIÓN CARTA DOCUMENTO (100mm+):
   *   Header: 100-113mm
   *   Rem/Dest nombres: ~117mm
   *   Domicilios: ~131mm
   *   CP/Loc/Prov: ~143mm
   *   Texto: ~157mm en adelante
   */

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center overflow-y-auto">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-[60] w-full bg-gray-900/95 backdrop-blur border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-sm">📄 Carta Documento — Vista previa</span>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90">🖨️ Imprimir</button>
          <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90">📥 PDF</button>
          <button onClick={onClose} className="bg-gray-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:opacity-90">✕</button>
        </div>
      </div>

      <div className="py-8 flex justify-center">
        <div className="relative shadow-2xl">
          {/* ===== DEMO: Visual form reference (NOT printed) ===== */}
          <DemoOverlay data={data} />

          {/* ===== PRINTABLE: All data positioned at exact coordinates ===== */}
          <div ref={printRef} className="carta-print-area" style={{ width: `${PW}mm`, height: `${PH}mm`, position: 'relative', backgroundColor: '#fff' }}>
            {/* --- A.R. SECTION DATA --- */}
            <F top={18} left={5} w={100} bold>{data.remitente}</F>
            <F top={18} left={112} w={100} bold>{data.destinatario}</F>
            <F top={33} left={5} w={100}>{data.remitenteDomicilio}</F>
            <F top={33} left={112} w={100}>{data.destinatarioDomicilio}</F>
            <F top={46} left={5} w={28}>{data.remitenteCp}</F>
            <F top={46} left={35} w={40}>{data.remitenteLocalidad}</F>
            <F top={46} left={80} w={25}>{data.remitenteProvincia}</F>
            <F top={46} left={112} w={28}>{data.destinatarioCp}</F>
            <F top={46} left={142} w={40}>{data.destinatarioLocalidad}</F>
            <F top={46} left={185} w={25}>{data.destinatarioProvincia}</F>

            {/* --- CARTA DOCUMENTO SECTION DATA --- */}
            <F top={118} left={5} w={100} bold>{data.remitente}</F>
            <F top={118} left={112} w={100} bold>{data.destinatario}</F>
            <F top={132} left={5} w={100}>{data.remitenteDomicilio}</F>
            <F top={132} left={112} w={100}>{data.destinatarioDomicilio}</F>
            <F top={145} left={5} w={28}>{data.remitenteCp}</F>
            <F top={145} left={35} w={40}>{data.remitenteLocalidad}</F>
            <F top={145} left={80} w={25}>{data.remitenteProvincia}</F>
            <F top={145} left={112} w={28}>{data.destinatarioCp}</F>
            <F top={145} left={142} w={40}>{data.destinatarioLocalidad}</F>
            <F top={145} left={185} w={25}>{data.destinatarioProvincia}</F>

            {/* --- BODY TEXT --- */}
            <div className="carta-text-body" style={{
              position: 'absolute', top: '158mm', left: '20mm', width: '176mm', height: '168mm',
              fontFamily: "'Arial',sans-serif", fontSize: '10.5pt', lineHeight: '1.55',
              color: '#000', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden',
            }}>
              {data.bodyText}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .carta-print-area, .carta-print-area * { visibility: visible !important; }
          .carta-print-area {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: ${PW}mm !important; height: ${PH}mm !important;
            background: transparent !important;
          }
          .no-print { display: none !important; }
          @page { size: ${PW}mm ${PH}mm; margin: 0; }
        }
      `}</style>
    </div>
  );
};

/* Demo overlay: visual representation of the pre-printed form (not printed) */
const DemoOverlay: React.FC<{ data: CartaDocumentoData }> = ({ data: _data }) => {
  const hdr = (title: string) => (
    <div style={{ display: 'flex', borderBottom: '2px solid #003399', height: '13mm' }}>
      <div style={{ backgroundColor: '#FFD700', width: '28mm', padding: '2mm 3mm', borderRight: '2px solid #003399', display: 'flex', alignItems: 'center' }}>
        <div><div style={{ fontSize: '9pt', fontWeight: 900, color: '#003399' }}>CORREO</div><div style={{ fontSize: '5pt', color: '#003399', fontStyle: 'italic' }}>ARGENTINO</div></div>
      </div>
      <div style={{ backgroundColor: '#003399', color: '#fff', flex: 1, padding: '2mm 4mm', fontWeight: 700, fontSize: '9pt', display: 'flex', alignItems: 'center' }}>{title}</div>
    </div>
  );

  const row = (label: string) => (
    <div style={{ display: 'flex', height: '14mm', borderBottom: '1px solid #003399' }}>
      <div style={{ flex: 1, padding: '1mm 3mm', borderRight: '2px solid #003399' }}><div style={{ fontSize: '6pt', color: '#999' }}>{label}</div></div>
      <div style={{ flex: 1, padding: '1mm 3mm' }}><div style={{ fontSize: '6pt', color: '#999' }}>{label}</div></div>
    </div>
  );

  const cpRow = () => (
    <div style={{ display: 'flex', height: '12mm' }}>
      {[0, 1].map(i => (
        <div key={i} style={{ flex: 1, display: 'flex', borderRight: i === 0 ? '2px solid #003399' : 'none' }}>
          <div style={{ flex: 1, padding: '1mm 2mm', borderRight: '1px solid #ccc' }}><div style={{ fontSize: '5pt', color: '#999' }}>C.P.</div></div>
          <div style={{ flex: 2, padding: '1mm 2mm', borderRight: '1px solid #ccc' }}><div style={{ fontSize: '5pt', color: '#999' }}>LOCALIDAD</div></div>
          <div style={{ flex: 1, padding: '1mm 2mm' }}><div style={{ fontSize: '5pt', color: '#999' }}>PROV.</div></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="no-print absolute inset-0 pointer-events-none z-10" style={{ width: `${PW}mm`, height: `${PH}mm` }}>
      {/* A.R. section */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55mm', border: '2px solid #003399', opacity: 0.3 }}>
        {hdr('A.R. - CARTA DOCUMENTO')}
        {row('REMITENTE / DESTINATARIO')}
        {row('DOMICILIO')}
        {cpRow()}
      </div>
      {/* Fold */}
      <div style={{ position: 'absolute', top: '97mm', left: 0, right: 0, borderTop: '1px dashed rgba(0,0,0,0.2)' }} />
      {/* Carta Documento section */}
      <div style={{ position: 'absolute', top: '100mm', left: 0, right: 0, height: '55mm', border: '2px solid #003399', opacity: 0.3 }}>
        {hdr('CARTA DOCUMENTO')}
        {row('REMITENTE / DESTINATARIO')}
        {row('DOMICILIO')}
        {cpRow()}
      </div>
      {/* Text area */}
      <div style={{ position: 'absolute', top: '158mm', left: '20mm', width: '176mm', height: '168mm', border: '1px dashed rgba(0,100,255,0.12)' }} />
    </div>
  );
};

export function fillTemplate(
  template: string,
  employee: { full_name: string; cuil?: string; dni?: string; address?: string },
  motivo?: string
): string {
  const today = new Date();
  const fecha = today.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return template
    .replace(/\\n/g, '\n')
    .replace(/\{\{fecha\}\}/g, fecha)
    .replace(/\{\{nombre_empleado\}\}/g, employee.full_name)
    .replace(/\{\{cuil\}\}/g, employee.cuil || '___________')
    .replace(/\{\{dni\}\}/g, employee.dni || '___________')
    .replace(/\{\{domicilio_empleado\}\}/g, employee.address || '___________________________')
    .replace(/\{\{nombre_empresa\}\}/g, 'ECAR Constructora')
    .replace(/\{\{cuit_empresa\}\}/g, '30-12345678-9')
    .replace(/\{\{motivo\}\}/g, motivo || '___________________________');
}
