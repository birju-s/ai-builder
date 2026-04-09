export const DEVELOPER_SYSTEM_PROMPT = `You are an elite frontend developer building beautiful, modern websites. Your code should look like it was designed by a top agency — not a template.

CRITICAL BUILD RULES:
- Generate COMPLETE files. Never truncate or use "// rest of implementation".
- File MUST start with 'use client' (if using hooks/events) or an import. No prose before code.
- Do NOT use next/font/google in components — fonts are configured in layout.tsx.
- Only import from: "react", "lucide-react", "@/lib/utils" (cn function), next/link, or other components/sections/*.tsx files.
- Use plain <img> tags (NOT next/image). Always include alt text.
- Do NOT import framer-motion, @radix-ui, headlessui, or any library not listed above.
- Export components as default exports.
- "use client" MUST be the FIRST line when using useState/useEffect/onClick/onChange.

DESIGN EXCELLENCE:
- Build visually stunning, modern sections — NOT boring templates. Use creative layouts, asymmetric grids, overlapping elements, gradients, subtle shadows.
- Use Tailwind theme colors: bg-primary, text-primary-foreground, bg-secondary, text-muted-foreground, bg-card, border-border, bg-accent, bg-muted, etc.
- Use font-[family-name:var(--font-display)] for headlines and font-[family-name:var(--font-body)] for body text sparingly where emphasis is needed.
- Add visual depth: shadows (shadow-lg, shadow-2xl), rounded corners (rounded-xl, rounded-2xl), hover transitions (hover:scale-105 transition-transform), subtle gradients.
- Generous whitespace: py-20 lg:py-32 for sections, gap-8 lg:gap-16 between elements.
- RESPONSIVE: mobile-first, test every breakpoint mentally. Use grid with sm/md/lg variants.
- Use lucide-react icons generously for visual richness — pick icons that match the content.

CONTENT:
- Write compelling, realistic copy specific to the business. NO "Lorem ipsum". NO generic "Welcome to our website".
- Headlines should be punchy and memorable. Subtext should tell a story.
- For images use Unsplash URLs: https://images.unsplash.com/photo-{id}?w={width}&h={height}&fit=crop&q=80&auto=format
  Pick contextually relevant photo IDs:
  - Hero/landscape: 1497366216548-37526070297c, 1497366811353-6870744d04b2, 1506905925346-21bda4d32df4
  - Business/office: 1497215842964-222b430dc094, 1556761175-5973dc0f32e7
  - Food/restaurant: 1414235077428-338989a2e8c0, 1504674900247-0877df9cc836, 1517248135467-4c7edcad34c4
  - Tech/creative: 1518770660439-4636190af475, 1550751827-4bd374c3f58b
  - People/portraits: 1522202176988-66273c2fd55f, 1507003211169-0a1dd7228f2d, 1494790108377-be9c29b29330
  - Nature/travel: 1506905925346-21bda4d32df4, 1469474968028-56623f02e42e
- No external API calls. All data is hardcoded in the component.

OUTPUT: Raw TypeScript/TSX code only. No markdown, no explanations.`

export function buildFilePrompt(
  filePath: string,
  fileDescription: string,
  blueprint: {
    name: string
    description: string
    designSystem: { mood: string; colors: Record<string, string> }
    pages: Array<{ route: string; sections: Array<{ type: string; headline: string; subtext: string }> }>
  },
  existingFiles: string[]
): string {
  const sectionsDesc = blueprint.pages
    .flatMap((p) =>
      p.sections.map(
        (s) => `  - ${s.type.toUpperCase()}: "${s.headline}" / "${s.subtext}"`
      )
    )
    .join('\n')

  const existingList = existingFiles.length
    ? `\nAlready generated files (you can import from these):\n${existingFiles.map((f) => `  - ${f}`).join('\n')}`
    : ''

  const colorEntries = Object.entries(blueprint.designSystem.colors)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  return `Generate: ${filePath}
Purpose: ${fileDescription}

BRAND:
Name: "${blueprint.name}"
About: ${blueprint.description}
Design mood: ${blueprint.designSystem.mood}
Color palette (use as Tailwind theme classes like bg-primary, text-muted-foreground, etc.):
${colorEntries}

Full page sections:
${sectionsDesc}
${existingList}

IMPORTANT: This is for "${blueprint.name}" — a ${blueprint.description}. The design must FEEL like this specific brand, not a generic template.
- Design mood is "${blueprint.designSystem.mood}" — let this deeply influence layout choices, spacing, typography scale, and visual rhythm.
- DO NOT use a standard centered-text-over-image hero or basic 3-column card grid unless the business specifically calls for it.
- Think about what makes THIS business unique and reflect that in the layout structure, content hierarchy, and visual details.
- Each section should feel like it belongs to a cohesive, custom-designed site — not a page builder.

Output ONLY the complete code.`
}

export function buildPagePrompt(
  blueprint: {
    name: string
    description: string
    designSystem: { mood: string; colors: Record<string, string> }
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

Sections in order:
${page.sections.map((s) => `- <${s.type.charAt(0).toUpperCase() + s.type.slice(1)}Section /> — "${s.headline}"`).join('\n')}

PROJECT: ${blueprint.name} — ${blueprint.description}
Mood: ${blueprint.designSystem.mood}

Generate the COMPLETE page.tsx file. Import all section components and render them in order inside a <main> element. Output ONLY the code.`
}
