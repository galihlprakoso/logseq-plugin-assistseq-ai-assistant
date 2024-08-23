import { useCallback } from "react"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { cosineSimilarity } from "../../shared/utils/math"
import { AIProvider } from "../../logseq/types/settings"
import useGeminiClient from "../../gemini/hooks/useGeminiClient"
import { GeminiAIModelEnum } from "../../gemini/types/models"
import { Embedding } from "../../shared/types/gpt"

const useGetRelevantEmbeddings = () => {
  const { settings } = useSettingsStore()
  const { gemini } = useGeminiClient()

  const getRelevantEmbeddings = useCallback(async (query: string, embeddings: Embedding[]) => {
    let queryEmbedding: number[] = []

    if (gemini && settings.embeddingProvider === AIProvider.Gemini) {
      const embeddingModel = gemini.getGenerativeModel({ model: GeminiAIModelEnum.TextEmbedding004 });
      const queryEmbeddingContent = await embeddingModel.embedContent(query)

      queryEmbedding = queryEmbeddingContent.embedding.values
    } else {

      const embeddingsResponse = await fetch(`${settings.ollamaEndpoint}/api/embeddings`, {
        body: JSON.stringify({
          model: settings.ollamaEmbeddingModel,
          prompt: query,
        })
      })

      const embeddings = await embeddingsResponse.json()

      queryEmbedding = embeddings.embedding
    }

    const similarityScores: (Embedding & {score: number})[] = embeddings.map(doc => ({
      title: doc.title,
      embeddings: doc.embeddings,
      text: doc.text,
      score: cosineSimilarity(queryEmbedding, doc.embeddings)
    }));

    const sortedDocuments = similarityScores.sort((a, b) => b.score - a.score);
    const relevantEmbeddings = sortedDocuments.filter(doc => doc.score > 0);

    const relevantEmbeddingsTitleMap: Record<string, boolean> = {}

    relevantEmbeddings.forEach((doc) => {
      relevantEmbeddingsTitleMap[doc.title] = true
    })

    return {
      relevantEmbeddings,
      relevantEmbeddingsTitleMap,
    }
  }, [settings, gemini])

  return {
    getRelevantEmbeddings,
  }
}

export default useGetRelevantEmbeddings