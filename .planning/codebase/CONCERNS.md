# Codebase Concerns

**Analysis Date:** 2026-04-09

## Tech Debt

**LLM Output Parsing Fragility:**
- Issue: JSON parsing from LLM responses assumes well-formed output. When LLMs add markdown fences, prepend prose, or output invalid JSON, parsing fails and falls back to single-prompt mode.
- Files: `lib/agents/architect.ts`, `lib/agents/designer.ts`, `lib/agents/developer.ts`, `lib/agents/iterator.ts`, `lib/templates/blueprint.ts`
- Impact: Unpredictable behavior; users may get generic blueprints instead of domain-specific ones
- Fix approach: Add robust JSON extraction with multiple fallback strategies (regex extraction, partial parsing, retry with cleaner prompts)

**Dual Next.js Apps (Duplicate Code):**
- Issue: Project has both `app/` (main app) and `siteforge-core/` (separate Next.js app with similar functionality). This creates maintenance burden and potential feature drift.
- Files: `app/`, `siteforge-core/`
- Impact: Code duplication, inconsistent implementations of similar features (palette-agent vs design-spec-agent)
- Fix approach: Consolidate into single codebase, extract shared logic into `lib/`

**Silent API Failures:**
- Issue: Many functions return `null` on failure rather than throwing errors, making debugging difficult.
- Files: `lib/services/image-pipeline.ts` (lines 112, 144, 155, 181), `lib/services/kling-video.ts` (lines 44, 71, 78, 101, 119, 127, 133), `lib/store/project-store.ts` (lines 18, 78, 105, 108)
- Impact: Errors are swallowed, users see no indication something failed
- Fix approach: Implement consistent error handling with logging and user-visible error states

**Project Store File-Based Persistence:**
- Issue: Projects stored as JSON files in local filesystem (`data/projects/`). No transactional writes, no concurrent access handling, no backup strategy.
- Files: `lib/store/project-store.ts`
- Impact: Data loss risk, corruption on crash during write, no horizontal scaling
- Fix approach: Migrate to proper database (PostgreSQL, SQLite) with migrations

**Hardcoded Model Names:**
- Issue: LLM model names hardcoded in prompts and code. Switching models requires code changes.
- Files: `lib/agents/designer.ts`, `lib/agents/developer.ts`, `siteforge-core/lib/agents/palette-agent.ts` (uses `claude-haiku-4-5`)
- Impact: Inflexibility, potential cost/quality changes
- Fix approach: Move model selection to configuration

## Known Bugs

**SSE Stream Malformed Events:**
- Symptoms: Event parsing in `app/page.tsx` silently skips malformed events without logging
- Files: `app/page.tsx` (line 110-112)
- Trigger: LLM output includes control characters, or network interruption mid-stream
- Workaround: None visible to user

**Blueprint Color Validation Missing:**
- Symptoms: BlueprintEditor accepts any text in color inputs without validating hex format
- Files: `components/blueprint-editor.tsx` (lines 150-158)
- Trigger: User enters invalid color like "purple" instead of "#hex"
- Workaround: LLM generation tends to produce valid colors

**Add Version Fails Silently:**
- Symptoms: `addVersion()` call in iterate route has `.catch(() => {})` which swallows all errors
- Files: `app/api/iterate/route.ts` (line 73)
- Trigger: Any database/storage failure during version save
- Workaround: Version not saved, user can still preview but may lose changes

## Security Considerations

**No Authentication on API Routes:**
- Risk: Anyone can create projects, iterate, and delete without authorization
- Files: `app/api/*/route.ts`
- Current mitigation: None
- Recommendations: Add authentication middleware (NextAuth, Clerk, etc.)

**No Rate Limiting:**
- Risk: Resource exhaustion via rapid API calls; costs from repeated LLM invocations
- Files: All `app/api/*/route.ts`
- Current mitigation: Next.js default timeouts (`maxDuration = 300`)
- Recommendations: Add rate limiting middleware (Vercel KV, Upstash)

**Sandbox Code Execution:**
- Risk: Generated code runs in E2B sandbox but could potentially: exfiltrate E2B_API_KEY, make outbound requests, consume excessive resources
- Files: `lib/sandbox/service.ts`, `app/api/iterate/route.ts`
- Current mitigation: E2B sandbox isolation
- Recommendations: Add sandbox timeout limits, network egress restrictions, content security policies

**File Path Traversal in Sandbox Write:**
- Risk: Malicious prompts could potentially influence file paths written to sandbox
- Files: `lib/sandbox/service.ts`
- Current mitigation: File paths generated programmatically, not from user input
- Recommendations: Validate all paths are within sandbox workspace

## Performance Bottlenecks

**Kling Video Polling:**
- Problem: 10-second polling interval until video completes (up to 5 minutes)
- Files: `lib/services/kling-video.ts` (lines 85-123)
- Cause: Synchronous polling blocks nothing directly but wastes compute on idle checks
- Improvement path: Use webhooks if available, or reduce poll frequency

**Large File Context to LLM:**
- Problem: `runIterator()` sends all `.tsx` files in context, could exceed token limits for large projects
- Files: `lib/agents/iterator.ts` (lines 53-68)
- Cause: No file size/token budget management
- Improvement path: Implement chunking or summarize older files

**Sequential Agent Calls in Blueprint Generation:**
- Problem: `generateBlueprint()` calls `runArchitect()` then `runDesigner()` sequentially
- Files: `lib/templates/blueprint.ts` (lines 54-60)
- Cause: Design depends on structure output
- Improvement path: Parallel generation with validation merge

## Fragile Areas

**JSON Parsing Utilities:**
- Files: `lib/agents/architect.ts`, `lib/agents/designer.ts`, `lib/agents/developer.ts`, `lib/agents/iterator.ts`
- Why fragile: Multiple regex-based cleanup patterns (`cleanCodeOutput`, fence stripping) that could fail on unexpected LLM output formats
- Safe modification: Add comprehensive test cases for malformed outputs before changing
- Test coverage: None detected

**Build Error Parser:**
- Files: `lib/agents/fixer.ts` (lines 25-61)
- Why fragile: Regex-based error parsing that depends on Next.js error format consistency
- Safe modification: Any changes require testing against actual Next.js build outputs
- Test coverage: None detected

**SSE Event Type Safety:**
- Files: `types/pipeline.ts`, `app/page.tsx`
- Why fragile: Type union used but runtime JSON parsing bypasses type checking
- Safe modification: Add runtime validation (Zod) for incoming SSE events
- Test coverage: None detected

## Scaling Limits

**File-Based Storage:**
- Current capacity: Hundreds of projects before filesystem overhead
- Limit: Single disk, no sharding, concurrent write conflicts
- Scaling path: Migrate to PostgreSQL or similar

**Sandbox Instances:**
- Current capacity: Limited by E2B account limits and concurrent instance limits
- Limit: E2B pricing tiers cap concurrent sandboxes
- Scaling path: Implement sandbox pooling/reuse, cold-start optimization

**LLM Token Budget:**
- Current capacity: No tracking; could exceed API quotas
- Limit: Provider rate limits and costs
- Scaling path: Add token budgeting, caching, fallback chains

## Dependencies at Risk

**`@anthropic-ai/sdk` v0.80.0:**
- Risk: Using older version, newer versions may have breaking changes
- Impact: Blueprint generation may break on SDK update
- Migration plan: Pin version, test updates thoroughly

**`ai` package v6.0.116:**
- Risk: SDK for AI integration; version 6 is relatively new
- Impact: LLM provider integration could break
- Migration plan: Review changelog before updating

**`e2b` v2.19.0:**
- Risk: Sandbox SDK; API stability varies
- Impact: Sandbox creation/connection could break
- Migration plan: Maintain compatibility tests with E2B API

**`zod` v4.3.6:**
- Risk: Version 4 is major version bump from v3
- Impact: Schema validation behavior differences
- Migration plan: Check v4 migration guide; this appears to be in use by SDK dependencies

## Missing Critical Features

**Test Suite:**
- Problem: No unit or integration tests detected
- Blocks: Safe refactoring, confidence in changes, regression detection
- Priority: HIGH

**Error Recovery/Retry Logic:**
- Problem: LLM calls fail without retry; network blips cause pipeline failures
- Blocks: Reliable production usage
- Priority: HIGH

**Project Version Diff/Restore:**
- Problem: `rollbackToVersion()` updates current version pointer but doesn't restore files
- Files: `lib/store/project-store.ts` (lines 100-116)
- Blocks: True version control functionality
- Priority: MEDIUM

## Test Coverage Gaps

**LLM Response Parsing:**
- What's not tested: JSON extraction from various LLM output formats (with/without fences, with prose, with invalid JSON)
- Files: `lib/agents/*.ts`
- Risk: Parser failures silently fall back, user sees degraded output
- Priority: HIGH

**SSE Event Handling:**
- What's not tested: Stream interruption, malformed events, reconnection
- Files: `app/page.tsx`, `components/chat-panel.tsx`
- Risk: UI state desync, frozen progress indicators
- Priority: MEDIUM

**Blueprint Validation:**
- What's not tested: Invalid blueprints (missing sections, bad colors, wrong types)
- Files: `lib/templates/blueprint.ts`
- Risk: Invalid blueprints cause downstream build failures
- Priority: MEDIUM

**Sandbox Operations:**
- What's not tested: Sandbox creation, file write, command execution, process management
- Files: `lib/sandbox/service.ts`
- Risk: Silent failures leave users with broken previews
- Priority: HIGH

---

*Concerns audit: 2026-04-09*
