# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Multi-Agent Pipeline with SSE Streaming

**Key Characteristics:**
- **Parallel execution**: Sandbox creation runs concurrently with AI planning/codegen
- **Agent orchestration**: Specialized agents (Architect, Designer, Developer, Fixer, Iterator) handle discrete tasks
- **SSE streaming**: Real-time progress updates to client via Server-Sent Events
- **Self-healing builds**: Automatic error detection and AI-powered fixes during build
- **Hot-patch iteration**: Dev server HMR for in-place file updates without rebuild

## Layers

**UI Layer (Frontend):**
- Purpose: User interface for prompting, previewing, and iterating on generated sites
- Location: `app/` and `components/`
- Contains: Next.js pages, React components, UI primitives
- Depends on: LLM services (via API routes), Pipeline types
- Used by: End users

**API Layer:**
- Purpose: Server-side endpoints for generation, iteration, and project management
- Location: `app/api/`
- Contains: Route handlers for generate, plan, iterate, projects, sandbox
- Depends on: Pipeline orchestrator, Agent services, Store services
- Used by: Frontend components (fetch calls)

**Agent Layer:**
- Purpose: LLM-powered agents for specific generation tasks
- Location: `lib/agents/`
- Contains: architect.ts, designer.ts, developer.ts, fixer.ts, iterator.ts
- Depends on: LLM registry, types
- Used by: Pipeline orchestrator, API routes

**Service Layer:**
- Purpose: Infrastructure services for sandbox, storage, and external APIs
- Location: `lib/sandbox/`, `lib/services/`, `lib/store/`
- Contains: E2B sandbox wrapper, image pipeline, project persistence
- Depends on: External services (E2B, Google AI)
- Used by: Pipeline orchestrator

**LLM Layer:**
- Purpose: Unified interface to AI providers with fallback
- Location: `lib/llm/`
- Contains: anthropic.ts, gemini.ts, registry.ts
- Depends on: External AI APIs
- Used by: Agents

## Data Flow

**Generation Flow:**

```
User Prompt
    │
    ▼
POST /api/generate
    │
    ▼
runPipeline() ──────────────────────────┐
    │                                     │
    ├── Parallel:                        │
    │   ├── generateBlueprint() ──► Architect Agent ──► Designer Agent
    │   └── createSandboxService().create()
    │
    ├── generateDeterministicFiles()
    │       └── Creates: package.json, tsconfig.json, next.config.ts, globals.css, layout.tsx, utils.ts
    │
    ├── runDeveloperAgent()
    │       ├── Generate Section Components (parallel)
    │       └── Generate Page Files (parallel)
    │
    ├── runImagePipeline() (parallel with codegen)
    │
    ├── injectImages() into component files
    │
    ├── sandbox.writeFiles() (all AI-generated files)
    │
    ├── sandbox.runCommand("npm install")
    │
    ├── fixBuildErrors() loop (up to 3 attempts)
    │
    └── sandbox.startProcess("npx next dev")
            │
            ▼
        Preview URL + SSE Events to Client
```

**Iteration Flow:**

```
User Message
    │
    ▼
POST /api/iterate
    │
    ▼
runIterator() ──► Iterator Agent ──► file changes
    │
    ▼
sandbox.files.write() (hot-patch, no rebuild)
    │
    ▼
addVersion() to project store
```

## Key Abstractions

**Pipeline Orchestrator:**
- Purpose: Coordinates the multi-phase generation pipeline
- Examples: `lib/pipeline/orchestrator.ts`
- Pattern: State machine with stage transitions, SSE event emission

**LLM Provider Interface:**
- Purpose: Unified interface for multiple AI backends
- Examples: `lib/llm/registry.ts`
- Pattern: Factory + Strategy + Circuit Breaker

**Sandbox Service:**
- Purpose: Isolated execution environment for generated code
- Examples: `lib/sandbox/service.ts`
- Pattern: Adapter wrapping E2B SDK

**Project Store:**
- Purpose: Persistent storage for generated projects
- Examples: `lib/store/project-store.ts`
- Pattern: JSON file-based storage with versioning

## Entry Points

**Frontend Entry:**
- Location: `app/page.tsx`
- Triggers: User loads root URL or navigates to /
- Responsibilities: Renders main UI, handles prompt submission, SSE stream consumption, state management

**API Routes:**
- `app/api/generate/route.ts`: Main generation endpoint (POST)
- `app/api/plan/route.ts`: Blueprint-only generation (POST)
- `app/api/iterate/route.ts`: Site iteration (POST)
- `app/api/projects/route.ts`: List projects (GET)
- `app/api/projects/[id]/route.ts`: Get/delete project (GET/DELETE)
- `app/api/sandbox/write/route.ts`: Direct sandbox file write (POST)

## Error Handling

**Strategy:** Graceful degradation with automatic recovery

**Patterns:**
- **LLM Fallback**: Circuit breaker pattern tries Anthropic → Gemini on failure
- **Build Self-Healing**: Fixer agent automatically patches build errors (up to 3 attempts)
- **Sandbox Recovery**: Retry sandbox creation if early creation fails
- **Image Pipeline Failure**: Non-blocking, continues without images if pipeline fails
- **SSE Error Propagation**: Errors sent as SSE events, displayed in UI

## Cross-Cutting Concerns

**Logging:** Structured JSON logging via `lib/logger.ts` with module tags and timing
**Validation:** Zod schema validation (v4), input sanitization in API routes
**Authentication:** API key authentication via environment variables (E2B_API_KEY, GOOGLE_AI_API_KEY)
**Type Safety:** Strict TypeScript throughout, path aliases via `@/*`

---

*Architecture analysis: 2026-04-09*
