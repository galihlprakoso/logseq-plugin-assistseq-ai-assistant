export enum ChatMessageRoleEnum {
  User = 'user',
  AI = 'model'
}

export type ChatMessage = {
  id: string
  content: string
  role: ChatMessageRoleEnum
}