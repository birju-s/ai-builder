import { createLogger } from '@/lib/logger'
import { applyStreamCorrections, type CorrectionFix } from './stream-correction'
import { applyAutofixes, type AutofixFix } from './ast-autofixer'
import { logTelemetryFix } from '@/lib/telemetry'

const log = createLogger('pipeline:validator')

export type ValidationFix = CorrectionFix | AutofixFix

export interface ValidationResult {
  content: string
  fixes: ValidationFix[]
  missingDeps: string[]
  durationMs: number
}

export function validateFile(content: string, filePath: string): ValidationResult {
  const start = performance.now()

  // Layer A: Stream corrections (import paths, icon names, Next.js patterns)
  const streamResult = applyStreamCorrections(content)

  // Layer B: AST autofixes ("use client", default exports, import validation)
  const astResult = applyAutofixes(streamResult.content, filePath)

  const durationMs = Math.round(performance.now() - start)
  const allFixes = [...streamResult.fixes, ...astResult.fixes]

  if (allFixes.length > 0) {
    log.info('File validated', {
      file: filePath,
      layerA: streamResult.fixes.length,
      layerB: astResult.fixes.length,
      missingDeps: astResult.missingDeps.length,
      durationMs,
    })

    allFixes.forEach((fix) => {
      logTelemetryFix({
        layer: fix.layer as 'A' | 'B',
        type: fix.type,
        file: filePath,
        success: true,
        description: fix.description,
      })
    })
  }

  return {
    content: astResult.content,
    fixes: allFixes,
    missingDeps: astResult.missingDeps,
    durationMs,
  }
}

// Batch validate multiple files, collecting all missing deps.
export function validateFiles(
  files: Array<{ path: string; content: string }>
): {
  files: Array<{ path: string; content: string }>
  allFixes: ValidationFix[]
  allMissingDeps: string[]
  totalDurationMs: number
} {
  const allFixes: ValidationFix[] = []
  const depSet = new Set<string>()
  let totalDurationMs = 0

  const validated = files.map((file) => {
    const result = validateFile(file.content, file.path)
    allFixes.push(...result.fixes)
    result.missingDeps.forEach((d) => depSet.add(d))
    totalDurationMs += result.durationMs
    return { path: file.path, content: result.content }
  })

  if (allFixes.length > 0) {
    log.info('Batch validation complete', {
      files: files.length,
      totalFixes: allFixes.length,
      missingDeps: [...depSet],
      totalDurationMs,
    })
  }

  return {
    files: validated,
    allFixes,
    allMissingDeps: [...depSet],
    totalDurationMs,
  }
}
