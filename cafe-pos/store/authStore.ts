import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isCashier: () => boolean;
  isWaiter: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      }),
      
      hasRole: (roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
      
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
      
      isCashier: () => {
        const { user } = get();
        return user?.role === 'cashier' || user?.role === 'admin';
      },
      
      isWaiter: () => {
        const { user } = get();
        return user?.role === 'waiter' || user?.role === 'cashier' || user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
