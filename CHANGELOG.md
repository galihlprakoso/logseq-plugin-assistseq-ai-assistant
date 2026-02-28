## [Unreleased]

### Features

* add OpenRouter Gemini embedding and Q&A model options
* allow selecting OpenRouter as embedding provider and choosing its embedding model
* extend OpenRouter model list with GPT-5.1 Chat, O4 Mini, and Gemini 2.5 Flash/Pro
* embed referenced Logseq notes with the selected provider and surface citations in chat answers
* allow entering any OpenRouter model slug instead of picking from a fixed list
* allow free-form OpenRouter embedding model selection
* sanitize OpenRouter model inputs to avoid empty-model API errors
* filter citation list to only include meaningful notes and show inline snippets
* add in-app Tavily search toggle button and cap default search results at 10
* detect "web search" commands and run Tavily directly to avoid provider errors

# [2.8.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.7.0...v2.8.0) (2025-11-08)


### Features

* added keyboard command [#17](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/issues/17) ([bc9205f](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/bc9205fa50d01e73f3e55bf9e5a0d8b0af792fc6))

# [2.7.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.6.1...v2.7.0) (2025-11-08)


### Bug Fixes

* missing default value ([a025d07](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/a025d073303804a750acece3da471329946d824e))


### Features

* added custom system prompt [#16](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/issues/16) ([a807980](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/a807980cc397d2f38756d28803592792035354f6))

## [2.6.1](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.6.0...v2.6.1) (2025-11-08)


### Bug Fixes

* ensure CI compatibility with latest dependencies ([1d1b7ca](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/1d1b7ca2647644a0630b535e01d04f4a1413a91f))

# [2.6.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.5.0...v2.6.0) (2025-11-08)


### Bug Fixes

* improve type safety and null handling ([67469f4](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/67469f470f8360d240800359008026b0e769d0e7))


### Features

* add global mode and improve chat session handling ([9a8368a](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/9a8368ac446be1ac06cadfd799a328e89dfd3b11))
* add stop generation button and improved error handling ([d4a170a](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/d4a170ae7e9be1ab92580492ca9f21870c2a6fe4))
* add support for Claude, Mistral, and OpenRouter AI providers ([5b0a756](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/5b0a75621c41c8329a64fdef6419e8922eecce26))
* implement ReAct agent with advanced Datalog query capabilities ([91be478](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/91be4788ddec512b50f2e12fc27db36fcce5cf94))
* update plugin icon name ([54c8d27](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/54c8d27d19f329ac8444883fee557ed926bd64f6))

# [2.5.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.4.0...v2.5.0) (2024-09-25)


### Features

* added OpenAI custom base path in settings ([aafd394](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/aafd394c1690a0eee0ba750eae66f7f29a0ec529))
* added OpenAI custom base path in settings ([0634130](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/0634130f62329365f0c39d42ef69d2859a131168))

# [2.4.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.3.1...v2.4.0) (2024-09-13)


### Features

* added LogSeq page reference linking Issue: [#6](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/issues/6) ([12d80b1](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/12d80b1f9cb2edfbe62d9699bbe15edd8149ff7e))

## [2.3.1](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.3.0...v2.3.1) (2024-09-09)


### Bug Fixes

* enhance kroki visualization prompt ([af1ce95](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/af1ce9560997fff707b33433be387fc2ec6d2090))

# [2.3.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.2.0...v2.3.0) (2024-08-31)


### Features

* fix kroki diagram visualization prompt ([830da21](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/830da21ac320ad69b3412b545df1b9faa00e6750))

# [2.2.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.1.0...v2.2.0) (2024-08-29)


### Features

* added groq provider support ([#5](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/issues/5)) ([17574e0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/17574e0bf1aa418dec4c98933437af5ac9b71834))

# [2.1.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v2.0.0...v2.1.0) (2024-08-26)


### Features

* move session storage to local storage and add web scrapping tool ([#4](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/issues/4)) ([b626885](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/b62688504a1d25df079b4492c0436faef3460c72))

# [2.0.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v1.2.0...v2.0.0) (2024-08-25)

# [1.2.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v1.1.3...v1.2.0) (2024-08-23)


### Features

* Add Ollama LLM Support ([#2](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/issues/2)) ([dd79f17](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/dd79f17ed369c6527cf23de4672c6af36fc64d91))

## [1.1.3](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v1.1.2...v1.1.3) (2024-08-23)


### Bug Fixes

* flaky chat experience, inversed scroll, and add auto scroll ([86dce01](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/86dce01d3d6068a3e8b70f90c4b030a9f79d17aa))

## [1.1.2](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v1.1.1...v1.1.2) (2024-08-22)


### Bug Fixes

* fix visualization feature error: https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/issues/1 ([1357f9c](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/1357f9c00e9a545df003e4cee5efc32c22e49f8a))

## [1.1.1](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v1.1.0...v1.1.1) (2024-08-20)


### Bug Fixes

* fix readme failed to fetch images ([509a029](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/509a02951bba4ac724081f5eed616fb186be9c9c))

# [1.1.0](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v1.0.1...v1.1.0) (2024-08-20)


### Bug Fixes

* handle shift + enter on text area input ([6117d2d](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/6117d2d2c3f63960d0afdab05df8f46f7bee70e4))
* prevent empty query submission ([084a51d](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/084a51d0aa01552368b50d075b768ba321a7b3d7))


### Features

* AI's response visualization using mermaid.js ([f3a57f3](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/f3a57f3d60cb1b326496f8a6ff6dd930d4d5796f))

## [1.0.1](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/compare/v1.0.0...v1.0.1) (2024-08-20)


### Bug Fixes

* correct typo in the documentation ([c85c6db](https://github.com/galihlprakoso/logseq-plugin-assistseq-ai-assistant/commit/c85c6dbb3abb7ebe5462e95f2f68a46ce0552ff1))
