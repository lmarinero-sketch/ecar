import React, { useState, useMemo } from 'react';
import {
  FileSignature, Plus, X, TrendingUp, Banknote,
  ChevronDown, ChevronUp, Building2
} from 'lucide-react';
import { useProjects, useProjectCertificates, useCreateProjectCertificate } from '../hooks/useData';
import type { ProjectCertificate } from '../lib/types';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtM = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : fmt(n);

export const CertificationsModule: React.FC = () => {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: certificates, isLoading: loadingCerts } = useProjectCertificates();
  const createCert = useCreateProjectCertificate();

  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showNewCert, setShowNewCert] = useState<string | null>(null);
  const [form, setForm] = useState({ certificate_number: '', gross_amount: '', redetermination: '', period_description: '' });

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
      status: 'approved',
    } as any);
    setShowNewCert(null);
    setForm({ certificate_number: '', gross_amount: '', redetermination: '', period_description: '' });
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
            const totalDeposited = certs.reduce((s, c) => s + (c.net_deposit || 0), 0);
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
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Cert #</th>
                            <th className="px-4 py-3 text-right">🟡 Bruto</th>
                            <th className="px-4 py-3 text-right">🟠 Redeterminación</th>
                            <th className="px-4 py-3 text-right">🟢 Total</th>
                            <th className="px-4 py-3 text-right text-gray-400">Ret. IIBB</th>
                            <th className="px-4 py-3 text-right text-gray-400">Ret. Cheque</th>
                            <th className="px-4 py-3 text-right">🔵 Depósito</th>
                            <th className="px-4 py-3 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {certs.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-bold text-gray-800">#{c.certificate_number}</td>
                              <td className="px-4 py-3 text-right font-mono text-yellow-700">{fmtM(c.gross_amount)}</td>
                              <td className="px-4 py-3 text-right font-mono text-orange-600">{fmtM(c.redetermination || 0)}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-green-700">{fmtM(c.total_certified)}</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-400 text-xs">{fmt(c.retention_iibb || 0)}</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-400 text-xs">{fmt(c.retention_imp_cheque || 0)}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">{fmtM(c.net_deposit || 0)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status === 'deposited' ? 'bg-green-100 text-green-700' : c.status === 'approved' ? 'bg-yellow-100 text-yellow-700' : c.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {c.status === 'deposited' ? 'Depositado' : c.status === 'approved' ? 'Aprobado' : c.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {/* Totals row */}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-3">TOTAL</td>
                            <td className="px-4 py-3 text-right font-mono text-yellow-700">{fmtM(certs.reduce((s, c) => s + c.gross_amount, 0))}</td>
                            <td className="px-4 py-3 text-right font-mono text-orange-600">{fmtM(certs.reduce((s, c) => s + (c.redetermination || 0), 0))}</td>
                            <td className="px-4 py-3 text-right font-mono text-green-700">{fmtM(totalCertified)}</td>
                            <td className="px-4 py-3" colSpan={2}></td>
                            <td className="px-4 py-3 text-right font-mono text-blue-700">{fmtM(totalDeposited)}</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-gray-100 flex justify-end">
                      <button onClick={(e) => { e.stopPropagation(); setShowNewCert(proj.id); setForm({ ...form, certificate_number: String(certs.length + 1) }); }} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
                        <Plus size={16} /> Nuevo Certificado
                      </button>
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
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Nuevo Certificado</h3><button onClick={() => setShowNewCert(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">Certificado N°</label><input type="number" value={form.certificate_number} onChange={e => setForm({ ...form, certificate_number: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ecar-blue/30" /></div>
                <div><label className="text-xs font-bold text-gray-500">Período</label><input value={form.period_description} onChange={e => setForm({ ...form, period_description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: Abril 2026" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500">🟡 Monto Bruto ($)</label><input type="number" value={form.gross_amount} onChange={e => setForm({ ...form, gross_amount: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300/50" /></div>
                <div><label className="text-xs font-bold text-gray-500">🟠 Redeterminación ($)</label><input type="number" value={form.redetermination} onChange={e => setForm({ ...form, redetermination: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-300/50" placeholder="0" /></div>
              </div>
              {(form.gross_amount || form.redetermination) && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span>🟢 Total:</span><span className="font-mono font-bold text-green-700">{fmt((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0))}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Ret. IIBB (2.5%):</span><span className="font-mono">-{fmt(((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0)) * 0.025)}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Ret. Imp. Cheque (2%):</span><span className="font-mono">-{fmt(((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0)) * 0.02)}</span></div>
                  <div className="flex justify-between border-t pt-1 mt-1"><span>🔵 Depósito Neto:</span><span className="font-mono font-bold text-blue-700">{fmt(((parseFloat(form.gross_amount) || 0) + (parseFloat(form.redetermination) || 0)) * 0.955)}</span></div>
                </div>
              )}
              <button type="submit" disabled={createCert.isPending} className="w-full bg-rose-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-rose-700 transition-all shadow-md disabled:opacity-50">
                {createCert.isPending ? 'Guardando...' : '✅ Registrar Certificado'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
