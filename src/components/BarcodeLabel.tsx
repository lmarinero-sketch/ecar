import React, { useRef, useEffect, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X } from 'lucide-react';
import type { InventoryItem } from '../lib/types';

interface BarcodeLabelProps {
  item: InventoryItem;
  onClose: () => void;
}

/**
 * Generates a unique barcode value from an inventory item.
 * Uses existing barcode/qr_code if available, otherwise generates from ID.
 */
const getBarcodeValue = (item: InventoryItem): string => {
  if (item.barcode) return item.barcode;
  if (item.qr_code) return item.qr_code;
  // Generate a deterministic code from the item ID (last 8 chars uppercase)
  const shortId = item.id.replace(/-/g, '').slice(-8).toUpperCase();
  return `ECAR-${shortId}`;
};

const categoryLabel = (cat: string) => {
  switch (cat) {
    case 'herramienta': return 'HERRAMIENTA';
    case 'material': return 'MATERIAL';
    case 'consumible': return 'CONSUMIBLE';
    default: return cat.toUpperCase();
  }
};

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ item, onClose }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const barcodeValue = getBarcodeValue(item);

  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          margin: 8,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch {
        // Fallback for invalid barcode values
        JsBarcode(barcodeRef.current, 'INVALID', {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
        });
      }
    }
  }, [barcodeValue]);

  const handlePrint = useCallback(() => {
    if (!printAreaRef.current) return;

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta - ${item.name}</title>
        <style>
          @page { size: 100mm 60mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #fff;
          }
          .label {
            width: 90mm;
            padding: 4mm;
            border: 1px solid #ccc;
            border-radius: 3mm;
          }
          .logo-line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2mm;
            padding-bottom: 2mm;
            border-bottom: 1px solid #e5e5e5;
          }
          .company { font-size: 11pt; font-weight: 700; color: #115c9c; letter-spacing: 1px; }
          .cat-badge {
            font-size: 7pt; font-weight: 700; text-transform: uppercase;
            background: #f0f0f0; padding: 1mm 3mm; border-radius: 2mm;
            color: #555; letter-spacing: 0.5px;
          }
          .item-name {
            font-size: 11pt; font-weight: 700; color: #222;
            margin-bottom: 1mm; line-height: 1.3;
          }
          .item-unit {
            font-size: 8pt; color: #888; margin-bottom: 2mm;
          }
          .barcode-container {
            text-align: center;
            margin-top: 1mm;
          }
          .barcode-container svg { width: 100%; height: auto; max-height: 20mm; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="logo-line">
            <span class="company">ECAR</span>
            <span class="cat-badge">${categoryLabel(item.category)}</span>
          </div>
          <div class="item-name">${item.name}</div>
          <div class="item-unit">Unidad: ${item.unit} · Stock mín: ${item.min_stock}</div>
          <div class="barcode-container">
            ${barcodeRef.current?.outerHTML || ''}
          </div>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [item, barcodeValue]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Printer size={18} className="text-ecar-blue" />
            Etiqueta con Código de Barras
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div ref={printAreaRef} className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-white">
            {/* Label Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-ecar-blue tracking-wider">ECAR</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                item.category === 'herramienta' ? 'bg-ecar-blueLight text-ecar-blue' :
                item.category === 'consumible' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {categoryLabel(item.category)}
              </span>
            </div>

            {/* Item Info */}
            <p className="font-bold text-gray-800 text-base mb-0.5">{item.name}</p>
            <p className="text-xs text-gray-400 mb-3">
              Unidad: {item.unit} · Stock mín: {item.min_stock}
            </p>

            {/* Barcode */}
            <div className="flex justify-center bg-white rounded-lg p-2">
              <svg ref={barcodeRef} />
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-400 text-center mt-3">
            Código: <span className="font-mono font-bold text-gray-600">{barcodeValue}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary 
          >
            <Printer size={16} />
            Imprimir Etiqueta
          </button>
        </div>
      </div>
    </div>
  );
};
