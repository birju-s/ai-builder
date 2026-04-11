import { listProjects } from '@/lib/store/project-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await listProjects()
    return Response.json({ projects })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
