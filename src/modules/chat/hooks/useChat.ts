import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages"
import { v4 as uuidv4 } from 'uuid'
import { useCallback, useMemo } from "react"
import useLangChain from "../../langchain/hooks/useLangChain"
import useChatStore from "../stores/useChatStore"
import useGetCurrentPage from "../../logseq/services/get-current-page"
import { ChatMessageRoleEnum } from "../types/chat"
import useControlUI from "../../logseq/hooks/control-ui"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { KROKI_VISUALIZATION_PROMPT } from "../../shared/constants/prompts"
import { LogSeqRelevantDocumentRetreiver } from "../../langchain/document-retrievers/LogSeqRelatedDocumentRetreiver"
import { Document } from "@langchain/core/documents"
import { getTavilyTool, tavilyTool } from "../../langchain/tools/tavily"
import { tool } from "@langchain/core/tools"
import { Runnable } from "@langchain/core/runnables"
import { cheerioTool, getURLContentTool } from "../../langchain/tools/cheerio"


const formatDocumentsAsString = (documents: Document[]) => {
  const result = documents.map((document) => `Title:${document.metadata.title}\nContent:${document.pageContent}\n`).join("------------------\n")
  return result
}

const useChat = () => {
  const { settings } = useSettingsStore()
  const { showMessage } = useControlUI()
  const {chain, chainWithTools} = useLangChain()
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

  const toolsByName = useMemo<Record<string, Runnable>>(() => {
    return {
      [tavilyTool.name]: tool(
        getTavilyTool(settings.tavilyAPIKey),
        tavilyTool,
      ),
      [cheerioTool.name]: tool(
        getURLContentTool,
        cheerioTool,
      )
    }
  }, [settings.tavilyAPIKey])
  
  const chat = useCallback(async (query: string) => {
    if (chain && currentPage && logSeqRelatedDocumentRetreiver) {

      const pageMessages = messages[currentPage.name] || []

      try {
        addMessage(currentPage.name, {
          id: uuidv4(),
          content: query,
          role: ChatMessageRoleEnum.User,
        })

        const history = pageMessages.map((message) => {
          if (message.role === ChatMessageRoleEnum.User) {
            return new HumanMessage(message.content)
          }
          return new AIMessage(message.content)
        })

        const documents = await logSeqRelatedDocumentRetreiver.pipe(formatDocumentsAsString).invoke('')        

        if (chainWithTools) {
          const aiMessageWithTool = await chainWithTools.invoke({
            documents,
            history,
            kroki_visualization_prompt: '',
            query,
          }, {
            configurable: {
              sessionId: currentPage.name,
            }
          })
  
          const tool_calls = (aiMessageWithTool as any).tool_calls
  
          if (tool_calls.length > 0) {
            history.push(aiMessageWithTool as BaseMessage)
          }
  
          for (let i = 0; i < tool_calls.length; i++) {
            const tool_call = tool_calls[i];
            const tool = toolsByName[tool_call.name]
  
            if (tool) {
              const toolMessage = await tool.invoke(tool_call.args)
              history.push(toolMessage)            
            }
          }
        }

        const chainStream = await chain.stream({
          documents,
          history,
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
  }, [addMessage, addTextToMessage, chain, chainWithTools, currentPage, logSeqRelatedDocumentRetreiver, messages, settings.includeVisualization, showMessage, toolsByName])

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