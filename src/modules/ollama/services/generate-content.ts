import { useMutation } from "react-query"
import useSettingsStore from '../../logseq/stores/useSettingsStore'
import { Embedding } from "../../shared/types/gpt"
import { ChatMessage, ChatMessageRoleEnum } from "../../chat/types/chat"
import { buildPrompt } from "../../shared/utils/prompt"
import useGetRelevantEmbeddings from "../../chat/services/get-relevant-embeddings"

async function* jsonStreamAsyncIterable(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk into a string
      buffer += decoder.decode(value, { stream: true });

      // Split the buffer on newline or any separator you expect between JSON objects
      const lines = buffer.split('\n');

      // Keep the last part in the buffer as it might be an incomplete JSON
      buffer = lines.pop() || '';

      // Yield parsed JSON objects
      for (const line of lines) {
        if (line.trim()) {
          yield JSON.parse(line);
        }
      }
    }

    // If there's any remaining data in the buffer, parse and yield it
    if (buffer.trim()) {
      yield JSON.parse(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}


const useGenerateContent = () => {
  const { settings } = useSettingsStore()
  const { getRelevantEmbeddings } = useGetRelevantEmbeddings()

  return useMutation({
    mutationFn: async ({prevContents, query, embeddings}: {prevContents: ChatMessage[], query: string, embeddings: Embedding[]}) => {
      const { relevantEmbeddings, relevantEmbeddingsTitleMap } = await getRelevantEmbeddings(query, embeddings)

      const prompt = buildPrompt(
        query,
        relevantEmbeddings,
        embeddings.filter((doc) => !relevantEmbeddingsTitleMap[doc.title]),
        settings.includeVisualization,
      )

      const generateResponse = await fetch(`${settings.ollamaEndpoint}/api/chat`, {
        method: 'POST',
        body: JSON.stringify({
          model: settings.ollamaModel,
          messages: [
            ...prevContents.map((content) => ({
              role: content.role,
              content: content.content,
            })),
            {
              role: ChatMessageRoleEnum.User,
              content: prompt,
            }
          ]
        })
      })

      if (generateResponse.body) {
        return jsonStreamAsyncIterable(generateResponse.body)
      }

      return null
    },
    mutationKey: ['generate-content']
  })
}

export default useGenerateContent