import React, { ReactNode } from 'react'
import Markdown from 'markdown-to-jsx'

type Props = {
  markdown: string
}

const H1: React.FC<{children: ReactNode}> =
  ({children, ...props}) => <h1 {...props}>{children}</h1>
const H2: React.FC<{children: ReactNode}> =
  ({children, ...props}) => <h2 {...props}>{children}</h2>
const H3: React.FC<{children: ReactNode}> =
  ({children, ...props}) => <h3 {...props}>{children}</h3>
const H4: React.FC<{children: ReactNode}> =
  ({children, ...props}) => <h4 {...props}>{children}</h4>
const P: React.FC<{children: ReactNode}> =
  ({children, ...props}) => <p {...props}>{children}</p>
const BQ: React.FC<{children: ReactNode}> =
  ({children, ...props}) => (
    <blockquote {...props}>
      <p>{children}</p>
    </blockquote>
  )

const MarkdownRenderer: React.FC<Props> = ({markdown}) => {
  return (
    <Markdown
        options={{
          overrides: {
            h1: {
              component: H1,
              props: {
                className: "text-4xl text-gray-800 font-extrabold dark:text-white",
              },
            },
            h2: {
              component: H2,
              props: {
                className: "text-3xl text-gray-800 font-extrabold dark:text-white",
              },
            },
            h3: {
              component: H3,
              props: {
                className: "text-2xl text-gray-800 font-extrabold dark:text-white",
              },
            },
            h4: {
              component: H4,
              props: {
                className: "text-xl text-gray-800 font-extrabold dark:text-white",
              },
            },
            p: {
              component: P,
              props: {
                className: "mb-3 text-gray-800 dark:text-gray-400",
              }
            },
            blockquote: {
              component: BQ,
              props: {
                className: "text-xl italic font-semibold text-gray-900 dark:text-white",
              }
            }
          },
        }}
      >
        {markdown}
    </Markdown>
  )
}

export default MarkdownRenderer