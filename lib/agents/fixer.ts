import { createLogger } from '@/lib/logger'
import { getDefaultProvider } from '@/lib/llm/registry'

const log = createLogger('agent:fixer')

const FIXER_SYSTEM = `You are a code fixer for a Next.js project. You receive build errors and the source code of the broken file. Your job is to fix the file so it compiles.

RULES:
- Output ONLY the complete fixed file content. No explanations, no markdown fences.
- Fix ALL errors in the file, not just the first one.
- If an import doesn't resolve, REMOVE it and replace with inline code or remove the usage.
- If a component uses <Image> from next/image, replace with plain <img> tag.
- If a third-party library is missing, remove the import and rewrite without it.
- If an icon name from lucide-react is invalid, replace with a valid one (ArrowRight, Check, Star, Menu, X, ChevronDown, Mail, Phone, MapPin, Clock, Users, Zap, Shield, Heart).
- Keep "use client" at the top if the component uses hooks or event handlers.
- Do NOT add any new dependencies or imports that weren't working before.
- The project has these packages: react, react-dom, next, lucide-react, clsx, tailwind-merge, class-variance-authority.
- The utility function cn() is available from "@/lib/utils".`

interface BuildError {
  file: string
  errors: string
}

function parseBuildErrors(buildOutput: string): BuildError[] {
  const lines = buildOutput.split('\n')
  const errorMap = new Map<string, string>()

  const addError = (file: string, errorText: string) => {
    const existing = errorMap.get(file)
    if (!existing || errorText.length > existing.length) {
      errorMap.set(file, errorText.trim())
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const directMatch = line.match(/(?:\.\/)?((app|components|lib)\/[^\s:]+\.tsx?):\d+:\d+/)
    if (!directMatch) continue

    const file = directMatch[1]
    const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 8)).join('\n')
    addError(file, context)
  }

  // Parse prerender/runtime errors: "ReferenceError: X is not defined" with import trace
  const prerenderMatch = buildOutput.match(
    /(?:ReferenceError|TypeError):\s+(\w+)\s+is not defined[\s\S]*?Import trace:[\s\S]*?\.\/((app|components|lib)\/[^\s]+\.tsx?)/
  )
  if (prerenderMatch) {
    addError(
      prerenderMatch[2],
      `ReferenceError: ${prerenderMatch[1]} is not defined — likely a missing import. The identifier "${prerenderMatch[1]}" is used in JSX but never imported.`
    )
  }

  if (errorMap.size === 0) {
    const atUnknownMatches = buildOutput.matchAll(
      /at <unknown> \(\.\/((app|components|lib)\/[^\s:)]+\.tsx?):\d+:\d+\)/g
    )
    for (const atMatch of atUnknownMatches) {
      const file = atMatch[1]
      const errorIdx = buildOutput.indexOf(atMatch[0])
      const contextStart = Math.max(0, buildOutput.lastIndexOf('\n', errorIdx - 200))
      const context = buildOutput.slice(contextStart, errorIdx + atMatch[0].length)
      addError(file, context)
    }
  }

  let errors = [...errorMap.entries()].map(([file, errors]) => ({ file, errors }))

  // If we found component-level errors, drop page import-trace noise.
  if (errors.some((e) => e.file.startsWith('components/'))) {
    errors = errors.filter((e) => !e.file.startsWith('app/'))
  }

  if (errors.length === 0 && buildOutput.includes('Error')) {
    const errorText = buildOutput.split('\n').filter(
      l => l.includes('Error') || l.includes('error') || l.includes('Module not found')
    ).join('\n')
    if (errorText) {
      errors.push({ file: 'unknown', errors: errorText })
    }
  }

  return errors
}

export async function fixBuildErrors(
  buildOutput: string,
  files: Array<{ path: string; content: string }>
): Promise<Array<{ path: string; content: string }>> {
  const buildErrors = parseBuildErrors(buildOutput)
  if (buildErrors.length === 0) {
    log.warn('No parseable errors found in build output')
    return []
  }

  log.info('Fixing build errors', {
    errorCount: buildErrors.length,
    files: buildErrors.map(e => e.file),
  })

  const provider = getDefaultProvider()
  const fixes: Array<{ path: string; content: string }> = []

  for (const error of buildErrors) {
    if (error.file === 'unknown') continue

    const originalFile = files.find(f => f.path === error.file || f.path === `./${error.file}`)
    if (!originalFile) {
      log.warn('Could not find original file to fix', { file: error.file })
      continue
    }

    const timer = log.time(`fix ${error.file}`)

    try {
      const response = await provider.generateText({
        system: FIXER_SYSTEM,
        messages: [{
          role: 'user',
          content: `The file "${error.file}" has build errors:\n\n${error.errors}\n\nHere is the current file content:\n\n${originalFile.content}\n\nFix ALL the errors and output the complete corrected file.`,
        }],
        maxTokens: 4096,
        temperature: 0,
      })

      let fixed = response.text.trim()
      // Strip markdown fences if present
      const fenceMatch = fixed.match(/^```\w*\s*\n([\s\S]*?)```\s*$/)
      if (fenceMatch) fixed = fenceMatch[1]
      else if (fixed.startsWith('```')) {
        fixed = fixed.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      }

      // Sanity check: fixed content should look like code
      if (fixed.includes('import ') || fixed.includes('export ') || fixed.includes('use client')) {
        fixes.push({ path: originalFile.path, content: fixed.trim() })
        timer.end({ success: true })
      } else {
        log.warn('Fixer output does not look like code, skipping', { file: error.file })
        timer.end({ success: false })
      }
    } catch (e) {
      timer.end({ success: false, error: (e as Error).message })
      log.error('Fixer failed for file', { file: error.file, error: (e as Error).message })
    }
  }

  return fixes
}
