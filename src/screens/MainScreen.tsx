import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Card from '../modules/shared/components/Card'
import LoadingIndicator from '../modules/shared/components/LoadingIndicator'
import useControlUI from "../modules/logseq/hooks/control-ui"
import useAppendBlockToPage from "../modules/logseq/services/append-block-to-page"
import useCopyToClipboard from "../modules/shared/services/copy-to-clipboard"
import useSettingsStore from "../modules/logseq/stores/useSettingsStore"
import useChat from "../modules/chat/hooks/useChat"
import { AIProvider } from "../modules/logseq/types/settings"
import { ChatMessage, ChatMessageRoleEnum } from "../modules/chat/types/chat"
import ChatBubble from "../modules/chat/components/ChatBubble"
import MarkdownRenderer from "../modules/shared/components/MarkdownRenderer"
import TextArea from "../modules/shared/components/TextArea"
import useGetCurrentGraph from "../modules/logseq/services/get-current-graph"
// import { getLogSeqDocumentsSearchTool } from "../modules/langchain/tools/logseq-documents-search"

const KEYDOWN_ENTER = "Enter"

type Props = object

const MainScreen: React.FC<Props> = () => {
  const { settings } = useSettingsStore()
  const { showMessage } = useControlUI()
  const { mutate: appendBlockToPage } = useAppendBlockToPage()
  const { copyToClipboard } = useCopyToClipboard()  
  const { messages, chat, isLoading, clearChat, currentPageName, error, isGenerating, stopGenerating } = useChat()
  const { data: currentGraph } = useGetCurrentGraph()
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
    } else if (settings.provider === AIProvider.OpenRouter) {
      return settings.openRouterModel
    } else if (settings.provider === AIProvider.Claude) {
      return settings.claudeModel
    } else if (settings.provider === AIProvider.Mistral) {
      return settings.mistralModel
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

  const onOpenReference = useCallback((pageName: string) => {
    if (!pageName || typeof window === 'undefined') return

    if ((window as any)?.logseq?.App?.pushState) {
      window.logseq.App.pushState('page', { name: pageName })
      return
    }

    if (window.open) {
      const encodedGraph = currentGraph?.name ? encodeURIComponent(currentGraph.name) : ''
      const encodedPage = encodeURIComponent(pageName)
      const target = currentGraph?.name
        ? `logseq://graph/${encodedGraph}?page=${encodedPage}`
        : `logseq://page/${encodedPage}`
      window.open(target, '_blank')
    }
  }, [currentGraph])

  if (error && (error as Error)?.message !== 'No page found') {
    const errorMessage = (error as Error)?.message || 'Unknown error'
    const isModelError = errorMessage.includes('is not found') || errorMessage.includes('not available') || errorMessage.includes('not supported')
    
    return (
      <Card className="h-full relative flex items-center justify-center flex-col">
        <svg className="w-16 h-16 text-red-500 dark:text-red-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
        <h2 className="text-2xl text-gray-800 font-bold dark:text-white mt-4">
          {isModelError ? 'Model Not Available' : 'Unable to Load Page'}
        </h2>
        <p className="mb-3 text-gray-500 text-center dark:text-gray-400 mt-2 max-w-md">
          {isModelError ? (
            <>
              The selected AI model is not available. Please update your settings:
              <br /><br />
              1. Click the plugin settings (⚙️) icon
              <br />
              2. Change your <strong>Gemini Model</strong> to <strong>gemini-2.5-flash</strong> or another available model
              <br />
              3. Reload the plugin
              <br /><br />
              Note: Gemini 1.5 models have been deprecated. Please use Gemini 2.5 or 2.0 models.
            </>
          ) : (
            <>
              Could not load the current LogSeq page. Please make sure you&apos;re on a valid page (not on the home screen or settings).
              Try opening a specific page or journal entry.
            </>
          )}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Error: {errorMessage}
        </p>
      </Card>
    )
  }

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
              {messages.map((message: ChatMessage) => message.role === ChatMessageRoleEnum.User ? 
                <div key={message.id} className="w-full flex justify-end">
                  <ChatBubble className="w-3/5 mb-8">
                    <p className="text-gray-800 dark:text-gray-400">{message.content}</p>
                  </ChatBubble>
                </div> : (
                  <div key={message.id} className="w-full flex flex-col">
                    <MarkdownRenderer  markdown={message.content} />

                    {message.relatedDocuments?.length ? (
                      <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Referenced Notes</p>
                        <ol className="mt-2 space-y-1 list-decimal list-inside">
                          {message.relatedDocuments.map((doc, index) => (
                            <li key={`${message.id}-ref-${index}`}>
                              <button
                                type="button"
                                className="text-left hover:text-blue-600 dark:hover:text-blue-400"
                                onClick={() => onOpenReference(doc.title)}
                              >
                                {doc.title}
                              </button>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}

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
              <span className="text-xs text-gray-500">{settings.provider} - {providerModel} &#x2022; {currentPageName || '🌍 Global Mode'}</span>

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
              {isGenerating ? (
                <button onClick={stopGenerating} type="button" className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800">
                  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 12 16">
                    <path d="M3 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm7 0H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Z"/>
                  </svg>
                  <span className="sr-only">Stop Generating</span>
                </button>
              ) : (
                <button disabled={isLoading || !query} onClick={onChatSendButtonClicked} type="button" className={`text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 opacity-${isLoading || !query ? '50' : '100'}`}>
                  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                  </svg>
                  <span className="sr-only">Send Message</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default MainScreen