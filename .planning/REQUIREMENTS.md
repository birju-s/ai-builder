# Requirements: SiteForge v2

**Defined:** 2026-04-09
**Core Value:** Users can generate fully functional websites from text prompts without writing code, with >95% reliability and <30s time to preview.

## v1 Requirements

### Phase 1a: MVP Pipeline

- [ ] **P1A-01**: User can enter a natural language prompt describing a website
- [ ] **P1A-02**: System generates blueprint (pages, sections, component tree) from prompt
- [ ] **P1A-03**: System generates design system (colors, typography, component styles) from blueprint
- [ ] **P1A-04**: System generates React/Next.js component files from blueprint + design system
- [ ] **P1A-05**: System uses shadcn/ui as component foundation for all generated code
- [ ] **P1A-06**: System generates files following Next.js App Router conventions
- [ ] **P1A-07**: System streams each generated file to client via SSE as it completes
- [ ] **P1A-08**: System supports Website mode (frontend-only, React + Next.js)
- [ ] **P1A-09**: System creates E2B sandbox per generation session
- [ ] **P1A-10**: System writes generated files to sandbox via E2B SDK
- [ ] **P1A-11**: System runs build in sandbox and captures output
- [ ] **P1A-12**: System starts dev server in sandbox and returns preview URL
- [ ] **P1A-13**: System displays preview in iframe in client UI
- [ ] **P1A-14**: System supports multiple LLM providers (Claude, Gemini)
- [ ] **P1A-15**: System uses pre-built E2B template with Node.js + pnpm + Next.js pre-installed

### Phase 1b: Full Pipeline

- [ ] **P1B-01**: System parses each .tsx file's AST and verifies all imports resolve
- [ ] **P1B-02**: System detects Client Components using hooks and adds "use client" if missing
- [ ] **P1B-03**: System scans generated code and adds missing package.json dependencies
- [ ] **P1B-04**: If sandbox build fails, system parses errors, sends to Developer Agent, retries (max 3x)
- [ ] **P1B-05**: System logs all provider switches, token usage, latency per agent call
- [ ] **P1B-06**: System automatically falls back to secondary provider when primary hits rate limit
- [ ] **P1B-07**: System implements circuit breaker (after 3 failures, route to fallback for 5 min)
- [ ] **P1B-08**: System detects ambiguous prompts and asks 1-3 clarifying questions before generation
- [ ] **P1B-09**: System auto-destroys sandboxes after 15 minutes of inactivity

### Phase 2: Self-Healing + Iteration

- [ ] **P2-01**: System accepts chat-based iteration messages referencing specific components
- [ ] **P2-02**: System generates targeted file edits (not full regeneration) for iteration requests
- [ ] **P2-03**: System applies Validator checks to iterated files before patching sandbox
- [ ] **P2-04**: System auto-reloads preview after any iteration change
- [ ] **P2-05**: System persists every generation as versioned snapshot
- [ ] **P2-06**: System supports one-click rollback to any previous version
- [ ] **P2-07**: System applies stream-time import corrections during Developer Agent output
- [ ] **P2-08**: System maintains lookup table of valid lucide-react icon names, corrects hallucinated names
- [ ] **P2-09**: System sends unresolvable errors to fast model for targeted fixes (max 3 retries)
- [ ] **P2-10**: System logs every fix applied for telemetry

### Phase 3: Plan Mode + Project Management

- [ ] **P3-01**: System supports Plan Mode where Architect generates blueprint without producing code
- [ ] **P3-02**: System renders blueprint as editable structured form in UI
- [ ] **P3-03**: User can edit blueprint fields (pages, sections, colors, integrations) before approval
- [ ] **P3-04**: On approval, pipeline executes strictly against the approved blueprint
- [ ] **P3-05**: System displays project dashboard with list view, thumbnails, status
- [ ] **P3-06**: System supports project duplication
- [ ] **P3-07**: System provides diff view between any two versions
- [ ] **P3-08**: System supports Code Mode with in-browser code editor (lazy-loaded Monaco)
- [ ] **P3-09**: System supports Visual Mode (click preview element, reveal source component)
- [ ] **P3-10**: System authenticates users via Clerk
- [ ] **P3-11**: System associates projects with authenticated users
- [ ] **P3-12**: System enforces per-user rate limits

### Phase 4: Full-Stack + Deploy

- [ ] **P4-01**: System supports Full-Stack mode (frontend + Express/FastAPI backend + PostgreSQL)
- [ ] **P4-02**: System generates database schema (Prisma)
- [ ] **P4-03**: System generates API routes
- [ ] **P4-04**: System supports optional GitHub sync with per-version commit messages
- [ ] **P4-05**: System supports deployment to Vercel/Railway/custom hosting
- [ ] **P4-06**: System supports custom domain

## v2 Requirements

### Image Pipeline

- **IMG-01**: System generates contextual image prompts from Designer Agent
- [ ] **IMG-02**: System generates style reference image first for visual consistency
- [ ] **IMG-03**: System generates images in parallel with code generation
- [ ] **IMG-04**: System uses Nanobanana for static images
- [ ] **IMG-05**: System uses Kling for image-to-video hero backgrounds

### Advanced Features

- [ ] **ADV-01**: System supports user-uploaded brand images as reference
- [ ] **ADV-02**: System supports Kling subject consistency for team page

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first approach, mobile later |
| Real-time collaborative editing | High complexity, defer to future |
| Custom template marketplace | Separate phase |
| Self-hosting | Cloud-only initially |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| P1A-01 to P1A-15 | Phase 1a | Pending |
| P1B-01 to P1B-09 | Phase 1b | Pending |
| P2-01 to P2-10 | Phase 2 | Pending |
| P3-01 to P3-12 | Phase 3 | Pending |
| P4-01 to P4-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after spec review*
