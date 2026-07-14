import * as XLSX from 'xlsx';

interface InvoiceRow {
  id: string;
  legal_entity_id?: string | null;
  issue_date: string | null;
  invoice_type: string | null;
  point_of_sale: string | null;
  invoice_number: string | null;
  net_amount_ars: number;
  iva_21_ars: number;
  iva_105_ars: number;
  iva_27_ars: number;
  exempt_ars: number;
  perceptions_iva_ars: number;
  perceptions_iibb_ars: number;
  total_ars: number;
  ocr_raw_data?: Record<string, unknown> | null;
  supplier?: { name: string; cuit?: string } | null;
}

/**
 * Generates and downloads an Excel file formatted as "Libro IVA Subdiario"
 * matching the official Argentine Libro IVA format for both Compras and Ventas.
 */
export function generateLibroIVA(
  invoices: InvoiceRow[],
  periodoDesde: string,
  periodoHasta: string,
  legalEntity?: { id: string; name: string; cuit: string | null }
) {
  const wb = XLSX.utils.book_new();

  // Filter by company if provided
  const targetInvoices = legalEntity ? invoices.filter(i => i.legal_entity_id === legalEntity.id) : invoices;

  // Separate compras and ventas
  const compras = targetInvoices.filter(i => !i.ocr_raw_data?.tipo || i.ocr_raw_data?.tipo === 'compra');
  const ventas = targetInvoices.filter(i => i.ocr_raw_data?.tipo === 'venta');

  const empresaName = legalEntity?.name ? legalEntity.name.toUpperCase() : 'ECAR ( REGALADO CARLOS ADOLFO )';

  // ── SHEET: COMPRAS ──
  if (compras.length > 0 || ventas.length === 0) {
    const wsData: (string | number | null)[][] = [];

    // Header rows
    wsData.push(['', `SUB DIARIO IVA COMPRAS EMPRESA ${empresaName.split(' ')[0]}`]);
    wsData.push(['DENOM. O APELLIDO', '', empresaName, '', '', `PERIODO INFORM. DESDE: ${periodoDesde}`]);
    wsData.push(['', '', '', '', '', `PERIODO INFORM. HASTA: ${periodoHasta}`]);
    wsData.push([]); // blank row

    // Column headers
    wsData.push([
      'FECHA',
      'TIPO DE COMPRA',
      'P. DE VENTA',
      'NR DE COMPR.',
      'APELLIDO Y NOMBRE/DENOM. DEL PROVEEDOR',
      'CUIT',
      'IMPORTE TOTAL COMPRA',
      'IMP. NETO SUJ. A IMPUESTO',
      'IVA LIQUIDADO',
      'FACT B Y C',
      'IIBB / LH',
    ]);

    // Data rows
    let totalCompra = 0;
    let totalNeto = 0;
    let totalIva = 0;
    let totalIibb = 0;

    compras.forEach(inv => {
      const name = (inv.ocr_raw_data?.proveedor_cliente as string) || inv.supplier?.name || '';
      const cuit = (inv.ocr_raw_data?.cuit as string) || '';
      const tipoFact = inv.invoice_type || (inv.ocr_raw_data?.tipo_factura as string) || '';
      const ptoVenta = inv.point_of_sale || (inv.ocr_raw_data?.punto_venta as string) || '';
      const nroFact = inv.invoice_number || (inv.ocr_raw_data?.numero_factura as string) || '';
      const total = Number(inv.total_ars) || 0;
      const neto = Number(inv.net_amount_ars) || 0;
      const iva = Number(inv.iva_21_ars) + Number(inv.iva_105_ars) + Number(inv.iva_27_ars);
      const iibb = Number(inv.perceptions_iibb_ars) || 0;

      totalCompra += total;
      totalNeto += neto;
      totalIva += iva;
      totalIibb += iibb;

      wsData.push([
        inv.issue_date || '',
        tipoFact,
        ptoVenta,
        nroFact,
        name,
        cuit,
        total,
        neto,
        iva,
        tipoFact === 'B' || tipoFact === 'C' ? total : null,
        iibb || null,
      ]);
    });

    // Totals row
    wsData.push([]);
    wsData.push([
      '', '', '', '', 'TOTALES', '',
      totalCompra,
      totalNeto,
      totalIva,
      null,
      totalIibb || null,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 12 }, // FECHA
      { wch: 6 },  // TIPO
      { wch: 8 },  // P. VENTA
      { wch: 12 }, // NR COMPR.
      { wch: 45 }, // PROVEEDOR
      { wch: 16 }, // CUIT
      { wch: 18 }, // TOTAL COMPRA
      { wch: 18 }, // NETO
      { wch: 15 }, // IVA
      { wch: 12 }, // FACT B Y C
      { wch: 12 }, // IIBB
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'COMPRAS');
  }

  // ── SHEET: VENTAS ──
  if (ventas.length > 0) {
    const wsData: (string | number | null)[][] = [];

    // Header rows
    wsData.push(['', `SUB DIARIO IVA VENTAS EMPRESA ${empresaName.split(' ')[0]}`]);
    wsData.push(['DENOM. O APELLIDO', '', empresaName, '', '', `PERIODO INFORM. DESDE: ${periodoDesde}`]);
    wsData.push(['', '', '', '', '', `PERIODO INFORM. HASTA: ${periodoHasta}`]);
    wsData.push([]);

    wsData.push([
      'FECHA',
      'TIPO DE VENTA',
      'P. DE VENTA',
      'NR DE COMPR.',
      'APELLIDO Y NOMBRE/DENOM. DEL CLIENTE',
      'CUIT',
      'IMPORTE TOTAL VENTA',
      'IMP. NETO SUJ. A IMPUESTO',
      'IVA LIQUIDADO',
      'FACT B Y C',
      'IIBB / LH',
    ]);

    let totalVenta = 0;
    let totalNeto = 0;
    let totalIva = 0;
    let totalIibb = 0;

    ventas.forEach(inv => {
      const name = (inv.ocr_raw_data?.proveedor_cliente as string) || '';
      const cuit = (inv.ocr_raw_data?.cuit as string) || '';
      const tipoFact = inv.invoice_type || (inv.ocr_raw_data?.tipo_factura as string) || '';
      const ptoVenta = inv.point_of_sale || (inv.ocr_raw_data?.punto_venta as string) || '';
      const nroFact = inv.invoice_number || (inv.ocr_raw_data?.numero_factura as string) || '';
      const total = Number(inv.total_ars) || 0;
      const neto = Number(inv.net_amount_ars) || 0;
      const iva = Number(inv.iva_21_ars) + Number(inv.iva_105_ars) + Number(inv.iva_27_ars);
      const iibb = Number(inv.perceptions_iibb_ars) || 0;

      totalVenta += total;
      totalNeto += neto;
      totalIva += iva;
      totalIibb += iibb;

      wsData.push([
        inv.issue_date || '',
        tipoFact,
        ptoVenta,
        nroFact,
        name,
        cuit,
        total,
        neto,
        iva,
        tipoFact === 'B' || tipoFact === 'C' ? total : null,
        iibb || null,
      ]);
    });

    wsData.push([]);
    wsData.push([
      '', '', '', '', 'TOTALES', '',
      totalVenta,
      totalNeto,
      totalIva,
      null,
      totalIibb || null,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 12 },
      { wch: 45 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
      { wch: 15 }, { wch: 12 }, { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'VENTAS');
  }

  // Download

  const fileName = `Libro_IVA_${legalEntity?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'General'}_${periodoDesde.replace(/-/g, '')}_${periodoHasta.replace(/-/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
