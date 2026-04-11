import { duplicateProject } from '@/lib/store/project-store'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await duplicateProject(id)
    
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    return Response.json({ project })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate project' },
      { status: 500 }
    )
  }
}
