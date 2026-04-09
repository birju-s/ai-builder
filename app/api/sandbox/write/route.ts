import { Sandbox } from 'e2b'

export async function POST(req: Request) {
  const { sandboxId, path, content } = await req.json()

  if (!sandboxId || !path || content === undefined) {
    return new Response(JSON.stringify({ error: 'sandboxId, path, and content required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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
