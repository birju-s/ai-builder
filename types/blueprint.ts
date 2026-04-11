export interface Blueprint {
  prompt: string
  appType: 'website' | 'fullstack'
  name: string
  description: string
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
  | 'services'
  | 'menu'
  | 'schedule'
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
  layout: {
    styleMode: 'editorial' | 'image-led' | 'luxury' | 'minimal' | 'bold'
    heroStyle: 'full-bleed-cinematic' | 'split-editorial' | 'immersive-collage' | 'story-led'
    sectionRhythm: 'alternating-editorial' | 'featured-plus-grid' | 'stacked-storytelling' | 'mixed-showcase'
    cardStyle: 'balanced-soft' | 'media-forward' | 'minimal-outline' | 'elevated-premium'
    navStyle: 'transparent-to-solid' | 'glass-floating' | 'solid-sticky'
    motionLevel: 'none' | 'subtle' | 'premium' | 'expressive'
  }
  rhythm: {
    sectionSpacing: 'airy' | 'balanced' | 'compact'
    headingScale: 'dramatic' | 'assertive' | 'refined'
    contentWidth: 'wide' | 'balanced' | 'narrow'
    textDensity: 'airy' | 'balanced' | 'dense'
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
