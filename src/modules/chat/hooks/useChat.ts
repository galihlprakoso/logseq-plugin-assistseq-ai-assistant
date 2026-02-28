import { AIMessage, BaseMessage, HumanMessage, isAIMessage, SystemMessage } from "@langchain/core/messages"
import { v4 as uuidv4 } from 'uuid'
import { useCallback, useMemo, useRef, useState } from "react"
import useLangChain from "../../langchain/hooks/useLangChain"
import useChatStore from "../stores/useChatStore"
import useGetCurrentPage from "../../logseq/services/get-current-page"
import { ChatMessageRoleEnum, ChatMessage, AgentStep } from "../types/chat"
import useControlUI from "../../logseq/hooks/control-ui"
import useSettingsStore from "../../logseq/stores/useSettingsStore"
import { KROKI_VISUALIZATION_PROMPT } from "../constants/prompts"
import { fetchTavilyResults, getTavilyTool, TavilySearchResult, tavilyTool } from "../../langchain/tools/tavily"
import { tool } from "@langchain/core/tools"
import { Runnable } from "@langchain/core/runnables"
import { cheerioTool, getURLContentTool } from "../../langchain/tools/cheerio"
import { DocumentInterface } from "@langchain/core/documents"
import { executeAdvancedQuery, advancedQueryTool } from "../../langchain/tools/logseq-advanced-query"
import useGetCurrentGraph from "../../logseq/services/get-current-graph"
import { executeReActAgent } from "../../langchain/libs/agent/executor"
import { LogSeqDocument } from "../../logseq/types/logseq"

interface LogSeqPage {
  name: string
  [key: string]: unknown
}

function getToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    'generate_logseq_advanced_query': 'Executing advanced query',
    'global_search': 'Searching the web',
    'scrape_url': 'Fetching webpage content',
  }
  return labels[toolName] || `Running ${toolName}`
}

function formatToolResult(toolName: string, result: any): string {
  // Handle undefined or non-string results
  if (!result) {
    return `✅ Completed`
  }
  
  // Convert to string if it's an object
  const resultStr = typeof result === 'string' ? result : JSON.stringify(result)
  
  if (toolName === 'generate_logseq_advanced_query') {
    const resultsMatch = resultStr.match(/Results \((\d+)\)/)
    if (resultsMatch) {
      return `✅ Found ${resultsMatch[1]} results`
    }
  }
  return `✅ Completed`
}

const formatDocumentsAsString = (documents: DocumentInterface<Record<string, any>>[]) => {
  const result = documents.map((document) => `Title:${document.metadata.title}\nContent:${document.pageContent}\n`).join("------------------\n")
  return result
}

const fallbackSnippet = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.length > 200 ? `${normalized.slice(0, 200)}…` : normalized
}

const mapDocumentsToReferences = (documents: DocumentInterface<Record<string, unknown>>[] | null | undefined): LogSeqDocument[] => {
  if (!documents?.length) {
    return []
  }

  const references: LogSeqDocument[] = []

  for (const doc of documents) {
    const content = (doc.pageContent || '').trim()
    if (!content) {
      continue
    }

    references.push({
      title: typeof doc.metadata?.title === 'string' ? doc.metadata.title : 'Untitled Page',
      content: doc.pageContent,
      snippet: typeof doc.metadata?.snippet === 'string' && doc.metadata.snippet.trim().length
        ? doc.metadata.snippet
        : fallbackSnippet(doc.pageContent),
    })
  }

  return references
}

const extractWebSearchQuery = (query: string) => {
  if (!query) return null
  const match = query.trim().match(/^web\s+search[:\s]*(.*)$/i)
  if (!match) return null
  return match[1]?.trim() || null
}

const buildSourcesSection = (results: TavilySearchResult[]) => {
  const capped = results.slice(0, 5)
  if (!capped.length) {
    return '### Sources\n- 无可用链接'
  }

  const lines = capped.map((result, index) => {
    const title = result.title || `Source ${index + 1}`
    const url = result.url && result.url.trim().length ? result.url : '#'
    const score = Number.isFinite(result.score) ? ` (score: ${result.score.toFixed(2)})` : ''
    return `${index + 1}. [${title}](${url})${score}`
  }).join('\n')

  return `### Sources\n${lines}`
}

const buildDefaultSummary = (results: TavilySearchResult[]) => {
  if (!results.length) {
    return '### Tavily Search Summary\n未找到匹配的网页结果。'
  }

  const capped = results.slice(0, 5)
  const summaryLines = capped.map((result, index) => {
    const snippet = fallbackSnippet(result.content) || '暂无摘要'
    const title = result.title || 'Untitled'
    return `${index + 1}. **${title}** — ${snippet}`
  }).join('\n')

  return `### Tavily Search Summary\n${summaryLines}`
}

const formatResultsForPrompt = (results: TavilySearchResult[]) => {
  return results.slice(0, 5).map((result, index) => {
    const snippet = fallbackSnippet(result.content) || '暂无摘要'
    const title = result.title || 'Untitled'
    const url = result.url || 'N/A'
    return `Result [${index + 1}]\nTitle: ${title}\nURL: ${url}\nSummary: ${snippet}`
  }).join('\n\n')
}

const extractMessageText = (message: unknown): string => {
  if (!message) return ''
  if (typeof message === 'string') return message
  const candidate = message as { content?: unknown }
  if (typeof candidate.content === 'string') {
    return candidate.content
  }
  if (Array.isArray(candidate.content)) {
    return candidate.content.map((block) => {
      if (typeof block === 'string') return block
      if (block && typeof block === 'object' && 'text' in block) {
        return (block as { text?: string }).text || ''
      }
      return ''
    }).join('')
  }
  if (candidate.content && typeof candidate.content === 'object') {
    const text = (candidate.content as { text?: string }).text
    if (text) return text
  }
  return ''
}

const summarizeTavilyResults = async (
  model: unknown,
  query: string,
  results: TavilySearchResult[],
): Promise<string> => {
  const defaultSummary = buildDefaultSummary(results)
  if (!model || !results.length) {
    return defaultSummary
  }

  try {
    const promptContext = formatResultsForPrompt(results)
    const response = await (model as { invoke: (messages: BaseMessage[] | string) => Promise<unknown> }).invoke([
      new SystemMessage("You turn raw web search snippets into concise summaries. Always cite evidence using square brackets that reference the numbered results."),
      new HumanMessage(`User query: ${query}\n\nSearch results:\n${promptContext}\n\nWrite 2-3 bullet points that synthesize the findings. Each bullet must cite at least one source using [n] format referencing the numbered results above.`),
    ])

    const summaryText = extractMessageText(response).trim()
    if (!summaryText) {
      return defaultSummary
    }

    return summaryText.startsWith('###') ? summaryText : `### Tavily Search Summary\n${summaryText}`
  } catch (error) {
    console.error('Failed to summarize Tavily results', error)
    return defaultSummary
  }
}

const useChat = () => {
  const { settings } = useSettingsStore()
  const { showMessage } = useControlUI()
  const {chain, chainWithTools, tools, selectedModel, retrieveRelatedDocuments} = useLangChain()
  const { data: currentPage, error: currentPageError, isLoading: isPageLoading } = useGetCurrentPage()
  const { data: currentGraph } = useGetCurrentGraph()
  const { addMessage, addTextToMessage, messages, clearChat } = useChatStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const toolsByName = useMemo<Record<string, Runnable>>(() => {
    const tools: Record<string, Runnable> = {}
    
    // Only add Tavily if API key is provided
    if (settings.tavilyAPIKey && settings.tavilyAPIKey.trim() !== '') {
      console.log('✅ Adding Tavily to toolsByName')
      tools[tavilyTool.name] = tool(
        getTavilyTool(settings.tavilyAPIKey),
        tavilyTool,
      )
    } else {
      console.log('⚠️ Skipping Tavily in toolsByName - no API key')
    }
    
    // Always add URL scraper
    tools[cheerioTool.name] = tool(
      getURLContentTool,
      cheerioTool,
    )
    
    // Always add advanced query
    tools[advancedQueryTool.name] = tool(
      executeAdvancedQuery,
      advancedQueryTool,
    )
    
    console.log('🔧 toolsByName keys:', Object.keys(tools))
    
    return tools
  }, [settings.tavilyAPIKey])
  
  const chat = useCallback(async (query: string) => {
    if (chain && retrieveRelatedDocuments) {
      abortControllerRef.current = new AbortController()

      const page = currentPage as LogSeqPage | null
      const sessionKey: string = page?.name as string || '__global__'  // Global mode when no page
      const pageMessages = messages[sessionKey] || []

      const explicitWebQuery = extractWebSearchQuery(query)
      if (explicitWebQuery !== null) {
        addMessage(sessionKey, {
          id: uuidv4(),
          content: query,
          role: ChatMessageRoleEnum.User,
          relatedDocuments: [],
        })

        if (!settings.tavilyAPIKey || settings.tavilyAPIKey.trim() === '') {
          showMessage('请先在设置中填写 Tavily API Key', 'warning')
          return
        }

        setIsGenerating(true)
        try {
          const normalizedTerm = explicitWebQuery || query
          const tavilyResults = await fetchTavilyResults(settings.tavilyAPIKey, {
            query: normalizedTerm,
            topic: 'general',
          })

          const summarySection = await summarizeTavilyResults(selectedModel, normalizedTerm, tavilyResults)
          const sourcesSection = buildSourcesSection(tavilyResults)
          const responseContent = sourcesSection ? `${summarySection}\n\n${sourcesSection}` : summarySection

          addMessage(sessionKey, {
            id: uuidv4(),
            content: responseContent,
            role: ChatMessageRoleEnum.AI,
            relatedDocuments: [],
          })
        } catch (error) {
          console.error('Tavily Search failed', error)
          showMessage('Tavily Search 调用失败，请稍后重试。', 'error')
        } finally {
          setIsGenerating(false)
        }
        return
      }

      setIsGenerating(true)

      try {
        const documents = await retrieveRelatedDocuments(query)
        const referenceDocuments = mapDocumentsToReferences(documents)

        addMessage(sessionKey, {
          id: uuidv4(),
          content: query,
          role: ChatMessageRoleEnum.User,
          relatedDocuments: [],
        })

        const history = pageMessages.map((message: ChatMessage) => {
          if (message.role === ChatMessageRoleEnum.User) {
            return new HumanMessage(message.content)
          }
          return new AIMessage(message.content)
        })

        // Use custom ReAct agent
        if (tools && selectedModel) {
          console.log('🤖 Using custom ReAct agent')
          console.log('🔍 DEBUG: History length before agent:', history.length)
          console.log('🔍 DEBUG: Tools available:', tools.map(t => t.name))
          
          const modelWithTools = selectedModel.bindTools(tools)
          
          // CRITICAL: Only pass the NEW query, not the full history
          // The agent will handle multi-turn conversations within its own iterations
          // Passing old AI responses causes duplication!
          const agentIterator = executeReActAgent({
            modelWithTools,
            initialMessages: [new HumanMessage(query)],  // Only current query!
            documents: formatDocumentsAsString(documents || []),
            currentGraph: currentGraph || null,
            currentPage: currentPage || null,
            settings,
            toolsByName,
            signal: abortControllerRef.current?.signal,
            customSystemPrompt: settings.customSystemPrompt
          })
          
          const messageId = uuidv4()
          let previousContent = ''
          let isFirstYield = true
          let lastIterationProcessed = 0
          
          for await (const state of agentIterator) {
            console.log(`🔍 DEBUG: Agent iteration ${state.iterations}, total messages: ${state.messages.length}`)
            
            // Only look for final AI message in the CURRENT iteration to avoid showing old messages
            // We track which iteration we've processed to prevent duplication
            if (state.iterations <= lastIterationProcessed) {
              console.log(`🔍 DEBUG: Already processed iteration ${state.iterations}, skipping`)
              continue
            }
            
            // Find the MOST RECENT AI message WITHOUT tool calls (final response only)
            // Start from the end and find the first one (most recent)
            let lastAIMessage = null
            for (let i = state.messages.length - 1; i >= 0; i--) {
              const msg = state.messages[i]
              
              // Safety check: ensure message has the required methods
              if (!msg || typeof msg !== 'object') {
                console.warn(`⚠️ Malformed message at index ${i}:`, msg)
                continue
              }
              
              try {
                if (isAIMessage(msg)) {
                  const hasToolCalls = (msg as AIMessage).tool_calls && (msg as AIMessage).tool_calls!.length > 0
                  if (!hasToolCalls) {
                    lastAIMessage = msg
                    break
                  }
                }
              } catch (e) {
                console.error(`❌ Error checking message at index ${i}:`, e)
                continue
              }
            }
            
            console.log(`🔍 DEBUG: Found final AI message?`, !!lastAIMessage)
            
            if (lastAIMessage) {
              // Handle content that could be string, array of content blocks, or other formats
              let content = ''
              if (typeof lastAIMessage.content === 'string') {
                content = lastAIMessage.content
              } else if (Array.isArray(lastAIMessage.content)) {
                // Handle array of content blocks (common in newer LLM APIs)
                content = lastAIMessage.content
                  .map((block: any) => {
                    if (typeof block === 'string') return block
                    if (block.type === 'text' && block.text) return block.text
                    return ''
                  })
                  .join('')
              } else if (lastAIMessage.content && typeof lastAIMessage.content === 'object') {
                // Try to extract text from object format
                content = (lastAIMessage.content as any).text || ''
              }
              
              console.log(`🔍 DEBUG: Content type: ${typeof lastAIMessage.content}, isArray: ${Array.isArray(lastAIMessage.content)}`)
              console.log(`🔍 DEBUG: Raw content:`, lastAIMessage.content)
              console.log(`🔍 DEBUG: Content length: ${content.length}, Previous length: ${previousContent.length}`)
              console.log(`🔍 DEBUG: Content preview: "${content.substring(0, 100)}..."`)
              
              // Only update if content changed and is not empty
              if (content && content !== previousContent) {
                if (isFirstYield) {
                  console.log(`🔍 DEBUG: First yield - adding new message`)
                  addMessage(sessionKey, {
                    id: messageId,
                    content,
                    role: ChatMessageRoleEnum.AI,
                    relatedDocuments: referenceDocuments,
                  })
                  isFirstYield = false
                  previousContent = content
                } else {
                  // Only send the new chunk (difference between current and previous)
                  const newChunk = content.substring(previousContent.length)
                  console.log(`🔍 DEBUG: Appending chunk, length: ${newChunk.length}`)
                  console.log(`🔍 DEBUG: New chunk: "${newChunk}"`)
                  if (newChunk) {
                    addTextToMessage(sessionKey, messageId, newChunk)
                    previousContent = content
                  }
                }
              } else {
                console.log(`🔍 DEBUG: Skipping update - content unchanged or empty`)
              }
            }
            
            lastIterationProcessed = state.iterations
          }
          
          console.log('✅ Agent execution completed')
        } else if (chainWithTools) {
          // FALLBACK: Use chainWithTools for providers without full tool support
          
          const aiMessageWithTool = await chainWithTools.invoke({
            documents: formatDocumentsAsString(documents || []),
            history,
            kroki_visualization_prompt: '',
            query,
            current_graph_name: currentGraph?.name || '',
          }, {
            configurable: {
              sessionId: sessionKey,
            }
          })
  
          const tool_calls = (aiMessageWithTool as any).tool_calls
  
          if (tool_calls && tool_calls.length > 0) {
            // Build agent steps content - only for tracking, not for display
            const agentSteps: AgentStep[] = []
            
            // CRITICAL FIX: The original user query is not in history - it was passed as a template parameter
            // We need to add it to toolExecutionHistory to maintain proper message sequence
            // Sequence should be: USER query -> AI with tools -> tool results -> USER analysis request -> AI response
            const toolExecutionHistory: BaseMessage[] = [
              ...history,
              new HumanMessage(query),  // Add the original query that triggered the tool calls
              aiMessageWithTool as AIMessage
            ]
            
            // Execute tools and track steps
            for (let i = 0; i < tool_calls.length; i++) {
              const tool_call = tool_calls[i];
              const tool = toolsByName[tool_call.name]
              const toolLabel = getToolLabel(tool_call.name)
              
              if (tool) {
                agentSteps.push({
                  type: 'tool_call',
                  toolName: tool_call.name,
                  content: `🔍 ${toolLabel}...\n`,
                  timestamp: Date.now(),
                })
                
                console.log(`✅ Executing tool: ${tool_call.name}`, tool_call.args)
                
                // Execute tool
                const toolMessage = await tool.invoke(tool_call.args)
                toolExecutionHistory.push(toolMessage)
                
                // Show tool result summary - handle both string and object content
                const toolContent = typeof toolMessage.content === 'string' 
                  ? toolMessage.content 
                  : JSON.stringify(toolMessage.content || {})
                
                const resultSummary = formatToolResult(tool_call.name, toolContent)
                agentSteps.push({
                  type: 'tool_result',
                  toolName: tool_call.name,
                  content: resultSummary,
                  timestamp: Date.now(),
                })
              } else {
                console.error(`❌ Tool not found: ${tool_call.name}`)
                console.error('Available tools:', Object.keys(toolsByName))
              }
            }
            
            // For Gemini: After tool results, we MUST add a user message to the history
            // to maintain proper message sequencing: user -> AI with tools -> tool results -> USER -> AI final response
            // This is required by Gemini's strict function calling protocol
            toolExecutionHistory.push(new HumanMessage("Please provide your final analysis based on the tool results above."))
            
            const chainStream = await chainWithTools.stream({
              documents: formatDocumentsAsString(documents || []),
              history: toolExecutionHistory,
              kroki_visualization_prompt: settings.includeVisualization ? KROKI_VISUALIZATION_PROMPT : ' ',
              query: "",  // Empty query since we added the user message to history
              current_graph_name: currentGraph?.name || '',
            }, {
              configurable: {
                sessionId: sessionKey,
              },
              signal: abortControllerRef.current?.signal,
            })

            const messageId = uuidv4()
            let fullContent = ''  // Start with empty content - no agent steps clutter
            let i = 0

            for await (const chunk of chainStream) {
              // Extract text from chunk - handle both string and AIMessage chunks
              const chunkText = typeof chunk === 'string' 
                ? chunk 
                : (chunk as any)?.content || ''
              
              fullContent += chunkText
              
              if (i == 0) {
                addMessage(sessionKey, {
                  id: messageId,
                  content: fullContent,
                  role: ChatMessageRoleEnum.AI,
                  relatedDocuments: referenceDocuments,
                  agentSteps,  // Keep metadata but don't show in content
                })
              } else {
                addTextToMessage(sessionKey, messageId, chunkText as string)
              }
              i++
            }
          } else {
            // No tools called, just stream normally
            const chainStream = await chain.stream({
              documents: formatDocumentsAsString(documents || []),
              history,
              kroki_visualization_prompt: settings.includeVisualization ? KROKI_VISUALIZATION_PROMPT : ' ',
              query,
              current_graph_name: currentGraph?.name || '',
            }, {
              configurable: {
                sessionId: sessionKey,
              },
              signal: abortControllerRef.current?.signal,
            })

            const messageId = uuidv4()
            let i = 0

            for await (const chunkText of chainStream) {
              if (i == 0) {
                addMessage(sessionKey, {
                  id: messageId,
                  content: chunkText,
                  role: ChatMessageRoleEnum.AI,
                  relatedDocuments: referenceDocuments,
                })
              } else {
                addTextToMessage(sessionKey, messageId, chunkText as string)
              }
              i++
            }
          }
        } else {
          // No chainWithTools, just stream normally
          const chainStream = await chain.stream({
            documents: formatDocumentsAsString(documents || []),
            history,
            kroki_visualization_prompt: settings.includeVisualization ? KROKI_VISUALIZATION_PROMPT : ' ',
            query,
            current_graph_name: currentGraph?.name || '',
          }, {
            configurable: {
              sessionId: sessionKey,
            },
            signal: abortControllerRef.current?.signal,
          })

          const messageId = uuidv4()
          let i = 0

          for await (const chunkText of chainStream) {
            if (i == 0) {
              addMessage(sessionKey, {
                id: messageId,
                content: chunkText,
                role: ChatMessageRoleEnum.AI,
                relatedDocuments: referenceDocuments,
              })
            } else {
              addTextToMessage(sessionKey, messageId, chunkText as string)
            }
            i++
          }
        }
        setIsGenerating(false)
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          console.log('Generation aborted by user')
          showMessage("Generation stopped.", "success")
        } else {
          console.error(err)
          
          // Better error message for model not found
          if (err?.message?.includes('is not found') || err?.message?.includes('not supported')) {
            showMessage(`Model error: ${settings.geminiModel || settings.openAiModel || settings.chatGroqModel || 'Unknown'} is not available. Please select a different model in settings.`, "error")
          } else if (err?.status === 404 || err?.code === '404') {
            showMessage("Model not found. Please check your selected model in settings and ensure it's currently available.", "error")
          } else if (err?.message?.includes('API key')) {
            showMessage("API key error. Please check your API key in settings.", "error")
          } else {
            showMessage(`AI Provider error: ${err?.message || 'Unknown error'}. Please check your model selection and try again.`, "error")
          }
        }
        setIsGenerating(false)
      }      
    }
  }, [
    addMessage,
    addTextToMessage,
    chain,
    chainWithTools,
    currentPage,
    currentGraph,
    messages,
    retrieveRelatedDocuments,
    settings.includeVisualization,
    settings.geminiModel,
    settings.openAiModel,
    settings.chatGroqModel,
    settings.tavilyAPIKey,
    selectedModel,
    showMessage,
    toolsByName
  ])

  const clearAllChat = useCallback(() => {
    const sessionKey: string = currentPage?.name as string || '__global__'
    clearChat(sessionKey)
  }, [clearChat, currentPage])

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
    }
  }, [])

  return {
    chat,
    isLoading: isPageLoading,  // Use actual query loading state
    messages: (currentPage || !isPageLoading) ? messages[currentPage?.name as string || '__global__'] || [] : [],
    clearChat: clearAllChat,
    currentPageName: currentPage ? (currentPage.name as string) : '',
    error: currentPageError,
    isGenerating,
    stopGenerating,
  }
}

export default useChat