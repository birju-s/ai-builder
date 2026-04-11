import { createLogger } from '@/lib/logger'
import type { LLMProvider, LLMRequest, LLMResponse } from '@/lib/llm/types'
import { AnthropicProvider } from '@/lib/llm/anthropic'
import { GeminiProvider } from '@/lib/llm/gemini'

const log = createLogger('llm:registry')

// Circuit breaker state per provider
interface CircuitState {
  failures: number
  lastFailure: number
  state: 'closed' | 'open' | 'half-open'
}

const circuits = new Map<string, CircuitState>()
const FAILURE_THRESHOLD = 3
const RECOVERY_MS = 5 * 60 * 1000 // 5 minutes

function getCircuit(name: string): CircuitState {
  if (!circuits.has(name)) {
    circuits.set(name, { failures: 0, lastFailure: 0, state: 'closed' })
  }
  return circuits.get(name)!
}

function recordSuccess(name: string) {
  const c = getCircuit(name)
  c.failures = 0
  c.state = 'closed'
}

function recordFailure(name: string) {
  const c = getCircuit(name)
  c.failures++
  c.lastFailure = Date.now()
  if (c.failures >= FAILURE_THRESHOLD) {
    c.state = 'open'
    log.warn('Circuit breaker OPEN', { provider: name, failures: c.failures })
  }
}

function isAvailable(name: string): boolean {
  const c = getCircuit(name)
  if (c.state === 'closed') return true
  if (c.state === 'open' && Date.now() - c.lastFailure > RECOVERY_MS) {
    c.state = 'half-open'
    log.info('Circuit breaker HALF-OPEN', { provider: name })
    return true
  }
  return c.state === 'half-open'
}

// Provider instances (lazy)
const providers = new Map<string, LLMProvider>()

function createProvider(name: string): LLMProvider {
  switch (name) {
    case 'anthropic':
      return new AnthropicProvider()
    case 'gemini':
      return new GeminiProvider()
    default:
      throw new Error(`Unknown LLM provider: ${name}`)
  }
}

function getProvider(name: string): LLMProvider {
  const existing = providers.get(name)
  if (existing) return existing
  const provider = createProvider(name)
  providers.set(name, provider)
  return provider
}

// Priority order for fallback
const PROVIDER_PRIORITY = ['anthropic', 'gemini']

class FallbackProvider implements LLMProvider {
  readonly name = 'fallback'
  private priority: string[]

  constructor(priority: string[] = PROVIDER_PRIORITY) {
    this.priority = priority
  }

  async generateText(req: LLMRequest): Promise<LLMResponse> {
    const errors: string[] = []

    for (const name of this.priority) {
      if (!isAvailable(name)) {
        log.info('Skipping provider (circuit open)', { provider: name })
        continue
      }

      try {
        const provider = getProvider(name)
        const result = await provider.generateText(req)
        recordSuccess(name)
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${name}: ${msg}`)
        recordFailure(name)
        log.warn('Provider failed, trying fallback', { provider: name, error: msg })
      }
    }

    throw new Error(`All LLM providers failed:\n${errors.join('\n')}`)
  }

  async *streamText(req: LLMRequest): AsyncGenerator<string> {
    for (const name of this.priority) {
      if (!isAvailable(name)) continue

      try {
        const provider = getProvider(name)
        yield* provider.streamText(req)
        recordSuccess(name)
        return
      } catch (err) {
        recordFailure(name)
        log.warn('Stream provider failed, trying fallback', {
          provider: name,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    throw new Error('All LLM providers failed for streaming')
  }
}

let defaultProvider: LLMProvider | null = null

export function getDefaultProvider(): LLMProvider {
  if (!defaultProvider) {
    defaultProvider = new FallbackProvider()
  }
  return defaultProvider
}

export function getProviderWithFallback(preferredName: string): LLMProvider {
  const priority = [preferredName, ...PROVIDER_PRIORITY.filter(n => n !== preferredName)]
  return new FallbackProvider(priority)
}

export { getProvider }
