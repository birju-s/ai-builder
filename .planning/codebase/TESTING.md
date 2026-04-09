# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Status:** No test infrastructure currently configured

The project does not have a testing framework set up. The following would be recommended based on the existing stack.

### Recommended Setup

**Runner:**
- Vitest (compatible with Vite, fast, native ESM support)
- Config: `vitest.config.ts` or `vitest.config.mts`

**Alternatives:**
- Jest (larger ecosystem, but slower)
- Playwright for E2E (see siteforge-core)

**Run Commands (recommended):**
```bash
npm install -D vitest @testing-library/react @testing-library/dom
```

## Test File Organization

**Current State:** Not applicable - no test files exist

**Recommended Structure (if tests were added):**
```
src/
├── __tests__/           # Shared test utilities/fixtures
│   ├── fixtures/
│   └── mocks/
├── lib/
│   ├── logger.test.ts  # Unit tests co-located
│   ├── utils.test.ts
│   └── agents/
│       └── developer.test.ts
├── components/
│   └── __tests__/      # Component tests
│       ├── prompt-input.test.tsx
│       └── blueprint-editor.test.tsx
└── app/
    └── api/
        └── __tests__/   # API route integration tests
```

**Naming Convention:**
- Files: `*.test.ts` or `*.test.tsx` for Vitest
- Co-located with source files preferred

## Test Structure

### Recommended Patterns

**Unit Test Structure:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { createLogger } from '@/lib/logger'

describe('createLogger', () => {
  it('should create a logger with the given module name', () => {
    const logger = createLogger('test:module')
    expect(logger).toBeDefined()
  })

  it('should time operations and return duration', () => {
    const logger = createLogger('test:timing')
    const timer = logger.time('operation')
    const duration = timer.end()
    expect(duration).toBeGreaterThanOrEqual(0)
  })
})
```

**Component Test Structure:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PromptInput } from '@/components/prompt-input'

describe('PromptInput', () => {
  it('should render textarea with placeholder', () => {
    render(<PromptInput onSubmit={vi.fn()} />)
    expect(screen.getByPlaceholderText('Describe the website you want to build...')).toBeInTheDocument()
  })

  it('should call onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn()
    render(<PromptInput onSubmit={onSubmit} />)
    
    const textarea = screen.getByPlaceholderText('Describe the website you want to build...')
    fireEvent.change(textarea, { target: { value: 'Test prompt' } })
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onSubmit).toHaveBeenCalledWith('Test prompt')
  })
})
```

## Mocking

### Current State: Not applicable

### Recommended Patterns (if tests added)

**Mocking LLM Providers:**
```typescript
import { vi } from 'vitest'
import * as registry from '@/lib/llm/registry'

vi.mock('@/lib/llm/registry', () => ({
  getDefaultProvider: vi.fn(() => ({
    name: 'mock',
    generateText: vi.fn().mockResolvedValue({
      text: 'Mocked response',
      inputTokens: 10,
      outputTokens: 20,
      model: 'mock-model',
      latencyMs: 100,
    }),
    streamText: vi.fn(),
  })),
}))
```

**Mocking Environment Variables:**
```typescript
import { vi } from 'vitest'

// In test file or setup file
vi.stubEnv('E2B_API_KEY', 'test-api-key')
```

**Mocking Third-Party Services:**
```typescript
import { vi } from 'vitest'

// Mock e2b SDK
vi.mock('e2b', () => ({
  Sandbox: {
    connect: vi.fn().mockResolvedValue({
      id: 'test-sandbox',
      files: {
        write: vi.fn().mockResolvedValue(undefined),
      },
    }),
  },
}))
```

## Fixtures and Factories

### Current State: Not applicable - no test data

### Recommended Patterns

**Type Fixtures:**
```typescript
// fixtures/blueprint.ts
import type { Blueprint } from '@/types/blueprint'

export const sampleBlueprint: Blueprint = {
  prompt: 'Test website',
  appType: 'website',
  name: 'Test Site',
  description: 'A test website',
  pages: [
    {
      route: '/',
      name: 'Home',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          headline: 'Welcome',
          subtext: 'Test subtext',
        },
      ],
    },
  ],
  designSystem: {
    colors: {
      primary: '#000000',
      primaryForeground: '#ffffff',
      // ... other colors
    },
    typography: {
      displayFont: 'Inter',
      bodyFont: 'Inter',
      monoFont: 'JetBrains Mono',
    },
    borderRadius: '0.5rem',
    mood: 'professional',
  },
}
```

**Factory Functions:**
```typescript
// factories/files.ts
import type { GeneratedFile } from '@/types/blueprint'

export function createGeneratedFile(overrides: Partial<GeneratedFile> = {}): GeneratedFile {
  return {
    path: 'components/Test.tsx',
    content: 'export function Test() { return <div>Test</div> }',
    sizeBytes: 62,
    generationTimeMs: 100,
    ...overrides,
  }
}
```

## Coverage

### Current State: Not enforced

**Recommendation:** Set initial target at 60-70%, increase over time

**View Coverage:**
```bash
npx vitest run --coverage
```

## Test Types

### Current Coverage Gaps

| Area | Current | Recommended |
|------|---------|-------------|
| Utility functions (`lib/utils.ts`) | 0% | Unit tests |
| Logger (`lib/logger.ts`) | 0% | Unit tests |
| LLM Registry (`lib/llm/registry.ts`) | 0% | Unit + integration tests |
| Agent functions (`lib/agents/*.ts`) | 0% | Unit tests with mocks |
| Pipeline orchestrator | 0% | Integration tests |
| API Routes | Manual only | Integration tests |
| React Components | Manual only | Component tests |
| Type validation | Manual only | Unit tests |

### Unit Tests
- **Scope:** Pure functions, utilities, type validation
- **Files to cover:** `lib/utils.ts`, `lib/logger.ts`, `lib/templates/*.ts`

### Integration Tests
- **Scope:** API routes with mocked dependencies
- **Files to cover:** `app/api/**/*.ts`
- **Approach:** Use `supertest` or fetch to hit routes with mocked services

### Component Tests
- **Scope:** React components with user interactions
- **Files to cover:** All components in `components/` directory
- **Library:** `@testing-library/react`

## Common Patterns

### Async Testing
```typescript
// Using async/await
it('should generate blueprint', async () => {
  const blueprint = await generateBlueprint('Test prompt')
  expect(blueprint.name).toBeDefined()
})

// Testing async generators (streaming)
it('should stream SSE events', async () => {
  const events: SSEEvent[] = []
  for await (const event of streamText(req)) {
    events.push(event)
  }
  expect(events.length).toBeGreaterThan(0)
})
```

### Error Testing
```typescript
it('should throw on invalid input', async () => {
  await expect(generateBlueprint('')).rejects.toThrow('prompt is required')
})

it('should return 400 for invalid JSON', async () => {
  const response = await fetch('/api/plan', {
    method: 'POST',
    body: 'not json',
    headers: { 'Content-Type': 'application/json' },
  })
  expect(response.status).toBe(400)
})
```

### React Testing
```typescript
import { render, screen, waitFor } from '@testing-library/react'

it('should show loading state', async () => {
  render(<PipelineStatus stage="generating" ... />)
  expect(screen.getByText('Generating Code')).toBeInTheDocument()
})

it('should display error message', async () => {
  render(<PipelineStatus error="Something went wrong" ... />)
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
})
```

## Testing Infrastructure Steps

To add testing to this project:

1. **Install dependencies:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/dom jsdom @testing-library/jest-dom
   ```

2. **Create config file** `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config'
   
   export default defineConfig({
     test: {
       environment: 'jsdom',
       setupFiles: ['./src/test-setup.ts'],
       include: ['src/**/*.{test,spec}.{ts,tsx}'],
     },
   })
   ```

3. **Create setup file** `src/test-setup.ts`:
   ```typescript
   import '@testing-library/jest-dom'
   import { vi } from 'vitest'
   
   vi.mock('@/lib/logger', () => ({
     createLogger: () => ({
       info: vi.fn(),
       warn: vi.fn(),
       error: vi.fn(),
       debug: vi.fn(),
       time: vi.fn(() => ({ end: vi.fn(() => 100) })),
     }),
   }))
   ```

4. **Add npm scripts:**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:run": "vitest run",
       "test:coverage": "vitest run --coverage"
     }
   }
   ```

---

*Testing analysis: 2026-04-09*
