'use client'

import { Monitor, ExternalLink, Loader2 } from 'lucide-react'
import type { PipelineStage } from '@/types/pipeline'

interface PreviewFrameProps {
  url: string | null
  stage: PipelineStage
}

export function PreviewFrame({ url, stage }: PreviewFrameProps) {
  if (url) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-neutral-400 font-mono ml-2 truncate max-w-md">
              {url}
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <iframe
          src={url}
          className="flex-1 w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    )
  }

  const isWorking = stage !== 'idle' && stage !== 'failed'

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-neutral-400">
      {isWorking ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm">Building your website...</p>
        </>
      ) : (
        <>
          <Monitor className="h-12 w-12 stroke-[1.5]" />
          <p className="text-sm">Preview will appear here</p>
        </>
      )}
    </div>
  )
}
