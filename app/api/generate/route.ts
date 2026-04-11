import { runPipeline } from '@/lib/pipeline/orchestrator'
import { logTelemetryPipeline } from '@/lib/telemetry'
import type { SSEEvent, SSEDoneEvent } from '@/types/pipeline'
import type { Blueprint } from '@/types/blueprint'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: { prompt?: string; blueprint?: Blueprint }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        if (event.type === 'done') {
          const data = event.data as SSEDoneEvent
          logTelemetryPipeline({
            success: data.success,
            durationMs: data.totalMs,
          })
        }
        
        const data = `data: ${JSON.stringify(event)}\n\n`
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          // Stream may be closed by client
        }
      }

      try {
        await runPipeline(prompt, emit, body.blueprint)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Pipeline crashed'
        emit({ type: 'error', data: { message, stage: 'failed', recoverable: false } })
        
        logTelemetryPipeline({
          success: false,
          durationMs: 0,
          error: message,
        })
        
        emit({ type: 'done', data: { success: false, previewUrl: null, totalMs: 0 } })
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
      'X-Accel-Buffering': 'no',
    },
  })
}
