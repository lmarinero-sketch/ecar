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

/* ══════════════════════════════════════════════════════════════════════
   DemoOverlay — Visual replica of the official Correo Argentino form
   ══════════════════════════════════════════════════════════════════════ */
const DemoOverlay: React.FC<{ data: CartaDocumentoData }> = ({ data }) => {
  // Watermark pattern for the background
  const watermarkStyle: React.CSSProperties = {
    backgroundImage: `
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 8px,
        rgba(0, 120, 200, 0.03) 8px,
        rgba(0, 120, 200, 0.03) 16px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 8px,
        rgba(0, 120, 200, 0.03) 8px,
        rgba(0, 120, 200, 0.03) 16px
      )
    `,
  };

  // Correo Argentino logo block
  const CorreoLogo = () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '3mm',
    }}>
      <div style={{
        width: '10mm', height: '10mm', borderRadius: '50%',
        background: 'linear-gradient(135deg, #0057A0 0%, #003D7A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: '10pt', fontWeight: 900, color: '#0057A0', letterSpacing: '0.5px', lineHeight: 1.1 }}>CORREO</div>
        <div style={{ fontSize: '7pt', color: '#0057A0', fontWeight: 600, letterSpacing: '1.5px', lineHeight: 1 }}>ARGENTINO</div>
        <div style={{ fontSize: '4.5pt', color: '#666', fontStyle: 'italic', marginTop: '0.5mm' }}>CORREO OFICIAL</div>
      </div>
    </div>
  );

  // Header bar
  const SectionHeader = ({ title, showCodigo }: { title: string; showCodigo?: boolean }) => (
    <div style={{
      display: 'flex', height: '10mm', marginBottom: '0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 4mm',
        backgroundColor: '#0057A0', borderRadius: '0',
      }}>
        <CorreoLogo />
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(90deg, #0057A0 0%, #0070C0 100%)',
        padding: '0 4mm',
      }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '10pt', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {showCodigo && (
        <div style={{
          display: 'flex', alignItems: 'center', padding: '0 3mm',
          backgroundColor: '#f0f4f8', borderLeft: '1px solid #ccd6e0',
          minWidth: '30mm',
        }}>
          <div style={{ fontSize: '5pt', color: '#999', textAlign: 'center', width: '100%' }}>CÓDIGO DE CUENTA<br />CLIENTE</div>
        </div>
      )}
    </div>
  );

  // Labeled field
  const LabeledField = ({ label, value, flex, borderRight, mono }: {
    label: string; value?: string; flex?: number; borderRight?: boolean; mono?: boolean;
  }) => (
    <div style={{
      flex: flex || 1, padding: '1.5mm 3mm', display: 'flex', flexDirection: 'column',
      borderRight: borderRight ? '1px solid #b8c9d9' : 'none',
      minHeight: '10mm',
    }}>
      <div style={{ fontSize: '5pt', color: '#6b7f93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm' }}>{label}</div>
      <div style={{
        fontSize: '9pt', fontWeight: value ? 600 : 400, color: value ? '#1a2b3c' : '#ccc',
        fontFamily: mono ? "'Courier New', monospace" : "'Arial', sans-serif",
        flex: 1, display: 'flex', alignItems: 'center',
      }}>
        {value || '—'}
      </div>
    </div>
  );

  // Two-column row for remitente/destinatario
  const TwoColRow = ({ label, leftValue, rightValue }: {
    label: string; leftValue?: string; rightValue?: string;
  }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #d4dfe8' }}>
      <div style={{ flex: 1, borderRight: '2px solid #0057A0', padding: '1.5mm 3mm', display: 'flex', flexDirection: 'column', minHeight: '11mm' }}>
        <div style={{ fontSize: '5pt', color: '#6b7f93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5mm' }}>
          REMITENTE {label && `— ${label}`}
        </div>
        <div style={{ fontSize: '9pt', fontWeight: leftValue ? 600 : 400, color: leftValue ? '#1a2b3c' : '#ccc', flex: 1, display: 'flex', alignItems: 'center' }}>
          {leftValue || ''}
        </div>
      </div>
      <div style={{ flex: 1, padding: '1.5mm 3mm', display: 'flex', flexDirection: 'column', minHeight: '11mm' }}>
        <div style={{ fontSize: '5pt', color: '#6b7f93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5mm' }}>
          DESTINATARIO {label && `— ${label}`}
        </div>
        <div style={{ fontSize: '9pt', fontWeight: rightValue ? 600 : 400, color: rightValue ? '#1a2b3c' : '#ccc', flex: 1, display: 'flex', alignItems: 'center' }}>
          {rightValue || ''}
        </div>
      </div>
    </div>
  );

  // CP / Localidad / Provincia row
  const CpRow = ({ cpLeft, locLeft, provLeft, cpRight, locRight, provRight }: {
    cpLeft: string; locLeft: string; provLeft: string;
    cpRight: string; locRight: string; provRight: string;
  }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #d4dfe8' }}>
      {/* Left side (Remitente) */}
      <div style={{ flex: 1, display: 'flex', borderRight: '2px solid #0057A0' }}>
        <LabeledField label="Código Postal" value={cpLeft} flex={1} borderRight mono />
        <LabeledField label="Localidad" value={locLeft} flex={2} borderRight />
        <LabeledField label="Provincia" value={provLeft} flex={1} />
      </div>
      {/* Right side (Destinatario) */}
      <div style={{ flex: 1, display: 'flex' }}>
        <LabeledField label="Código Postal" value={cpRight} flex={1} borderRight mono />
        <LabeledField label="Localidad" value={locRight} flex={2} borderRight />
        <LabeledField label="Provincia" value={provRight} flex={1} />
      </div>
    </div>
  );

  return (
    <div className="no-print absolute inset-0 pointer-events-none z-10" style={{ width: `${PW}mm`, height: `${PH}mm` }}>
      {/* ═══ SECTION 1: A.R. - CARTA DOCUMENTO (Acuse de Recibo) ═══ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '95mm',
        border: '2px solid #0057A0', borderRadius: '1mm',
        backgroundColor: '#fff', overflow: 'hidden',
        ...watermarkStyle,
      }}>
        <SectionHeader title="A.R. - CARTA DOCUMENTO" showCodigo />

        <TwoColRow label="" leftValue={data.remitente} rightValue={data.destinatario} />

        {/* N° A.R. (Troquel T&T) */}
        <div style={{
          position: 'absolute', top: '10mm', right: '0', width: '30mm',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
        </div>

        <TwoColRow label="DOMICILIO" leftValue={data.remitenteDomicilio} rightValue={data.destinatarioDomicilio} />

        <CpRow
          cpLeft={data.remitenteCp} locLeft={data.remitenteLocalidad} provLeft={data.remitenteProvincia}
          cpRight={data.destinatarioCp} locRight={data.destinatarioLocalidad} provRight={data.destinatarioProvincia}
        />

        {/* Recibí Conforme Section */}
        <div style={{ margin: '2mm 0 0 0' }}>
          <div style={{
            backgroundColor: '#E8F0FA', padding: '2mm 3mm',
            borderTop: '1px solid #0057A0', borderBottom: '1px solid #d4dfe8',
          }}>
            <span style={{ fontSize: '5.5pt', fontWeight: 800, color: '#0057A0', letterSpacing: '1px', textTransform: 'uppercase' }}>
              RECIBÍ CONFORME EL ENVÍO REFERENTE A ESTE AVISO
            </span>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #d4dfe8', padding: '0' }}>
            <LabeledField label="Fecha" flex={1} borderRight />
            <LabeledField label="Firma del Destinatario" flex={3} />
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #d4dfe8' }}>
            <LabeledField label="Hora" flex={1} borderRight />
            <LabeledField label="Aclaración Firma Destinatario" flex={3} />
          </div>
          <div style={{ padding: '1.5mm 3mm' }}>
            <div style={{ fontSize: '5pt', color: '#6b7f93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Firma Empleado que Entrega y N° de Legajo
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Fold line ═══ */}
      <div style={{
        position: 'absolute', top: '97mm', left: 0, right: 0,
        borderTop: '2px dashed rgba(0,87,160,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'relative', top: '-3mm',
          fontSize: '5pt', color: 'rgba(0,87,160,0.3)', fontWeight: 700,
          letterSpacing: '2px', textTransform: 'uppercase',
          backgroundColor: '#fff', padding: '0 3mm',
        }}>
          ✂ DOBLE POR AQUÍ
        </div>
      </div>

      {/* ═══ SECTION 2: CARTA DOCUMENTO (body) ═══ */}
      <div style={{
        position: 'absolute', top: '100mm', left: 0, right: 0, height: '55mm',
        border: '2px solid #0057A0', borderRadius: '1mm',
        backgroundColor: '#fff', overflow: 'hidden',
        ...watermarkStyle,
      }}>
        <SectionHeader title="CARTA DOCUMENTO" />

        <TwoColRow label="" leftValue={data.remitente} rightValue={data.destinatario} />
        <TwoColRow label="DOMICILIO" leftValue={data.remitenteDomicilio} rightValue={data.destinatarioDomicilio} />
        <CpRow
          cpLeft={data.remitenteCp} locLeft={data.remitenteLocalidad} provLeft={data.remitenteProvincia}
          cpRight={data.destinatarioCp} locRight={data.destinatarioLocalidad} provRight={data.destinatarioProvincia}
        />
      </div>

      {/* ═══ BODY TEXT AREA ═══ */}
      <div style={{
        position: 'absolute', top: '158mm', left: '8mm', right: '8mm', bottom: '20mm',
        border: '1px solid rgba(0,87,160,0.08)',
        borderRadius: '1mm',
        backgroundColor: 'rgba(0,87,160,0.01)',
        padding: '12mm',
      }}>
        {/* Fecha alineada derecha */}
        <div style={{
          position: 'absolute', top: '2mm', right: '4mm',
          fontSize: '6pt', color: 'rgba(0,87,160,0.2)', fontWeight: 600,
        }}>
          {data.fecha}
        </div>
      </div>

      {/* ═══ Fold marks on sides ═══ */}
      <div style={{
        position: 'absolute', top: '157mm', left: '3mm',
        fontSize: '5pt', color: 'rgba(0,87,160,0.15)', fontWeight: 600,
        writingMode: 'vertical-rl', transform: 'rotate(180deg)',
        letterSpacing: '1px',
      }}>
        Doble por aquí
      </div>
      <div style={{
        position: 'absolute', top: '157mm', right: '3mm',
        fontSize: '5pt', color: 'rgba(0,87,160,0.15)', fontWeight: 600,
        writingMode: 'vertical-rl',
        letterSpacing: '1px',
      }}>
        Doble por aquí
      </div>

      {/* ═══ Footer ═══ */}
      <div style={{
        position: 'absolute', bottom: '5mm', left: '50%', transform: 'translateX(-50%)',
        fontSize: '5pt', color: 'rgba(0,0,0,0.1)', fontWeight: 600,
        letterSpacing: '1.5px', textTransform: 'uppercase',
      }}>
        Formato Oficial · Correo Argentino
      </div>
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
