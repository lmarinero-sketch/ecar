import React, { useState, useEffect, useRef } from 'react';
import {
  X, Barcode, Camera, Keyboard, Check, Search, ArrowRight,
  Plus, AlertTriangle, ArrowDownToLine, Wrench, User, RotateCcw, HelpCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  useCreateInventoryMovement,
  useCreateToolAssignment,
  useUpdateToolAssignment,
  useUpdateInventoryItem,
  useProjects,
  useEmployees,
  useToolAssignments
} from '../hooks/useData';
import type { InventoryItem } from '../lib/types';

// Same deterministic logic as BarcodeLabel
const getBarcodeValue = (item: InventoryItem): string => {
  if (item.barcode) return item.barcode;
  if (item.qr_code) return item.qr_code;
  const shortId = item.id.replace(/-/g, '').slice(-8).toUpperCase();
  return `ECAR-${shortId}`;
};

interface BarcodeScannerModalProps {
  items: InventoryItem[];
  onClose: () => void;
  onNewItemRequest?: (prefilledBarcode: string) => void;
}

type ScanMode = 'gun' | 'camera';
type ScanState = 'scanning' | 'matched' | 'no_match';
type ActionType = 'movement' | 'assignment' | 'return';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  items,
  onClose,
  onNewItemRequest
}) => {
  const projects = useProjects().data || [];
  const employees = useEmployees().data || [];
  const activeAssignments = (useToolAssignments().data || []).filter(a => a.status === 'assigned');

  const createMovement = useCreateInventoryMovement();
  const createAssignment = useCreateToolAssignment();
  const updateAssignment = useUpdateToolAssignment();
  const updateItem = useUpdateInventoryItem();

  const [mode, setMode] = useState<ScanMode>('gun');
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scannedCode, setScannedCode] = useState('');
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  
  // Laser gun input
  const gunInputRef = useRef<HTMLInputElement>(null);
  const [gunInputValue, setGunInputValue] = useState('');

  // Camera scanner
  const cameraRef = useRef<Html5Qrcode | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Forms state
  const [actionType, setActionType] = useState<ActionType>('movement');
  const [movForm, setMovForm] = useState({
    movement_type: 'out' as 'in' | 'out' | 'return' | 'adjustment',
    quantity: '1',
    notes: '',
    project_id: ''
  });
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    project_id: '',
    notes: ''
  });
  
  // Associated item state (if code not found and user wants to link to existing item)
  const [associateItemId, setAssociateItemId] = useState('');
  const [associateSearch, setAssociateSearch] = useState('');
  const [showAssociateConfirm, setShowAssociateConfirm] = useState(false);

  // Ref to track currently assigned record for the item (if any)
  const itemActiveAssignment = matchedItem
    ? activeAssignments.find(a => a.item_id === matchedItem.id)
    : null;

  // Autofocus the gun input
  useEffect(() => {
    if (mode === 'gun' && scanState === 'scanning' && gunInputRef.current) {
      gunInputRef.current.focus();
    }
  }, [mode, scanState]);

  // Handle camera scanning start/stop
  useEffect(() => {
    if (mode === 'camera' && scanState === 'scanning') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, scanState]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Small timeout to allow element to render in DOM
      await new Promise((resolve) => setTimeout(resolve, 300));
      const html5QrCode = new Html5Qrcode("camera-preview");
      cameraRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: (width: number, height: number) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size / 2 }; // landscape for barcode
        }
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // Silent callback for scan failures
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error("Error starting camera:", err);
      setCameraError("No se pudo iniciar la cámara. Verificá los permisos de cámara de tu dispositivo.");
    }
  };

  const stopCamera = async () => {
    if (cameraRef.current && cameraActive) {
      try {
        await cameraRef.current.stop();
        cameraRef.current = null;
        setCameraActive(false);
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
    }
  };

  const handleCodeDetected = (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setScannedCode(trimmedCode);
    stopCamera();

    // Look up the item in local list
    const foundItem = items.find(i => {
      const barcodeVal = getBarcodeValue(i).toUpperCase();
      const directBarcode = (i.barcode || '').toUpperCase();
      const directQr = (i.qr_code || '').toUpperCase();
      const searchCode = trimmedCode.toUpperCase();
      
      return barcodeVal === searchCode || directBarcode === searchCode || directQr === searchCode;
    });

    if (foundItem) {
      setMatchedItem(foundItem);
      setScanState('matched');
      // Set default action based on item type
      if (foundItem.is_tool) {
        // If already assigned, default to Return, otherwise Assign
        const assigned = activeAssignments.some(a => a.item_id === foundItem.id);
        setActionType(assigned ? 'return' : 'assignment');
      } else {
        setActionType('movement');
      }
    } else {
      setMatchedItem(null);
      setScanState('no_match');
    }
  };

  const handleGunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gunInputValue.trim()) {
      handleCodeDetected(gunInputValue.trim());
      setGunInputValue('');
    }
  };

  const handleReset = () => {
    setScannedCode('');
    setMatchedItem(null);
    setScanState('scanning');
    setAssociateItemId('');
    setAssociateSearch('');
    setShowAssociateConfirm(false);
    setMovForm({
      movement_type: 'out',
      quantity: '1',
      notes: '',
      project_id: ''
    });
    setAssignForm({
      employee_id: '',
      project_id: '',
      notes: ''
    });
  };

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedItem) return;

    const qty = parseFloat(movForm.quantity);
    if (isNaN(qty) || qty <= 0) return;

    await createMovement.mutateAsync({
      item_id: matchedItem.id,
      movement_type: movForm.movement_type,
      quantity: qty,
      project_id: movForm.project_id || null,
      notes: movForm.notes || null,
    });

    handleReset();
  };

  const handleRegisterAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedItem) return;

    await createAssignment.mutateAsync({
      item_id: matchedItem.id,
      employee_id: assignForm.employee_id,
      project_id: assignForm.project_id || null,
      notes: assignForm.notes || null,
    });

    handleReset();
  };

  const handleRegisterReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemActiveAssignment) return;

    await updateAssignment.mutateAsync({
      id: itemActiveAssignment.id,
      status: 'returned',
      returned_date: new Date().toISOString().split('T')[0],
      notes: movForm.notes || null
    });

    // Also register a return movement automatically to restore stock
    await createMovement.mutateAsync({
      item_id: itemActiveAssignment.item_id,
      movement_type: 'return',
      quantity: 1,
      project_id: itemActiveAssignment.project_id || null,
      notes: `Devolución de ${employees.find(emp => emp.id === itemActiveAssignment.employee_id)?.full_name || 'empleado'}`
    });

    handleReset();
  };

  const handleAssociateCode = async () => {
    if (!associateItemId || !scannedCode) return;

    await updateItem.mutateAsync({
      id: associateItemId,
      barcode: scannedCode
    });

    // Immediately resolve matched item
    const updatedItem = items.find(i => i.id === associateItemId);
    if (updatedItem) {
      const match = { ...updatedItem, barcode: scannedCode };
      setMatchedItem(match);
      setScanState('matched');
      setActionType(match.is_tool ? 'assignment' : 'movement');
    } else {
      handleReset();
    }
  };

  // Filter items for association search dropdown
  const filteredAssociateItems = items.filter(i => 
    i.name.toLowerCase().includes(associateSearch.toLowerCase()) && !i.barcode
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Barcode size={90} /></div>
          <div className="relative z-10">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Barcode size={22} />
              Registro por Escáner
            </h3>
            <p className="text-orange-100 text-xs mt-0.5">Escaneá con pistola láser o cámara de celular</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: SCANNING STATE */}
          {scanState === 'scanning' && (
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
                <button
                  onClick={() => setMode('gun')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    mode === 'gun' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Keyboard size={16} /> Pistola / Manual
                </button>
                <button
                  onClick={() => setMode('camera')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    mode === 'camera' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Camera size={16} /> Cámara Celular
                </button>
              </div>

              {/* Mode A: USB / Laser Gun / Manual Entry */}
              {mode === 'gun' && (
                <div className="text-center py-8 space-y-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-6">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 mb-2">
                    <Barcode size={32} className="animate-pulse" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h4 className="font-bold text-gray-800 text-sm">Escaneá el código de barras</h4>
                    <p className="text-xs text-gray-400">
                      Apuntá con la pistola láser al código de la herramienta. El sistema procesará el código automáticamente.
                    </p>
                  </div>

                  <form onSubmit={handleGunSubmit} className="max-w-md mx-auto flex gap-2">
                    <input
                      ref={gunInputRef}
                      type="text"
                      value={gunInputValue}
                      onChange={(e) => setGunInputValue(e.target.value)}
                      placeholder="Esperando escaneo o ingresá código..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      className="bg-orange-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-orange-700 transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <Search size={16} /> Buscar
                    </button>
                  </form>
                </div>
              )}

              {/* Mode B: Camera scan */}
              {mode === 'camera' && (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-xl bg-black border border-gray-200 overflow-hidden flex items-center justify-center">
                    <div id="camera-preview" className="absolute inset-0 w-full h-full object-cover"></div>
                    
                    {/* Laser overlay animation */}
                    {cameraActive && (
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse z-10" />
                    )}

                    {!cameraActive && !cameraError && (
                      <div className="text-center text-gray-400 z-10 p-4">
                        <Camera size={32} className="mx-auto mb-2 opacity-50 animate-bounce" />
                        <p className="text-sm font-medium">Iniciando cámara...</p>
                      </div>
                    )}

                    {cameraError && (
                      <div className="text-center text-red-500 z-10 p-6 space-y-2">
                        <AlertTriangle size={32} className="mx-auto" />
                        <p className="text-xs font-semibold">{cameraError}</p>
                        <button
                          onClick={startCamera}
                          className="badge badge-danger"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5 bg-gray-50 py-2 rounded-lg">
                    <HelpCircle size={14} className="text-gray-400" />
                    Apuntá la cámara al código de barras horizontalmente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MATCHED ITEM STATE */}
          {scanState === 'matched' && matchedItem && (
            <div className="space-y-5 animate-fade-in">
              {/* Item Summary Card */}
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 flex items-start gap-4">
                <div className={`p-3 rounded-lg ${matchedItem.is_tool ? 'bg-ecar-blueLight text-ecar-blue' : 'bg-orange-100 text-orange-700'}`}>
                  {matchedItem.is_tool ? <Wrench size={24} /> : <Barcode size={24} />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      matchedItem.category === 'herramienta' ? 'bg-ecar-blueLight text-ecar-blue' :
                      matchedItem.category === 'consumible' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    } uppercase`}>
                      {matchedItem.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-400 tracking-tight">
                      {scannedCode}
                    </span>
                  </div>
                  <h4 className="font-black text-gray-800 text-lg leading-tight">{matchedItem.name}</h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <p>Stock actual: <span className="font-mono font-black text-gray-700">{matchedItem.current_stock} {matchedItem.unit}</span></p>
                    <p>Ubicación: <span className="font-medium text-gray-700 uppercase">{matchedItem.location}</span></p>
                  </div>
                </div>
              </div>

              {/* Assignment Notice */}
              {matchedItem.is_tool && itemActiveAssignment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-sm text-yellow-800">
                  <User size={18} className="text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Herramienta actualmente asignada</p>
                    <p className="text-xs text-yellow-700">
                      Asignada a <span className="font-bold">{employees.find(e => e.id === itemActiveAssignment.employee_id)?.full_name || 'Empleado'}</span> en la obra <span className="font-bold">{projects.find(p => p.id === itemActiveAssignment.project_id)?.name || 'Obra'}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Selector */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Acción a Registrar</label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('movement')}
                    className={`py-3 px-2 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-1.5 transition-all ${
                      actionType === 'movement'
                        ? 'border-orange-500 bg-orange-50/20 text-orange-800 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowDownToLine size={18} />
                    <span>Movimiento</span>
                  </button>

                  {matchedItem.is_tool && (
                    <>
                      <button
                        type="button"
                        disabled={!!itemActiveAssignment}
                        onClick={() => setActionType('assignment')}
                        className={`py-3 px-2 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          actionType === 'assignment'
                            ? 'border-ecar-blue bg-slate-50/20 text-ecar-blueDark shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <User size={18} />
                        <span>Asignar</span>
                      </button>

                      <button
                        type="button"
                        disabled={!itemActiveAssignment}
                        onClick={() => setActionType('return')}
                        className={`py-3 px-2 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          actionType === 'return'
                            ? 'border-green-600 bg-green-50/20 text-green-800 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <RotateCcw size={18} />
                        <span>Devolución</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ACTION FORM: MOVEMENT */}
              {actionType === 'movement' && (
                <form onSubmit={handleRegisterMovement} className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {(['out', 'in', 'adjustment'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMovForm({ ...movForm, movement_type: t })}
                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                          movForm.movement_type === t ? 'bg-white shadow-sm text-orange-700' : 'text-gray-500'
                        }`}
                      >
                        {t === 'in' ? '📥 Ingreso' : t === 'out' ? '📤 Egreso' : '⚙️ Ajuste'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500">Cantidad *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={movForm.quantity}
                        onChange={(e) => setMovForm({ ...movForm, quantity: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Obra / Destino</label>
                      <select
                        value={movForm.project_id}
                        onChange={(e) => setMovForm({ ...movForm, project_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      >
                        <option value="">Depósito General</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500">Notas / Motivo</label>
                    <input
                      value={movForm.notes}
                      onChange={(e) => setMovForm({ ...movForm, notes: e.target.value })}
                      placeholder="Ingresá observaciones del movimiento..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Volver a Escanear
                    </button>
                    <button
                      type="submit"
                      disabled={createMovement.isPending}
                      className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {createMovement.isPending ? 'Guardando...' : '✅ Confirmar Movimiento'}
                    </button>
                  </div>
                </form>
              )}

              {/* ACTION FORM: ASSIGNMENT */}
              {actionType === 'assignment' && (
                <form onSubmit={handleRegisterAssignment} className="space-y-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Responsable / Empleado *</label>
                    <select
                      value={assignForm.employee_id}
                      onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    >
                      <option value="">Seleccioná responsable...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500">Obra de Destino</label>
                    <select
                      value={assignForm.project_id}
                      onChange={(e) => setAssignForm({ ...assignForm, project_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    >
                      <option value="">Sin obra asignada</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500">Notas / Condición de entrega</label>
                    <input
                      value={assignForm.notes}
                      onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                      placeholder="Ej: Se entrega con caja y 2 discos de corte..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Volver a Escanear
                    </button>
                    <button
                      type="submit"
                      disabled={createAssignment.isPending}
                      className="btn-primary 
                    >
                      {createAssignment.isPending ? 'Asignando...' : '🔧 Confirmar Asignación'}
                    </button>
                  </div>
                </form>
              )}

              {/* ACTION FORM: RETURN */}
              {actionType === 'return' && (
                <form onSubmit={handleRegisterReturn} className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="bg-green-50 p-4 border border-green-200 rounded-xl text-xs text-green-800 space-y-1">
                    <p className="font-bold">Devolución y Reingreso Automático</p>
                    <p>Al confirmar, se registrará el fin del préstamo y un movimiento de ingreso de 1 unidad al depósito.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500">Notas de devolución (Opcional)</label>
                    <input
                      value={movForm.notes}
                      onChange={(e) => setMovForm({ ...movForm, notes: e.target.value })}
                      placeholder="Ej: Se devuelve limpia y en perfecto estado..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Volver a Escanear
                    </button>
                    <button
                      type="submit"
                      disabled={updateAssignment.isPending}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {updateAssignment.isPending ? 'Procesando...' : '🔄 Confirmar Devolución'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 3: NO MATCH STATE */}
          {scanState === 'no_match' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center py-6 space-y-3 bg-yellow-50 border border-yellow-100 rounded-xl p-5">
                <AlertTriangle size={40} className="text-yellow-600 mx-auto animate-bounce" />
                <div>
                  <h4 className="font-bold text-gray-800 text-base">Código de barras no registrado</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    No encontramos ningún ítem con el código <span className="font-mono font-bold text-yellow-800 bg-yellow-100 px-1.5 py-0.5 rounded">{scannedCode}</span> en el inventario.
                  </p>
                </div>
              </div>

              {!showAssociateConfirm ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (onNewItemRequest) {
                        onNewItemRequest(scannedCode);
                        onClose();
                      }
                    }}
                    className="p-5 border border-gray-200 rounded-2xl text-center space-y-2 hover:border-orange-500 hover:bg-orange-50/10 transition-all"
                  >
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                      <Plus size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800 block">Registrar Ítem Nuevo</span>
                    <span className="text-[10px] text-gray-400 block leading-tight">Crea una nueva herramienta o material con este código.</span>
                  </button>

                  <button
                    onClick={() => setShowAssociateConfirm(true)}
                    className="p-5 border border-gray-200 rounded-2xl text-center space-y-2 hover:border-ecar-blue hover:bg-slate-50/10 transition-all"
                  >
                    <div className="badge badge-info">
                      <ArrowRight size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800 block">Asociar a Existente</span>
                    <span className="text-[10px] text-gray-400 block leading-tight">Asigna este código de barras a un ítem ya registrado en el depósito.</span>
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="font-bold text-sm text-gray-800">Asociar a Ítem Existente</span>
                    <button onClick={() => setShowAssociateConfirm(false)} className="text-xs font-bold text-orange-600 hover:underline">Volver</button>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={associateSearch}
                        onChange={(e) => setAssociateSearch(e.target.value)}
                        placeholder="Buscá por nombre de herramienta o material..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/20"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 bg-gray-50/50">
                      {filteredAssociateItems.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAssociateItemId(item.id)}
                          className={`w-full px-4 py-2.5 text-left text-xs flex justify-between items-center transition-all ${
                            associateItemId === item.id ? 'bg-ecar-blueLight text-ecar-blueDark font-bold' : 'hover:bg-gray-100'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">{item.category}</p>
                          </div>
                          <span className="font-mono text-gray-500">Stock: {item.current_stock}</span>
                        </button>
                      ))}
                      {filteredAssociateItems.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400">
                          No se encontraron ítems sin código asignado.
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={!associateItemId}
                    onClick={handleAssociateCode}
                    className="btn-primary w-full
                  >
                    <Check size={16} /> Confirmar Asociación
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 border border-gray-300 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all"
              >
                Volver a Escanear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
