import React from "react"
import Card from '../modules/shared/components/Card'
import TextArea from '../modules/shared/components/TextArea'
import ChatBubble from '../modules/shared/components/ChatBubble'
import useGetDocuments from '../modules/logseq/services/get-documents'
import useGetEmbeddings from '../modules/gemini/services/get-embeddings'

type Props = object

const MainScreen: React.FC<Props> = () => {
  const { data: documents } = useGetDocuments()
  const { data: embeddings } = useGetEmbeddings((documents || []).map((document) => ({
    title: document.title,
    text: document.content,
  })))

  return (
    <Card className="h-full relative">            
      <div className="h-full overflow-y-scroll pb-28 px-4 pt-4 flex flex-col justify-end">
        <p className="mb-8 text-gray-500 dark:text-gray-400">Test</p>

        <div className="w-full flex justify-end">
          <ChatBubble className="w-3/5">
            <p className="text-gray-500 dark:text-gray-400">Track work across the enterprise through an open, collaborative platform. Link issues across Jira and ingest data from other software development tools, so your IT support and operations teams have richer contextual information to rapidly respond to requests, incidents, and changes.</p>
          </ChatBubble>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex flex-row p-4">
        <div className="flex flex-1 relative">
          <TextArea
            className="flex flex-1"
            rows={3}
          />
          <div className="absolute bottom-0 top-0 right-0 flex items-end pb-2">
            <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
              </svg>
              <span className="sr-only">Icon description</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default MainScreen