import { useMutation } from 'react-query'

import { useMemo } from 'react'
import useGeminiGetEmbeddings from '../../gemini/services/get-embeddings'
import useGeminiGenerateContent from '../../gemini/services/generate-content'
import { ChatMessage } from '../types/chat'
import { LogSeqDocument } from '../../logseq/types/logseq'

type MutationArgs = {
  prevContents: ChatMessage[],
  query: string
}

const useGenerateContent = (documents: LogSeqDocument[]) => {
  const queryKeyDocuments = useMemo(() => documents.map((document) => document.title), [documents])

  const {mutateAsync: getGeminiEmbeddings} = useGeminiGetEmbeddings(documents)
  const {mutateAsync: geminiGenerateContent} = useGeminiGenerateContent()

  return useMutation({
    mutationFn: async ({prevContents, query}: MutationArgs) => {            

      const geminiEmbeddings = await getGeminiEmbeddings()

      return geminiGenerateContent({
        prevContents,
        query,
        geminiEmbeddings: geminiEmbeddings
      })
    },
    mutationKey: ['generate-content', queryKeyDocuments],
  })
}

export default useGenerateContent