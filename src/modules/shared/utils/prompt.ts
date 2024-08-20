import { Embedding } from "../types/gpt"

const MERMAIDJS_VISUALIZATION_PROMPT = `
If user ask you to visualize your explanation, or if you think that it's better to include visualization (flowchart, sequence diagram, pie chart, etc.),
or if user is explicitely ask for visualization, You could use this plugin's Mermaid.js feature. You could simply write your chat in Mermaid's syntax in your markdown response. For example:
FlowChart:
\`\`\`mermaid
flowchart LR
   a --> b & c--> d
\`\`\`

\`\`\`mermaid
flowchart TB
    A & B--> C & D
\`\`\`

Sequence Diagram:
\`\`\`mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!
\`\`\`

Entity Relationship Diagram:
\`\`\`mermaid
---
title: Order example
---
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
\`\`\`

User Journey:
\`\`\`mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
\`\`\`

Pie Chart:
\`\`\`mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\`\`\`

Mindmaps:
\`\`\`mermaid
mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
\`\`\`
`

export const buildPrompt = (
  query: string,
  relevantGeminiEmbeddings: Embedding[],
  relatedGeminiEmbeddings: Embedding[],
  includeVisualization: boolean
) => {  
  return `You are an AI assistant of a LogSeq plugin that will be used by LogSeq users.
Please answer user's query (please format your answer using markdown syntax) based on relevant documents below. When a document mentions another document's title by using this syntax: [[another document title]], it means that the document have relation with those other mentioned document.
Please answer only the query below based on the document, don't mention anything about LogSeq plugin, your output will be directly displayed to the users of this plugin.

${includeVisualization ? MERMAIDJS_VISUALIZATION_PROMPT : ''}

This is the document:

QUERY: ${query}
RELEVANT DOCUMENTS: 
${relevantGeminiEmbeddings.map((document, idx) => `Doc ${idx + 1}:\nDoc Title: ${document.title}\nDoc Content:\n${document.text}\n`)}
RELATED DOCUMENTS:
${relatedGeminiEmbeddings.map((document, idx) => `Doc ${idx + 1}:\nDoc Title: ${document.title}\nDoc Content:\n${document.text}\n`)}
`
}