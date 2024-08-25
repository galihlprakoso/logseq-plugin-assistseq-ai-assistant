import { AIMessage, HumanMessage } from "@langchain/core/messages"
import { v4 as uuidv4 } from 'uuid'
import { useCallback, useMemo } from "react"
import useLangChain from "../../langchain/hooks/useLangChain"
import useChatStore from "../stores/useChatStore"
import useGetCurrentPage from "../../logseq/services/get-current-page"
import { ChatMessageRoleEnum } from "../types/chat"
import useControlUI from "../../logseq/hooks/control-ui"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { KROKI_VISUALIZATION_PROMPT } from "../../shared/constants/prompts"
import { LogSeqRelevantDocumentRetreiver } from "../../langchain/libs/LogSeqRelatedDocumentRetreiver"
import { Document } from "@langchain/core/documents"


const formatDocumentsAsString = (documents: Document[]) => {
  return documents.map((document) => document.pageContent).join("\n\n")
}

const useChat = () => {
  const { settings } = useSettingsStore()
  const { showMessage } = useControlUI()
  const chain = useLangChain()
  const { data: currentPage } = useGetCurrentPage()
  const { addMessage, addTextToMessage, messages, clearChat } = useChatStore()


  const logSeqRelatedDocumentRetreiver = useMemo(() => {
    if (currentPage) {
      return new LogSeqRelevantDocumentRetreiver({
        metadata: {
          pageName: currentPage.name,
          settings,
        }
      })
    }
  }, [currentPage, settings])
  
  const chat = useCallback(async (query: string) => {
    if (chain && currentPage && logSeqRelatedDocumentRetreiver) {

      const pageMessages = messages[currentPage.name]

      try {
        addMessage(currentPage.name, {
          id: uuidv4(),
          content: query,
          role: ChatMessageRoleEnum.User,
        })

        const chainStream = await chain.stream({
          documents: logSeqRelatedDocumentRetreiver.pipe(formatDocumentsAsString),
          history: pageMessages.map((message) => {
            if (message.role === ChatMessageRoleEnum.User) {
              return new HumanMessage(message.content)
            }
            return new AIMessage(message.content)
          }),
          kroki_visualization_prompt: settings.includeVisualization ? KROKI_VISUALIZATION_PROMPT : ' ',
          query,
        }, {
          configurable: {
            sessionId: currentPage.name,
          }
        })

        const messageId = uuidv4()
  
        let i = 0
  
        for await (const chunkText of chainStream) {          
          if (i == 0) {
            addMessage(currentPage.name, {
              id: messageId,
              content: chunkText,
              role: ChatMessageRoleEnum.AI,
            })
          } else {
            addTextToMessage(currentPage.name, messageId, chunkText)
          }

          i++
        }
      } catch (err) {
        console.error(err)
        showMessage("There is an error when trying to communicate with AI Provider.", "error")
      }
      
    }
  }, [
    addMessage,
    addTextToMessage,
    chain,
    currentPage,
    logSeqRelatedDocumentRetreiver,
    messages,
    settings.includeVisualization,
    showMessage
  ])

  const clearAllChat = useCallback(() => {
    if (currentPage) {
      clearChat(currentPage.name)
    }
  }, [clearChat, currentPage])

  return {
    chat,
    isLoading: !currentPage,
    messages: currentPage ? messages[currentPage.name] || []: [],
    clearChat: clearAllChat,
    currentPageName: currentPage ? currentPage.name : '',
  }
}

export default useChat