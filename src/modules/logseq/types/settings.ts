import { GeminiAIModelEnum } from "../../gemini/types/models"
import { OpenAIModelEnum } from "../../openai/types/models"

export enum AIProvider {
  OpenAI = 'OpenAI',
  Gemini = 'Gemini',
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
}