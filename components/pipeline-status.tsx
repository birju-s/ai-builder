'use client'

import { Check, Loader2, AlertCircle, FileCode2, Clock, LayoutTemplate, Palette } from 'lucide-react'
import type { PipelineStage, PipelineMetrics } from '@/types/pipeline'
import type { Blueprint } from '@/types/blueprint'

interface PipelineStatusProps {
  stage: PipelineStage
  message: string
  percent: number
  files: Array<{ path: string }>
  error: string | null
  metrics: PipelineMetrics | null
  blueprint?: Blueprint | null
}

const STAGES: Array<{ key: PipelineStage; label: string }> = [
  { key: 'planning', label: 'Planning' },
  { key: 'generating', label: 'Generating Code' },
  { key: 'writing-sandbox', label: 'Setting Up Sandbox' },
  { key: 'installing', label: 'Installing Dependencies' },
  { key: 'building', label: 'Building & Starting Server' },
  { key: 'preview-ready', label: 'Preview Ready' },
]

function stageIndex(stage: PipelineStage): number {
  const idx = STAGES.findIndex((s) => s.key === stage)
  return idx === -1 ? -1 : idx
}

function StageIcon({ status }: { status: 'done' | 'active' | 'pending' | 'error' }) {
  switch (status) {
    case 'done':
      return (
        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )
    case 'active':
      return (
        <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
          <Loader2 className="h-3 w-3 text-white animate-spin" />
        </div>
      )
    case 'error':
      return (
        <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
          <AlertCircle className="h-3 w-3 text-white" />
        </div>
      )
    case 'pending':
      return <div className="h-5 w-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
  }
}

export function PipelineStatus({ stage, message, percent, files, error, metrics, blueprint }: PipelineStatusProps) {
  const currentIdx = stageIndex(stage)
  const isFailed = stage === 'failed'

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{message}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Stage timeline */}
      <div className="space-y-0">
        {STAGES.map((s, i) => {
          let status: 'done' | 'active' | 'pending' | 'error'
          if (isFailed && i === currentIdx) status = 'error'
          else if (i < currentIdx || stage === 'preview-ready') status = 'done'
          else if (i === currentIdx) status = 'active'
          else status = 'pending'

          return (
            <div key={s.key} className="flex items-center gap-3 py-1.5">
              <StageIcon status={status} />
              <span
                className={`text-sm ${
                  status === 'active'
                    ? 'text-neutral-900 dark:text-white font-medium'
                    : status === 'done'
                      ? 'text-neutral-500'
                      : 'text-neutral-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Blueprint & Design Indicator */}
      {blueprint && (
        <div className="my-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
              {blueprint.name}
            </h4>
          </div>
          <p className="text-xs text-neutral-500 line-clamp-2">
            {blueprint.description}
          </p>

          <div className="pt-2 flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-800">
            <Palette className="h-3.5 w-3.5 text-neutral-400" />
            <div className="flex items-center gap-1.5">
              {[
                blueprint.designSystem.colors.primary,
                blueprint.designSystem.colors.secondary,
                blueprint.designSystem.colors.accent,
                blueprint.designSystem.colors.background,
              ].map((hex, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border border-neutral-200 shadow-sm"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium text-neutral-500 ml-auto">
              {blueprint.designSystem.mood.replace(/-/g, ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Generated files list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
            <FileCode2 className="h-3.5 w-3.5" />
            {files.length} files generated
          </p>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {files.map((f, i) => (
              <div key={i} className="text-xs text-neutral-400 font-mono pl-5">
                {f.path}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Metrics */}
      {metrics?.totalMs && (
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Completed in {(metrics.totalMs / 1000).toFixed(1)}s</span>
          <span className="mx-1">·</span>
          <span>{metrics.filesGenerated} files</span>
        </div>
      )}
    </div>
  )
}
