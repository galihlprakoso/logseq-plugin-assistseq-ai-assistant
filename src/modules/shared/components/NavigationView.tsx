import React, { useEffect } from "react"
import useNavigationStore from "../stores/useNavigationStore"
import { NavigationRoute } from "../types/navigation"
import MainScreen from "../../../screens/MainScreen"
import OnboardingScreen from "../../../screens/OnboardingScreen"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { AIProvider } from "../../logseq/types/settings"
import TermsAndConditionsScreen from "../../../screens/TermsAndConditionsScreen"
import useFlagsStore from "../stores/useFlagsStore"


// eslint-disable-next-line react/display-name, react/prop-types
const NavigationView: React.FC = () => {
  const { currentRoute, setRoute } = useNavigationStore()
  const {settings} = useSettingsStore()
  const { isAcceptedTermsAndConditions } = useFlagsStore()

  useEffect(() => {
    if (settings.provider === AIProvider.Gemini && settings.geminiApiKey) {
      setRoute(NavigationRoute.Main)
    } else if(!isAcceptedTermsAndConditions) {
      setRoute(NavigationRoute.TermsAndConditions)
    } else {
      setRoute(NavigationRoute.Onboarding)
    }
  }, [settings, setRoute, isAcceptedTermsAndConditions])

  switch(currentRoute) {
    case NavigationRoute.Main:
      return <MainScreen />
    case NavigationRoute.Onboarding:
      return <OnboardingScreen />
    case NavigationRoute.TermsAndConditions:
      return <TermsAndConditionsScreen />
    default:
      return null
  }  
}

export default NavigationView