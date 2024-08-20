import { useMutation } from 'react-query'
import { TaskType } from "@google/generative-ai"
import useGeminiClient from '../hooks/useGeminiClient'
import { useMemo } from 'react'
import { GeminiAIModelEnum } from '../types/models'
import { Embedding } from '../../shared/types/gpt'
import { LogSeqDocument } from '../../logseq/types/logseq'
import { ChatMessageRoleEnum } from '../../chat/types/chat'

const MAX_BATCH_SIZE = 100
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

const useGetEmbeddings = (documents: LogSeqDocument[]) => {
  const { gemini } = useGeminiClient()

  const queryKeyDocuments = useMemo(() => documents.map((document) => document.title), [documents])

  const getCacheKey = (title: string) => `embedding_${title}`

  const saveToCache = (key: string, value: Embedding) => {
    const data = {
      value,
      expiry: Date.now() + CACHE_EXPIRY_MS,
    }
    localStorage.setItem(key, JSON.stringify(data))
  }

  const loadFromCache = (key: string): Embedding | null => {
    const cachedItem = localStorage.getItem(key)
    if (!cachedItem) return null

    const { value, expiry } = JSON.parse(cachedItem)

    if (Date.now() > expiry) {
      localStorage.removeItem(key) // Cache expired, remove it
      return null
    }

    return value
  }

  return useMutation({
    mutationFn: async (): Promise<Embedding[]> => {
      const embeddings: Embedding[] = []

      if (gemini && documents.length > 0) {
        const embeddingModel = gemini.getGenerativeModel({ model: GeminiAIModelEnum.TextEmbedding004 })

        // Chunk the documents if necessary
        const chunks = []
        for (let i = 0; i < documents.length; i += MAX_BATCH_SIZE) {
          chunks.push(documents.slice(i, i + MAX_BATCH_SIZE))
        }

        for (const chunk of chunks) {
          const uncachedDocuments = []

          for (const document of chunk) {
            const cacheKey = getCacheKey(document.title)
            const cachedEmbedding = loadFromCache(cacheKey)

            if (cachedEmbedding) {
              embeddings.push(cachedEmbedding)
            } else {
              uncachedDocuments.push(document)
            }
          }

          if (uncachedDocuments.length > 0) {
            const embeddingResponse = await embeddingModel.batchEmbedContents({
              requests: uncachedDocuments.map((document) => ({
                title: document.title,
                content: {
                  role: ChatMessageRoleEnum.AI,
                  parts: [{ text: document.content }]
                },
                taskType: TaskType.RETRIEVAL_DOCUMENT,
              })),
            })

            for (let i = 0; i < uncachedDocuments.length; i++) {
              const embedding = {
                title: uncachedDocuments[i].title,
                text: uncachedDocuments[i].content,
                embeddings: embeddingResponse.embeddings[i].values,
              }

              const cacheKey = getCacheKey(uncachedDocuments[i].title)
              saveToCache(cacheKey, embedding)
              embeddings.push(embedding)
            }
          }
        }
      }

      return embeddings
    },
    mutationKey: ['gemini-get-embeddings', queryKeyDocuments],
  })
}

export default useGetEmbeddings
