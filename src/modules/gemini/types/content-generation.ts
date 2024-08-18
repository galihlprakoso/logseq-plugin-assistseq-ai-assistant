export enum GeminiRoleEnum {
  User = 'user',
  AI = 'model'
}

export type GeminiContent = {
  role: GeminiRoleEnum
  message: string
}