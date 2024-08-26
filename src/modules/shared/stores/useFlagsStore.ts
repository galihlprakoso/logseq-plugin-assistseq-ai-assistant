import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

interface FlagsState {
  isAcceptedTermsAndConditions: boolean
  acceptTermsAndConditions: () => void
}

const useFlagsStore = create<FlagsState>()(
  devtools(
    persist(
      (set) => ({
        isAcceptedTermsAndConditions: false,
        acceptTermsAndConditions: () => set(() => ({ isAcceptedTermsAndConditions: true })),
      }),
      {
        name: 'flags-store',
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
)

export default useFlagsStore