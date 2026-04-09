'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

const EXAMPLES = [
  'A modern SaaS landing page for an AI writing tool called "Inkwell" with pricing tiers and testimonials',
  'A cozy coffee shop website for "Bean & Brew" in Portland with a menu, about section, and contact form',
  'A bold portfolio site for a freelance photographer specializing in street photography',
  'A fitness studio website for "IronCore Gym" with class schedules, pricing, and trainer profiles',
]

export function PromptInput({ onSubmit, disabled, children }: PromptInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the website you want to build..."
          disabled={disabled}
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 pr-12 text-sm outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30 disabled:opacity-50 placeholder:text-neutral-400"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="absolute bottom-3 right-3 rounded-lg bg-neutral-900 dark:bg-white p-1.5 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {children && <div>{children}</div>}

      {!disabled && (
        <div className="space-y-1.5">
          <p className="text-xs text-neutral-400 font-medium">Try an example:</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setValue(ex)}
                className="text-xs px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors truncate max-w-full"
              >
                {ex.length > 60 ? ex.slice(0, 60) + '...' : ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
