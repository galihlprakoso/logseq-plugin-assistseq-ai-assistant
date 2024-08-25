import { useCallback } from "react"

const useControlUI = () => {
  const hideMainUI = useCallback(() => {
    window.logseq.hideMainUI()
  }, [])

  const showSettingsUI = useCallback(() => {
    window.logseq.showSettingsUI()
  }, [])

  const showMessage = useCallback((message: string, status: "success" | "warning" | "error") => {
    window.logseq.UI.showMsg(message, status)
  }, [])

  return {
    hideMainUI,
    showSettingsUI,
    showMessage,
  }
}

export default useControlUI