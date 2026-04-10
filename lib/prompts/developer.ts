function getSectionSpecificGuidance(filePath: string): string {
  const lower = filePath.toLowerCase()

  if (lower.includes('navbarsection')) {
    return `NAVBAR RULES:
- Navbar must feel premium and modern: transparent at the top ONLY when the hero is clean enough for excellent readability.
- If the hero uses busy photography, strong contrast, or detailed imagery, prefer a glass or softly opaque surface from the start (for example bg-background/55, bg-foreground/15, or a theme-appropriate tinted blur).
- While scrolling, navbar MUST transition to an even clearer solid or blurred background (for example bg-background/80 + backdrop-blur-md), with a subtle border/shadow and slightly tighter vertical spacing.
- If navStyle is "glass-floating", make the glass unmistakable: use a floating inner panel or clearly separated surface with visible blur, border, tint, and shadow.
- Avoid ultra-faint treatments like /5 or /8 opacity on top of busy hero imagery. The nav should read as an intentional frosted layer in the very first viewport.
- Keep navbar above all content with a reliable z-index and never allow links/logo/buttons to visually collide with hero content while scrolling.
- Readability beats purity: logo, links, and CTA should remain clear against the hero at all times.
- Use a centered max-width container, balanced spacing, and a clear primary CTA.`
  }

  if (lower.includes('herosection')) {
    return `HERO RULES:
- Default to a large, trend-forward hero: min-h-[88svh] to min-h-screen unless the business clearly needs a smaller intro.
- Hero should be image-led or composition-led with one dominant visual focal point, not a cramped generic banner.
- If navbar overlays the hero, reserve safe top spacing inside the hero (for example pt-28 lg:pt-36) so copy never sits under the nav.
- Do NOT render a second site-wide navigation, header bar, or menu inside HeroSection. NavbarSection alone owns site navigation.
- Preserve the photography itself: avoid stacking multiple heavy full-screen dark overlays that make the hero feel muddy or underexposed.
- If using a split layout (e.g. 50% text, 50% image), ALWAYS use the light background color (bg-background or bg-card) for the text half. NEVER fill half the screen with a heavy dark solid color block (like bg-foreground) unless explicitly designing a dark-mode theme.
- If contrast is needed, use one primary overlay and at most one subtle directional tint; keep overlays moderate so the image still reads clearly in screenshots.
- Prefer oversized headline scale, strong visual hierarchy, and fewer competing UI elements.`
  }

  if (
    lower.includes('featuressection') ||
    lower.includes('aboutsection') ||
    lower.includes('gallerysection') ||
    lower.includes('testimonialssection') ||
    lower.includes('teamsection') ||
    lower.includes('pricingsection') ||
    lower.includes('statssection')
  ) {
    return `SECTION BALANCE RULES:
- Avoid messy, uneven card grids. Use consistent media aspect ratios, consistent padding, and h-full cards inside auto-rows-fr style grids.
- Balance copy lengths so one card does not become dramatically taller than the others.
- Use one strong layout idea per section: asymmetry, split composition, featured card, or staggered grid — not repetitive template boxes.
- Images should use object-cover with intentional crops and elegant overlays if needed.`
  }

  if (lower.includes('servicessection')) {
    return `SERVICES SECTION RULES:
- Present services as distinct, outcome-oriented offers rather than generic feature bullets.
- Make each service feel tangible with a name, short positioning line, and 1-3 concrete deliverables or differentiators.
- Use a layout with hierarchy, such as one featured offer plus supporting offers, instead of a flat repetitive grid.`
  }

  if (lower.includes('ctasection') || lower.includes('contactsection') || lower.includes('footersection')) {
    return `CONVERSION SECTION RULES:
- Keep hierarchy simple and premium with one dominant action.
- Use tighter, more intentional spacing than a generic stacked form/card layout.
- Visual polish should come from composition, contrast, and restrained accents rather than too many nested boxes.`
  }

  if (lower.includes('menusection')) {
    return `MENU SECTION RULES:
- Do NOT disguise the menu as a generic features grid. Present real categories, item names, short descriptions, and believable prices.
- Use a layout that feels editorial and premium: for example a featured signature item paired with refined columns, category blocks, or elegant menu cards.
- Keep the menu easy to scan while still feeling brand-specific and atmospheric.
- If imagery is used, let it support appetite and mood without overwhelming readability.`
  }

  if (lower.includes('schedulesection')) {
    return `SCHEDULE SECTION RULES:
- Make timing instantly scannable with a clean timetable, day-by-day rhythm, or class/hour cards.
- Prioritize clarity first, then polish: users should understand availability in seconds.
- Use restrained hierarchy and spacing so the schedule feels premium rather than like a dense spreadsheet.`
  }

  return `GENERAL SECTION RULES:
- Prefer premium composition over repetitive grids.
- Keep spacing, media sizing, and copy rhythm visually balanced.`
}

function getRhythmGuidance(rhythm: {
  sectionSpacing: string
  headingScale: string
  contentWidth: string
  textDensity: string
}): string {
  const spacingMap: Record<string, string> = {
    airy: 'Use generous vertical spacing such as py-24 lg:py-36, with larger gaps like gap-10 lg:gap-16 and more breathing room between blocks.',
    balanced: 'Use disciplined but comfortable spacing such as py-20 lg:py-28, with gap-8 lg:gap-14 and consistent section cadence.',
    compact: 'Use tighter premium spacing such as py-16 lg:py-24, avoiding cramped layouts while keeping the page brisk.',
  }

  const headingMap: Record<string, string> = {
    dramatic: 'Use bold hierarchy: hero headlines around text-6xl to text-8xl on desktop, section headlines around text-4xl to text-6xl.',
    assertive: 'Use strong but controlled hierarchy: hero headlines around text-5xl to text-7xl, section headlines around text-4xl to text-5xl.',
    refined: 'Use elegant restrained hierarchy: hero headlines around text-4xl to text-6xl, section headlines around text-3xl to text-5xl.',
  }

  const widthMap: Record<string, string> = {
    wide: 'Allow major content blocks to breathe with max-w-6xl to max-w-7xl wrappers when appropriate; avoid over-constraining editorial sections.',
    balanced: 'Use balanced reading widths like max-w-5xl to max-w-6xl for major sections and max-w-2xl to max-w-3xl for text blocks.',
    narrow: 'Use more restrained content widths like max-w-4xl to max-w-5xl and tighter text measures for a refined editorial feel.',
  }

  const densityMap: Record<string, string> = {
    airy: 'Prefer shorter paragraphs, more whitespace, and fewer competing elements per viewport.',
    balanced: 'Keep copy informative but disciplined, with moderate paragraph lengths and clean grouping.',
    dense: 'Allow richer information density, but maintain hierarchy with stronger subheads and consistent spacing.',
  }

  return `RHYTHM GUIDANCE:
- sectionSpacing: ${rhythm.sectionSpacing} — ${spacingMap[rhythm.sectionSpacing] || spacingMap.balanced}
- headingScale: ${rhythm.headingScale} — ${headingMap[rhythm.headingScale] || headingMap.assertive}
- contentWidth: ${rhythm.contentWidth} — ${widthMap[rhythm.contentWidth] || widthMap.balanced}
- textDensity: ${rhythm.textDensity} — ${densityMap[rhythm.textDensity] || densityMap.balanced}`
}

export const DEVELOPER_SYSTEM_PROMPT = `You are an elite frontend developer building beautiful, modern websites. Your code should look like it was designed by a top agency — not a template.

CRITICAL BUILD RULES:
- Generate COMPLETE files. Never truncate or use "// rest of implementation".
- File MUST start with 'use client' (if using hooks/events) or an import. No prose before code.
- Do NOT use next/font/google in components — fonts are configured in layout.tsx.
- Only import from: "react", "lucide-react", "framer-motion", "@/lib/utils" (cn function), next/link, or other components/sections/*.tsx files.
- Use plain <img> tags (NOT next/image). Always include alt text.
- ALWAYS give <img> tags explicit aspect ratios (e.g. aspect-[4/3], aspect-square) or set a fixed/min height on their container. This prevents layout collapse if images load slowly.
- Do NOT import @radix-ui, headlessui, or any library not listed above.
- Export components as default exports.
- "use client" MUST be the FIRST line when using useState/useEffect/onClick/onChange.

DESIGN EXCELLENCE:
- Build visually stunning, modern sections — NOT boring templates. Use creative layouts, asymmetric grids, overlapping elements, gradients, subtle shadows.
- Prefer an image-led, editorial feel over small boxed layouts. The page should feel premium, current, and intentionally art directed.
- Use Tailwind theme colors: bg-primary, text-primary-foreground, bg-secondary, text-muted-foreground, bg-card, border-border, bg-accent, bg-muted, etc.
- NEVER use the foreground or dark text colors as a background fill for large layout blocks unless explicitly designing a dark-mode theme. Default to light backgrounds.
- Use font-[family-name:var(--font-display)] for headlines and font-[family-name:var(--font-body)] for body text sparingly where emphasis is needed.
- Add visual depth: shadows (shadow-lg, shadow-2xl), rounded corners (rounded-xl, rounded-2xl), hover transitions, subtle gradients, soft overlays.
- Generous whitespace: py-20 lg:py-32 for sections, gap-8 lg:gap-16 between elements.
- RESPONSIVE: mobile-first, test every breakpoint mentally. Use grid with sm/md/lg variants.
- Use lucide-react icons generously for visual richness — pick icons that match the content.
- Navbar must NEVER awkwardly overlap content while scrolling. If it sits over the hero initially, it should become solid or blurred on scroll and maintain readability at all times.
- Do NOT force a fully transparent navbar on top of busy photography. A lightly blurred or softly opaque navbar often looks more premium and readable.
- If using a glass nav, make it visually obvious with a real frosted treatment rather than a nearly invisible overlay.
- Heroes should usually feel large and trend-forward: big image block, oversized type, strong focal crop, and a clear CTA cluster.
- Protect hero image quality: do not bury photography under multiple heavy dark overlays just to make white text readable.
- Avoid repeating the same card pattern section after section. Use at most one straightforward grid if the page needs it; other sections should vary composition.
- Cards and media blocks must feel balanced: consistent aspect ratios, similar padding rhythm, h-full alignment, and restrained copy length.
- There must be only ONE site-wide navigation component on the page: NavbarSection. No other section may render a duplicate top nav/header/menu.

MOTION:
- AVOID Framer Motion for scroll reveals, fade-ins, or 'opacity: 0' animations. They frequently cause layout bugs and invisible sections.
- ALL text and images MUST be visible by default (opacity-100). Do NOT use 'initial={{ opacity: 0 }}'.
- Prefer standard CSS transitions for hover states.
- If you must use Framer Motion, restrict it strictly to the Navbar (for scroll state changes) or tiny micro-interactions. Never use it to hide/reveal entire sections or large text blocks.

CONTENT:
- Write compelling, realistic copy specific to the business. NO "Lorem ipsum". NO generic "Welcome to our website".
- Headlines should be punchy and memorable. Subtext should tell a story.
- For large photos (hero, gallery, features): use Pollinations URLs: https://image.pollinations.ai/prompt/{description}?width={width}&height={height}&nologo=true
- The {description} in the URL MUST be a simple, URL-encoded string detailing what the image should show. DO NOT use commas, apostrophes, quotes, or special characters in the prompt. Use only alphanumeric characters and hyphens instead of spaces (e.g., use "grandmas-recipes" instead of "grandma's recipes!").
- CRITICAL: Pollinations is frequently overloaded and fails on small images. For grid cards, small thumbnails, and secondary images, DO NOT use Pollinations! Use Picsum: https://picsum.photos/seed/{title}/600/400 (it generates a fast, deterministic, beautiful placeholder photo).
- For user avatars, profile pictures, and testimonial faces: DO NOT use Pollinations. Use UI Avatars: https://ui-avatars.com/api/?name={First+Last}&background=random&color=fff&size=150
- For abstract UI icons, use lucide-react. NEVER use <img> tags for small decorative icons.
- For generic app UI/dashboard placeholders: use Placehold.co: https://placehold.co/600x400/1e293b/fff?text={Dashboard+Interface}
- CRITICAL LOCALITY RULE: If the brand description mentions a specific locale, city, or culture (e.g., "Bangalore", "Paris", "Nigerian"), you MUST append that locale to EVERY Pollinations image prompt so the people, architecture, and food authentically reflect that region! (e.g. "portrait-of-a-local-fitness-trainer-in-bangalore-india").
- No external API calls. All data is hardcoded in the component.

OUTPUT: Raw TypeScript/TSX code only. No markdown, no explanations.`

export function buildFilePrompt(
  filePath: string,
  fileDescription: string,
  blueprint: {
    name: string
    description: string
    prompt?: string
    designSystem: {
      mood: string
      colors: Record<string, string>
      layout: {
        styleMode: string
        heroStyle: string
        sectionRhythm: string
        cardStyle: string
        navStyle: string
        motionLevel: string
      }
      rhythm: {
        sectionSpacing: string
        headingScale: string
        contentWidth: string
        textDensity: string
      }
    }
    pages: Array<{ route: string; sections: Array<{ id: string; type: string; headline: string; subtext: string }> }>
  },
  existingFiles: string[]
): string {
  const sectionsDesc = blueprint.pages
    .flatMap((p) =>
      p.sections.map(
        (s) => `  - id="${s.id}" · ${s.type.toUpperCase()}: "${s.headline}" / "${s.subtext}"`
      )
    )
    .join('\n')

  const existingList = existingFiles.length
    ? `\nAlready generated files (you can import from these):\n${existingFiles.map((f) => `  - ${f}`).join('\n')}`
    : ''

  const colorEntries = Object.entries(blueprint.designSystem.colors)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')
  const sectionGuidance = getSectionSpecificGuidance(filePath)
  const layout = blueprint.designSystem.layout
  const rhythm = blueprint.designSystem.rhythm
  const rhythmGuidance = getRhythmGuidance(rhythm)
  
  const originalPromptContext = blueprint.prompt 
    ? `\nUSER'S ORIGINAL REQUEST (Use this for context, specific wording, and business details):\n"${blueprint.prompt}"\n` 
    : ''

  return `Generate: ${filePath}
Purpose: ${fileDescription}
${originalPromptContext}
BRAND:
Name: "${blueprint.name}"
About: ${blueprint.description}
Design mood: ${blueprint.designSystem.mood}
Layout direction:
  styleMode: ${layout.styleMode}
  heroStyle: ${layout.heroStyle}
  sectionRhythm: ${layout.sectionRhythm}
  cardStyle: ${layout.cardStyle}
  navStyle: ${layout.navStyle}
  motionLevel: ${layout.motionLevel}
Rhythm direction:
  sectionSpacing: ${rhythm.sectionSpacing}
  headingScale: ${rhythm.headingScale}
  contentWidth: ${rhythm.contentWidth}
  textDensity: ${rhythm.textDensity}
Color palette (use as Tailwind theme classes like bg-primary, text-muted-foreground, etc.):
${colorEntries}

Full page sections:
${sectionsDesc}
${existingList}

IMPORTANT: This is for "${blueprint.name}" — a ${blueprint.description}. The design must FEEL like this specific brand, not a generic template.
- Design mood is "${blueprint.designSystem.mood}" — let this deeply influence layout choices, spacing, typography scale, and visual rhythm.
- Follow the layout direction strictly: styleMode "${layout.styleMode}", heroStyle "${layout.heroStyle}", sectionRhythm "${layout.sectionRhythm}", cardStyle "${layout.cardStyle}", navStyle "${layout.navStyle}", motionLevel "${layout.motionLevel}".
- Follow the rhythm direction strictly for spacing and typography hierarchy.
- If the page opens on top of a detailed hero image, bias the navbar toward glass / blur / soft opacity instead of pure transparency.
- For navStyle "${layout.navStyle}", the nav surface must be visually legible at first glance in screenshots, not only after scrolling.
- DO NOT use a standard centered-text-over-image hero or basic 3-column card grid unless the business specifically calls for it.
- Think about what makes THIS business unique and reflect that in the layout structure, content hierarchy, and visual details.
- Each section should feel like it belongs to a cohesive, custom-designed site — not a page builder.
- Favor a high-end, trend-aware composition with stronger hero presence, less repetition, and more thoughtful spacing rhythm.
- This file must only implement its own section. Do not recreate other global sections such as the navbar or footer here.
- Import only the hooks, icons, and utilities you actually use. Do not leave dead imports, unused state, or unused refs behind.
- Use the exact provided section ids for any in-page navigation. Do not invent href targets like "#portfolio" or "#features" unless those exact ids are in the provided section list.
- If this file renders a root <section>, set its id to the matching blueprint section id for this section type.

SECTION-SPECIFIC GUIDANCE:
${sectionGuidance}

${rhythmGuidance}

If motion helps this specific section, use Framer Motion sparingly and only for a clearly premium effect.

Output ONLY the complete code.`
}

export function buildPagePrompt(
  blueprint: {
    name: string
    description: string
    designSystem: {
      mood: string
      colors: Record<string, string>
      layout: {
        styleMode: string
        heroStyle: string
        sectionRhythm: string
        cardStyle: string
        navStyle: string
        motionLevel: string
      }
      rhythm: {
        sectionSpacing: string
        headingScale: string
        contentWidth: string
        textDensity: string
      }
    }
    pages: Array<{
      route: string
      name: string
      sections: Array<{ id: string; type: string; headline: string; subtext: string }>
    }>
  },
  pageIndex: number,
  componentPaths: string[]
): string {
  const page = blueprint.pages[pageIndex]
  const navbarSection = page.sections.find((s) => s.type === 'navbar')
  const footerSection = page.sections.find((s) => s.type === 'footer')
  const contentSections = page.sections.filter((s) => s.type !== 'navbar' && s.type !== 'footer')
  const imports = page.sections
    .map((s) => {
      const componentName = s.type.charAt(0).toUpperCase() + s.type.slice(1) + 'Section'
      const path = componentPaths.find((p) => p.toLowerCase().includes(s.type.toLowerCase()))
      return path ? `import ${componentName} from "@/${path.replace(/\.tsx$/, '')}"` : null
    })
    .filter(Boolean)
    .join('\n')

  return `Generate the page file: app${page.route === '/' ? '' : page.route}/page.tsx

This is a Next.js App Router page (Server Component by default).

The page should import and compose these section components:
${imports}

Preferred composition:
${navbarSection ? `- Render <${navbarSection.type.charAt(0).toUpperCase() + navbarSection.type.slice(1)}Section /> before <main> so the header can be fixed/sticky without constraining the rest of the page.` : '- No navbar section'}
${contentSections.map((s) => `- Inside <main className="overflow-x-clip"> render <${s.type.charAt(0).toUpperCase() + s.type.slice(1)}Section /> — "${s.headline}"`).join('\n')}
${footerSection ? `- Render <${footerSection.type.charAt(0).toUpperCase() + footerSection.type.slice(1)}Section /> after </main>.` : '- No footer section'}

PROJECT: ${blueprint.name} — ${blueprint.description}
Mood: ${blueprint.designSystem.mood}
Layout direction:
- styleMode: ${blueprint.designSystem.layout.styleMode}
- heroStyle: ${blueprint.designSystem.layout.heroStyle}
- sectionRhythm: ${blueprint.designSystem.layout.sectionRhythm}
- cardStyle: ${blueprint.designSystem.layout.cardStyle}
- navStyle: ${blueprint.designSystem.layout.navStyle}
- motionLevel: ${blueprint.designSystem.layout.motionLevel}
Rhythm direction:
- sectionSpacing: ${blueprint.designSystem.rhythm.sectionSpacing}
- headingScale: ${blueprint.designSystem.rhythm.headingScale}
- contentWidth: ${blueprint.designSystem.rhythm.contentWidth}
- textDensity: ${blueprint.designSystem.rhythm.textDensity}

Page-level rules:
- Do not wrap the entire page in a narrow centered container. Let hero and major visual sections breathe.
- Preserve the hero-first feel with strong media and visual hierarchy.
- Support a scroll-aware navbar that stays readable and never feels like it is colliding with the hero while scrolling.
- On image-heavy heroes, prefer a readable glass/frosted navbar over a fully transparent one.
- If navStyle is glass-floating, prefer an inset or floating panel treatment over an almost invisible full-width strip.
- Maintain consistent vertical rhythm and typography hierarchy from section to section.
- Ensure exactly one site-wide navigation is rendered: NavbarSection. HeroSection and all other sections must not contain duplicate nav/header bars.

Generate the COMPLETE page.tsx file. Import all section components and render content sections inside a <main> element, with navbar/footer outside <main> when present. Output ONLY the code.`
}
