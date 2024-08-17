import "@logseq/libs";

import React from "react";
import * as ReactDOM from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import settings from './settings'
import App from "./App";
import GeminiContextProvider from './modules/gemini/components/GeminiContextProvider'
import "./index.css";

import { logseq as PL } from "../package.json";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

const queryClient = new QueryClient()

function main() {
  const root = ReactDOM.createRoot(document.getElementById("app")!);

  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <GeminiContextProvider>
          <App />
        </GeminiContextProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );

  function createModel() {
    return {
      show() {
        logseq.showMainUI();
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  const openIconName = "template-plugin-open";

  logseq.provideStyle(css`
    .${openIconName} {
      opacity: 0.55;
      font-size: 20px;
      margin-top: 4px;
    }

    .${openIconName}:hover {
      opacity: 0.9;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: openIconName,
    template: `
      <a id="${pluginId}" data-on-click="show" data-rect class="button">
          <i class="ti ti-world" style="font-size: 20px"></i>
      </a>
    `,
  });
}

logseq.useSettingsSchema(settings).ready(main).catch(console.error);
