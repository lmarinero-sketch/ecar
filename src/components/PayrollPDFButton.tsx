import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useModalStore } from '../store/useModalStore';

export const PayrollPDFButton: React.FC<{
  paymentItemId: string;
  concepto: string;
  monto: number;
}> = ({ paymentItemId, concepto, monto }) => {
  const [loading, setLoading] = useState(false);

  const formatARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const downloadPDF = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_payroll_details')
        .select('*, employee:employees(full_name, bank_alias_cbu)')
        .eq('weekly_payment_item_id', paymentItemId);

      if (error) throw error;
      
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("LIQUIDACIÓN Y TRANSFERENCIAS: PAGO A OBREROS", 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Concepto: ${concepto}`, 14, 22);
      doc.text(`Total a Pagar: ${formatARS(monto)}`, 14, 28);
      doc.text(`Cantidad de Obreros: ${data?.length || 0}`, 14, 34);

      const tableData = (data || []).map(row => [
        row.employee?.full_name || 'Desconocido',
        row.employee?.bank_alias_cbu || 'Sin CBU / Efectivo',
        `${row.worked_hours} hs`,
        formatARS(Number(row.final_amount))
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Obrero', 'Alias / CBU', 'Horas Semanales', 'Monto a Transferir']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // indigo-600
        columnStyles: {
          3: { halign: 'right', fontStyle: 'bold' }
        }
      });

      doc.save(`Pago_Obreros_${paymentItemId.slice(0,6)}.pdf`);
    } catch (e) {
      console.error(e);
      useModalStore.getState().showAlert('Error', "Error generando PDF de Sueldos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={downloadPDF} 
      disabled={loading}
      className="p-1 rounded text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
      title="Descargar PDF para Carlos"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
    </button>
  );
};
