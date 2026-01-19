import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

// Combined store type
export type AppStore = AuthSlice & UISlice;

// Create store with persistence for auth
export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: 'kendeya-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist auth-related state
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // Persist UI preferences
        isSidebarCollapsed: state.isSidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Selector hooks for better performance
export const useAuth = () =>
  useStore((state) => ({
    user: state.user,
    token: state.token,
    refreshToken: state.refreshToken,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login: state.login,
    logout: state.logout,
    setLoading: state.setLoading,
    setError: state.setError,
    updateUser: state.updateUser,
  }));

export const useUI = () =>
  useStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    isSidebarCollapsed: state.isSidebarCollapsed,
    toggleSidebar: state.toggleSidebar,
    setSidebarOpen: state.setSidebarOpen,
    setSidebarCollapsed: state.setSidebarCollapsed,
    isGlobalLoading: state.isGlobalLoading,
    setGlobalLoading: state.setGlobalLoading,
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    setTheme: state.setTheme,
  }));

export const useAlerts = () =>
  useStore((state) => ({
    alerts: state.alerts,
    addAlert: state.addAlert,
    removeAlert: state.removeAlert,
    clearAlerts: state.clearAlerts,
  }));

// Export slices
export type { AuthSlice } from './slices/authSlice';
export type { UISlice } from './slices/uiSlice';
