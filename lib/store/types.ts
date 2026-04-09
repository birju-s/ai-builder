export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  currentVersion: number
  sandboxId: string | null
  previewUrl: string | null
}

export interface ProjectVersion {
  version: number
  prompt: string
  blueprintJson: string // JSON stringified Blueprint
  files: Array<{ path: string; content: string }>
  createdAt: string
  source: 'generate' | 'iterate'
}

export interface ProjectWithVersions extends Project {
  versions: ProjectVersion[]
}
