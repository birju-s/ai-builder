import { getDefaultProvider } from '@/lib/llm/registry'
import { createLogger } from '@/lib/logger'
import { runArchitect } from '@/lib/agents/architect'
import { runDesigner } from '@/lib/agents/designer'
import type { Blueprint, SectionType } from '@/types/blueprint'

const log = createLogger('blueprint')

const BLUEPRINT_SYSTEM = `You are the Architect for SiteForge. Given a user's website description, generate a structured JSON blueprint.

OUTPUT FORMAT (strict JSON, no markdown, no explanation):
{
  "name": "Business Name",
  "description": "One-line description",
  "appType": "website",
  "pages": [
    {
      "route": "/",
      "name": "Home",
      "sections": [
        { "id": "hero", "type": "hero", "headline": "...", "subtext": "..." },
        { "id": "features", "type": "features", "headline": "...", "subtext": "..." }
      ]
    }
  ],
  "designSystem": {
    "colors": {
      "primary": "#hex", "primaryForeground": "#hex",
      "secondary": "#hex", "secondaryForeground": "#hex",
      "accent": "#hex", "background": "#hex", "foreground": "#hex",
      "muted": "#hex", "mutedForeground": "#hex", "border": "#hex",
      "card": "#hex", "cardForeground": "#hex"
    },
    "typography": { "displayFont": "Google Font Name", "bodyFont": "Google Font Name", "monoFont": "JetBrains Mono" },
    "borderRadius": "0.5rem",
    "mood": "descriptive mood like bold-agency or warm-artisan"
  }
}

RULES:
- Every website MUST have: navbar, hero, and footer sections.
- Choose 3-5 additional sections that make sense for the business type.
- Valid section types: hero, features, testimonials, pricing, cta, about, contact, gallery, faq, stats, team, footer, navbar
- Colors must be valid hex codes that work well together and match the business mood.
- Use real Google Font names (Inter, Playfair Display, Space Grotesk, DM Sans, Outfit, etc.).
- Headlines and subtext should be realistic, specific to the business — not generic.
- Output ONLY valid JSON. No markdown fences, no explanation.`

export async function generateBlueprint(prompt: string): Promise<Blueprint> {
  const timer = log.time('generateBlueprint')

  try {
    // Two-agent approach: Architect + Designer in sequence
    const structure = await runArchitect(prompt)

    const sectionTypes = structure.pages.flatMap(p => p.sections.map(s => s.type))
    const designSystem = await runDesigner(
      `${structure.name}: ${structure.description}`,
      sectionTypes
    )

    const blueprint: Blueprint = {
      prompt,
      appType: structure.appType || 'website',
      name: structure.name,
      description: structure.description,
      pages: structure.pages.map(p => ({
        route: p.route,
        name: p.name,
        sections: p.sections.map(s => ({
          id: s.id,
          type: s.type as SectionType,
          headline: s.headline,
          subtext: s.subtext,
        })),
      })),
      designSystem,
    }

    timer.end({ approach: 'two-agent' })
    return validateBlueprint(blueprint, prompt)
  } catch (error) {
    log.warn('Two-agent approach failed, falling back to single prompt', {
      error: (error as Error).message,
    })
    // Fall back to single-prompt approach
    return generateBlueprintSinglePrompt(prompt, timer)
  }
}

async function generateBlueprintSinglePrompt(
  prompt: string,
  timer: { end: (data?: Record<string, unknown>) => number }
): Promise<Blueprint> {
  const provider = getDefaultProvider()

  const response = await provider.generateText({
    system: BLUEPRINT_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2048,
    temperature: 0.7,
  })

  timer.end({ approach: 'single-prompt', tokens: response.inputTokens + response.outputTokens })

  let text = response.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const raw = JSON.parse(text)
    return validateBlueprint(raw, prompt)
  } catch (e) {
    log.error('Blueprint parse failed', { text: text.slice(0, 500) })
    throw new Error(`Failed to parse blueprint: ${(e as Error).message}`)
  }
}

function validateBlueprint(raw: unknown, prompt: string): Blueprint {
  const bp = raw as Blueprint
  bp.prompt = prompt

  if (!bp.pages?.length) {
    throw new Error('Blueprint has no pages')
  }

  for (const page of bp.pages) {
    if (!page.sections?.length) {
      throw new Error(`Page ${page.route} has no sections`)
    }
    for (const section of page.sections) {
      const valid: SectionType[] = [
        'hero', 'features', 'testimonials', 'pricing', 'cta',
        'about', 'contact', 'gallery', 'faq', 'stats', 'team', 'footer', 'navbar',
      ]
      if (!valid.includes(section.type)) {
        log.warn('Unknown section type, defaulting to features', { type: section.type })
        section.type = 'features'
      }
    }
  }

  if (!bp.designSystem?.colors?.primary) {
    throw new Error('Blueprint missing design system colors')
  }

  return bp
}
