import { create } from 'zustand';

export interface ImplementationState {
  checked: Record<string, boolean>;
  notes: Record<string, string>;
  completionDates: Record<string, string>;
  initializeState: (
    checked: Record<string, boolean>,
    notes: Record<string, string>,
    completionDates?: Record<string, string>
  ) => void;
  toggleCheck: (id: string) => void;
  completeItem: (id: string) => void;
  setNote: (id: string, note: string) => void;
  resetAll: () => void;
}

const getFormattedNow = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} hs`;
  return `${dateStr} ${timeStr}`;
};

export const useImplementationStore = create<ImplementationState>((set) => ({
  checked: {},
  notes: {},
  completionDates: {},

  initializeState: (checked, notes, completionDates) =>
    set({
      checked: checked || {},
      notes: notes || {},
      completionDates: completionDates || {},
    }),

  toggleCheck: (id) =>
    set((state) => {
      const isChecking = !state.checked[id];
      const newChecked = { ...state.checked, [id]: isChecking };
      const newDates = { ...state.completionDates };
      if (isChecking) {
        newDates[id] = getFormattedNow();
      } else {
        delete newDates[id];
      }
      return { checked: newChecked, completionDates: newDates };
    }),

  completeItem: (id) =>
    set((state) => {
      if (state.checked[id]) return {}; // Already checked, do nothing
      return {
        checked: { ...state.checked, [id]: true },
        completionDates: { ...state.completionDates, [id]: getFormattedNow() },
      };
    }),

  setNote: (id, note) =>
    set((state) => ({
      notes: { ...state.notes, [id]: note },
    })),

  resetAll: () =>
    set({
      checked: {},
      notes: {},
      completionDates: {},
    }),
}));
