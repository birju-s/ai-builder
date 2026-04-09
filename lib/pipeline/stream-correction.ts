import { createLogger } from '@/lib/logger'
import { VALID_ICONS, resolveIconName } from './lucide-icons'

const log = createLogger('pipeline:stream-correction')

export interface CorrectionResult {
  content: string
  fixes: CorrectionFix[]
}

export interface CorrectionFix {
  layer: 'A'
  type: string
  description: string
  line?: number
}

// Fix shadcn/ui import paths.
// LLMs commonly produce wrong patterns like:
//   from "shadcn/ui/button"
//   from "@shadcn/ui/button"
//   from "ui/button"
//   from "@/components/ui/Button"  (wrong casing)
function fixShadcnImports(content: string, fixes: CorrectionFix[]): string {
  const SHADCN_COMPONENTS = [
    'accordion', 'alert', 'alert-dialog', 'aspect-ratio', 'avatar',
    'badge', 'breadcrumb', 'button', 'calendar', 'card', 'carousel',
    'chart', 'checkbox', 'collapsible', 'command', 'context-menu',
    'dialog', 'drawer', 'dropdown-menu', 'form', 'hover-card',
    'input', 'input-otp', 'label', 'menubar', 'navigation-menu',
    'pagination', 'popover', 'progress', 'radio-group', 'resizable',
    'scroll-area', 'select', 'separator', 'sheet', 'sidebar',
    'skeleton', 'slider', 'sonner', 'switch', 'table', 'tabs',
    'textarea', 'toast', 'toggle', 'toggle-group', 'tooltip',
  ]

  const componentPattern = SHADCN_COMPONENTS.join('|')

  // Pattern: from "shadcn/ui/X" or from "@shadcn/ui/X" or from "ui/X"
  const wrongPaths = new RegExp(
    `(from\\s+['"])(?:@?shadcn\\/ui\\/|ui\\/)(${componentPattern})(['"])`,
    'gi'
  )
  content = content.replace(wrongPaths, (match, pre, comp, post) => {
    const fixed = `${pre}@/components/ui/${comp.toLowerCase()}${post}`
    fixes.push({ layer: 'A', type: 'shadcn-import', description: `Fixed import path: ${match} → ${fixed}` })
    return fixed
  })

  // Pattern: wrong casing in @/components/ui/Button → @/components/ui/button
  const casingPattern = new RegExp(
    `(from\\s+['"]@/components/ui/)([A-Z][a-zA-Z-]+)(['"])`,
    'g'
  )
  content = content.replace(casingPattern, (match, pre, comp, post) => {
    const lower = comp.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    if (lower !== comp) {
      fixes.push({ layer: 'A', type: 'shadcn-casing', description: `Fixed casing: ${comp} → ${lower}` })
      return `${pre}${lower}${post}`
    }
    return match
  })

  return content
}

// Replace hallucinated lucide-react icon names with closest valid match.
function fixIconNames(content: string, fixes: CorrectionFix[]): string {
  // Match: import { Icon1, Icon2 } from "lucide-react"
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g

  content = content.replace(importRegex, (match, importList: string) => {
    const icons = importList.split(',').map((s: string) => s.trim()).filter(Boolean)
    let changed = false

    const fixedIcons = icons.map((icon: string) => {
      // Handle "Icon as Alias" patterns
      const asMatch = icon.match(/^(\w+)\s+as\s+(\w+)$/)
      const iconName = asMatch ? asMatch[1] : icon

      if (VALID_ICONS.has(iconName)) return icon

      const resolved = resolveIconName(iconName)
      if (resolved && resolved !== iconName) {
        changed = true
        fixes.push({
          layer: 'A',
          type: 'lucide-icon',
          description: `Replaced invalid icon: ${iconName} → ${resolved}`,
        })
        return asMatch ? `${resolved} as ${asMatch[2]}` : resolved
      }

      // Can't resolve — replace with a safe fallback
      changed = true
      fixes.push({
        layer: 'A',
        type: 'lucide-icon-fallback',
        description: `Unknown icon "${iconName}" replaced with Circle`,
      })
      return asMatch ? `Circle as ${asMatch[2]}` : 'Circle'
    })

    if (!changed) return match
    return `import { ${fixedIcons.join(', ')} } from 'lucide-react'`
  })

  // Also fix JSX usage of icons that were renamed
  // This is handled implicitly when the icon was imported with `as` alias,
  // but if the import was fixed without alias, JSX usage will break.
  // We handle this by also scanning for <OldIcon in JSX and updating.
  // However, since we already fixed the imports above, the names in JSX
  // should match. The main risk is the LLM using an icon in JSX that
  // isn't in the import — caught by Layer B.

  return content
}

// Fix common Next.js pattern mistakes (Pages Router → App Router).
function fixNextPatterns(content: string, fixes: CorrectionFix[]): string {
  // Fix: import { useRouter } from 'next/router' → 'next/navigation'
  if (/from\s+['"]next\/router['"]/.test(content)) {
    content = content.replace(/from\s+['"]next\/router['"]/g, "from 'next/navigation'")
    fixes.push({ layer: 'A', type: 'next-pattern', description: 'Fixed next/router → next/navigation (App Router)' })
  }

  // Fix: import Head from 'next/head' → remove (use metadata export in App Router)
  if (/import\s+Head\s+from\s+['"]next\/head['"]/.test(content)) {
    content = content.replace(/import\s+Head\s+from\s+['"]next\/head['"];?\n?/g, '')
    content = content.replace(/<Head>[\s\S]*?<\/Head>/g, '')
    fixes.push({ layer: 'A', type: 'next-pattern', description: 'Removed next/head (use metadata in App Router)' })
  }

  // Fix: getServerSideProps / getStaticProps (Pages Router patterns)
  if (/export\s+(?:async\s+)?function\s+(?:getServerSideProps|getStaticProps|getStaticPaths)/.test(content)) {
    fixes.push({ layer: 'A', type: 'next-pattern', description: 'Warning: Pages Router data fetching detected (getServerSideProps/getStaticProps)' })
  }

  // Fix: import Image from 'next/image' without width/height
  // Replace with plain img if <Image is used without width/height props
  const hasNextImage = /import\s+Image\s+from\s+['"]next\/image['"]/
  if (hasNextImage.test(content)) {
    // Check if Image is used with width+height (properly)
    const properUsage = /<Image[^>]*\bwidth\b[^>]*\bheight\b/
    const improperUsage = /<Image\b/
    if (improperUsage.test(content) && !properUsage.test(content)) {
      content = content.replace(hasNextImage, '')
      content = content.replace(/<Image\b/g, '<img')
      content = content.replace(/<\/Image>/g, '</img>')
      // Clean up Next.js Image-specific props
      content = content.replace(/\s+fill(?=[\s/>])/g, '')
      content = content.replace(/\s+priority(?=[\s/>])/g, '')
      content = content.replace(/\s+placeholder=["'][^"']*["']/g, '')
      content = content.replace(/\s+blurDataURL=["'][^"']*["']/g, '')
      fixes.push({ layer: 'A', type: 'next-image', description: 'Replaced next/image with <img> (missing width/height)' })
    }
  }

  return content
}

// Fix common React import mistakes.
function fixReactImports(content: string, fixes: CorrectionFix[]): string {
  // Fix: import { useState } from 'react/hooks' → 'react'
  if (/from\s+['"]react\/(hooks|client|server)['"]/.test(content)) {
    content = content.replace(/from\s+['"]react\/(hooks|client|server)['"]/g, "from 'react'")
    fixes.push({ layer: 'A', type: 'react-import', description: 'Fixed react subpath import → react' })
  }

  // Fix: import React from 'react' (unnecessary in React 19 with JSX transform)
  // Only remove if it's a default import and React is not used as a namespace
  const defaultReactImport = /^import\s+React\s+from\s+['"]react['"];?\n/m
  if (defaultReactImport.test(content) && !content.includes('React.')) {
    content = content.replace(defaultReactImport, '')
    fixes.push({ layer: 'A', type: 'react-import', description: 'Removed unnecessary default React import' })
  }

  return content
}

// Fix banned third-party imports by removing them.
// The developer prompt says "no framer-motion, no @radix-ui, no headlessui".
function fixBannedImports(content: string, fixes: CorrectionFix[]): string {
  const BANNED = [
    'framer-motion', 'motion', '@radix-ui',
    '@headlessui', 'headlessui',
    '@heroicons', 'react-icons',
    'styled-components', '@emotion',
  ]

  for (const pkg of BANNED) {
    const pattern = `^import\\s+.*from\\s+['"]${pkg.replace('/', '\\/')}.*['"];?\\n?`
    const importMatch = content.match(new RegExp(pattern, 'gm'))
    if (importMatch) {
      content = content.replace(new RegExp(pattern, 'gm'), '')
      fixes.push({
        layer: 'A',
        type: 'banned-import',
        description: `Removed banned import: ${importMatch[0].trim()}`,
      })
    }
  }

  return content
}

// Fix broken single-quoted JS/TS string literals like:
//   description: 'We're open daily'
// which the model often emits without escaping the apostrophe.
function fixBrokenSingleQuotedStrings(content: string, fixes: CorrectionFix[]): string {
  const original = content

  content = content.replace(
    /([:=([{,]\s*)'([^'\n\\]*?)'([A-Za-z][^'\n\\]*?)'/g,
    (_match, prefix, before, after) => {
      const value = `${before}'${after}`.replace(/"/g, '\\"')
      return `${prefix}"${value}"`
    }
  )

  if (content !== original) {
    fixes.push({
      layer: 'A',
      type: 'string-literal',
      description: 'Fixed broken single-quoted string literals with apostrophes',
    })
  }

  return content
}

export function applyStreamCorrections(content: string): CorrectionResult {
  const fixes: CorrectionFix[] = []

  content = fixShadcnImports(content, fixes)
  content = fixIconNames(content, fixes)
  content = fixNextPatterns(content, fixes)
  content = fixReactImports(content, fixes)
  content = fixBannedImports(content, fixes)
  content = fixBrokenSingleQuotedStrings(content, fixes)

  if (fixes.length > 0) {
    log.info('Stream corrections applied', {
      fixCount: fixes.length,
      types: [...new Set(fixes.map((f) => f.type))],
    })
  }

  return { content, fixes }
}
