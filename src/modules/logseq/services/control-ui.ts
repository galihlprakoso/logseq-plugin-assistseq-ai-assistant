import { useCallback } from "react"

const useControlUI = () => {
  const hideMainUI = useCallback(() => {
    window.logseq.hideMainUI()
  }, [])

  const showSettingsUI = useCallback(() => {
    window.logseq.showSettingsUI()
  }, [])

  return {
    hideMainUI,
    showSettingsUI,
  }
}

export default useControlUI