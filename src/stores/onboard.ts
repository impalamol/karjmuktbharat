import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LoanDetails, ProfileDetails, BankDetailsPublic } from '@/lib/validation'

/**
 * Onboarding draft. Saved to localStorage so a reload never loses progress, but
 * SENSITIVE fields (Aadhaar, loan account number) are never persisted: they are
 * kept in memory and re-asked if the tab is closed.
 */
interface Sensitive {
  aadhaar?: string
  loanAccount?: string
  loanAccountConfirm?: string
}

interface OnboardState {
  step: number
  profile: Partial<Omit<ProfileDetails, 'aadhaar'>>
  loan: Partial<LoanDetails>
  bank: Partial<BankDetailsPublic>
  sensitive: Sensitive
  savedAt: number | null
  setStep: (n: number) => void
  saveProfile: (p: ProfileDetails) => void
  saveLoan: (l: LoanDetails) => void
  saveBank: (b: BankDetailsPublic & { loanAccount: string; loanAccountConfirm: string }) => void
  reset: () => void
}

const initial = { step: 0, profile: {}, loan: {}, bank: {}, sensitive: {}, savedAt: null }

export const useOnboardStore = create<OnboardState>()(
  persist(
    (set) => ({
      ...initial,
      setStep: (step) => set({ step, savedAt: Date.now() }),
      saveProfile: ({ aadhaar, ...rest }) =>
        set((s) => ({ profile: rest, sensitive: { ...s.sensitive, aadhaar }, savedAt: Date.now() })),
      saveLoan: (loan) => set({ loan, savedAt: Date.now() }),
      saveBank: ({ loanAccount, loanAccountConfirm, ...rest }) =>
        set((s) => ({ bank: rest, sensitive: { ...s.sensitive, loanAccount, loanAccountConfirm }, savedAt: Date.now() })),
      reset: () => set(initial),
    }),
    {
      name: 'kmb-onboard-draft',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ step, profile, loan, bank, savedAt }) => ({ step, profile, loan, bank, savedAt }),
    },
  ),
)
