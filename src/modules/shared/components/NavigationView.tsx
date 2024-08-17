import React, { useEffect } from "react"
import useNavigationStore from "../stores/useNavigationStore"
import { NavigationRoute } from "../types/navigation"
import MainScreen from "../../../screens/MainScreen"
import OnboardingScreen from "../../../screens/OnboardingScreen"
import useSettingsStore from "../stores/useSettingsStore"


// eslint-disable-next-line react/display-name, react/prop-types
const NavigationView: React.FC = () => {
  const { currentRoute, setRoute } = useNavigationStore()
  const {settings} = useSettingsStore()

  useEffect(() => {
    if (settings.geminiApiKey) {
      setRoute(NavigationRoute.Main)
    } else {
      setRoute(NavigationRoute.Onboarding)
    }
  }, [settings, setRoute])

  switch(currentRoute) {
    case NavigationRoute.Main:
      return <MainScreen />
    case NavigationRoute.Onboarding:
      return <OnboardingScreen />
    default:
      return null
  }  
}

export default NavigationView