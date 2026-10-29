import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  maxWidth?: string; // ej: 'max-w-md', 'max-w-lg', 'max-w-2xl', 'max-w-4xl'
  className?: string;
  closeOnBackdrop?: boolean;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  closeOnBackdrop = true
}) => {
  const mouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !onClose || !closeOnBackdrop) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
          (document.activeElement as HTMLElement)?.blur();
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnBackdrop]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      onMouseDown={e => {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={e => {
        if (closeOnBackdrop && onClose && e.target === e.currentTarget && mouseDownOnBackdrop.current) {
          onClose();
        }
        mouseDownOnBackdrop.current = false;
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} border border-slate-100 animate-scale-in my-auto max-h-[92vh] flex flex-col overflow-hidden ${className}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={e => {
          mouseDownOnBackdrop.current = false;
          e.stopPropagation();
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
