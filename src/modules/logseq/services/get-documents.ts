import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { useQuery } from 'react-query'
import { LogSeqDocument } from '../types/logseq'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isBlockEntity(obj: any): obj is BlockEntity {
  return obj && typeof obj === 'object' && 'content' in obj;
}

function isPage(content: string) {
  return /\[\[.*?\]\]/.test(content)
}

const appendDocumentContent = async (block: BlockEntity, documents: LogSeqDocument[]) => {
  if (isPage(block.content)) {
    await getDocuments(block.refs[0].id, documents)
  }

  let content = `${Array(Math.max((block.level || 0) - 1))
      .fill(0).map(() => '\t').join('')}- ${block.content}\n`
      
  for(const children of (block.children || [])) {
    if (isBlockEntity(children)) {
      content += await appendDocumentContent(children, documents)
    }
  }

  return content
}

const getDocuments = async (pageName: string, documents: LogSeqDocument[]) => {
  const page = await window.logseq.Editor.getPage(pageName)

  if (!page) return documents

  let content = ""

  const blocks = await window.logseq.Editor.getPageBlocksTree(page.name)
  
  for(const block of blocks) {
    content += await appendDocumentContent(block, documents)
  }

  documents.push({
    title: page.name,
    content,
  })
  
  return documents
}

const useGetDocuments = () => {
  return useQuery({
    queryFn: async (): Promise<{pageName: string, documents: LogSeqDocument[]}> => {
      const currentPage = await window.logseq.Editor.getCurrentPage()

      if (!currentPage) return {pageName: '', documents: []}

      const documents = await getDocuments(currentPage.name, [])

      return {
        pageName: currentPage.name,
        documents,
      }
    },
    queryKey: ['page-contents'],
  })
}

export default useGetDocuments