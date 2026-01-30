import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Modales
  modals: {
    payment: boolean;
    modifiers: boolean;
    ticket: boolean;
    closeSession: boolean;
  };
  openModal: (name: keyof UIState['modals']) => void;
  closeModal: (name: keyof UIState['modals']) => void;
  
  // Notificaciones
  toasts: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Loading states
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Modales
  modals: {
    payment: false,
    modifiers: false,
    ticket: false,
    closeSession: false,
  },
  openModal: (name) => set((state) => ({
    modals: { ...state.modals, [name]: true }
  })),
  closeModal: (name) => set((state) => ({
    modals: { ...state.modals, [name]: false }
  })),
  
  // Notificaciones
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
  
  // Loading states
  loadingStates: {},
  setLoading: (key, loading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading }
  })),
  isLoading: (key) => !!get().loadingStates[key],
}));
