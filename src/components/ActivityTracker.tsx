import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCreateAuditLog } from '../hooks/useData';
import { useAppStore } from '../store/useStore';

export const ActivityTracker: React.FC = () => {
  const { user } = useAuth();
  const activeModule = useAppStore(state => state.activeModule);
  const createLog = useCreateAuditLog();
  
  const currentModule = useRef<string>(activeModule);
  const entryTime = useRef<number>(Date.now());

  // Track Time Spent per Module
  useEffect(() => {
    if (!user) return;

    const previousModule = currentModule.current;
    const now = Date.now();
    const durationSeconds = Math.floor((now - entryTime.current) / 1000);

    // Only log if they spent at least 3 seconds on the previous module (avoids quick clicking noise)
    if (durationSeconds >= 3 && previousModule !== activeModule) {
      createLog.mutate({
        user_id: user.id,
        user_name: user?.user_metadata?.full_name || user.email || 'Desconocido',
        action_type: 'time_spent',
        module: previousModule,
        duration_seconds: durationSeconds,
        details: { path: previousModule }
      });
    }

    currentModule.current = activeModule;
    entryTime.current = now;
  }, [activeModule, user]);

  // Track Global Clicks (Delegated)
  useEffect(() => {
    if (!user) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find closest button or a tag
      const clickable = target.closest('button, a, select, input[type="submit"]');
      if (clickable) {
        let text = clickable.textContent?.trim() || '';
        // Fallback to title or value if no text
        if (!text) text = clickable.getAttribute('title') || (clickable as HTMLInputElement).value || '';
        if (text.length > 50) text = text.substring(0, 50) + '...';
        
        createLog.mutate({
          user_id: user.id,
          user_name: user?.user_metadata?.full_name || user.email || 'Desconocido',
          action_type: 'click',
          module: activeModule,
          duration_seconds: 0,
          details: { 
            element: clickable.tagName.toLowerCase(),
            text: text,
            classes: clickable.className
          }
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [user, activeModule]);

  return null; // Invisible component
};
