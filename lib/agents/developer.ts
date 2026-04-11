import { createLogger } from '@/lib/logger'
import { getDefaultProvider, getProviderWithFallback } from '@/lib/llm/registry'
import { DEVELOPER_SYSTEM_PROMPT, buildFilePrompt } from '@/lib/prompts/developer'
import { validateFile } from '@/lib/pipeline/validator'
import type { Blueprint, GeneratedFile, FileManifest } from '@/types/blueprint'
import type { FileGeneratedCallback } from '@/lib/agents/types'

const log = createLogger('agent:developer')

function cleanCodeOutput(raw: string): string {
  let content = raw.trim()
  // Strip markdown code fences (```tsx, ```typescript, etc.)
  const fenceMatch = content.match(/^```\w*\s*\n([\s\S]*?)```\s*$/)
  if (fenceMatch) {
    content = fenceMatch[1]
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }
  // Some model outputs include stray standalone fence lines at the end or middle.
  content = content.replace(/^\s*```[\w-]*\s*$/gm, '')
  // Strip any leading prose before actual code (import/export/"use client")
  const codeStart = content.search(/^(import |export |'use client'|"use client"|\/\/|\/\*)/m)
  if (codeStart > 0) {
    content = content.slice(codeStart)
  }
  return content.trim()
}

function getSectionComponentName(sectionType: string): string {
  return sectionType.charAt(0).toUpperCase() + sectionType.slice(1) + 'Section'
}

function getSectionComponentPath(sectionType: string): string {
  return `components/sections/${getSectionComponentName(sectionType)}.tsx`
}

function getSectionTypeForFile(filePath: string): string | null {
  const match = filePath.match(/sections\/(\w+)Section\.tsx$/i)
  return match ? match[1].toLowerCase() : null
}

function getProviderNameForFile(filePath: string): string {
  const sectionType = getSectionTypeForFile(filePath)
  if (!sectionType) return 'anthropic'

  // Route complex/grid-heavy sections to Gemini to interleave load and double throughput
  const geminiSections = new Set(['features', 'services', 'gallery', 'team', 'testimonials', 'menu', 'pricing', 'schedule', 'faq'])
  return geminiSections.has(sectionType) ? 'gemini' : 'anthropic'
}

function getBlueprintSectionByType(
  blueprint: Blueprint,
  sectionType: string
): Blueprint['pages'][number]['sections'][number] | null {
  for (const page of blueprint.pages) {
    const match = page.sections.find((section) => section.type.toLowerCase() === sectionType)
    if (match) return match
  }
  return null
}

function buildAnchorAliasMap(blueprint: Blueprint): Map<string, string> {
  const aliasToId = new Map<string, string>()
  const collisions = new Set<string>()
  const sectionAliases: Record<string, string[]> = {
    about: ['about', 'story', 'our-story'],
    testimonials: ['testimonials', 'reviews', 'community', 'social-proof'],
    contact: ['contact', 'visit', 'find-us', 'location', 'locations'],
    gallery: ['gallery', 'portfolio', 'work', 'works'],
    services: ['services', 'service', 'offerings'],
    menu: ['menu', 'food', 'drinks'],
    schedule: ['schedule', 'hours', 'availability'],
    pricing: ['pricing', 'prices', 'plans'],
    features: ['features'],
    faq: ['faq', 'questions'],
    team: ['team', 'staff'],
  }

  const addAlias = (alias: string, id: string) => {
    const key = alias.trim().toLowerCase()
    if (!key) return
    const existing = aliasToId.get(key)
    if (existing && existing !== id) {
      aliasToId.delete(key)
      collisions.add(key)
      return
    }
    if (!collisions.has(key)) {
      aliasToId.set(key, id)
    }
  }

  for (const page of blueprint.pages) {
    for (const section of page.sections) {
      addAlias(section.id, section.id)
      addAlias(section.type, section.id)
      for (const alias of sectionAliases[section.type] ?? []) {
        addAlias(alias, section.id)
      }
    }
  }

  return aliasToId
}

function enforceRootSectionId(content: string, sectionId: string): string {
  return content.replace(/<(section)\b([^>]*)>/i, (match, tag, attrs: string) => {
    if (/\bid\s*=/.test(attrs)) {
      return `<${tag}${attrs.replace(/\bid\s*=\s*["'][^"']*["']/, `id="${sectionId}"`)}>`
    }
    return `<${tag} id="${sectionId}"${attrs}>`
  })
}

function normalizeAnchorTargets(content: string, blueprint: Blueprint): string {
  const aliasMap = buildAnchorAliasMap(blueprint)
  const replaceTarget = (target: string): string => {
    const normalized = target.trim().toLowerCase()
    return aliasMap.get(normalized) ?? aliasMap.get(normalized.replace(/\s+/g, '-')) ?? target
  }

  const patterns = [
    /(href\s*=\s*["'])#([^"']+)(["'])/g,
    /((?:href|to)\s*:\s*["'])#([^"']+)(["'])/g,
  ]

  return patterns.reduce(
    (nextContent, pattern) =>
      nextContent.replace(pattern, (_match, prefix: string, target: string, suffix: string) => {
        const resolved = replaceTarget(target)
        return `${prefix}#${resolved}${suffix}`
      }),
    content
  )
}

function normalizeGeneratedComponent(
  content: string,
  filePath: string,
  blueprint: Blueprint
): string {
  const sectionType = getSectionTypeForFile(filePath)
  let nextContent = normalizeAnchorTargets(content, blueprint)

  if (!sectionType || sectionType === 'navbar' || sectionType === 'footer') {
    return nextContent
  }

  const section = getBlueprintSectionByType(blueprint, sectionType)
  if (!section) return nextContent

  nextContent = enforceRootSectionId(nextContent, section.id)
  return nextContent
}

function buildManifest(blueprint: Blueprint): FileManifest[] {
  const manifest: FileManifest[] = []
  const seenPaths = new Set<string>()

  for (const page of blueprint.pages) {
    for (const section of page.sections) {
      const path = getSectionComponentPath(section.type)

      // Deduplicate: if two sections share a type, only generate the component once
      if (!seenPaths.has(path)) {
        seenPaths.add(path)
        manifest.push({
          path,
          description: `${section.type} section (id: ${section.id}): "${section.headline}" — ${section.subtext}`,
          dependencies: [],
          priority: 'ai-generated',
        })
      }
    }

    const pagePath = page.route === '/' ? 'app/page.tsx' : `app${page.route}/page.tsx`
    if (!seenPaths.has(pagePath)) {
      seenPaths.add(pagePath)
      manifest.push({
        path: pagePath,
        description: `Page at ${page.route} composing ${page.sections.length} sections`,
          dependencies: page.sections.map((s) => getSectionComponentPath(s.type)),
        priority: 'ai-generated',
      })
    }
  }

  return manifest
}

async function generateFile(
  filePath: string,
  fileDescription: string,
  blueprint: Blueprint,
  existingFiles: string[],
  preferredProvider?: string
): Promise<GeneratedFile> {
  const provider = preferredProvider ? getProviderWithFallback(preferredProvider) : getDefaultProvider()
  const timer = log.time(`generate ${filePath}`)

  const response = await provider.generateText({
    agentId: 'developer',
    system: DEVELOPER_SYSTEM_PROMPT,
    cacheSystem: true,
    messages: [
      {
        role: 'user',
        content: buildFilePrompt(
          filePath,
          fileDescription,
          {
            name: blueprint.name,
            description: blueprint.description,
            designSystem: {
              mood: blueprint.designSystem.mood,
              colors: blueprint.designSystem.colors as unknown as Record<string, string>,
              layout: blueprint.designSystem.layout,
              rhythm: blueprint.designSystem.rhythm,
            },
            pages: blueprint.pages.map((p) => ({
              route: p.route,
              sections: p.sections.map((s) => ({
                id: s.id,
                type: s.type,
                headline: s.headline,
                subtext: s.subtext,
              })),
            })),
          },
          existingFiles
        ),
      },
    ],
    maxTokens: 8192,
    temperature: 0.6,
  })

  const rawContent = normalizeGeneratedComponent(
    cleanCodeOutput(response.text),
    filePath,
    blueprint
  )

  // Self-healing: Layer A (stream corrections) + Layer B (AST autofixes)
  const validation = validateFile(rawContent, filePath)
  const content = validation.content

  const durationMs = timer.end({
    tokens: response.inputTokens + response.outputTokens,
    validationFixes: validation.fixes.length,
    validationMs: validation.durationMs,
  })

  return {
    path: filePath,
    content,
    sizeBytes: new TextEncoder().encode(content).length,
    generationTimeMs: durationMs,
  }
}

async function generatePage(
  blueprint: Blueprint,
  pageIndex: number,
  componentPaths: string[]
): Promise<GeneratedFile> {
  const page = blueprint.pages[pageIndex]
  const pagePath = page.route === '/' ? 'app/page.tsx' : `app${page.route}/page.tsx`
  const availableComponents = new Set(componentPaths)

  const imports: string[] = []
  const beforeMain: string[] = []
  const mainChildren: string[] = []
  const afterMain: string[] = []

  for (const section of page.sections) {
    const componentName = getSectionComponentName(section.type)
    const componentPath = getSectionComponentPath(section.type)

    if (!availableComponents.has(componentPath)) {
      throw new Error(
        `Missing generated component for page composition: ${componentPath}`
      )
    }

    imports.push(
      `import ${componentName} from "@/components/sections/${componentName}"`
    )

    const element = `      <${componentName} />`
    if (section.type === 'navbar') {
      beforeMain.push(element)
    } else if (section.type === 'footer') {
      afterMain.push(element)
    } else {
      mainChildren.push(element)
    }
  }

  const source = [
    ...imports,
    '',
    'export default function Page() {',
    '  return (',
    '    <>',
    ...beforeMain,
    '      <main className="overflow-x-clip">',
    ...mainChildren,
    '      </main>',
    ...afterMain,
    '    </>',
    '  )',
    '}',
    '',
  ].join('\n')

  const validation = validateFile(source, pagePath)
  const content = validation.content

  return {
    path: pagePath,
    content,
    sizeBytes: new TextEncoder().encode(content).length,
    generationTimeMs: 0,
  }
}

export async function generateSkeletonFiles(
  blueprint: Blueprint
): Promise<{ files: GeneratedFile[]; manifest: FileManifest[] }> {
  const manifest = buildManifest(blueprint)
  const componentFiles = manifest.filter((m) => m.priority === 'ai-generated' && !m.path.startsWith('app/'))
  const files: GeneratedFile[] = []

  log.info('Generating deterministic skeletons', { count: componentFiles.length })

  for (const m of componentFiles) {
    const componentName = m.path.match(/sections\/(\w+)Section\.tsx$/i)?.[1] || 'Component'
    const finalComponentName = componentName.charAt(0).toUpperCase() + componentName.slice(1) + 'Section'
    const sectionType = getSectionTypeForFile(m.path) || 'section'
    const section = getBlueprintSectionByType(blueprint, sectionType)
    
    // Skeleton placeholder that matches height to reduce layout shift
    const isHero = sectionType === 'hero'
    const minHeight = isHero ? 'min-h-[85vh]' : 'min-h-[40vh]'
    
    const source = [
      `export default function ${finalComponentName}() {`,
      `  return (`,
      `    <section id="${section?.id || sectionType}" className="${minHeight} flex flex-col items-center justify-center p-8 bg-background text-foreground animate-pulse border-y border-border/10">`,
      `      <div className="h-10 w-1/2 bg-muted rounded mb-6"></div>`,
      `      <div className="h-4 w-3/4 bg-muted rounded mb-3"></div>`,
      `      <div className="h-4 w-1/3 bg-muted rounded"></div>`,
      `    </section>`,
      `  )`,
      `}`
    ].join('\n')

    files.push({
      path: m.path,
      content: source,
      sizeBytes: new TextEncoder().encode(source).length,
      generationTimeMs: 0,
    })
  }

  // Generate pages (deterministic composition)
  const componentPaths = files.map((f) => f.path)
  for (let i = 0; i < blueprint.pages.length; i++) {
    const pageFile = await generatePage(blueprint, i, componentPaths)
    files.push(pageFile)
  }

  return { files, manifest }
}

export async function runDeveloperEnrichment(
  blueprint: Blueprint,
  manifest: FileManifest[],
  onFileGenerated?: FileGeneratedCallback
): Promise<GeneratedFile[]> {
  const componentFiles = manifest.filter((m) => m.priority === 'ai-generated' && !m.path.startsWith('app/'))
  const totalFiles = componentFiles.length
  const files: GeneratedFile[] = []
  let fileIndex = 0

  log.info('Developer Agent Enrichment starting', {
    components: componentFiles.length
  })

  // Phase 0: Prompt Cache Warming (S5)
  if (componentFiles.length > 0) {
    const warmTimer = log.time('cache-warming')
    try {
      await getDefaultProvider().generateText({
        system: DEVELOPER_SYSTEM_PROMPT,
        cacheSystem: true,
        messages: [{ role: 'user', content: 'Ping. Reply "Pong".' }],
        maxTokens: 5,
      })
    } catch (err) {
      log.warn('Cache warming failed, proceeding anyway', { error: (err as Error).message })
    }
    warmTimer.end()
  }

  // Phase 1: Generate ALL section components in parallel
  const componentPromises = componentFiles.map((m) =>
    generateFile(m.path, m.description, blueprint, [], getProviderNameForFile(m.path))
      .catch((err) => {
        log.error('Component generation failed', { file: m.path, error: (err as Error).message })
        return null
      })
  )

  const componentResults = await Promise.allSettled(componentPromises)
  
  for (const result of componentResults) {
    if (result.status === 'fulfilled' && result.value) {
      files.push(result.value)
      fileIndex++
      onFileGenerated?.(result.value, fileIndex, totalFiles)
    }
  }

  log.info('Developer Enrichment complete', {
    filesGenerated: files.length,
    totalGenerationMs: files.reduce((sum, f) => sum + f.generationTimeMs, 0),
  })

  return files
}
