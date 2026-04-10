import type { ImagePipelineResult } from './image-pipeline'

// Match any image URL pattern the LLM might produce
const IMAGE_URL_REGEX = /https?:\/\/(?:images\.unsplash\.com|source\.unsplash\.com|image\.pollinations\.ai|via\.placeholder\.com|placehold\.co|picsum\.photos)[^\s"'`)\]]+/g
// Also match placeholder src values like "/placeholder.svg" or "placeholder.jpg"
const PLACEHOLDER_SRC_REGEX = /src=["'](?:\/placeholder[^"']*|https?:\/\/placehold[^"']*|#)["']/g

function scoreImageCandidate(url: string): number {
  const queryWidth = url.match(/[?&](?:w|width)=(\d{2,5})/i)?.[1]
  const queryHeight = url.match(/[?&](?:h|height)=(\d{2,5})/i)?.[1]
  if (queryWidth && queryHeight) {
    return Number(queryWidth) * Number(queryHeight)
  }

  const pathSize = url.match(/(\d{2,5})x(\d{2,5})/i)
  if (pathSize) {
    return Number(pathSize[1]) * Number(pathSize[2])
  }

  if (url.includes('/placeholder')) return 10
  if (url.includes('placehold') || url.includes('picsum')) return 100
  return 1
}

function replaceMatchAtIndex(content: string, match: string, index: number, replacement: string): string {
  return content.slice(0, index) + replacement + content.slice(index + match.length)
}

export function injectImages(
  files: Array<{ path: string; content: string }>,
  imageResult: ImagePipelineResult
): Array<{ path: string; content: string }> {
  if (imageResult.images.length === 0) return files

  // Build a queue of available images by section type for fallback
  const imagesByType = new Map<string, string>()
  for (const [sectionId, url] of Object.entries(imageResult.sectionImageMap)) {
    imagesByType.set(sectionId.toLowerCase(), url)
  }

  return files.map((file) => {
    if (!file.path.endsWith('.tsx')) return file

    let content = file.content

    // Extract section type from filename: "HeroSection.tsx" -> "hero", "AboutSection.tsx" -> "about"
    const sectionMatch = file.path.match(/sections\/(\w+)Section\.tsx$/i)
    if (!sectionMatch) return file

    const sectionType = sectionMatch[1].toLowerCase()

    // Find the best matching image: exact sectionId match, then type match, then any
    const imageUrl =
      imagesByType.get(sectionType) ||
      [...imagesByType.entries()].find(([key]) => key.includes(sectionType))?.[1] ||
      [...imagesByType.entries()].find(([key]) => key.startsWith(sectionType))?.[1]

    if (!imageUrl) return file

    let injected = false

    // Strategy 1: Replace the most prominent remote placeholder/image URL
    const remoteCandidates = Array.from(content.matchAll(IMAGE_URL_REGEX))
      .flatMap((candidate) =>
        typeof candidate.index === 'number'
          ? [{ match: candidate[0], index: candidate.index }]
          : []
      )
      .sort((a, b) => scoreImageCandidate(b.match) - scoreImageCandidate(a.match))

    if (remoteCandidates.length > 0) {
      const bestCandidate = remoteCandidates[0]
      content = replaceMatchAtIndex(content, bestCandidate.match, bestCandidate.index, imageUrl)
      injected = true
    }

    // Strategy 2: Replace placeholder src attributes
    if (!injected) {
      const placeholderCandidate = Array.from(content.matchAll(PLACEHOLDER_SRC_REGEX))
        .flatMap((candidate) =>
          typeof candidate.index === 'number'
            ? [{ match: candidate[0], index: candidate.index }]
            : []
        )[0]

      if (placeholderCandidate) {
        content = replaceMatchAtIndex(
          content,
          placeholderCandidate.match,
          placeholderCandidate.index,
          `src="${imageUrl}"`
        )
        injected = true
      }
    }

    // Strategy 3: If there's an <img tag with no real src, inject one
    if (!injected) {
      const imgWithoutSrc = /<img(?=[^>]*\/>)(?![^>]*src=)/
      if (imgWithoutSrc.test(content)) {
        content = content.replace(imgWithoutSrc, `<img src="${imageUrl}" `)
        injected = true
      }
    }

    return { ...file, content }
  })
}
