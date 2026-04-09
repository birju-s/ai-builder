import { rollbackToVersion, getProject } from '@/lib/store/project-store'
import { Sandbox } from 'e2b'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { version } = body

  if (typeof version !== 'number') {
    return Response.json({ error: 'version number is required' }, { status: 400 })
  }

  const target = await rollbackToVersion(id, version)
  if (!target) {
    return Response.json({ error: 'Version not found' }, { status: 404 })
  }

  // If the project has an active sandbox, write the rolled-back files to it
  const project = await getProject(id)
  if (project?.sandboxId) {
    try {
      const sandbox = await Sandbox.connect(project.sandboxId, {
        apiKey: process.env.E2B_API_KEY!,
      })
      for (const f of target.files) {
        await sandbox.files.write(f.path, f.content)
      }
    } catch {
      // Sandbox may have expired, that's ok
    }
  }

  return Response.json({ success: true, version: target })
}
