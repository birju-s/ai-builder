# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

### Files
- **Components**: PascalCase (e.g., `PromptInput.tsx`, `BlueprintEditor.tsx`)
- **Utilities/Libraries**: camelCase (e.g., `utils.ts`, `logger.ts`, `developer.ts`)
- **API Routes**: kebab-case with bracket notation (e.g., `projects/[id]/route.ts`)
- **Types**: camelCase (e.g., `pipeline.ts`, `blueprint.ts`)

### Functions
- **React Components**: PascalCase (e.g., `export function PromptInput(...)`)
- **Regular Functions**: camelCase (e.g., `runPipeline`, `cleanCodeOutput`, `createLogger`)
- **Event Handlers**: camelCase with `handle` prefix (e.g., `handleSubmit`, `handleKeyDown`)
- **API Route Handlers**: UPPERCASE for HTTP methods (e.g., `GET`, `POST`, `DELETE`)

### Variables
- **State Variables**: camelCase with descriptive names (e.g., `isRunning`, `previewUrl`, `progressMessage`)
- **Constants**: camelCase or SCREAMING_SNAKE_CASE for true constants (e.g., `FAILURE_THRESHOLD = 3`)
- **Component Props Interfaces**: PascalCase with `Props` suffix (e.g., `interface PipelineStatusProps`)

### Types
- **Interfaces**: PascalCase (e.g., `interface LLMProvider`, `interface PipelineState`)
- **Type Aliases**: PascalCase (e.g., `type PipelineStage = 'idle' | 'planning' | ...`)
- **Enums**: Not used - prefer union types (e.g., `type SectionType = 'hero' | 'features' | ...`)

## Code Style

### Formatting
- **Tool**: ESLint with `eslint-config-next/core-web-vitals` and TypeScript support
- **Configuration**: `eslint.config.mjs` using flat config format
- **Indentation**: 2 spaces (enforced by default TypeScript/ESLint)

### TypeScript Settings
- **Strict Mode**: Enabled (`"strict": true` in `tsconfig.json`)
- **Target**: ES2017
- **Module Resolution**: `bundler`
- **Path Aliases**: `@/*` maps to project root

### Linting Rules (from `eslint-config-next`)
- No unused variables
- Prefer const over let
- Consistent return types
- React hooks rules enforced

### Import Organization
1. React/core imports (`react`, `next/font`)
2. Third-party libraries (`lucide-react`, `class-variance-authority`)
3. Internal imports from `@/lib`, `@/components`, `@/types`, `@/app`
4. Relative imports

### Path Aliases
- `@/*` → `./` (project root)
- Used in all imports: `import { createLogger } from '@/lib/logger'`

## Error Handling

### Pattern: try/catch with instanceof checks
```typescript
// Preferred
try {
  const result = await someAsyncOperation()
  return result
} catch (error) {
  return new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}

// Empty catch blocks for expected failures
try {
  await sandbox.files.write(path, content)
} catch {
  // Sandbox may have expired, that's ok
}
```

### API Route Error Responses
- Return `Response.json({ error: 'message' }, { status: 400/404/500 })`
- Include `headers: { 'Content-Type': 'application/json' }` for explicit JSON responses

### Error Types
- Use `unknown` for caught errors, then check `instanceof Error`
- Never silently swallow errors without a comment explaining why

## Logging

### Framework: Custom JSON logger
- Location: `lib/logger.ts`
- Pattern: Factory function `createLogger(module: string)`
- Output: JSON to stdout/stderr

### Usage Pattern
```typescript
const log = createLogger('module:name')

log.info('Message', { key: value })
log.warn('Warning message', { context })
log.error('Error occurred', { error: errorMessage })
log.debug('Debug info', { details })

// Timing pattern
const timer = log.time('operation')
const durationMs = timer.end({ metadata })
```

### Log Levels
- `debug`: Verbose debugging information
- `info`: Normal operational messages
- `warn`: Warnings (circuit breaker, fallbacks)
- `error`: Errors (with stack trace via console.error)

## Comments

### When to Comment
- Complex algorithm explanations (see `lib/pipeline/orchestrator.ts` for phase documentation)
- TODO items (if added)
- Non-obvious workarounds

### JSDoc/TSDoc
- Not consistently used
- Brief inline comments for complex logic
- No formal documentation in source files

## Function Design

### Size Guidelines
- Keep functions under ~50 lines
- Complex logic split into smaller helper functions
- API routes should be concise, delegating to service functions

### Parameters
- Use TypeScript types for all parameters
- Avoid excessive parameters (>4) - use options objects
- Mark optional parameters with `?`

### Return Values
- Prefer `async/await` over raw Promises
- API routes return `Response` objects
- Service functions return typed data

## Module Design

### Exports
- **Components**: Named exports (`export function ComponentName`)
- **Utilities**: Named exports (`export function utilityFunction`)
- **Default exports**: Used for Next.js pages (`export default function Page()`)

### Barrel Files
- Not used - direct imports from modules
- UI components have grouped exports (e.g., `components/ui/button.tsx` exports `Button, buttonVariants`)

## React Patterns

### Client Components
- Mark with `'use client'` directive at top of file
- Use functional components with typed props

### Hooks Usage
- `useState` with explicit type annotations when not inferrable
- `useCallback` for event handlers passed as props
- `useRef` for DOM element references
- `useEffect` for side effects with proper cleanup

### State Updates
```typescript
// Functional state updates for derived state
setItems((prev) => [...prev, newItem])

// Batch related state updates in single handler
setStage('generating')
setProgressPercent(0)
setFiles([])
```

## Next.js Conventions

### Route Handlers
- Location: `app/api/[resource]/route.ts`
- Export HTTP methods: `GET`, `POST`, `DELETE`, etc.
- Mark dynamic routes: `export const dynamic = 'force-dynamic'`
- Async params: `{ params }: { params: Promise<{ id: string }> }`

### Server vs Client Components
- Default: Server Components
- Client: `'use client'` directive
- Data fetching: Server Components preferred, client fetch for streaming

## Styling Patterns

### Tailwind CSS v4
- Utility classes for all styling
- CSS custom properties for theme tokens
- Dark mode via `dark:` prefix

### Component Styling
- Use `cn()` utility for conditional classes
- CVA (class-variance-authority) for component variants
- Tailwind merge for handling class conflicts

### Theme Variables
```typescript
// Accessing design system colors
className="bg-[var(--primary)] text-[var(--primary-foreground)]"
```

---

*Convention analysis: 2026-04-09*
