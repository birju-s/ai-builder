import { createLogger } from '@/lib/logger'
import generatedSitePackage from '@/lib/templates/generated-site-package.json'
import { VALID_ICONS } from './lucide-icons'

const log = createLogger('pipeline:ast-autofixer')

export interface AutofixResult {
  content: string
  fixes: AutofixFix[]
  missingDeps: string[]
}

export interface AutofixFix {
  layer: 'B'
  type: string
  description: string
}

const REACT_HOOKS = new Set([
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo',
  'useContext', 'useReducer', 'useId', 'useTransition', 'useDeferredValue',
  'useOptimistic', 'useFormStatus', 'useFormState', 'useActionState',
  'useLayoutEffect', 'useInsertionEffect', 'useSyncExternalStore',
  'useImperativeHandle', 'useDebugValue',
])

const EVENT_HANDLERS = new Set([
  'onClick', 'onChange', 'onSubmit', 'onInput', 'onFocus', 'onBlur',
  'onKeyDown', 'onKeyUp', 'onKeyPress', 'onMouseEnter', 'onMouseLeave',
  'onMouseDown', 'onMouseUp', 'onScroll', 'onDrag', 'onDrop',
  'onTouchStart', 'onTouchEnd', 'onPointerDown', 'onPointerUp',
])

const KNOWN_INTERNAL_ALIASES: Record<string, boolean> = {
  '@/lib/utils': true,
  '@/components/ui/': true,
  '@/components/sections/': true,
}

// Known runtime packages in the generated-site package.json
const BASE_DEPS = new Set(Object.keys(generatedSitePackage.dependencies))

// Ensure "use client" directive is present when the file uses client-side features.
function fixClientDirective(content: string, filePath: string, fixes: AutofixFix[]): string {
  const hasDirective = /^['"]use client['"];?\s*$/m.test(content)
  const isPageOrLayout = /\/(page|layout)\.tsx$/.test(filePath)

  // Detect client-side features
  let needsClient = false

  // Check for React hooks
  for (const hook of REACT_HOOKS) {
    const hookRegex = new RegExp(`\\b${hook}\\s*\\(`)
    if (hookRegex.test(content)) {
      needsClient = true
      break
    }
  }

  // Framer Motion components/hooks require a Client Component in App Router.
  if (!needsClient && /from\s+['"]framer-motion['"]/.test(content)) {
    needsClient = true
  }

  // Check for event handler props in JSX
  if (!needsClient) {
    for (const handler of EVENT_HANDLERS) {
      if (content.includes(handler + '=') || content.includes(handler + '(')) {
        needsClient = true
        break
      }
    }
  }

  // Check for browser APIs
  if (!needsClient) {
    const browserAPIs = /\b(window\.|document\.|localStorage\.|sessionStorage\.|navigator\.)/
    if (browserAPIs.test(content)) {
      needsClient = true
    }
  }

  if (needsClient && !hasDirective) {
    content = `'use client'\n\n${content}`
    fixes.push({
      layer: 'B',
      type: 'use-client-added',
      description: `Added "use client" directive (hooks/event handlers detected)`,
    })
  }

  // Remove unnecessary "use client" from server components (pages/layouts with no client features)
  if (!needsClient && hasDirective && isPageOrLayout) {
    // Only remove if the component truly has no client features
    // Be conservative: keep it if we're not sure
    const hasAnyInteractivity = /\b(useState|useEffect|useRef|onClick|onChange|onSubmit)\b/.test(content)
    if (!hasAnyInteractivity) {
      content = content.replace(/^['"]use client['"];?\s*\n*/m, '')
      fixes.push({
        layer: 'B',
        type: 'use-client-removed',
        description: 'Removed unnecessary "use client" from server component',
      })
    }
  }

  return content
}

// Ensure the file has a default export (required for pages and components).
function fixDefaultExport(content: string, filePath: string, fixes: AutofixFix[]): string {
  const hasDefaultExport = /export\s+default\s+/.test(content)
  if (hasDefaultExport) return content

  // Check for named function/const that could be the default export
  const namedExport = content.match(
    /export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*[=:]/
  )
  if (namedExport) {
    const name = namedExport[1] || namedExport[2]
    content += `\nexport default ${name}\n`
    fixes.push({
      layer: 'B',
      type: 'default-export',
      description: `Added default export for ${name}`,
    })
    return content
  }

  // Check for unnamed function component
  const unnamedFunc = content.match(/^(function\s+(\w+)\s*\()/m)
  if (unnamedFunc) {
    content = content.replace(unnamedFunc[0], `export default function ${unnamedFunc[2]}(`)
    fixes.push({
      layer: 'B',
      type: 'default-export',
      description: `Made ${unnamedFunc[2]} the default export`,
    })
  }

  return content
}

// Validate import paths and collect missing third-party deps.
function validateImports(
  content: string,
  filePath: string,
  fixes: AutofixFix[],
  missingDeps: string[]
): string {
  const importRegex = /^import\s+(?:(?:type\s+)?(?:\{[^}]*\}|[\w*]+)(?:\s*,\s*(?:\{[^}]*\}|[\w*]+))*\s+from\s+)?['"]([^'"]+)['"];?$/gm

  let match
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    if (!importPath) continue

    // Skip relative imports
    if (importPath.startsWith('.')) continue

    // Skip known internal aliases
    if (importPath.startsWith('@/')) {
      // Validate known paths exist
      const isKnown = Object.keys(KNOWN_INTERNAL_ALIASES).some((prefix) =>
        importPath.startsWith(prefix)
      )
      if (!isKnown && !importPath.startsWith('@/app/')) {
        fixes.push({
          layer: 'B',
          type: 'import-warning',
          description: `Unknown internal import: ${importPath}`,
        })
      }
      continue
    }

    // Third-party package: extract package name
    const pkgName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0]

    if (!BASE_DEPS.has(pkgName)) {
      missingDeps.push(pkgName)
      fixes.push({
        layer: 'B',
        type: 'missing-dep',
        description: `Third-party dep not in base package.json: ${pkgName}`,
      })
    }
  }

  return content
}

// Verify lucide-react icon usage in JSX matches imports.
function validateIconUsage(content: string, fixes: AutofixFix[]): string {
  // Collect ALL imported identifiers (default + named, from any module)
  const allImportedNames = new Set<string>()
  const importScanRegex = /^import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"][^'"]+['"]/gm
  let im
  while ((im = importScanRegex.exec(content)) !== null) {
    if (im[1]) allImportedNames.add(im[1])
    if (im[2]) {
      for (const raw of im[2].split(',')) {
        const trimmed = raw.trim()
        if (!trimmed) continue
        const asMatch = trimmed.match(/^\w+\s+as\s+(\w+)$/)
        allImportedNames.add(asMatch ? asMatch[1] : trimmed)
      }
    }
  }

  // Also collect locally defined components (function X, const X =)
  const localDefs = content.matchAll(/(?:function|const|let|var|class)\s+([A-Z]\w+)/g)
  for (const ld of localDefs) {
    allImportedNames.add(ld[1])
  }

  // Find PascalCase JSX usage that is NOT imported and IS a valid lucide icon
  const jsxUsage = content.matchAll(/<([A-Z][a-zA-Z0-9]+)(?:\s|\/|>)/g)
  const missingIcons = new Set<string>()
  for (const m of jsxUsage) {
    const name = m[1]
    if (allImportedNames.has(name)) continue
    if (VALID_ICONS.has(name)) {
      missingIcons.add(name)
    }
  }

  if (missingIcons.size === 0) return content

  // Add missing icons to existing lucide import or create one
  const iconImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/)
  if (iconImportMatch) {
    const existingIcons = iconImportMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const allIcons = [...new Set([...existingIcons, ...missingIcons])].join(', ')
    content = content.replace(iconImportMatch[0], `import { ${allIcons} } from 'lucide-react'`)
  } else {
    // No existing lucide import — add one after the last import line
    const lastImportIdx = content.lastIndexOf('\nimport ')
    const insertAfter = content.indexOf('\n', lastImportIdx + 1)
    if (insertAfter > 0) {
      const iconImport = `\nimport { ${[...missingIcons].join(', ')} } from 'lucide-react'`
      content = content.slice(0, insertAfter) + iconImport + content.slice(insertAfter)
    } else {
      content = `import { ${[...missingIcons].join(', ')} } from 'lucide-react'\n${content}`
    }
  }

  fixes.push({
    layer: 'B',
    type: 'icon-import-added',
    description: `Added missing icon imports: ${[...missingIcons].join(', ')}`,
  })

  return content
}

// Fix className attribute issues.
function fixClassNameAttr(content: string, fixes: AutofixFix[]): string {
  if (/\bclass=/.test(content)) {
    content = content.replace(/\bclass=/g, 'className=')
    fixes.push({ layer: 'B', type: 'classname-fix', description: 'Fixed class= → className= (JSX)' })
  }

  if (/\bfor=/.test(content)) {
    content = content.replace(/\bfor=/g, 'htmlFor=')
    fixes.push({ layer: 'B', type: 'htmlfor-fix', description: 'Fixed for= → htmlFor= (JSX)' })
  }

  return content
}

// Fix naming conflicts across imports.
// Common: `import Link from 'next/link'` + `import { Link } from 'lucide-react'` = duplicate identifier.
function fixImportNameConflicts(content: string, fixes: AutofixFix[]): string {
  // Collect all imported names and their source modules
  const nameToModule = new Map<string, string[]>()

  const importRegex = /^import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/gm
  let m
  while ((m = importRegex.exec(content)) !== null) {
    const defaultName = m[1]
    const namedImports = m[2]
    const mod = m[3]

    if (defaultName) {
      if (!nameToModule.has(defaultName)) nameToModule.set(defaultName, [])
      nameToModule.get(defaultName)!.push(mod)
    }
    if (namedImports) {
      for (const raw of namedImports.split(',')) {
        const trimmed = raw.trim()
        if (!trimmed) continue
        // Handle "Foo as Bar" — the local name is Bar
        const asMatch = trimmed.match(/^\w+\s+as\s+(\w+)$/)
        const localName = asMatch ? asMatch[1] : trimmed
        if (!nameToModule.has(localName)) nameToModule.set(localName, [])
        nameToModule.get(localName)!.push(mod)
      }
    }
  }

  // Find conflicts
  for (const [name, modules] of nameToModule) {
    if (modules.length <= 1) continue

    // Resolve conflict: if one is from lucide-react, alias it with "Icon" suffix
    const lucideIdx = modules.indexOf('lucide-react')
    if (lucideIdx >= 0) {
      const alias = `${name}Icon`
      // Replace in import: { Link } -> { Link as LinkIcon }
      // Also need to replace JSX usage: <Link -> <LinkIcon
      const importPattern = new RegExp(
        `(import\\s*\\{[^}]*?)\\b${name}\\b([^}]*\\}\\s*from\\s*['"]lucide-react['"])`,
      )
      const importMatch = content.match(importPattern)
      if (importMatch) {
        content = content.replace(importPattern, `$1${name} as ${alias}$2`)
        // Replace JSX usage of the icon (but NOT the other import's usage)
        // Icons in JSX: <Link className=... /> or <Link />
        // We need to be careful not to replace <Link href=...> (next/link usage)
        // Strategy: replace <Name followed by space+non-href or /> (icon pattern)
        // vs <Name followed by href= (next/link pattern)
        // Simpler: just replace all JSX <Name to <AliasName since the import is now aliased
        content = content.replace(new RegExp(`<${name}(\\s|\\/)`, 'g'), `<${alias}$1`)
        content = content.replace(new RegExp(`</${name}>`, 'g'), `</${alias}>`)

        fixes.push({
          layer: 'B',
          type: 'import-conflict',
          description: `Aliased lucide-react "${name}" to "${alias}" to avoid conflict with ${modules.filter(m => m !== 'lucide-react').join(', ')}`,
        })
      }
    }
  }

  return content
}

// Remove duplicate imports (same module imported multiple times).
function fixDuplicateImports(content: string, fixes: AutofixFix[]): string {
  const importLines = content.match(/^import\s+.*from\s+['"][^'"]+['"];?$/gm)
  if (!importLines || importLines.length < 2) return content

  const seen = new Map<string, string[]>()
  for (const line of importLines) {
    const moduleMatch = line.match(/from\s+['"]([^'"]+)['"]/)
    if (!moduleMatch) continue
    const mod = moduleMatch[1]
    if (!seen.has(mod)) seen.set(mod, [])
    seen.get(mod)!.push(line)
  }

  for (const [mod, lines] of seen) {
    if (lines.length <= 1) continue

    // Merge named imports
    const allNamed = new Set<string>()
    let defaultImport = ''

    for (const line of lines) {
      const namedMatch = line.match(/\{([^}]+)\}/)
      if (namedMatch) {
        namedMatch[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((n) => allNamed.add(n))
      }
      const defMatch = line.match(/import\s+(\w+)\s+/)
      if (defMatch && defMatch[1] !== 'type') {
        defaultImport = defMatch[1]
      }
    }

    const parts: string[] = []
    if (defaultImport) parts.push(defaultImport)
    if (allNamed.size > 0) parts.push(`{ ${[...allNamed].join(', ')} }`)

    const merged = `import ${parts.join(', ')} from '${mod}'`

    // Replace first occurrence, remove the rest
    let replaced = false
    for (const line of lines) {
      if (!replaced) {
        content = content.replace(line, merged)
        replaced = true
      } else {
        content = content.replace(line + '\n', '')
        content = content.replace(line, '')
      }
    }

    fixes.push({
      layer: 'B',
      type: 'duplicate-import',
      description: `Merged duplicate imports from "${mod}"`,
    })
  }

  return content
}

// Strengthen weak glass nav treatments that become unreadable on busy hero photography.
function fixNavbarGlassReadability(content: string, filePath: string, fixes: AutofixFix[]): string {
  if (!/NavbarSection\.tsx$/.test(filePath)) return content

  const original = content

  content = content.replace(
    /bg-foreground\/\d+\s+backdrop-blur(?:-[\w]+)?\s+border\s+border-(?:primary-foreground|foreground)\/\d+/g,
    'bg-background/55 backdrop-blur-xl border border-border/40 shadow-2xl shadow-black/10'
  )

  if (content !== original) {
    fixes.push({
      layer: 'B',
      type: 'navbar-glass',
      description: 'Strengthened weak glass navbar surface for readability over busy hero imagery',
    })
  }

  return content
}

// Keep image-led heroes readable without crushing the photography under stacked dark overlays.
function fixHeroOverlayReadability(content: string, filePath: string, fixes: AutofixFix[]): string {
  if (!/HeroSection\.tsx$/.test(filePath)) return content

  const original = content

  content = content.replace(
    /bg-gradient-to-b\s+from-primary\/(\d+)\s+via-primary\/(\d+)\s+to-primary\/(\d+)/g,
    (match, from, via, to) => {
      const nextFrom = Math.min(Number(from), 62)
      const nextVia = Math.min(Number(via), 36)
      const nextTo = Math.min(Number(to), 78)

      if (nextFrom === Number(from) && nextVia === Number(via) && nextTo === Number(to)) {
        return match
      }

      return `bg-gradient-to-b from-primary/${nextFrom} via-primary/${nextVia} to-primary/${nextTo}`
    }
  )

  content = content.replace(
    /bg-gradient-to-r\s+from-primary\/(\d+)\s+via-transparent\s+to-primary\/(\d+)/g,
    (match, from, to) => {
      const nextFrom = Math.min(Number(from), 38)
      const nextTo = Math.min(Number(to), 24)

      if (nextFrom === Number(from) && nextTo === Number(to)) {
        return match
      }

      return `bg-gradient-to-r from-primary/${nextFrom} via-transparent to-primary/${nextTo}`
    }
  )

  if (content !== original) {
    fixes.push({
      layer: 'B',
      type: 'hero-overlay',
      description: 'Reduced excessively dark hero overlay strength so photography remains visible',
    })
  }

  return content
}

export function applyAutofixes(content: string, filePath: string): AutofixResult {
  const fixes: AutofixFix[] = []
  const missingDeps: string[] = []

  content = fixClientDirective(content, filePath, fixes)
  content = fixDefaultExport(content, filePath, fixes)
  content = fixImportNameConflicts(content, fixes)
  content = validateImports(content, filePath, fixes, missingDeps)
  content = validateIconUsage(content, fixes)
  content = fixClassNameAttr(content, fixes)
  content = fixDuplicateImports(content, fixes)
  content = fixNavbarGlassReadability(content, filePath, fixes)
  content = fixHeroOverlayReadability(content, filePath, fixes)

  if (fixes.length > 0) {
    log.info('AST autofixes applied', {
      file: filePath,
      fixCount: fixes.length,
      types: [...new Set(fixes.map((f) => f.type))],
      missingDeps,
    })
  }

  return { content, fixes, missingDeps }
}
