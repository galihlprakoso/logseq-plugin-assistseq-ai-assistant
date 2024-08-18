import { useMutation } from "react-query"
import useGeminiClient from '../hooks/useGeminiClient'
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { GeminiEmbedding } from '../types/embeddings'

const buildPrompt = (query: string, geminiEmbeddings: GeminiEmbedding[]) => {  
  return `You are an AI assistant of a LogSeq plugin for LogSeq user.
Please answer user's based on relevant documents below (When a document mentions another document's title by using this syntax: [[another document title]], it means that the document have relation with those other mentioned document.):

QUERY: ${query}
DOCUMENTS: 
${geminiEmbeddings.map((document, idx) => `Doc ${idx + 1}:\nDoc Title: ${document.title}\nDoc Content:\n${document.text}\n`)}
`
}

const useGenerateContent = () => {
  const { gemini } = useGeminiClient()
  const { settings } = useSettingsStore()

  return useMutation({
    mutationFn: async ({query, geminiEmbeddings}: {query: string, geminiEmbeddings: GeminiEmbedding[]}) => {
      if (gemini) {
        const model = gemini.getGenerativeModel({
          model: settings.geminiModel,
        })

        const prompt = buildPrompt(query, geminiEmbeddings)

        return model.generateContentStream([prompt])        
      }
    },

  })
}

export default useGenerateContent