import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { ChatMessage } from '../types/chat'

interface ChatState {
  messages: Record<number, ChatMessage[]>
  addMessage: (pageId: number, message: ChatMessage) => void
  addTextToMessage: (pageId: number, messageId: string, text: string) => void
}

const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        messages: {},
        addMessage: (pageId: number, message: ChatMessage) => set((state) => ({
          messages: {
            ...state.messages,
            [pageId]: [
              ...(state.messages[pageId] || []),
              message,
            ]
          }
        })),
        addTextToMessage: (pageId: number, messageId: string, text: string) => set((state) => ({
          messages: {
            ...state.messages,
            [pageId]: state.messages[pageId].map(((message) => {
              if (message.id === messageId) {
                return {
                  ...message,
                  content: `${message.content}${text}`,
                }
              }
              return message
            }))
          }
        }))
      }),
      {
        name: 'chat-store',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
)

export default useChatStore