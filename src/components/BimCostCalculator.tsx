import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Download, ChevronDown, ChevronUp, Ruler, Box, Layers, BarChart3, FileSpreadsheet } from 'lucide-react';

/* ═══════ TYPES ═══════ */
export interface BimElementMeasure {
  expressID: number;
  typeName: string;       // Muro, Losa, Columna, etc.
  width: number;          // metros
  height: number;         // metros
  depth: number;          // metros
  area: number;           // m²
  volume: number;         // m³
  perimeter: number;      // ml
}

interface CategorySummary {
  typeName: string;
  count: number;
  totalArea: number;      // m²
  totalVolume: number;    // m³
  totalLineal: number;    // ml
  unitCost: number;       // $/unidad
  costUnit: 'm2' | 'm3' | 'ml' | 'u';
  subtotal: number;
}

// Costos unitarios default (ARS) — valores de referencia construcción argentina
const DEFAULT_UNIT_COSTS: Record<string, { cost: number; unit: 'm2' | 'm3' | 'ml' | 'u' }> = {
  'Muro':       { cost: 85000,  unit: 'm2' },
  'Losa':       { cost: 120000, unit: 'm2' },
  'Columna':    { cost: 250000, unit: 'm3' },
  'Viga':       { cost: 230000, unit: 'm3' },
  'Ventana':    { cost: 450000, unit: 'u'  },
  'Puerta':     { cost: 380000, unit: 'u'  },
  'Escalera':   { cost: 350000, unit: 'm2' },
  'Techo':      { cost: 95000,  unit: 'm2' },
  'Fundación':  { cost: 180000, unit: 'm3' },
  'Pilote':     { cost: 320000, unit: 'ml' },
  'Baranda':    { cost: 75000,  unit: 'ml' },
  'Placa':      { cost: 65000,  unit: 'm2' },
  'Mobiliario': { cost: 150000, unit: 'u'  },
  'Miembro':    { cost: 95000,  unit: 'ml' },
  'default':    { cost: 100000, unit: 'm2' },
};

const UNIT_LABELS: Record<string, string> = { m2: 'm²', m3: 'm³', ml: 'ml', u: 'unidad' };

interface BimCostCalculatorProps {
  elements: BimElementMeasure[];
}

export const BimCostCalculator: React.FC<BimCostCalculatorProps> = ({ elements }) => {
  const [costs, setCosts] = useState<Record<string, { cost: number; unit: 'm2' | 'm3' | 'ml' | 'u' }>>({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [markupPct, setMarkupPct] = useState(15);

  // Aggregate elements by type
  const categories = useMemo<CategorySummary[]>(() => {
    const map: Record<string, { count: number; area: number; vol: number; lin: number; ids: number[] }> = {};
    for (const el of elements) {
      const key = el.typeName || 'default';
      if (!map[key]) map[key] = { count: 0, area: 0, vol: 0, lin: 0, ids: [] };
      map[key].count++;
      map[key].area += el.area;
      map[key].vol += el.volume;
      map[key].lin += el.perimeter;
      map[key].ids.push(el.expressID);
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

  const updateCost = (typeName: string, cost: number) => {
    setCosts(prev => ({
      ...prev,
      [typeName]: { cost, unit: prev[typeName]?.unit ?? (DEFAULT_UNIT_COSTS[typeName]?.unit || 'm2') }
    }));
  };

  const updateUnit = (typeName: string, unit: 'm2' | 'm3' | 'ml' | 'u') => {
    setCosts(prev => ({
      ...prev,
      [typeName]: { cost: prev[typeName]?.cost ?? (DEFAULT_UNIT_COSTS[typeName]?.cost || 100000), unit }
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

  const exportCSV = () => {
    const rows = [['Rubro', 'Cantidad', 'Unidad', 'Costo Unitario (ARS)', 'Subtotal (ARS)']];
    categories.forEach(c => {
      rows.push([c.typeName, getQty(c).toFixed(2), UNIT_LABELS[c.costUnit], c.unitCost.toString(), c.subtotal.toFixed(0)]);
    });
    rows.push(['', '', '', 'Costo Directo', totalDirect.toFixed(0)]);
    rows.push(['', '', '', `Gastos Generales (${markupPct}%)`, totalMarkup.toFixed(0)]);
    rows.push(['', '', '', 'TOTAL', grandTotal.toFixed(0)]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'computo_metrico_bim.csv'; a.click();
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
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1"><Layers size={14} className="text-indigo-500" /> Elementos</div>
          <p className="text-2xl font-black text-indigo-600 font-mono">{elements.length}</p>
          <p className="text-[10px] text-gray-400">{categories.length} rubros detectados</p>
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
          <p className="text-xl font-black text-emerald-600 font-mono">${grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-gray-400">con {markupPct}% GG</p>
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
              <th className="px-4 py-3 text-right">Costo Unit. (ARS)</th>
              <th className="px-4 py-3 text-right">Subtotal (ARS)</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(cat => (
              <React.Fragment key={cat.typeName}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-800">{cat.typeName}</td>
                  <td className="px-4 py-3 text-center font-mono text-gray-600">{cat.count}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-gray-800">{getQty(cat).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <select value={cat.costUnit} onChange={e => updateUnit(cat.typeName, e.target.value as any)}
                      className="px-2 py-1 border rounded-lg text-xs font-bold text-gray-600 bg-white">
                      <option value="m2">m²</option>
                      <option value="m3">m³</option>
                      <option value="ml">ml</option>
                      <option value="u">unidad</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input type="number" value={cat.unitCost} onChange={e => updateCost(cat.typeName, Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded-lg text-xs text-right font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">${cat.subtotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
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
              <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-800">${totalDirect.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-sm font-bold text-gray-600">Gastos Generales ({markupPct}%)</td>
              <td className="px-4 py-2 text-right font-mono font-bold text-gray-500">${totalMarkup.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
              <td></td>
            </tr>
            <tr className="bg-indigo-50 border-t border-indigo-200">
              <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-indigo-800">PRESUPUESTO TOTAL</td>
              <td className="px-4 py-3 text-right font-mono font-black text-indigo-700 text-lg">${grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
