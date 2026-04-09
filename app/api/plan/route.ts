import { generateBlueprint } from '@/lib/templates/blueprint'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: { prompt?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  try {
    const blueprint = await generateBlueprint(prompt)
    return Response.json({ blueprint })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Blueprint generation failed' },
      { status: 500 }
    )
  }
}
