import { z } from 'zod'
import { Sandbox } from 'e2b'

const writeSchema = z.object({
  sandboxId: z.string().min(1, 'sandboxId is required'),
  path: z.string().min(1, 'path is required'),
  content: z.string(),
})

export async function POST(req: Request) {
  let body: z.infer<typeof writeSchema>
  try {
    const rawBody = await req.json()
    body = writeSchema.parse(rawBody)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Validation failed', issues: error.issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { sandboxId, path, content } = body

  try {
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: process.env.E2B_API_KEY!,
    })
    await sandbox.files.write(path, content)

    return Response.json({ success: true })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
