import Anthropic from '@anthropic-ai/sdk'
import { createLogger } from '@/lib/logger'
import { logTelemetryTokenUsage } from '@/lib/telemetry'
import type { LLMProvider, LLMRequest, LLMResponse } from '@/lib/llm/types'

const log = createLogger('llm:anthropic')

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic'
  private client: Anthropic
  private model: string

  constructor(model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6') {
    this.client = new Anthropic()
    this.model = model
  }

  async generateText(req: LLMRequest): Promise<LLMResponse> {
    const timer = log.time(`generateText [${this.model}]`)

    // Use cache_control for system prompt if caching is requested
    const system: Anthropic.MessageCreateParams['system'] = req.cacheSystem
      ? [{ type: 'text' as const, text: req.system, cache_control: { type: 'ephemeral' as const } }]
      : req.system

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens,
      system,
      messages: req.messages,
      ...(req.temperature !== undefined && { temperature: req.temperature }),
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const cacheCreationInputTokens = (message.usage as unknown as Record<string, number>).cache_creation_input_tokens
    const cacheReadInputTokens = (message.usage as unknown as Record<string, number>).cache_read_input_tokens

    const latencyMs = timer.end({
      model: this.model,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheCreation: cacheCreationInputTokens,
      cacheRead: cacheReadInputTokens,
    })

    logTelemetryTokenUsage({
      agent: req.agentId || 'unknown',
      provider: this.name,
      model: this.model,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheCreationInputTokens,
      cacheReadInputTokens,
      latencyMs,
    })

    return {
      text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      model: message.model,
      latencyMs,
      cacheCreationInputTokens,
      cacheReadInputTokens,
    }
  }

  async *streamText(req: LLMRequest): AsyncGenerator<string> {
    log.info('streamText start', { model: this.model })
    const start = performance.now()

    const system: Anthropic.MessageCreateParams['system'] = req.cacheSystem
      ? [{ type: 'text' as const, text: req.system, cache_control: { type: 'ephemeral' as const } }]
      : req.system

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: req.maxTokens,
      system,
      messages: req.messages,
      ...(req.temperature !== undefined && { temperature: req.temperature }),
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text
      }
    }

    const finalMessage = await stream.finalMessage()
    const latencyMs = Math.round(performance.now() - start)
    
    const cacheCreationInputTokens = (finalMessage.usage as unknown as Record<string, number>).cache_creation_input_tokens
    const cacheReadInputTokens = (finalMessage.usage as unknown as Record<string, number>).cache_read_input_tokens

    log.info('streamText complete', {
      model: this.model,
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      cacheCreation: cacheCreationInputTokens,
      cacheRead: cacheReadInputTokens,
      latencyMs,
    })

    logTelemetryTokenUsage({
      agent: req.agentId || 'unknown',
      provider: this.name,
      model: this.model,
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      cacheCreationInputTokens,
      cacheReadInputTokens,
      latencyMs,
    })
  }
}
