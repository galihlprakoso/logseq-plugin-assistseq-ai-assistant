import { useMutation } from 'react-query'
import { TaskType } from "@google/generative-ai"
import useGeminiClient from '../hooks/useGeminiClient'
import { useMemo } from 'react'
import { GeminiAIModelEnum } from '../types/models'
import { Embedding } from '../../chat/types/gpt'
import { LogSeqDocument } from '../../logseq/types/logseq'

const useGetEmbeddings = (documents: LogSeqDocument[]) => {
  const { gemini } = useGeminiClient()

  const queryKeyDocuments = useMemo(() => documents.map((document) => document.title), [documents])

  return useMutation({
    mutationFn: async (): Promise<Embedding[]> => {      
      const embeddings: Embedding[] = []

      if (gemini && documents.length > 0) {
        const embeddingModel = gemini.getGenerativeModel({ model: GeminiAIModelEnum.TextEmbedding004 });

        const embeddingResponse = await embeddingModel.batchEmbedContents({
          requests: documents.map((document) => ({
            title: document.title,
            content: {
              role: 'document',
              parts: [{ text: document.content }]
            },
            taskType: TaskType.RETRIEVAL_DOCUMENT,
          }))
        })

        for (let i = 0; i < documents.length; i++) {
          embeddings.push({
            title: document.title,
            text: documents[i].content,
            embeddings: embeddingResponse.embeddings[i].values,
          })
        }
      }

      return embeddings
    },
    mutationKey: ['gemini-get-embeddings', queryKeyDocuments],
  })
}

export default useGetEmbeddings