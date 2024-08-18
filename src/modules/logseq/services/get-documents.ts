import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { useQuery } from 'react-query'
import { LogSeqDocument } from '../types/logseq'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isBlockEntity(obj: any): obj is BlockEntity {
  return obj && typeof obj === 'object' && 'content' in obj;
}

const BLACKLISTED_PAGES = ["a", "b", "c", "todo", "card", "done", "later", "doing"]
const MAX_RECURSION_DEPTH = 5

function isAllowedPage(content: string) {
  const dateRegex = /^(?!\b[A-Za-z]{3} \d{1,2}(st|nd|rd|th), \d{4}\b).+$/
  return dateRegex.test(content) && !BLACKLISTED_PAGES.includes(content)
}

const appendDocumentContent = async (block: BlockEntity, documents: LogSeqDocument[], memo: Record<string, boolean>, depth: number) => {  
  if (block.refs) {
    for(const ref of block.refs) {
      await getDocuments(ref.id, documents, memo, depth + 1)
    }
  }

  let content = `${Array(Math.max((block.level || 0) - 1))
      .fill(0).map(() => '\t').join('')}- ${block.content}\n`
      
  for(const children of (block.children || [])) {
    if (isBlockEntity(children)) {
      content += await appendDocumentContent(children, documents, memo, depth)
    }
  }

  return content
}

const getDocuments = async (pageName: string, documents: LogSeqDocument[], memo: Record<string, boolean>, depth: number) => {
  const page = await window.logseq.Editor.getPage(pageName)

  if (!page || depth >= MAX_RECURSION_DEPTH) return documents

  if (!isAllowedPage(page?.name)) {
    return documents
  }

  if (memo[page.name]) {
    return documents
  } else {
    memo[page.name] = true
  }

  let content = ""

  const blocks = await window.logseq.Editor.getPageBlocksTree(page.name)
  
  for(const block of blocks) {
    content += await appendDocumentContent(block, documents, memo, depth)
  }

  documents.push({
    title: page.name,
    content,
  })
  
  return documents
}

const useGetDocuments = (currentPage: string) => {
  return useQuery({
    queryFn: async (): Promise<LogSeqDocument[]> => {
      if (!currentPage) return []
      return getDocuments(currentPage, [], {}, 0)
    },
    queryKey: ['page-contents', currentPage],
    refetchOnWindowFocus: false,
  })
}

export default useGetDocuments