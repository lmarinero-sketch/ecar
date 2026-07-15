import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet, ChevronDown, ChevronRight, Plus, X, Save, TrendingUp, TrendingDown,
  Users, Shield, Zap, Receipt, Hammer, Fuel, HandCoins, Wrench, UtensilsCrossed,
  Package, Check, ChevronLeft, ChevronRight as ChevronRightIcon, Trash2
} from 'lucide-react';
import { useGastosItems, useGastosRegistrosByRange, useUpsertGastoRegistro, useCreateGastoItem, useDeleteGastoItem, useUpdateGastoItem, useGastosRegistrosByItem } from '../hooks/useData';
import { useImplementationStore } from '../store/useImplementationStore';
import { useModalStore } from '../store/useModalStore';
import type { GastoItem, GastoItemCategoria, GastoRegistro } from '../lib/types';

// ─── Expanded Detail Component ───
const ExpandedGastoDetail: React.FC<{ item: GastoItem }> = ({ item }) => {
  const [form, setForm] = useState({
    alias_cbu: item.alias_cbu || '',
    titular_cuenta: item.titular_cuenta || '',
    aclaraciones: item.aclaraciones || '',
    importe_mensual_default: item.importe_mensual_default?.toString() || ''
  });
  const updateItem = useUpdateGastoItem();
  const { data: history = [], isLoading } = useGastosRegistrosByItem(item.id);

  const handleSave = async () => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        alias_cbu: form.alias_cbu,
        titular_cuenta: form.titular_cuenta,
        aclaraciones: form.aclaraciones,
        importe_mensual_default: form.importe_mensual_default ? parseFloat(form.importe_mensual_default) : null,
      } as any);
      useModalStore.getState().showAlert('Éxito', 'Datos guardados correctamente.');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', 'Error al guardar: ' + err.message);
      console.error(err);
    }
  };

  return (
    <tr className="bg-emerald-50/50 border-b border-gray-200">
      <td colSpan={100} className="px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulario de Datos */}
          <div className="flex-1 space-y-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <h4 className="font-bold text-sm text-emerald-800 border-b pb-2">Datos para Transferencia y Setup</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">CBU / Alias</label>
                <input value={form.alias_cbu} onChange={e => setForm({...form, alias_cbu: e.target.value})} className="w-full px-2 py-1.5 border rounded-lg text-xs font-mono bg-gray-50" placeholder="Ej: EMPRESA.MP" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Titular Cuenta</label>
                <input value={form.titular_cuenta} onChange={e => setForm({...form, titular_cuenta: e.target.value})} className="w-full px-2 py-1.5 border rounded-lg text-xs bg-gray-50" placeholder="Ej: JUAN PEREZ" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Aclaraciones</label>
                <input value={form.aclaraciones} onChange={e => setForm({...form, aclaraciones: e.target.value})} className="w-full px-2 py-1.5 border rounded-lg text-xs bg-gray-50" placeholder="Ej: Pagar del 1 al 10" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Importe Mensual Base</label>
                <input 
                  value={
                    form.importe_mensual_default 
                      ? form.importe_mensual_default.split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (form.importe_mensual_default.includes('.') ? ',' + form.importe_mensual_default.split('.')[1] : '')
                      : ''
                  } 
                  onChange={e => {
                    let clean = e.target.value.replace(/[^0-9,]/g, '');
                    const p = clean.split(',');
                    if (p.length > 2) clean = p[0] + ',' + p.slice(1).join('');
                    setForm({...form, importe_mensual_default: clean.replace(',', '.')});
                  }} 
                  className="w-full px-2 py-1.5 border rounded-lg text-xs font-mono bg-gray-50" 
                  placeholder="0,00" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSave} disabled={updateItem.isPending} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">
                {updateItem.isPending ? 'Guardando...' : 'Guardar Datos'}
              </button>
            </div>
          </div>

          {/* Historial de Pagos / Libro Mayor */}
          <div className="flex-1 space-y-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm max-h-[250px] overflow-y-auto">
            <h4 className="font-bold text-sm text-emerald-800 border-b pb-2">Historial de Pagos (Libro Mayor)</h4>
            {isLoading ? (
              <div className="text-center py-4 text-xs text-gray-500">Cargando historial...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-500">Sin historial de pagos registrado.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-1 font-bold uppercase text-[9px]">Periodo</th>
                    <th className="text-right pb-1 font-bold uppercase text-[9px]">Cargado</th>
                    <th className="text-right pb-1 font-bold uppercase text-[9px]">Pagado</th>
                    <th className="text-right pb-1 font-bold uppercase text-[9px]">Pendiente</th>
                    <th className="text-center pb-1 font-bold uppercase text-[9px]">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map(h => {
                    const pendiente = Number(h.monto) - Number(h.monto_pagado || 0);
                    return (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="py-1.5 font-bold text-gray-700">{h.periodo}</td>
                        <td className="py-1.5 text-right font-mono text-gray-600">{formatARS(Number(h.monto))}</td>
                        <td className="py-1.5 text-right font-mono text-green-600">{formatARS(Number(h.monto_pagado || 0))}</td>
                        <td className="py-1.5 text-right font-mono text-orange-600">{pendiente > 0 ? formatARS(pendiente) : '-'}</td>
                        <td className="py-1.5 text-center">
                          {h.pagado ? <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold">PAGADO</span> : <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[9px] font-bold">PENDIENTE</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};


// ─── Category config ───
const CATEGORIA_CONFIG: Record<GastoItemCategoria, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  personal: { label: 'Personal ECAR - Honorarios', icon: Users, color: 'text-ecar-blue', bgColor: 'bg-slate-50' },
  seguros: { label: 'Seguros', icon: Shield, color: 'text-blue-700', bgColor: 'bg-blue-50' },
  servicios: { label: 'Servicios', icon: Zap, color: 'text-amber-700', bgColor: 'bg-amber-50' },
  impuestos: { label: 'Impuestos ARCA / Provincia', icon: Receipt, color: 'text-red-700', bgColor: 'bg-red-50' },
  gremios: { label: 'Gremios', icon: Hammer, color: 'text-orange-700', bgColor: 'bg-orange-50' },
  combustibles: { label: 'Combustibles', icon: Fuel, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  terceros: { label: 'Pagos a Terceros / Préstamos', icon: HandCoins, color: 'text-ecar-blue', bgColor: 'bg-slate-50' },
  servicios_contratados: { label: 'Servicios HyS Contratados', icon: Wrench, color: 'text-ecar-blue', bgColor: 'bg-slate-50' },
  viandas: { label: 'Viandas ECAR', icon: UtensilsCrossed, color: 'text-lime-700', bgColor: 'bg-lime-50' },
  varios: { label: 'Varios', icon: Package, color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

const MONTHS_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getPeriodo(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function formatARS(v: number) {
  return `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const ExpensesModule: React.FC = () => {
  const now = new Date();

  useEffect(() => {
    useImplementationStore.getState().completeItem('e2-14');
  }, []);
  const [year, setYear] = useState(now.getFullYear());
  const [visibleRange, setVisibleRange] = useState<[number, number]>(() => {
    const curr = now.getMonth();
    return [Math.max(0, curr - 2), curr];
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editCell, setEditCell] = useState<{ itemId: string; periodo: string; monto: string } | null>(null);
  const [showAddItem, setShowAddItem] = useState<GastoItemCategoria | null>(null);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [showGlobalAdd, setShowGlobalAdd] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalCat, setGlobalCat] = useState<GastoItemCategoria | null>(null);
  const [globalDesc, setGlobalDesc] = useState('');

  const visibleMonths = useMemo(() => {
    const months: number[] = [];
    for (let i = visibleRange[0]; i <= visibleRange[1]; i++) months.push(i);
    return months;
  }, [visibleRange]);

  const periodos = useMemo(() => visibleMonths.map(m => getPeriodo(year, m)), [year, visibleMonths]);

  const { data: items = [], isLoading: itemsLoading } = useGastosItems();
  const { data: registros = [], isLoading: regLoading } = useGastosRegistrosByRange(periodos);
  const upsertRegistro = useUpsertGastoRegistro();
  const createItem = useCreateGastoItem();
  const deleteItem = useDeleteGastoItem();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const isLoading = itemsLoading || regLoading;

  // Group items by category
  const grouped = useMemo(() => {
    const map: Partial<Record<GastoItemCategoria, GastoItem[]>> = {};
    items.forEach(item => {
      if (!map[item.categoria]) map[item.categoria] = [];
      map[item.categoria]!.push(item);
    });
    return map;
  }, [items]);

  // Registry lookup: key = `${item_id}__${periodo}`
  const regMap = useMemo(() => {
    const m: Record<string, GastoRegistro> = {};
    registros.forEach(r => { m[`${r.item_id}__${r.periodo}`] = r; });
    return m;
  }, [registros]);

  const getMonto = (itemId: string, periodo: string) => {
    const r = regMap[`${itemId}__${periodo}`];
    return r ? Number(r.monto) : 0;
  };

  const isPagado = (itemId: string, periodo: string) => {
    const r = regMap[`${itemId}__${periodo}`];
    return r?.pagado || false;
  };

  // Totals
  const categoryTotal = (cat: GastoItemCategoria, periodo: string) => {
    const catItems = grouped[cat] || [];
    return catItems.reduce((s, item) => s + getMonto(item.id, periodo), 0);
  };

  const grandTotal = (periodo: string) => {
    return items.reduce((s, item) => s + getMonto(item.id, periodo), 0);
  };

  const totalAllMonths = items.reduce((s, item) => {
    return s + periodos.reduce((ps, p) => ps + getMonto(item.id, p), 0);
  }, 0);

  // Current vs previous month comparison
  const currentPeriodo = getPeriodo(year, now.getMonth());
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? year - 1 : year;
  const prevPeriodo = getPeriodo(prevYear, prevMonth);
  const currentTotal = grandTotal(currentPeriodo);
  const prevTotal = grandTotal(prevPeriodo);
  const diff = currentTotal - prevTotal;
  const diffPct = prevTotal > 0 ? ((diff / prevTotal) * 100) : 0;

  const toggleCollapse = (cat: string) => setCollapsed(c => ({ ...c, [cat]: !c[cat] }));

  const handleSave = async (itemId: string, periodo: string, montoStr: string) => {
    const monto = parseFloat(montoStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    await upsertRegistro.mutateAsync({ item_id: itemId, periodo, monto });
    useImplementationStore.getState().completeItem('e2-15');
    useImplementationStore.getState().completeItem('c2-17');
    setEditCell(null);
  };

  const handleTogglePagado = async (itemId: string, periodo: string) => {
    const current = isPagado(itemId, periodo);
    const monto = getMonto(itemId, periodo);
    await upsertRegistro.mutateAsync({ item_id: itemId, periodo, monto, pagado: !current });
  };

  const handleAddItem = async () => {
    if (!showAddItem || !newItemDesc.trim()) return;
    const catItems = grouped[showAddItem] || [];
    await createItem.mutateAsync({ categoria: showAddItem, descripcion: newItemDesc.trim().toUpperCase(), orden: catItems.length + 1 });
    useImplementationStore.getState().completeItem('e2-15');
    useImplementationStore.getState().completeItem('c2-17');
    setNewItemDesc('');
    setShowAddItem(null);
  };

  const handleGlobalAdd = async () => {
    if (!globalCat || !globalDesc.trim()) return;
    const catItems = grouped[globalCat] || [];
    await createItem.mutateAsync({ categoria: globalCat, descripcion: globalDesc.trim().toUpperCase(), orden: catItems.length + 1 });
    useImplementationStore.getState().completeItem('e2-15');
    useImplementationStore.getState().completeItem('c2-17');
    setGlobalDesc('');
    setGlobalCat(null);
    setGlobalSearch('');
    setShowGlobalAdd(false);
  };

  const shiftRange = (dir: -1 | 1) => {
    setVisibleRange(([a, b]) => {
      const newA = Math.max(0, Math.min(11, a + dir));
      const newB = Math.max(0, Math.min(11, b + dir));
      if (newB - newA < 0) return [a, b];
      return [newA, newB];
    });
  };

  const categoryOrder: GastoItemCategoria[] = ['personal', 'seguros', 'servicios', 'impuestos', 'gremios', 'combustibles', 'terceros', 'servicios_contratados', 'viandas', 'varios'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Wallet size={24} /> Gastos Operativos</h3>
          <p className="text-emerald-100 text-sm mt-1">Estructura de gastos mensuales — control por categoría y período</p>
        </div>
      </div>

      {/* Nuevo Gasto Button */}
      <div className="flex justify-end">
        <button onClick={() => setShowGlobalAdd(true)} className="btn-primary">
          <Plus size={16} /> Nuevo Gasto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Wallet size={16} className="text-emerald-500" /> Total Visible</div>
          <p className="text-xl font-black font-mono text-emerald-600">{formatARS(totalAllMonths)}</p>
          <p className="text-xs text-gray-400 mt-1">{visibleMonths.length} meses • {year}</p>
        </div>
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Receipt size={16} className="text-blue-500" /> Mes Actual</div>
          <p className="text-xl font-black font-mono text-blue-600">{formatARS(currentTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{MONTHS_LABELS[now.getMonth()]} {year}</p>
        </div>
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1">
            {diff >= 0 ? <TrendingUp size={16} className="text-red-500" /> : <TrendingDown size={16} className="text-green-500" />}
            Var. vs Mes Anterior
          </div>
          <p className={`text-xl font-black font-mono ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {diff >= 0 ? '+' : ''}{formatARS(diff)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%</p>
        </div>
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Package size={16} className="text-gray-500" /> Rubros</div>
          <p className="text-xl font-black font-mono text-gray-700">{items.length}</p>
          <p className="text-xs text-gray-400 mt-1">{Object.keys(grouped).length} categorías</p>
        </div>
      </div>

      {/* Year + Range selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"><ChevronLeft size={16} /></button>
          <span className="font-black text-lg text-gray-800 tabular-nums min-w-[4ch] text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"><ChevronRightIcon size={16} /></button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftRange(-1)} disabled={visibleRange[0] === 0} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
          <div className="flex gap-1">
            {Array.from({ length: 12 }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  const range = visibleRange[1] - visibleRange[0];
                  const newStart = Math.max(0, Math.min(11 - range, i));
                  setVisibleRange([newStart, newStart + range]);
                }}
                className={`w-8 h-7 rounded text-xs font-bold transition-all ${
                  i >= visibleRange[0] && i <= visibleRange[1]
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {MONTHS_LABELS[i].slice(0, 3)}
              </button>
            ))}
          </div>
          <button onClick={() => shiftRange(1)} disabled={visibleRange[1] === 11} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"><ChevronRightIcon size={14} /></button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="light-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Header row */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[280px]">
                    Descripción
                  </th>
                  {visibleMonths.map(m => (
                    <th key={m} className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      {MONTHS_LABELS[m]} {year}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[140px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryOrder.map(cat => {
                  const catItems = grouped[cat];
                  if (!catItems?.length) return null;
                  const cfg = CATEGORIA_CONFIG[cat];
                  const Icon = cfg.icon;
                  const isCollapsed = collapsed[cat];

                  return (
                    <React.Fragment key={cat}>
                      {/* Category header row */}
                      <tr
                        className={`${cfg.bgColor} border-y border-gray-200 cursor-pointer hover:brightness-95 transition-all`}
                        onClick={() => toggleCollapse(cat)}
                      >
                        <td className={`px-4 py-2.5 font-bold ${cfg.color} flex items-center gap-2 sticky left-0 ${cfg.bgColor} z-10`}>
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          <Icon size={16} />
                          <span className="text-xs uppercase tracking-wider">{cfg.label}</span>
                          <button
                            onClick={e => { e.stopPropagation(); setShowAddItem(cat); }}
                            className="ml-auto p-0.5 rounded hover:bg-white/50 transition-colors"
                            title="Agregar item"
                          >
                            <Plus size={13} />
                          </button>
                        </td>
                        {visibleMonths.map(m => {
                          const p = getPeriodo(year, m);
                          const total = categoryTotal(cat, p);
                          return (
                            <td key={m} className={`px-3 py-2.5 text-right font-mono font-black text-xs ${cfg.color}`}>
                              {total > 0 ? formatARS(total) : '—'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-2.5 text-right font-mono font-black text-xs ${cfg.color} bg-gray-100/50`}>
                          {formatARS(periodos.reduce((s, p) => s + categoryTotal(cat, p), 0))}
                        </td>
                      </tr>

                      {/* Item rows (if not collapsed) */}
                      {!isCollapsed && catItems.map(item => (
                        <React.Fragment key={item.id}>
                        <tr className="hover:bg-gray-50 border-b border-gray-100 group cursor-pointer" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                          <td className="px-4 py-2 text-gray-700 text-xs sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="truncate block">{item.descripcion}</span>
                                {((item as any).alias_cbu || (item as any).titular_cuenta) && (
                                  <span className="text-[9px] text-gray-400 font-mono truncate block">
                                    {item.alias_cbu && `📎 ${item.alias_cbu}`}
                                    {item.titular_cuenta && ` · ${item.titular_cuenta}`}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={async (e) => { 
                                  e.stopPropagation(); 
                                  if (await useModalStore.getState().showConfirm('Eliminar Gasto', `¿Eliminar "${item.descripcion}"?`)) {
                                    deleteItem.mutate(item.id); 
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                                title="Eliminar"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                          {visibleMonths.map(m => {
                            const p = getPeriodo(year, m);
                            const monto = getMonto(item.id, p);
                            const pagado = isPagado(item.id, p);
                            const isEditing = editCell?.itemId === item.id && editCell?.periodo === p;

                            return (
                              <td key={m} className="px-1 py-1 text-right">
                                {isEditing ? (
                                  <div className="flex items-center gap-1 justify-end">
                                    <input
                                      autoFocus
                                      value={editCell.monto}
                                      onChange={e => setEditCell({ ...editCell, monto: e.target.value })}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleSave(item.id, p, editCell.monto);
                                        if (e.key === 'Escape') setEditCell(null);
                                      }}
                                      onBlur={() => { if (editCell.monto) handleSave(item.id, p, editCell.monto); else setEditCell(null); }}
                                      placeholder="0.00"
                                      className="w-full px-2 py-1.5 border-2 border-emerald-400 rounded-lg text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-emerald-50"
                                    />
                                    <button onClick={() => handleSave(item.id, p, editCell.monto)} className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 flex-shrink-0">
                                      <Save size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 justify-end">
                                    {monto > 0 && (
                                      <button
                                        onClick={e => { e.stopPropagation(); handleTogglePagado(item.id, p); }}
                                        className={`p-0.5 rounded transition-colors flex-shrink-0 ${pagado ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'}`}
                                        title={pagado ? 'Pagado ✓' : 'Marcar como pagado'}
                                      >
                                        <Check size={12} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setEditCell({ itemId: item.id, periodo: p, monto: monto > 0 ? monto.toString() : '' })}
                                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-mono transition-all min-w-[100px] text-right border ${
                                        monto > 0
                                          ? `font-bold text-gray-800 border-transparent hover:border-emerald-300 hover:bg-emerald-50 ${pagado ? 'line-through text-gray-400' : ''}`
                                          : 'text-gray-300 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-600'
                                      }`}
                                      title="Click para cargar importe"
                                    >
                                      {monto > 0 ? formatARS(monto) : 'Cargar $'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-mono font-bold text-xs text-gray-600 bg-gray-50">
                            {formatARS(periodos.reduce((s, p) => s + getMonto(item.id, p), 0))}
                          </td>
                        </tr>
                        {expandedItemId === item.id && <ExpandedGastoDetail item={item} />}
                        </React.Fragment>
                      ))}

                      {/* Add item inline */}
                      {showAddItem === cat && (
                        <tr className="border-b border-gray-100 bg-emerald-50/30">
                          <td colSpan={visibleMonths.length + 2} className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={newItemDesc}
                                onChange={e => setNewItemDesc(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') setShowAddItem(null); }}
                                placeholder="Descripción del nuevo gasto..."
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                              />
                              <button onClick={handleAddItem} disabled={!newItemDesc.trim()} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                                Agregar
                              </button>
                              <button onClick={() => { setShowAddItem(null); setNewItemDesc(''); }} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Grand total row */}
                <tr className="bg-emerald-800 text-white font-bold border-t-2 border-emerald-900">
                  <td className="px-4 py-3 text-sm uppercase tracking-wider sticky left-0 bg-emerald-800 z-10">
                    Total General
                  </td>
                  {visibleMonths.map(m => {
                    const p = getPeriodo(year, m);
                    return (
                      <td key={m} className="px-3 py-3 text-right font-mono font-black text-sm">
                        {formatARS(grandTotal(p))}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right font-mono font-black text-sm bg-emerald-900">
                    {formatARS(totalAllMonths)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400 px-2">
        <span className="flex items-center gap-1"><Check size={12} className="text-green-500" /> = Pagado</span>
        <span>Click en un monto para editarlo</span>
        <span>Enter para guardar, Esc para cancelar</span>
      </div>

      {/* Global Add Gasto Modal */}
      {showGlobalAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Nuevo Gasto</h3>
              <button onClick={() => { setShowGlobalAdd(false); setGlobalSearch(''); setGlobalCat(null); setGlobalDesc(''); }}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Category Search */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Categoría</label>
              {globalCat ? (
                <div className="flex items-center gap-2">
                  {(() => { const cfg = CATEGORIA_CONFIG[globalCat]; const Icon = cfg.icon; return <span className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${cfg.bgColor} ${cfg.color}`}><Icon size={16} />{cfg.label}</span>; })()}
                  <button onClick={() => { setGlobalCat(null); setGlobalSearch(''); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    autoFocus
                    value={globalSearch}
                    onChange={e => setGlobalSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    placeholder="Buscá una categoría..."
                  />
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {Object.entries(CATEGORIA_CONFIG)
                      .filter(([_, cfg]) => !globalSearch || cfg.label.toLowerCase().includes(globalSearch.toLowerCase()))
                      .map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const count = (grouped[key as GastoItemCategoria] || []).length;
                        return (
                          <button key={key} onClick={() => { setGlobalCat(key as GastoItemCategoria); useImplementationStore.getState().completeItem('e2-16'); }} className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50 transition-colors ${cfg.color}`}>
                            <Icon size={16} />
                            <span className="font-medium">{cfg.label}</span>
                            <span className="text-xs text-gray-400 ml-auto">{count} items</span>
                          </button>
                        );
                      })}
                    {globalSearch && !Object.values(CATEGORIA_CONFIG).some(c => c.label.toLowerCase().includes(globalSearch.toLowerCase())) && (
                      <p className="text-xs text-gray-400 text-center py-2">No se encontró "{globalSearch}". Seleccioná una categoría existente.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {globalCat && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Descripción del Gasto</label>
                  <input
                    autoFocus
                    value={globalDesc}
                    onChange={e => setGlobalDesc(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleGlobalAdd(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    placeholder="Ej: SEGURO AUTOMOTOR TOYOTA"
                  />
                </div>
                <button onClick={handleGlobalAdd} disabled={!globalDesc.trim() || createItem.isPending} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {createItem.isPending ? 'Creando...' : '✓ Crear Gasto'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
