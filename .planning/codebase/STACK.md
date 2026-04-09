# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- TypeScript 5 - All source code, React components, API routes, agents, and services
- CSS/Tailwind - Styling via Tailwind CSS v4

**Secondary:**
- JSON - Configuration files, project data storage
- Dockerfile - E2B sandbox template

## Runtime

**Environment:**
- Node.js 20+ (required by Next.js 16.2)
- Runtime: Next.js Edge/Server runtime for API routes

**Package Manager:**
- npm (v10+)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.2.0 - Full-stack React framework with App Router
- React 19.2.4 - UI library
- React DOM 19.2.4

**Styling:**
- Tailwind CSS v4 - Utility-first CSS framework
- shadcn/ui v4.1.0 - Component library (base-nova style)
- tw-animate-css - Animation utilities
- class-variance-authority - Component variant handling

**AI/ML:**
- `@anthropic-ai/sdk` 0.80.0 - Claude API client
- `@google/generative-ai` 0.24.1 - Gemini API client
- `ai` 6.0.116 - AI SDK (streaming, unified interface)
- `openai` 6.32.0 - OpenAI API client

**Sandbox:**
- `e2b` 2.19.0 - Cloud sandbox for code execution/preview

**UI Components:**
- `@base-ui/react` 1.3.0 - Base UI component primitives
- `lucide-react` 0.577.0 - Icon library

**Utilities:**
- `zod` 4.3.6 - Schema validation
- `clsx` 2.1.1 - Class name utility
- `tailwind-merge` 3.5.0 - Tailwind class merging

## Testing

**Linting/Formatting:**
- ESLint 9 - Linting with `eslint-config-next`
- ESLint rules: Next.js core-web-vitals + TypeScript

## Build/Dev Tools

**TypeScript:**
- TypeScript 5
- Target: ES2017
- Module resolution: bundler
- Strict mode: enabled
- Path alias: `@/*` maps to project root

**Tailwind CSS:**
- `@tailwindcss/postcss` v4 - PostCSS plugin for Tailwind v4
- Custom config via `tailwind-merge` + `clsx`

**Next.js Configuration:**
- `next.config.ts` - Minimal config (no special options)
- Custom Docker build: `e2b.Dockerfile`

## Key Dependencies

**Critical (required for core functionality):**
- `next` 16.2.0 - Framework
- `@anthropic-ai/sdk` 0.80.0 - Primary LLM (Claude Sonnet 4-5)
- `e2b` 2.19.0 - Sandbox for live previews
- `zod` 4.3.6 - Validation

**Infrastructure:**
- `@google/generative-ai` - Gemini (image generation, fallback LLM)
- `openai` 6.32.0 - OpenAI client (available for future use)
- `lucide-react` - Icons

## Configuration

**Environment (.env.local):**
- `.env.local.example` template provided
- Required: `ANTHROPIC_API_KEY`, `E2B_API_KEY`
- Optional: `GOOGLE_AI_API_KEY`, `KLING_API_KEY`, `E2B_TEMPLATE`

**TypeScript Configuration:**
- `tsconfig.json` at project root
- Strict mode enabled
- Path aliases: `@/*` → `./`
- Excludes: `node_modules`, `siteforge-core`

**ESLint Configuration:**
- `eslint.config.mjs` - Flat config format
- Extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**PostCSS Configuration:**
- `postcss.config.mjs` - Uses `@tailwindcss/postcss` plugin

## Platform Requirements

**Development:**
- Node.js 20+
- npm or compatible package manager
- Next.js CLI (`next dev`, `next build`, `next start`)

**Production:**
- Node.js runtime
- Environment variables for API keys
- E2B account for sandbox functionality

---

*Stack analysis: 2026-04-09*
