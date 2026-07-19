import React, { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { useEmployees, useCreateWeeklyPaymentItem } from '../hooks/useData';

interface Props {
  paymentId: string;
  onClose: () => void;
  onSuccess: () => void;
  currentItemsCount: number;
}

export const PayObreroModal: React.FC<Props> = ({ paymentId, onClose, onSuccess, currentItemsCount }) => {
  const { data: employees = [] } = useEmployees();
  const createItem = useCreateWeeklyPaymentItem();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [monto, setMonto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar obreros: si no hay búsqueda, mostramos todos
  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    return (emp.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (emp.cuil || '').includes(searchTerm);
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const handleSave = async () => {
    if (!selectedEmployee) return;
    const finalMonto = parseFloat(monto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    if (finalMonto <= 0) return;

    await createItem.mutateAsync({
      payment_id: paymentId,
      concepto: 'SUELDO OBREROS',
      monto: finalMonto,
      alias_cbu: selectedEmployee.bank_alias_cbu || '',
      titular_cuenta: selectedEmployee.full_name || '',
      nro_factura: '',
      observaciones: observaciones.trim(),
      source_type: 'sueldos_obreros',
      orden: currentItemsCount,
    });
    
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5">
        <div className="flex justify-between items-center border-b pb-3">
          <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">Pagar a Obrero</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Buscar y Seleccionar Obrero</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input 
                value={searchTerm} 
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setSelectedEmployeeId('');
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Escribe el Nombre o CUIL..." 
                className="w-full pl-9 pr-8 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 transition-all" 
              />
              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 cursor-pointer" onClick={() => setShowDropdown(!showDropdown)} />
            </div>

            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No se encontraron resultados</div>
                ) : (
                  filteredEmployees.map(emp => (
                    <div 
                      key={emp.id}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setSearchTerm(emp.full_name || '');
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-bold text-gray-800">{emp.full_name}</span>
                      {emp.cuil && <span className="ml-2 text-xs text-gray-500">({emp.cuil})</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedEmployee && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800 font-bold mb-1">Datos Bancarios:</p>
              <p className="text-sm font-mono text-blue-900">{selectedEmployee.bank_alias_cbu || 'Sin CBU cargado'}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Monto a Pagar</label>
            <input 
              value={monto} 
              onChange={e => setMonto(e.target.value)} 
              placeholder="0.00" 
              className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 transition-all" 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Observaciones</label>
            <input 
              value={observaciones} 
              onChange={e => setObservaciones(e.target.value)} 
              placeholder="Ej: Adelanto, Quincena, Cancelación..." 
              className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 transition-all" 
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
          <button 
            onClick={handleSave} 
            disabled={!selectedEmployeeId || !monto}
            className="btn-primary"
          >
            Guardar Pago
          </button>
        </div>
      </div>
    </div>
  );
};
