import React, { useState } from 'react';
import { Tag, Plus, X, TrendingUp, History, Pencil, Trash2, Clock } from 'lucide-react';
import type { UnionCategory } from '../lib/types';

interface Props {
  categories: UnionCategory[];
  allHistory: UnionCategory[];
  createCategory: any;
  updateCategoryRate: any;
  deleteCategory: any;
}

export const CategoriesPanel: React.FC<Props> = ({ categories, allHistory, createCategory, updateCategoryRate, deleteCategory }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', hourly_rate_ars: '', daily_rate_ars: '' });
  const [editingCat, setEditingCat] = useState<UnionCategory | null>(null);
  const [editRate, setEditRate] = useState({ hourly_rate_ars: '', daily_rate_ars: '' });
  const [deleteTarget, setDeleteTarget] = useState<UnionCategory | null>(null);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!createForm.name) return;
    await createCategory.mutateAsync({
      name: createForm.name,
      hourly_rate_ars: parseFloat(createForm.hourly_rate_ars) || 0,
      daily_rate_ars: parseFloat(createForm.daily_rate_ars) || 0,
    });
    setCreateForm({ name: '', hourly_rate_ars: '', daily_rate_ars: '' });
    setShowCreate(false);
  };

  const handleUpdateRate = async () => {
    if (!editingCat) return;
    await updateCategoryRate.mutateAsync({
      id: editingCat.id,
      hourly_rate_ars: parseFloat(editRate.hourly_rate_ars) || 0,
      daily_rate_ars: parseFloat(editRate.daily_rate_ars) || 0,
    });
    setEditingCat(null);
  };

  // Group history by category name
  const historyByName = allHistory.reduce((acc: Record<string, UnionCategory[]>, cat) => {
    if (!acc[cat.name]) acc[cat.name] = [];
    acc[cat.name].push(cat);
    return acc;
  }, {});

  // Calculate increase index for a category
  const getIncreaseIndex = (name: string) => {
    const history = (historyByName[name] || []).filter(h => h.hourly_rate_ars > 0);
    if (history.length < 2) return [];
    const sorted = [...history].sort((a, b) => (a.effective_from || '').localeCompare(b.effective_from || ''));
    const increases: { from: number; to: number; pct: number; date: string }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].hourly_rate_ars;
      const curr = sorted[i].hourly_rate_ars;
      if (prev > 0) {
        increases.push({
          from: prev,
          to: curr,
          pct: Math.round(((curr - prev) / prev) * 100),
          date: sorted[i].effective_from || '',
        });
      }
    }
    return increases;
  };

  const formatARS = (v: number) => `$ ${Number(v).toLocaleString('es-AR')}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Tag size={20} className="text-indigo-500" /> Categorías UOCRA</h3>
          <p className="text-sm text-gray-400 mt-0.5">Gestioná las categorías y valores hora del convenio. Los cambios aplican solo hacia adelante.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-ecar-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-ecar-blueDark transition-all">
          <Plus size={16} /> Nueva Categoría
        </button>
      </div>

      {/* Current Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(cat => {
          const increases = getIncreaseIndex(cat.name);
          const lastIncrease = increases.length > 0 ? increases[increases.length - 1] : null;
          return (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{cat.name}</h4>
                    <p className="text-2xl font-black font-mono text-indigo-600 mt-1">{formatARS(cat.hourly_rate_ars)}<span className="text-sm font-normal text-gray-400">/hora</span></p>
                    {cat.daily_rate_ars > 0 && (
                      <p className="text-sm font-mono text-gray-500">{formatARS(cat.daily_rate_ars)}/día</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingCat(cat); setEditRate({ hourly_rate_ars: String(cat.hourly_rate_ars), daily_rate_ars: String(cat.daily_rate_ars) }); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Actualizar valor"><Pencil size={14} /></button>
                    <button onClick={() => setShowHistoryFor(showHistoryFor === cat.name ? null : cat.name)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Ver historial"><History size={14} /></button>
                    <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </div>
                {/* Last increase badge */}
                {lastIncrease && (
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className="text-xs text-green-600 font-bold">+{lastIncrease.pct}%</span>
                    <span className="text-xs text-gray-400">· {lastIncrease.date}</span>
                  </div>
                )}
                {cat.effective_from && (
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> Vigente desde {cat.effective_from}</p>
                )}
              </div>

              {/* Expandable History */}
              {showHistoryFor === cat.name && (
                <div className="border-t border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><History size={12} /> Índice de Aumentos</p>
                  {increases.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin historial de cambios previos</p>
                  ) : (
                    <div className="space-y-2">
                      {increases.map((inc, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 font-mono w-20 shrink-0">{inc.date}</span>
                          <span className="font-mono text-gray-500">{formatARS(inc.from)}</span>
                          <span className="text-gray-300">→</span>
                          <span className="font-mono font-bold text-gray-800">{formatARS(inc.to)}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${inc.pct > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {inc.pct > 0 ? '+' : ''}{inc.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Full historical values */}
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-3 mb-1">Todas las versiones</p>
                  <div className="space-y-1">
                    {(historyByName[cat.name] || []).map(h => (
                      <div key={h.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${h.is_current ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-mono text-gray-500 w-20 shrink-0">{h.effective_from || '—'}</span>
                        <span className="font-mono">{formatARS(h.hourly_rate_ars)}/h</span>
                        {h.effective_to && <span className="text-gray-400">hasta {h.effective_to}</span>}
                        {h.is_current && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Vigente</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Tag size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay categorías</p>
            <p className="text-sm">Creá la primera categoría UOCRA</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nueva Categoría UOCRA</h3>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nombre de Categoría *</label>
                <input value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Ej: Medio Oficial" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Valor Hora ($)</label>
                  <input type="number" value={createForm.hourly_rate_ars} onChange={e => setCreateForm({ ...createForm, hourly_rate_ars: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Valor Día ($)</label>
                  <input type="number" value={createForm.daily_rate_ars} onChange={e => setCreateForm({ ...createForm, daily_rate_ars: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" placeholder="0" />
                </div>
              </div>
            </div>
            <button onClick={handleCreate} disabled={!createForm.name || createCategory.isPending} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-ecar-blueDark transition-colors">
              {createCategory.isPending ? 'Creando...' : '✓ Crear Categoría'}
            </button>
          </div>
        </div>
      )}

      {/* Update Rate Modal */}
      {editingCat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Actualizar Valor — {editingCat.name}</h3>
              <button onClick={() => setEditingCat(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 font-bold flex items-center gap-1"><TrendingUp size={12} /> El cambio NO es retroactivo</p>
              <p className="text-[10px] text-amber-600 mt-0.5">El valor anterior se archivará con fecha de hoy. El nuevo valor aplica desde hoy hacia adelante.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Valor actual</p>
              <p className="font-mono font-bold text-gray-600">{formatARS(editingCat.hourly_rate_ars)}/hora · {formatARS(editingCat.daily_rate_ars)}/día</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nuevo Valor Hora ($)</label>
                <input type="number" value={editRate.hourly_rate_ars} onChange={e => setEditRate({ ...editRate, hourly_rate_ars: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nuevo Valor Día ($)</label>
                <input type="number" value={editRate.daily_rate_ars} onChange={e => setEditRate({ ...editRate, daily_rate_ars: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
            </div>
            {parseFloat(editRate.hourly_rate_ars) > 0 && editingCat.hourly_rate_ars > 0 && (
              <div className="text-center">
                <span className="text-sm font-bold text-green-600">
                  +{Math.round(((parseFloat(editRate.hourly_rate_ars) - editingCat.hourly_rate_ars) / editingCat.hourly_rate_ars) * 100)}% de aumento
                </span>
              </div>
            )}
            <button onClick={handleUpdateRate} disabled={updateCategoryRate.isPending} className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-ecar-blueDark transition-colors">
              {updateCategoryRate.isPending ? 'Actualizando...' : '✓ Aplicar Nuevo Valor'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Eliminar Categoría</h3>
            <p className="text-sm text-gray-600">
              ¿Eliminás la categoría <span className="font-bold">{deleteTarget.name}</span>? Los empleados asignados quedarán sin categoría.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Cancelar</button>
              <button
                onClick={async () => { await deleteCategory.mutateAsync(deleteTarget.id); setDeleteTarget(null); }}
                disabled={deleteCategory.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 disabled:opacity-50"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
