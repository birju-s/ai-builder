import { getDefaultProvider } from '@/lib/llm/registry'
import { createLogger } from '@/lib/logger'
import { getDesignSystemRules } from '@/lib/prompts/rules'

const log = createLogger('agent:architect')

const ARCHITECT_SYSTEM = `You are the Architect Agent for SiteForge. Given a user's website description, plan the site structure.

MOST IMPORTANT RULE: The website you plan MUST match EXACTLY what the user asked for. If they say "photography portfolio", you build a photography portfolio. If they say "coffee shop", you build a coffee shop. NEVER substitute a different business type.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "name": "Business Name",
  "description": "One-line description matching the user's request",
  "appType": "website",
  "pages": [
    {
      "route": "/",
      "name": "Home",
      "sections": [
        { "id": "navbar", "type": "navbar", "headline": "Brand Name", "subtext": "Navigation" },
        { "id": "hero", "type": "hero", "headline": "...", "subtext": "..." },
        { "id": "features", "type": "features", "headline": "...", "subtext": "..." },
        { "id": "footer", "type": "footer", "headline": "Brand Name", "subtext": "Copyright info" }
      ]
    }
  ]
}

RULES:
- READ THE USER'S PROMPT CAREFULLY. The name, description, headlines, and subtext must ALL reflect the specific business/person/topic they described.
- Every website MUST have navbar, hero, and footer sections.
- Choose 3-5 additional sections that make sense for THIS specific business.
- If the user explicitly asks for sections like menu, services, schedule, pricing, testimonials, gallery, about, or contact, include those exact section types in the plan.
- Valid section types: hero, features, services, menu, schedule, testimonials, pricing, cta, about, contact, gallery, faq, stats, team, footer, navbar
- Each section needs a unique id (lowercase, e.g. "hero", "features-1", "testimonials").
- Headlines and subtext must be realistic, compelling, and specific to THIS business — NOT generic placeholder text.
- Think about the user journey: what sections will best convert visitors for this type of business?
- Default toward a modern premium site structure: an image-led hero, a navbar that can work as a transparent-to-solid scroll header, and a mix of section types that avoids repetitive card-grid fatigue.
- Prefer section combinations that create visual rhythm (for example hero + split story + balanced feature grid + testimonial proof + CTA), not five similar box sections in a row.
- CRITICAL: If you include the user's quotes or catchphrases in the output strings, you MUST use single quotes or properly escape double quotes (e.g. \"quote\"). The output MUST be valid parseable JSON without syntax errors.
- Output ONLY valid JSON.`

export interface ArchitectOutput {
  name: string
  description: string
  appType: 'website' | 'fullstack'
  pages: Array<{
    route: string
    name: string
    sections: Array<{
      id: string
      type: string
      headline: string
      subtext: string
    }>
  }>
}

export async function runArchitect(prompt: string): Promise<ArchitectOutput> {
  const provider = getDefaultProvider()
  const timer = log.time('architect')

  log.info('Architect invoked', { prompt: prompt.slice(0, 200) })

  const response = await provider.generateText({
    agentId: 'architect',
    system: ARCHITECT_SYSTEM + getDesignSystemRules(),
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2048,
    temperature: 0.7,
  })

  timer.end({ tokens: response.inputTokens + response.outputTokens })

  let text = response.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(text) as ArchitectOutput
  } catch {
    log.error('Architect parse failed', { text: text.slice(0, 500) })
    throw new Error('Failed to parse architect output')
  }
}
