import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { AIProvider, LogSeqSettings } from '../types/settings'
import { GeminiAIModelEnum, OllamaEmbeddingModelEnum, OllamaModelEnum, OpenAIModelEnum } from '../types/models'

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
          includeVisualization: true,
          embeddingProvider: AIProvider.Gemini,
          ollamaEndpoint: 'http://localhost:11434/',
          ollamaModel: OllamaModelEnum.llama3_1,
          ollamaEmbeddingModel: OllamaEmbeddingModelEnum.mxbai_embed_large,
          includeTavilySearch: true,
          tavilyAPIKey: '',
        },
        setSettings: (settings: LogSeqSettings) => set(() => ({ settings })),
      }),
      {
        name: 'settings-store',
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
)

export default useSettingsStore