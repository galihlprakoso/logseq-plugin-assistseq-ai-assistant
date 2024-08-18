import React from "react"


// eslint-disable-next-line react/display-name, react/prop-types
const ChatBubble = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(({ children, className }, ref) => (
  <div ref={ref} className={`flex items-start gap-2.5 ${className}`}>
    <div className="flex flex-col w-full leading-1.5 p-4 border-gray-800 bg-gray-100 rounded-tl-xl rounded-es-xl rounded-tr-xl dark:bg-gray-700">
      {children}      
    </div>
  </div>
))

export default ChatBubble