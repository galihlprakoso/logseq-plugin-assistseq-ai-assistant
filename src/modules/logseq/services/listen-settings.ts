import { useEffect } from "react"
import useSettingsStore from "../../shared/stores/useSettingsStore"

const useListenSettings = () => {
  const {setSettings} = useSettingsStore()

  useEffect(() => {
    const unlisten = window.logseq.onSettingsChanged((newSettings) => {
      setSettings({
        geminiApiKey: newSettings.geminiApiKey,
        geminiModel: newSettings.geminiModel,
      })
    })

    return () => unlisten()
  }, [setSettings])
}

export default useListenSettings