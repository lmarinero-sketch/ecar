import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCreateAuditLog } from '../hooks/useData';
import { useAppStore } from '../store/useStore';

const getSessionId = () => {
  try {
    const existing = sessionStorage.getItem('ecar_activity_session_id');
    if (existing) return existing;
    const created =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('ecar_activity_session_id', created);
    return created;
  } catch {
    return `sess-${Date.now()}`;
  }
};

export const ActivityTracker: React.FC = () => {
  const { user, profile } = useAuth();
  const activeModule = useAppStore(state => state.activeModule);
  const createLog = useCreateAuditLog();

  const currentModule = useRef<string>(activeModule);
  const currentSubView = useRef<string>('');
  const entryTime = useRef<number>(Date.now());
  const lastBeatTime = useRef<number>(Date.now());
  const lastMeasuredResourceCount = useRef<number>(0);
  const sessionId = useRef<string>(getSessionId());

  const getUserName = () =>
    profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Desconocido';

  // Medir delta de bytes transferidos desde el último envío usando PerformanceResourceTiming
  const consumeBandwidthDelta = (): number => {
    try {
      if (typeof performance === 'undefined' || !performance.getEntriesByType) return 0;
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      if (entries.length <= lastMeasuredResourceCount.current) return 0;
      const newEntries = entries.slice(lastMeasuredResourceCount.current);
      lastMeasuredResourceCount.current = entries.length;
      return newEntries.reduce((sum, entry) => {
        const bytes = entry.transferSize || entry.encodedBodySize || 0;
        return sum + bytes;
      }, 0);
    } catch {
      return 0;
    }
  };

  // Escuchar sub-vistas emitidas por módulos (ej. Flota -> Taller, Pañol -> Herramientas)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ label?: string | null }>;
      currentSubView.current = custom.detail?.label || '';
    };
    window.addEventListener('ecar-subview-change', handler);
    return () => window.removeEventListener('ecar-subview-change', handler);
  }, []);

  // Registrar permanencia al cambiar de módulo
  useEffect(() => {
    if (!user) return;

    const previousModule = currentModule.current;
    const now = Date.now();
    const durationSeconds = Math.floor((now - entryTime.current) / 1000);

    if (durationSeconds >= 3 && previousModule !== activeModule) {
      const bwBytes = consumeBandwidthDelta();
      createLog.mutate({
        user_id: user.id,
        user_name: getUserName(),
        action_type: 'time_spent',
        module: previousModule,
        duration_seconds: durationSeconds,
        details: {
          path: previousModule,
          subview: currentSubView.current || undefined,
          session_id: sessionId.current,
          bandwidth_bytes: bwBytes,
        },
      });
    }

    currentModule.current = activeModule;
    entryTime.current = now;
    lastBeatTime.current = now;
  }, [activeModule, user]);

  // Heartbeat en vivo cada 45s para saber quién está viendo qué en tiempo real y medir ancho de banda
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = (reason: 'interval' | 'initial' | 'visibility') => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible' && reason === 'interval') {
        return;
      }
      const now = Date.now();
      const deltaSeconds = Math.max(0, Math.floor((now - lastBeatTime.current) / 1000));
      lastBeatTime.current = now;
      const bwBytes = consumeBandwidthDelta();

      createLog.mutate({
        user_id: user.id,
        user_name: getUserName(),
        action_type: 'heartbeat',
        module: currentModule.current,
        duration_seconds: reason === 'initial' ? 0 : Math.min(deltaSeconds, 120),
        details: {
          session_id: sessionId.current,
          subview: currentSubView.current || undefined,
          bandwidth_bytes: bwBytes,
          viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
          url: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
          reason,
        },
      });
    };

    // Primer latido al iniciar sesión o recargar
    const initTimer = setTimeout(() => sendHeartbeat('initial'), 1500);
    const interval = setInterval(() => sendHeartbeat('interval'), 45000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const now = Date.now();
        const durationSeconds = Math.floor((now - entryTime.current) / 1000);
        if (durationSeconds >= 5) {
          const bwBytes = consumeBandwidthDelta();
          createLog.mutate({
            user_id: user.id,
            user_name: getUserName(),
            action_type: 'time_spent',
            module: currentModule.current,
            duration_seconds: durationSeconds,
            details: {
              path: currentModule.current,
              subview: currentSubView.current || undefined,
              session_id: sessionId.current,
              bandwidth_bytes: bwBytes,
              reason: 'tab_hidden',
            },
          });
          entryTime.current = now;
        }
      } else {
        entryTime.current = Date.now();
        lastBeatTime.current = Date.now();
        sendHeartbeat('visibility');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user]);

  // Track Global Clicks (Delegated)
  useEffect(() => {
    if (!user) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, select, input[type="submit"]');
      if (clickable) {
        let text = clickable.textContent?.trim() || '';
        if (!text) text = clickable.getAttribute('title') || (clickable as HTMLInputElement).value || '';
        if (text.length > 60) text = text.substring(0, 60) + '...';

        createLog.mutate({
          user_id: user.id,
          user_name: getUserName(),
          action_type: 'click',
          module: activeModule,
          duration_seconds: 0,
          details: {
            element: clickable.tagName.toLowerCase(),
            text,
            subview: currentSubView.current || undefined,
            session_id: sessionId.current,
          },
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [user, activeModule]);

  return null;
};
