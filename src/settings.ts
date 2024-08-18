import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
import { GeminiAIModelEnum } from './modules/gemini/types/models';
import { AIProvider } from './modules/logseq/types/settings';

const settings: SettingSchemaDesc[] = [
  {
    key: 'provider',
    type: 'enum',
    title: 'GPT Provider',
    description: 'Choose your preferred provider. (Currently, this plugin only support Gemini).',
    default: AIProvider.Gemini,
    enumChoices: [
      AIProvider.Gemini,
    ]
  },
  {
    key: 'geminiApiKey',
    type: 'string',
    title: 'Gemini API Key',
    description: 'Your Gemini API Key. This key will saved locally.',
    default: '',
  },
  {
    key: 'geminiModel',
    type: 'enum',
    title: 'Gemini Model',
    description: 'Your Gemini API Key. This key will saved locally.',
    default: GeminiAIModelEnum.Gemini1_5Flash,
    enumChoices: [
      GeminiAIModelEnum.Gemini1_5Flash,
      GeminiAIModelEnum.Gemini1_5Pro,
      GeminiAIModelEnum.Gemini1_0Pro,
    ]
  },
  {
    key: 'blacklistedPages',
    type: 'string',
    title: 'Blacklisted Pages',
    description: 'Put page name titles separated in commas. These pages will not be included as a context on any AI Conversations.',
    default: 'a,b,c,todo,card,done,later,doing',
  },
  {
    key: 'blacklistedKeywords',
    type: 'string',
    title: 'Blacklisted Keywords',
    description: 'Put some keywords, blocks or pages containing these words will not be included as a context on any AI Conversations..',
    default: 'pass,api key,confidential,password',
  },
  {
    key: 'maxRecursionDepth',
    type: 'number',
    title: 'Document Relational Depth',
    description: 'How deep is the documents related to the current document will be included.',
    default: 5,
  },
];

export default settings;
