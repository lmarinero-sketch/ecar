import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  completedModules: string[];
  activeTourModule: string | null;
  markTourCompleted: (moduleId: string) => void;
  resetTour: (moduleId: string) => void;
  startTour: (moduleId: string) => void;
  stopTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completedModules: [],
      activeTourModule: null,

      markTourCompleted: (moduleId) =>
        set((state) => ({
          completedModules: state.completedModules.includes(moduleId)
            ? state.completedModules
            : [...state.completedModules, moduleId],
          activeTourModule: null,
        })),

      resetTour: (moduleId) =>
        set((state) => ({
          completedModules: state.completedModules.filter((id) => id !== moduleId),
        })),

      startTour: (moduleId) => set({ activeTourModule: moduleId }),
      
      stopTour: () => set({ activeTourModule: null }),
    }),
    {
      name: 'ecar-onboarding-storage',
    }
  )
);
