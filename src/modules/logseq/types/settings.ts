import { ChatGroqModelEnum, ClaudeModelEnum, GeminiAIModelEnum, MistralModelEnum, OpenAIModelEnum, OpenRouterModelEnum } from "./models"

export enum AIProvider {
  OpenAI = 'OpenAI',
  Gemini = 'Gemini',
  Ollama = 'Ollama',
  Groq = 'Groq',
  OpenRouter = 'OpenRouter',
  Claude = 'Claude',
  Mistral = 'Mistral',
}

export type LogSeqSettings = {
  geminiApiKey: string
  geminiModel: GeminiAIModelEnum
  openAiApiKey: string
  openAiModel: OpenAIModelEnum
  openAIBasePath: string
  provider: AIProvider
  blacklistedPages: string
  blacklistedKeywords: string
  maxRecursionDepth: number
  includeDatePage: boolean
  includePageReferences: boolean
  customSystemPrompt: string
  keyboardShortcut: string
  includeVisualization: boolean
  embeddingProvider: AIProvider
  ollamaEndpoint: string
  ollamaModel: string
  ollamaEmbeddingModel: string
  includeTavilySearch: boolean
  tavilyAPIKey: string
  chatGroqAPIKey: string
  chatGroqModel: ChatGroqModelEnum
  maxEmbeddedDocuments: number
  includeURLScrapper: boolean
  openRouterAPIKey: string
  openRouterModel: string
  openRouterEmbeddingModel: string
  claudeAPIKey: string
  claudeModel: ClaudeModelEnum
  mistralAPIKey: string
  mistralModel: MistralModelEnum
}