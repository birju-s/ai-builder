import { z } from 'zod'
import { generateBlueprint } from '@/lib/templates/blueprint'

const planSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
})

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: z.infer<typeof planSchema>
  try {
    const rawBody = await req.json()
    body = planSchema.parse(rawBody)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', issues: error.issues }, { status: 400 })
    }
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = body.prompt.trim()

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
