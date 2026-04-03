import { create } from 'zustand';
import { api } from '../utils/apiClient';

export const useAuthStore = create((set) => ({
  admin: null,    // { id, username, email, created_at }
  isLoading: true, // true while checking saved token on startup

  // Restore session from localStorage token on app load
  loadMe: async () => {
    const token = localStorage.getItem('zealflow_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const admin = await api.get('/api/auth/me');
      set({ admin, isLoading: false });
    } catch (_) {
      localStorage.removeItem('zealflow_token');
      set({ admin: null, isLoading: false });
    }
  },

  signup: async (username, email, password) => {
    await api.post('/api/auth/signup', { username, email, password });
  },

  login: async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('zealflow_token', data.token);
    set({ admin: data.admin });
    return data.admin;
  },

  logout: () => {
    localStorage.removeItem('zealflow_token');
    set({ admin: null });
  },
}));
