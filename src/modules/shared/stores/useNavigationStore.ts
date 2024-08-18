import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { NavigationRoute } from '../types/navigation'

interface NavigationState {
  currentRoute: NavigationRoute
  setRoute: (route: NavigationRoute) => void
}

const useNavigationStore = create<NavigationState>()(
  devtools(
    persist(
      (set) => ({
        currentRoute: NavigationRoute.Onboarding,
        setRoute: (route: NavigationRoute) => set(() => ({ currentRoute: route })),
      }),
      {
        name: 'navigation-store',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
)

export default useNavigationStore