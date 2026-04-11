import generatedSitePackage from './generated-site-package.json'
import type { DesignSystem } from '@/types/blueprint'

const SAFE_FONTS: Record<string, string> = {
  'Inter': 'Inter',
  'DM Sans': 'DM_Sans',
  'Space Grotesk': 'Space_Grotesk',
  'Outfit': 'Outfit',
  'Playfair Display': 'Playfair_Display',
  'Lora': 'Lora',
  'Merriweather': 'Merriweather',
  'Roboto': 'Roboto',
  'Open Sans': 'Open_Sans',
  'Poppins': 'Poppins',
  'Montserrat': 'Montserrat',
  'Raleway': 'Raleway',
  'Nunito': 'Nunito',
  'Source Sans 3': 'Source_Sans_3',
  'Work Sans': 'Work_Sans',
  'Manrope': 'Manrope',
  'Plus Jakarta Sans': 'Plus_Jakarta_Sans',
  'IBM Plex Sans': 'IBM_Plex_Sans',
  'IBM Plex Mono': 'IBM_Plex_Mono',
  'JetBrains Mono': 'JetBrains_Mono',
  'Fira Code': 'Fira_Code',
  'Source Code Pro': 'Source_Code_Pro',
  'Geist': 'Geist',
  'Geist Mono': 'Geist_Mono',
}

function fontImportName(fontName: string): string {
  if (SAFE_FONTS[fontName]) return SAFE_FONTS[fontName]
  // Fallback: try converting to underscore form, but this may not exist
  return fontName.replace(/\s+/g, '_')
}

function safeFontName(fontName: string, fallback: string): string {
  return SAFE_FONTS[fontName] ? fontName : fallback
}

function generatePackageJson(appType: 'website' | 'fullstack'): string {
  const pkg: Record<string, unknown> = { ...generatedSitePackage }
  if (appType === 'fullstack') {
    pkg.dependencies = {
      ...(pkg.dependencies as Record<string, string>),
      express: '^4.19.2',
      cors: '^2.8.5',
      '@prisma/client': '^5.13.0',
      'dotenv': '^16.4.5',
    }
    pkg.devDependencies = {
      ...(pkg.devDependencies as Record<string, string>),
      prisma: '^5.13.0',
      '@types/express': '^4.17.21',
      '@types/cors': '^2.8.17',
      'tsx': '^4.7.2',
    }
    pkg.scripts = {
      ...(pkg.scripts as Record<string, string>),
      'dev': 'prisma db push && tsx watch server.ts',
      'build': 'prisma db push && prisma generate && next build',
      'start': 'tsx server.ts',
    }
  }
  return JSON.stringify(pkg, null, 2) + '\n'
}

function generatePostcssConfig(): string {
  return [
    'import path from "node:path";',
    'import { fileURLToPath } from "node:url";',
    '',
    'const rootDir = path.dirname(fileURLToPath(import.meta.url));',
    'const config = { plugins: { "@tailwindcss/postcss": { base: rootDir } } };',
    'export default config;',
    '',
  ].join('\n')
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'react-jsx',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    },
    null,
    2
  ) + '\n'
}

function generateNextConfig(): string {
  return [
    'import path from "node:path";',
    'import { fileURLToPath } from "node:url";',
    'import type { NextConfig } from "next";',
    '',
    'const rootDir = path.dirname(fileURLToPath(import.meta.url));',
    '',
    'const nextConfig: NextConfig = {',
    '  turbopack: {',
    '    root: rootDir,',
    '    resolveAlias: {',
    '      tailwindcss: path.join(rootDir, "node_modules", "tailwindcss"),',
    '    },',
    '  },',
    '};',
    '',
    'export default nextConfig;',
    '',
  ].join('\n')
}

function generateGlobalsCss(colors: DesignSystem['colors'], borderRadius: string): string {
  return [
    '@import "tailwindcss";',
    '',
    '@theme inline {',
    '  --color-background: var(--background);',
    '  --color-foreground: var(--foreground);',
    '  --color-primary: var(--primary);',
    '  --color-primary-foreground: var(--primary-foreground);',
    '  --color-secondary: var(--secondary);',
    '  --color-secondary-foreground: var(--secondary-foreground);',
    '  --color-accent: var(--accent);',
    '  --color-muted: var(--muted);',
    '  --color-muted-foreground: var(--muted-foreground);',
    '  --color-border: var(--border);',
    '  --color-card: var(--card);',
    '  --color-card-foreground: var(--card-foreground);',
    '  --font-sans: var(--font-body);',
    '  --font-display: var(--font-display);',
    '  --font-mono: var(--font-mono);',
    '  --radius-sm: calc(var(--radius) * 0.6);',
    '  --radius-md: calc(var(--radius) * 0.8);',
    '  --radius-lg: var(--radius);',
    '  --radius-xl: calc(var(--radius) * 1.4);',
    '}',
    '',
    ':root {',
    `  --background: ${colors.background};`,
    `  --foreground: ${colors.foreground};`,
    `  --primary: ${colors.primary};`,
    `  --primary-foreground: ${colors.primaryForeground};`,
    `  --secondary: ${colors.secondary};`,
    `  --secondary-foreground: ${colors.secondaryForeground};`,
    `  --accent: ${colors.accent};`,
    `  --muted: ${colors.muted};`,
    `  --muted-foreground: ${colors.mutedForeground};`,
    `  --border: ${colors.border};`,
    `  --card: ${colors.card};`,
    `  --card-foreground: ${colors.cardForeground};`,
    `  --radius: ${borderRadius};`,
    '}',
    '',
    '@layer base {',
    '  body {',
    '    @apply bg-background text-foreground;',
    '  }',
    '}',
    '',
  ].join('\n')
}

function generateLayout(
  uniqueFonts: string[],
  displayFontImport: string,
  bodyFontImport: string,
  monoFontImport: string
): string {
  const classNameValue = '`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`'

  return [
    'import type { Metadata } from "next";',
    `import { ${uniqueFonts.join(', ')} } from "next/font/google";`,
    'import "./globals.css";',
    '',
    `const displayFont = ${displayFontImport}({`,
    '  variable: "--font-display",',
    '  subsets: ["latin"],',
    '});',
    '',
    `const bodyFont = ${bodyFontImport}({`,
    '  variable: "--font-body",',
    '  subsets: ["latin"],',
    '});',
    '',
    `const monoFont = ${monoFontImport}({`,
    '  variable: "--font-mono",',
    '  subsets: ["latin"],',
    '});',
    '',
    'export const metadata: Metadata = {',
    '  title: "Generated Site",',
    '  description: "Built with SiteForge",',
    '  referrer: "no-referrer",',
    '};',
    '',
    'const VisualEditScript = `',
    '  document.addEventListener("keydown", (e) => { if (e.altKey) document.body.classList.add("alt-pressed"); });',
    '  document.addEventListener("keyup", (e) => { if (!e.altKey) document.body.classList.remove("alt-pressed"); });',
    '  window.addEventListener("blur", () => document.body.classList.remove("alt-pressed"));',
    '  ',
    '  document.addEventListener("click", function(e) {',
    '    if (!e.altKey) return;',
    '    e.preventDefault();',
    '    e.stopPropagation();',
    '    let target = e.target;',
    '    while (target && target !== document.body) {',
    '      if (target.hasAttribute("data-source-file")) {',
    '        window.parent.postMessage({ type: "open-file", file: target.getAttribute("data-source-file") }, "*");',
    '        return;',
    '      }',
    '      target = target.parentElement;',
    '    }',
    '  }, true);',
    '`;',
    '',
    'const VisualEditStyles = `',
    '  .alt-pressed [data-source-file] { cursor: crosshair; transition: outline 0.2s; outline: 2px solid transparent; }',
    '  .alt-pressed [data-source-file]:hover { outline: 2px solid #3b82f6; outline-offset: -2px; z-index: 50; }',
    '`;',
    '',
    'export default function RootLayout({',
    '  children,',
    '}: {',
    '  children: React.ReactNode;',
    '}) {',
    '  return (',
    `    <html lang="en" className={${classNameValue}}>`,
    '      <body className="min-h-screen">',
    '        {children}',
    '        <style dangerouslySetInnerHTML={{ __html: VisualEditStyles }} />',
    '        <script dangerouslySetInnerHTML={{ __html: VisualEditScript }} />',
    '      </body>',
    '    </html>',
    '  );',
    '}',
    '',
  ].join('\n')
}

function generateUtils(): string {
  return [
    'import { clsx, type ClassValue } from "clsx";',
    'import { twMerge } from "tailwind-merge";',
    '',
    'export function cn(...inputs: ClassValue[]) {',
    '  return twMerge(clsx(inputs));',
    '}',
    '',
  ].join('\n')
}

export function generateDeterministicFiles(
  design: DesignSystem,
  appType: 'website' | 'fullstack' = 'website'
): Array<{ path: string; content: string }> {
  const { colors, typography, borderRadius } = design

  const safeDisplay = safeFontName(typography.displayFont, 'Inter')
  const safeBody = safeFontName(typography.bodyFont, 'Inter')
  const safeMono = safeFontName(typography.monoFont, 'Geist Mono')

  const displayFontImport = fontImportName(safeDisplay)
  const bodyFontImport = fontImportName(safeBody)
  const monoFontImport = fontImportName(safeMono)

  const uniqueFonts = [...new Set([displayFontImport, bodyFontImport, monoFontImport])]

  const files = [
    { path: 'package.json', content: generatePackageJson(appType) },
    { path: 'postcss.config.mjs', content: generatePostcssConfig() },
    { path: 'tsconfig.json', content: generateTsConfig() },
    { path: 'next.config.ts', content: generateNextConfig() },
    { path: 'app/globals.css', content: generateGlobalsCss(colors, borderRadius) },
    {
      path: 'app/layout.tsx',
      content: generateLayout(uniqueFonts, displayFontImport, bodyFontImport, monoFontImport),
    },
    { path: 'lib/utils.ts', content: generateUtils() },
  ]

  if (appType === 'fullstack') {
    files.push({
      path: 'server.ts',
      content: generateServerTs(),
    })
    files.push({
      path: 'prisma/client.ts',
      content: `import { PrismaClient } from '@prisma/client'\n\nconst prisma = new PrismaClient()\nexport default prisma\n`,
    })
  }

  return files
}

function generateServerTs(): string {
  return [
    'import express from "express"',
    'import next from "next"',
    'import cors from "cors"',
    'import apiRoutes from "./server/routes"',
    '',
    'const dev = process.env.NODE_ENV !== "production"',
    'const hostname = "0.0.0.0"',
    'const port = parseInt(process.env.PORT || "3000", 10)',
    '',
    'const app = next({ dev, hostname, port })',
    'const handle = app.getRequestHandler()',
    '',
    'app.prepare().then(() => {',
    '  const server = express()',
    '  server.use(cors())',
    '  server.use(express.json())',
    '',
    '  // API routes',
    '  server.use("/api", apiRoutes)',
    '',
    '  // Next.js fallback',
    '  server.all("*", (req, res) => {',
    '    return handle(req, res)',
    '  })',
    '',
    '  server.listen(port, (err?: unknown) => {',
    '    if (err) throw err',
    '    console.log(`> Ready on http://localhost:${port}`)',
    '  })',
    '})',
  ].join('\n')
}
