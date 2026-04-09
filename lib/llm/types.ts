export interface LLMProvider {
  name: string
  generateText(req: LLMRequest): Promise<LLMResponse>
  streamText(req: LLMRequest): AsyncGenerator<string>
}

export interface LLMRequest {
  system: string
  messages: LLMMessage[]
  maxTokens: number
  temperature?: number
  cacheSystem?: boolean // Enable prompt caching for the system prompt (Anthropic only)
}

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  text: string
  inputTokens: number
  outputTokens: number
  model: string
  latencyMs: number
}
