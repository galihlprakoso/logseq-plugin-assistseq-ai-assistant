import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { useQuery } from 'react-query'
import { LogSeqDocument } from '../types/logseq'
import { LogSeqSettings } from '../types/settings'

function isBlockEntity(obj: unknown): obj is BlockEntity {
  return !!obj && typeof obj === 'object' && 'content' in obj
}

const DATE_PAGE_REGEX = /^(?!\b[A-Za-z]{3} \d{1,2}(st|nd|rd|th), \d{4}\b).+$/

async function appendBlockContent(
  block: BlockEntity,
  depth: number,
  settings: LogSeqSettings,
  documents: LogSeqDocument[],
  visitedPages: Set<string>
): Promise<string> {
  if (block.refs) {
    for(const ref of block.refs) {
      await getDocumentsRecursively(ref.id, documents, visitedPages, depth + 1, settings)
    }
  }

  const indentation = `${'\t'.repeat(Math.max(0, (block.level || 0) - 1))}`
  let content = `${indentation}- ${block.content}\n`

  if (block.children) {
    for (const child of block.children) {
      if (isBlockEntity(child)) {
        const contentToBeAppended = await appendBlockContent(child, depth, settings, documents, visitedPages)
        if (!settings.blacklistedKeywords.split(",").some((keyword) => contentToBeAppended.includes(keyword))) {
          content += contentToBeAppended
        }
      }
    }
  }

  return content
}

async function getDocumentsRecursively(
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
    content += await appendBlockContent(block, depth, settings, documents, visitedPages)
  }

  documents.push({
    title: page.name,
    content,
  })

  for (const block of blocks) {
    if (block.refs) {
      for (const ref of block.refs) {        
        await getDocumentsRecursively(ref.id, documents, visitedPages, depth + 1, settings)
      }
    }
  }

  return documents
}

function useGetDocuments(currentPage: string, settings: LogSeqSettings) {
  return useQuery<LogSeqDocument[]>({
    queryFn: async () => {
      if (!currentPage) return []
      return getDocumentsRecursively(currentPage, [], new Set<string>(), 0, settings)
    },
    queryKey: ['page-contents', currentPage],
    refetchOnWindowFocus: false,
  })
}

export default useGetDocuments
