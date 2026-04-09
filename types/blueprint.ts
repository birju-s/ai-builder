export interface Blueprint {
  prompt: string
  appType: 'website' | 'fullstack'
  name: string
  description: string
  pages: PageSpec[]
  designSystem: DesignSystem
}

export interface PageSpec {
  route: string
  name: string
  sections: SectionSpec[]
}

export interface SectionSpec {
  id: string
  type: SectionType
  headline: string
  subtext: string
  props?: Record<string, unknown>
}

export type SectionType =
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'about'
  | 'contact'
  | 'gallery'
  | 'faq'
  | 'stats'
  | 'team'
  | 'footer'
  | 'navbar'

export interface DesignSystem {
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    background: string
    foreground: string
    muted: string
    mutedForeground: string
    border: string
    card: string
    cardForeground: string
  }
  typography: {
    displayFont: string
    bodyFont: string
    monoFont: string
  }
  borderRadius: string
  mood: string
}

export interface FileManifest {
  path: string
  description: string
  dependencies: string[]
  priority: 'deterministic' | 'ai-generated'
}

export interface GeneratedFile {
  path: string
  content: string
  sizeBytes: number
  generationTimeMs: number
}
