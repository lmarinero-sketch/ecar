/**
 * Generador unificado de Tickets Térmicos de 58 mm (ancho útil seguro: 48–50 mm).
 * Optimizado para impresoras térmicas de 58 mm (203 dpi, blanco y negro puro):
 * - Sin fondos negros sólidos que manchen el papel térmico ni saturen el cabezal.
 * - Tipografía nítida (sans-serif para lectura + monospace para códigos y cantidades).
 * - Separadores punteados/dobles, recuadro de comprobante, firma y código QR.
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
  subtitle: string;
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

export function printThermalTicket58mm(opts: ThermalTicket58mmOptions) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}/logoECAR.png`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=1&data=${encodeURIComponent(
    opts.qrPayload
  )}`;

  const fieldsHtml = opts.fields
    .filter(f => f.value !== undefined && f.value !== null && String(f.value).trim() !== '')
    .map(
      f => `
      <div class="kv-row ${f.highlight ? 'kv-highlight' : ''}">
        <span class="kv-label">${escapeHtml(f.label)}</span>
        <span class="kv-value">${escapeHtml(f.value)}</span>
      </div>`
    )
    .join('');

  const hasItems = Array.isArray(opts.items);
  const itemsHtml = hasItems
    ? (opts.items || [])
        .map(
          it => `
        <div class="item-row">
          <div class="item-qty">${escapeHtml(String(it.quantity))}${it.unit ? ` ${escapeHtml(it.unit)}` : ''}</div>
          <div class="item-desc">
            ${escapeHtml(it.description)}
            ${it.code ? `<div class="item-code">Cód: ${escapeHtml(it.code)}</div>` : ''}
          </div>
        </div>`
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
      margin: 1.5mm;
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
    .ticket {
      width: 49mm;
      max-width: 49mm;
      margin: 0 auto;
      padding: 1.5mm 0.5mm 3mm;
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      line-height: 1.3;
    }
    .header {
      text-align: center;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #000;
    }
    .brand-logo {
      display: block;
      max-width: 32mm;
      max-height: 12mm;
      width: auto;
      height: auto;
      margin: 0 auto 3px;
      object-fit: contain;
      filter: grayscale(100%) contrast(150%);
    }
    .brand {
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: 2px;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .doc-title {
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 4px;
      line-height: 1.2;
    }
    .doc-box {
      margin: 5px 0;
      padding: 4px 5px;
      border: 1.5px solid #000;
      border-radius: 3px;
      text-align: center;
    }
    .doc-box-label {
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-box-code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 10.5pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    .divider-dashed {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .divider-solid {
      border-top: 1px solid #000;
      margin: 5px 0;
    }
    .kv-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .kv-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
      font-size: 8pt;
      padding-bottom: 2px;
      border-bottom: 1px dotted #ccc;
    }
    .kv-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .kv-label {
      font-weight: 700;
      flex-shrink: 0;
      max-width: 44%;
      word-break: break-word;
    }
    .kv-value {
      text-align: right;
      word-break: break-word;
      flex: 1;
    }
    .kv-highlight .kv-value {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
      font-weight: 900;
    }
    .section-title {
      font-size: 7.5pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
    }
    .item-row {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 8pt;
      padding: 2.5px 0;
      border-bottom: 1px dotted #ccc;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-qty {
      font-family: 'Consolas', 'Courier New', monospace;
      font-weight: 900;
      white-space: nowrap;
      flex-shrink: 0;
      min-width: 11mm;
    }
    .item-desc {
      flex: 1;
      word-break: break-word;
    }
    .item-code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 7pt;
    }
    .notes-box {
      font-size: 7.5pt;
      word-break: break-word;
      line-height: 1.25;
    }
    .auth-box {
      font-size: 7.5pt;
      word-break: break-word;
    }
    .sig-img {
      display: block;
      max-width: 34mm;
      max-height: 14mm;
      margin: 4px auto 2px;
      object-fit: contain;
    }
    .sign-area {
      margin-top: 10px;
      font-size: 7.5pt;
      text-align: center;
    }
    .sign-line {
      border-bottom: 1px solid #000;
      height: 14px;
      margin: 0 4mm 2px;
    }
    .qr-box {
      margin-top: 6px;
      text-align: center;
    }
    .qr-box img {
      width: 24mm;
      height: 24mm;
      display: inline-block;
      border: 1px solid #000;
      padding: 1px;
    }
    .footer-code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 7pt;
      margin-top: 2px;
      font-weight: 700;
    }
    .footer-note {
      font-size: 6.5pt;
      margin-top: 3px;
      text-align: center;
    }
    .no-print {
      max-width: 49mm;
      margin: 6px auto 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .no-print button {
      width: 100%;
      padding: 7px 10px;
      font-family: 'Segoe UI', sans-serif;
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid #000;
      border-radius: 4px;
      background: #ffffff !important;
      cursor: pointer;
    }
    .no-print button:hover {
      background: #f1f5f9 !important;
    }
    .no-print span {
      font-family: 'Segoe UI', sans-serif;
      font-size: 9px;
    }
    @media print {
      .no-print { display: none !important; }
      html, body { width: 58mm; margin: 0; padding: 0; }
      .ticket { width: 49mm; max-width: 49mm; padding: 0.5mm 0 2mm; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ Imprimir Ticket (58mm)</button>
    <span>Formato adaptado para impresora térmica 58mm</span>
  </div>

  <div class="ticket">
    <div class="header">
      <img class="brand-logo" src="${logoUrl}" alt="ECAR" onerror="this.style.display='none'; document.getElementById('brand-fallback').style.display='block';" />
      <div id="brand-fallback" class="brand" style="display:none;">ECAR</div>
      <div class="brand-sub">${escapeHtml(opts.subtitle)}</div>
      <div class="doc-title">${escapeHtml(opts.documentTitle)}</div>
    </div>

    <div class="doc-box">
      <div class="doc-box-label">${escapeHtml(opts.badgeLabel)}</div>
      <div class="doc-box-code">${escapeHtml(opts.badgeCode)}</div>
    </div>

    <div class="kv-list">
      ${fieldsHtml}
    </div>

    ${
      hasItems
        ? `
      <div class="divider-dashed"></div>
      <div class="section-title">${escapeHtml(opts.itemsTitle || `Detalle de Ítems (${opts.items?.length || 0})`)}</div>
      ${itemsHtml || '<div class="notes-box">Sin ítems detallados</div>'}
    `
        : ''
    }

    ${
      opts.notes
        ? `
      <div class="divider-dashed"></div>
      <div class="notes-box"><strong>Obs.:</strong> ${escapeHtml(opts.notes)}</div>
    `
        : ''
    }

    ${
      opts.authorizationTitle || opts.authorizationText || opts.signatureImage
        ? `
      <div class="divider-dashed"></div>
      <div class="auth-box">
        ${opts.authorizationTitle ? `<div class="section-title">${escapeHtml(opts.authorizationTitle)}</div>` : ''}
        ${opts.authorizationText ? `<div>${escapeHtml(opts.authorizationText)}</div>` : ''}
        ${opts.signatureImage ? `<img class="sig-img" src="${opts.signatureImage}" alt="Firma" />` : ''}
      </div>
    `
        : ''
    }

    ${
      opts.signatureLineLabel
        ? `
      <div class="sign-area">
        <div class="sign-line"></div>
        <div>${escapeHtml(opts.signatureLineLabel)}</div>
      </div>
    `
        : ''
    }

    <div class="divider-solid"></div>

    <div class="qr-box">
      <img src="${qrUrl}" alt="QR Verificación" />
      <div class="footer-code">${escapeHtml(opts.footerCode || opts.badgeCode)}</div>
    </div>
    <div class="footer-note">Documento válido · Sistema ECAR ERP</div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 250);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=360,height=680');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
