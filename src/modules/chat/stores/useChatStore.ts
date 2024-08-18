import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { ChatMessage } from '../types/chat'

interface ChatState {
  messages: Record<number, ChatMessage[]>
  addMessage: (pageId: number, message: ChatMessage) => void
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
              ...state.messages[pageId],
              message,
            ]
          }
        })),
      }),
      {
        name: 'chat-store',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
)

export default useChatStore