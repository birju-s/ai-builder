import { getDefaultProvider } from '@/lib/llm/registry'
import { createLogger } from '@/lib/logger'
import type { DesignSystem } from '@/types/blueprint'

const log = createLogger('agent:designer')

const DESIGNER_SYSTEM = `You are the Designer Agent for SiteForge. Given a site blueprint and business description, create a complete visual design system.

You understand color theory, typography pairing, and modern web aesthetics. Choose colors and fonts that match the business mood and audience.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "colors": {
    "primary": "#hex",
    "primaryForeground": "#hex",
    "secondary": "#hex",
    "secondaryForeground": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "foreground": "#hex",
    "muted": "#hex",
    "mutedForeground": "#hex",
    "border": "#hex",
    "card": "#hex",
    "cardForeground": "#hex"
  },
  "typography": {
    "displayFont": "Google Font Name",
    "bodyFont": "Google Font Name",
    "monoFont": "JetBrains Mono"
  },
  "borderRadius": "0.5rem",
  "mood": "descriptive-mood"
}

RULES:
- All colors must be valid hex codes.
- Background and foreground must have sufficient contrast (WCAG AA).
- primaryForeground must be readable on primary. Same for secondary/secondaryForeground.
- Card colors should be slightly offset from background (e.g. slightly lighter/darker).
- Muted colors should be subtle, low-saturation versions.
- Border should be subtle and work on both card and background.
- Choose display + body font pairing that complements the mood. Use ONLY these safe fonts:
  Inter, DM Sans, Space Grotesk, Outfit, Playfair Display, Lora, Merriweather, Roboto, Open Sans, Poppins, Montserrat, Raleway, Nunito, Work Sans, Manrope, Plus Jakarta Sans, IBM Plex Sans, Geist
- monoFont should always be "JetBrains Mono" or "Geist Mono" or "IBM Plex Mono" or "Fira Code"
- Mood should be a descriptive hyphenated string like "bold-agency", "warm-artisan", "clean-minimal", "luxury-dark"
- borderRadius: "0.5rem" for modern, "0.75rem" for soft, "0.25rem" for sharp, "1rem" for playful
- Output ONLY valid JSON.`

export async function runDesigner(
  businessDescription: string,
  sections: string[]
): Promise<DesignSystem> {
  const provider = getDefaultProvider()
  const timer = log.time('designer')

  const response = await provider.generateText({
    system: DESIGNER_SYSTEM,
    messages: [{
      role: 'user',
      content: `Business: ${businessDescription}\n\nSections on the page: ${sections.join(', ')}\n\nDesign a complete visual system for this website.`,
    }],
    maxTokens: 1024,
    temperature: 0.7,
  })

  timer.end({ tokens: response.inputTokens + response.outputTokens })

  let text = response.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(text) as DesignSystem
  } catch {
    log.error('Designer parse failed', { text: text.slice(0, 500) })
    throw new Error('Failed to parse designer output')
  }
}
