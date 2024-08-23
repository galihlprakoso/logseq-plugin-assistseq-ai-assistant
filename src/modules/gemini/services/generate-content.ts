import { useMutation } from "react-query"
import useGeminiClient from '../hooks/useGeminiClient'
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { Embedding } from "../../shared/types/gpt"
import { ChatMessage, ChatMessageRoleEnum } from "../../chat/types/chat"
import { buildPrompt } from "../../shared/utils/prompt"
import useGetRelevantEmbeddings from "../../chat/services/get-relevant-embeddings"

const useGenerateContent = () => {
  const { gemini } = useGeminiClient()
  const { settings } = useSettingsStore()
  const { getRelevantEmbeddings } = useGetRelevantEmbeddings()


  return useMutation({
    mutationFn: async ({prevContents, query, embeddings}: {prevContents: ChatMessage[], query: string, embeddings: Embedding[]}) => {            
      if (gemini) {
        const model = gemini.getGenerativeModel({
          model: settings.geminiModel,
        })
        
        const { relevantEmbeddings, relevantEmbeddingsTitleMap } = await getRelevantEmbeddings(query, embeddings)

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