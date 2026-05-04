import React, { useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';

type Props = { src: string; alt?: string; onClose: () => void };

export const ImageViewer: React.FC<Props> = ({ src, alt = 'Imagen', onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 5));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.25));
  const rotate = () => setRotation(r => (r + 90) % 360);
  const reset = () => { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(s + (e.deltaY > 0 ? -0.15 : 0.15), 0.25), 5));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handleMouseUp = () => setDragging(false);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <span className="text-white/70 text-sm font-medium truncate max-w-xs">{alt}</span>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Alejar">
            <ZoomOut size={18} />
          </button>
          <span className="text-white/60 text-xs font-mono w-14 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Acercar">
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button onClick={rotate} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Rotar">
            <RotateCw size={18} />
          </button>
          <button onClick={reset} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Restablecer">
            <Maximize2 size={18} />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <a href={src} download target="_blank" rel="noopener" className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Descargar">
            <Download size={18} />
          </a>
          <button onClick={onClose} className="p-2 ml-2 text-white/70 hover:text-white hover:bg-red-500/30 rounded-lg transition-colors" title="Cerrar">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center select-none"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-none transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      {/* Hint */}
      <div className="text-center py-2 text-white/30 text-xs">Scroll para zoom · Arrastrá para mover · ESC para cerrar</div>
    </div>
  );
};
