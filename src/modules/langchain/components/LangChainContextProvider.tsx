import React, { ReactNode, useMemo } from "react"
import { Runnable, RunnableConfig, RunnableSequence } from "@langchain/core/runnables"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { Ollama } from "@langchain/ollama"
import { ChatOpenAI } from "@langchain/openai"
import { StringOutputParser } from "@langchain/core/output_parsers";
import { AIProvider } from "../../logseq/types/settings"
import { getTavilyTool, TAVILY_TOOL_DESCRIPTION, TAVILY_TOOL_NAME, tavilySchema } from "../tools/tavily"

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI assistant of a LogSeq plugin that will be used by LogSeq users.
Please answer user's query (please format your answer using markdown syntax) based on relevant documents below. When a document mentions another document's title by using this syntax: [[another document title]], it means that the document have relation with those other mentioned document.
Please answer only the query below based on the document, don't mention anything about LogSeq plugin, your output will be directly displayed to the users of this plugin.
----------------------
{kroki_visualization_prompt}
----------------------
DOCUMENTS:
{documents}`],
  new MessagesPlaceholder("history"),
  ["human", "{query}"],
])

type LangChainContext = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain?: Runnable<any, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainWithTools?: Runnable<any, unknown, RunnableConfig>
}

export const LangChainProviderContext = React.createContext<LangChainContext>({ chain: undefined, chainWithTools: undefined })

type Props = {
  children: ReactNode
}

const LangChainContextProvider: React.FC<Props> = ({ children }) => {
  const { settings } = useSettingsStore()

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

  const selectedModel = useMemo(() => {
    switch(settings.provider) {
      case AIProvider.Gemini:
        return geminiModel
      case AIProvider.OpenAI:
        return openAIModel
      case AIProvider.Ollama:
        return ollamaModel
    }
  }, [geminiModel, ollamaModel, openAIModel, settings.provider])

  const chainWithTools = useMemo(() => {
    let model = undefined

    if (selectedModel && settings.includeTavilySearch && settings.tavilyAPIKey) {
      const tavilyTool = {
        schema: tavilySchema,
        name: TAVILY_TOOL_NAME,
        description: TAVILY_TOOL_DESCRIPTION,
      }

      if ([AIProvider.Gemini, AIProvider.OpenAI].includes(settings.provider)) {
        //@ts-ignore
        model = selectedModel.bindTools([tavilyTool])
      } else {
        //@ts-ignore
        model = selectedModel.bind({
          tools: [
            tavilyTool,
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
  }, [selectedModel, settings.includeTavilySearch, settings.provider, settings.tavilyAPIKey])

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
    }}>
      {children}
    </LangChainProviderContext.Provider>
  )
}

export default LangChainContextProvider