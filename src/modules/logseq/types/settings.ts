import { GeminiAIModelEnum, OpenAIModelEnum } from "./models"

export enum AIProvider {
  OpenAI = 'OpenAI',
  Gemini = 'Gemini',
  Ollama = 'Ollama',
}

export type LogSeqSettings = {
  geminiApiKey: string
  geminiModel: GeminiAIModelEnum
  openAiApiKey: string
  openAiModel: OpenAIModelEnum
  provider: AIProvider
  blacklistedPages: string
  blacklistedKeywords: string
  maxRecursionDepth: number
  includeDatePage: boolean
  includeVisualization: boolean
  embeddingProvider: AIProvider
  ollamaEndpoint: string
  ollamaModel: string
  ollamaEmbeddingModel: string
  includeTavilySearch: boolean
  tavilyAPIKey: string
}