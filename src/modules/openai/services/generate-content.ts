import { useMutation } from "react-query"
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { Embedding } from "../../shared/types/gpt"
import { ChatMessage, ChatMessageRoleEnum } from "../../chat/types/chat"
import { cosineSimilarity } from "../../shared/utils/math"
import useOpenAIClient from "../hooks/useOpenAIClient"
import useGeminiClient from "../../gemini/hooks/useGeminiClient"
import { GeminiAIModelEnum } from "../../gemini/types/models"
import { buildPrompt } from "../../shared/utils/prompt"

const useGenerateContent = () => {
  const { openAI } = useOpenAIClient()
  const { gemini } = useGeminiClient()
  const { settings } = useSettingsStore()

  return useMutation({
    mutationFn: async ({prevContents, query, embeddings}: {prevContents: ChatMessage[], query: string, embeddings: Embedding[]}) => {
      if (openAI && gemini) {

        // Need to use Gemini embedding for now.
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
          settings.includeVisualization
        )

        //@ts-ignore
        return openAI.chat.completions.create({
          messages: [
            ...prevContents.map((content) => ({
              role: (content.role === ChatMessageRoleEnum.AI ? 'assistant' : 'user'),
              content: content.content,              
            })),
            {
              role: "user",
              content: prompt,
            }
          ],
          model: settings.openAiModel,   
          stream: true,       
        })        
      }
    },
    mutationKey: ['generate-content']
  })
}

export default useGenerateContent