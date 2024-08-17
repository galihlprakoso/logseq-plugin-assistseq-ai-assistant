import React from "react"


// eslint-disable-next-line react/display-name, react/prop-types
const Card = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLTextAreaElement>>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={`bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
))

export default Card