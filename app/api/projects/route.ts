import { listProjects } from '@/lib/store/project-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const projects = await listProjects()
  return Response.json({ projects })
}
