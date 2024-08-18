export enum GeminiRoleEnum {
  User = 'User',
  AI = 'AI'
}

export type GeminiContent = {
  role: GeminiRoleEnum
  message: string
}