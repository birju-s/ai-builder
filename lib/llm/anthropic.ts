import Anthropic from '@anthropic-ai/sdk'
import { createLogger } from '@/lib/logger'
import type { LLMProvider, LLMRequest, LLMResponse } from '@/lib/llm/types'

const log = createLogger('llm:anthropic')

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic'
  private client: Anthropic
  private model: string

  constructor(model = 'claude-sonnet-4-5') {
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

    const latencyMs = timer.end({
      model: this.model,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    })

    return {
      text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      model: message.model,
      latencyMs,
    }
  }

  async *streamText(req: LLMRequest): AsyncGenerator<string> {
    log.info('streamText start', { model: this.model })
    const start = performance.now()

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: req.maxTokens,
      system: req.system,
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

    log.info('streamText complete', {
      model: this.model,
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      latencyMs,
    })
  }
}
