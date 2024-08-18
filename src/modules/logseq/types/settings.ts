export enum GeminiAIModelEnum {
  Gemini1_5Pro = 'gemini-1.5-pro',
  Gemini1_5Flash = 'gemini-1.5-flash',
  Gemini1_0Pro = 'gemini-1.0-pro',  
  TextEmbedding004 = 'text-embedding-004'
}

export type LogSeqSettings = {
  geminiApiKey: string
  geminiModel: GeminiAIModelEnum
}