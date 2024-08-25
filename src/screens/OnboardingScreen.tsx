import React from "react"
import Card from '../modules/shared/components/Card'
import useControlUI from "../modules/logseq/hooks/control-ui"

type Props = object

const OnboardingScreen: React.FC<Props> = () => {

  const { showSettingsUI } = useControlUI()

  return (
    <Card className="h-full relative flex items-center justify-center flex-col p-4">
      <svg className="w-16 h-16 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5h9M5 9h5m8-8H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4l3.5 4 3.5-4h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"/>
      </svg>
      <h2 className="text-4xl text-gray-800 font-bold dark:text-white mt-4">Welcome!</h2>
      <p className="mb-3 text-gray-500 text-center dark:text-gray-400 mt-2">
        You can start using using this plugin by selecting a provider and putting your provider&apos;s API Key to this plugin&aposs configuration panel.
      </p>
      <button onClick={showSettingsUI} type="button" className="mt-4 px-5 py-2.5 text-sm font-medium text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        <svg className="w-4 h-4 text-white-800 dark:text-white mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.75 4H19M7.75 4a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 4h2.25m13.5 6H19m-2.25 0a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 10h11.25m-4.5 6H19M7.75 16a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 16h2.25"/>
        </svg>
        Go to Plugin&aposs Configuration
      </button>
    </Card>
  )
}

export default OnboardingScreen