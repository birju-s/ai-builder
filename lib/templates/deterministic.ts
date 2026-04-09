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

function generatePackageJson(): string {
  return JSON.stringify(
    {
      name: 'generated-site',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        react: '19.2.4',
        'react-dom': '19.2.4',
        next: '16.2.0',
        'class-variance-authority': '0.7.1',
        clsx: '2.1.1',
        'tailwind-merge': '3.5.0',
        'lucide-react': '0.577.0',
      },
      devDependencies: {
        tailwindcss: '4.2.2',
        '@tailwindcss/postcss': '4.2.2',
        typescript: '5.8.3',
        '@types/react': '^19',
        '@types/react-dom': '^19',
        '@types/node': '^20',
      },
    },
    null,
    2
  ) + '\n'
}

function generatePostcssConfig(): string {
  return [
    'const config = { plugins: { "@tailwindcss/postcss": {} } };',
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
    'import type { NextConfig } from "next";',
    '',
    'const nextConfig: NextConfig = {',
    '  typescript: { ignoreBuildErrors: true },',
    '  eslint: { ignoreDuringBuilds: true },',
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
    '    @apply bg-[var(--background)] text-[var(--foreground)];',
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
    '};',
    '',
    'export default function RootLayout({',
    '  children,',
    '}: {',
    '  children: React.ReactNode;',
    '}) {',
    '  return (',
    `    <html lang="en" className={${classNameValue}}>`,
    '      <body className="min-h-screen">{children}</body>',
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
  design: DesignSystem
): Array<{ path: string; content: string }> {
  const { colors, typography, borderRadius } = design

  const safeDisplay = safeFontName(typography.displayFont, 'Inter')
  const safeBody = safeFontName(typography.bodyFont, 'Inter')
  const safeMono = safeFontName(typography.monoFont, 'Geist Mono')

  const displayFontImport = fontImportName(safeDisplay)
  const bodyFontImport = fontImportName(safeBody)
  const monoFontImport = fontImportName(safeMono)

  const uniqueFonts = [...new Set([displayFontImport, bodyFontImport, monoFontImport])]

  return [
    { path: 'package.json', content: generatePackageJson() },
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
}
