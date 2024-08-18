import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface SettingState {
  currentPage: string
  setCurrentPage: (currentPage: string) => void
}

const useCurrentPageStore = create<SettingState>()(
  devtools(
    (set) => ({
      currentPage: '',
      setCurrentPage: (currentPage: string) => set(() => ({ currentPage })),
    }),
  ),
)

export default useCurrentPageStore