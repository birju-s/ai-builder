import { z } from 'zod'
import { getProject, updateProject } from '@/lib/store/project-store'
import { pushToGitHub } from '@/lib/services/github'

const githubSyncSchema = z.object({
  token: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawBody = await req.json()
    const body = githubSyncSchema.parse(rawBody)
    const { id } = await params

    const token = body.token || process.env.GITHUB_TOKEN
    if (!token) {
      return Response.json({ error: 'GitHub token is required (either in body or GITHUB_TOKEN env var)' }, { status: 401 })
    }

    const project = await getProject(id)
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const version = project.versions.find((v) => v.version === project.currentVersion)
    if (!version) {
      return Response.json({ error: 'Current version not found' }, { status: 404 })
    }

    if (!version.files || version.files.length === 0) {
      return Response.json({ error: 'No files to sync in the current version' }, { status: 400 })
    }

    // Convert name to a valid repo name: "My Project" -> "my-project"
    const repoName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const commitMessage = `Sync version ${version.version}: ${project.name}\n\nGenerated via SiteForge AI`

    const result = await pushToGitHub(
      token,
      repoName,
      version.files,
      commitMessage
    )

    // Save the github URL back to the project (optional, but good for UX)
    await updateProject(project.id, {
      ...project,
      githubUrl: result.url,
    })

    return Response.json({ success: true, url: result.url, commitSha: result.commitSha })
  } catch (error) {
    console.error('GitHub sync route error:', error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', issues: error.issues }, { status: 400 })
    }
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error during GitHub sync' },
      { status: 500 }
    )
  }
}
