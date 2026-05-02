import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import type { User, LoginCredentials, RegisterData } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', credentials);
          const { token, data: { user } } = data;

          Cookies.set('greenpulse_token', token, { expires: 7, secure: true, sameSite: 'strict' });
          localStorage.setItem('greenpulse_token', token);

          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (registerData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', registerData);
          const { token, data: { user } } = data;

          Cookies.set('greenpulse_token', token, { expires: 7, secure: true, sameSite: 'strict' });
          localStorage.setItem('greenpulse_token', token);

          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignore errors on logout
        } finally {
          Cookies.remove('greenpulse_token');
          localStorage.removeItem('greenpulse_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      getMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateProfile: async (profileData) => {
        const { data } = await api.put('/auth/update-profile', profileData);
        set({ user: data.data });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'greenpulse-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
