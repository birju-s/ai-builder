# Roadmap: SiteForge v2

**Created:** 2026-04-09
**Based on:** v1 existing code + v2 specs from C:\Users\birju\.factory\specs\
**Granularity:** Fine

## Phase Overview

| # | Phase | Goal | Status |
|---|-------|------|--------|
| 1 | MVP Enhancements | Improve v1 MVP with validation, fallback, error handling | In Progress |
| 2 | Self-Healing + Iteration | Reliable builds, better iteration, stream correction | Pending |
| 3 | Plan Mode + Project Management | Blueprint review, dashboard, auth | Pending |
| 4 | Full-Stack + Deploy | Backend generation, deployment | Pending |

**Total: 4 phases | v2 enhancements on top of existing v1**

---

## Phase 1: MVP Enhancements (v1 → v2)

**Goal:** Enhance existing v1 MVP with validation layers, provider fallback, and robustness.

**Already exists (v1):**
- User prompt input → blueprint generation
- Design system generation
- Component file generation (Developer Agent)
- E2B sandbox integration
- SSE streaming
- File streaming to client
- Build in sandbox → preview URL
- Hot-patch iteration

**New in Phase 1:**
- **P1B-01**: AST-based validation (imports resolve, use client, dependencies)
- **P1B-02**: Client Component detection
- **P1B-03**: Missing package.json dependency scanning
- **P1B-04**: Build error retry loop (max 3x)
- **P1B-05**: Structured logging (provider, tokens, latency)
- **P1B-06**: Multi-provider fallback (Claude → Gemini)
- **P1B-07**: Circuit breaker after 3 failures
- **P1B-08**: Ambiguous prompt detection (ask clarifying questions)
- **P1B-09**: Sandbox auto-cleanup after inactivity

**Success Criteria:**
1. All imports verified via AST parsing
2. "use client" added where needed
3. Build errors auto-fixed, up to 3 retries
4. Fallback to Gemini when Claude rate-limited
5. Circuit breaker prevents cascade failures

**NFR Targets:**
- Reliability: >90% (improved from v1 baseline)
- Time to preview: <30s

---

## Phase 2: Self-Healing + Iteration

**Goal:** Full self-healing pipeline with stream correction and improved iteration.

**Requirements:**
- **P2-01**: Stream-time import corrections (during generation)
- **P2-02**: Icon hallucination correction via lookup table
- **P2-03**: Model-driven fixes (Haiku, max 3 retries)
- **P2-04**: Chat iteration with targeted file edits
- **P2-05**: Hot-patch without rebuild
- **P2-06**: Version persistence
- **P2-07**: One-click rollback
- **P2-08**: Fix telemetry for feedback loop

**Success Criteria:**
1. Stream corrections apply during generation, not after
2. Icon names corrected automatically
3. Iteration: "Make hero taller" → targeted edit only
4. Preview updates in <3s after iteration
5. Every generation creates versioned snapshot

---

## Phase 3: Plan Mode + Project Management

**Goal:** Blueprint review, project dashboard, user accounts.

**Requirements:**
- **P3-01**: Plan Mode (blueprint without code)
- **P3-02**: Blueprint as editable structured form
- **P3-03**: User edits blueprint before approval
- **P3-04**: Strict execution against approved plan
- **P3-05**: Project dashboard with thumbnails
- **P3-06**: Project duplication
- **P3-07**: Diff view between versions
- **P3-08**: Code Mode (Monaco editor)
- **P3-09**: Visual Mode (click preview → reveal source)
- **P3-10**: Clerk authentication
- **P3-11**: Per-user project association
- **P3-12**: Rate limiting

---

## Phase 4: Full-Stack + Deploy

**Goal:** Backend generation and deployment.

**Requirements:**
- **P4-01**: Full-stack mode (Express/FastAPI + PostgreSQL)
- **P4-02**: Prisma schema generation
- **P4-03**: API route generation
- **P4-04**: GitHub sync
- **P4-05**: Deploy to Vercel/Railway
- **P4-06**: Custom domain support

**NFR Targets:**
- Full-stack preview: <90s

---

## Requirements Traceability

| ID | Description | Phase | Status |
|----|-------------|-------|--------|
| P1B-01 | AST-based validation | 1 | Enhancement |
| P1B-02 | Client Component detection | 1 | Enhancement |
| P1B-03 | Missing deps scanning | 1 | Enhancement |
| P1B-04 | Build error retry | 1 | Enhancement |
| P1B-05 | Structured logging | 1 | Enhancement |
| P1B-06 | Multi-provider fallback | 1 | Partial |
| P1B-07 | Circuit breaker | 1 | New |
| P1B-08 | Ambiguous prompt handling | 1 | New |
| P1B-09 | Sandbox auto-cleanup | 1 | New |
| P2-01 | Stream-time corrections | 2 | New |
| P2-02 | Icon hallucination fix | 2 | New |
| P2-03 | Model-driven fixes | 2 | New |
| P2-04 | Chat iteration | 2 | Existing (improve) |
| P2-05 | Hot-patch | 2 | Existing |
| P2-06 | Version persistence | 2 | Existing |
| P2-07 | Rollback | 2 | Existing |
| P3-01 | Plan Mode | 3 | New |
| P3-02 | Blueprint editor | 3 | New |
| P3-03 | Blueprint approval | 3 | New |
| P3-04 | Strict execution | 3 | New |
| P3-05 | Project dashboard | 3 | New |
| P3-06 | Project duplication | 3 | New |
| P3-07 | Diff view | 3 | New |
| P3-08 | Code Mode | 3 | New |
| P3-09 | Visual Mode | 3 | New |
| P3-10 | Clerk auth | 3 | New |
| P3-11 | User association | 3 | New |
| P3-12 | Rate limiting | 3 | New |
| P4-01 | Full-stack mode | 4 | New |
| P4-02 | Schema generation | 4 | New |
| P4-03 | API route gen | 4 | New |
| P4-04 | GitHub sync | 4 | New |
| P4-05 | Deploy | 4 | New |
| P4-06 | Custom domain | 4 | New |

---

*Roadmap updated: 2026-04-09*
*Note: v1 code already has core MVP pipeline. v2 adds enhancements.*
