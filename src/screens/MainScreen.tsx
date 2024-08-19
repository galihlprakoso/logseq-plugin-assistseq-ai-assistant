import React, { useCallback } from "react"
import { v4 as uuidv4 } from 'uuid';
import Card from '../modules/shared/components/Card'
import useGetDocuments from '../modules/logseq/services/get-documents'
import LoadingIndicator from '../modules/shared/components/LoadingIndicator'
import ChatBox from '../modules/chat/components/ChatBox'
import useChatStore from "../modules/chat/stores/useChatStore"
import useControlUI from "../modules/logseq/services/control-ui"
import useAppendBlockToPage from "../modules/logseq/services/append-block-to-page";
import useCopyToClipboard from "../modules/shared/services/copy-to-clipboard";
import useGetCurrentPage from "../modules/logseq/services/get-current-page";
import useSettingsStore from "../modules/logseq/stores/useSettingsStore";
import { ChatMessageRoleEnum } from "../modules/chat/types/chat";
import useGenerateContent from "../modules/chat/services/generate-content";
import { AIProvider } from "../modules/logseq/types/settings";
import { GenerateContentStreamResult } from "@google/generative-ai";
import { ChatCompletion, ChatCompletionChunk } from "openai/resources";
import { Stream } from "openai/streaming";

type Props = object

const MainScreen: React.FC<Props> = () => {
  const { showMessage } = useControlUI()
  const { mutate: appendBlockToPage } = useAppendBlockToPage()
  const { copyToClipboard } = useCopyToClipboard()
  const { messages, addMessage, addTextToMessage } = useChatStore()
  const { data: currentPage } = useGetCurrentPage()
  const { settings } = useSettingsStore()
  const { data: documents, isLoading: documentsLoading } = useGetDocuments(currentPage?.name, settings)

  const {mutateAsync: generateContent, isLoading: generateContentLoading} = useGenerateContent(documents || [])

  const onQuerySend = useCallback(async (query: string) => {
    if (currentPage) {
      try {
        addMessage(currentPage.name, {
          id: uuidv4(),
          content: query,
          role: ChatMessageRoleEnum.User,
        })

        const response = await generateContent({
          query,
          prevContents: messages[currentPage.name] || [],
        })

        if (response) {
          const messageId = uuidv4()
          let i = 0 

          if (settings.provider === AIProvider.Gemini) {            
            for await (const chunk of (response as GenerateContentStreamResult).stream) {
              const chunkText = chunk.text();
              
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
          } else {
            for await (const chunk of (response as (ChatCompletion & Stream<ChatCompletionChunk>))) {
              const chunkText = chunk.choices[0]?.delta?.content || ''
              
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
          }
        }
      } catch (err) {
        showMessage("There is an error when trying to communicate with AI Provider.", "error")
      }
    }    
  }, [addMessage, addTextToMessage, currentPage, generateContent, messages, settings.provider, showMessage])

  const onCopyMessage = useCallback((text: string) => {
    copyToClipboard(text)
    showMessage("Copied to cliboard!", "success")
  }, [copyToClipboard, showMessage])

  const onAddToPage = useCallback((text: string) => {
    appendBlockToPage({text})
    showMessage("Added to your current page!", "success")
  }, [appendBlockToPage, showMessage])

  if (documentsLoading || !currentPage) {
    return (
      <Card className="h-full relative flex items-center justify-center">
        <LoadingIndicator text="Loading your documents..." />
      </Card>
    )
  }

  return (
    <Card className="h-full relative overflow-hidden">            
      <ChatBox
        isSendEnabled={!documentsLoading && !generateContentLoading}
        onQuerySend={onQuerySend}
        onCopyMessage={onCopyMessage}
        onAddToPage={onAddToPage}
        currentPageName={currentPage.name}
      />
    </Card>
  )
}

export default MainScreen