import { z } from "zod";

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

type TavilySearchParams = {
  topic?: "general" | "news";
  days?: number;
  query: string;
}

export const schema = z.object({
  topic: z
    .enum(["general", "news"])
    .describe("The category of the document search. (optional)")
    .optional(),
  days: z.number()
    .describe('The number of days back from the current date to include in the search results. Please note that this feature is only available when using the "news" search topic. Default is 3. (optional)')
    .optional(),
  query: z.string().describe("The search query you want to execute. (required)"),
});

const TAVILY_ENDPOINT = "https://api.tavily.com/search"

const requestTavilyJson = async (apiKey: string, params: TavilySearchParams) => {
  const response = await fetch(TAVILY_ENDPOINT, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: params.topic,
      days: params.days,
      query: params.query,
      max_results: 10,
      api_key: apiKey,
    })
  })

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`)
  }

  return response.json()
}

export const fetchTavilyResults = async (apiKey: string, params: TavilySearchParams): Promise<TavilySearchResult[]> => {
  const json = await requestTavilyJson(apiKey, params)
  return (json?.results || []).map((result: any) => ({
    title: result.title || 'Untitled',
    url: result.url || '',
    content: result.content || '',
    score: typeof result.score === 'number' ? result.score : 0,
  }))
}

const formatResultsForTool = (results: TavilySearchResult[]) => {
  if (!results.length) {
    return "No search results returned."
  }

  return results.map((result) => `Title: ${result.title}
URL: ${result.url}
Content: ${result.content}
Score: ${result.score}\n`).join("------------------\n")
}

export const getTavilyTool = (api_key: string) => async ({ topic, days, query }: TavilySearchParams) => {
  const results = await fetchTavilyResults(api_key, { topic, days, query })
  return formatResultsForTool(results)
}

const NAME = "global_search"
const DESC = "Whenever user ask anything that doesn't exists on provided documents, or you want to enrich the query result, you should directly decide use this tool to look for anything."

export const tavilyTool = {
  schema,
  name: NAME,
  description: DESC,
}

export const tavilyToolGroq = {
  "type": "function",
  "function": {
      "name": NAME,
      "description": DESC,
      "parameters": {
          "type": "object",
          "properties": {
              "topic": {
                  "type": "string",
                  "description": "You should choose exact value between: general or news",
              },
              "days": {
                  "type": "number",
                  "description": 'The number of days back from the current date to include in the search results. Please note that this feature is only available when using the "news" search topic. Default is 3. (optional)',
              },
              "query": {
                  "type": "string",
                  "description": 'The search query you want to execute. (required)',
              },
          },
          "required": ["query"],
      },
  },
}