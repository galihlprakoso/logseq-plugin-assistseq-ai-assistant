import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { AIProvider, LogSeqSettings } from '../types/settings'
import { ChatGroqModelEnum, ClaudeModelEnum, GeminiAIModelEnum, MistralModelEnum, OllamaEmbeddingModelEnum, OllamaModelEnum, OpenAIModelEnum, OpenRouterModelEnum } from '../types/models'

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
          geminiModel: GeminiAIModelEnum.Gemini25Flash,
          openAiApiKey: '',
          openAiModel: OpenAIModelEnum.GPT3_5Turbo,
          openAIBasePath: 'https://api.openai.com/v1/',
          provider: AIProvider.Gemini,
          blacklistedPages: 'a,b,c,todo,card,done,later,doing',
          blacklistedKeywords: 'pass,api key,confidential,password',
          maxRecursionDepth: 5,
          includeDatePage: false,
          includePageReferences: true,
          customSystemPrompt: '',
          keyboardShortcut: 'mod+shift+a',
          includeVisualization: true,
          embeddingProvider: AIProvider.Gemini,
          ollamaEndpoint: 'http://localhost:11434/',
          ollamaModel: OllamaModelEnum.llama3_3,
          ollamaEmbeddingModel: OllamaEmbeddingModelEnum.mxbai_embed_large,
          includeTavilySearch: true,
          tavilyAPIKey: '',
          chatGroqAPIKey: '',
          chatGroqModel: ChatGroqModelEnum.llama_3_3_70b_versatile,
          maxEmbeddedDocuments: 10,
          includeURLScrapper: false,
          openRouterAPIKey: '',
          openRouterModel: OpenRouterModelEnum.AnthropicClaudeSonnet,
          openRouterEmbeddingModel: OpenRouterModelEnum.GoogleGeminiEmbedding001,
          claudeAPIKey: '',
          claudeModel: ClaudeModelEnum.Claude35Sonnet20241022,
          mistralAPIKey: '',
          mistralModel: MistralModelEnum.MistralLarge,
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