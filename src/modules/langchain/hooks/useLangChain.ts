import { useContext } from "react"
import { LangChainProviderContext } from "../components/LangChainContextProvider"

const useLangChain = () => {
  const { chain } = useContext(LangChainProviderContext)

  return chain
}

export default useLangChain