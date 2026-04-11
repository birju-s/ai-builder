import { createLogger } from '@/lib/logger'
import { getDefaultProvider } from '@/lib/llm/registry'
import { validateFile } from '@/lib/pipeline/validator'

const log = createLogger('agent:iterator')

// Helper to strip markdown fences
function cleanCodeOutput(raw: string): string {
  let content = raw.trim()
  const fenceMatch = content.match(/^```\w*\s*\n([\s\S]*?)```\s*$/)
  if (fenceMatch) content = fenceMatch[1]
  else if (content.startsWith('```')) {
    content = content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }
  const codeStart = content.search(
    /^(import |export |'use client'|"use client"|\/\/|\/\*)/m
  )
  if (codeStart > 0) content = content.slice(codeStart)
  return content.trim()
}

const ITERATOR_SYSTEM = `You are an iteration agent for SiteForge. The user has a generated Next.js website and wants to make changes.

You will receive:
1. The user's change request
2. A list of files in the project with their content

Your job:
1. Identify which file(s) need to change
2. Output the COMPLETE updated file content for each file that needs changes

RULES:
- Output a JSON object: { "files": [{ "path": "components/sections/HeroSection.tsx", "content": "...full file..." }] }
- Include the COMPLETE file content, not just the diff
- Only include files that actually changed
- Keep all existing functionality -- only change what the user asked for
- Preserve all imports, "use client" directives, etc.
- Use the same styling approach (Tailwind + CSS custom properties)
- Do NOT add new dependencies
- Output valid JSON only, no markdown fences around the JSON`

export interface IterationResult {
  files: Array<{ path: string; content: string }>
}

export async function runIterator(
  message: string,
  currentFiles: Array<{ path: string; content: string }>
): Promise<IterationResult> {
  const provider = getDefaultProvider()
  const timer = log.time('iterate')

  // Only send AI-generated files (components + pages), not config files
  const relevantFiles = currentFiles.filter(
    (f) =>
      f.path.endsWith('.tsx') &&
      (f.path.startsWith('components/') || f.path.startsWith('app/'))
  )

  const filesContext = relevantFiles
    .map((f) => `=== ${f.path} ===\n${f.content}`)
    .join('\n\n')

  const response = await provider.generateText({
    agentId: 'iterator',
    system: ITERATOR_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `User request: "${message}"\n\nCurrent files:\n\n${filesContext}`,
      },
    ],
    maxTokens: 8192,
    temperature: 0.3,
  })

  timer.end({ tokens: response.inputTokens + response.outputTokens })

  let text = response.text.trim()
  // Strip markdown fences around JSON
  if (text.startsWith('```')) {
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const parsed = JSON.parse(text)
    const files = (
      parsed.files as Array<{ path: string; content: string }>
    ).map((f) => {
      const cleaned = cleanCodeOutput(f.content)
      const validation = validateFile(cleaned, f.path)
      return { path: f.path, content: validation.content }
    })
    log.info('Iteration complete', { filesChanged: files.length })
    return { files }
  } catch {
    log.error('Failed to parse iterator response', {
      text: text.slice(0, 500),
    })
    throw new Error('Failed to parse iteration response')
  }
}
