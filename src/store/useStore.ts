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
    }),
    {
      name: 'ecar-nav',
      partialize: (state) => ({ activeModule: state.activeModule, seenFuelRequests: state.seenFuelRequests }),
    }
  )
);
