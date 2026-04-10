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
    "mood": "descriptive mood like bold-agency or warm-artisan"
  }
}

RULES:
- Every website MUST have: navbar, hero, and footer sections.
- Choose 3-5 additional sections that make sense for the business type.
- If the user explicitly asks for sections like menu, services, schedule, pricing, testimonials, gallery, about, or contact, include those exact section types.
- Valid section types: hero, features, services, menu, schedule, testimonials, pricing, cta, about, contact, gallery, faq, stats, team, footer, navbar
- Colors must be valid hex codes that work well together and match the business mood.
- Use real Google Font names (Inter, Playfair Display, Space Grotesk, DM Sans, Outfit, etc.).
- Headlines and subtext should be realistic, specific to the business — not generic.
- Default toward a modern premium structure: image-led hero, scroll-aware navbar, varied section rhythm, and fewer repetitive card grids.
- Prefer section combinations that create editorial flow rather than many similar box sections in a row.
- If the hero is image-heavy, prefer a glass/frosted navbar treatment over pure transparency so readability stays strong from the first viewport.
- Preserve hero photography: avoid stacking multiple heavy dark overlays that make the first screen feel murky.
- If using a glass/frosted navbar treatment, it should be visibly separated from the hero image, not an almost invisible overlay.
- designSystem.layout must use these exact enums:
  - styleMode: editorial | image-led | luxury | minimal | bold
  - heroStyle: full-bleed-cinematic | split-editorial | immersive-collage | story-led
  - sectionRhythm: alternating-editorial | featured-plus-grid | stacked-storytelling | mixed-showcase
  - cardStyle: balanced-soft | media-forward | minimal-outline | elevated-premium
  - navStyle: transparent-to-solid | glass-floating | solid-sticky
  - motionLevel: none | subtle | premium | expressive
- designSystem.rhythm must use these exact enums:
  - sectionSpacing: airy | balanced | compact
  - headingScale: dramatic | assertive | refined
  - contentWidth: wide | balanced | narrow
  - textDensity: airy | balanced | dense
- Output ONLY valid JSON. No markdown fences, no explanation.`

const VALID_SECTION_TYPES: SectionType[] = [
  'hero',
  'features',
  'services',
  'menu',
  'schedule',
  'testimonials',
  'pricing',
  'cta',
  'about',
  'contact',
  'gallery',
  'faq',
  'stats',
  'team',
  'footer',
  'navbar',
]

const SECTION_TYPE_ALIASES: Record<string, SectionType> = {
  feature: 'features',
  features: 'features',
  service: 'services',
  services: 'services',
  offering: 'services',
  offerings: 'services',
  package: 'services',
  packages: 'services',
  menu: 'menu',
  menus: 'menu',
  foodmenu: 'menu',
  drinkmenu: 'menu',
  schedule: 'schedule',
  schedules: 'schedule',
  timetable: 'schedule',
  calendar: 'schedule',
  classschedule: 'schedule',
  hours: 'schedule',
  openinghours: 'schedule',
  testimonials: 'testimonials',
  testimonial: 'testimonials',
  reviews: 'testimonials',
  review: 'testimonials',
  pricing: 'pricing',
  price: 'pricing',
  prices: 'pricing',
  plans: 'pricing',
  tiers: 'pricing',
  cta: 'cta',
  about: 'about',
  story: 'about',
  contact: 'contact',
  contactform: 'contact',
  gallery: 'gallery',
  portfolio: 'gallery',
  projects: 'gallery',
  work: 'gallery',
  faq: 'faq',
  faqs: 'faq',
  questions: 'faq',
  stats: 'stats',
  statistics: 'stats',
  team: 'team',
  staff: 'team',
  trainers: 'team',
  trainerprofiles: 'team',
  footer: 'footer',
  navbar: 'navbar',
  header: 'navbar',
}

function canonicalizeSectionType(value: string): string {
  return value.toLowerCase().trim().replace(/[\s_-]+/g, '')
}

function normalizeSectionType(value: string): SectionType | null {
  const canonical = canonicalizeSectionType(value)
  const directMatch = VALID_SECTION_TYPES.find((type) => canonicalizeSectionType(type) === canonical)
  return directMatch || SECTION_TYPE_ALIASES[canonical] || null
}

function inferSectionType(section: { type: string; headline: string; subtext: string }): SectionType | null {
  const source = `${section.type} ${section.headline} ${section.subtext}`.toLowerCase()

  if (/\b(menu|espresso|latte|coffee|pastr(?:y|ies)|breakfast|brunch|cocktail|wine|dish|plates?)\b/.test(source)) {
    return 'menu'
  }
  if (/\b(services?|offerings?|packages?|deliverables?)\b/.test(source)) {
    return 'services'
  }
  if (/\b(schedule|timetable|calendar|hours|opening hours|class(?:es)?|availability)\b/.test(source)) {
    return 'schedule'
  }
  if (/\b(testimonials?|reviews?)\b/.test(source)) {
    return 'testimonials'
  }
  if (/\b(pricing|plans?|tiers?)\b/.test(source)) {
    return 'pricing'
  }
  if (/\b(portfolio|gallery|projects?|selected work)\b/.test(source)) {
    return 'gallery'
  }
  if (/\b(team|staff|trainers?)\b/.test(source)) {
    return 'team'
  }
  if (/\b(contact|reach out|get in touch|visit us)\b/.test(source)) {
    return 'contact'
  }
  if (/\b(about|our story|story)\b/.test(source)) {
    return 'about'
  }

  return null
}

function deriveRequestedSections(prompt: string): SectionType[] {
  const source = prompt.toLowerCase()
  const requested = new Set<SectionType>()

  if (/\bmenu\b|\bmenus\b|\bdrinks?\b|\bfood menu\b/.test(source)) requested.add('menu')
  if (/\bservices?\b|\bofferings?\b/.test(source)) requested.add('services')
  if (/\bclass schedule\b|\bschedule\b|\btimetable\b|\bhours\b|\bopening hours\b|\bavailability\b/.test(source)) requested.add('schedule')
  if (/\bpricing\b|\bplans?\b|\btiers?\b/.test(source)) requested.add('pricing')
  if (/\btestimonials?\b|\breviews?\b/.test(source)) requested.add('testimonials')
  if (/\babout\b|\bour story\b|\bstory\b/.test(source)) requested.add('about')
  if (/\bcontact\b|\bcontact form\b|\bget in touch\b/.test(source)) requested.add('contact')
  if (/\bteam\b|\bstaff\b|\btrainers?\b|\bprofiles\b/.test(source)) requested.add('team')
  if (/\bgallery\b|\bportfolio\b|\bphotos?\b|\bprojects?\b/.test(source)) requested.add('gallery')

  return [...requested]
}

function buildFallbackSection(type: SectionType, businessName: string): Blueprint['pages'][number]['sections'][number] {
  const copy: Record<SectionType, { headline: string; subtext: string }> = {
    navbar: {
      headline: businessName,
      subtext: 'Primary navigation',
    },
    hero: {
      headline: `Discover ${businessName}`,
      subtext: 'A polished first impression shaped around the brand and what makes it stand out.',
    },
    features: {
      headline: 'Why people choose us',
      subtext: 'A clear snapshot of what makes the experience distinctive and worth remembering.',
    },
    services: {
      headline: 'What we offer',
      subtext: 'A focused overview of the signature services, packages, or outcomes people come for.',
    },
    menu: {
      headline: 'Signature menu',
      subtext: 'Highlight the standout items, favorites, and seasonal picks people will want first.',
    },
    schedule: {
      headline: 'Hours and schedule',
      subtext: 'Make availability, operating hours, or class timing easy to scan at a glance.',
    },
    testimonials: {
      headline: 'What people are saying',
      subtext: 'Real proof, warm praise, and social trust from customers or clients.',
    },
    pricing: {
      headline: 'Plans and pricing',
      subtext: 'Present clear options with simple value cues and an easy next step.',
    },
    cta: {
      headline: 'Ready to take the next step?',
      subtext: 'Close with one confident action that fits the brand and user journey.',
    },
    about: {
      headline: 'Our story',
      subtext: 'Share the point of view, craft, and personality behind the brand.',
    },
    contact: {
      headline: 'Visit or get in touch',
      subtext: 'Make it easy to reach out, book, ask a question, or stop by.',
    },
    gallery: {
      headline: 'Selected work',
      subtext: 'Show the strongest visuals, signature moments, or finished outcomes.',
    },
    faq: {
      headline: 'Questions, answered',
      subtext: 'Address the practical details people often need before they commit.',
    },
    stats: {
      headline: 'By the numbers',
      subtext: 'Use a few grounded metrics only when they genuinely strengthen credibility.',
    },
    team: {
      headline: 'Meet the team',
      subtext: 'Introduce the people, personalities, and expertise behind the experience.',
    },
    footer: {
      headline: businessName,
      subtext: 'Footer information',
    },
  }

  return {
    id: type,
    type,
    headline: copy[type].headline,
    subtext: copy[type].subtext,
  }
}

function ensureSectionOrder(page: Blueprint['pages'][number]) {
  const navbar = page.sections.filter((section) => section.type === 'navbar')
  const hero = page.sections.filter((section) => section.type === 'hero')
  const footer = page.sections.filter((section) => section.type === 'footer')
  const middle = page.sections.filter(
    (section) => section.type !== 'navbar' && section.type !== 'hero' && section.type !== 'footer'
  )

  page.sections = [...navbar, ...hero, ...middle, ...footer]
}

function ensureRequiredSections(page: Blueprint['pages'][number], prompt: string, businessName: string) {
  const existing = new Set(page.sections.map((section) => section.type))

  for (const type of ['navbar', 'hero', 'footer'] as SectionType[]) {
    if (!existing.has(type)) {
      page.sections.push(buildFallbackSection(type, businessName))
      existing.add(type)
    }
  }

  for (const type of deriveRequestedSections(prompt)) {
    if (!existing.has(type)) {
      const footerIndex = page.sections.findIndex((section) => section.type === 'footer')
      const section = buildFallbackSection(type, businessName)
      if (footerIndex >= 0) page.sections.splice(footerIndex, 0, section)
      else page.sections.push(section)
      existing.add(type)
    }
  }

  ensureSectionOrder(page)
}

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

  bp.designSystem = bp.designSystem || ({} as Blueprint['designSystem'])
  bp.designSystem.layout = {
    styleMode: bp.designSystem.layout?.styleMode || 'editorial',
    heroStyle: bp.designSystem.layout?.heroStyle || 'full-bleed-cinematic',
    sectionRhythm: bp.designSystem.layout?.sectionRhythm || 'alternating-editorial',
    cardStyle: bp.designSystem.layout?.cardStyle || 'balanced-soft',
    navStyle: bp.designSystem.layout?.navStyle || 'transparent-to-solid',
    motionLevel: bp.designSystem.layout?.motionLevel || 'subtle',
  }
  bp.designSystem.rhythm = {
    sectionSpacing: bp.designSystem.rhythm?.sectionSpacing || 'airy',
    headingScale: bp.designSystem.rhythm?.headingScale || 'dramatic',
    contentWidth: bp.designSystem.rhythm?.contentWidth || 'wide',
    textDensity: bp.designSystem.rhythm?.textDensity || 'airy',
  }

  if (!bp.pages?.length) {
    throw new Error('Blueprint has no pages')
  }

  for (const page of bp.pages) {
    if (!page.sections?.length) {
      throw new Error(`Page ${page.route} has no sections`)
    }
    for (const section of page.sections) {
      const normalizedType =
        normalizeSectionType(section.type) ||
        inferSectionType(section) ||
        'features'

      if (section.type !== normalizedType) {
        log.warn('Normalizing section type', { from: section.type, to: normalizedType })
        section.type = normalizedType
      }
    }

    ensureRequiredSections(page, prompt, bp.name)
  }

  if (!bp.designSystem?.colors?.primary) {
    throw new Error('Blueprint missing design system colors')
  }

  return bp
}
