import { useMutation } from "react-query"
import useGeminiClient from '../hooks/useGeminiClient'
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { GeminiEmbedding } from '../types/embeddings'
import { GeminiContent, GeminiRoleEnum } from '../types/content-generation'
import { GeminiAIModelEnum } from "../types/models"

const buildPrompt = (query: string, relevantGeminiEmbeddings: GeminiEmbedding[], relatedGeminiEmbeddings: GeminiEmbedding[]) => {  
  return `You are an AI assistant of a LogSeq plugin for LogSeq user.
Please answer user's query (please format your answer using markdown syntax) based on relevant documents below (When a document mentions another document's title by using this syntax: [[another document title]], it means that the document have relation with those other mentioned document.) Please answer only the query below based on the document, don't mention anything about LogSeq plugin, your output will be directly displayed to the users of this plugin.:

QUERY: ${query}
RELEVANT DOCUMENTS: 
${relevantGeminiEmbeddings.map((document, idx) => `Doc ${idx + 1}:\nDoc Title: ${document.title}\nDoc Content:\n${document.text}\n`)}
RELATED DOCUMENTS:
${relatedGeminiEmbeddings.map((document, idx) => `Doc ${idx + 1}:\nDoc Title: ${document.title}\nDoc Content:\n${document.text}\n`)}
`
}

const dotProduct = (vectorA: number[], vectorB: number[]) => {
  return vectorA.reduce((sum, a, idx) => sum + a * vectorB[idx], 0);
}

const magnitude = (vector: number[]) => {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

const cosineSimilarity = (vectorA: number[], vectorB: number[]) => {
  return dotProduct(vectorA, vectorB) / (magnitude(vectorA) * magnitude(vectorB));
}

const useGenerateContent = () => {
  const { gemini } = useGeminiClient()
  const { settings } = useSettingsStore()

  return useMutation({
    mutationFn: async ({prevContents, query, geminiEmbeddings}: {prevContents: GeminiContent[], query: string, geminiEmbeddings: GeminiEmbedding[]}) => {
      if (gemini) {
        const model = gemini.getGenerativeModel({
          model: settings.geminiModel,
        })
        const embeddingModel = gemini.getGenerativeModel({ model: GeminiAIModelEnum.TextEmbedding004 });

        const queryEmbedding = await embeddingModel.embedContent(query)

        const similarityScores: (GeminiEmbedding & {score: number})[] = geminiEmbeddings.map(doc => ({
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

        const prompt = buildPrompt(query, relevantEmbeddings, geminiEmbeddings.filter((doc) => !relevantEmbeddingsTitleMap[doc.title]))

        return model.generateContentStream({
          contents: [
            ...prevContents.map((content) => ({
              role: content.role,
              parts: [
                {
                  text: content.message,
                }
              ]
            })),
            {
              role: GeminiRoleEnum.User,
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