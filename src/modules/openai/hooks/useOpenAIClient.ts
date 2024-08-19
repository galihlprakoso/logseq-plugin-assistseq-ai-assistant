import { useContext } from 'react'
import { OpenAIProviderContext } from '../components/OpenAIContextProvider'

const useOpenAIClient = () => {
  const openAI = useContext(OpenAIProviderContext)

  return openAI
}

export default useOpenAIClient