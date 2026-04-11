import { GoogleGenerativeAI } from '@google/generative-ai'
import { createLogger } from '@/lib/logger'
import { logTelemetryTokenUsage } from '@/lib/telemetry'
import type { LLMProvider, LLMRequest, LLMResponse } from '@/lib/llm/types'

const log = createLogger('llm:gemini')

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini'
  private genAI: GoogleGenerativeAI
  private model: string

  constructor(model = 'gemini-2.5-flash') {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error(
        'GOOGLE_AI_API_KEY environment variable is required for GeminiProvider'
      )
    }
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async generateText(req: LLMRequest): Promise<LLMResponse> {
    const timer = log.time(`generateText [${this.model}]`)

    const model = this.genAI.getGenerativeModel({ model: this.model })

    const contents = req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const result = await model.generateContent({
      contents,
      systemInstruction: req.system,
      generationConfig: {
        maxOutputTokens: req.maxTokens,
        ...(req.temperature !== undefined && { temperature: req.temperature }),
      },
    })

    const text = result.response.text()
    const usage = result.response.usageMetadata

    const inputTokens = usage?.promptTokenCount ?? 0
    const outputTokens = usage?.candidatesTokenCount ?? 0

    const latencyMs = timer.end({
      model: this.model,
      inputTokens,
      outputTokens,
    })

    logTelemetryTokenUsage({
      agent: req.agentId || 'unknown',
      provider: this.name,
      model: this.model,
      inputTokens,
      outputTokens,
      latencyMs,
    })

    return {
      text,
      inputTokens,
      outputTokens,
      model: this.model,
      latencyMs,
    }
  }

  async *streamText(req: LLMRequest): AsyncGenerator<string> {
    log.info('streamText start', { model: this.model })
    const start = performance.now()

    const model = this.genAI.getGenerativeModel({ model: this.model })

    const contents = req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const streamResult = await model.generateContentStream({
      contents,
      systemInstruction: req.system,
      generationConfig: {
        maxOutputTokens: req.maxTokens,
        ...(req.temperature !== undefined && { temperature: req.temperature }),
      },
    })

    for await (const chunk of streamResult.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }

    const latencyMs = Math.round(performance.now() - start)

    const response = await streamResult.response
    const usage = response.usageMetadata
    const inputTokens = usage?.promptTokenCount ?? 0
    const outputTokens = usage?.candidatesTokenCount ?? 0

    log.info('streamText complete', {
      model: this.model,
      inputTokens,
      outputTokens,
      latencyMs,
    })

    logTelemetryTokenUsage({
      agent: req.agentId || 'unknown',
      provider: this.name,
      model: this.model,
      inputTokens,
      outputTokens,
      latencyMs,
    })
  }
}
