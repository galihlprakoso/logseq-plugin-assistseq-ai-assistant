export enum GeminiAIModelEnum {
  // Gemini 2.5 (Latest)
  Gemini25Pro = 'gemini-2.5-pro',
  Gemini25Flash = 'gemini-2.5-flash',
  Gemini25FlashPreview = 'gemini-2.5-flash-preview-09-2025',
  
  // Gemini 2.0
  Gemini20Flash = 'gemini-2.0-flash',
  Gemini20FlashExp = 'gemini-2.0-flash-exp',
  Gemini20FlashLite = 'gemini-2.0-flash-lite',
  
  // Gemini 1.5
  Gemini15Pro = 'gemini-1.5-pro',
  Gemini15Pro002 = 'gemini-1.5-pro-002',
  Gemini15Flash = 'gemini-1.5-flash',
  Gemini15Flash002 = 'gemini-1.5-flash-002',
  Gemini15Flash8B = 'gemini-1.5-flash-8b',
  
  // Legacy
  GeminiPro = 'gemini-pro',
  
  // Embedding
  TextEmbedding004 = 'text-embedding-004'
}

export enum OpenAIModelEnum {
  GPT4o = 'gpt-4o',
  GPT4oMini = 'gpt-4o-mini',
  GPT4Turbo = 'gpt-4-turbo',
  GPT4 = 'gpt-4',
  GPT3_5Turbo = 'gpt-3.5-turbo',
  O1Preview = 'o1-preview',
  O1Mini = 'o1-mini',
}

export enum ChatGroqModelEnum {
  llama_3_3_70b_versatile = 'llama-3.3-70b-versatile',
  llama_3_1_70b_versatile = 'llama-3.1-70b-versatile',
  llama_3_1_8b_instant = 'llama-3.1-8b-instant',
  llama3_70b_8192 = 'llama3-70b-8192',
  llama3_8b_8192 = 'llama3-8b-8192',
  gemma2_9b_it = 'gemma2-9b-it',
  mixtral_8x7b_32768 = 'mixtral-8x7b-32768',
}

export enum OllamaModelEnum {
  llama3_3 = 'llama3.3',
  llama3_2 = 'llama3.2',
  llama3_1 = 'llama3.1',
  llama3 = 'llama3',
  gemma2 = 'gemma2',
  mistral_nemo = 'mistral-nemo',
  qwen2 = 'qwen2',
  deepseek_coder_v2 = 'deepseek-coder-v2',
  phi3 = 'phi3',
  mistral = 'mistral',
  mixtral = 'mixtral',
  codegemma = 'codegemma',
  command_r = 'command-r',
  command_r_plus = 'command-r-plus',
  llava = 'llava',
  gemma = 'gemma',
  codellama = 'codellama',
}

export enum OllamaEmbeddingModelEnum {
  mxbai_embed_large = 'mxbai-embed-large',
  nomic_embed_text = 'nomic-embed-text',
  all_minilm = 'all-minilm',
}

export enum OpenRouterModelEnum {
  AnthropicClaudeSonnet = 'anthropic/claude-3.5-sonnet',
  AnthropicClaudeOpus = 'anthropic/claude-3-opus',
  OpenAIGPT4o = 'openai/gpt-4o',
  OpenAIGPT4oMini = 'openai/gpt-4o-mini',
  OpenAIO1 = 'openai/o1',
  OpenAIO1Preview = 'openai/o1-preview',
  OpenAIO1Mini = 'openai/o1-mini',
  OpenAIGPT51Chat = 'openai/gpt-5.1-chat',
  OpenAIO4Mini = 'openai/o4-mini',
  GoogleGemini2Flash = 'google/gemini-2.0-flash-exp',
  GoogleGeminiPro = 'google/gemini-pro-1.5',
  GoogleGemini3ProPreview = 'google/gemini-3-pro-preview',
  GoogleGeminiEmbedding001 = 'google/gemini-embedding-001',
  GoogleGemini25Flash = 'google/gemini-2.5-flash',
  GoogleGemini25Pro = 'google/gemini-2.5-pro',
  MetaLlama3_370B = 'meta-llama/llama-3.3-70b-instruct',
  MetaLlama3_1405B = 'meta-llama/llama-3.1-405b-instruct',
  MistralLarge = 'mistralai/mistral-large',
  DeepSeekChat = 'deepseek/deepseek-chat',
}

export enum ClaudeModelEnum {
  Claude35Sonnet20241022 = 'claude-3-5-sonnet-20241022',
  Claude35Haiku20241022 = 'claude-3-5-haiku-20241022',
  Claude3Opus20240229 = 'claude-3-opus-20240229',
  Claude3Haiku20240307 = 'claude-3-haiku-20240307',
}

export enum MistralModelEnum {
  MistralLarge = 'mistral-large-latest',
  MistralSmall = 'mistral-small-latest',
  Codestral = 'codestral-latest',
  Mixtral8x7B = 'open-mixtral-8x7b',
}