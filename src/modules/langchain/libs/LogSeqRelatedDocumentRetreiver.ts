import {
  BaseRetriever,
  type BaseRetrieverInput,
} from "@langchain/core/retrievers"
import type { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager"
import { Document } from "@langchain/core/documents"
import { BlockEntity } from "@logseq/libs/dist/LSPlugin"
import { LogSeqSettings } from "../../logseq/types/settings"
import { LogSeqDocument } from "../../logseq/types/logseq"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LogSeqRelevantDocumentRetrieverInput extends BaseRetrieverInput {}

const DATE_PAGE_REGEX = /^(?!\b[A-Za-z]{3} \d{1,2}(st|nd|rd|th), \d{4}\b).+$/

export class LogSeqRelevantDocumentRetreiver extends BaseRetriever {
  lc_namespace = ["langchain", "retrievers"]

  constructor(fields?: LogSeqRelevantDocumentRetrieverInput) {
    super(fields)
  }

  private isBlockEntity(obj: unknown): obj is BlockEntity {
    return !!obj && typeof obj === 'object' && 'content' in obj
  }  
  
  async appendBlockContent(
    block: BlockEntity,
    depth: number,
    settings: LogSeqSettings,
    documents: LogSeqDocument[],
    visitedPages: Set<string>
  ): Promise<string> {
    if (block.refs) {
      for(const ref of block.refs) {
        await this.getDocumentsRecursively(ref.id, documents, visitedPages, depth + 1, settings)
      }
    }
  
    const indentation = `${'\t'.repeat(Math.max(0, (block.level || 0) - 1))}`
    let content = `${indentation}- ${block.content}\n`
  
    if (block.children) {
      for (const child of block.children) {
        if (this.isBlockEntity(child)) {
          const contentToBeAppended = await this.appendBlockContent(child, depth, settings, documents, visitedPages)
          if (!settings.blacklistedKeywords.split(",").some((keyword) => contentToBeAppended.includes(keyword))) {
            content += contentToBeAppended
          }
        }
      }
    }
  
    return content
  }
  
  async getDocumentsRecursively(
    pageName: string,
    documents: LogSeqDocument[],
    visitedPages: Set<string>,
    depth: number,
    settings: LogSeqSettings
  ): Promise<LogSeqDocument[]> {
    const page = await window.logseq.Editor.getPage(pageName)
    if (!page || depth >= settings.maxRecursionDepth) return documents
  
    const { blacklistedPages, blacklistedKeywords } = settings
    const blacklistedPagesSet = new Set(blacklistedPages.split(','))
    const blacklistedKeywordsSet = new Set(blacklistedKeywords.split(','))
  
    if (
      blacklistedPagesSet.has(page.name) ||
      Array.from(blacklistedKeywordsSet).some(keyword => page.name.includes(keyword)) ||
      (!settings.includeDatePage && !DATE_PAGE_REGEX.test(page.name))
    ) {
      return documents
    }
  
    if (visitedPages.has(page.name)) return documents
    visitedPages.add(page.name)
  
    let content = ''
    const blocks = await window.logseq.Editor.getPageBlocksTree(page.name)
  
    for (const block of blocks) {
      content += await this.appendBlockContent(block, depth, settings, documents, visitedPages)
    }
  
    documents.push({
      title: page.name,
      content,
    })
  
    for (const block of blocks) {
      if (block.refs) {
        for (const ref of block.refs) {        
          await this.getDocumentsRecursively(ref.id, documents, visitedPages, depth + 1, settings)
        }
      }
    }
  
    return documents
  }

  async _getRelevantDocuments(
    query: string,
    runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    const documents = await this.getDocumentsRecursively(
      this.metadata!.pageName as string,
      [],
      new Set(),
      0,
      this.metadata!.settings as LogSeqSettings,
    )

    return documents.map((doc) => new Document({
      pageContent: doc.content,
      metadata: {
        title: doc.title,
      }
    }))
  }
}