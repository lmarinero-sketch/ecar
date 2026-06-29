import React, { useState, useCallback } from 'react';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ExtractedData = {
  cheque_number?: string; bank_name?: string; amount?: number;
  issue_date?: string; due_date?: string; beneficiary?: string;
  type?: string; branch?: string; direction?: string;
};

type Props = {
  onExtracted: (data: ExtractedData, scanUrl: string) => void;
  onCancel: () => void;
};

type Step = 'upload' | 'processing' | 'done' | 'error';

export const ChequeUploader: React.FC<Props> = ({ onExtracted, onCancel }) => {
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.match(/^(image\/(jpeg|png|webp)|application\/pdf)$/)) {
      setError('Formato no soportado. Usá JPG, PNG, WebP o PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Archivo muy grande. Máximo 10MB.');
      return;
    }

    setFileName(file.name);
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }

    setStep('processing');
    setError('');

    try {
      // 1. Upload to Supabase Storage
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('cheque-scans')
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: urlData } = supabase.storage.from('cheque-scans').getPublicUrl(path);
      const scanUrl = urlData.publicUrl;

      // 2. Call Edge Function for OCR
      const { data: { session } } = await supabase.auth.getSession();
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-cheque-data`;

      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ storage_path: path }),
      });

      if (!resp.ok) {
        // OCR failed — let user fill manually
        console.warn('OCR unavailable, manual entry');
        setStep('done');
        onExtracted({}, scanUrl);
        return;
      }

      const result = await resp.json();
      if (result.success && result.data) {
        setStep('done');
        onExtracted(result.data, scanUrl);
      } else {
        // Fallback to manual
        setStep('done');
        onExtracted({}, scanUrl);
      }
    } catch (err: any) {
      console.error('Upload/OCR error:', err);
      setError(err.message || 'Error al procesar');
      setStep('error');
    }
  }, [onExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 p-5 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><Camera size={20} /> Escanear Cheque</h3>
            <p className="text-emerald-100 text-xs mt-1">Subí una foto o PDF y extraemos los datos automáticamente</p>
          </div>
          <button onClick={onCancel} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
                ${dragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}`}
            >
              <input type="file" id="cheque-file" accept="image/*,application/pdf" onChange={handleFileInput} className="hidden" />
              <label htmlFor="cheque-file" className="cursor-pointer">
                <Upload size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-bold text-gray-700 mb-1">Arrastrá la imagen o tocá para seleccionar</p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP o PDF · Máx 10MB</p>
              </label>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-10 space-y-4">
              {preview && <img src={preview} alt="Cheque" className="w-full max-h-48 object-contain rounded-lg border mb-4" />}
              <Loader2 size={40} className="mx-auto text-emerald-500 animate-spin" />
              <p className="font-bold text-gray-700">Procesando "{fileName}"...</p>
              <p className="text-sm text-gray-400">Extrayendo datos con IA. Puede tardar unos segundos.</p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8 space-y-4">
              <AlertCircle size={48} className="mx-auto text-red-400" />
              <p className="font-bold text-red-600">{error}</p>
              <button onClick={() => { setStep('upload'); setError(''); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">
                Reintentar
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8 space-y-3">
              <CheckCircle size={48} className="mx-auto text-emerald-500" />
              <p className="font-bold text-gray-700">Datos extraídos correctamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
