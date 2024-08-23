import { useMutation } from "react-query"
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { Embedding } from "../../shared/types/gpt"
import { ChatMessage, ChatMessageRoleEnum } from "../../chat/types/chat"
import useOpenAIClient from "../hooks/useOpenAIClient"
import { buildPrompt } from "../../shared/utils/prompt"
import useGetRelevantEmbeddings from "../../chat/services/get-relevant-embeddings"

const useGenerateContent = () => {
  const { openAI } = useOpenAIClient()
  const { settings } = useSettingsStore()
  const { getRelevantEmbeddings } = useGetRelevantEmbeddings()

  return useMutation({
    mutationFn: async ({prevContents, query, embeddings}: {prevContents: ChatMessage[], query: string, embeddings: Embedding[]}) => {
      if (openAI) {

        const { relevantEmbeddings, relevantEmbeddingsTitleMap } = await getRelevantEmbeddings(query, embeddings)

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