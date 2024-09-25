import React, { ReactNode, useCallback, useMemo } from "react"
import { Runnable, RunnableConfig, RunnableSequence } from "@langchain/core/runnables"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { Ollama } from "@langchain/ollama"
import { ChatOpenAI, OpenAI } from "@langchain/openai"
import { ChatGroq } from "@langchain/groq"
import { StringOutputParser } from "@langchain/core/output_parsers"
// import { TaskType } from "@google/generative-ai"
// import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { DocumentInterface } from "@langchain/core/documents"
// import { CacheBackedEmbeddings } from "langchain/embeddings/cache_backed"
import { AIProvider } from "../../logseq/types/settings"
import { tavilyTool, tavilyToolGroq } from "../tools/tavily"
import { cheerioTool, cheerioToolGroq } from "../tools/cheerio"
import useGetCurrentPage from "../../logseq/services/get-current-page"
import { LogSeqRelevantDocumentRetreiver } from "../libs/document-retrievers/LogSeqRelatedDocumentRetreiver"
// import { LocalStorageStore } from "../libs/storage/LocaStorageStore"
import { logSeqDocumentSearchTool, logSeqDocumentSearchToolGroq } from "../tools/logseq-documents-search"
// import { VectorStore } from "@langchain/core/vectorstores"
// import { InMemoryStore } from "@langchain/core/stores"

// const GOOGLE_EMBEDDING_MODEL = "text-embedding-004"

// const inMemoryStore = new InMemoryStore();

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI assistant of a LogSeq plugin that will be used by LogSeq users.
Please answer user's query (please format your answer using markdown syntax) based on relevant documents below. When a document mentions another document's title by using this syntax: [[another document title]], it means that the document have relation with those other mentioned document.
Please answer only the query below based on the document, don't mention anything about LogSeq plugin, your output will be directly displayed to the users of this plugin.

Please replace any page reference double square brackets (e.g [[Some Document]]) in your answer with this specified markdown link instead, this link will use deeplink url so when user clicked the link, it will be directed to specific page instead, for example:
[[[Some Document]]](logseq://graph/{current_graph_name}?page=<document title or UUID>)

Don't forget to encode the url:
[[[Some Document With Space]]](logseq://graph/{current_graph_name}?page=Some%20Document%20With%20Space)

----------------------
{kroki_visualization_prompt}
----------------------
CURRENT CONTEXT DOCUMENTS:
{documents}`],
  new MessagesPlaceholder("history"),
  ["human", "{query}"],
])

type LangChainContext = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain?: Runnable<any, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainWithTools?: Runnable<any, unknown, RunnableConfig>
  retrieveRelatedDocuments?: (query: string) => Promise<DocumentInterface<Record<string, any>>[] | null>
}

export const LangChainProviderContext = React.createContext<LangChainContext>({
  chain: undefined,
  chainWithTools: undefined,
  retrieveRelatedDocuments: undefined
})

type Props = {
  children: ReactNode
}

const LangChainContextProvider: React.FC<Props> = ({ children }) => {
  const { settings } = useSettingsStore()
  const { data: currentPage } = useGetCurrentPage()


  const logSeqRelatedDocumentRetreiver = useMemo(() => {
    if (currentPage) {
      return new LogSeqRelevantDocumentRetreiver({
        metadata: {
          pageName: currentPage.name,
          settings,
        }
      })
    }
  }, [currentPage, settings])

  // const embeddings = useMemo(() => {
  //   if (settings.embeddingProvider === AIProvider.Gemini && settings.geminiApiKey) {
  //     return new GoogleGenerativeAIEmbeddings({
  //       model: GOOGLE_EMBEDDING_MODEL,
  //       taskType: TaskType.RETRIEVAL_DOCUMENT,
  //       apiKey: settings.geminiApiKey,
  //     });
  //   }
  //   if (settings.embeddingProvider === AIProvider.Ollama && settings.ollamaEndpoint) {
  //     return new OllamaEmbeddings({
  //       model: settings.ollamaEmbeddingModel,
  //       baseUrl: settings.ollamaEndpoint,
  //     });
  //   }
  //   return null
  // }, [settings.embeddingProvider, settings.geminiApiKey, settings.ollamaEmbeddingModel, settings.ollamaEndpoint])

  const retrieveRelatedDocuments = useCallback(async (query: string) => {
    if (logSeqRelatedDocumentRetreiver) {
      const documents = await logSeqRelatedDocumentRetreiver.invoke(query)      

      // if (embeddings) {
      //   const cacheBackedEmbeddings = CacheBackedEmbeddings.fromBytesStore(
      //     embeddings,
      //     inMemoryStore,
      //     {
      //       namespace: embeddings.model,
      //     }
      //   );

      //   const vectorstore = await MemoryVectorStore.fromDocuments(
      //     documents.map(doc => ({ pageContent: doc.pageContent, metadata: doc.metadata})),
      //     cacheBackedEmbeddings
      //   );
      
      //   const retriever = vectorstore.asRetriever(settings.maxEmbeddedDocuments);
  
      //   const retrievedDocuments = await retriever.invoke(query);
  
      //   return retrievedDocuments
      // }

      return documents.map((doc) => ({
         metadata: doc.metadata,
         pageContent: doc.pageContent,
      }))
    }
    return null;
  }, [logSeqRelatedDocumentRetreiver])

  const geminiModel = useMemo(() => {
    if (settings.geminiApiKey && settings.geminiModel) {
      return new ChatGoogleGenerativeAI({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel,
        
      })
    }
    return undefined
  }, [settings])

  const openAIModel = useMemo(() => {
    if (settings.openAiApiKey && settings.openAiModel) {
      return new ChatOpenAI({
        azureOpenAIBasePath: settings.openAIBasePath || undefined,
        apiKey: settings.openAiApiKey,
        model: settings.openAiModel,
      })
    }
    return undefined
  }, [settings])

  const ollamaModel = useMemo(() => {
    if (settings.openAiApiKey && settings.openAiModel) {
      return new Ollama({
        baseUrl: settings.ollamaEndpoint,
        model: settings.ollamaModel,
      })
    }
    return undefined
  }, [settings])

  const chatGroqModel = useMemo(() => {
    if (settings.chatGroqAPIKey && settings.chatGroqModel) {
      return new ChatGroq({
        model: settings.chatGroqModel,
        apiKey: settings.chatGroqAPIKey,
        maxRetries: 2,
      })
    }
    return undefined
  }, [settings])

  const selectedModel = useMemo(() => {  
    switch(settings.provider) {
      case AIProvider.Gemini:
        return geminiModel
      case AIProvider.OpenAI:
        return openAIModel
      case AIProvider.Ollama:
        return ollamaModel
      case AIProvider.Groq:
        return chatGroqModel
    }
  }, [chatGroqModel, geminiModel, ollamaModel, openAIModel, settings.provider])

  const chainWithTools = useMemo(() => {
    let model = undefined

    if (selectedModel) {
      
      if ([AIProvider.Gemini, AIProvider.OpenAI].includes(settings.provider)) {
        //@ts-ignore
        model = selectedModel.bindTools([
          ...(settings.includeTavilySearch && settings.tavilyAPIKey) ? [tavilyTool] : [],
          ...(settings.includeURLScrapper) ? [cheerioTool] : [],
          logSeqDocumentSearchTool,
        ])
      } else if (settings.provider === AIProvider.Groq) {
        //@ts-ignore
        model = selectedModel.bindTools([
          ...(settings.includeTavilySearch && settings.tavilyAPIKey) ? [tavilyToolGroq] : [],
          ...(settings.includeURLScrapper) ? [cheerioToolGroq] : [],
          logSeqDocumentSearchToolGroq,
        ])
      } else {
        //@ts-ignore
        model = selectedModel.bind({
          tools: [
            ...(settings.includeTavilySearch && settings.tavilyAPIKey) ? [tavilyTool] : [],
            ...(settings.includeURLScrapper) ? [cheerioTool] : [],
            logSeqDocumentSearchTool,
          ]
        }) 
      }

      if (model) {
        return prompt.pipe(model)
      } else {
        return undefined
      }
    }

    return model
  }, [selectedModel, settings.includeTavilySearch, settings.includeURLScrapper, settings.provider, settings.tavilyAPIKey])

  const chain = useMemo(() => {
    if (selectedModel) {

      const chain = RunnableSequence.from([
        prompt,        
        selectedModel,
        new StringOutputParser(),
      ])

      return chain
    }

    return undefined
  }, [selectedModel])

  return (
    <LangChainProviderContext.Provider value={{
      chain,
      chainWithTools,
      retrieveRelatedDocuments,
    }}>
      {children}
    </LangChainProviderContext.Provider>
  )
}

export default LangChainContextProvider