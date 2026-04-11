import { getDefaultProvider } from '@/lib/llm/registry'
import { createLogger } from '@/lib/logger'
import type { Blueprint } from '@/types/blueprint'

const log = createLogger('agent:backend')

const BACKEND_SYSTEM = `You are an elite Node.js backend engineer. You write Express.js route handlers in TypeScript using Prisma as the ORM.

RULES:
- Return ONLY the TypeScript code for the Express router.
- Do NOT use markdown code fences in your output. Start immediately with imports.
- Use valid ESM imports (e.g. "import { Router } from 'express'").
- Assume Prisma client is exported from "../prisma/client" as "const prisma = new PrismaClient()".
- Handle validation simply and gracefully.
- Handle async/await errors properly using standard try/catch blocks sending 500 errors if needed.
- Return standard JSON responses.
`

export async function generateExpressRoutes(blueprint: Blueprint, prismaSchema: string): Promise<string> {
  if (blueprint.appType !== 'fullstack' || !blueprint.apiRoutes || blueprint.apiRoutes.length === 0) {
    return ''
  }

  const provider = getDefaultProvider()
  const timer = log.time('backend')

  log.info('Backend agent invoked', { routesCount: blueprint.apiRoutes.length })

  const prompt = `Generate a complete Express.js router file (routes.ts) handling the following endpoints.

Here is the Prisma schema context:
\`\`\`prisma
${prismaSchema}
\`\`\`

Here are the required API routes:
${JSON.stringify(blueprint.apiRoutes, null, 2)}

Export the router as default (export default router).
`

  const response = await provider.generateText({
    agentId: 'backend',
    system: BACKEND_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2048,
    temperature: 0.2,
  })

  timer.end({ tokens: response.inputTokens + response.outputTokens })

  let text = response.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }

  return text
}
