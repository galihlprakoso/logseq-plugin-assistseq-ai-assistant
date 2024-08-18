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

type Props = object

const MainScreen: React.FC<Props> = () => {
  const { showMessage } = useControlUI()
  const { mutate: appendBlockToPage } = useAppendBlockToPage()
  const { copyToClipboard } = useCopyToClipboard()
  const { messages, addMessage, addTextToMessage } = useChatStore()
  const { data: documents, isLoading: documentsLoading } = useGetDocuments()
  const { data: embeddings, isLoading: embeddingsLoading } = useGetEmbeddings((documents?.documents || []).map((document) => ({
    title: document.title,
    text: document.content,
  })))
  const {mutateAsync: generateContent, isLoading: generateContentLoading} = useGenerateContent()

  const onQuerySend = useCallback(async (query: string) => {
    if (embeddings && documents?.pageName) {
      try {
        addMessage(documents.pageName, {
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
          prevContents: (messages[documents.pageName] || []).map((doc) => ({
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
              addMessage(documents.pageName, {
                id: messageId,
                content: chunkText,
                role: ChatRoleEnum.AI,
              })
            } else {
              addTextToMessage(documents.pageName, messageId, chunkText)
            }

            i++
          }
        }
      } catch (err) {
        console.log(err)
        showMessage("There is an error when trying to communicate with Gemini AI.", "error")
      }
    }    
  }, [
    addMessage,
    addTextToMessage,
    documents?.pageName,
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

  if (documentsLoading || embeddingsLoading) {
    return (
      <Card className="h-full relative flex items-center justify-center">
        <LoadingIndicator />
      </Card>
    )
  }

  return (
    <Card className="h-full relative">            
      <ChatBox
        isSendEnabled={!documentsLoading && !embeddingsLoading && !generateContentLoading}
        pageName={documents!.pageName}
        onQuerySend={onQuerySend}
        onCopyMessage={onCopyMessage}
        onAddToPage={onAddToPage}
      />
    </Card>
  )
}

export default MainScreen