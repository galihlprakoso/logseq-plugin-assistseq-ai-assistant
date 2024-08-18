import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { ChatMessage } from '../types/chat'

interface ChatState {
  messages: Record<string, ChatMessage[]>
  addMessage: (pageName: string, message: ChatMessage) => void
  addTextToMessage: (pageName: string, messageId: string, text: string) => void
}

const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        messages: {},
        addMessage: (pageName: string, message: ChatMessage) => set((state) => ({
          messages: {
            ...state.messages,
            [pageName]: [
              ...(state.messages[pageName] || []),
              message,
            ]
          }
        })),
        addTextToMessage: (pageName: string, messageId: string, text: string) => set((state) => ({
          messages: {
            ...state.messages,
            [pageName]: state.messages[pageName].map(((message) => {
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