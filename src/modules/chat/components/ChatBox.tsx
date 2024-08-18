import React, { useCallback, useMemo, useState } from "react"
import TextArea from '../../shared/components/TextArea'
import ChatBubble from '../../shared/components/ChatBubble'
import MarkdownRenderer from '../../shared/components/MarkdownRenderer'
import useChatStore from '../stores/useChatStore'
import { ChatRoleEnum } from "../types/chat"

type Props = {
  pageId: number
  isSendEnabled: boolean
  onQuerySend: (query: string) => void
}

const ChatBox: React.FC<Props> = ({pageId, isSendEnabled, onQuerySend}) => {
  const [query, setQuery] = useState<string>('')
  const { messages } = useChatStore()

  const messagesData = useMemo(() => messages[pageId] || [], [messages, pageId])

  const onQuerySendButtonClicked = useCallback(() => {
    onQuerySend(query)
  }, [query, onQuerySend])

  return (
    <div className="h-full relative">
      {messagesData.length > 0 ? (
        <div className="h-full overflow-y-scroll pb-28 px-4 pt-4 flex flex-col justify-end">
          {messagesData.map((message) => message.role === ChatRoleEnum.User ? 
            <div key={message.id} className="w-full flex justify-end">
              <ChatBubble className="w-3/5">
                <p className="text-gray-500 dark:text-gray-400">{message.content}</p>
              </ChatBubble>
            </div> : <MarkdownRenderer key={message.id} markdown={message.content} />
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center flex-col">
          <svg className="w-16 h-16 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5h9M5 9h5m8-8H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4l3.5 4 3.5-4h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"/>
          </svg>
          <h2 className="text-4xl text-gray-800 font-bold dark:text-white mt-4">Hello!</h2>
          <p className="mb-3 text-gray-500 text-center dark:text-gray-400 mt-2">
            You can start asking Gemini AI a question based on your current page. Send your first message!
          </p>
        </div> 
      )}
      <div className="absolute bottom-0 left-0 right-0 flex flex-row p-4">
        <div className="flex flex-1 relative">
          <TextArea
            className="flex flex-1"
            rows={3}
            //@ts-ignore
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
          <div className="absolute bottom-0 top-0 right-0 flex items-end pb-2">
            <button disabled={!isSendEnabled} onClick={onQuerySendButtonClicked} type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
              </svg>
              <span className="sr-only">Send Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBox