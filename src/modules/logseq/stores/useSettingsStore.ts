import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { AIProvider, LogSeqSettings } from '../types/settings'
import { GeminiAIModelEnum } from '../../gemini/types/models'
import { OpenAIModelEnum } from '../../openai/types/models'

interface SettingState {
  settings: LogSeqSettings
  setSettings: (settings: LogSeqSettings) => void
}

const useSettingsStore = create<SettingState>()(
  devtools(
    persist(
      (set) => ({
        settings: {
          geminiApiKey: '',
          geminiModel: GeminiAIModelEnum.Gemini1_5Flash,
          openAiApiKey: '',
          openAiModel: OpenAIModelEnum.GPT3_5Turbo,
          provider: AIProvider.Gemini,
          blacklistedPages: 'a,b,c,todo,card,done,later,doing',
          blacklistedKeywords: 'pass,api key,confidential,password',
          maxRecursionDepth: 5,
          includeDatePage: false,
        },
        setSettings: (settings: LogSeqSettings) => set(() => ({ settings })),
      }),
      {
        name: 'settings-store',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
)

export default useSettingsStore