1. Theming: Use TailwindCSS color utilities (`text-primary`, `bg-secondary`, `bg-background`, `text-muted-foreground`) to maintain a cohesive theme. Avoid hard-coding arbitrary hex colors in the components.
2. Layout System: Stick to the project's standard padding/margin system. Keep section padding consistent (`py-16 md:py-24`) across the entire site.
3. Mood Alignment: Tone of voice, typography, and imagery MUST align with the mood identified in the Design System.
4. Component Structure: Follow the pattern established by the project. Every generated component should be modular, self-contained, and export a default function.
5. Animations: Only use animations if they enhance the content. Keep animations brief, smooth, and avoid gratuitous or distracting motion. Do NOT use `initial={{ opacity: 0 }}` for scroll reveals if Framer Motion is present, it frequently causes invisible sections.
