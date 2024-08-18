import { useMutation } from "react-query"

const useAppendBlockToPage = () => {

  return useMutation({
    mutationFn: async ({text}: {text: string}) => {
      const currentPage = await logseq.Editor.getCurrentPage()

      if (currentPage) {
        await logseq.Editor.appendBlockInPage(currentPage?.name, text)
      }
    },
    mutationKey: ['append-block-to-page']
  })
}

export default useAppendBlockToPage