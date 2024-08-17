import React, { useCallback, useRef } from "react";
import { useAppVisible } from "./utils";
import useControlUI from './modules/logseq/services/control-ui'
import useListenSettings from './modules/logseq/services/listen-settings'
import NavigationView from "./modules/shared/components/NavigationView"

function App() {
  useListenSettings()

  const innerRef = useRef<HTMLDivElement>(null);
  const visible = useAppVisible();
  const { hideMainUI } = useControlUI()

  const onBackdropClicked = useCallback<React.MouseEventHandler<HTMLElement>>((e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!innerRef.current?.contains(e.target as any)) {
      hideMainUI()
    }
  }, [hideMainUI])

  if (visible) {
    return (
      <main
        className="backdrop-filter backdrop-blur-md fixed inset-0 flex items-center justify-center"
        onClick={onBackdropClicked}
      >        
        <div ref={innerRef} className="w-4/5 h-4/5">
          <NavigationView />
        </div>
      </main>
    );
  }

  return null;
}

export default App;
