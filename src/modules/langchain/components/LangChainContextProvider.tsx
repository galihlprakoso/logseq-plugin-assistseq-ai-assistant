import React, { ReactNode, useCallback, useMemo } from "react"
import { Runnable, RunnableConfig, RunnableSequence } from "@langchain/core/runnables"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { Ollama, OllamaEmbeddings } from "@langchain/ollama"
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"
import { ChatGroq } from "@langchain/groq"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatMistralAI } from "@langchain/mistralai"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { DocumentInterface } from "@langchain/core/documents"
import { AIProvider } from "../../logseq/types/settings"
import { GeminiAIModelEnum } from "../../logseq/types/models"
import { tavilyTool, tavilyToolGroq } from "../tools/tavily"
import { cheerioTool, cheerioToolGroq } from "../tools/cheerio"
import useGetCurrentPage from "../../logseq/services/get-current-page"
import { LogSeqRelevantDocumentRetreiver } from "../libs/document-retrievers/LogSeqRelatedDocumentRetreiver"
import { advancedQueryTool } from "../tools/logseq-advanced-query"

// const GOOGLE_EMBEDDING_MODEL = "text-embedding-004"

// const inMemoryStore = new InMemoryStore();

const buildPromptTemplate = (customSystemPrompt: string) => {
  const defaultPrompt = `You are an intelligent AI assistant for LogSeq with advanced querying capabilities.

**Primary Tool:**
- **generate_logseq_advanced_query**: Execute Datalog queries for structured searches
  - Use for: TODO items, tags, properties, dates, specific filters
  - Generate precise Datalog queries based on user intent

**Additional Tools:**
- **global_search**: Web search (if enabled)
- **scrape_url**: URL content extraction (if enabled)

**Important:** When you use tools, the results will be shown to the user automatically. Just provide your final analysis/summary after the tool results.

**Response Guidelines:**
- Be concise and actionable
- Use markdown formatting
- Convert [[Page]] to: [[[Page]]](logseq://graph/{current_graph_name}?page=Page%20Name)
- Don't mention you used tools - results are already visible to user

{kroki_visualization_prompt}

**Current Context:**
{documents}`

  const systemPrompt = customSystemPrompt && customSystemPrompt.trim() !== ''
    ? `${customSystemPrompt}\n\n${defaultPrompt}`
    : defaultPrompt

  return ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("history"),
    ["human", "{query}"],
  ])
}

const cosineSimilarity = (vectorA: number[], vectorB: number[]) => {
  if (!vectorA.length || !vectorB.length || vectorA.length !== vectorB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }

  if (!normA || !normB) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

type LangChainContext = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain?: Runnable<any, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainWithTools?: Runnable<any, unknown, RunnableConfig>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedModel?: any
  retrieveRelatedDocuments?: (query: string) => Promise<DocumentInterface<Record<string, any>>[] | null>
}

export const LangChainProviderContext = React.createContext<LangChainContext>({
  chain: undefined,
  chainWithTools: undefined,
  tools: undefined,
  selectedModel: undefined,
  retrieveRelatedDocuments: undefined
})

type Props = {
  children: ReactNode
}

const LangChainContextProvider: React.FC<Props> = ({ children }) => {
  const { settings } = useSettingsStore()
  const { data: currentPage } = useGetCurrentPage()

  const prompt = useMemo(() => {
    return buildPromptTemplate(settings.customSystemPrompt)
  }, [settings.customSystemPrompt])


  const logSeqRelatedDocumentRetreiver = useMemo(() => {
    return new LogSeqRelevantDocumentRetreiver({
      metadata: {
        pageName: currentPage?.name || null,  // Can be null now
        settings,
      }
    })
  }, [currentPage, settings])

  const embeddings = useMemo(() => {
    if (settings.embeddingProvider === AIProvider.Gemini && settings.geminiApiKey) {
      return new GoogleGenerativeAIEmbeddings({
        apiKey: settings.geminiApiKey,
        model: GeminiAIModelEnum.TextEmbedding004,
      })
    }
    if (settings.embeddingProvider === AIProvider.Ollama && settings.ollamaEndpoint) {
      return new OllamaEmbeddings({
        model: settings.ollamaEmbeddingModel,
        baseUrl: settings.ollamaEndpoint,
      })
    }
    if (
      settings.embeddingProvider === AIProvider.OpenRouter &&
      settings.openRouterAPIKey &&
      settings.openRouterEmbeddingModel
    ) {
      return new OpenAIEmbeddings({
        model: settings.openRouterEmbeddingModel,
        apiKey: settings.openRouterAPIKey,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      })
    }
    return null
  }, [
    settings.embeddingProvider,
    settings.geminiApiKey,
    settings.ollamaEmbeddingModel,
    settings.ollamaEndpoint,
    settings.openRouterAPIKey,
    settings.openRouterEmbeddingModel,
  ])

  const retrieveRelatedDocuments = useCallback(async (query: string) => {
    if (!logSeqRelatedDocumentRetreiver) {
      return null
    }

    const documents = await logSeqRelatedDocumentRetreiver.invoke(query) as DocumentInterface<Record<string, unknown>>[]
    if (!documents || documents.length === 0) {
      return []
    }

    if (embeddings) {
      try {
        const [documentEmbeddings, queryEmbedding] = await Promise.all([
          embeddings.embedDocuments(documents.map((doc) => doc.pageContent)),
          embeddings.embedQuery(query),
        ])

        const scoredDocuments = documents.map((doc: DocumentInterface<Record<string, unknown>>, index) => ({
          doc,
          score: cosineSimilarity(queryEmbedding, documentEmbeddings[index] || []),
        }))

        const topDocuments = scoredDocuments
          .sort((a, b) => b.score - a.score)
          .slice(0, settings.maxEmbeddedDocuments)
          .map((item) => item.doc)

        return topDocuments.map((doc) => ({
          metadata: doc.metadata,
          pageContent: doc.pageContent,
        }))
      } catch (error) {
        console.error('Failed to embed LogSeq documents', error)
      }
    }

    return documents.map((doc) => ({
      metadata: doc.metadata,
      pageContent: doc.pageContent,
    }))
  }, [embeddings, logSeqRelatedDocumentRetreiver, settings.maxEmbeddedDocuments])

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
        apiKey: settings.openAiApiKey,
        model: settings.openAiModel,
        configuration: {
          baseURL: settings.openAIBasePath || undefined,
        },
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
      })
    }
    return undefined
  }, [settings])

  const openRouterModel = useMemo(() => {
    if (settings.openRouterAPIKey && settings.openRouterModel) {
      return new ChatOpenAI({
        modelName: settings.openRouterModel,
        apiKey: settings.openRouterAPIKey,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      })
    }
    return undefined
  }, [settings])

  const claudeModel = useMemo(() => {
    if (settings.claudeAPIKey && settings.claudeModel) {
      return new ChatAnthropic({
        model: settings.claudeModel,
        apiKey: settings.claudeAPIKey,
        maxRetries: 2,
      })
    }
    return undefined
  }, [settings])

  const mistralModel = useMemo(() => {
    if (settings.mistralAPIKey && settings.mistralModel) {
      return new ChatMistralAI({
        model: settings.mistralModel,
        apiKey: settings.mistralAPIKey,
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
      case AIProvider.OpenRouter:
        return openRouterModel
      case AIProvider.Claude:
        return claudeModel
      case AIProvider.Mistral:
        return mistralModel
    }
  }, [chatGroqModel, claudeModel, geminiModel, mistralModel, ollamaModel, openAIModel, openRouterModel, settings.provider])

  // Tools array for agent
  const tools = useMemo(() => {
    const toolsList: any[] = [advancedQueryTool]
    
    console.log('🔧 Building tools list:', {
      includeTavilySearch: settings.includeTavilySearch,
      hasTavilyAPIKey: !!settings.tavilyAPIKey,
      includeURLScrapper: settings.includeURLScrapper,
      provider: settings.provider
    })
    
    if (settings.includeTavilySearch && settings.tavilyAPIKey && settings.tavilyAPIKey.trim() !== '') {
      console.log('✅ Adding Tavily search tool')
      if (settings.provider === AIProvider.Groq) {
        toolsList.push(tavilyToolGroq as any)
      } else {
        toolsList.push(tavilyTool as any)
      }
    } else if (settings.includeTavilySearch) {
      console.warn('⚠️ Tavily search enabled but API key not provided or empty - SKIPPING tool')
    }
    
    if (settings.includeURLScrapper) {
      console.log('✅ Adding URL scraper tool')
      if (settings.provider === AIProvider.Groq) {
        toolsList.push(cheerioToolGroq as any)
      } else {
        toolsList.push(cheerioTool as any)
      }
    }
    
    console.log(`🔧 Total tools available: ${toolsList.length}`)
    
    return toolsList
  }, [settings.includeTavilySearch, settings.includeURLScrapper, settings.tavilyAPIKey, settings.provider])


  const chainWithTools = useMemo(() => {
    let model = undefined

    if (selectedModel) {
      
      if ([AIProvider.Gemini, AIProvider.OpenAI, AIProvider.OpenRouter, AIProvider.Claude, AIProvider.Mistral].includes(settings.provider)) {
        //@ts-ignore
        model = selectedModel.bindTools([
          ...(settings.includeTavilySearch && settings.tavilyAPIKey && settings.tavilyAPIKey.trim() !== '') ? [tavilyTool] : [],
          ...(settings.includeURLScrapper) ? [cheerioTool] : [],
          advancedQueryTool,
        ])
      } else if (settings.provider === AIProvider.Groq) {
        //@ts-ignore
        model = selectedModel.bindTools([
          ...(settings.includeTavilySearch && settings.tavilyAPIKey && settings.tavilyAPIKey.trim() !== '') ? [tavilyToolGroq] : [],
          ...(settings.includeURLScrapper) ? [cheerioToolGroq] : [],
          advancedQueryTool,
        ])
      } else {
        //@ts-ignore
        model = selectedModel.bind({
          tools: [
            ...(settings.includeTavilySearch && settings.tavilyAPIKey && settings.tavilyAPIKey.trim() !== '') ? [tavilyTool] : [],
            ...(settings.includeURLScrapper) ? [cheerioTool] : [],
            advancedQueryTool,
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
      tools,
      selectedModel,
      retrieveRelatedDocuments,
    }}>
      {children}
    </LangChainProviderContext.Provider>
  )
}

export default LangChainContextProvider