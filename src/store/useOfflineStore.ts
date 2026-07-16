import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VehicleDailyReport } from '../lib/types';

export type OfflineReport = Omit<VehicleDailyReport, 'id' | 'created_at' | 'updated_at' | 'vehicle' | 'project'> & {
  offline_id: string;
  saved_at: string;
};

interface OfflineState {
  dailyReportsQueue: OfflineReport[];
  addDailyReport: (report: OfflineReport) => void;
  removeDailyReport: (offlineId: string) => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      dailyReportsQueue: [],
      addDailyReport: (report) =>
        set((state) => ({
          dailyReportsQueue: [...state.dailyReportsQueue, report],
        })),
      removeDailyReport: (offlineId) =>
        set((state) => ({
          dailyReportsQueue: state.dailyReportsQueue.filter((r) => r.offline_id !== offlineId),
        })),
      clearQueue: () => set({ dailyReportsQueue: [] }),
    }),
    {
      name: 'ecar-offline-storage', // name of the item in the storage (must be unique)
    }
  )
);
