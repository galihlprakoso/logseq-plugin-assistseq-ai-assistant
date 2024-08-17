import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
import { GeminiAIModelEnum } from './modules/logseq/types/settings'

const settings: SettingSchemaDesc[] = [
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
];

export default settings;
