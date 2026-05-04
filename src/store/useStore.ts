import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleId } from '../lib/types';

type AppState = {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: 'bi',
      setActiveModule: (module) => set({ activeModule: module }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ecar-nav',
      partialize: (state) => ({ activeModule: state.activeModule }),
    }
  )
);
