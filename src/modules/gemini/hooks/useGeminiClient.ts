import { useContext } from 'react'
import { GeminiProviderContext } from '../components/GeminiContextProvider'

const useGeminiClient = () => {
  const gemini = useContext(GeminiProviderContext)

  return gemini
}

export default useGeminiClient