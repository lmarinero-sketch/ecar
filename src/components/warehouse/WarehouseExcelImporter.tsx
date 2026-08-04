import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { useModalStore } from '../../store/useModalStore';
import type { WarehouseShelf } from '../../lib/types';
import { supabase, ECAR_TENANT_ID } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  existingShelves: WarehouseShelf[];
  onComplete: () => void;
}

// Helper to extract values from row independent of column header variations (accents, spaces, casing)
const getRowValue = (row: Record<string, any>, possibleKeys: string[]): any => {
  if (!row) return undefined;
  
  // 1. Direct key match
  for (const k of possibleKeys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }

  // 2. Normalized key match (strip accents, lowercase, strip whitespace & non-alphanumeric)
  const normKeys = Object.keys(row);
  const normPossible = possibleKeys.map(k => 
    k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
  );

  for (const rKey of normKeys) {
    const normRKey = rKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (normPossible.includes(normRKey)) {
      if (row[rKey] !== undefined && row[rKey] !== null) return row[rKey];
    }
  }

  return undefined;
};

// Normalize shelf codes to EST-XX
const normalizeShelfCode = (raw: any): string => {
  if (raw === undefined || raw === null || String(raw).trim() === '') return '';
  const str = String(raw).trim();
  const numStr = str.replace(/^(EST-|E-|E|Estanter[ií]a\s*)/i, '').trim();
  const num = parseInt(numStr, 10);
  if (!isNaN(num)) {
    return `EST-${String(num).padStart(2, '0')}`;
  }
  return `EST-${numStr.toUpperCase()}`;
};

// Parse fractions like "1/4" to 0.25, and split numeric from units like "15m" to 15, "m"
const parseStockAndUnit = (rawStock: any, defaultUnit?: any): { qty: number, unit: string } => {
  const fallbackUnit = defaultUnit ? String(defaultUnit).trim() : 'unidad';
  if (rawStock === undefined || rawStock === null || rawStock === '') {
    return { qty: 0, unit: fallbackUnit };
  }
  
  const stockStr = String(rawStock).trim().toLowerCase();
  
  // Fraction check (e.g. "1/2", "1/4")
  if (stockStr.includes('/')) {
    const [num, den] = stockStr.split('/');
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (!isNaN(n) && !isNaN(d) && d !== 0) {
      return { qty: n / d, unit: fallbackUnit };
    }
  }

  // Regex to separate number and string (e.g., "15m" -> "15", "m")
  const match = stockStr.match(/^([\d.,]+)\s*([a-zA-Z]*)$/);
  if (match) {
    const qty = parseFloat(match[1].replace(',', '.'));
    const unit = match[2] || fallbackUnit;
    return { qty: isNaN(qty) ? 0 : qty, unit };
  }

  const numVal = parseFloat(stockStr.replace(',', '.'));
  if (!isNaN(numVal)) {
    return { qty: numVal, unit: fallbackUnit };
  }

  return { qty: 0, unit: fallbackUnit };
};

export const WarehouseExcelImporter: React.FC<Props> = ({ existingShelves, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const qc = useQueryClient();
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
      const rawShelfList = parsedData
        .map(r => getRowValue(r, ['Estanteria', 'Estantería', 'Shelf', 'Estante', 'Ubicacion', 'Ubicación']))
        .filter(Boolean);

      const uniqueShelfCodes = Array.from(new Set(rawShelfList.map(s => normalizeShelfCode(s)))).filter(Boolean);
      
      let createdShelvesCount = 0;

      for (const fullCode of uniqueShelfCodes) {
        let existing = localShelves.find(s => s.code === fullCode);
        if (!existing) {
          // Check database to see if it exists already in Supabase
          const { data: dbShelf } = await supabase
            .from('warehouse_shelves')
            .select('*')
            .eq('code', fullCode)
            .maybeSingle();

          if (dbShelf) {
            existing = dbShelf as WarehouseShelf;
            localShelves.push(existing);
          } else {
            // Create shelf in DB
            const codeNum = fullCode.replace('EST-', '');
            const { data: newShelf, error: shelfErr } = await supabase
              .from('warehouse_shelves')
              .insert({
                tenant_id: ECAR_TENANT_ID,
                code: fullCode,
                name: `Estantería ${codeNum}`,
                shelf_type: 'rack',
                rows_count: 5,
                columns_count: 3,
                color: '#3B82F6',
                grid_row: 0,
                grid_col: localShelves.length,
                grid_width: 1,
                grid_height: 1,
                is_active: true
              })
              .select()
              .single();

            if (shelfErr) console.error("Error creating shelf:", shelfErr);
            if (newShelf) {
              existing = newShelf as WarehouseShelf;
              localShelves.push(existing);
              createdShelvesCount++;
            }
          }
        }
      }

      // 2. Prepare items for bulk insertion
      const itemsToInsert: any[] = [];

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        const description = getRowValue(row, [
          'Descripción', 'Descripcion', 'DESCRIPCION', 'Nombre', 'Material', 'Item', 'Ítem', 'Producto', 'Description'
        ]);
        
        if (!description || !String(description).trim()) continue;

        const rawRubro = getRowValue(row, ['Rubro', 'Rubros', 'Categoría', 'Categoria', 'Category', 'RUBRO']);
        const rawMeasure = getRowValue(row, ['medida', 'Medida', 'Medidas', 'Unidad de Medida']);
        const rawStock = getRowValue(row, ['Stock ', 'Stock', 'stock', 'Stock_Actual', 'Cantidad', 'CANTIDAD', 'Qty']);
        const rawShelf = getRowValue(row, ['Estanteria', 'Estantería', 'Shelf', 'Estante', 'Ubicacion', 'Ubicación']);
        const rawNivel = getRowValue(row, ['nivel', 'Nivel', 'NIVEL', 'Fila', 'Row']);
        const rawBin = getRowValue(row, ['bin', 'Bin', 'BIN', 'Casillero', 'Columna', 'Column']);
        const rawObs = getRowValue(row, ['observaciones', 'Observaciones', 'Notas', 'Notes', 'Comentarios', 'OBS']);

        const { qty, unit } = parseStockAndUnit(rawStock, rawMeasure);
        
        let shelfId: string | null = null;
        let shelfPos: string | null = null;

        if (rawShelf) {
          const code = normalizeShelfCode(rawShelf);
          const shelf = localShelves.find(s => s.code === code);
          if (shelf) {
            shelfId = shelf.id;
            const n = rawNivel ? `N${rawNivel}` : 'N1';
            const b = rawBin ? `-B${rawBin}` : '';
            shelfPos = `${n}${b}`;
          }
        }

        const rubroStr = rawRubro ? String(rawRubro).trim() : null;
        let category: 'material' | 'herramienta' | 'consumible' = 'material';
        if (rubroStr) {
          const lower = rubroStr.toLowerCase();
          if (lower.includes('herramienta')) category = 'herramienta';
          else if (lower.includes('consumible')) category = 'consumible';
        }

        let fullName = String(description).trim();
        if (rawMeasure && String(rawMeasure).trim() !== '-' && String(rawMeasure).trim().toLowerCase() !== 'unidad') {
          fullName += ` (${String(rawMeasure).trim()})`;
        }
        if (rawObs && String(rawObs).trim()) {
          fullName += ` - ${String(rawObs).trim()}`;
        }

        itemsToInsert.push({
          tenant_id: ECAR_TENANT_ID,
          name: fullName,
          category,
          current_stock: qty,
          min_stock: 0,
          unit: unit,
          location: 'panol',
          shelf_id: shelfId,
          shelf_position: shelfPos
        });
      }

      // Insert items in batches of 100
      const BATCH_SIZE = 100;
      let insertedCount = 0;

      for (let b = 0; b < itemsToInsert.length; b += BATCH_SIZE) {
        const batch = itemsToInsert.slice(b, b + BATCH_SIZE);
        const { error: batchErr } = await supabase.from('inventory_items').insert(batch);
        
        if (batchErr) {
          console.error("Error inserting batch:", batchErr);
          throw batchErr;
        }

        insertedCount += batch.length;
        setProgress(Math.round((insertedCount / itemsToInsert.length) * 100));
      }

      // Invalidate query caches so UI updates immediately
      qc.invalidateQueries({ queryKey: ['inventory_items'] });
      qc.invalidateQueries({ queryKey: ['warehouse_shelves'] });

      useModalStore.getState().showAlert(
        'Importación Exitosa', 
        `Se importaron ${insertedCount} ítems y se crearon ${createdShelvesCount} estanterías nuevas en la base de datos.`
      );
      onComplete();
    } catch (error: any) {
      console.error(error);
      useModalStore.getState().showAlert('Error de Importación', `Hubo un error al guardar los datos en la base de datos: ${error.message || error}`);
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
                <span>Procesando e insertando en la Base de Datos...</span>
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
