'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error Boundary caught:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-neutral-950 p-6 text-center">
      <div className="rounded-full bg-red-50 dark:bg-red-950 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-2">
        Something went wrong!
      </h2>
      <p className="text-sm text-neutral-500 max-w-md mb-6">
        An unexpected error occurred while running the application. We&apos;ve logged the issue.
      </p>
      
      <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 mb-6 max-w-lg w-full overflow-hidden text-left">
        <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
          {error.message || 'Unknown error'}
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  )
}
