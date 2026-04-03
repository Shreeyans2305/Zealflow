import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      userRole: null, // 'admin' | 'user' | null
      loginAs: (role) => set({ userRole: role }),
      logout: () => set({ userRole: null }),
    }),
    {
      name: 'zealflow-auth-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    }
  )
);
