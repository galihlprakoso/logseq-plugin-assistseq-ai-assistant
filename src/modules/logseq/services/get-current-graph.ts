import { useQuery } from "react-query"

const useGetCurrentGraph = () => {
  return useQuery({
    queryFn: () => {
      return window.logseq.App.getCurrentGraph()
    },
    queryKey: ['get-current-graph'],
    refetchOnWindowFocus: false,
  })
}

export default useGetCurrentGraph