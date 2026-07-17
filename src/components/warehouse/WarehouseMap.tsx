import React, { useState } from 'react';
import type { WarehouseShelf, InventoryItem } from '../../lib/types';
import { Settings2, X, Plus, PackageOpen } from 'lucide-react';
import { ShelfFrontView } from './ShelfFrontView';

interface Props {
  shelves: WarehouseShelf[];
  items: InventoryItem[];
  onAddShelf: () => void;
  onEditShelf: (shelf: WarehouseShelf) => void;
}

const SHELF_TYPES = {
  rack: { label: 'Rack / Estantería', icon: '🗄️' },
  pallet: { label: 'Zona Pallets', icon: '📦' },
  cabinet: { label: 'Gabinete / Armario', icon: '🔒' },
  floor: { label: 'Piso Abierto', icon: '⬜' },
  wall: { label: 'Pared / Perchero', icon: '🪝' },
};

export const WarehouseMap: React.FC<Props> = ({ shelves, items, onAddShelf, onEditShelf }) => {
  const [selectedShelf, setSelectedShelf] = useState<WarehouseShelf | null>(null);

  // We'll create a 10x10 CSS Grid
  const GRID_SIZE = 10;

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* MAP VIEW */}
      <div className={`flex-1 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden transition-all duration-300 flex flex-col`}>
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center z-10">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PackageOpen size={18} className="text-ecar-blue" />
              Mapa 2D del Pañol
            </h3>
            <p className="text-xs text-slate-500">Haz clic en una estantería para ver su contenido frontal</p>
          </div>
          <button
            onClick={onAddShelf}
            className="btn-primary text-xs flex items-center gap-1"
          >
            <Plus size={14} /> Nueva Estantería
          </button>
        </div>

        {/* Grid Container */}
        <div className="flex-1 p-6 overflow-auto">
          <div 
            className="min-w-[800px] min-h-[600px] h-full w-full bg-white border-2 border-slate-200 rounded-lg relative"
            style={{
              backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)',
              backgroundSize: '10% 10%'
            }}
          >
            {/* Render Shelves */}
            {shelves.map((shelf) => {
              const leftPercent = (shelf.grid_col / GRID_SIZE) * 100;
              const topPercent = (shelf.grid_row / GRID_SIZE) * 100;
              const widthPercent = (shelf.grid_width / GRID_SIZE) * 100;
              const heightPercent = (shelf.grid_height / GRID_SIZE) * 100;

              const isSelected = selectedShelf?.id === shelf.id;

              return (
                <div
                  key={shelf.id}
                  onClick={() => setSelectedShelf(shelf)}
                  className={`absolute rounded shadow-sm border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-center items-center text-center p-2
                    ${isSelected ? 'ring-4 ring-ecar-blue/30 z-20' : 'z-10 hover:shadow-md'}`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `calc(${widthPercent}% - 4px)`,
                    height: `calc(${heightPercent}% - 4px)`,
                    backgroundColor: `${shelf.color}20`, // 20% opacity
                    borderColor: shelf.color,
                  }}
                >
                  <span className="text-2xl mb-1">{SHELF_TYPES[shelf.shelf_type as keyof typeof SHELF_TYPES]?.icon}</span>
                  <div className="font-bold text-sm text-slate-800 line-clamp-1">{shelf.code}</div>
                  <div className="text-[10px] text-slate-600 font-medium">{shelf.name}</div>
                  
                  {/* Badges for items */}
                  <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                    {items.filter(i => i.shelf_id === shelf.id).length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* INSPECTOR PANEL (FRONT VIEW) */}
      {selectedShelf && (
        <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col animate-in slide-in-from-right-8">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: selectedShelf.color }} 
              />
              <div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">
                  {selectedShelf.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedShelf.code} • {SHELF_TYPES[selectedShelf.shelf_type as keyof typeof SHELF_TYPES]?.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => onEditShelf(selectedShelf)}
                className="p-1.5 text-slate-400 hover:text-ecar-blue hover:bg-blue-50 rounded transition-colors"
                title="Editar configuración"
              >
                <Settings2 size={16} />
              </button>
              <button 
                onClick={() => setSelectedShelf(null)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
            <ShelfFrontView 
              shelf={selectedShelf} 
              items={items.filter(i => i.shelf_id === selectedShelf.id)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
