import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, DollarSign, ChevronDown, ChevronUp, Ruler, Box, Layers, BarChart3, FileSpreadsheet, RefreshCw, ArrowRightLeft } from 'lucide-react';

/* ═══════ TYPES ═══════ */
export interface BimElementMeasure {
  expressID: number;
  typeName: string;
  width: number;
  height: number;
  depth: number;
  area: number;
  volume: number;
  perimeter: number;
}

interface CategorySummary {
  typeName: string;
  count: number;
  totalArea: number;
  totalVolume: number;
  totalLineal: number;
  unitCost: number;       // siempre en USD
  costUnit: 'm2' | 'm3' | 'ml' | 'u';
  subtotal: number;       // siempre en USD
}

type Currency = 'USD' | 'ARS';

// ══════════════════════════════════════════════════════════════
// Costos unitarios en USD — Referencia mercado construcción
// argentina mayo 2026. Fuentes: CAC, Apymeco, relevamiento
// de presupuestos reales de obra (costo directo sin terreno).
// ══════════════════════════════════════════════════════════════
const DEFAULT_UNIT_COSTS: Record<string, { cost: number; unit: 'm2' | 'm3' | 'ml' | 'u'; label: string }> = {
  'Muro':       { cost: 55,   unit: 'm2', label: 'Mampostería / Muro' },
  'Losa':       { cost: 95,   unit: 'm2', label: 'Losa H°A°' },
  'Columna':    { cost: 420,  unit: 'm3', label: 'Columna H°A°' },
  'Viga':       { cost: 380,  unit: 'm3', label: 'Viga H°A°' },
  'Ventana':    { cost: 350,  unit: 'u',  label: 'Ventana (DVH std)' },
  'Puerta':     { cost: 280,  unit: 'u',  label: 'Puerta interior/exterior' },
  'Escalera':   { cost: 180,  unit: 'm2', label: 'Escalera H°A°' },
  'Techo':      { cost: 65,   unit: 'm2', label: 'Cubierta / Techo' },
  'Fundación':  { cost: 280,  unit: 'm3', label: 'Fundación H°A°' },
  'Pilote':     { cost: 200,  unit: 'ml', label: 'Pilote in situ' },
  'Baranda':    { cost: 110,  unit: 'ml', label: 'Baranda metálica' },
  'Placa':      { cost: 42,   unit: 'm2', label: 'Placa / Revestimiento' },
  'Mobiliario': { cost: 250,  unit: 'u',  label: 'Mobiliario fijo' },
  'Miembro':    { cost: 75,   unit: 'ml', label: 'Perfil / Miembro' },
  'default':    { cost: 60,   unit: 'm2', label: 'Elemento genérico' },
};

const UNIT_LABELS: Record<string, string> = { m2: 'm²', m3: 'm³', ml: 'ml', u: 'unidad' };
const DEFAULT_USD_RATE = 1250; // Cotización USD blue/MEP referencia mayo 2026

interface BimCostCalculatorProps {
  elements: BimElementMeasure[];
  projectId: string;
}

export const BimCostCalculator: React.FC<BimCostCalculatorProps> = ({ elements, projectId }) => {
  const costsKey = `ecar-bim-costs-${projectId}`;

  // Restore persisted cost settings
  const getPersistedCosts = () => {
    try {
      const raw = localStorage.getItem(costsKey);
      if (raw) return JSON.parse(raw);
    } catch { /* corrupt */ }
    return null;
  };
  const persistedCosts = getPersistedCosts();

  const [costs, setCosts] = useState<Record<string, { cost: number; unit: 'm2' | 'm3' | 'ml' | 'u' }>>(persistedCosts?.costs || {});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [markupPct, setMarkupPct] = useState(persistedCosts?.markupPct ?? 15);
  const [currency, setCurrency] = useState<Currency>(persistedCosts?.currency || 'USD');
  const [usdRate, setUsdRate] = useState(persistedCosts?.usdRate || DEFAULT_USD_RATE);
  const [loadingRate, setLoadingRate] = useState(false);

  // Persist cost settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(costsKey, JSON.stringify({ costs, markupPct, currency, usdRate }));
    } catch { /* quota */ }
  }, [costs, markupPct, currency, usdRate, costsKey]);

  // Intentar obtener cotización real del dólar blue al montar
  useEffect(() => {
    const fetchRate = async () => {
      setLoadingRate(true);
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (res.ok) {
          const data = await res.json();
          if (data?.venta) setUsdRate(Math.round(data.venta));
        }
      } catch {
        // Si falla, usa el default
      } finally {
        setLoadingRate(false);
      }
    };
    fetchRate();
  }, []);

  // Aggregate elements by type
  const categories = useMemo<CategorySummary[]>(() => {
    const map: Record<string, { count: number; area: number; vol: number; lin: number }> = {};
    for (const el of elements) {
      const key = el.typeName || 'default';
      if (!map[key]) map[key] = { count: 0, area: 0, vol: 0, lin: 0 };
      map[key].count++;
      map[key].area += el.area;
      map[key].vol += el.volume;
      map[key].lin += el.perimeter;
    }
    return Object.entries(map).map(([typeName, d]) => {
      const defaults = DEFAULT_UNIT_COSTS[typeName] || DEFAULT_UNIT_COSTS['default'];
      const userCost = costs[typeName];
      const unitCost = userCost?.cost ?? defaults.cost;
      const costUnit = userCost?.unit ?? defaults.unit;
      let qty = 0;
      switch (costUnit) {
        case 'm2': qty = d.area; break;
        case 'm3': qty = d.vol; break;
        case 'ml': qty = d.lin; break;
        case 'u': qty = d.count; break;
      }
      return { typeName, count: d.count, totalArea: d.area, totalVolume: d.vol, totalLineal: d.lin, unitCost, costUnit, subtotal: qty * unitCost };
    }).sort((a, b) => b.subtotal - a.subtotal);
  }, [elements, costs]);

  const totalDirect = categories.reduce((s, c) => s + c.subtotal, 0);
  const totalMarkup = totalDirect * (markupPct / 100);
  const grandTotal = totalDirect + totalMarkup;
  const totalArea = categories.reduce((s, c) => s + c.totalArea, 0);
  const totalVolume = categories.reduce((s, c) => s + c.totalVolume, 0);
  const costPerM2 = totalArea > 0 ? grandTotal / totalArea : 0;

  // Display helpers — convert USD to ARS when needed
  const fmt = (usd: number): string => {
    if (currency === 'USD') {
      return 'U$D ' + usd.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    }
    return '$ ' + (usd * usdRate).toLocaleString('es-AR', { maximumFractionDigits: 0 });
  };

  const fmtUnit = (usd: number): string => {
    if (currency === 'USD') return usd.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    return (usd * usdRate).toLocaleString('es-AR', { maximumFractionDigits: 0 });
  };

  const updateCost = (typeName: string, displayVal: number) => {
    // El input siempre se muestra en la moneda seleccionada, guardamos en USD
    const usdVal = currency === 'USD' ? displayVal : (usdRate > 0 ? displayVal / usdRate : 0);
    setCosts(prev => ({
      ...prev,
      [typeName]: { cost: usdVal, unit: prev[typeName]?.unit ?? (DEFAULT_UNIT_COSTS[typeName]?.unit || 'm2') }
    }));
  };

  const updateUnit = (typeName: string, unit: 'm2' | 'm3' | 'ml' | 'u') => {
    setCosts(prev => ({
      ...prev,
      [typeName]: { cost: prev[typeName]?.cost ?? (DEFAULT_UNIT_COSTS[typeName]?.cost || 60), unit }
    }));
  };

  const getQty = (cat: CategorySummary) => {
    switch (cat.costUnit) {
      case 'm2': return cat.totalArea;
      case 'm3': return cat.totalVolume;
      case 'ml': return cat.totalLineal;
      case 'u': return cat.count;
    }
  };

  const getDisplayCost = (usdCost: number): number => {
    return currency === 'USD' ? usdCost : usdCost * usdRate;
  };

  const exportCSV = () => {
    const currLabel = currency === 'USD' ? 'USD' : 'ARS';
    const rows = [['Rubro', 'Cantidad', 'Unidad', `Costo Unitario (${currLabel})`, `Subtotal (${currLabel})`]];
    categories.forEach(c => {
      const sub = currency === 'USD' ? c.subtotal : c.subtotal * usdRate;
      const uc = currency === 'USD' ? c.unitCost : c.unitCost * usdRate;
      rows.push([c.typeName, getQty(c).toFixed(2), UNIT_LABELS[c.costUnit], uc.toFixed(0), sub.toFixed(0)]);
    });
    const td = currency === 'USD' ? totalDirect : totalDirect * usdRate;
    const tm = currency === 'USD' ? totalMarkup : totalMarkup * usdRate;
    const gt = currency === 'USD' ? grandTotal : grandTotal * usdRate;
    rows.push(['', '', '', 'Costo Directo', td.toFixed(0)]);
    rows.push(['', '', '', `Gastos Generales (${markupPct}%)`, tm.toFixed(0)]);
    rows.push(['', '', '', 'TOTAL', gt.toFixed(0)]);
    if (currency === 'USD') rows.push(['', '', '', 'Cotización USD/ARS', usdRate.toString()]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `computo_metrico_bim_${currLabel}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!elements.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        <Calculator size={48} className="mx-auto mb-3 opacity-20" />
        <p className="font-medium">Sin datos para calcular</p>
        <p className="text-sm">Cargá un modelo IFC para obtener el cómputo métrico automático.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Currency & Rate Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Moneda</span>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${currency === 'USD' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <DollarSign size={12} /> USD
            </button>
            <button onClick={() => setCurrency('ARS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${currency === 'ARS' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              $ ARS
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <ArrowRightLeft size={13} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-500">1 USD =</span>
          <input type="number" value={usdRate} onChange={e => setUsdRate(Number(e.target.value) || 0)}
            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs text-center font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <span className="text-xs text-gray-400">ARS</span>
          {loadingRate && <RefreshCw size={12} className="text-emerald-500 animate-spin" />}
        </div>
        <div className="text-[10px] text-gray-400 ml-auto">
          Costos de referencia: mercado argentino mayo 2026 (CAC / Apymeco)
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1"><Layers size={14} className="text-indigo-500" /> Elementos</div>
          <p className="text-2xl font-black text-indigo-600 font-mono">{elements.length}</p>
          <p className="text-[10px] text-gray-400">{categories.length} rubros</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1"><Ruler size={14} className="text-cyan-500" /> Superficie</div>
          <p className="text-2xl font-black text-cyan-600 font-mono">{totalArea.toFixed(1)}<span className="text-sm ml-1">m²</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1"><Box size={14} className="text-amber-500" /> Volumen</div>
          <p className="text-2xl font-black text-amber-600 font-mono">{totalVolume.toFixed(1)}<span className="text-sm ml-1">m³</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1"><DollarSign size={14} className="text-emerald-500" /> Presupuesto</div>
          <p className="text-lg font-black text-emerald-600 font-mono">{fmt(grandTotal)}</p>
          <p className="text-[10px] text-gray-400">con {markupPct}% GG</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1"><BarChart3 size={14} className="text-violet-500" /> Costo/m²</div>
          <p className="text-lg font-black text-violet-600 font-mono">{fmt(costPerM2)}</p>
          <p className="text-[10px] text-gray-400">incl. GG</p>
        </div>
      </div>

      {/* Cost Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            <h3 className="font-bold text-gray-800">Cómputo Métrico y Presupuesto</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-bold">GG%</span>
              <input type="number" value={markupPct} onChange={e => setMarkupPct(Number(e.target.value) || 0)}
                className="w-14 px-2 py-1 border border-gray-300 rounded-lg text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <button onClick={exportCSV} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5">
              <FileSpreadsheet size={13} /> Exportar CSV
            </button>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Rubro</th>
              <th className="px-4 py-3 text-center">Cant.</th>
              <th className="px-4 py-3 text-center">Cantidad</th>
              <th className="px-4 py-3 text-center">Unidad</th>
              <th className="px-4 py-3 text-right">Costo Unit. ({currency})</th>
              <th className="px-4 py-3 text-right">Subtotal ({currency})</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(cat => (
              <React.Fragment key={cat.typeName}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-800">{cat.typeName}</span>
                    {DEFAULT_UNIT_COSTS[cat.typeName]?.label && cat.typeName !== DEFAULT_UNIT_COSTS[cat.typeName].label && (
                      <span className="text-[10px] text-gray-400 block">{DEFAULT_UNIT_COSTS[cat.typeName].label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-600">{cat.count}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-gray-800">{getQty(cat).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <select value={cat.costUnit} onChange={e => updateUnit(cat.typeName, e.target.value as 'm2' | 'm3' | 'ml' | 'u')}
                      className="px-2 py-1 border rounded-lg text-xs font-bold text-gray-600 bg-white">
                      <option value="m2">m²</option>
                      <option value="m3">m³</option>
                      <option value="ml">ml</option>
                      <option value="u">unidad</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input type="number" value={Math.round(getDisplayCost(cat.unitCost))}
                      onChange={e => updateCost(cat.typeName, Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded-lg text-xs text-right font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{fmtUnit(cat.subtotal)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setExpandedCat(expandedCat === cat.typeName ? null : cat.typeName)} className="text-gray-400 hover:text-gray-700">
                      {expandedCat === cat.typeName ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
                {expandedCat === cat.typeName && (
                  <tr>
                    <td colSpan={7} className="bg-gray-50/80 px-6 py-3">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="text-gray-400 font-bold block text-[10px] uppercase">Superficie Total</span>
                          <span className="font-mono font-bold text-gray-800">{cat.totalArea.toFixed(2)} m²</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="text-gray-400 font-bold block text-[10px] uppercase">Volumen Total</span>
                          <span className="font-mono font-bold text-gray-800">{cat.totalVolume.toFixed(3)} m³</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="text-gray-400 font-bold block text-[10px] uppercase">Lineal Total</span>
                          <span className="font-mono font-bold text-gray-800">{cat.totalLineal.toFixed(2)} ml</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-300 bg-gray-50">
            <tr>
              <td colSpan={5} className="px-4 py-2.5 text-right text-sm font-bold text-gray-600">Costo Directo</td>
              <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-800">{fmt(totalDirect)}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-sm font-bold text-gray-600">Gastos Generales ({markupPct}%)</td>
              <td className="px-4 py-2 text-right font-mono font-bold text-gray-500">{fmt(totalMarkup)}</td>
              <td></td>
            </tr>
            <tr className="bg-indigo-50 border-t border-indigo-200">
              <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-indigo-800">PRESUPUESTO TOTAL</td>
              <td className="px-4 py-3 text-right font-mono font-black text-indigo-700 text-lg">{fmt(grandTotal)}</td>
              <td></td>
            </tr>
            {currency === 'USD' && (
              <tr className="bg-gray-50/50">
                <td colSpan={5} className="px-4 py-2 text-right text-xs text-gray-400">Equivalente en ARS (@ {usdRate.toLocaleString('es-AR')})</td>
                <td className="px-4 py-2 text-right font-mono text-xs text-gray-400">$ {(grandTotal * usdRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                <td></td>
              </tr>
            )}
            {currency === 'ARS' && (
              <tr className="bg-gray-50/50">
                <td colSpan={5} className="px-4 py-2 text-right text-xs text-gray-400">Equivalente en USD (@ {usdRate.toLocaleString('es-AR')})</td>
                <td className="px-4 py-2 text-right font-mono text-xs text-gray-400">U$D {grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                <td></td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
};
