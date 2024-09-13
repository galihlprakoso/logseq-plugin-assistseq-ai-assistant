import { BlockEntity } from "@logseq/libs/dist/LSPlugin";
import { z } from "zod";
import { LogSeqDocument } from "../../logseq/types/logseq";

export const schema = z.object({
  keywords: z.string().min(2).max(500)
    .describe("Please give comma separated keywords (e.g keyword1,keyword2) you want to search from LogSeq documents."),
  limit: z.number().min(3).max(10).describe("Give limit to documents result."),
});

export const getLogSeqDocumentsSearchTool = async ({ keywords, limit }: {keywords: string, limit: number}) => {
    const query = `[:find (pull ?b [*])
          :where
          [?b :block/content ?content]
          (or ${keywords.split(",").map((keyword) => `[(clojure.string/includes? ?content "${keyword}")]`).join('\n')})]`;
    const collections = await window.logseq.DB.datascriptQuery<BlockEntity[][]>(
        query,
    );

    const documents: LogSeqDocument[] = []

    for (let i = 0; i < collections.length; i++) {
        const collection = collections[i];
        
        if (collection.length > 0) {
            const document = collection[0]

            const block = await window.logseq.Editor.getBlock(document.uuid)

            if (!block?.uuid) continue

            let content = `${block.content}\n`

            if (block.children && block.children.length > 0) {
                for (let j = 0; j < block.children.length; j++) {
                    const element = block.children[j];

                    if (element.length > 1) {
                        const block = await window.logseq.Editor.getBlock(element[1])
                        content += `- ${block?.content}`
                    }
                }
            }

            documents.push({
                title: block.uuid,
                content,
            })
        }        
    }    

    return documents.slice(0, Math.max(documents.length, limit)).map((doc) => `${doc.content}\n======================`).join("\n")
}

const NAME = "logseq_documents_search"
const DESC = "You can use this tool to search additional LogSeq documents to enrich your answer."

export const logSeqDocumentSearchTool = {
  schema,
  name: NAME,
  description: DESC,
}

export const logSeqDocumentSearchToolGroq = {
  "type": "function",
  "function": {
      "name": NAME,
      "description": DESC,
      "parameters": {
          "type": "object",
          "properties": {
              "keywords": {
                  "type": "string",
                  "description": "Please give comma separated keywords (e.g keyword1,keyword2) you want to search from LogSeq documents.",
              },
              "limit": {
                  "type": "number",
                  "description": 'Give limit to documents result. Min 3 and max 10.',
              },
          },
          "required": ["keywords", "limit"],
      },
  },
}