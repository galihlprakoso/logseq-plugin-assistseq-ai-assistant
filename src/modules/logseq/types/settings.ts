import { GeminiAIModelEnum } from "../../gemini/types/models"

export enum AIProvider {
  OpenAI = 'OpenAI',
  Gemini = 'Gemini',
}

export type LogSeqSettings = {
  geminiApiKey: string
  geminiModel: GeminiAIModelEnum
}