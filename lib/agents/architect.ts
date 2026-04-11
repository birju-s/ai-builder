import { getDefaultProvider } from '@/lib/llm/registry'
import { AnthropicProvider } from '@/lib/llm/anthropic'
import { createLogger } from '@/lib/logger'
import { getDesignSystemRules } from '@/lib/prompts/rules'

const log = createLogger('agent:architect')

const ARCHITECT_SYSTEM = `You are the Architect Agent for SiteForge. Given a user's website description, plan the site structure.

MOST IMPORTANT RULE: The website you plan MUST match EXACTLY what the user asked for. If they say "photography portfolio", you build a photography portfolio. If they say "coffee shop", you build a coffee shop. NEVER substitute a different business type.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "ambiguity_score": 1,
  "name": "Business Name",
  "description": "One-line description matching the user's request",
  "appType": "website",
  "models": [
    { "name": "User", "fields": [{ "name": "email", "type": "String", "isUnique": true }] }
  ],
  "apiRoutes": [
    { "method": "GET", "path": "/api/users", "description": "Fetch all users" }
  ],
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
- Evaluate the user's prompt and assign an "ambiguity_score" from 1-10. 1 means extremely detailed and specific, 10 means very vague (e.g. "make me a site").
- Set "appType" to "fullstack" if the user asks for dynamic database features (e.g., login, dashboard, e-commerce, blog with CMS, user profiles, save data). Otherwise, set it to "website".
- If "appType" is "fullstack", you MUST include a "models" array defining the database schema, and an "apiRoutes" array defining the backend endpoints.
- If "appType" is "website", "models" and "apiRoutes" should be empty arrays or omitted.
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
  ambiguity_score?: number
  name: string
  description: string
  appType: 'website' | 'fullstack'
  models?: Array<{
    name: string
    fields: Array<{
      name: string
      type: string
      isUnique?: boolean
      isOptional?: boolean
    }>
  }>
  apiRoutes?: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    description: string
  }>
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
  const timer = log.time('architect')
  log.info('Architect invoked (pass 1: Haiku)', { prompt: prompt.slice(0, 200) })

  const systemPrompt = ARCHITECT_SYSTEM + getDesignSystemRules()
  
  // Pass 1: Try with Haiku (fast & cheap)
  const haikuProvider = new AnthropicProvider('claude-3-haiku-20240307')
  
  try {
    const haikuResponse = await haikuProvider.generateText({
      agentId: 'architect',
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 8192,
      temperature: 0.7,
    })

    let text = haikuResponse.text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
    }

    const output = JSON.parse(text) as ArchitectOutput
    
    // If ambiguity score is low, Haiku's output is good enough
    if (output.ambiguity_score && output.ambiguity_score <= 6) {
      log.info('Architect pass 1 succeeded', { ambiguity: output.ambiguity_score })
      timer.end({ tokens: haikuResponse.inputTokens + haikuResponse.outputTokens, model: 'haiku' })
      return output
    }
    
    log.info('Architect escalating to Sonnet due to ambiguity', { ambiguity: output.ambiguity_score })
  } catch (err) {
    log.warn('Architect pass 1 failed, escalating to Sonnet', { error: err instanceof Error ? err.message : String(err) })
  }

  // Pass 2: Escalate to Sonnet (default provider)
  const provider = getDefaultProvider()
  log.info('Architect pass 2: Sonnet')
  
  const response = await provider.generateText({
    agentId: 'architect',
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 8192,
    temperature: 0.7,
  })

  timer.end({ tokens: response.inputTokens + response.outputTokens, model: 'sonnet' })

  let text = response.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(text) as ArchitectOutput
  } catch {
    log.error('Architect pass 2 failed', { text: text.slice(0, 500) })
    throw new Error('Failed to parse architect output')
  }
}
