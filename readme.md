# BrainSeq - AI Assistant

This plugin will analyze the currently open document and all related documents, utilizing them as context for your conversation with the your favourite GPT Model.

## Todo
- [x] Add Terms & Conditions Page
- [x] Add OpenAI Provider
- [ ] Add Ollama Provider (Local)
- [x] Add Setting to Blacklist with keyword
- [x] Add Setting to Blacklist Page names
- [ ] Add Context Choice 
  - Current Page
  - Select Page
- [ ] Add Setting to Include Related Documents or not
- [ ] Replace Embedding with LogSeq query

## How to get started
1. Clone the repository or use the button "Use this template" on GitHub to create your own version of the repository 🔨
2. Make sure you have pnpm installed, [install](https://pnpm.io/installation) if necessary 🛠
3. Execute `pnpm install` 📦
4. Change the plugin-name in `package.json` to your liking. Adapt both the package-name and the plugin-id at the bottom of the `package.json`. Make sure that they are not conflicting with plugins you already installed. 📝
5. Execute `pnpm build` to build the plugin 🚧
6. Enable developer-mode in Logseq, go to plugins, select "Load unpacked plugin" 🔌
7. Select the directory of your plugin (not the `/dist`-directory, but the directory which includes your package.json) 📂
8. Enjoy! 🎉
