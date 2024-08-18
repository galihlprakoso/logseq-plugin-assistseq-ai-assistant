export enum ChatRoleEnum {
  User = 'user',
  AI = 'model'
}

export type ChatMessage = {
  id: string
  content: string
  role: ChatRoleEnum
}