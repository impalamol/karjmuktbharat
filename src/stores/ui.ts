import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

interface UiState {
  theme: Theme
  sidebarCollapsed: boolean
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
}

/** Applies the theme class to <html>. public/theme-init.js does the same before first paint. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#F8FAFC')
}

/** UI preferences only. Nothing sensitive is persisted. Dark is the default (CRED-style). */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'kmb-ui', version: 2, storage: createJSONStorage(() => localStorage), partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) },
  ),
)
