import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { LogSeqSettings } from '../types/settings'
import { GeminiAIModelEnum } from '../../logseq/types/settings'

interface SettingState {
  settings: LogSeqSettings
  setSettings: (settings: LogSeqSettings) => void
}

const useSettingsStore = create<SettingState>()(
  devtools(
    persist(
      (set) => ({
        settings: {
          geminiApiKey: '',
          geminiModel: GeminiAIModelEnum.Gemini1_5Flash,
        },
        setSettings: (settings: LogSeqSettings) => set(() => ({ settings })),
      }),
      {
        name: 'settings-store',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
)

export default useSettingsStore