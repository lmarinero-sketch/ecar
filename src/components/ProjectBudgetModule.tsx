import React, { useState, useMemo } from 'react';
import {
  HardHat, Search, Plus, Package, Calculator, FolderOpen, X, Check,
  FileText, Layers, DollarSign,
  ArrowLeft, Eye, Edit2
} from 'lucide-react';
import { useBudgets, useCreateBudget, useUpdateBudget, useBudgetItems, useBudgetSections, useCreateBudgetSection, useCreateBudgetItem, useDeleteBudgetItem, useProjects } from '../hooks/useData';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-blue-100 text-blue-700' },
  revision: { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-600' },
};

const COST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  material: { label: 'Material', color: 'bg-blue-50 text-blue-700' },
  mano_obra: { label: 'Mano de Obra', color: 'bg-orange-50 text-orange-700' },
  equipo: { label: 'Equipo', color: 'bg-purple-50 text-purple-700' },
  subcontrato: { label: 'Subcontrato', color: 'bg-teal-50 text-teal-700' },
  gasto_general: { label: 'Gasto Gral', color: 'bg-gray-50 text-gray-600' },
  financiero: { label: 'Financiero', color: 'bg-red-50 text-red-600' },
};

export const ProjectBudgetModule: React.FC = () => {
  const { data: budgets, isLoading } = useBudgets();
  const { data: projects } = useProjects();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [newForm, setNewForm] = useState({ name: '', description: '', project_id: '', gastos_generales_pct: '10', beneficio_pct: '10', financieros_pct: '3', impuestos_pct: '21', iibb_pct: '3.5' });
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItem, setNewItem] = useState({ description: '', unit: 'gl', quantity: '1', unit_price_ars: '0', cost_type: 'material', notes: '' });
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSection, setNewSection] = useState({ ordinal: '', name: '' });

  // Detail view hooks
  const selectedBudget = useMemo(() => (budgets || []).find(b => b.id === selectedId), [budgets, selectedId]);
  const { data: sections = [] } = useBudgetSections(selectedId || undefined);
  const { data: items = [] } = useBudgetItems(selectedId || undefined);
  const createSection = useCreateBudgetSection();
  const createItem = useCreateBudgetItem();
  const deleteItem = useDeleteBudgetItem();

  // Stats
  const totalBudgets = (budgets || []).length;
  const draftCount = (budgets || []).filter(b => b.status === 'draft').length;
  const approvedCount = (budgets || []).filter(b => b.status === 'approved').length;
  const totalValue = (budgets || []).reduce((s, b) => s + (b.total_final_ars || 0), 0);

  const filtered = useMemo(() => {
    let list = budgets || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || (b.project?.name || '').toLowerCase().includes(q));
    }
    if (filterStatus) list = list.filter(b => b.status === filterStatus);
    return list;
  }, [budgets, search, filterStatus]);

  // Items grouped by section
  const itemsBySection = useMemo(() => {
    const map: Record<string, typeof items> = { _nosection: [] };
    sections.forEach(s => { map[s.id] = []; });
    items.forEach(item => {
      const key = item.section_id || '_nosection';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items, sections]);

  // Cost breakdown
  const costBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    items.forEach(item => {
      const key = item.cost_type || 'material';
      breakdown[key] = (breakdown[key] || 0) + (item.quantity * item.unit_price_ars);
    });
    return breakdown;
  }, [items]);

  const handleCreateBudget = async () => {
    if (!newForm.name.trim()) return;
    await createBudget.mutateAsync({
      name: newForm.name,
      description: newForm.description || null,
      project_id: newForm.project_id || null,
      gastos_generales_pct: parseFloat(newForm.gastos_generales_pct) || 0,
      beneficio_pct: parseFloat(newForm.beneficio_pct) || 0,
      financieros_pct: parseFloat(newForm.financieros_pct) || 0,
      impuestos_pct: parseFloat(newForm.impuestos_pct) || 0,
      iibb_pct: parseFloat(newForm.iibb_pct) || 0,
    } as any);
    setShowNew(false);
    setNewForm({ name: '', description: '', project_id: '', gastos_generales_pct: '10', beneficio_pct: '10', financieros_pct: '3', impuestos_pct: '21', iibb_pct: '3.5' });
  };

  const handleCreateSection = async () => {
    if (!newSection.name.trim() || !selectedId) return;
    await createSection.mutateAsync({ budget_id: selectedId, ordinal: newSection.ordinal || '1', name: newSection.name, sort_order: sections.length });
    setShowNewSection(false);
    setNewSection({ ordinal: '', name: '' });
  };

  const handleCreateItem = async () => {
    if (!newItem.description.trim() || !selectedId) return;
    await createItem.mutateAsync({
      budget_id: selectedId,
      section_id: sections.length > 0 ? sections[0].id : null,
      description: newItem.description,
      unit: newItem.unit,
      quantity: parseFloat(newItem.quantity) || 1,
      unit_price_ars: parseFloat(newItem.unit_price_ars) || 0,
      cost_type: newItem.cost_type as any,
      notes: newItem.notes || null,
      sort_order: items.length,
    } as any);
    setShowNewItem(false);
    setNewItem({ description: '', unit: 'gl', quantity: '1', unit_price_ars: '0', cost_type: 'material', notes: '' });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-cyan-600 rounded-full animate-spin" /></div>;

  // ======== DETAIL VIEW ========
  if (selectedBudget) {
    const directTotal = items.reduce((s, i) => s + i.quantity * i.unit_price_ars, 0);
    const gg = directTotal * (selectedBudget.gastos_generales_pct / 100);
    const beneficio = directTotal * (selectedBudget.beneficio_pct / 100);
    const subtotal = directTotal + gg + beneficio;
    const financiero = subtotal * (selectedBudget.financieros_pct / 100);
    const iva = subtotal * (selectedBudget.impuestos_pct / 100);
    const iibb = subtotal * (selectedBudget.iibb_pct / 100);
    const totalFinal = subtotal + financiero + iva + iibb;
    const stat = STATUS_MAP[selectedBudget.status] || STATUS_MAP.draft;

    return (
      <div className="space-y-4">
        {/* Back + Header */}
        <button onClick={() => setSelectedId(null)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"><ArrowLeft size={16} /> Volver a listado</button>
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><HardHat size={120} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-bold text-xl">{selectedBudget.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stat.color}`}>{stat.label}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">v{selectedBudget.version}</span>
            </div>
            {selectedBudget.description && <p className="text-cyan-100 text-sm mt-1">{selectedBudget.description}</p>}
            {selectedBudget.project?.name && <p className="text-cyan-200 text-xs mt-1 flex items-center gap-1"><FolderOpen size={12} /> {selectedBudget.project.name}</p>}
          </div>
        </div>

        {/* Quick KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase">Costo Directo</p>
            <p className="text-lg font-black text-gray-800 font-mono">{fmt(directTotal)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase">GG ({fmtPct(selectedBudget.gastos_generales_pct)})</p>
            <p className="text-lg font-black text-gray-800 font-mono">{fmt(gg)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase">Beneficio ({fmtPct(selectedBudget.beneficio_pct)})</p>
            <p className="text-lg font-black text-green-700 font-mono">{fmt(beneficio)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase">IVA + IIBB + Fin.</p>
            <p className="text-lg font-black text-gray-800 font-mono">{fmt(financiero + iva + iibb)}</p>
          </div>
          <div className="bg-white border border-cyan-200 rounded-xl p-4 shadow-sm bg-cyan-50/30">
            <p className="text-xs font-bold text-cyan-600 uppercase">Total Final</p>
            <p className="text-xl font-black text-cyan-700 font-mono">{fmt(totalFinal)}</p>
          </div>
        </div>

        {/* Cost breakdown chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-sm text-gray-700 mb-3">Composición de Costos</h4>
          <div className="flex gap-1 h-6 rounded-full overflow-hidden bg-gray-100">
            {Object.entries(costBreakdown).map(([type, val]) => {
              const pct = directTotal > 0 ? (val / directTotal) * 100 : 0;
              const ct = COST_TYPE_LABELS[type] || COST_TYPE_LABELS.material;
              return pct > 0 ? <div key={type} className={`${ct.color} flex items-center justify-center text-[9px] font-bold`} style={{ width: `${pct}%` }} title={`${ct.label}: ${fmt(val)} (${pct.toFixed(0)}%)`}>{pct > 8 ? ct.label : ''}</div> : null;
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(costBreakdown).map(([type, val]) => {
              const ct = COST_TYPE_LABELS[type] || COST_TYPE_LABELS.material;
              return <span key={type} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ct.color}`}>{ct.label}: {fmt(val)}</span>;
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowNewSection(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-1 hover:bg-gray-200 transition-all"><Layers size={14} /> + Rubro</button>
          <button onClick={() => setShowNewItem(true)} className="bg-ecar-blue text-white px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-1 shadow-md hover:bg-ecar-blueDark transition-all"><Plus size={14} /> + Ítem</button>
          {selectedBudget.status === 'draft' && (
            <button onClick={() => updateBudget.mutate({ id: selectedBudget.id, status: 'revision' })} className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-1 hover:bg-yellow-200 transition-all"><Eye size={14} /> Enviar a Revisión</button>
          )}
          {selectedBudget.status === 'revision' && (
            <button onClick={() => updateBudget.mutate({ id: selectedBudget.id, status: 'approved' })} className="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-1 hover:bg-green-200 transition-all"><Check size={14} /> Aprobar</button>
          )}
        </div>

        {/* New Section Form */}
        {showNewSection && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-gray-800">Nuevo Rubro / Sección</h4>
            <div className="grid grid-cols-4 gap-3">
              <input value={newSection.ordinal} onChange={e => setNewSection({ ...newSection, ordinal: e.target.value })} placeholder="Ej: 1.1" className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
              <input value={newSection.name} onChange={e => setNewSection({ ...newSection, name: e.target.value })} placeholder="Nombre del rubro..." className="col-span-2 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
              <div className="flex gap-2">
                <button onClick={handleCreateSection} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex-1"><Check size={14} /></button>
                <button onClick={() => setShowNewSection(false)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm"><X size={14} /></button>
              </div>
            </div>
          </div>
        )}

        {/* New Item Form */}
        {showNewItem && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-gray-800">Nuevo Ítem de Presupuesto</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Descripción del ítem..." className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
              <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-xl text-sm">
                <option value="gl">Global</option><option value="m2">m²</option><option value="m3">m³</option><option value="ml">ml</option><option value="kg">kg</option><option value="tn">tn</option><option value="un">unidad</option><option value="hs">hs</option><option value="mes">mes</option><option value="día">día</option>
              </select>
              <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} placeholder="Cant." className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
              <input type="number" value={newItem.unit_price_ars} onChange={e => setNewItem({ ...newItem, unit_price_ars: e.target.value })} placeholder="Precio unit." className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono" />
              <select value={newItem.cost_type} onChange={e => setNewItem({ ...newItem, cost_type: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-xl text-sm">
                {Object.entries(COST_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} placeholder="Notas / supuestos..." className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
              <button onClick={handleCreateItem} disabled={createItem.isPending} className="bg-ecar-blue text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-1"><Check size={14} /> Agregar</button>
              <button onClick={() => setShowNewItem(false)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calculator size={16} /> Cómputo Métrico & Análisis de Precios</h3>
            <span className="text-xs text-gray-500 font-mono">{items.length} ítems</span>
          </div>
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin ítems de presupuesto</p>
              <p className="text-sm">Agregá rubros e ítems para armar el cómputo</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-3 py-3 text-center">Tipo</th>
                  <th className="px-3 py-3 text-center">Unidad</th>
                  <th className="px-3 py-3 text-right">Cantidad</th>
                  <th className="px-3 py-3 text-right">P.Unit</th>
                  <th className="px-3 py-3 text-right">Subtotal</th>
                  <th className="px-3 py-3 text-center">Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sections.map(sec => (
                  <React.Fragment key={sec.id}>
                    <tr className="bg-gray-50/80">
                      <td colSpan={7} className="px-4 py-2 font-bold text-gray-700 flex items-center gap-2"><Layers size={14} className="text-cyan-600" /> {sec.ordinal} — {sec.name}</td>
                    </tr>
                    {(itemsBySection[sec.id] || []).map(item => {
                      const ct = COST_TYPE_LABELS[item.cost_type] || COST_TYPE_LABELS.material;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-gray-800">{item.description}</span>
                            {item.notes && <p className="text-[10px] text-gray-400 mt-0.5">{item.notes}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ct.color}`}>{ct.label}</span></td>
                          <td className="px-3 py-2.5 text-center text-gray-600">{item.unit}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{item.quantity.toLocaleString('es-AR')}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{fmt(item.unit_price_ars)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">{fmt(item.quantity * item.unit_price_ars)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <button onClick={() => deleteItem.mutate(item.id)} className="text-red-400 hover:text-red-600 text-xs"><X size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                {/* Items without section */}
                {(itemsBySection['_nosection'] || []).length > 0 && (
                  <>
                    <tr className="bg-gray-50/80">
                      <td colSpan={7} className="px-4 py-2 font-bold text-gray-500 text-xs uppercase">Sin rubro asignado</td>
                    </tr>
                    {(itemsBySection['_nosection'] || []).map(item => {
                      const ct = COST_TYPE_LABELS[item.cost_type] || COST_TYPE_LABELS.material;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-gray-800">{item.description}</span>
                            {item.notes && <p className="text-[10px] text-gray-400 mt-0.5">{item.notes}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ct.color}`}>{ct.label}</span></td>
                          <td className="px-3 py-2.5 text-center text-gray-600">{item.unit}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{item.quantity.toLocaleString('es-AR')}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{fmt(item.unit_price_ars)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">{fmt(item.quantity * item.unit_price_ars)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <button onClick={() => deleteItem.mutate(item.id)} className="text-red-400 hover:text-red-600 text-xs"><X size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
                {/* Totals */}
                <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                  <td colSpan={5} className="px-4 py-2.5 text-right text-gray-700 uppercase text-xs">Costo Directo</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-800">{fmt(directTotal)}</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">Gastos Generales ({fmtPct(selectedBudget.gastos_generales_pct)})</td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-600 text-xs">{fmt(gg)}</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">Beneficio ({fmtPct(selectedBudget.beneficio_pct)})</td>
                  <td className="px-3 py-1.5 text-right font-mono text-green-600 text-xs">{fmt(beneficio)}</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">Financieros ({fmtPct(selectedBudget.financieros_pct)})</td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-600 text-xs">{fmt(financiero)}</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500 text-xs">IVA ({fmtPct(selectedBudget.impuestos_pct)}) + IIBB ({fmtPct(selectedBudget.iibb_pct)})</td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-600 text-xs">{fmt(iva + iibb)}</td>
                  <td></td>
                </tr>
                <tr className="bg-cyan-50 border-t-2 border-cyan-300 font-black">
                  <td colSpan={5} className="px-4 py-3 text-right text-cyan-700 uppercase text-sm">Total Final</td>
                  <td className="px-3 py-3 text-right font-mono text-cyan-800 text-lg">{fmt(totalFinal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ======== LIST VIEW ========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><HardHat size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><HardHat size={24} /> Proyectos & Presupuestos</h3>
          <p className="text-cyan-100 text-sm mt-1">Cómputos métricos, análisis de precios, versiones y control presupuestario (PR-GPP-01)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><FileText size={16} className="text-cyan-500" /> Total</div>
          <p className="text-2xl font-black text-cyan-600 font-mono">{totalBudgets}</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm bg-blue-50/30">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Edit2 size={16} className="text-blue-500" /> Borradores</div>
          <p className="text-2xl font-black text-blue-600 font-mono">{draftCount}</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-5 shadow-sm bg-green-50/30">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Check size={16} className="text-green-500" /> Aprobados</div>
          <p className="text-2xl font-black text-green-600 font-mono">{approvedCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><DollarSign size={16} className="text-emerald-500" /> Valor Total</div>
          <p className="text-xl font-black text-gray-800 font-mono">{fmt(totalValue)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o proyecto..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all"><Plus size={16} /> Nuevo Presupuesto</button>
      </div>

      {/* New Budget Form */}
      {showNew && (
        <div className="bg-white border border-cyan-200 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2"><Plus size={16} /> Nuevo Presupuesto</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nombre *</label><input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej: Presupuesto Barrio Norte - Etapa 1" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Proyecto</label><select value={newForm.project_id} onChange={e => setNewForm({ ...newForm, project_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="">Sin asignar</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Descripción / Supuestos / Exclusiones</label><textarea value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Incluir aquí supuestos, exclusiones, aclaraciones técnicas y riesgos identificados..." /></div>
          <div className="grid grid-cols-5 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500">GG %</label><input type="number" step="0.1" value={newForm.gastos_generales_pct} onChange={e => setNewForm({ ...newForm, gastos_generales_pct: e.target.value })} className="w-full px-2 py-2 border border-gray-300 rounded-xl text-sm font-mono text-center" /></div>
            <div><label className="text-[10px] font-bold text-gray-500">Beneficio %</label><input type="number" step="0.1" value={newForm.beneficio_pct} onChange={e => setNewForm({ ...newForm, beneficio_pct: e.target.value })} className="w-full px-2 py-2 border border-gray-300 rounded-xl text-sm font-mono text-center" /></div>
            <div><label className="text-[10px] font-bold text-gray-500">Financieros %</label><input type="number" step="0.1" value={newForm.financieros_pct} onChange={e => setNewForm({ ...newForm, financieros_pct: e.target.value })} className="w-full px-2 py-2 border border-gray-300 rounded-xl text-sm font-mono text-center" /></div>
            <div><label className="text-[10px] font-bold text-gray-500">IVA %</label><input type="number" step="0.1" value={newForm.impuestos_pct} onChange={e => setNewForm({ ...newForm, impuestos_pct: e.target.value })} className="w-full px-2 py-2 border border-gray-300 rounded-xl text-sm font-mono text-center" /></div>
            <div><label className="text-[10px] font-bold text-gray-500">IIBB %</label><input type="number" step="0.1" value={newForm.iibb_pct} onChange={e => setNewForm({ ...newForm, iibb_pct: e.target.value })} className="w-full px-2 py-2 border border-gray-300 rounded-xl text-sm font-mono text-center" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateBudget} disabled={createBudget.isPending || !newForm.name.trim()} className="bg-ecar-blue text-white px-5 py-2 rounded-lg font-bold text-sm disabled:opacity-50"><Check size={14} className="inline mr-1" /> Crear Presupuesto</button>
            <button onClick={() => setShowNew(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold"><X size={14} className="inline mr-1" /> Cancelar</button>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Presupuestos Registrados</h3></div>
        {filtered.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Presupuesto</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3 text-center">Versión</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Total Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(budget => {
                const stat = STATUS_MAP[budget.status] || STATUS_MAP.draft;
                return (
                  <tr key={budget.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(budget.id)}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="flex flex-col">
                        <span>{budget.name}</span>
                        {budget.description && <span className="text-xs text-gray-500 font-normal truncate max-w-[300px]">{budget.description}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {budget.project?.name ? (<span className="flex items-center gap-1.5"><FolderOpen size={14} className="text-cyan-600" />{budget.project.name}</span>) : (<span className="text-gray-400">Sin proyecto</span>)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">v{budget.version}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stat.color}`}>{stat.label}</span></td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{fmt(budget.total_final_ars)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay presupuestos</p>
            <p className="text-sm">Hacé clic en "Nuevo Presupuesto" para comenzar a estimar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
