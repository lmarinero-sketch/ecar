import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import type { Invoice, PurchaseInvoice } from '../lib/types';

interface Props {
  type: 'invoice' | 'purchase_invoice';
  invoices: Invoice[] | PurchaseInvoice[];
  value: string | null;
  onChange: (id: string | null) => void;
}

export function InvoiceSearchSelector({ type, invoices, value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLabel = (inv: Invoice | PurchaseInvoice) => {
    if (type === 'invoice') {
      const i = inv as Invoice;
      return `${i.receptor_name} - Fac ${i.point_of_sale}-${i.invoice_number} ($${i.total_ars.toLocaleString('es-AR')})`;
    } else {
      const pi = inv as PurchaseInvoice;
      return `${pi.supplier?.name || 'Proveedor'} - Fac ${pi.point_of_sale}-${pi.invoice_number} ($${pi.total_ars.toLocaleString('es-AR')})`;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const label = getLabel(inv).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  const selectedInvoice = invoices.find(inv => inv.id === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center"
      >
        <span className={selectedInvoice ? "text-gray-900 truncate" : "text-gray-400"}>
          {selectedInvoice ? getLabel(selectedInvoice) : "Seleccionar factura (Opcional)"}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b flex items-center gap-2 sticky top-0 bg-white">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full text-sm outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto">
            <div 
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 text-gray-500 italic ${!value ? 'bg-gray-50' : ''}`}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
            >
              Ninguna (Desvincular)
            </div>
            {filteredInvoices.map(inv => (
              <div 
                key={inv.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center ${value === inv.id ? 'bg-blue-50 text-ecar-blue font-medium' : 'text-gray-700'}`}
                onClick={() => {
                  onChange(inv.id);
                  setIsOpen(false);
                }}
              >
                <span className="truncate pr-2">{getLabel(inv)}</span>
                {value === inv.id && <Check size={14} className="text-ecar-blue shrink-0" />}
              </div>
            ))}
            {filteredInvoices.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                No se encontraron facturas
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
