import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, Search, Plus, X, Save, Star,
  BarChart3, AlertTriangle, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { useSupplierEvaluations, useCreateSupplierEvaluation, useSuppliers } from '../hooks/useData';
import type { SupplierEvaluation } from '../lib/types';

const CRITERIA = [
  { key: 'score_delivery', label: 'Plazo de Entrega', desc: 'Cumplimiento de fechas pactadas' },
  { key: 'score_quality', label: 'Calidad', desc: 'Calidad del material/servicio recibido' },
  { key: 'score_price', label: 'Precio', desc: 'Competitividad y transparencia de precios' },
  { key: 'score_documentation', label: 'Documentación', desc: 'Remitos, facturas, certificados' },
  { key: 'score_response', label: 'Respuesta a Reclamos', desc: 'Velocidad y eficacia ante problemas' },
] as const;

const RECOMMENDATIONS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  recomendado: { label: 'Recomendado', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
  condicional: { label: 'Condicional', color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle size={12} /> },
  no_recomendado: { label: 'No Recomendado', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle size={12} /> },
  bloquear: { label: 'Bloqueado', color: 'bg-red-100 text-red-700', icon: <X size={12} /> },
};

const StarRating: React.FC<{ value: number; onChange: (v: number) => void; readOnly?: boolean }> = ({ value, onChange, readOnly }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} onClick={() => !readOnly && onChange(n)} disabled={readOnly}
        className={`transition-all ${n <= value ? 'text-amber-400' : 'text-gray-200'} ${readOnly ? '' : 'hover:scale-110 cursor-pointer'}`}>
        <Star size={18} fill={n <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

export const SupplierEvalModule: React.FC = () => {
  const { data: evaluations, isLoading } = useSupplierEvaluations();
  const { data: suppliers } = useSuppliers();
  const createEval = useCreateSupplierEvaluation();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier_id: '',
    supplier_name: '',
    period: new Date().toISOString().substring(0, 7),
    score_delivery: 3,
    score_quality: 3,
    score_price: 3,
    score_documentation: 3,
    score_response: 3,
    recommendation: 'recomendado' as SupplierEvaluation['recommendation'],
    nc_count: 0,
    notes: '',
    evaluated_by: '',
  });

  const overallScore = useMemo(() => {
    return Number(((form.score_delivery + form.score_quality + form.score_price + form.score_documentation + form.score_response) / 5).toFixed(1));
  }, [form.score_delivery, form.score_quality, form.score_price, form.score_documentation, form.score_response]);

  const autoRecommendation = useMemo((): SupplierEvaluation['recommendation'] => {
    if (overallScore >= 4) return 'recomendado';
    if (overallScore >= 3) return 'condicional';
    if (overallScore >= 2) return 'no_recomendado';
    return 'bloquear';
  }, [overallScore]);

  const filtered = useMemo(() => {
    if (!evaluations) return [];
    if (!search) return evaluations;
    const s = search.toLowerCase();
    return evaluations.filter(e => e.supplier_name.toLowerCase().includes(s) || e.period.includes(s));
  }, [evaluations, search]);

  // Group by supplier for summary
  const supplierSummary = useMemo(() => {
    if (!evaluations) return [];
    const map = new Map<string, { name: string; evals: typeof evaluations; avgScore: number; lastRec: string }>();
    for (const ev of evaluations) {
      const existing = map.get(ev.supplier_name) || { name: ev.supplier_name, evals: [], avgScore: 0, lastRec: '' };
      existing.evals.push(ev);
      map.set(ev.supplier_name, existing);
    }
    return Array.from(map.values()).map(s => {
      s.avgScore = Number((s.evals.reduce((sum, e) => sum + e.overall_score, 0) / s.evals.length).toFixed(1));
      s.lastRec = s.evals[0].recommendation;
      return s;
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [evaluations]);

  const handleSubmit = async () => {
    try {
      await createEval.mutateAsync({
        ...form,
        supplier_id: form.supplier_id || null,
        overall_score: overallScore,
        recommendation: autoRecommendation,
      });
      setShowForm(false);
      resetForm();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setForm({
      supplier_id: '', supplier_name: '',
      period: new Date().toISOString().substring(0, 7),
      score_delivery: 3, score_quality: 3, score_price: 3, score_documentation: 3, score_response: 3,
      recommendation: 'recomendado', nc_count: 0, notes: '', evaluated_by: '',
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark via-ecar-blue to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardCheck size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ClipboardCheck size={24} /> Evaluación de Proveedores</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Gerencia de Compras — Doc PR-GC-01 §4.5</p>
        </div>
      </div>

      {/* Summary Cards */}
      {supplierSummary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {supplierSummary.slice(0, 4).map(s => {
            const rec = RECOMMENDATIONS[s.lastRec];
            return (
              <div key={s.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="font-bold text-sm text-gray-800 truncate">{s.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => <Star key={n} size={12} className={n <= Math.round(s.avgScore) ? 'text-amber-400' : 'text-gray-200'} fill={n <= Math.round(s.avgScore) ? 'currentColor' : 'none'} />)}
                  </div>
                  <span className="text-sm font-bold text-gray-600">{s.avgScore}</span>
                </div>
                <span className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${rec?.color || 'bg-gray-100'}`}>
                  {rec?.icon} {rec?.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedor o período..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30" />
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blue transition-all">
          <Plus size={16} /> Nueva Evaluación
        </button>
      </div>

      {/* Table */}
      <div className="light-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3 text-center">Entrega</th>
              <th className="px-4 py-3 text-center">Calidad</th>
              <th className="px-4 py-3 text-center">Precio</th>
              <th className="px-4 py-3 text-center">Docs</th>
              <th className="px-4 py-3 text-center">Respuesta</th>
              <th className="px-4 py-3 text-center">General</th>
              <th className="px-4 py-3 text-center">Recomendación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(ev => {
              const rec = RECOMMENDATIONS[ev.recommendation];
              return (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{ev.supplier_name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{ev.period}</td>
                  {(['score_delivery', 'score_quality', 'score_price', 'score_documentation', 'score_response'] as const).map(key => (
                    <td key={key} className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        {[1, 2, 3, 4, 5].map(n => <Star key={n} size={10} className={n <= ev[key] ? 'text-amber-400' : 'text-gray-200'} fill={n <= ev[key] ? 'currentColor' : 'none'} />)}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{ev.overall_score}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${rec?.color}`}>
                      {rec?.icon} {rec?.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay evaluaciones</p>
                <p className="text-sm">Hacé clic en "Nueva Evaluación" para calificar un proveedor.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-ecar-blue" /> Nueva Evaluación de Proveedor
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Proveedor *</label>
                  <select value={form.supplier_id} onChange={e => {
                    const sup = (suppliers || []).find(s => s.id === e.target.value);
                    setForm({ ...form, supplier_id: e.target.value, supplier_name: sup?.name || '' });
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleccionar proveedor</option>
                    {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="O escribir nombre" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Período</label>
                  <input type="month" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Criteria Ratings */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-ecar-blue" /> Calificación por Criterio (1-5)</h4>
                <div className="space-y-3">
                  {CRITERIA.map(c => (
                    <div key={c.key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <div className="font-medium text-sm text-gray-800">{c.label}</div>
                        <div className="text-xs text-gray-400">{c.desc}</div>
                      </div>
                      <StarRating value={form[c.key as keyof typeof form] as number} onChange={v => setForm({ ...form, [c.key]: v })} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Score */}
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-xl p-4 border border-ecar-blueLight flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-ecar-blue">PUNTAJE GENERAL</div>
                  <div className="text-3xl font-bold text-ecar-blueDark">{overallScore}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-ecar-blue">RECOMENDACIÓN AUTOMÁTICA</div>
                  <span className={`mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${RECOMMENDATIONS[autoRecommendation]?.color}`}>
                    {RECOMMENDATIONS[autoRecommendation]?.icon} {RECOMMENDATIONS[autoRecommendation]?.label}
                  </span>
                </div>
              </div>

              {/* NC Count + Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cant. NC en el Período</label>
                  <input type="number" value={form.nc_count} onChange={e => setForm({ ...form, nc_count: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Evaluado por</label>
                  <input value={form.evaluated_by} onChange={e => setForm({ ...form, evaluated_by: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Notas / Observaciones</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Observaciones del período..." />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm">Cancelar</button>
              <button onClick={handleSubmit} disabled={!form.supplier_name || createEval.isPending}
                className="bg-ecar-blue text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blue disabled:opacity-50 transition-all">
                <Save size={16} /> Registrar Evaluación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
