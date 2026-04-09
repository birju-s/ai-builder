import type { ImagePipelineResult } from './image-pipeline'

// Match any image URL pattern the LLM might produce
const IMAGE_URL_REGEX = /https?:\/\/(?:images\.unsplash\.com|source\.unsplash\.com|via\.placeholder\.com|placehold\.co|picsum\.photos)[^\s"'`)\]]+/g
// Also match placeholder src values like "/placeholder.svg" or "placeholder.jpg"
const PLACEHOLDER_SRC_REGEX = /src=["'](?:\/placeholder[^"']*|https?:\/\/placehold[^"']*|#)["']/g

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

    // Strategy 1: Replace Unsplash/placeholder URLs
    content = content.replace(IMAGE_URL_REGEX, (match) => {
      if (!injected) {
        injected = true
        return imageUrl
      }
      return match
    })

    // Strategy 2: Replace placeholder src attributes
    if (!injected) {
      content = content.replace(PLACEHOLDER_SRC_REGEX, (match) => {
        if (!injected) {
          injected = true
          return `src="${imageUrl}"`
        }
        return match
      })
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
