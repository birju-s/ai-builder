import fs from 'node:fs'
import path from 'node:path'
import { createLogger } from '@/lib/logger'

const log = createLogger('prompts:rules')
const RULES_DIR = path.join(process.cwd(), '.siteforge', 'rules')

let cachedRules: string | null = null

export function getDesignSystemRules(): string {
  if (cachedRules !== null) return cachedRules

  try {
    if (!fs.existsSync(RULES_DIR)) {
      cachedRules = ''
      return ''
    }

    const files = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.md'))
    if (files.length === 0) {
      cachedRules = ''
      return ''
    }

    let rulesText = '\n\n=== GLOBAL DESIGN SYSTEM RULES ===\n'
    rulesText += 'The following rules must be strictly adhered to across all generation tasks:\n\n'

    for (const file of files) {
      const content = fs.readFileSync(path.join(RULES_DIR, file), 'utf-8')
      const title = file.replace('.md', '').toUpperCase().replace(/-/g, ' ')
      rulesText += `--- ${title} ---\n${content.trim()}\n\n`
    }

    cachedRules = rulesText
    log.info('Loaded design system rules', { count: files.length })
    return cachedRules
  } catch (err) {
    log.error('Failed to load design system rules', { error: (err as Error).message })
    cachedRules = ''
    return ''
  }
}
