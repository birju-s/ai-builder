import { runIterator } from '@/lib/agents/iterator'
import { addVersion } from '@/lib/store/project-store'
import { createSandboxService } from '@/lib/sandbox/service'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: { sandboxId?: string; message?: string; files?: Array<{ path: string; content: string }>; projectId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { sandboxId, message, files } = body
  if (!sandboxId || !message?.trim() || !Array.isArray(files)) {
    return new Response(
      JSON.stringify({ error: 'sandboxId, message, and files are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (type: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`))
        } catch {
          // Stream may be closed by client
        }
      }

      try {
        emit('iterate-start', { message: message.trim() })

        // Get file changes from iterator agent
        const result = await runIterator(message.trim(), files)
        emit('iterate-files', { files: result.files.map((f) => f.path) })

        // Connect to existing sandbox
        const sandboxService = createSandboxService()
        const sandbox = await sandboxService.connect(sandboxId)

        // Hot-patch: just write files, dev server HMR handles the rest
        emit('iterate-patching', { count: result.files.length })
        await sandbox.writeFiles(result.files.map(f => ({ path: f.path, content: f.content })))

        // Give HMR a moment to recompile
        await new Promise((r) => setTimeout(r, 3000))

        // Save version if projectId provided
        const { projectId } = body
        if (projectId) {
          const updatedFiles = [...files]
          for (const f of result.files) {
            const idx = updatedFiles.findIndex((uf) => uf.path === f.path)
            if (idx >= 0) updatedFiles[idx] = f
            else updatedFiles.push(f)
          }
          await addVersion(projectId, {
            prompt: message.trim(),
            blueprint: {},
            files: updatedFiles,
            source: 'iterate',
          }).catch(() => {})
        }

        emit('iterate-done', {
          success: true,
          files: result.files.map((f) => ({ path: f.path, content: f.content })),
        })
      } catch (error) {
        emit('iterate-error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
