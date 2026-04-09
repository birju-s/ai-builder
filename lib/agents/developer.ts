import { createLogger } from '@/lib/logger'
import { getDefaultProvider } from '@/lib/llm/registry'
import { DEVELOPER_SYSTEM_PROMPT, buildFilePrompt, buildPagePrompt } from '@/lib/prompts/developer'
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
  // Strip any leading prose before actual code (import/export/"use client")
  const codeStart = content.search(/^(import |export |'use client'|"use client"|\/\/|\/\*)/m)
  if (codeStart > 0) {
    content = content.slice(codeStart)
  }
  return content.trim()
}

function buildManifest(blueprint: Blueprint): FileManifest[] {
  const manifest: FileManifest[] = []
  const seenPaths = new Set<string>()

  for (const page of blueprint.pages) {
    for (const section of page.sections) {
      const componentName = section.type.charAt(0).toUpperCase() + section.type.slice(1) + 'Section'
      const path = `components/sections/${componentName}.tsx`

      // Deduplicate: if two sections share a type, only generate the component once
      if (!seenPaths.has(path)) {
        seenPaths.add(path)
        manifest.push({
          path,
          description: `${section.type} section: "${section.headline}" — ${section.subtext}`,
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
        dependencies: page.sections.map((s) => {
          const name = s.type.charAt(0).toUpperCase() + s.type.slice(1) + 'Section'
          return `components/sections/${name}.tsx`
        }),
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
  existingFiles: string[]
): Promise<GeneratedFile> {
  const provider = getDefaultProvider()
  const timer = log.time(`generate ${filePath}`)

  const response = await provider.generateText({
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
            },
            pages: blueprint.pages.map((p) => ({
              route: p.route,
              sections: p.sections.map((s) => ({
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
    maxTokens: 4096,
    temperature: 0.6,
  })

  const rawContent = cleanCodeOutput(response.text)

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
  const provider = getDefaultProvider()
  const page = blueprint.pages[pageIndex]
  const pagePath = page.route === '/' ? 'app/page.tsx' : `app${page.route}/page.tsx`
  const timer = log.time(`generate ${pagePath}`)

  const response = await provider.generateText({
    system: DEVELOPER_SYSTEM_PROMPT,
    cacheSystem: true,
    messages: [
      {
        role: 'user',
        content: buildPagePrompt(
          {
            name: blueprint.name,
            description: blueprint.description,
            designSystem: {
              mood: blueprint.designSystem.mood,
              colors: blueprint.designSystem.colors as unknown as Record<string, string>,
            },
            pages: blueprint.pages,
          },
          pageIndex,
          componentPaths
        ),
      },
    ],
    maxTokens: 4096,
    temperature: 0.6,
  })

  const rawContent = cleanCodeOutput(response.text)

  // Self-healing: Layer A (stream corrections) + Layer B (AST autofixes)
  const validation = validateFile(rawContent, pagePath)
  const content = validation.content

  const durationMs = timer.end({
    tokens: response.inputTokens + response.outputTokens,
    validationFixes: validation.fixes.length,
    validationMs: validation.durationMs,
  })

  return {
    path: pagePath,
    content,
    sizeBytes: new TextEncoder().encode(content).length,
    generationTimeMs: durationMs,
  }
}

export async function runDeveloperAgent(
  blueprint: Blueprint,
  onFileGenerated?: FileGeneratedCallback
): Promise<{ files: GeneratedFile[]; manifest: FileManifest[] }> {
  const manifest = buildManifest(blueprint)
  const componentFiles = manifest.filter((m) => m.priority === 'ai-generated' && !m.path.startsWith('app/'))
  const pageFiles = manifest.filter((m) => m.path.startsWith('app/') && m.path.endsWith('page.tsx'))
  const totalFiles = componentFiles.length + pageFiles.length
  const files: GeneratedFile[] = []
  let fileIndex = 0

  log.info('Developer Agent starting', {
    components: componentFiles.length,
    pages: pageFiles.length,
    total: totalFiles,
  })

  // Phase 1: Generate ALL section components in parallel
  // Components have no inter-dependencies, so we can fire them all at once.
  // Use Promise.allSettled to prevent one failure from killing everything.
  const componentPromises = componentFiles.map((m) =>
    generateFile(m.path, m.description, blueprint, [])
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

  log.info('Components generated', { 
    success: files.length, 
    failed: componentFiles.length - files.length 
  })

  // Phase 2: Generate ALL page files in parallel
  // Pages depend on knowing which components exist, but NOT on their content.
  // So we can generate all pages at once now that we know the component paths.
  const componentPaths = files.map((f) => f.path)
  
  const pagePromises = blueprint.pages.map((_, i) =>
    generatePage(blueprint, i, componentPaths)
      .catch((err) => {
        log.error('Page generation failed', { error: (err as Error).message })
        return null
      })
  )

  const pageResults = await Promise.allSettled(pagePromises)
  
  for (const result of pageResults) {
    if (result.status === 'fulfilled' && result.value) {
      files.push(result.value)
      fileIndex++
      onFileGenerated?.(result.value, fileIndex, totalFiles)
    }
  }

  log.info('Developer Agent complete', {
    filesGenerated: files.length,
    totalGenerationMs: files.reduce((sum, f) => sum + f.generationTimeMs, 0),
  })

  return { files, manifest }
}
