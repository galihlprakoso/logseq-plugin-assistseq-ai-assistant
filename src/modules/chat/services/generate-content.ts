import { useMutation } from 'react-query'

import { useMemo, useRef } from 'react'
import useGeminiGetEmbeddings from '../../gemini/services/get-embeddings'
import useGeminiGenerateContent from '../../gemini/services/generate-content'
import useOpenAIGetEmbeddings from '../../openai/services/get-embeddings'
import useOpenAIGenerateContent from '../../openai/services/generate-content'
import { ChatMessage } from '../types/chat'
import { LogSeqDocument } from '../../logseq/types/logseq'
import { Embedding } from '../types/gpt'
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { AIProvider } from '../../logseq/types/settings'

type MutationArgs = {
  prevContents: ChatMessage[],
  query: string
}

const useGenerateContent = (documents: LogSeqDocument[]) => {
  const { settings } = useSettingsStore()
  const embeddingsCacheSetRef = useRef<Map<string, Embedding[]>>(new Map())
  const mutationKeyDocuments = useMemo(() => documents.map((document) => document.title), [documents])
  const mutationKey = useMemo(() => `${settings.provider}:${mutationKeyDocuments.join(',')}`, [mutationKeyDocuments, settings.provider])

  const {mutateAsync: getGeminiEmbeddings} = useGeminiGetEmbeddings(documents)
  const {mutateAsync: geminiGenerateContent} = useGeminiGenerateContent()
  const {mutateAsync: getOpenAIEmbeddings} = useOpenAIGetEmbeddings(documents)
  const {mutateAsync: openAIGenerateContent} = useOpenAIGenerateContent()

  return useMutation({
    mutationFn: async ({prevContents, query}: MutationArgs) => { 
      
      let embeddings = embeddingsCacheSetRef.current.get(mutationKey)

      if (settings.provider === AIProvider.Gemini) {

        if (!embeddings) {
          embeddings = await getGeminiEmbeddings()
        }

        embeddingsCacheSetRef.current.set(mutationKey, embeddings)

        return geminiGenerateContent({
          prevContents,
          query,
          embeddings,
        })
      } else {

        if (!embeddings) {
          embeddings = await getOpenAIEmbeddings()
        }

        embeddingsCacheSetRef.current.set(mutationKey, embeddings)

        return openAIGenerateContent({
          prevContents,
          query,
          embeddings,
        })
      }      
    },
    mutationKey: ['generate-content', mutationKey],
  })
}

export default useGenerateContent