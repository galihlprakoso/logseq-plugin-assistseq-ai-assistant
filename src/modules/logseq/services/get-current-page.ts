import { useQuery } from "react-query"

const useGetCurrentPage = () => {
  return useQuery({
    queryFn: () => {
      return window.logseq.Editor.getCurrentPage()
    },
    queryKey: ['get-current-page']
  })
}

export default useGetCurrentPage