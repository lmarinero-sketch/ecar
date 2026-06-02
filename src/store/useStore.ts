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
    }),
    {
      name: 'ecar-nav',
      partialize: (state) => ({ activeModule: state.activeModule }),
    }
  )
);
