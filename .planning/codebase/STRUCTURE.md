# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```
F:\Factory\SiteForge/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API route handlers
│   │   ├── generate/     # Main generation endpoint
│   │   ├── iterate/      # Site iteration endpoint
│   │   ├── plan/         # Blueprint-only generation
│   │   ├── projects/     # Project CRUD operations
│   │   └── sandbox/      # Direct sandbox operations
│   ├── projects/         # Projects listing page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main generation UI
├── components/           # Shared React components
│   ├── ui/              # shadcn/ui primitives
│   ├── chat-panel.tsx   # Iteration chat interface
│   ├── preview-frame.tsx # iframe preview component
│   ├── pipeline-status.tsx # Generation progress display
│   ├── blueprint-editor.tsx # Blueprint editing UI
│   ├── code-panel.tsx   # Code viewer component
│   └── prompt-input.tsx # Prompt submission input
├── lib/                  # Core business logic
│   ├── agents/          # LLM agent implementations
│   ├── llm/             # LLM provider abstractions
│   ├── pipeline/        # Generation pipeline orchestrator
│   ├── prompts/         # Agent system prompts
│   ├── sandbox/         # E2B sandbox wrapper
│   ├── services/       # External service integrations
│   ├── store/           # Project persistence
│   ├── templates/       # Code generation templates
│   ├── utils/           # Utility functions
│   ├── logger.ts        # Structured logging
│   └── utils.ts         # cn() helper
├── siteforge-core/       # Standalone core package (isolated from main app)
│   ├── app/             # Core app pages
│   ├── components/      # Core UI components
│   ├── lib/             # Core libraries
│   └── types/           # Core type definitions
├── types/               # Shared TypeScript types
├── data/                # Runtime data storage
│   └── projects/        # JSON project files
├── public/              # Static assets
├── .env.local           # Environment variables (not committed)
└── package.json         # Main package manifest
```

## Directory Purposes

**`app/` (Next.js App Router):**
- Purpose: Page routes and API endpoints
- Contains: `layout.tsx`, `page.tsx`, `projects/`, `api/`
- Key files: `app/page.tsx`, `app/api/generate/route.ts`

**`components/` (Shared UI):**
- Purpose: Reusable React components
- Contains: Feature components (`chat-panel.tsx`, `preview-frame.tsx`) and shadcn/ui primitives
- Key files: `components/chat-panel.tsx`, `components/preview-frame.tsx`

**`lib/` (Business Logic):**
- Purpose: Core application logic, services, and integrations
- Contains: Agents, LLM providers, pipeline, sandbox, store, templates
- Key files: `lib/pipeline/orchestrator.ts`, `lib/agents/developer.ts`, `lib/llm/registry.ts`

**`types/` (Type Definitions):**
- Purpose: Shared TypeScript interfaces
- Contains: `blueprint.ts`, `pipeline.ts`
- Key files: `types/blueprint.ts`, `types/pipeline.ts`

**`siteforge-core/` (Sub-package):**
- Purpose: Isolated core functionality (may be extracted as separate package)
- Contains: `app/`, `components/`, `lib/`, `types/`
- Note: Excluded from main tsconfig.json

**`data/projects/` (Runtime Storage):**
- Purpose: JSON file-based project persistence
- Generated at runtime, not committed

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Main UI entry point
- `app/api/generate/route.ts`: Primary generation API
- `app/projects/page.tsx`: Projects listing page

**Configuration:**
- `tsconfig.json`: TypeScript config with `@/*` path alias
- `package.json`: Dependencies and scripts
- `next.config.ts`: Next.js configuration
- `.env.local.example`: Environment variable template

**Core Logic:**
- `lib/pipeline/orchestrator.ts`: Pipeline coordination (457 lines)
- `lib/agents/developer.ts`: AI component generation
- `lib/agents/architect.ts`: Blueprint structure planning
- `lib/agents/designer.ts`: Design system generation
- `lib/agents/fixer.ts`: Build error auto-fix
- `lib/agents/iterator.ts`: Site iteration changes

**Services:**
- `lib/sandbox/service.ts`: E2B sandbox abstraction
- `lib/store/project-store.ts`: Project persistence
- `lib/services/image-pipeline.ts`: AI image generation

## Naming Conventions

**Files:**
- PascalCase for components: `BlueprintEditor.tsx`, `ChatPanel.tsx`
- kebab-case for utilities: `image-pipeline.ts`, `project-store.ts`
- kebab-case for directories: `lib/agents/`, `components/ui/`

**Directories:**
- kebab-case: `lib/agents/`, `lib/llm/`, `components/ui/`

**TypeScript Types:**
- PascalCase interfaces: `interface Blueprint`, `interface PipelineState`
- PascalCase type aliases: `type PipelineStage`, `type SSEEvent`

**Functions:**
- camelCase: `runPipeline`, `generateBlueprint`, `createSandboxService`
- Verb-noun pattern: `runArchitect`, `fixBuildErrors`, `injectImages`

## Where to Add New Code

**New Feature/API Endpoint:**
- Primary code: `app/api/[feature]/route.ts`
- Tests: Create `__tests__/` alongside route file

**New Agent:**
- Implementation: `lib/agents/[agent-name].ts`
- Type definitions: `lib/agents/types.ts` (if shared types needed)
- System prompt: `lib/prompts/[feature].ts`

**New UI Component:**
- Implementation: `components/[component-name].tsx`
- UI primitives: `components/ui/[primitive].tsx`

**New Service:**
- Implementation: `lib/services/[service-name].ts`
- Types: `lib/services/types.ts` or `types/[feature].ts`

**Utilities:**
- Shared helpers: `lib/utils.ts` or `lib/utils/[feature].ts`
- Constants: `lib/constants.ts` (if needed)

## Special Directories

**`siteforge-core/`:**
- Purpose: Standalone core package (isolated build context)
- Generated: No
- Committed: Yes
- Note: Excluded from main tsconfig.json via `"exclude": ["siteforge-core"]`

**`data/projects/`:**
- Purpose: Runtime project storage
- Generated: Yes (at runtime)
- Committed: No (.gitignore excludes `data/`)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (via npm install)
- Committed: No

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (via next build)
- Committed: No

---

*Structure analysis: 2026-04-09*
