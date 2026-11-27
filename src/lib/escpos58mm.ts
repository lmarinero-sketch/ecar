/**
 * Generador nativo de comandos ESC/POS para impresoras térmicas de 58 mm (32 columnas).
 * Produce salida idéntica a impresión directa por puerto/spooler RAW:
 * - Fuente interna (32 caracteres por línea con word-wrap limpio)
 * - Codificación CP850 para acentos y ñ
 * - Firma manuscrita en raster ESC/POS (GS v 0)
 * - Código QR nativo (GS ( k)
 * - Corte de papel (GS V)
 */

import type { ThermalTicket58mmOptions } from './thermalTicket58mm';

const LINE_WIDTH = 32;

// Mapeo UTF-8 -> CP850 para impresoras térmicas 58mm
const CP850_MAP: Record<string, number> = {
  á: 0xa0,
  é: 0x82,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  Á: 0xb5,
  É: 0x90,
  Í: 0xd6,
  Ó: 0xe0,
  Ú: 0xe9,
  ñ: 0xa4,
  Ñ: 0xa5,
  ü: 0x81,
  Ü: 0x9a,
  '°': 0xf8,
  'º': 0xa7,
  'ª': 0xa6,
  '¿': 0xa8,
  '¡': 0xad,
  '·': 0xfa,
};

function encodeCP850(text: string): number[] {
  const bytes: number[] = [];
  for (const ch of text) {
    if (CP850_MAP[ch] !== undefined) {
      bytes.push(CP850_MAP[ch]);
    } else {
      const code = ch.charCodeAt(0);
      bytes.push(code >= 32 && code <= 126 ? code : code === 10 ? 10 : 0x20);
    }
  }
  return bytes;
}

function wrapLines(text: string, width = LINE_WIDTH): string[] {
  const clean = String(text ?? '').replace(/\r/g, '');
  const paragraphs = clean.split('\n');
  const out: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';
    for (const w of words) {
      if (!current) {
        if (w.length <= width) {
          current = w;
        } else {
          // Partir palabra larga
          for (let i = 0; i < w.length; i += width) {
            const slice = w.slice(i, i + width);
            if (slice.length === width) out.push(slice);
            else current = slice;
          }
        }
      } else if (current.length + 1 + w.length <= width) {
        current += ' ' + w;
      } else {
        out.push(current);
        if (w.length <= width) {
          current = w;
        } else {
          current = '';
          for (let i = 0; i < w.length; i += width) {
            const slice = w.slice(i, i + width);
            if (slice.length === width) out.push(slice);
            else current = slice;
          }
        }
      }
    }
    if (current) out.push(current);
  }
  return out;
}

/**
 * Convierte una imagen base64/URL (ej. firma manuscrita) a comando ESC/POS GS v 0 (monocromo 1-bit).
 */
async function imageToEscPosRaster(src: string, maxWidthPx = 224, maxHeightPx = 72): Promise<number[]> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const scale = Math.min(maxWidthPx / img.width, maxHeightPx / img.height, 1);
          const w = Math.max(8, Math.floor((img.width * scale) / 8) * 8); // múltiplo de 8
          const h = Math.max(8, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve([]);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const imgData = ctx.getImageData(0, 0, w, h).data;
          const bytesPerRow = w / 8;
          const cmd: number[] = [
            0x1d, 0x76, 0x30, 0x00, // GS v 0 m=0
            bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff, // xL xH
            h & 0xff, (h >> 8) & 0xff, // yL yH
          ];

          for (let y = 0; y < h; y++) {
            for (let bx = 0; bx < bytesPerRow; bx++) {
              let byte = 0;
              for (let bit = 0; bit < 8; bit++) {
                const x = bx * 8 + bit;
                const idx = (y * w + x) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];
                const a = imgData[idx + 3];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                // Si el píxel es oscuro y visible, encender bit
                if (a > 100 && lum < 180) {
                  byte |= 1 << (7 - bit);
                }
              }
              cmd.push(byte);
            }
          }
          resolve(cmd);
        } catch {
          resolve([]);
        }
      };
      img.onerror = () => resolve([]);
      img.src = src;
    } catch {
      resolve([]);
    }
  });
}

function buildQrCommands(data: string, moduleSize = 6): number[] {
  const utf8Bytes = Array.from(new TextEncoder().encode(data));
  const storeLen = utf8Bytes.length + 3;
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;

  return [
    // Model 2
    0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
    // Tamaño de módulo (1-16, 6 es nítido en 58mm)
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize,
    // Corrección de errores M (49)
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31,
    // Guardar datos
    0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30,
    ...utf8Bytes,
    // Imprimir QR
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
  ];
}

export async function buildEscPosTicketBytes(opts: ThermalTicket58mmOptions): Promise<Uint8Array> {
  const buf: number[] = [];
  const push = (...bytes: number[]) => buf.push(...bytes);
  const line = (text = '') => {
    for (const l of wrapLines(text)) {
      buf.push(...encodeCP850(l), 0x0a);
    }
  };
  const divider = (ch = '-') => {
    buf.push(...encodeCP850(ch.repeat(LINE_WIDTH)), 0x0a);
  };
  const align = (mode: 'left' | 'center' | 'right') => {
    const n = mode === 'center' ? 1 : mode === 'right' ? 2 : 0;
    push(0x1b, 0x61, n);
  };
  const bold = (on: boolean) => push(0x1b, 0x45, on ? 1 : 0);

  // Inicializar impresora y seleccionar CP850
  push(0x1b, 0x40); // ESC @
  push(0x1b, 0x74, 0x02); // ESC t 2 (CP850)

  // Cabecera
  align('left');
  bold(true);
  line(opts.documentTitle);
  line('ECAR S.A.S');
  if (opts.subtitle) line(opts.subtitle);
  bold(false);
  divider('-');

  // Código principal destacado
  bold(true);
  line(`${opts.badgeLabel.toUpperCase()}: ${opts.badgeCode}`);
  bold(false);

  // Campos clave-valor
  for (const f of opts.fields) {
    if (f.value === undefined || f.value === null || String(f.value).trim() === '') continue;
    if (f.highlight) bold(true);
    line(`${f.label} ${f.value}`);
    if (f.highlight) bold(false);
  }

  // Ítems (si corresponde, ej. Remito)
  if (Array.isArray(opts.items)) {
    divider('-');
    bold(true);
    line(opts.itemsTitle || `DETALLE DE ITEMS (${opts.items.length})`);
    bold(false);
    if (opts.items.length === 0) {
      line('Sin items detallados');
    } else {
      for (const it of opts.items) {
        const qtyStr = `${it.quantity}${it.unit ? ` ${it.unit}` : ''} x`;
        bold(true);
        line(`${qtyStr} ${it.description}`);
        bold(false);
        if (it.code) line(`  Cod: ${it.code}`);
      }
    }
  }

  // Observaciones
  if (opts.notes) {
    divider('-');
    line(`Obs.: ${opts.notes}`);
  }

  // Autorización / Firma
  if (opts.authorizationTitle || opts.authorizationText || opts.signatureImage) {
    push(0x0a);
    if (opts.authorizationTitle) {
      bold(true);
      line(opts.authorizationTitle.toUpperCase());
      bold(false);
    }
    if (opts.authorizationText) {
      line(opts.authorizationText);
    }
    if (opts.signatureImage) {
      const raster = await imageToEscPosRaster(opts.signatureImage);
      if (raster.length > 0) {
        align('center');
        push(0x0a);
        buf.push(...raster);
        push(0x0a);
        align('left');
      }
    }
  }

  // Línea de firma física
  if (opts.signatureLineLabel) {
    push(0x0a);
    divider('-');
    line(opts.signatureLineLabel);
  }

  // QR Nativo centrado
  push(0x0a);
  align('center');
  buf.push(...buildQrCommands(opts.qrPayload, 6));
  push(0x0a, 0x0a);

  // Pie
  align('left');
  bold(true);
  line(opts.footerCode || opts.badgeCode);
  bold(false);
  line('Documento valido - Sistema ECAR ERP');

  // Avance y corte de papel
  push(0x0a, 0x0a, 0x0a, 0x0a);
  push(0x1d, 0x56, 0x42, 0x00); // GS V 66 0 (Feed and partial cut)

  return new Uint8Array(buf);
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const LOCAL_BRIDGE_URL = 'http://127.0.0.1:18181/print';

/**
 * Intenta enviar los bytes ESC/POS al puente local de Windows (PowerShell RAW).
 * Retorna true si imprimió correctamente.
 */
export async function tryPrintViaLocalBridge(escposBytes: Uint8Array): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(LOCAL_BRIDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escposBase64: uint8ToBase64(escposBytes) }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    return Boolean(json && json.ok);
  } catch {
    return false;
  }
}

/**
 * Impresión directa por Web Serial API (Chrome/Edge) para impresoras térmicas USB-Serial / COM.
 */
export async function printViaWebSerial(escposBytes: Uint8Array): Promise<boolean> {
  const nav = navigator as any;
  if (!nav?.serial) {
    throw new Error('Tu navegador no soporta Web Serial. Usá Chrome/Edge o el Puente Windows (.ps1).');
  }
  const port = await nav.serial.requestPort();
  await port.open({ baudRate: 9600 });
  try {
    const writer = port.writable.getWriter();
    await writer.write(escposBytes);
    writer.releaseLock();
    return true;
  } finally {
    await port.close();
  }
}
