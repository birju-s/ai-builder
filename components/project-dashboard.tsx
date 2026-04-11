'use client'

import { useEffect, useState } from 'react'
import { Folder, ExternalLink, Calendar, Loader2, Play } from 'lucide-react'
import type { Project } from '@/lib/store/types'

export function ProjectDashboard({ onSelectProject }: { onSelectProject?: (p: Project) => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch projects')
        return res.json()
      })
      .then((data) => {
        setProjects(data.projects || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        <p>Error loading projects: {error}</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-neutral-400 gap-4">
        <Folder className="h-10 w-10 opacity-20" />
        <p className="text-sm">No recent projects found</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 p-4 px-6">
        <Folder className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold tracking-tight">Recent Projects</h2>
        <span className="ml-auto rounded-full bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-xs font-medium text-neutral-500">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                    {project.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                    {project.description}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(project.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {project.previewUrl ? (
                    <a
                      href={project.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-950 px-2 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Preview
                    </a>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-neutral-400">
                      Draft
                    </span>
                  )}
                  {onSelectProject && (
                    <button
                      onClick={() => onSelectProject(project)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Load
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
