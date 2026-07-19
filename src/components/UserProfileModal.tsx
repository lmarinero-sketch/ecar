import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateProfile } from '../hooks/useData';

export const UserProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { profile } = useAuth();
  const updateProfile = useUpdateProfile();
  
  const [dni, setDni] = useState(profile?.dni || '');
  const [signatureData, setSignatureData] = useState<string | null>(profile?.signature_data || null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Setup canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !signatureData) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureData]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        // Save the signature temporarily in state
        setSignatureData(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearSignature = () => {
    setSignatureData(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath(); // Reset path to prevent connecting old lines
      }
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    let finalSignature = signatureData;
    if (!finalSignature && canvasRef.current) {
      // Try to grab if they just drew and didn't trigger stopDrawing somehow
      finalSignature = canvasRef.current.toDataURL('image/png');
    }
    
    // Check if canvas is actually empty (a blank canvas returns a specific dataURL, but it's hard to check without pixel reading)
    // We assume if they clicked clear, signatureData is null.
    
    await updateProfile.mutateAsync({
      id: profile.id,
      dni,
      signature_data: finalSignature
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Mi Perfil y Firma Digital</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
            <input 
              readOnly 
              value={profile?.full_name || ''} 
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium" 
            />
            <p className="text-[10px] text-gray-400">El nombre se sincroniza automáticamente con tu cuenta.</p>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">DNI</label>
            <input 
              type="text" 
              value={dni} 
              onChange={e => setDni(e.target.value)} 
              placeholder="Ingresa tu número de DNI"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue outline-none transition-all" 
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-gray-500 uppercase">Firma Digital</label>
              {signatureData && (
                <button onClick={clearSignature} className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1">
                  <Trash2 size={12} /> Borrar y rehacer
                </button>
              )}
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center relative">
              {signatureData ? (
                <div className="p-4 bg-white w-full flex justify-center items-center min-h-[150px]">
                  <img src={signatureData} alt="Firma" className="max-h-[120px] object-contain" />
                </div>
              ) : (
                <div className="w-full relative touch-none">
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 text-gray-400 font-medium select-none">
                    Dibuja tu firma aquí
                  </div>
                  <canvas 
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full cursor-crosshair relative z-10 bg-transparent"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <div className="absolute bottom-4 left-4 right-4 border-b-2 border-gray-200 pointer-events-none"></div>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              Esta firma se utilizará para generar los comprobantes PDF cuando autorices operaciones.
            </p>
          </div>
        </div>
        
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={updateProfile.isPending}
            className="btn-primary 
          ">
            <Save size={16} /> 
            {updateProfile.isPending ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
};
