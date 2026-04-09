import type { Blueprint, GeneratedFile } from './blueprint'

export type PipelineStage =
  | 'idle'
  | 'planning'
  | 'generating'
  | 'writing-sandbox'
  | 'installing'
  | 'building'
  | 'preview-ready'
  | 'failed'

export interface PipelineState {
  id: string
  stage: PipelineStage
  prompt: string
  blueprint: Blueprint | null
  files: GeneratedFile[]
  sandboxId: string | null
  previewUrl: string | null
  error: string | null
  startedAt: number
  completedAt: number | null
  metrics: PipelineMetrics
}

export interface PipelineMetrics {
  planningMs: number | null
  generatingMs: number | null
  sandboxWriteMs: number | null
  installMs: number | null
  buildMs: number | null
  totalMs: number | null
  filesGenerated: number
  tokensUsed: { input: number; output: number }
  llmCalls: number
  provider: string
}

export type SSEEventType =
  | 'stage'
  | 'file'
  | 'progress'
  | 'preview'
  | 'error'
  | 'metrics'
  | 'done'

export interface SSEEvent {
  type: SSEEventType
  data: SSEStageEvent | SSEFileEvent | SSEProgressEvent | SSEPreviewEvent | SSEErrorEvent | SSEMetricsEvent | SSEDoneEvent
}

export interface SSEStageEvent {
  stage: PipelineStage
  message: string
}

export interface SSEFileEvent {
  path: string
  content: string
  index: number
  total: number
}

export interface SSEProgressEvent {
  message: string
  percent: number
}

export interface SSEPreviewEvent {
  url: string
  sandboxId: string
  projectId?: string | null
}

export interface SSEErrorEvent {
  message: string
  stage: PipelineStage
  recoverable: boolean
}

export interface SSEMetricsEvent {
  metrics: PipelineMetrics
}

export interface SSEDoneEvent {
  success: boolean
  previewUrl: string | null
  totalMs: number
}
