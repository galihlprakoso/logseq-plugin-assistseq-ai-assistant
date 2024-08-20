import { useMutation } from "react-query"
import useGeminiClient from '../hooks/useGeminiClient'
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { GeminiAIModelEnum } from "../types/models"
import { Embedding } from "../../shared/types/gpt"
import { ChatMessage, ChatMessageRoleEnum } from "../../chat/types/chat"
import { cosineSimilarity } from "../../shared/utils/math"
import { buildPrompt } from "../../shared/utils/prompt"

const useGenerateContent = () => {
  const { gemini } = useGeminiClient()
  const { settings } = useSettingsStore()

  return useMutation({
    mutationFn: async ({prevContents, query, embeddings}: {prevContents: ChatMessage[], query: string, embeddings: Embedding[]}) => {
      if (gemini) {
        const model = gemini.getGenerativeModel({
          model: settings.geminiModel,
        })
        const embeddingModel = gemini.getGenerativeModel({ model: GeminiAIModelEnum.TextEmbedding004 });

        const queryEmbedding = await embeddingModel.embedContent(query)

        const similarityScores: (Embedding & {score: number})[] = embeddings.map(doc => ({
          title: doc.title,
          embeddings: doc.embeddings,
          text: doc.text,
          score: cosineSimilarity(queryEmbedding.embedding.values, doc.embeddings)
        }));

        const sortedDocuments = similarityScores.sort((a, b) => b.score - a.score);
        const relevantEmbeddings = sortedDocuments.filter(doc => doc.score > 0);

        const relevantEmbeddingsTitleMap: Record<string, boolean> = {}

        relevantEmbeddings.forEach((doc) => {
          relevantEmbeddingsTitleMap[doc.title] = true
        })

        const prompt = buildPrompt(
          query,
          relevantEmbeddings,
          embeddings.filter((doc) => !relevantEmbeddingsTitleMap[doc.title]),
          settings.includeVisualization,
        )

        return model.generateContentStream({
          contents: [
            ...prevContents.map((content) => ({
              role: content.role,
              parts: [
                {
                  text: content.content,
                }
              ]
            })),
            {
              role: ChatMessageRoleEnum.User,
              parts: [
                {
                  text: prompt,
                }
              ]
            }
          ]
        })        
      }
    },
    mutationKey: ['generate-content']
  })
}

export default useGenerateContent