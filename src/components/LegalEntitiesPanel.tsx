
import React, { useState } from 'react';
import { useLegalEntities, useCreateLegalEntity, useDeleteLegalEntity, usePurchaseInvoices } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { Building2, Plus, Trash2, Upload, Download } from 'lucide-react';

export const LegalEntitiesPanel: React.FC = () => {
  const { data: entities = [], isLoading } = useLegalEntities();
  const { data: invoices = [] } = usePurchaseInvoices();
  const formatARS = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
  const createEntity = useCreateLegalEntity();
  const deleteEntity = useDeleteLegalEntity();
  
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cuit: '',
    iibb_number: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.cuit) return;
    setIsUploading(true);
    setUploadError('');
    try {
      let constancia_url = null;
      if (selectedFile) {
        const path = `legal-entities/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('purchase-scans').upload(path, selectedFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('purchase-scans').getPublicUrl(path);
        constancia_url = publicUrl;
      }

      await createEntity.mutateAsync({
        name: form.name,
        cuit: form.cuit,
        iibb_number: form.iibb_number || null,
        constancia_url,
      });

      setShowAdd(false);
      setForm({ name: '', cuit: '', iibb_number: '' });
      setSelectedFile(null);
    } catch (error: any) {
      setUploadError(error?.message || 'Error al guardar la razón social.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando razones sociales...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-ecar-blue" />
            Razones Sociales
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administrá las empresas registradas para asociar a las facturas de compra.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-ecar-blue transition-colors flex items-center gap-2"
        >
          {showAdd ? 'Cancelar' : <><Plus size={16} /> Nueva Razón Social</>}
        </button>
      </div>

      <div className="bg-slate-50 border border-ecar-blueLight rounded-lg p-4 text-sm text-ecar-blueDark flex gap-3 items-start">
        <Building2 className="shrink-0 mt-0.5 text-ecar-blue" size={18} />
        <div>
          <p className="font-bold mb-1">¿Para qué sirven las Razones Sociales?</p>
          <p>
            Al registrar empresas aquí (por ejemplo, ECAR SAS o Carlos Adolfo Regalado), podrás seleccionarlas obligatoriamente al momento de cargar una nueva factura en el módulo de compras.
            Esto permite que en el Libro IVA se registre exactamente a qué entidad corresponde cada operación. No olvides adjuntar la constancia de inscripción si es posible.
          </p>
        </div>
      </div>

      {showAdd && (
        <div className="light-card border-ecar-blueLight p-6">
          <h3 className="font-bold text-gray-800 mb-4">Registrar Nueva Razón Social</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Razón Social *</label>
              <input 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="Ej: ECAR SAS" 
                className="w-full px-3 py-2 border rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">CUIT *</label>
              <input 
                value={form.cuit} 
                onChange={e => setForm({ ...form, cuit: e.target.value })} 
                placeholder="Ej: 30-12345678-9" 
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Número de Ingresos Brutos (IIBB)</label>
              <input 
                value={form.iibb_number} 
                onChange={e => setForm({ ...form, iibb_number: e.target.value })} 
                placeholder="Opcional..." 
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Constancia de Inscripción (PDF/Img)</label>
              <label className="flex items-center justify-center w-full h-10 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-ecar-blue hover:bg-slate-50 transition-colors">
                {selectedFile ? (
                  <span className="text-xs font-bold text-ecar-blue truncate px-4">{selectedFile.name}</span>
                ) : (
                  <span className="text-xs text-gray-500 flex items-center gap-2"><Upload size={14} /> Adjuntar archivo</span>
                )}
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {uploadError && <p className="text-sm text-red-500 font-medium mb-3">{uploadError}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.name || !form.cuit || isUploading}
              className="bg-ecar-blue text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-ecar-blue disabled:opacity-50"
            >
              {isUploading ? 'Guardando...' : 'Guardar Razón Social'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
        <span className="font-bold">Info:</span> Los saldos de IVA (Venta y Compra) se calculan automáticamente sumando los comprobantes ingresados en el módulo de Compras que estén asigandos a cada Razón Social. Se incluyen comprobantes validados, pagados o pendientes (se excluyen los rechazados).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entities.map(entity => {
          const entityInvoices = invoices.filter(inv => inv.legal_entity_id === entity.id && inv.status !== 'rejected');
          let ivaVenta = 0;
          let ivaCompra = 0;
          entityInvoices.forEach(inv => {
            const iva = (Number(inv.iva_21_ars) || 0) + (Number(inv.iva_105_ars) || 0) + (Number(inv.iva_27_ars) || 0);
            if (inv.ocr_raw_data?.tipo === 'venta') {
              ivaVenta += iva;
            } else {
              ivaCompra += iva;
            }
          });
          const saldo = ivaVenta - ivaCompra;

          return (
          <div key={entity.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <button
              onClick={() => {
                if (confirm(`¿Estás seguro de eliminar ${entity.name}? Esto podría afectar facturas asociadas.`)) {
                  deleteEntity.mutate(entity.id);
                }
              }}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-ecar-blueLight flex items-center justify-center text-ecar-blue font-bold text-lg">
                {entity.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{entity.name}</h3>
                <p className="text-xs text-gray-500 font-mono">CUIT: {entity.cuit}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mt-4 border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500 text-xs">IIBB</span>
                <span className="font-mono">{entity.iibb_number || 'No registrado'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500 text-xs">Constancia</span>
                {entity.constancia_url ? (
                  <a 
                    href={entity.constancia_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-ecar-blue hover:text-ecar-blueDark font-bold text-xs flex items-center gap-1"
                  >
                    <Download size={12} /> Descargar
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">Sin adjunto</span>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Posición IVA (Aprox)</p>
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 flex-1 text-center">
                  <span className="block text-[10px] opacity-70">IVA Venta</span>
                  <span className="font-bold font-mono">{formatARS(ivaVenta)}</span>
                </div>
                <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 flex-1 text-center">
                  <span className="block text-[10px] opacity-70">IVA Compra</span>
                  <span className="font-bold font-mono">{formatARS(ivaCompra)}</span>
                </div>
              </div>
              <div className={`mt-2 text-center text-xs font-bold py-1 rounded ${saldo > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {saldo > 0 ? 'A Pagar: ' : 'Saldo a Favor: '} {formatARS(Math.abs(saldo))}
              </div>
            </div>
          </div>
          );
        })}
        {entities.length === 0 && !showAdd && (
          <div className="col-span-full text-center py-12 bg-white border border-gray-200 border-dashed rounded-xl">
            <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium">No hay razones sociales registradas.</p>
            <button onClick={() => setShowAdd(true)} className="text-ecar-blue font-bold text-sm mt-2 hover:underline">
              Crear la primera
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
