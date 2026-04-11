import fs from 'node:fs'
import path from 'node:path'
import { createLogger } from '@/lib/logger'

const log = createLogger('telemetry')
const TELEMETRY_DIR = path.join(process.cwd(), '.siteforge', 'telemetry')
const FIXES_LOG = path.join(TELEMETRY_DIR, 'pipeline_fixes.jsonl')
const TOKENS_LOG = path.join(TELEMETRY_DIR, 'token_usage.jsonl')
const PIPELINE_LOG = path.join(TELEMETRY_DIR, 'pipeline_runs.jsonl')

export type FixLayer = 'A' | 'B' | 'C'

export interface TelemetryFixEvent {
  layer: FixLayer
  type: string
  file: string
  success: boolean
  description?: string
  error?: string
}

export interface TelemetryTokenEvent {
  agent: string
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
  latencyMs: number
}

export interface TelemetryPipelineEvent {
  success: boolean
  durationMs: number
  error?: string
  projectId?: string
}

let dirCreated = false

function ensureDirectory() {
  if (dirCreated) return
  try {
    if (!fs.existsSync(TELEMETRY_DIR)) {
      fs.mkdirSync(TELEMETRY_DIR, { recursive: true })
    }
    dirCreated = true
  } catch (err) {
    log.error('Failed to create telemetry directory', { error: (err as Error).message })
  }
}

export function logTelemetryFix(event: TelemetryFixEvent) {
  ensureDirectory()
  
  try {
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), ...event }) + '\n'
    fs.appendFileSync(FIXES_LOG, entry)
  } catch (err) {
    log.error('Failed to write telemetry fix', { error: (err as Error).message })
  }
}

export function logTelemetryTokenUsage(event: TelemetryTokenEvent) {
  ensureDirectory()
  
  try {
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), ...event }) + '\n'
    fs.appendFileSync(TOKENS_LOG, entry)
  } catch (err) {
    log.error('Failed to write telemetry token usage', { error: (err as Error).message })
  }
}

export function logTelemetryPipeline(event: TelemetryPipelineEvent) {
  ensureDirectory()
  
  try {
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), ...event }) + '\n'
    fs.appendFileSync(PIPELINE_LOG, entry)
  } catch (err) {
    log.error('Failed to write telemetry pipeline run', { error: (err as Error).message })
  }
}
