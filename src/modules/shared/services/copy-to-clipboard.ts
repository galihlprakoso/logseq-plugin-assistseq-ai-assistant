import { useCallback } from "react"

const useCopyToClipboard = () => {
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  return {
    copyToClipboard,
  }
}

export default useCopyToClipboard