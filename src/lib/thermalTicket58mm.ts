import { useModalStore } from '../store/useModalStore';
import {
  buildEscPosTicketBytes,
  tryPrintViaLocalBridge,
  uint8ToBase64,
} from './escpos58mm';

/**
 * Generador unificado de Tickets Térmicos de 58 mm (ESC/POS nativo + fallback HTML 32 cols).
 * - Si el puente local ESC/POS (ecar-print-bridge.ps1) está corriendo en la PC, envía los
 *   bytes ESC/POS crudos directo al spooler RAW de Windows (impresión idéntica a térmica nativa).
 * - Si no está corriendo, abre la vista previa con soporte Web Serial, descarga directa del puente
 *   .ps1 y fallback por navegador sin margen izquierdo.
 */

export interface ThermalTicketField {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ThermalTicketItem {
  code?: string;
  quantity: number;
  unit?: string;
  description: string;
}

export interface ThermalTicket58mmOptions {
  documentTitle: string;
  subtitle?: string;
  badgeLabel: string;
  badgeCode: string;
  fields: ThermalTicketField[];
  itemsTitle?: string;
  items?: ThermalTicketItem[];
  notes?: string;
  authorizationTitle?: string;
  authorizationText?: string;
  signatureImage?: string | null;
  signatureLineLabel?: string;
  qrPayload: string;
  footerCode?: string;
}

const escapeHtml = (str: string): string =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export async function printThermalTicket58mm(opts: ThermalTicket58mmOptions) {
  const escposBytes = await buildEscPosTicketBytes(opts);
  const escposBase64 = uint8ToBase64(escposBytes);

  // 1. Intentar impresión directa ESC/POS RAW vía puente local Windows
  const printedViaBridge = await tryPrintViaLocalBridge(escposBytes);
  if (printedViaBridge) {
    useModalStore
      .getState()
      .showAlert('Ticket Impreso (ESC/POS 58mm)', `El comprobante ${opts.badgeCode} se envió directamente a la impresora térmica.`);
    return;
  }

  // 2. Si no está el puente activo, abrir vista previa con controles ESC/POS + fallback corregido sin margen izquierdo
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const bridgeDownloadUrl = `${origin}/ecar-print-bridge.ps1`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(
    opts.qrPayload
  )}`;

  const fieldsHtml = opts.fields
    .filter(f => f.value !== undefined && f.value !== null && String(f.value).trim() !== '')
    .map(
      f => `
      <div class="row ${f.highlight ? 'bold' : ''}">
        <span>${escapeHtml(f.label)} ${escapeHtml(f.value)}</span>
      </div>`
    )
    .join('');

  const hasItems = Array.isArray(opts.items);
  const itemsHtml = hasItems
    ? (opts.items || [])
        .map(
          it => `
        <div class="row bold">
          ${escapeHtml(String(it.quantity))}${it.unit ? ` ${escapeHtml(it.unit)}` : ''} x ${escapeHtml(it.description)}
        </div>
        ${it.code ? `<div class="row">  Cod: ${escapeHtml(it.code)}</div>` : ''}`
        )
        .join('')
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(opts.documentTitle)} — ${escapeHtml(opts.badgeCode)}</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      background: #ffffff !important;
      width: 100%;
    }
    .panel-controls {
      max-width: 340px;
      margin: 10px auto 14px;
      padding: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc !important;
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .panel-controls h4 {
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 2px;
    }
    .panel-controls p {
      font-size: 11px;
      line-height: 1.35;
      color: #334155 !important;
    }
    .btn {
      width: 100%;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid #0B2240;
      border-radius: 6px;
      background: #ffffff !important;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      display: block;
    }
    .btn-primary {
      background: #0B2240 !important;
      color: #ffffff !important;
    }
    .btn-accent {
      background: #0284c7 !important;
      border-color: #0284c7;
      color: #ffffff !important;
    }
    .status-msg {
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      min-height: 14px;
    }
    /* Estilo idéntico a ESC/POS 32 columnas, ancho 44mm pegado a la izquierda para compensar drivers Windows */
    .ticket {
      width: 45mm;
      max-width: 45mm;
      margin: 0 auto;
      padding: 1mm 0 3mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 8.5pt;
      line-height: 1.25;
      word-break: break-word;
    }
    .bold { font-weight: 700; }
    .divider {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    .row {
      margin: 1.5px 0;
    }
    .sig-img {
      display: block;
      max-width: 32mm;
      max-height: 12mm;
      margin: 4px auto 2px;
      object-fit: contain;
    }
    .sign-line {
      border-bottom: 1px dashed #000;
      height: 14px;
      margin-top: 8px;
      margin-bottom: 2px;
    }
    .qr-box {
      margin-top: 6px;
      text-align: center;
    }
    .qr-box img {
      width: 26mm;
      height: 26mm;
      display: inline-block;
    }
    @media print {
      .panel-controls { display: none !important; }
      html, body { width: 58mm; margin: 0 !important; padding: 0 !important; }
      .ticket { width: 44mm; max-width: 44mm; margin: 0 !important; padding: 0 0 2mm 0 !important; }
    }
  </style>
</head>
<body>
  <div class="panel-controls">
    <h4>🖨️ Impresión Óptima ESC/POS (58mm)</h4>
    <p>Para imprimir sin márgenes ni cortes (como ESC/POS nativo), ejecutá el puente en la PC de la impresora o conectá por USB/Serial:</p>
    <button class="btn btn-primary" onclick="printViaBridge()">⚡ Reintentar Puente Local ESC/POS</button>
    <button class="btn btn-accent" onclick="printViaSerial()">🔌 Imprimir ESC/POS Directo (USB / COM)</button>
    <a class="btn" href="${bridgeDownloadUrl}" download="ecar-print-bridge.ps1">⬇️ Descargar Puente Windows (.ps1)</a>
    <button class="btn" onclick="window.print()">🖨️ Imprimir por Navegador (Driver Windows)</button>
    <div id="status" class="status-msg"></div>
  </div>

  <div class="ticket">
    <div class="bold">${escapeHtml(opts.documentTitle)}</div>
    <div class="bold">ECAR S.A.S</div>
    ${opts.subtitle ? `<div class="bold">${escapeHtml(opts.subtitle)}</div>` : ''}
    <div class="divider"></div>
    <div class="bold">${escapeHtml(opts.badgeLabel.toUpperCase())}: ${escapeHtml(opts.badgeCode)}</div>
    ${fieldsHtml}
    ${
      hasItems
        ? `<div class="divider"></div>
           <div class="bold">${escapeHtml(opts.itemsTitle || `DETALLE (${opts.items?.length || 0})`)}</div>
           ${itemsHtml || '<div class="row">Sin ítems</div>'}`
        : ''
    }
    ${opts.notes ? `<div class="divider"></div><div class="row">Obs.: ${escapeHtml(opts.notes)}</div>` : ''}
    ${
      opts.authorizationTitle || opts.authorizationText || opts.signatureImage
        ? `<div style="margin-top:6px;">
             ${opts.authorizationTitle ? `<div class="bold">${escapeHtml(opts.authorizationTitle.toUpperCase())}</div>` : ''}
             ${opts.authorizationText ? `<div class="row">${escapeHtml(opts.authorizationText)}</div>` : ''}
             ${opts.signatureImage ? `<img class="sig-img" src="${opts.signatureImage}" alt="Firma" />` : ''}
           </div>`
        : ''
    }
    ${
      opts.signatureLineLabel
        ? `<div class="sign-line"></div><div>${escapeHtml(opts.signatureLineLabel)}</div>`
        : ''
    }
    <div class="qr-box">
      <img src="${qrUrl}" alt="QR" />
    </div>
    <div class="bold" style="margin-top:4px;">${escapeHtml(opts.footerCode || opts.badgeCode)}</div>
    <div>Documento valido - Sistema ECAR ERP</div>
  </div>

  <script>
    const ESCPOS_B64 = "${escposBase64}";
    function b64ToBytes(b64) {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    }
    async function printViaBridge() {
      const st = document.getElementById('status');
      st.textContent = 'Conectando con puente 127.0.0.1:18181...';
      try {
        const res = await fetch('http://127.0.0.1:18181/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ escposBase64: ESCPOS_B64 })
        });
        const j = await res.json();
        if (j && j.ok) {
          st.textContent = '✅ Ticket ESC/POS enviado a la impresora.';
        } else {
          st.textContent = '❌ No se pudo imprimir en el puente.';
        }
      } catch (e) {
        st.textContent = '⚠️ Puente no detectado. Descargá y ejecutá ecar-print-bridge.ps1';
      }
    }
    async function printViaSerial() {
      const st = document.getElementById('status');
      if (!navigator.serial) {
        st.textContent = '⚠️ Usá Chrome o Edge para Web Serial.';
        return;
      }
      try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(b64ToBytes(ESCPOS_B64));
        writer.releaseLock();
        await port.close();
        st.textContent = '✅ Ticket ESC/POS impreso por puerto Serial.';
      } catch (e) {
        st.textContent = '❌ ' + (e.message || 'Error Web Serial');
      }
    }
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=740');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
