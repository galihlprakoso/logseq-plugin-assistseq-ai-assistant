import React, { ReactNode, useMemo } from "react"
import { OpenAI } from 'openai'
import useSettingsStore from '../../logseq/stores/useSettingsStore'

type OpenAIContext = {
  openAI?: OpenAI
}

export const OpenAIProviderContext = React.createContext<OpenAIContext>({ openAI: undefined })

type Props = {
  children: ReactNode
}

const OpenAIContextProvider: React.FC<Props> = ({ children }) => {
  const { settings } = useSettingsStore()
  const openAI = useMemo(() => new OpenAI({apiKey: settings.openAiApiKey, dangerouslyAllowBrowser: true}), [settings])

  return (
    <OpenAIProviderContext.Provider value={{openAI}}>
      {children}
    </OpenAIProviderContext.Provider>
  )
}

export default OpenAIContextProvider