export enum ChatRoleEnum {
  User = 'User',
  AI = 'AI'
}

export type ChatMessage = {
  id: string
  content: string
  role: ChatRoleEnum
}