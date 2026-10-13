import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Lang = 'en' | 'mr'

interface UiState {
  lang: Lang
  sidebarCollapsed: boolean
  setLang: (l: Lang) => void
  toggleLang: () => void
  toggleSidebar: () => void
}

/** UI preferences only. Nothing sensitive is persisted. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      lang: 'en',
      sidebarCollapsed: false,
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'mr' : 'en' })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'kmb-ui', storage: createJSONStorage(() => localStorage) },
  ),
)
