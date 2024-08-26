import { z } from "zod";

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

export const getTavilyTool = (api_key: string) => async ({ topic, days, query }: {
  topic?: "general" | "news";
  days?: number;
  query: string;
}) => {
  const response = await fetch("https://api.tavily.com/search", {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      days,
      query,
      api_key,
    })
  })

  const responseJson = await response.json()

  return (responseJson['results'] || []).map((result: any) => `Title: ${result.title}
URL: ${result.url}
Content: ${result.content}
Score: ${result.score}\n`).join("------------------\n")
}

export const tavilyTool = {
  schema,
  name: "globalsearch",
  description: "Whenever user ask anything that doesn't exists on provided documents, you should directly decide use this tool to look for anything.",
}