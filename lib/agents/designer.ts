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
  "layout": {
    "styleMode": "editorial",
    "heroStyle": "full-bleed-cinematic",
    "sectionRhythm": "alternating-editorial",
    "cardStyle": "balanced-soft",
    "navStyle": "transparent-to-solid",
    "motionLevel": "subtle"
  },
  "rhythm": {
    "sectionSpacing": "airy",
    "headingScale": "dramatic",
    "contentWidth": "wide",
    "textDensity": "airy"
  },
  "borderRadius": "0.5rem",
  "mood": "descriptive-mood"
}

RULES:
- All colors must be valid hex codes.
- Background and foreground must have sufficient contrast (WCAG AA).
- Default to light, clean, and airy background colors (e.g. white, off-white, light gray) unless the business description explicitly demands a dark theme.
- primaryForeground must be readable on primary. Same for secondary/secondaryForeground.
- Card colors should be slightly offset from background (e.g. slightly lighter/darker).
- Muted colors should be subtle, low-saturation versions.
- Border should be subtle and work on both card and background.
- Choose display + body font pairing that complements the mood. Use ONLY these safe fonts:
  Inter, DM Sans, Space Grotesk, Outfit, Playfair Display, Lora, Merriweather, Roboto, Open Sans, Poppins, Montserrat, Raleway, Nunito, Work Sans, Manrope, Plus Jakarta Sans, IBM Plex Sans, Geist
- monoFont should always be "JetBrains Mono" or "Geist Mono" or "IBM Plex Mono" or "Fira Code"
- Mood should be a descriptive hyphenated string like "bold-agency", "warm-artisan", "clean-minimal", "luxury-dark"
- borderRadius: "0.5rem" for modern, "0.75rem" for soft, "0.25rem" for sharp, "1rem" for playful
- layout.styleMode must be one of: editorial, image-led, luxury, minimal, bold
- layout.heroStyle must be one of: full-bleed-cinematic, split-editorial, immersive-collage, story-led
- layout.sectionRhythm must be one of: alternating-editorial, featured-plus-grid, stacked-storytelling, mixed-showcase
- layout.cardStyle must be one of: balanced-soft, media-forward, minimal-outline, elevated-premium
- layout.navStyle must be one of: transparent-to-solid, glass-floating, solid-sticky
- layout.motionLevel must be one of: none, subtle, premium, expressive
- rhythm.sectionSpacing must be one of: airy, balanced, compact
- rhythm.headingScale must be one of: dramatic, assertive, refined
- rhythm.contentWidth must be one of: wide, balanced, narrow
- rhythm.textDensity must be one of: airy, balanced, dense
- Choose layout directions that reduce template feel, increase section variety, and keep cards/media visually balanced.
- Choose rhythm directions that improve spacing discipline and typography hierarchy across the page.
- For image-led, luxury, or photography-heavy heroes, prefer navStyle "glass-floating" unless the top hero area is visually calm enough for transparent-to-solid.
- If navStyle is "glass-floating", the intended surface should be clearly visible in the first viewport: meaningful blur, a visible border, and enough tint/opacity to separate it from the hero image.
- Output ONLY valid JSON.`

export async function runDesigner(
  businessDescription: string,
  sections: string[],
  originalPrompt?: string
): Promise<DesignSystem> {
  const provider = getDefaultProvider()
  const timer = log.time('designer')
  
  const promptContext = originalPrompt 
    ? `\n\nUSER's ORIGINAL REQUEST (Pay attention to any color, mood, or font preferences mentioned here):\n"${originalPrompt}"`
    : ''

  const response = await provider.generateText({
    system: DESIGNER_SYSTEM,
    messages: [{
      role: 'user',
      content: `Business: ${businessDescription}${promptContext}\n\nSections on the page: ${sections.join(', ')}\n\nDesign a complete visual system for this website. Make the layout feel premium and current, avoid repetitive boxy grids, prefer strong hero art direction plus balanced section variety, choose a typography/spacing rhythm with clear hierarchy, and favor a readable glass/frosted navbar when the hero image is visually busy.`,
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
