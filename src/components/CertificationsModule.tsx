import React, { useState, useMemo } from 'react';
import {
  FileSignature, Plus, X, TrendingUp, Banknote,
  ChevronDown, ChevronUp, Building2, Upload, Pencil, Trash2
} from 'lucide-react';
import { useProjects, useProjectCertificates, useCreateProjectCertificate, useUpdateProjectCertificate, useDeleteProjectCertificate } from '../hooks/useData';
import type { ProjectCertificate } from '../lib/types';
import { useModalStore } from '../store/useModalStore';
import { ImageViewer } from './ImageViewer';
import { supabase } from '../lib/supabase';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtM = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : fmt(n);

export const CertificationsModule: React.FC = () => {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: certificates, isLoading: loadingCerts } = useProjectCertificates();
  const createCert = useCreateProjectCertificate();
  const updateCert = useUpdateProjectCertificate();
  const deleteCert = useDeleteProjectCertificate();

  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showNewCert, setShowNewCert] = useState<string | null>(null);
  const [form, setForm] = useState({ certificate_number: '', gross_amount: '', redetermination: '', period_description: '' });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [editingCert, setEditingCert] = useState<ProjectCertificate | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<ProjectCertificate | null>(null);

  // Only projects with contract_amount > 0
  const contractProjects = useMemo(() => (projects || []).filter((p: any) => p.contract_amount > 0), [projects]);

  const certsByProject = useMemo(() => {
    const map: Record<string, ProjectCertificate[]> = {};
    (certificates || []).forEach(c => {
      if (!map[c.project_id]) map[c.project_id] = [];
      map[c.project_id].push(c);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.certificate_number - b.certificate_number));
    return map;
  }, [certificates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showNewCert) return;
    const gross = parseFloat(form.gross_amount) || 0;
    const redet = parseFloat(form.redetermination) || 0;
    const total = gross + redet;
    const retIibb = total * 0.025;
    const retCheque = total * 0.02;
    const netDeposit = total - retIibb - retCheque;
    
    let photoUrl = '';
    if (selectedFile) {
      setIsUploading(true);
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${showNewCert}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('project-certificates')
          .upload(filePath, selectedFile);
        
        if (uploadError) {
          useModalStore.getState().showAlert('Error', 'Error al subir el archivo: ' + uploadError.message);
          setIsUploading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('project-certificates')
          .getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', 'Error en la subida del archivo: ' + err.message);
        setIsUploading(false);
        return;
      }
    }

    try {
      await createCert.mutateAsync({
        project_id: showNewCert,
        certificate_number: parseInt(form.certificate_number),
        gross_amount: gross,
        redetermination: redet,
        total_certified: total,
        retention_iibb: retIibb,
        retention_imp_cheque: retCheque,
        net_deposit: netDeposit,
        period_description: form.period_description || null,
        photo_url: photoUrl || null,
        status: 'approved',
      } as any);
      setShowNewCert(null);
      setSelectedFile(null);
      setForm({ certificate_number: '', gross_amount: '', redetermination: '', period_description: '' });
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', 'Error al guardar el certificado: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loadingProjects || loadingCerts) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-800 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><FileSignature size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><FileSignature size={24} /> Certificaciones de Obra</h3>
          <p className="text-rose-100 text-sm mt-1">Seguimiento de certificados, redeterminaciones y depósitos por obra</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Building2 size={16} className="text-rose-500" /> Obras con Contrato</div>
          <p className="text-2xl font-black text-rose-600 font-mono">{contractProjects.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><FileSignature size={16} className="text-blue-500" /> Certificados Emitidos</div>
          <p className="text-2xl font-black text-blue-600 font-mono">{(certificates || []).length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><TrendingUp size={16} className="text-green-500" /> Total Certificado</div>
          <p className="text-2xl font-black text-green-600 font-mono">{fmtM((certificates || []).reduce((s, c) => s + (c.total_certified || 0), 0))}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Banknote size={16} className="text-emerald-500" /> Depositado Neto</div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{fmtM((certificates || []).reduce((s, c) => s + (c.net_deposit || 0), 0))}</p>
        </div>
      </div>

      {/* Obras */}
      {contractProjects.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Building2 size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No hay obras con contrato registrado</p></div>
      ) : (
        <div className="space-y-4">
          {contractProjects.map((proj: any) => {
            const certs = certsByProject[proj.id] || [];
            const totalCertified = certs.reduce((s, c) => s + (c.total_certified || 0), 0);
            const pct = proj.contract_amount > 0 ? (totalCertified / proj.contract_amount) * 100 : 0;
            const isExpanded = expandedProject === proj.id;

            return (
              <div key={proj.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Project header */}
                <div className="p-5 cursor-pointer hover:bg-gray-50 transition-all" onClick={() => setExpandedProject(isExpanded ? null : proj.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Building2 size={18} className="text-rose-500" />
                        {proj.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">{proj.contractor || '—'} · Contrato: {fmtM(proj.contract_amount)} · Anticipo {proj.advance_pct || 30}%: {fmtM(proj.advance_amount || 0)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono font-bold text-sm">{pct.toFixed(1)}% certificado</p>
                        <p className="text-xs text-gray-400">{certs.length} certificados</p>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-gradient-to-r from-rose-500 to-rose-400 h-3 rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Certificado: {fmtM(totalCertified)}</span>
                    <span>Contrato: {fmtM(proj.contract_amount)}</span>
                  </div>
                </div>

                {/* Certificates detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 overflow-x-auto">
                    <table className="w-full text-sm border-collapse bg-white shadow-sm border border-gray-200">
                      <thead>
                        <tr>
                          <th colSpan={3} className="border border-gray-300 p-2 bg-gray-100 text-left font-bold text-gray-700">
                            {proj.name}
                          </th>
                          {certs.map(c => (
                            <th key={c.id} className="border border-gray-300 p-2 bg-amber-400 text-black text-center min-w-[120px]">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-bold">CERTIFICADO {c.certificate_number}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCert(c);
                                    setEditForm({
                                      certificate_number: c.certificate_number,
                                      gross_amount: c.gross_amount,
                                      redetermination: c.redetermination || 0,
                                      period_description: c.period_description || '',
                                      retention_iibb: c.retention_iibb || 0,
                                      retention_imp_cheque: c.retention_imp_cheque || 0,
                                      other_retentions: c.other_retentions || 0,
                                      status: c.status,
                                      deposit_date: c.deposit_date || '',
                                      net_deposit: c.net_deposit || 0
                                    });
                                  }}
                                  className="p-1 bg-white/70 hover:bg-white rounded text-amber-800 hover:text-blue-600 transition-colors"
                                  title="Editar certificado"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(c);
                                  }}
                                  className="p-1 bg-white/70 hover:bg-rose-100 rounded text-amber-800 hover:text-rose-600 transition-colors"
                                  title="Eliminar certificado"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </th>
                          ))}
                          <th className="border border-gray-300 p-2 bg-gray-50 text-center min-w-[140px]">
                            <button onClick={(e) => { e.stopPropagation(); setShowNewCert(proj.id); setForm({ ...form, certificate_number: String(certs.length + 1) }); }} className="text-ecar-blue hover:text-ecar-blueDark font-bold flex items-center justify-center gap-1 mx-auto w-full">
                              <Plus size={14} /> Nuevo Cert.
                            </button>
                          </th>
                        </tr>
                        <tr>
                          <th className="border border-gray-300 p-2 bg-gray-50 text-center font-bold text-gray-600 text-xs w-[140px]">CONTRATO</th>
                          <th className="border border-gray-300 p-2 bg-gray-50 text-center font-bold text-gray-600 text-xs w-[140px]">ANTICIPO ({proj.advance_pct || 30}%)</th>
                          <th className="border border-gray-300 p-2 bg-gray-50 text-center font-bold text-gray-600 text-xs w-[140px]">REDETERMINACION ANTICIPO</th>
                          {certs.map(c => (
                            <th key={c.id} className="border border-gray-300 p-2 bg-cyan-400 text-black text-center text-xs whitespace-nowrap">
                              CERT REDETER.<br/>{c.period_description || '-'}
                            </th>
                          ))}
                          <th className="border border-gray-300 p-2 bg-gray-50"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Base Amount Row */}
                        <tr>
                          <td className="border border-gray-300 p-2 text-right font-mono font-medium">{fmt(proj.contract_amount)}</td>
                          <td className="border border-gray-300 p-2 bg-green-400/50 text-right font-mono font-medium">{fmt(proj.advance_amount)}</td>
                          <td className="border border-gray-300 p-2 bg-green-400/50 text-right font-mono font-medium">{fmt(proj.advance_redetermination)}</td>
                          {certs.map(c => (
                            <td key={c.id} className="border border-gray-300 p-2 bg-amber-300 text-right font-mono font-medium">{fmt(c.gross_amount)}</td>
                          ))}
                          <td className="border border-gray-300 p-2 bg-gray-50"></td>
                        </tr>
                        {/* Redetermination Row */}
                        <tr>
                          <td colSpan={3} className="border border-gray-300 p-2 bg-gray-50"></td>
                          {certs.map(c => (
                            <td key={c.id} className="border border-gray-300 p-2 bg-cyan-300 text-right font-mono font-medium">{fmt(c.redetermination || 0)}</td>
                          ))}
                          <td className="border border-gray-300 p-2 bg-gray-50"></td>
                        </tr>
                        {/* Total Certified Row */}
                        <tr>
                          <td colSpan={3} className="border border-gray-300 p-2 bg-gray-50"></td>
                          {certs.map(c => (
                            <td key={c.id} className="border border-gray-300 p-2 bg-green-400/50 text-right font-mono font-bold">{fmt(c.total_certified)}</td>
                          ))}
                          <td className="border border-gray-300 p-2 bg-gray-50"></td>
                        </tr>
                        {/* Bank Deposit Row */}
                        <tr>
                          <td className="border border-gray-300 p-2 font-bold text-gray-700 uppercase">Deposito Banco</td>
                          <td className="border border-gray-300 p-2 bg-green-600 text-white text-right font-mono font-bold">
                            {/* Assuming full advance was deposited as per spreadsheet example */}
                            {fmt(proj.advance_amount * 0.95)}
                          </td>
                          <td className="border border-gray-300 p-2 bg-green-600 text-white text-right font-mono font-bold">
                            {fmt(proj.advance_redetermination * 0.95)}
                          </td>
                          {certs.map(c => {
                            let bgClass = 'bg-white';
                            let textClass = 'text-gray-900';
                            if (c.status === 'deposited') {
                              bgClass = 'bg-green-600';
                              textClass = 'text-white';
                            } else if (c.status === 'approved' || c.status === 'invoiced') {
                              bgClass = 'bg-green-200';
                              textClass = 'text-green-900';
                            }

                            return (
                              <td key={c.id} className={`border border-gray-300 p-2 text-right font-mono font-bold transition-colors ${bgClass} ${textClass}`}>
                                {fmt(c.net_deposit || 0)}
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 p-2 bg-gray-50"></td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex gap-4 mt-4 text-xs text-gray-500 font-medium justify-end">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-gray-300 rounded-sm"></div> No Facturado (Pendiente)</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-200 border border-gray-300 rounded-sm"></div> Facturado / Aprobado</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-600 rounded-sm"></div> Depositado</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Certificado */}
      {showNewCert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nuevo Certificado</h3>
              <button onClick={() => { setShowNewCert(null); setSelectedFile(null); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Certificado N°</label><input type="number" value={form.certificate_number} onChange={e => setForm({ ...form, certificate_number: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30" /></div>
                <div><label className="text-xs font-bold text-gray-500">Período</label><input value={form.period_description} onChange={e => setForm({ ...form, period_description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: Abril 2026" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">🟡 Monto Bruto ($)</label><input type="number" value={form.gross_amount} onChange={e => setForm({ ...form, gross_amount: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300/50" /></div>
                <div><label className="text-xs font-bold text-gray-500">🟠 Redeterminación ($)</label><input type="number" value={form.redetermination} onChange={e => setForm({ ...form, redetermination: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-300/50" placeholder="0" /></div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">Foto de la Certificación (Opcional)</label>
                <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center relative hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-gray-400 mb-1" size={20} />
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedFile ? `Seleccionado: ${selectedFile.name}` : 'Subir foto o PDF del certificado'}
                  </p>
                </div>
              </div>

              {(form.gross_amount || form.redetermination) && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span>🟢 Total:</span><span className="font-mono font-bold text-green-700">{fmt((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0))}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Ret. IIBB (2.5%):</span><span className="font-mono">-{fmt(((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0)) * 0.025)}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Ret. Imp. Cheque (2%):</span><span className="font-mono">-{fmt(((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0)) * 0.02)}</span></div>
                  <div className="flex justify-between border-t pt-1 mt-1"><span>🔵 Depósito Neto:</span><span className="font-mono font-bold text-blue-700">{fmt(((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0)) * 0.955)}</span></div>
                </div>
              )}
              <button type="submit" disabled={createCert.isPending || isUploading} className="w-full bg-rose-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-rose-700 transition-all shadow-md disabled:opacity-50">
                {isUploading ? 'Subiendo archivo...' : createCert.isPending ? 'Guardando...' : '✅ Registrar Certificado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Certificate Modal */}
      {editingCert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Editar Certificado #{editForm.certificate_number}</h3>
              <button onClick={() => setEditingCert(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Certificado N°</label>
                <input type="number" value={editForm.certificate_number} onChange={e => setEditForm({ ...editForm, certificate_number: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Período</label>
                <input value={editForm.period_description} onChange={e => setEditForm({ ...editForm, period_description: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">🟡 Monto Bruto</label>
                <input type="number" value={editForm.gross_amount} onChange={e => setEditForm({ ...editForm, gross_amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">🟠 Redeterminación</label>
                <input type="number" value={editForm.redetermination} onChange={e => setEditForm({ ...editForm, redetermination: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Ret. IIBB</label>
                <input type="number" value={editForm.retention_iibb} onChange={e => setEditForm({ ...editForm, retention_iibb: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Ret. Imp. Cheque</label>
                <input type="number" value={editForm.retention_imp_cheque} onChange={e => setEditForm({ ...editForm, retention_imp_cheque: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Otras Retenciones</label>
                <input type="number" value={editForm.other_retentions} onChange={e => setEditForm({ ...editForm, other_retentions: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Fecha Depósito</label>
                <input type="date" value={editForm.deposit_date} onChange={e => setEditForm({ ...editForm, deposit_date: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">Estado</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="invoiced">Facturado</option>
                  <option value="deposited">Depositado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
            </div>
            {/* Auto-calc preview */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between"><span>🟢 Total:</span><span className="font-mono font-bold text-green-700">{fmt((editForm.gross_amount || 0) + (editForm.redetermination || 0))}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>🔵 Depósito Neto:</span><span className="font-mono font-bold text-blue-700">{fmt((editForm.gross_amount || 0) + (editForm.redetermination || 0) - (editForm.retention_iibb || 0) - (editForm.retention_imp_cheque || 0) - (editForm.other_retentions || 0))}</span></div>
            </div>
            <button
              onClick={async () => {
                const total = (editForm.gross_amount || 0) + (editForm.redetermination || 0);
                const netDep = total - (editForm.retention_iibb || 0) - (editForm.retention_imp_cheque || 0) - (editForm.other_retentions || 0);
                try {
                  await updateCert.mutateAsync({ id: editingCert.id, ...editForm, total_certified: total, net_deposit: netDep, deposit_date: editForm.deposit_date || null });
                  setEditingCert(null);
                } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); }
              }}
              disabled={updateCert.isPending}
              className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-ecar-blueDark transition-colors"
            >
              {updateCert.isPending ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Eliminar Certificado</h3>
            <p className="text-sm text-gray-600">
              ¿Eliminás el certificado <span className="font-bold">#{deleteTarget.certificate_number}</span> por <span className="font-mono font-bold">{fmtM(deleteTarget.total_certified)}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Cancelar</button>
              <button
                onClick={async () => {
                  try { await deleteCert.mutateAsync(deleteTarget.id); setDeleteTarget(null); } catch (err: any) { useModalStore.getState().showAlert('Error', err.message); }
                }}
                disabled={deleteCert.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 disabled:opacity-50"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {viewerUrl && (
        <ImageViewer
          src={viewerUrl}
          alt="Foto de la certificación"
          onClose={() => setViewerUrl(null)}
        />
      )}
    </div>
  );
};
