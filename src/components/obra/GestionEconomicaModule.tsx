import React, { useState } from 'react';
import {
  DollarSign, FileSignature, Layers, TrendingUp,
  Building2, Clock
} from 'lucide-react';
import { ScopeChangesModule } from '../ScopeChangesModule';
import { CertificationsModule } from '../CertificationsModule';
import { useProjects, useProjectCertificates, useScopeChanges } from '../../hooks/useData';

export const GestionEconomicaModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'certificaciones' | 'adicionales' | 'resumen_proyeccion'>('certificaciones');
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return localStorage.getItem('ecar_active_project_id') || (projects[0]?.id || '');
  });

  const { data: certificates = [] } = useProjectCertificates(selectedProjectId || undefined);
  const { data: scopeChanges = [] } = useScopeChanges(selectedProjectId || undefined);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Economic Metrics
  const contractAmount = selectedProject?.contract_amount || selectedProject?.budget_ars || 0;
  const approvedAdditionals = scopeChanges
    .filter(sc => sc.status === 'aprobado')
    .reduce((acc, sc) => acc + (sc.economic_impact || 0), 0);

  const pendingAdditionals = scopeChanges
    .filter(sc => sc.status === 'detectado' || sc.status === 'en_evaluacion')
    .reduce((acc, sc) => acc + (sc.economic_impact || 0), 0);

  const totalCertified = certificates.reduce((acc, c) => acc + (c.total_certified || c.gross_amount || 0), 0);
  const totalAdjustedContract = contractAmount + approvedAdditionals;
  const certifiedPct = totalAdjustedContract > 0 ? Math.round((totalCertified / totalAdjustedContract) * 100) : 0;
  const pendingToCertify = Math.max(0, totalAdjustedContract - totalCertified);

  const formatARS = (n: number) => {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    return `$${n.toLocaleString('es-AR')}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Header ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <DollarSign size={180} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span>💰</span> Gerencia de Obras · Grupo 5
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Gestión Económica & Contractual de Obra
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Alineación entre producción física y facturación: control de certificaciones en 3 niveles (Ejecutado, Medido/Aprobado y Certificado), valorización de adicionales y proyección económica de cierre.
          </p>
        </div>
      </div>

      {/* ─── Top KPIs Strip ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contrato Base</span>
          <span className="text-xl font-extrabold text-gray-900">{formatARS(contractAmount)}</span>
          <span className="text-[11px] text-gray-500 block">monto original</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Adicionales Aprobados</span>
          <span className="text-xl font-extrabold text-emerald-700">+{formatARS(approvedAdditionals)}</span>
          <span className="text-[11px] text-gray-500 block">adendas confirmadas</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Certificado</span>
          <span className="text-xl font-extrabold text-blue-700">{formatARS(totalCertified)}</span>
          <span className="text-[11px] text-gray-500 block">{certifiedPct}% del contrato ajustado</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Saldo por Certificar</span>
          <span className="text-xl font-extrabold text-amber-700">{formatARS(pendingToCertify)}</span>
          <span className="text-[11px] text-gray-500 block">remanente contractual</span>
        </div>
      </div>

      {/* ─── Subtabs Bar + Project Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('certificaciones')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'certificaciones'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <FileSignature size={16} className="text-lime-500" /> 1. Certificaciones (3 Niveles)
          </button>

          <button
            onClick={() => setActiveTab('adicionales')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'adicionales'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <Layers size={16} className="text-purple-500" /> 2. Adicionales & Cambios de Alcance
          </button>

          <button
            onClick={() => setActiveTab('resumen_proyeccion')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'resumen_proyeccion'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <TrendingUp size={16} className="text-emerald-500" /> 3. Proyección & Balance Económico
          </button>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                localStorage.setItem('ecar_active_project_id', e.target.value);
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas las obras</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'certificaciones' && (
        <div className="space-y-4">
          {/* 3-Level Guidance Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Clock size={16} className="text-ecar-blue" /> Circuito de Certificación en 3 Niveles (Propuesta Funcional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-gray-900 block mb-1">1. Ejecutado (Campo)</span>
                <p className="text-gray-500 text-[11px]">Volúmenes y metros reales volcados en el Parte Diario y Rendimientos Roque.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-gray-900 block mb-1">2. Medido / Aprobado</span>
                <p className="text-gray-500 text-[11px]">Metros validados por la inspección de obra del comitente listos para liquidar.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-gray-900 block mb-1">3. Certificado Formal</span>
                <p className="text-gray-500 text-[11px]">Certificado de obra emitido con retenciones de fondo de reparo y número oficial.</p>
              </div>
            </div>
          </div>

          <CertificationsModule />
        </div>
      )}

      {activeTab === 'adicionales' && (
        <div>
          <ScopeChangesModule />
        </div>
      )}

      {activeTab === 'resumen_proyeccion' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" /> Balance Económico Integrado
            </h3>
            <p className="text-xs text-gray-500">Trazabilidad consolidada entre monto contratado, adicionales y facturación acumulada.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Presupuesto Contractual Original</span>
              <span className="font-bold text-gray-900 text-sm">{formatARS(contractAmount)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b text-emerald-800">
              <span className="font-medium">+ Adicionales Aprobados (Adendas)</span>
              <span className="font-bold text-sm">+{formatARS(approvedAdditionals)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b text-amber-800 bg-amber-50/50 px-2 rounded">
              <span className="font-medium">⏳ Adicionales en Trámite / Evaluación</span>
              <span className="font-bold text-sm">+{formatARS(pendingAdditionals)}</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b font-extrabold text-gray-900 bg-slate-50 px-2 rounded">
              <span>Total Contractual Ajustado Estimado</span>
              <span className="text-base font-mono">{formatARS(totalAdjustedContract)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b text-blue-800">
              <span className="font-medium">- Total Facturado / Certificado</span>
              <span className="font-bold text-sm">-{formatARS(totalCertified)}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-emerald-50 text-emerald-950 px-3 rounded-xl font-black text-sm">
              <span>Saldo Pendiente de Certificación / Cobro</span>
              <span className="text-lg font-mono">{formatARS(pendingToCertify)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
