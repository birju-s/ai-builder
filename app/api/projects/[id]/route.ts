import { getProject } from '@/lib/store/project-store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await getProject(id)
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }
    return Response.json({ project })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch project' },
      { status: 500 }
    )
  }
}
