import { useMutation } from "react-query"
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { Embedding } from "../../chat/types/gpt"
import { ChatMessage, ChatMessageRoleEnum } from "../../chat/types/chat"
import { cosineSimilarity } from "../../shared/utils/math"
import useOpenAIClient from "../hooks/useOpenAIClient"
import useGeminiClient from "../../gemini/hooks/useGeminiClient"
import { GeminiAIModelEnum } from "../../gemini/types/models"

const buildPrompt = (query: string, relevantEmbeddings: Embedding[], relatedEmbeddings: Embedding[]) => {  
  return `You are an AI assistant of a LogSeq plugin for LogSeq user.
Please answer user's query (please format your answer using markdown syntax) based on relevant documents below (When a document mentions another document's title by using this syntax: [[another document title]], it means that the document have relation with those other mentioned document.) Please answer only the query below based on the document, don't mention anything about LogSeq plugin, your output will be directly displayed to the users of this plugin.:

QUERY: ${query}
RELEVANT DOCUMENTS: 
${relevantEmbeddings.map((document, idx) => `Doc ${idx + 1}:\nDoc Title: ${document.title}\nDoc Content:\n${document.text}\n`)}
RELATED DOCUMENTS:
${relatedEmbeddings.map((document, idx) => `Doc ${idx + 1}:\nDoc Title: ${document.title}\nDoc Content:\n${document.text}\n`)}
`
}

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

        const prompt = buildPrompt(query, relevantEmbeddings, embeddings.filter((doc) => !relevantEmbeddingsTitleMap[doc.title]))

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