'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Check, X } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'system'
  content: string
  status?: 'pending' | 'streaming' | 'done' | 'error'
}

interface ChatPanelProps {
  sandboxId: string
  files: Array<{ path: string; content: string }>
  onFilesUpdated: (files: Array<{ path: string; content: string }>) => void
  disabled?: boolean
}

export function ChatPanel({ sandboxId, files, onFilesUpdated, disabled }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isIterating, setIsIterating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isIterating || disabled) return

    setInput('')
    setIsIterating(true)

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])

    // Add system placeholder
    const systemIdx = messages.length + 1
    setMessages((prev) => [
      ...prev,
      { role: 'system', content: 'Starting iteration...', status: 'pending' },
    ])

    try {
      const response = await fetch('/api/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId, message: trimmed, files }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Iteration failed')
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
            const event = JSON.parse(line.slice(6)) as {
              type: string
              data: Record<string, unknown>
            }

            switch (event.type) {
              case 'iterate-start':
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === systemIdx
                      ? { ...m, content: 'Analyzing changes...', status: 'streaming' }
                      : m
                  )
                )
                break

              case 'iterate-files': {
                const changedFiles = event.data.files as string[]
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === systemIdx
                      ? {
                          ...m,
                          content: `Updating ${changedFiles.length} file${changedFiles.length !== 1 ? 's' : ''}: ${changedFiles.join(', ')}`,
                        }
                      : m
                  )
                )
                break
              }

              case 'iterate-building': {
                const attempt = event.data.attempt as number
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === systemIdx
                      ? {
                          ...m,
                          content: attempt > 1
                            ? `Rebuilding (attempt ${attempt})...`
                            : 'Rebuilding site...',
                        }
                      : m
                  )
                )
                break
              }

              case 'iterate-done': {
                const updatedFiles = event.data.files as Array<{
                  path: string
                  content: string
                }>
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === systemIdx
                      ? {
                          ...m,
                          content: `Done! Updated ${updatedFiles.length} file${updatedFiles.length !== 1 ? 's' : ''}.`,
                          status: 'done',
                        }
                      : m
                  )
                )
                onFilesUpdated(updatedFiles)
                break
              }

              case 'iterate-error':
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === systemIdx
                      ? {
                          ...m,
                          content: `Error: ${event.data.message as string}`,
                          status: 'error',
                        }
                      : m
                  )
                )
                break
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === systemIdx
            ? {
                ...m,
                content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                status: 'error',
              }
            : m
        )
      )
    } finally {
      setIsIterating(false)
    }
  }, [input, isIterating, disabled, sandboxId, files, messages.length, onFilesUpdated])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col border-t border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <p className="text-xs font-medium text-neutral-500">Iterate on your site</p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 max-h-60 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-4">
            Type a message to update your site. e.g. &quot;Make the hero section
            bolder&quot;
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : msg.status === 'error'
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {msg.role === 'system' && msg.status === 'streaming' && (
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                )}
                {msg.role === 'system' && msg.status === 'pending' && (
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                )}
                {msg.role === 'system' && msg.status === 'done' && (
                  <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                )}
                {msg.role === 'system' && msg.status === 'error' && (
                  <X className="h-3 w-3 text-red-500 flex-shrink-0" />
                )}
                <span>{msg.content}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a change..."
            disabled={isIterating || disabled}
            className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30 disabled:opacity-50 placeholder:text-neutral-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isIterating || disabled}
            className="rounded-lg bg-neutral-900 dark:bg-white p-2 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isIterating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
