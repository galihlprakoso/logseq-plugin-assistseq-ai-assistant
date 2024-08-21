module.exports = {
  branches: ["master"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
      },
    ],
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    "@semantic-release/git",
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "zip -qq -r logseq-plugin-assistseq-ai-assistant-${nextRelease.version}.zip dist README.md logo.png LICENSE package.json",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: "logseq-plugin-assistseq-ai-assistant-*.zip",
      },
    ],
  ],
};
