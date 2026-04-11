import { createLogger } from '@/lib/logger'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { Project, ProjectVersion, ProjectWithVersions } from './types'

const log = createLogger('store')
const DATA_DIR = path.join(process.cwd(), 'data', 'projects')

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readProject(id: string): Promise<ProjectWithVersions | null> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, `${id}.json`), 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

async function writeProject(project: ProjectWithVersions): Promise<void> {
  await ensureDir()
  await fs.writeFile(
    path.join(DATA_DIR, `${project.id}.json`),
    JSON.stringify(project, null, 2)
  )
}

export async function createProject(opts: {
  name: string
  description: string
  prompt: string
  blueprint: unknown
  files: Array<{ path: string; content: string }>
  sandboxId: string | null
  previewUrl: string | null
}): Promise<Project> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const project: ProjectWithVersions = {
    id,
    name: opts.name,
    description: opts.description,
    createdAt: now,
    updatedAt: now,
    currentVersion: 1,
    sandboxId: opts.sandboxId,
    previewUrl: opts.previewUrl,
    versions: [{
      version: 1,
      prompt: opts.prompt,
      blueprintJson: JSON.stringify(opts.blueprint),
      files: opts.files,
      createdAt: now,
      source: 'generate',
    }],
  }

  await writeProject(project)
  log.info('Project created', { id, name: opts.name })
  return project
}

export async function addVersion(
  projectId: string,
  opts: {
    prompt: string
    blueprint: unknown
    files: Array<{ path: string; content: string }>
    source: 'generate' | 'iterate'
    sandboxId?: string
    previewUrl?: string
  }
): Promise<ProjectVersion | null> {
  const project = await readProject(projectId)
  if (!project) return null

  const version: ProjectVersion = {
    version: project.versions.length + 1,
    prompt: opts.prompt,
    blueprintJson: JSON.stringify(opts.blueprint),
    files: opts.files,
    createdAt: new Date().toISOString(),
    source: opts.source,
  }

  project.versions.push(version)
  project.currentVersion = version.version
  project.updatedAt = version.createdAt
  if (opts.sandboxId) project.sandboxId = opts.sandboxId
  if (opts.previewUrl) project.previewUrl = opts.previewUrl

  await writeProject(project)
  log.info('Version added', { projectId, version: version.version })
  return version
}

export async function rollbackToVersion(
  projectId: string,
  targetVersion: number
): Promise<ProjectVersion | null> {
  const project = await readProject(projectId)
  if (!project) return null

  const target = project.versions.find(v => v.version === targetVersion)
  if (!target) return null

  project.currentVersion = targetVersion
  project.updatedAt = new Date().toISOString()

  await writeProject(project)
  log.info('Rolled back', { projectId, toVersion: targetVersion })
  return target
}

export async function getProject(id: string): Promise<ProjectWithVersions | null> {
  return readProject(id)
}

export async function duplicateProject(projectId: string): Promise<Project | null> {
  const project = await readProject(projectId)
  if (!project) return null

  const newId = crypto.randomUUID()
  const now = new Date().toISOString()
  
  const duplicatedProject: ProjectWithVersions = {
    ...project,
    id: newId,
    name: `Copy of ${project.name}`,
    createdAt: now,
    updatedAt: now,
  }

  await writeProject(duplicatedProject)
  log.info('Project duplicated', { originalId: projectId, newId })
  
  return {
    id: duplicatedProject.id,
    name: duplicatedProject.name,
    description: duplicatedProject.description,
    createdAt: duplicatedProject.createdAt,
    updatedAt: duplicatedProject.updatedAt,
    currentVersion: duplicatedProject.currentVersion,
    sandboxId: duplicatedProject.sandboxId,
    previewUrl: duplicatedProject.previewUrl,
  }
}

export async function listProjects(): Promise<Project[]> {
  await ensureDir()
  const entries = await fs.readdir(DATA_DIR)
  const projects: Project[] = []

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue
    try {
      const data = await fs.readFile(path.join(DATA_DIR, entry), 'utf-8')
      const p: ProjectWithVersions = JSON.parse(data)
      // Return without versions array for list view
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { versions: _versions, ...project } = p
      projects.push(project)
    } catch {
      // Skip corrupted files
    }
  }

  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await fs.unlink(path.join(DATA_DIR, `${id}.json`))
    return true
  } catch {
    return false
  }
}
