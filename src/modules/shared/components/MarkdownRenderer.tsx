import React, { ReactNode } from 'react'
import Markdown from 'markdown-to-jsx'
import MermaidRenderer from './MermaidRenderer'

type Props = {
  markdown: string
  className?: string
}

const H1: React.FC<React.HTMLProps<HTMLHeadingElement>> =
  ({children, ...props}) => <h1 {...props}>{children}</h1>
const H2: React.FC<React.HTMLProps<HTMLHeadingElement>> =
  ({children, ...props}) => <h2 {...props}>{children}</h2>
const H3: React.FC<React.HTMLProps<HTMLHeadingElement>> =
  ({children, ...props}) => <h3 {...props}>{children}</h3>
const H4: React.FC<React.HTMLProps<HTMLHeadingElement>> =
  ({children, ...props}) => <h4 {...props}>{children}</h4>
const P: React.FC<React.HTMLProps<HTMLParagraphElement>> =
  ({children, ...props}) => <p {...props}>{children}</p>
const BQ: React.FC<React.HTMLProps<HTMLQuoteElement>> =
  ({children, ...props}) => (
    <blockquote {...props}>
      <p>{children}</p>
    </blockquote>
  )
const UL: React.FC<React.HTMLProps<HTMLUListElement>> =
  ({children, ...props}) => (
    <ul {...props}>
      {children}
    </ul>
  )
const OL: React.FC<React.HTMLProps<HTMLOListElement>> =
  ({children, ...props}) => (
    //@ts-ignore
    <ol {...props}>
      {children}
    </ol>
  )
const LI: React.FC<React.HTMLProps<HTMLLIElement>> =
  ({children, ...props}) => (
    <li {...props}>
      {children}
    </li>
  )
const A: React.FC<React.HTMLProps<HTMLAnchorElement>> =
  ({children, ...props}) => (
    <a {...props}>
      {children}
    </a>
  )

const CODE_LANG_MERMAID = "lang-mermaid"

const CODE: React.FC<React.HTMLProps<HTMLDivElement>> = ({children, ...props}) => {
  
  // eslint-disable-next-line react/prop-types
  if (props.className === CODE_LANG_MERMAID) {
    return (
      <MermaidRenderer chart={children as string} className="w-full" />
    )
  }

  return <code>{children}</code>
}

const MarkdownRenderer: React.FC<Props> = ({markdown, className}) => {
  return (
    <div className={className}>
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
            },
            text: {
              component: P,
              props: {
                className: "mb-3 text-gray-800 dark:text-gray-400",
              }
            },
            ul: {
              component: UL,
              props: {
                className: "space-y-2 text-gray-800 list-disc list-inside dark:text-gray-400 mb-3",
              }
            },
            ol: {
              component: OL,
              props: {
                className: "space-y-2 text-gray-800 list-decimal list-inside dark:text-gray-400",
              }
            },
            li: {
              component: LI,
              props: {
                className: "text-gray-800 dark:text-gray-400 ml-4",
              }
            },
            a: {
              component: A,
              props: {
                className: "font-medium text-primary-800 underline dark:text-primary-500 hover:no-underline",
              }
            },
            code: CODE,
          },
        }}
      >
        {markdown}
      </Markdown>
    </div>
  )
}

export default MarkdownRenderer