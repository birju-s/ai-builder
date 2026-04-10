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
          // Generate one image for the features section
          requests.push({
            id: `${section.id}-main`,
            sectionId: section.id,
            sectionType: section.type,
            prompt: `Clean editorial image for the ${section.type} section of "${blueprint.name}". ${locationContext} Modern, premium, high quality. Mood: ${mood}. No text. Related to: "${section.headline}".`,
            aspect: '4:3',
            role: 'feature',
          })
          break
        case 'menu':
          requests.push({
            id: `${section.id}-main`,
            sectionId: section.id,
            sectionType: section.type,
            prompt: `Editorial food and drink photography for "${blueprint.name}". ${locationContext} Premium menu presentation, beautiful styling, natural light, high quality, no text. Related to: "${section.headline}".`,
            aspect: '4:3',
            role: 'feature',
          })
          break
        case 'testimonials':
        case 'team':
          requests.push({
            id: `${section.id}-main`,
            sectionId: section.id,
            sectionType: section.type,
            prompt: `Professional headshot portrait, warm lighting, neutral background, friendly expression. ${locationContext} High quality photo.`,
            aspect: '1:1',
            role: 'testimonial',
          })
          break
        // gallery, contact, etc get a general image
        case 'gallery':
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
  sectionImageMap: Record<string, string> // sectionId -> publicUrl
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

  // Generate all images in parallel (max 3 concurrent)
  const CONCURRENCY = 3
  const results: (ImageResult | null)[] = []

  for (let i = 0; i < requests.length; i += CONCURRENCY) {
    const batch = requests.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(batch.map(generateImage))
    results.push(...batchResults)
  }

  const images = results.filter((r): r is ImageResult => r !== null)
  const sectionImageMap: Record<string, string> = {}
  for (const img of images) {
    const sectionId = requests.find((r) => r.id === img.id)?.sectionId
    if (sectionId) sectionImageMap[sectionId] = img.publicUrl
  }

  log.info('Image pipeline complete', {
    generated: images.length,
    failed: results.length - images.length,
  })

  return { images, sectionImageMap }
}
