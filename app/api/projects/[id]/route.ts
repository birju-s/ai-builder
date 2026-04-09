import { getProject, deleteProject } from '@/lib/store/project-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }
  return Response.json({ project })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteProject(id)
  if (!deleted) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }
  return Response.json({ success: true })
}
