# Requirements: SiteForge v2

**Defined:** 2026-04-09
**Core Value:** Users can generate fully functional websites from text prompts without writing code.

## v1 Requirements (Already Implemented)

### Core Generation (v1 MVP - COMPLETE)

- [x] **GEN-01**: User can enter a natural language prompt describing a website
- [x] **GEN-02**: AI generates React/Next.js components from the prompt
- [x] **GEN-03**: SSE streaming for real-time progress updates
- [x] **GEN-04**: Generated site preview in iframe
- [x] **GEN-05**: Chat-based iteration on generated sites
- [x] **GEN-06**: Multi-agent pipeline (Architect → Designer → Developer → Fixer → Iterator)
- [x] **GEN-07**: E2B sandbox for live previews
- [x] **GEN-08**: File streaming to client as generated
- [x] **GEN-09**: Project persistence with versioning

### Sandbox (v1 - COMPLETE)

- [x] **SAN-01**: Create E2B sandbox per generation session
- [x] **SAN-02**: Write generated files to sandbox
- [x] **SAN-03**: Run build in sandbox
- [x] **SAN-04**: Start dev server and return preview URL

---

## v2 Requirements (New/Enhanced)

### Phase 1: MVP Enhancements

- [ ] **P1B-01**: Parse each .tsx file's AST and verify all imports resolve
- [ ] **P1B-02**: Detect Client Components using hooks, add "use client" if missing
- [ ] **P1B-03**: Scan generated code, add missing package.json dependencies
- [ ] **P1B-04**: Build error retry (parse errors → Developer Agent → retry, max 3x)
- [ ] **P1B-05**: Structured logging (model, tokens, latency per agent call)
- [ ] **P1B-06**: Multi-provider fallback (Claude → Gemini automatic)
- [ ] **P1B-07**: Circuit breaker (after 3 failures, route to fallback for 5 min)
- [ ] **P1B-08**: Ambiguous prompt detection, ask 1-3 clarifying questions before generation
- [ ] **P1B-09**: Sandbox auto-destroy after 15 minutes of inactivity

### Phase 2: Self-Healing + Iteration

- [ ] **P2-01**: Stream-time import corrections during Developer Agent output
- [ ] **P2-02**: Icon hallucination correction (lookup table of valid lucide-react names)
- [ ] **P2-03**: Model-driven fixes (send unresolvable errors to Haiku, max 3 retries)
- [ ] **P2-04**: Improved chat iteration (targeted file edits, not full regeneration)
- [ ] **P2-05**: Hot-patch without rebuild (<3s to preview update)
- [ ] **P2-06**: Version persistence (every generation creates snapshot)
- [ ] **P2-07**: One-click rollback to any version
- [ ] **P2-08**: Fix telemetry logging for feedback loop analysis

### Phase 3: Plan Mode + Project Management

- [ ] **P3-01**: Plan Mode (blueprint without code generation)
- [ ] **P3-02**: Blueprint rendered as editable structured form
- [ ] **P3-03**: User can edit blueprint fields before approval
- [ ] **P3-04**: Pipeline executes strictly against approved plan
- [ ] **P3-05**: Project dashboard with list view, thumbnails, status
- [ ] **P3-06**: Project duplication
- [ ] **P3-07**: Diff view between versions
- [ ] **P3-08**: Code Mode with Monaco editor (lazy-loaded)
- [ ] **P3-09**: Visual Mode (click preview → reveal source component)
- [ ] **P3-10**: User authentication via Clerk
- [ ] **P3-11**: Projects associated with authenticated users
- [ ] **P3-12**: Per-user rate limiting

### Phase 4: Full-Stack + Deploy

- [ ] **P4-01**: Full-stack mode (React + Next.js + Express/FastAPI + PostgreSQL)
- [ ] **P4-02**: Database schema generation (Prisma)
- [ ] **P4-03**: API route generation
- [ ] **P4-04**: GitHub sync with per-version commits
- [ ] **P4-05**: Deploy to Vercel/Railway/custom
- [ ] **P4-06**: Custom domain support

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| v1 (Complete) | 13 | Done |
| v2 Phase 1 | 9 | Pending |
| v2 Phase 2 | 8 | Pending |
| v2 Phase 3 | 12 | Pending |
| v2 Phase 4 | 6 | Pending |

**Total: 48 requirements | 13 done (v1 MVP)**

---

*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09*
