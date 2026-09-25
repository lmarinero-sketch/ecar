import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleId } from '../lib/types';

type AppState = {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  tutorialMode: boolean;
  setTutorialMode: (on: boolean) => void;
  seenFuelRequests: string[];
  markFuelRequestsSeen: (ids: string[]) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
};

const applyTheme = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: 'bi',
      setActiveModule: (module) => set({ activeModule: module }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      tutorialMode: false,
      setTutorialMode: (on) => set({ tutorialMode: on }),
      seenFuelRequests: [],
      markFuelRequestsSeen: (ids) => set((state) => ({ 
        seenFuelRequests: Array.from(new Set([...state.seenFuelRequests, ...ids])) 
      })),
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      darkMode: false,
      setDarkMode: (dark) => {
        applyTheme(dark);
        set({ darkMode: dark });
      },
      toggleDarkMode: () => {
        set((state) => {
          const next = !state.darkMode;
          applyTheme(next);
          return { darkMode: next };
        });
      },
    }),
    {
      name: 'ecar-nav',
      partialize: (state) => ({ 
        activeModule: state.activeModule, 
        seenFuelRequests: state.seenFuelRequests,
        activeProjectId: state.activeProjectId,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.darkMode);
        }
      },
    }
  )
);

// Check initial theme from localStorage immediately on script evaluation
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('ecar-nav');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  } catch (_e) {
    // Ignore error
  }
}
