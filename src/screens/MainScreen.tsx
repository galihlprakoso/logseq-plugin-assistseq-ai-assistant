import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Card from '../modules/shared/components/Card'
import LoadingIndicator from '../modules/shared/components/LoadingIndicator'
import useControlUI from "../modules/logseq/hooks/control-ui"
import useAppendBlockToPage from "../modules/logseq/services/append-block-to-page"
import useCopyToClipboard from "../modules/shared/services/copy-to-clipboard"
import useSettingsStore from "../modules/logseq/stores/useSettingsStore"
import useChat from "../modules/chat/hooks/useChat"
import { AIProvider } from "../modules/logseq/types/settings"
import { ChatMessageRoleEnum } from "../modules/chat/types/chat"
import ChatBubble from "../modules/chat/components/ChatBubble"
import MarkdownRenderer from "../modules/shared/components/MarkdownRenderer"
import TextArea from "../modules/shared/components/TextArea"

const KEYDOWN_ENTER = "Enter"

type Props = object

const MainScreen: React.FC<Props> = () => {
  const { settings } = useSettingsStore()
  const { showMessage } = useControlUI()
  const { mutate: appendBlockToPage } = useAppendBlockToPage()
  const { copyToClipboard } = useCopyToClipboard()  
  const { messages, chat, isLoading, clearChat, currentPageName } = useChat()
  const [query, setQuery] = useState<string>('')
  const bottomChatRef = useRef<HTMLDivElement | null>(null)

  const onChatSendButtonClicked = useCallback(() => {
    if (query && query.trim()) {      
      setTimeout(() => setQuery(''), 100)
      chat(query)
    }
  }, [query, chat])

  const providerModel = useMemo(() => {
    if (settings.provider === AIProvider.Gemini) {
      return settings.geminiModel
    } else if (settings.provider === AIProvider.OpenAI) {
      return settings.openAiModel
    } else if (settings.provider === AIProvider.Ollama) {
      return settings.ollamaModel
    } else if (settings.provider === AIProvider.Groq) {
      return settings.chatGroqModel
    }
    return ''
  }, [settings])

  useEffect(() => {
    if (bottomChatRef.current) {
      bottomChatRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const onCopyMessage = useCallback((text: string) => {
    copyToClipboard(text)
    showMessage("Copied to cliboard!", "success")
  }, [copyToClipboard, showMessage])

  const onAddToPage = useCallback((text: string) => {
    appendBlockToPage({text})
    showMessage("Added to your current page!", "success")
  }, [appendBlockToPage, showMessage])

  if (isLoading) {
    return (
      <Card className="h-full relative flex items-center justify-center">
        <LoadingIndicator text="Loading your LogSeq documents..." />
      </Card>
    )
  }

  return (
    <Card className="h-full relative overflow-hidden">            
      <div className="h-full relative">
        <div className="h-full overflow-y-scroll" >
          {messages.length > 0 ? (
            <div className="pb-36 px-4 pt-24 flex flex-col justify-end">
              {messages.map((message) => message.role === ChatMessageRoleEnum.User ? 
                <div key={message.id} className="w-full flex justify-end">
                  <ChatBubble className="w-3/5 mb-8">
                    <p className="text-gray-800 dark:text-gray-400">{message.content}</p>
                  </ChatBubble>
                </div> : (
                  <div key={message.id} className="w-full flex flex-col">
                    <MarkdownRenderer  markdown={message.content} />

                    <hr className="h-px my-2 bg-gray-200 border-0 dark:bg-gray-700"></hr>

                    <div className="flex flex-row items-center">
                      <button onClick={() => onCopyMessage(message.content)} type="button" className="px-2 py-1 text-xs inline-flex items-center font-medium text-center text-gray-800 bg-white-700 rounded-lg hover:bg-white-800 dark:bg-white-600 dark:hover:bg-white-700">
                        <svg className="w-5 h-5 mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M15 4v3a1 1 0 0 1-1 1h-3m2 10v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L6.7 8.35A1 1 0 0 1 7.46 8H9m-1 4H4m16-7v10a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V7.87a1 1 0 0 1 .24-.65l2.46-2.87a1 1 0 0 1 .76-.35H19a1 1 0 0 1 1 1Z"/>
                        </svg>

                        Copy
                      </button>

                      <button onClick={() => onAddToPage(message.content)} type="button" className="px-2 py-1 text-xs inline-flex items-center font-medium text-center text-gray-800 bg-white-700 rounded-lg hover:bg-white-800 dark:bg-white-600 dark:hover:bg-white-700">
                        <svg className="w-5 h-5 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/>
                        </svg>

                        Add to Page
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center flex-col">
              <svg className="w-16 h-16 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5h9M5 9h5m8-8H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4l3.5 4 3.5-4h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"/>
              </svg>
              <h2 className="text-4xl text-gray-800 font-bold dark:text-white mt-4">Hello!</h2>
              <p className="mb-3 text-gray-500 text-center dark:text-gray-400 mt-2">
                You can start asking a question based on your current page and it&apos;s related documents as a context. Send your first message!
              </p>
            </div> 
          )}
          <div className="float-left clear-both" ref={bottomChatRef} />
        </div>      

        <div className="absolute bottom-0 left-0 right-0 flex flex-row px-4 pb-4 bg-white">
          <div className="flex flex-1 relative flex-col">
            <TextArea
              className="flex flex-1"
              rows={3}
              //@ts-ignore
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === KEYDOWN_ENTER && !e.shiftKey) {
                  onChatSendButtonClicked()
                }
              }}
              value={query}
            />
            <div className="flex flex-row items-centers justify-between mt-1">
              <span className="text-xs text-gray-500">{settings.provider} - {providerModel} &#x2022; {currentPageName}</span>

              <span
                className="text-xs text-gray-500 underline cursor-pointer"
                onClick={() => {
                  if (confirm(`Are you sure to clear all chats on this page?`)) {
                    clearChat()
                  }
                }}
              >
                Clear Chat
              </span>
            </div>
            <div className="absolute bottom-5 top-0 right-0 flex items-end pb-2">
              <button disabled={isLoading || !query} onClick={onChatSendButtonClicked} type="button" className={`text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 opacity-${isLoading || !query ? '50' : '100'}`}>
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                </svg>
                <span className="sr-only">Send Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default MainScreen