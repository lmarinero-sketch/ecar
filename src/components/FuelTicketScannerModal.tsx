import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, Loader2, X, FileText, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { checkFuelLoadDuplicate } from '../hooks/useData';
import type { FuelLoad, FuelVehicle } from '../lib/types';

interface ExtractedTicketData {
  remito_number: string | null;
  voucher_number: string | null;
  load_date: string | null;
  supplier: string | null;
  plate: string | null;
  vehicle_name: string | null;
  fuel_type: string | null;
  liters: number | null;
  price_per_liter: number | null;
  total_amount: number | null;
  driver_name: string | null;
  payment_method: string | null;
  ticket_photo_url?: string | null;
}

interface Props {
  vehicles: FuelVehicle[];
  onClose: () => void;
  onConfirmLoad: (extracted: Partial<FuelLoad>) => void;
}

const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ base64: (e.target?.result as string).split(',')[1], mimeType: file.type || 'image/jpeg' });
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Error al procesar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const FuelTicketScannerModal: React.FC<Props> = ({ vehicles, onClose, onConfirmLoad }) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [extractedData, setExtractedData] = useState<ExtractedTicketData | null>(null);
  const [existingLoad, setExistingLoad] = useState<FuelLoad | null>(null);
  const [matchedVehicle, setMatchedVehicle] = useState<FuelVehicle | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('analyzing');

    try {
      const { base64, mimeType } = await compressImage(file);

      // Call Edge Function extract-fuel-ticket-data
      const { data, error: fnErr } = await supabase.functions.invoke('extract-fuel-ticket-data', {
        body: { image_base64: base64, mime_type: mimeType },
      });

      if (fnErr || !data?.success) {
        throw new Error(data?.error || fnErr?.message || 'No se pudieron extraer los datos del ticket');
      }

      // Upload file to Supabase storage
      const fileName = `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { error: uploadError } = await supabase.storage.from('fuel_tickets').upload(fileName, file);
      let ticketUrl = null;
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fuel_tickets').getPublicUrl(fileName);
        ticketUrl = publicUrlData.publicUrl;
      }

      const extracted: ExtractedTicketData = { ...data.data, ticket_photo_url: ticketUrl };
      setExtractedData(extracted);

      // Match vehicle by plate if available
      let matchedV: FuelVehicle | null = null;
      if (extracted.plate) {
        const cleanP = extracted.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        matchedV = vehicles.find(v => v.plate && v.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanP) || null;
      }
      setMatchedVehicle(matchedV);

      // Check duplicate in database
      const dup = await checkFuelLoadDuplicate({
        remito_number: extracted.remito_number,
        voucher_number: extracted.voucher_number,
        plate: extracted.plate,
        load_date: extracted.load_date,
        liters: extracted.liters,
      });

      setExistingLoad(dup);
      setStep('result');
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err?.message || 'Ocurrió un error al analizar el remito. Verificá que la foto sea nítida.');
      setStep('upload');
    }
  };

  const handleApplyData = () => {
    if (!extractedData) return;

    // Map extracted data to FuelLoad form fields
    const loadPayload: Partial<FuelLoad> = {
      remito_number: extractedData.remito_number || undefined,
      voucher_number: extractedData.voucher_number || undefined,
      load_date: extractedData.load_date || new Date().toISOString().slice(0, 10),
      supplier: extractedData.supplier || 'YPF',
      fuel_type: extractedData.fuel_type || 'Diesel Premium / V-Power',
      liters: extractedData.liters || 0,
      price_per_liter: extractedData.price_per_liter || undefined,
      total_amount: extractedData.total_amount || undefined,
      driver_name: extractedData.driver_name || undefined,
      plate: extractedData.plate || (matchedVehicle?.plate || undefined),
      vehicle_id: matchedVehicle?.id || undefined,
      vehicle_code: matchedVehicle?.code || undefined,
      vehicle_description: matchedVehicle?.description || extractedData.vehicle_name || undefined,
      payment_method: extractedData.payment_method || 'Cuenta Corriente',
      ticket_photo_url: extractedData.ticket_photo_url || undefined,
    };

    onConfirmLoad(loadPayload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-ecar-blueDark to-ecar-blue px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Camera size={22} className="text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Escáner e Inspector de Remitos IA</h3>
              <p className="text-blue-200 text-xs mt-0.5">Detección instantánea de duplicados y extracción inteligente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 text-sm">
              <AlertTriangle size={20} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-bold">No se pudo procesar la imagen</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                  <FileText size={16} className="text-ecar-blue" />
                  Recomendaciones para una extracción precisa:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Encuadrar la parte superior del comprobante (**N° Remito**, **Fecha**).</li>
                  <li>Foco claro sobre la sección de **Litros**, **Producto** y **Patente / Vehículo**.</li>
                  <li>Evitar sombras profundas o pliegues sobre los números.</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 hover:border-ecar-blue rounded-2xl p-8 text-center transition-all bg-gray-50/50 hover:bg-blue-50/30 group cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="w-16 h-16 rounded-2xl bg-ecar-blueLight flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={28} className="text-ecar-blue" />
                </div>
                <p className="font-bold text-gray-800 text-sm">Sacá una foto o arrastrá el ticket aquí</p>
                <p className="text-xs text-gray-400 mt-1">Soporta remitos impresos de Estación Central, YPF, Shell, Axion, etc.</p>
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZING */}
          {step === 'analyzing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-ecar-blueLight animate-ping opacity-75" />
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border-4 border-ecar-blue">
                  <Loader2 size={36} className="text-ecar-blue animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 text-base">Analizando Remito con OpenAI Vision...</h4>
                <p className="text-xs text-gray-500">Buscando N° Remito, Fecha, Litros, Patente y verificando duplicados en base de datos.</p>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && extractedData && (
            <div className="space-y-5">
              {/* DUPLICATE STATUS DIAGNOSIS BANNER */}
              {existingLoad ? (
                <div className="bg-red-50 border border-red-300 rounded-2xl p-4 text-red-900 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={22} className="text-red-600 shrink-0 animate-bounce" />
                    <span className="font-black text-sm uppercase tracking-wide text-red-700">⚠️ COMPROBANTE YA REGISTRADO (DUPLICADO)</span>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed font-medium">
                    Este remito ya figura ingresado en el sistema el <strong>{existingLoad.load_date}</strong> para el vehículo <strong>{existingLoad.vehicle_description || existingLoad.vehicle_code}</strong> ({existingLoad.plate || 'Sin patente'}).
                  </p>
                  <div className="bg-white/80 rounded-xl p-3 border border-red-200 text-xs font-mono grid grid-cols-2 gap-2 text-gray-700">
                    <div><span className="text-gray-400">Remito:</span> <strong>{existingLoad.remito_number || existingLoad.load_number}</strong></div>
                    <div><span className="text-gray-400">Litros:</span> <strong>{existingLoad.liters} L</strong></div>
                    <div><span className="text-gray-400">Chofer:</span> <strong>{existingLoad.driver_name || '—'}</strong></div>
                    <div><span className="text-gray-400">Proveedor:</span> <strong>{existingLoad.supplier}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-300 rounded-2xl p-4 text-green-900 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={22} className="text-green-600 shrink-0" />
                    <span className="font-black text-sm uppercase tracking-wide text-green-700">✅ COMPROBANTE NO REGISTRADO (PENDIENTE)</span>
                  </div>
                  <p className="text-xs text-green-800 leading-relaxed font-medium">
                    Este ticket no figura en la base de datos. Los datos fueron extraídos con precisión.
                  </p>
                </div>
              )}

              {/* EXTRACTED FIELDS PREVIEW */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Datos Extraídos del Ticket</h4>
                  {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-[11px] text-ecar-blue hover:underline flex items-center gap-1 font-semibold">
                      <FileText size={12} /> Ver foto original
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">N° Remito / Comprobante</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{extractedData.remito_number || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">N° Planilla / Vale</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{extractedData.voucher_number || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Fecha</span>
                    <span className="font-mono font-semibold text-slate-800">{extractedData.load_date || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Estación / Proveedor</span>
                    <span className="font-semibold text-slate-800">{extractedData.supplier || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Patente / Vehículo</span>
                    <span className="font-mono font-bold text-slate-800">{extractedData.plate || '—'} {matchedVehicle ? `(${matchedVehicle.code})` : ''}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Litros Cargados</span>
                    <span className="font-mono font-black text-ecar-blue text-sm">{extractedData.liters ? `${extractedData.liters} L` : '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Producto</span>
                    <span className="font-medium text-slate-800">{extractedData.fuel_type || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Chofer / Cliente</span>
                    <span className="font-medium text-slate-800">{extractedData.driver_name || '—'}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('upload'); setExtractedData(null); setExistingLoad(null); }}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Escanear otro ticket
                </button>
                <div className="flex-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                  >
                    Cerrar
                  </button>
                  {!existingLoad && (
                    <button
                      type="button"
                      onClick={handleApplyData}
                      className="px-5 py-2.5 rounded-xl bg-ecar-blue text-white font-bold text-xs hover:bg-ecar-blueDark transition-all shadow-md flex items-center gap-1.5"
                    >
                      <PlusCircle size={15} /> Cargar Combustible (1-Clic)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
