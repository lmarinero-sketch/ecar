import React from 'react';
import type { WarehouseShelf, InventoryItem } from '../../lib/types';
import { Package } from 'lucide-react';

interface Props {
  shelf: WarehouseShelf;
  items: InventoryItem[];
}

export const ShelfFrontView: React.FC<Props> = ({ shelf, items }) => {
  // Generate rows and columns
  const rows = Array.from({ length: shelf.rows_count || 1 }, (_, i) => shelf.rows_count - i); // top to bottom (N4, N3, N2, N1)
  const cols = Array.from({ length: shelf.columns_count || 1 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner flex-1 flex flex-col justify-between"
           style={{ borderLeft: `8px solid ${shelf.color}` }}>
        
        {rows.map((row) => (
          <div key={`row-${row}`} className="flex border-b-4 border-slate-300 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0 gap-2">
            
            {/* Row Label */}
            <div className="w-8 flex flex-col justify-center items-center font-bold text-slate-400 text-xs">
              N{row}
            </div>

            {/* Bins in this row */}
            <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${shelf.columns_count}, minmax(0, 1fr))` }}>
              {cols.map((col) => {
                const positionCode = `N${row}-C${col}`;
                // Also support just bin numbers if we extract them from excel, but for now we map visually
                // We will match items where shelf_position starts with N{row} or exactly matches
                // We will match items where shelf_position starts with N{row} or exactly matches
                // For a more exact match to the Excel "Bin 46", we might just list items in the row.
                
                // Let's filter items strictly for this N-C if we have a strict mapping, 
                // but since Excel has "Bin 46", maybe we just show the items assigned to this Level.
                // To avoid complexity, we'll just show items for this column if we can parse it, 
                // or distribute items across columns. Let's just do a simple filter.
                
                const itemsInThisCell = items.filter(i => {
                  if (!i.shelf_position) return false;
                  // If position is N2-C1
                  if (i.shelf_position === positionCode) return true;
                  
                  // Fallback: If it's just N2-B46, we might just put it in the first column for visualization 
                  // if we don't have enough columns.
                  const isLevelMatch = i.shelf_position.startsWith(`N${row}-`);
                  if (isLevelMatch && col === 1 && !i.shelf_position.includes('-C')) return true; 
                  return false;
                });

                return (
                  <div key={positionCode} className="bg-slate-100 rounded-md border border-slate-200 min-h-[60px] p-2 flex flex-col gap-1 relative overflow-hidden group">
                    <span className="text-[9px] text-slate-400 absolute top-1 right-1 font-mono">{positionCode}</span>
                    
                    {itemsInThisCell.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-slate-300">
                        <Package size={16} strokeWidth={1.5} />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-1 mt-3">
                        {itemsInThisCell.map(item => (
                          <div 
                            key={item.id}
                            className="bg-white text-[10px] font-medium text-slate-700 px-1.5 py-1 rounded shadow-sm truncate border-l-2"
                            style={{ borderLeftColor: item.current_stock <= item.min_stock ? '#EF4444' : '#10B981' }}
                            title={`${item.name} (${item.current_stock} ${item.unit})`}
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        ))}

      </div>

      {/* Summary / Legend */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex gap-4 justify-center text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Stock Normal
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div> Stock Bajo
        </div>
      </div>
    </div>
  );
};
