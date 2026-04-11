import { getDefaultProvider } from '@/lib/llm/registry'
import { createLogger } from '@/lib/logger'
import type { Blueprint } from '@/types/blueprint'

const log = createLogger('agent:database')

const DATABASE_SYSTEM = `You are the Database Architect for SiteForge. You generate a valid Prisma schema (schema.prisma) based on the provided JSON blueprint.

RULES:
- Use PostgreSQL as the provider.
- Output ONLY the raw Prisma schema code. No markdown fences.
- Ensure all models have an @id field.
- Ensure proper relationships between models if necessary.
- Include standard Prisma generator block (provider = "prisma-client-js").
- Include standard datasource block (provider = "postgresql", url = env("DATABASE_URL")).
`

export async function generatePrismaSchema(blueprint: Blueprint): Promise<string> {
  if (blueprint.appType !== 'fullstack' || !blueprint.models || blueprint.models.length === 0) {
    return ''
  }

  const provider = getDefaultProvider()
  const timer = log.time('database')

  log.info('Database agent invoked', { modelsCount: blueprint.models.length })

  const prompt = `Generate a complete schema.prisma for the following models:
${JSON.stringify(blueprint.models, null, 2)}
`

  const response = await provider.generateText({
    agentId: 'database',
    system: DATABASE_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2048,
    temperature: 0.2, // low temp for structured syntax
  })

  timer.end({ tokens: response.inputTokens + response.outputTokens })

  let text = response.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }

  return text
}
