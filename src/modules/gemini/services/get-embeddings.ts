import { useQuery } from 'react-query'
import { TaskType } from "@google/generative-ai"
import useGeminiClient from '../hooks/useGeminiClient'
import { GeminiEmbeddingDocument, GeminiEmbedding } from '../types/embeddings'
import { GeminiAIModelEnum } from '../../logseq/types/settings'

const useGetEmbeddings = (documents: GeminiEmbeddingDocument[]) => {
  const { gemini } = useGeminiClient()

  return useQuery({
    queryFn: async (): Promise<GeminiEmbedding[]> => {      
      const embeddings: GeminiEmbedding[] = []

      if (gemini && documents.length > 0) {
        const embeddingModel = gemini.getGenerativeModel({ model: GeminiAIModelEnum.TextEmbedding004 });

        const embeddingResponse = await embeddingModel.batchEmbedContents({
          requests: documents.map((document) => ({
            title: document.title,
            content: {
              role: 'document',
              parts: [{ text: document.text }]
            },
            taskType: TaskType.RETRIEVAL_DOCUMENT,
          }))
        })

        for (let i = 0; i < documents.length; i++) {
          embeddings.push({
            title: document.title,
            text: documents[i].text,
            embeddings: embeddingResponse.embeddings[i].values,
          })
        }
      }

      return embeddings
    },
    queryKey: ['gemini-get-embeddings', documents.map((document) => document.title)],
    enabled: !!gemini,
  })
}

export default useGetEmbeddings