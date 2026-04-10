'use client'

import { useState, useCallback } from 'react'
import { PromptInput } from '@/components/prompt-input'
import { PipelineStatus } from '@/components/pipeline-status'
import { PreviewFrame } from '@/components/preview-frame'
import { ChatPanel } from '@/components/chat-panel'
import { BlueprintEditor } from '@/components/blueprint-editor'
import { CodePanel } from '@/components/code-panel'
import type { SSEEvent, PipelineStage, PipelineMetrics } from '@/types/pipeline'
import type { Blueprint } from '@/types/blueprint'

interface PipelineFile {
  path: string
  content: string
}

type AppMode = 'idle' | 'planning' | 'editing-blueprint' | 'generating' | 'preview'

export default function Home() {
  const [stage, setStage] = useState<PipelineStage>('idle')
  const [appMode, setAppMode] = useState<AppMode>('idle')
  const [progressMessage, setProgressMessage] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [files, setFiles] = useState<PipelineFile[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sandboxId, setSandboxId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [usePlanMode, setUsePlanMode] = useState(false)
  const [rightTab, setRightTab] = useState<'preview' | 'code'>('preview')

  const runGenerate = useCallback(async (prompt: string, approvedBlueprint?: Blueprint) => {
    setIsRunning(true)
    setAppMode('generating')
    setStage('planning')
    setProgressMessage('Starting...')
    setProgressPercent(0)
    setFiles([])
    setPreviewUrl(null)
    setError(null)
    setMetrics(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, blueprint: approvedBlueprint }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Generation failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event: SSEEvent = JSON.parse(line.slice(6))
            switch (event.type) {
              case 'stage':
                setStage((event.data as { stage: PipelineStage }).stage)
                break
              case 'progress':
                setProgressMessage((event.data as { message: string }).message)
                setProgressPercent((event.data as { percent: number }).percent)
                break
              case 'blueprint':
                setBlueprint((event.data as { blueprint: Blueprint }).blueprint)
                break
              case 'file':
                setFiles((prev) => [
                  ...prev,
                  {
                    path: (event.data as { path: string }).path,
                    content: (event.data as { content: string }).content,
                  },
                ])
                break
              case 'preview':
                setPreviewUrl((event.data as { url: string }).url)
                setSandboxId((event.data as { sandboxId: string }).sandboxId)
                setAppMode('preview')
                break
              case 'error':
                setError((event.data as { message: string }).message)
                break
              case 'metrics':
                setMetrics((event.data as { metrics: PipelineMetrics }).metrics)
                break
              case 'done':
                break
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStage('failed')
    } finally {
      setIsRunning(false)
    }
  }, [])

  const handleSubmit = useCallback(async (prompt: string) => {
    setCurrentPrompt(prompt)

    if (usePlanMode) {
      // Plan Mode: generate blueprint first, show editor
      setIsRunning(true)
      setAppMode('planning')
      setError(null)

      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Planning failed')
        }

        const { blueprint: bp } = await res.json()
        setBlueprint(bp)
        setAppMode('editing-blueprint')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setAppMode('idle')
      } finally {
        setIsRunning(false)
      }
    } else {
      // Quick Mode: generate directly
      runGenerate(prompt)
    }
  }, [usePlanMode, runGenerate])

  const handleBlueprintApprove = useCallback((edited: Blueprint) => {
    setBlueprint(edited)
    runGenerate(currentPrompt, edited)
  }, [currentPrompt, runGenerate])

  const handleBlueprintRegenerate = useCallback(async () => {
    if (!currentPrompt) return
    setIsRunning(true)
    setError(null)

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      })

      if (!res.ok) throw new Error('Regeneration failed')

      const { blueprint: bp } = await res.json()
      setBlueprint(bp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }, [currentPrompt])

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-[420px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-950">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="text-xl font-semibold tracking-tight">SiteForge</h1>
          <p className="text-sm text-neutral-500 mt-1">Describe your website and watch it come to life.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <PromptInput onSubmit={handleSubmit} disabled={isRunning}>
            <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={usePlanMode}
                onChange={(e) => setUsePlanMode(e.target.checked)}
                disabled={isRunning}
                className="rounded border-neutral-300"
              />
              Plan Mode (review blueprint before generating)
            </label>
          </PromptInput>

          {error && appMode !== 'generating' && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {appMode === 'planning' && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Creating blueprint...
            </div>
          )}

          {appMode === 'editing-blueprint' && blueprint && (
            <BlueprintEditor
              blueprint={blueprint}
              onApprove={handleBlueprintApprove}
              onRegenerate={handleBlueprintRegenerate}
            />
          )}

          {(appMode === 'generating' || appMode === 'preview') && stage !== 'idle' && (
            <PipelineStatus
              stage={stage}
              message={progressMessage}
              percent={progressPercent}
              files={files}
              error={error}
              metrics={metrics}
              blueprint={blueprint}
            />
          )}

          {stage === 'preview-ready' && sandboxId && (
            <ChatPanel
              sandboxId={sandboxId}
              files={files}
              onFilesUpdated={(updatedFiles) => {
                setFiles((prev) => {
                  const next = [...prev]
                  for (const uf of updatedFiles) {
                    const idx = next.findIndex((f) => f.path === uf.path)
                    if (idx >= 0) next[idx] = uf
                    else next.push(uf)
                  }
                  return next
                })
                if (previewUrl) {
                  const url = previewUrl
                  setPreviewUrl(null)
                  setTimeout(() => setPreviewUrl(url), 100)
                }
              }}
              disabled={isRunning}
            />
          )}
        </div>
      </div>

      {/* Right Panel: Preview / Code */}
      <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 flex flex-col">
        {files.length > 0 && (
          <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setRightTab('preview')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                rightTab === 'preview'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                rightTab === 'code'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Code ({files.length})
            </button>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          {rightTab === 'preview' ? (
            <PreviewFrame url={previewUrl} stage={stage} />
          ) : (
            <CodePanel
              files={files}
              onFileEdit={sandboxId ? async (filePath, content) => {
                setFiles((prev) => prev.map((f) => f.path === filePath ? { ...f, content } : f))
                fetch('/api/sandbox/write', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sandboxId, path: filePath, content }),
                }).catch(() => {})
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
