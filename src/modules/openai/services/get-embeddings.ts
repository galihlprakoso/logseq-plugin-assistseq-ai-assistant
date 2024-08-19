import { useMutation } from 'react-query'
import { useMemo } from 'react'
import { Embedding } from '../../chat/types/gpt'
import { LogSeqDocument } from '../../logseq/types/logseq'
import useOpenAIClient from '../hooks/useOpenAIClient'
import { OpenAIModelEnum } from '../types/models'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const useGetEmbeddings = (documents: LogSeqDocument[]) => {
  const { openAI } = useOpenAIClient()

  const queryKeyDocuments = useMemo(() => documents.map((document) => document.title), [documents])

  return useMutation({
    mutationFn: async (): Promise<Embedding[]> => {      
      const embeddings: Embedding[] = []

      if (openAI && documents.length > 0) {    
        const embeddingResponse = []  
        for (let i = 0; i < documents.length; i++) {
          const document = documents[i];
          const embedding = await openAI.embeddings.create({
            model: OpenAIModelEnum.TextEmbeddingAda002,
            input: `${document.title}\n${document.content}`,
            user: 'model',
          }) 

          embeddingResponse.push(embedding)

          await sleep(500)
        }      

        for (let i = 0; i < documents.length; i++) {
          embeddings.push({
            title: document.title,
            text: documents[i].content,
            embeddings: embeddingResponse[i].data[0].embedding,
          })
        }
      }

      return embeddings
    },
    mutationKey: ['openai-get-embeddings', queryKeyDocuments],
  })
}

export default useGetEmbeddings