# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**LLM Providers:**
- **Anthropic (Claude)** - Primary AI for code generation, blueprint planning, design system creation
  - SDK: `@anthropic-ai/sdk` 0.80.0
  - Default model: `claude-sonnet-4-5`
  - Auth: `ANTHROPIC_API_KEY` env var
  - Used by: `lib/llm/anthropic.ts`, fallback chain in `lib/llm/registry.ts`

- **Google Gemini** - Fallback LLM + Image generation
  - SDK: `@google/generative-ai` 0.24.1
  - Models: `gemini-2.5-flash-preview-05-20`, `gemini-2.5-flash-image` (image gen)
  - Auth: `GOOGLE_AI_API_KEY` env var
  - Used by: `lib/llm/gemini.ts`, `lib/services/image-pipeline.ts`

- **OpenAI** - Available but not currently used in core pipeline
  - SDK: `openai` 6.32.0
  - Auth: Not configured (potential future integration)

**Code Generation Sandbox:**
- **E2B** - Cloud sandbox for running Next.js builds and live previews
  - SDK: `e2b` 2.19.0
  - Auth: `E2B_API_KEY` env var
  - Optional: `E2B_TEMPLATE` for custom pre-built template (2 CPU, 4GB RAM)
  - Template definition: `e2b.toml` + `e2b.Dockerfile`
  - Used by: `lib/sandbox/service.ts`, `app/api/iterate/route.ts`

**Media Generation:**
- **Kling AI** - Hero video backgrounds (Phase 2)
  - API: REST API at `https://api-singapore.klingai.com`
  - Auth: `KLING_API_KEY` env var
  - Model: `kling-v2-6` for image-to-video
  - Used by: `lib/services/kling-video.ts`

## Data Storage

**Project Data:**
- **Local filesystem** - JSON files in `data/projects/` directory
  - No database
  - Format: One JSON file per project with versions
  - Client: Native `fs/promises`
  - Location: `lib/store/project-store.ts`

**File Storage:**
- **E2B Sandbox** - Generated code and images stored in sandbox filesystem
- **Public folder** - Images served from `/public/images/`

**Caching:**
- **None** - No external caching layer
- **LLM Prompt Caching** - Anthropic `cache_control` for system prompts (enabled via `cacheSystem: true`)

## Authentication & Identity

**API Keys (Environment Variables):**
- `ANTHROPIC_API_KEY` - Claude API access
- `GOOGLE_AI_API_KEY` - Gemini API access
- `E2B_API_KEY` - E2B sandbox access
- `KLING_API_KEY` - Kling video API access

**Authentication Approach:**
- No user authentication system
- API key-based access to external services
- Secrets stored in `.env.local` (not committed to git)

## Monitoring & Observability

**Logging:**
- **Custom JSON logger** - Structured logging via `lib/logger.ts`
- Format: JSON with level, module, message, timestamp, data fields
- Console output: `console.log` (info), `console.warn`, `console.error`
- Timer utility for measuring operation duration

**Error Tracking:**
- None - No external error tracking service (Sentry, etc.)
- Errors logged to console and emitted via SSE to client

**Metrics:**
- Custom pipeline metrics tracked in `types/pipeline.ts`:
  - Planning/generation/build timing
  - Token usage per LLM call
  - File generation counts
  - Provider used

## CI/CD & Deployment

**Hosting:**
- Next.js application (deployment target TBD)
- E2B sandboxes for dynamic preview environments

**CI Pipeline:**
- ESLint for code quality checks (`npm run lint`)

**Docker:**
- Custom E2B sandbox Dockerfile (`e2b.Dockerfile`)
- Used for pre-built template with Node.js + dependencies

## Environment Configuration

**Required env vars:**
| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `E2B_API_KEY` | Yes | E2B sandbox API key |
| `GOOGLE_AI_API_KEY` | No | Gemini (image gen, fallback LLM) |
| `KLING_API_KEY` | No | Kling video API |
| `E2B_TEMPLATE` | No | Custom E2B template ID |

**Secrets location:**
- `.env.local` - Local development (gitignored)
- `.env.local.example` - Template for configuration (committed)

## Webhooks & Callbacks

**Outgoing:**
- E2B API calls for sandbox management (create, connect, write, run commands, destroy)
- Anthropic/Gemini API calls for LLM generation
- Kling AI API for video generation

**Incoming:**
- None - Server-sent events (SSE) pushed to client, no inbound webhooks

## Additional Integrations

**Shadcn/ui:**
- Component library with `base-nova` style
- Config in `components.json`
- UI components in `components/ui/`

**Tailwind CSS:**
- v4 with PostCSS plugin
- Custom design tokens from generated design system

---

*Integration audit: 2026-04-09*
