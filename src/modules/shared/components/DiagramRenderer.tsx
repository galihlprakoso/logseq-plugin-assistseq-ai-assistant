import React, { useMemo, useState } from "react"
import pako from 'pako'
import LoadingIndicator from "./LoadingIndicator";

type Props = {
  diagram: string
  provider: string | null
  className?: string
}

function textEncode(str: string) {
  if (window.TextEncoder) {
    return new TextEncoder().encode(str);
  }
  const utf8 = unescape(encodeURIComponent(str));
  const result = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) {
    result[i] = utf8.charCodeAt(i);
  }
  return result;
}

const encodeDiagram = (diagram: string) => {
  const data = textEncode(diagram);
  const compressed_uint8array = pako.deflate(data);
  
  const byteArray = Array.from(compressed_uint8array);

  const binaryString = String.fromCharCode.apply(null, byteArray);

  const b64encoded_string = btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_');

  return b64encoded_string;
}

const DiagramRenderer: React.FC<Props> = ({ diagram, provider, className }) => {
  const [loading, setLoading] = useState(true)

  const url = useMemo(() => {
    if (diagram && provider) return `https://kroki.io/${provider}/svg/${encodeDiagram(diagram)}`

    return null
  }, [diagram, provider])

  return (
    <div className={`relative ${className}`}>
      {url ? (
        <>
        <img
          className="min-w-32 min-h-32"
          src={url}
          onLoad={() => setLoading(false)}
        />
        {loading ? (
          <div className="absolute top-0 bottom-0 left-0 right-0">
            <LoadingIndicator text="Loading visualization..." />
          </div>
        ) : null}
        </>
      ) : (
        <div className={`relative ${className}`}>
          <p className="mb-3 text-gray-500 dark:text-gray-400">Invalid visualization syntax.</p>
        </div>
      )}
    </div>
  )
}

export default DiagramRenderer