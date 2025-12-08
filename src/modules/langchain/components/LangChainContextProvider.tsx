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
import { GeminiAIModelEnum, OpenRouterModelEnum } from "../../logseq/types/models"
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

const normalizeContent = (text: string) => text.replace(/\s+/g, " ").trim()
const MIN_CONTENT_LENGTH = 40

const hasMeaningfulContent = (text: string) => normalizeContent(text).length >= MIN_CONTENT_LENGTH

const extractKeywords = (query: string) => query
  .toLowerCase()
  .split(/\W+/)
  .filter((token) => token.length > 2)
  .slice(0, 6)

const documentMatchesKeywords = (content: string, keywords: string[]) => {
  if (!keywords.length) return true
  const normalized = normalizeContent(content).toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword))
}

const buildSnippet = (content: string, keywords: string[]) => {
  const normalized = normalizeContent(content)
  if (!normalized) return ''

  const lower = normalized.toLowerCase()
  let startIndex = 0

  if (keywords.length) {
    for (const keyword of keywords) {
      const matchIndex = lower.indexOf(keyword)
      if (matchIndex !== -1) {
        startIndex = Math.max(0, matchIndex - 60)
        break
      }
    }
  }

  const SNIPPET_LENGTH = 220
  const snippet = normalized.slice(startIndex, startIndex + SNIPPET_LENGTH)
  const prefix = startIndex > 0 ? '…' : ''
  const suffix = startIndex + SNIPPET_LENGTH < normalized.length ? '…' : ''

  return `${prefix}${snippet}${suffix}`.trim()
}

const dedupeDocumentsByTitle = (docs: DocumentInterface<Record<string, unknown>>[]) => {
  const seen = new Set<string>()
  return docs.filter((doc) => {
    const title = typeof doc.metadata?.title === 'string' ? doc.metadata.title : ''
    if (!title) return true
    if (seen.has(title)) return false
    seen.add(title)
    return true
  })
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
  const sanitizedOpenRouterModel = settings.openRouterModel?.trim() || OpenRouterModelEnum.OpenAIGPT4oMini
  const sanitizedOpenRouterEmbeddingModel = settings.openRouterEmbeddingModel?.trim() || OpenRouterModelEnum.GoogleGeminiEmbedding001

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
      sanitizedOpenRouterEmbeddingModel
    ) {
      return new OpenAIEmbeddings({
        model: sanitizedOpenRouterEmbeddingModel,
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
    sanitizedOpenRouterEmbeddingModel,
  ])

  const retrieveRelatedDocuments = useCallback(async (query: string) => {
    if (!logSeqRelatedDocumentRetreiver) {
      return null
    }

    const documents = await logSeqRelatedDocumentRetreiver.invoke(query) as DocumentInterface<Record<string, unknown>>[]
    if (!documents || documents.length === 0) {
      return []
    }

    const keywords = extractKeywords(query)

    const candidatePool = dedupeDocumentsByTitle(
      (() => {
        const contentRich = documents.filter((doc) => hasMeaningfulContent(doc.pageContent))
        const keywordMatched = contentRich.filter((doc) => documentMatchesKeywords(doc.pageContent, keywords))

        if (keywordMatched.length) return keywordMatched
        if (contentRich.length) return contentRich
        return documents
      })()
    )

    if (!candidatePool.length) {
      return []
    }

    const formatDocument = (
      doc: DocumentInterface<Record<string, unknown>>,
      score?: number,
    ): DocumentInterface<Record<string, unknown>> => ({
      metadata: {
        ...doc.metadata,
        snippet: buildSnippet(doc.pageContent, keywords),
        score,
      },
      pageContent: doc.pageContent,
    })

    if (embeddings) {
      try {
        const [documentEmbeddings, queryEmbedding] = await Promise.all([
          embeddings.embedDocuments(candidatePool.map((doc) => doc.pageContent)),
          embeddings.embedQuery(query),
        ])

        const scoredDocuments = candidatePool.map((doc, index) => ({
          doc,
          score: cosineSimilarity(queryEmbedding, documentEmbeddings[index] || []),
        }))

        const positiveMatches = scoredDocuments.filter((item) => item.score > 0.05)

        const rankedDocuments = (positiveMatches.length ? positiveMatches : scoredDocuments)
          .sort((a, b) => b.score - a.score)
          .slice(0, settings.maxEmbeddedDocuments)

        return rankedDocuments.map((item) => formatDocument(item.doc, item.score))
      } catch (error) {
        console.error('Failed to embed LogSeq documents', error)
      }
    }

    return candidatePool
      .slice(0, settings.maxEmbeddedDocuments)
      .map((doc) => formatDocument(doc))
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
    if (settings.openRouterAPIKey && sanitizedOpenRouterModel) {
      return new ChatOpenAI({
        modelName: sanitizedOpenRouterModel,
        apiKey: settings.openRouterAPIKey,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      })
    }
    return undefined
  }, [sanitizedOpenRouterModel, settings.openRouterAPIKey])

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