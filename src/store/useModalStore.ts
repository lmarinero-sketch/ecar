import { create } from 'zustand';

type ModalType = 'alert' | 'confirm';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  resolvePromise: ((value: boolean) => void) | null;
  
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: string) => Promise<void>;
  
  confirm: () => void;
  cancel: () => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  resolvePromise: null,

  showConfirm: (title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        resolvePromise: resolve
      });
    });
  },

  showAlert: (title: string, message: string) => {
    return new Promise<void>((resolve) => {
      set({
        isOpen: true,
        type: 'alert',
        title,
        message,
        resolvePromise: () => resolve()
      });
    });
  },

  confirm: () => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(true);
    get().close();
  },

  cancel: () => {
    const { resolvePromise, type } = get();
    if (resolvePromise && type === 'confirm') resolvePromise(false);
    if (resolvePromise && type === 'alert') resolvePromise(true); // alerts just resolve
    get().close();
  },

  close: () => {
    set({ isOpen: false, resolvePromise: null });
  }
}));
