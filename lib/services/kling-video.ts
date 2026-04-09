import { createLogger } from '@/lib/logger'

const log = createLogger('kling-video')

const KLING_BASE = 'https://api-singapore.klingai.com'

interface KlingVideoRequest {
  imageUrl: string // URL of the hero image (must be publicly accessible)
  prompt?: string // Motion description
  duration?: '5' | '10' // seconds
  aspectRatio?: string // e.g. "16:9"
}

interface KlingVideoResult {
  taskId: string
  videoUrl: string
  durationSec: number
  generationMs: number
}

async function klingFetch(
  path: string,
  opts?: RequestInit
): Promise<Response> {
  const apiKey = process.env.KLING_API_KEY
  if (!apiKey) throw new Error('KLING_API_KEY not set')

  return fetch(`${KLING_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
  })
}

export async function generateHeroVideo(
  req: KlingVideoRequest
): Promise<KlingVideoResult | null> {
  const apiKey = process.env.KLING_API_KEY
  if (!apiKey) {
    log.info('Kling video skipped (no API key)')
    return null
  }

  const timer = log.time('kling-video')

  try {
    // Create the image-to-video task
    const createRes = await klingFetch('/v1/videos/image2video', {
      method: 'POST',
      body: JSON.stringify({
        model_name: 'kling-v2-6',
        image: req.imageUrl,
        prompt:
          req.prompt ||
          'Subtle slow camera movement, gentle parallax, atmospheric particles. Smooth looping cinematic motion. No drastic changes.',
        duration: req.duration || '5',
        mode: 'std',
        aspect_ratio: req.aspectRatio || '16:9',
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      log.warn('Kling task creation failed', {
        status: createRes.status,
        error: err.slice(0, 200),
      })
      return null
    }

    const createData = await createRes.json()
    const taskId = createData?.data?.task_id
    if (!taskId) {
      log.warn('No task_id in Kling response')
      return null
    }

    log.info('Kling video task created', { taskId })

    // Poll for completion (max 5 minutes)
    const maxPollMs = 5 * 60 * 1000
    const pollInterval = 10_000
    const startTime = Date.now()

    while (Date.now() - startTime < maxPollMs) {
      await new Promise((r) => setTimeout(r, pollInterval))

      const pollRes = await klingFetch(`/v1/videos/image2video/${taskId}`)
      if (!pollRes.ok) continue

      const pollData = await pollRes.json()
      const status = pollData?.data?.task_status

      if (status === 'succeed') {
        const videoUrl = pollData?.data?.task_result?.videos?.[0]?.url
        if (!videoUrl) {
          log.warn('Kling task succeeded but no video URL')
          return null
        }

        const generationMs = timer.end({ success: true, taskId })
        return {
          taskId,
          videoUrl,
          durationSec: parseInt(req.duration || '5', 10),
          generationMs,
        }
      }

      if (status === 'failed') {
        log.warn('Kling video task failed', {
          taskId,
          msg: pollData?.data?.task_status_msg,
        })
        timer.end({ success: false, taskId })
        return null
      }

      // Still processing, continue polling
    }

    log.warn('Kling video task timed out', { taskId })
    timer.end({ success: false, taskId, reason: 'timeout' })
    return null
  } catch (error) {
    timer.end({ success: false, error: (error as Error).message })
    log.error('Kling video generation error', {
      error: (error as Error).message,
    })
    return null
  }
}
