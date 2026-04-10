import type { Blueprint, GeneratedFile } from '@/types/blueprint'
import type { ImagePipelineResult } from '@/lib/services/image-pipeline'

export const DEMO_BLUEPRINT: Blueprint = {
  prompt: 'A demo coffee shop website',
  appType: 'website',
  name: 'Demo Coffee',
  description: 'A cozy demo coffee shop in Seattle',
  pages: [
    {
      route: '/',
      name: 'Home',
      sections: [
        { id: 'navbar', type: 'navbar', headline: 'Demo Coffee', subtext: 'Navigation' },
        { id: 'hero', type: 'hero', headline: 'Welcome to Demo Coffee', subtext: 'The best coffee in Seattle' },
        { id: 'features', type: 'features', headline: 'Our Offerings', subtext: 'What we serve' },
        { id: 'footer', type: 'footer', headline: 'Demo Coffee', subtext: 'Copyright 2026' }
      ]
    }
  ],
  designSystem: {
    colors: {
      primary: '#3b82f6', primaryForeground: '#ffffff',
      secondary: '#f3f4f6', secondaryForeground: '#1f2937',
      accent: '#f59e0b', background: '#ffffff', foreground: '#0f172a',
      muted: '#f3f4f6', mutedForeground: '#6b7280', border: '#e5e7eb',
      card: '#ffffff', cardForeground: '#0f172a'
    },
    typography: { displayFont: 'Inter', bodyFont: 'Inter', monoFont: 'JetBrains Mono' },
    layout: { styleMode: 'editorial', heroStyle: 'full-bleed-cinematic', sectionRhythm: 'alternating-editorial', cardStyle: 'balanced-soft', navStyle: 'transparent-to-solid', motionLevel: 'none' },
    rhythm: { sectionSpacing: 'airy', headingScale: 'assertive', contentWidth: 'balanced', textDensity: 'balanced' },
    borderRadius: '0.5rem',
    mood: 'clean-minimal'
  }
}

export const DEMO_FILES: GeneratedFile[] = [
  {
    path: 'components/sections/NavbarSection.tsx',
    content: `
export default function NavbarSection() {
  return <nav className="w-full p-4 border-b bg-background"><div className="max-w-6xl mx-auto font-bold">Demo Coffee</div></nav>
}
    `.trim(),
    sizeBytes: 150,
    generationTimeMs: 100
  },
  {
    path: 'components/sections/HeroSection.tsx',
    content: `
export default function HeroSection() {
  return <section className="w-full py-24 bg-muted text-center"><h1 className="text-5xl font-bold mb-4">Welcome to Demo Coffee</h1><p className="text-xl text-muted-foreground">The best coffee in Seattle</p></section>
}
    `.trim(),
    sizeBytes: 250,
    generationTimeMs: 100
  },
  {
    path: 'components/sections/FeaturesSection.tsx',
    content: `
export default function FeaturesSection() {
  return <section className="w-full py-24 max-w-6xl mx-auto"><h2 className="text-3xl font-bold mb-8 text-center">Our Offerings</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="p-6 border rounded-lg"><h3 className="font-bold">Espresso</h3><p>Strong and bold.</p></div><div className="p-6 border rounded-lg"><h3 className="font-bold">Latte</h3><p>Smooth and creamy.</p></div><div className="p-6 border rounded-lg"><h3 className="font-bold">Pastries</h3><p>Freshly baked.</p></div></div></section>
}
    `.trim(),
    sizeBytes: 400,
    generationTimeMs: 100
  },
  {
    path: 'components/sections/FooterSection.tsx',
    content: `
export default function FooterSection() {
  return <footer className="w-full py-8 border-t text-center text-sm text-muted-foreground"><p>© 2026 Demo Coffee. All rights reserved.</p></footer>
}
    `.trim(),
    sizeBytes: 200,
    generationTimeMs: 100
  },
  {
    path: 'app/page.tsx',
    content: `
import NavbarSection from "@/components/sections/NavbarSection"
import HeroSection from "@/components/sections/HeroSection"
import FeaturesSection from "@/components/sections/FeaturesSection"
import FooterSection from "@/components/sections/FooterSection"

export default function Page() {
  return (
    <>
      <NavbarSection />
      <main className="flex-1 flex flex-col items-center">
        <HeroSection />
        <FeaturesSection />
      </main>
      <FooterSection />
    </>
  )
}
    `.trim(),
    sizeBytes: 300,
    generationTimeMs: 100
  }
]

export const DEMO_IMAGE_RESULT: ImagePipelineResult = {
  images: [],
  sectionImageMap: {}
}
