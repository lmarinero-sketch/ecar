import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { useModalStore } from '../../store/useModalStore';
import type { WarehouseShelf } from '../../lib/types';
import { useCreateWarehouseShelf, useCreateInventoryItem } from '../../hooks/useData';

interface Props {
  existingShelves: WarehouseShelf[];
  onComplete: () => void;
}

// Parse fractions like "1/4" to 0.25, and split numeric from units like "15m" to 15, "m"
const parseStockAndUnit = (rawStock: string | number | undefined): { qty: number, unit: string } => {
  if (rawStock === undefined || rawStock === null || rawStock === '') {
    return { qty: 0, unit: 'unidad' };
  }
  
  const stockStr = String(rawStock).trim().toLowerCase();
  
  // Fraction check
  if (stockStr.includes('/')) {
    const [num, den] = stockStr.split('/');
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (!isNaN(n) && !isNaN(d) && d !== 0) {
      return { qty: n / d, unit: 'unidad' }; // The unit might need manual fixing later, but fraction is parsed
    }
  }

  // Regex to separate number and string (e.g., "15m" -> "15", "m")
  const match = stockStr.match(/^([\d.,]+)\s*([a-zA-Z]*)$/);
  if (match) {
    const qty = parseFloat(match[1].replace(',', '.'));
    const unit = match[2] || 'unidad';
    return { qty: isNaN(qty) ? 0 : qty, unit };
  }

  const numVal = parseFloat(stockStr.replace(',', '.'));
  if (!isNaN(numVal)) {
    return { qty: numVal, unit: 'unidad' };
  }

  return { qty: 0, unit: 'unidad' };
};

export const WarehouseExcelImporter: React.FC<Props> = ({ existingShelves, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const createShelf = useCreateWarehouseShelf();
  const createItem = useCreateInventoryItem();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      // Expecting headers: Descripción, Rubro, medida, Stock, Estanteria, nivel, bin, observaciones
      const data = XLSX.utils.sheet_to_json(ws);
      setParsedData(data);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const processImport = async () => {
    if (parsedData.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const localShelves = [...existingShelves];
      
      // 1. Identify missing shelves and create them
      const uniqueShelfIds = new Set(parsedData.map(r => String(r.Estanteria || '').trim()).filter(Boolean));
      
      for (const shelfCode of Array.from(uniqueShelfIds)) {
        const fullCode = `EST-${shelfCode.padStart(2, '0')}`;
        if (!localShelves.find(s => s.code === fullCode)) {
          // Create shelf
          const newShelf = await createShelf.mutateAsync({
            code: fullCode,
            name: `Estantería ${shelfCode}`,
            shelf_type: 'rack',
            rows_count: 5,
            columns_count: 3,
            color: '#3B82F6',
            grid_row: 0,
            grid_col: localShelves.length, // Put them in a line for now
            grid_width: 1,
            grid_height: 1,
            is_active: true
          });
          localShelves.push(newShelf as any);
        }
      }

      // 2. Import items
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        if (!row['Descripción']?.trim()) continue;

        const { qty, unit } = parseStockAndUnit(row.Stock);
        
        let shelfId = null;
        let shelfPos = null;

        if (row.Estanteria) {
          const shelfCode = `EST-${String(row.Estanteria).trim().padStart(2, '0')}`;
          const shelf = localShelves.find(s => s.code === shelfCode);
          if (shelf) {
            shelfId = shelf.id;
            // Build position string, e.g., N2-B46
            const n = row.nivel ? `N${row.nivel}` : 'N1';
            const b = row.bin ? `-B${row.bin}` : '';
            shelfPos = `${n}${b}`;
          }
        }

        await createItem.mutateAsync({
          name: String(row['Descripción']).trim(),
          rubro: row.Rubro ? String(row.Rubro).trim() : null,
          measure: row.medida ? String(row.medida).trim() : null,
          category: 'material', // default
          current_stock: qty,
          min_stock: 0,
          unit: unit,
          shelf_id: shelfId,
          shelf_position: shelfPos,
          notes: row.observaciones ? String(row.observaciones).trim() : null,
          location: 'panol'
        });

        setProgress(Math.round(((i + 1) / parsedData.length) * 100));
      }

      useModalStore.getState().showAlert('Éxito', `Se importaron ${parsedData.length} ítems correctamente.`);
      onComplete();
    } catch (error) {
      console.error(error);
      useModalStore.getState().showAlert('Error', 'Hubo un error al procesar la importación. Revisa la consola para más detalles.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <UploadCloud size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Importar Pañol desde Excel</h2>
          <p className="text-sm text-slate-500">Sube el archivo .xlsx con las columnas: Descripción, Rubro, medida, Stock, Estanteria, nivel, bin, observaciones.</p>
        </div>
      </div>

      {!parsedData.length ? (
        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <UploadCloud size={32} className="text-slate-400 mb-3" />
          <p className="font-medium text-slate-700">Haz clic para seleccionar el archivo Excel</p>
          <p className="text-xs text-slate-500 mt-1">Soporta .xlsx y .xls</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 size={18} />
              Archivo cargado: {file?.name} ({parsedData.length} filas detectadas)
            </div>
            <button 
              onClick={() => { setFile(null); setParsedData([]); }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Cambiar archivo
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 text-amber-800">
            <AlertCircle size={20} className="shrink-0" />
            <div className="text-sm">
              <p className="font-bold mb-1">Antes de importar:</p>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>Los ítems sin estantería se guardarán sin asignar.</li>
                <li>Las estanterías nuevas se crearán automáticamente.</li>
                <li>Fracciones (ej. "1/4") y unidades combinadas (ej. "15m") se separarán inteligentemente.</li>
              </ul>
            </div>
          </div>

          {isProcessing ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Procesando...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-ecar-blue h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <button 
              onClick={processImport}
              className="btn-primary w-full py-3 flex justify-center items-center gap-2"
            >
              <Play size={18} /> Iniciar Importación Masiva
            </button>
          )}
        </div>
      )}
    </div>
  );
};
