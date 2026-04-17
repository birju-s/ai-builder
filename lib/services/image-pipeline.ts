import { createLogger } from '@/lib/logger'

const log = createLogger('image-pipeline')

export interface ImageRequest {
  id: string
  sectionId: string
  sectionType: string
  prompt: string
  aspect: '16:9' | '4:3' | '1:1' | '3:2'
  role: 'hero' | 'feature' | 'about' | 'testimonial' | 'general'
}

export interface ImageResult {
  id: string
  localPath: string // e.g. "public/images/hero-main.webp"
  publicUrl: string // e.g. "/images/hero-main.webp" (for use in components)
  base64Data: string // raw base64 for writing to sandbox
  mimeType: string
  generationMs: number
}

// Map section types to contextual image prompts
function buildImagePrompts(blueprint: {
  name: string
  description: string
  prompt?: string
  designSystem: {
    mood: string
    colors: { primary: string; background: string }
  }
  pages: Array<{
    sections: Array<{
      id: string
      type: string
      headline: string
      subtext: string
    }>
  }>
}): ImageRequest[] {
  const requests: ImageRequest[] = []
  const mood = blueprint.designSystem.mood
  const locationContext = `Context: ${blueprint.description}. CRITICAL: If a specific location, city, or culture is mentioned, ensure the architecture, people, and atmosphere authentically reflect that locale.`
  const originalPromptContext = blueprint.prompt ? ` User requested details: "${blueprint.prompt}".` : ''

  for (const page of blueprint.pages) {
    for (const section of page.sections) {
      switch (section.type) {
        case 'hero':
          requests.push({
            id: `${section.id}-main`,
            sectionId: section.id,
            sectionType: section.type,
            prompt: `Professional hero image for "${blueprint.name}". ${locationContext}${originalPromptContext} Mood: ${mood}. Wide cinematic shot, high quality, no text or watermarks. Related to: "${section.headline}".`,
            aspect: '16:9',
            role: 'hero',
          })
          break
        case 'about':
          requests.push({
            id: `${section.id}-main`,
            sectionId: section.id,
            sectionType: section.type,
            prompt: `Professional about/team photo for "${blueprint.name}". ${locationContext} Warm, authentic feel. Mood: ${mood}. No text. Related to: "${section.headline}".`,
            aspect: '4:3',
            role: 'about',
          })
          break
        case 'features':
        case 'services':
        case 'gallery':
        case 'menu':
        case 'team':
        case 'testimonials':
          // Generate 4 images for grid sections to populate multiple cards
          for (let i = 1; i <= 4; i++) {
            requests.push({
              id: `${section.id}-grid-${i}`,
              sectionId: section.id,
              sectionType: section.type,
              prompt: `Editorial high quality image for the ${section.type} section of "${blueprint.name}". Context: ${blueprint.description}. Item ${i}. ${locationContext} Modern, premium, no text. Related to: "${section.headline}".`,
              aspect: section.type === 'team' || section.type === 'testimonials' ? '1:1' : '4:3',
              role: section.type === 'team' || section.type === 'testimonials' ? 'testimonial' : 'feature',
            })
          }
          break
        case 'about':
        case 'contact':
        case 'cta':
        case 'schedule':
          requests.push({
            id: `${section.id}-main`,
            sectionId: section.id,
            sectionType: section.type,
            prompt: `Professional photo for a ${section.type} section of "${blueprint.name}". ${locationContext} Mood: ${mood}. No text. "${section.headline}".`,
            aspect: '16:9',
            role: 'general',
          })
          break
        // navbar, footer, pricing, faq, stats don't need images
      }
    }
  }
  return requests
}

async function generateImage(
  request: ImageRequest
): Promise<ImageResult | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) return null

  const timer = log.time(`image ${request.id}`)

  // Use gemini-2.5-flash-image (stable, fast) for pipeline speed
  // Fallback chain: 2.5-flash-image -> 3.1-flash-image-preview
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            imageConfig: {
              aspectRatio: request.aspect.replace(':', ':'),
            },
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      log.warn('Image generation API error', {
        status: res.status,
        error: errText.slice(0, 200),
      })
      return null
    }

    const data = await res.json()
    const parts = data?.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find(
      (p: Record<string, unknown>) => p.inlineData
    )

    if (!imagePart?.inlineData?.data) {
      log.warn('No image in response', { id: request.id })
      return null
    }

    const { mimeType, data: b64 } = imagePart.inlineData as {
      mimeType: string
      data: string
    }
    
    let ext = 'webp'
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg'
    else if (mimeType.includes('png')) ext = 'png'
    
    const filename = `${request.id}.${ext}`

    const generationMs = timer.end({ success: true })

    return {
      id: request.id,
      localPath: `public/images/${filename}`,
      publicUrl: `/images/${filename}`,
      base64Data: b64,
      mimeType,
      generationMs,
    }
  } catch (error) {
    timer.end({ success: false, error: (error as Error).message })
    log.error('Image generation failed', {
      id: request.id,
      error: (error as Error).message,
    })
    return null
  }
}

export interface ImagePipelineResult {
  images: ImageResult[]
  sectionImageMap: Record<string, string[]> // sectionId -> publicUrls
}

export async function runImagePipeline(blueprint: {
  name: string
  description: string
  prompt?: string
  designSystem: {
    mood: string
    colors: { primary: string; background: string }
  }
  pages: Array<{
    sections: Array<{
      id: string
      type: string
      headline: string
      subtext: string
    }>
  }>
}): Promise<ImagePipelineResult> {
  const requests = buildImagePrompts(blueprint)

  if (requests.length === 0 || !process.env.GOOGLE_AI_API_KEY) {
    log.info('Image pipeline skipped', {
      reason: requests.length === 0 ? 'no requests' : 'no API key',
    })
    return { images: [], sectionImageMap: {} }
  }

  log.info('Image pipeline starting', { count: requests.length })

  // Generate all images in parallel (max 5 concurrent)
  const CONCURRENCY = 5
  const results: (ImageResult | null)[] = []

  for (let i = 0; i < requests.length; i += CONCURRENCY) {
    const batch = requests.slice(i, i + CONCURRENCY)
    
    // Add a 15-second strict timeout to prevent image pipeline from hanging the build forever
    const batchResults = await Promise.all(
      batch.map((req) => 
        Promise.race([
          generateImage(req),
          new Promise<null>((resolve) => 
            setTimeout(() => {
              log.warn('Image generation timed out', { id: req.id })
              resolve(null)
            }, 15000)
          )
        ])
      )
    )
    results.push(...batchResults)
  }

  const images = results.filter((r): r is ImageResult => r !== null)
  const sectionImageMap: Record<string, string[]> = {}
  for (const img of images) {
    const sectionId = requests.find((r) => r.id === img.id)?.sectionId
    if (sectionId) {
      if (!sectionImageMap[sectionId]) sectionImageMap[sectionId] = []
      sectionImageMap[sectionId].push(img.publicUrl)
    }
  }

  log.info('Image pipeline complete', {
    generated: images.length,
    failed: results.length - images.length,
  })

  return { images, sectionImageMap }
}
