import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

type Props = {
  chart: string
  className?: string
}

const MermaidRenderer: React.FC<Props> = ({ chart, className }) => {
  const mermaidRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
    if (mermaidRef.current) {
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <div ref={mermaidRef} className={`mermaid ${className}`}>
      {chart}
    </div>
  );
};

export default MermaidRenderer;