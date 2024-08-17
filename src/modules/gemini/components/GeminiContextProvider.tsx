import React, { ReactNode, useMemo } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import useSettingsStore from '../../shared/stores/useSettingsStore'

type GeminiContext = {
  gemini?: GoogleGenerativeAI
}

export const GeminiProviderContext = React.createContext<GeminiContext>({ gemini: undefined })

type Props = {
  children: ReactNode
}

const GeminiContextProvider: React.FC<Props> = ({ children }) => {
  const { settings } = useSettingsStore()
  const gemini = useMemo(() => new GoogleGenerativeAI(settings.geminiApiKey), [settings])

  return (
    <GeminiProviderContext.Provider value={{gemini}}>
      {children}
    </GeminiProviderContext.Provider>
  )
}

export default GeminiContextProvider