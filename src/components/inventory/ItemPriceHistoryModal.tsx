import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, Building2, Search, Minus } from 'lucide-react';
import { useItemPriceHistory, useAllPriceHistories } from '../../hooks/useData';
import type { InventoryItem } from '../../lib/types';

const fmt = (n: number | null | undefined) =>
  `$${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  item?: InventoryItem | null;
  onClose: () => void;
}

export const ItemPriceHistoryModal: React.FC<Props> = ({ item, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // If item is passed, fetch for that specific item. Otherwise fetch all price history records.
  const { data: itemHistory = [], isLoading: loadingItem } = useItemPriceHistory(item?.id);
  const { data: allHistory = [], isLoading: loadingAll } = useAllPriceHistories();

  const history = item ? itemHistory : allHistory;
  const isLoading = item ? loadingItem : loadingAll;

  const filteredHistory = history.filter(h => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const prov = (h.supplier_name || h.supplier?.name || '').toLowerCase();
    const inv = (h.invoice_number || '').toLowerCase();
    const itmName = (h.item?.name || '').toLowerCase();
    const itmCode = (h.item?.item_code || h.item?.barcode || '').toLowerCase();
    return prov.includes(term) || inv.includes(term) || itmName.includes(term) || itmCode.includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-ecar-blueDark via-blue-900 to-ecar-blue p-6 text-white flex justify-between items-start relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 p-4">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <DollarSign size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">
                {item ? `Historial de Precios: ${item.name}` : 'Historial Global de Precios y Modificaciones'}
              </h2>
            </div>
            <p className="text-xs text-blue-200">
              {item 
                ? `Código: ${item.item_code || item.barcode || 'S/C'} • Costo Actual: ${fmt(item.unit_cost)}` 
                : 'Trazabilidad completa de variaciones de costos registrados por comprobante de compra.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={item ? "Buscar por proveedor o n° comprobante..." : "Buscar por producto, código, proveedor o comprobante..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500 shrink-0">
            {filteredHistory.length} registro(s)
          </div>
        </div>

        {/* Table content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ecar-blue mb-2" />
              <p className="text-sm">Cargando historial de precios...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText size={40} className="mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="font-semibold text-slate-600">No hay registros de precios aún</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Los registros se generan automáticamente cada vez que cargas una factura de compra con nuevos precios.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Fecha</th>
                    {!item && <th className="py-3 px-3">Producto</th>}
                    <th className="py-3 px-3">Comprobante</th>
                    <th className="py-3 px-3">Proveedor</th>
                    <th className="py-3 px-3 text-right">Precio Anterior</th>
                    <th className="py-3 px-3 text-right">Precio Factura</th>
                    <th className="py-3 px-3 text-right">Diferencia ($)</th>
                    <th className="py-3 px-3 text-right">Variación (%)</th>
                    <th className="py-3 px-3 text-center">Registrado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.map((h) => {
                    const diffArs = Number(h.price_diff_ars) || 0;
                    const diffPct = Number(h.price_diff_pct) || 0;
                    const isIncrease = diffArs > 0.01;
                    const isDecrease = diffArs < -0.01;
                    const isNeutral = !isIncrease && !isDecrease;

                    const dateStr = h.created_at ? new Date(h.created_at).toLocaleDateString('es-AR') : '—';

                    return (
                      <tr key={h.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                        </td>
                        {!item && (
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            <div>{h.item?.name || 'Producto'}</div>
                            {h.item?.item_code && (
                              <div className="text-[10px] font-mono text-slate-400">Cód: {h.item.item_code}</div>
                            )}
                          </td>
                        )}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {h.invoice_type || 'FC'} {h.invoice_number || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          <div className="flex items-center gap-1.5 max-w-[160px] truncate" title={h.supplier_name || h.supplier?.name || ''}>
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{h.supplier_name || h.supplier?.name || 'Proveedor'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {fmt(h.old_price)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {fmt(h.new_price)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {isIncrease && (
                            <span className="text-rose-600 inline-flex items-center gap-0.5 justify-end">
                              <TrendingUp size={12} />
                              +{fmt(diffArs)}
                            </span>
                          )}
                          {isDecrease && (
                            <span className="text-emerald-600 inline-flex items-center gap-0.5 justify-end">
                              <TrendingDown size={12} />
                              -{fmt(Math.abs(diffArs))}
                            </span>
                          )}
                          {isNeutral && (
                            <span className="text-slate-400 inline-flex items-center gap-0.5 justify-end">
                              <Minus size={12} />
                              $0,00
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {isIncrease && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                              +{diffPct.toFixed(1)}%
                            </span>
                          )}
                          {isDecrease && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {diffPct.toFixed(1)}%
                            </span>
                          )}
                          {isNeutral && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500">
                              0.0%
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[10px] text-slate-400">
                          {h.created_by || 'Compras'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex justify-between items-center text-xs text-slate-500">
          <div>
            💡 <span className="italic">El sistema registra automáticamente la evolución de precios cada vez que se emite o recepciona una factura de compra.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
