import { useEffect } from "react"
import useCurrentPageStore from "../stores/useCurrentPageStore"

const useGetCurrentPage = () => {
  const {setCurrentPage} = useCurrentPageStore()

  useEffect(() => {
    window.logseq.Editor.getCurrentPage().then((page) => {
      setCurrentPage(page?.name || '')
    })

    return () => {
      setCurrentPage('')
    }
  }, [setCurrentPage])
}

export default useGetCurrentPage