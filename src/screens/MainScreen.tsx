import React from "react"
import Card from '../modules/shared/components/Card'
import useGetDocuments from '../modules/logseq/services/get-documents'
import useGetEmbeddings from '../modules/gemini/services/get-embeddings'
import LoadingIndicator from '../modules/shared/components/LoadingIndicator'
import ChatBox from '../modules/chat/components/ChatBox'

type Props = object

const MainScreen: React.FC<Props> = () => {
  const { data: documents, isLoading: documentsLoading } = useGetDocuments()
  const { data: embeddings, isLoading: embeddingsLoading } = useGetEmbeddings((documents?.documents || []).map((document) => ({
    title: document.title,
    text: document.content,
  })))

  if (documentsLoading || embeddingsLoading) {
    return (
      <Card className="h-full relative flex items-center justify-center">
        <LoadingIndicator />
      </Card>
    )
  }

  return (
    <Card className="h-full relative">            
      <ChatBox pageId={documents!.pageId} />
    </Card>
  )
}

export default MainScreen