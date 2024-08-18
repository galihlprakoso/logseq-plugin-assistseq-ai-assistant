import React, { useCallback } from "react"
import { v4 as uuidv4 } from 'uuid';
import Card from '../modules/shared/components/Card'
import useGetDocuments from '../modules/logseq/services/get-documents'
import useGetEmbeddings from '../modules/gemini/services/get-embeddings'
import useGenerateContent from '../modules/gemini/services/generate-content'
import LoadingIndicator from '../modules/shared/components/LoadingIndicator'
import ChatBox from '../modules/chat/components/ChatBox'
import { ChatRoleEnum } from '../modules/chat/types/chat'
import useChatStore from "../modules/chat/stores/useChatStore"
import { GeminiRoleEnum } from "../modules/gemini/types/content-generation"
import useControlUI from "../modules/logseq/services/control-ui"
import useAppendBlockToPage from "../modules/logseq/services/append-block-to-page";
import useCopyToClipboard from "../modules/shared/services/copy-to-clipboard";
import useGetCurrentPage from "../modules/logseq/services/get-current-page";

type Props = object

const MainScreen: React.FC<Props> = () => {
  const { showMessage } = useControlUI()
  const { mutate: appendBlockToPage } = useAppendBlockToPage()
  const { copyToClipboard } = useCopyToClipboard()
  const { messages, addMessage, addTextToMessage } = useChatStore()
  const { data: currentPage } = useGetCurrentPage()
  const { data: documents, isLoading: documentsLoading } = useGetDocuments(currentPage?.name)
  const { data: embeddings, isLoading: embeddingsLoading } = useGetEmbeddings((documents || []).map((document) => ({
    title: document.title,
    text: document.content,
  })))
  const {mutateAsync: generateContent, isLoading: generateContentLoading} = useGenerateContent()

  const onQuerySend = useCallback(async (query: string) => {
    if (embeddings && currentPage) {
      try {
        addMessage(currentPage.name, {
          id: uuidv4(),
          content: query,
          role: ChatRoleEnum.User,
        })

        const response = await generateContent({
          query,
          geminiEmbeddings: embeddings!.map((embedding) => ({
            title: embedding.title,
            text: embedding.text,
            embeddings: embedding.embeddings,
          })),
          prevContents: (messages[currentPage.name] || []).map((doc) => ({
            role: doc.role as unknown as GeminiRoleEnum,
            message: doc.content,
          })),
        })

        if (response) {
          const messageId = uuidv4()
          let i = 0 

          for await (const chunk of response.stream) {
            const chunkText = chunk.text();
            
            if (i == 0) {
              addMessage(currentPage.name, {
                id: messageId,
                content: chunkText,
                role: ChatRoleEnum.AI,
              })
            } else {
              addTextToMessage(currentPage.name, messageId, chunkText)
            }

            i++
          }
        }
      } catch (err) {
        showMessage("There is an error when trying to communicate with Gemini AI.", "error")
      }
    }    
  }, [
    addMessage,
    addTextToMessage,
    currentPage,
    embeddings,
    generateContent,
    messages,
    showMessage
  ])

  const onCopyMessage = useCallback((text: string) => {
    copyToClipboard(text)
    showMessage("Copied to cliboard!", "success")
  }, [copyToClipboard, showMessage])

  const onAddToPage = useCallback((text: string) => {
    appendBlockToPage({text})
    showMessage("Added to your current page!", "success")
  }, [appendBlockToPage, showMessage])

  if (documentsLoading || embeddingsLoading || !currentPage) {
    return (
      <Card className="h-full relative flex items-center justify-center">
        <LoadingIndicator text="Loading your documents..." />
      </Card>
    )
  }

  return (
    <Card className="h-full relative overflow-hidden">            
      <ChatBox
        isSendEnabled={!documentsLoading && !embeddingsLoading && !generateContentLoading}
        onQuerySend={onQuerySend}
        onCopyMessage={onCopyMessage}
        onAddToPage={onAddToPage}
        currentPageName={currentPage.name}
      />
    </Card>
  )
}

export default MainScreen