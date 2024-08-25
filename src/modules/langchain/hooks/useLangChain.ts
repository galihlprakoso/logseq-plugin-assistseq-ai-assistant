import { useContext } from "react"
import { LangChainProviderContext } from "../components/LangChainContextProvider"

const useLangChain = () => {
  const langchain = useContext(LangChainProviderContext)

  return langchain
}

export default useLangChain