'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FolderOpen, Trash2, ExternalLink, Plus, Clock } from 'lucide-react'
import type { Project } from '@/lib/store/types'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to load projects')
      const data = await res.json()
      setProjects(data.projects)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpen = (project: Project) => {
    if (project.previewUrl) {
      window.open(project.previewUrl, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = `/?project=${project.id}`
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Your Projects</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Manage and revisit your generated websites.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Website
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 mb-6">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4 mb-4">
              <FolderOpen className="h-8 w-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-medium mb-1">No projects yet</h2>
            <p className="text-sm text-neutral-500 mb-6">
              Generate your first website!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create New
            </Link>
          </div>
        )}

        {/* Project grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                onClick={() => handleOpen(project)}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <h3 className="font-medium text-sm truncate">{project.name}</h3>
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    v{project.currentVersion}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-500 line-clamp-2 mb-4 min-h-[2rem]">
                  {project.description || 'No description'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo(project.updatedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.previewUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(project.previewUrl!, '_blank', 'noopener,noreferrer')
                        }}
                        className="rounded-md p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Open preview"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project.id, project.name)
                      }}
                      disabled={deletingId === project.id}
                      className="rounded-md p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
