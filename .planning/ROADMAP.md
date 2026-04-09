# Roadmap: SiteForge v2

**Created:** 2026-04-09
**Granularity:** Fine (based on PRD)
**Mode:** YOLO

## Phase Overview

| # | Phase | Goal | Focus |
|---|-------|------|-------|
| 1a | MVP Pipeline | User enters prompt, gets working preview in <30s | Core generation |
| 1b | Full Pipeline | Complete 5-agent pipeline with validation | Pipeline completion |
| 2 | Self-Healing + Iteration | Reliable builds, chat-based iteration | Quality & iteration |
| 3 | Plan Mode + Project Management | Blueprint review, projects dashboard, auth | UX & management |
| 4 | Full-Stack + Deploy | Backend generation, deployment | Advanced features |

**Total: 5 phases | 52 requirements | ~90s max for full-stack**

---

## Phase 1a: MVP Pipeline (Weeks 1-2)

**Goal:** Minimal Viable Pipeline. Type a prompt, see a working React site in an iframe.

**Requirements:**
- P1A-01 to P1A-15 (all MVP requirements)

**Success Criteria:**
1. User submits prompt → blueprint generated within 8s
2. Blueprint shows page count, section types
3. Design system shows color swatches + fonts (within 4s more)
4. Code generates in parallel batches (not sequential)
5. Files stream to client as generated
6. E2B sandbox created in parallel with planning (pre-warmed)
7. Preview appears in <30s for simple prompts
8. Build passes, preview is interactive

**Key Architecture:**
- Developer Agent only (skip Architect + Designer for MVP -- use sample blueprint)
- Single LLM provider (Sonnet only, no fallback yet)
- Deterministic files: package.json, tailwind.config, globals.css generated without LLM
- Parallel file generation with dependency DAG
- Pre-built E2B template

**NFR Targets:**
- Time to first file: <8s
- Time to preview: <30s
- Reliability: >80%

**UI hint:** yes

---

## Phase 1b: Full Pipeline (Weeks 3-4)

**Goal:** Complete 5-agent pipeline with validation layers.

**Requirements:**
- P1B-01 to P1B-09 (full pipeline + validation + fallback)

**Success Criteria:**
1. Full 5-agent pipeline executes in order
2. Architect Agent analyzes prompt, asks clarifying questions if needed
3. Designer Agent generates complete design system
4. Validator Agent checks each file (AST autofixers)
5. Build errors auto-fixed, up to 3 retries
6. Multi-provider fallback works (Claude → Gemini)
7. Circuit breaker protects against provider outages
8. Structured logging for observability

**NFR Targets:**
- Time to preview: <30s
- Reliability: >90%
- Self-healing: >70% build errors auto-fixed

---

## Phase 2: Self-Healing + Iteration (Weeks 5-6)

**Goal:** Reliable generation + chat-based iteration.

**Requirements:**
- P2-01 to P2-10

**Success Criteria:**
1. Stream correction layer fixes imports during generation
2. Icon hallucination correction via lookup table
3. Model-driven fixes for unresolvable errors (Haiku, max 3 retries)
4. Chat iteration: "Make the hero section taller" → targeted file edit
5. Hot-patch sandbox: changes reflect without rebuild
6. Version history: every generation creates new version
7. One-click rollback to previous version
8. All fixes logged for telemetry feedback loop

**NFR Targets:**
- Hot-patch iteration: <3s
- Auto-fix success rate: >70%
- Version rollback: instant

---

## Phase 3: Plan Mode + Project Management (Weeks 7-9)

**Goal:** Blueprint review, project dashboard, user accounts.

**Requirements:**
- P3-01 to P3-12

**Success Criteria:**
1. Plan Mode: blueprint rendered as editable form
2. User edits blueprint fields, approves
3. Pipeline executes strictly against approved plan
4. Project dashboard shows list, thumbnails, status
5. Diff view between versions
6. Code Mode: Monaco editor (lazy-loaded)
7. Visual Mode: click preview → reveal source
8. User auth via Clerk
9. Rate limiting enforced per user

**UI hint:** yes

---

## Phase 4: Full-Stack + Deploy (Weeks 10-12)

**Goal:** Backend generation + deployment.

**Requirements:**
- P4-01 to P4-06

**Success Criteria:**
1. Full-Stack mode: generates Express/FastAPI + PostgreSQL backend
2. Prisma schema generated from data models
3. API routes generated
4. GitHub sync with commits
5. Deploy to Vercel/Railway
6. Custom domain support

**NFR Targets:**
- Time to full-stack preview: <90s

---

## Requirements Traceability

| Requirement | Phase |
|-------------|-------|
| P1A-01 | Phase 1a |
| P1A-02 | Phase 1a |
| P1A-03 | Phase 1a |
| P1A-04 | Phase 1a |
| P1A-05 | Phase 1a |
| P1A-06 | Phase 1a |
| P1A-07 | Phase 1a |
| P1A-08 | Phase 1a |
| P1A-09 | Phase 1a |
| P1A-10 | Phase 1a |
| P1A-11 | Phase 1a |
| P1A-12 | Phase 1a |
| P1A-13 | Phase 1a |
| P1A-14 | Phase 1a |
| P1A-15 | Phase 1a |
| P1B-01 | Phase 1b |
| P1B-02 | Phase 1b |
| P1B-03 | Phase 1b |
| P1B-04 | Phase 1b |
| P1B-05 | Phase 1b |
| P1B-06 | Phase 1b |
| P1B-07 | Phase 1b |
| P1B-08 | Phase 1b |
| P1B-09 | Phase 1b |
| P2-01 | Phase 2 |
| P2-02 | Phase 2 |
| P2-03 | Phase 2 |
| P2-04 | Phase 2 |
| P2-05 | Phase 2 |
| P2-06 | Phase 2 |
| P2-07 | Phase 2 |
| P2-08 | Phase 2 |
| P2-09 | Phase 2 |
| P2-10 | Phase 2 |
| P3-01 | Phase 3 |
| P3-02 | Phase 3 |
| P3-03 | Phase 3 |
| P3-04 | Phase 3 |
| P3-05 | Phase 3 |
| P3-06 | Phase 3 |
| P3-07 | Phase 3 |
| P3-08 | Phase 3 |
| P3-09 | Phase 3 |
| P3-10 | Phase 3 |
| P3-11 | Phase 3 |
| P3-12 | Phase 3 |
| P4-01 | Phase 4 |
| P4-02 | Phase 4 |
| P4-03 | Phase 4 |
| P4-04 | Phase 4 |
| P4-05 | Phase 4 |
| P4-06 | Phase 4 |

**Coverage:** 52/52 requirements mapped ✓

---

## Key NFR Targets Summary

| Metric | Target | Phase |
|--------|--------|-------|
| Website preview time | <30s | 1a |
| Full-stack preview time | <90s | 4 |
| Reliability (working preview) | >90% → >95% | 1b → 2 |
| Hot-patch iteration | <3s | 2 |
| LLM cost per website | <$0.60 | 1b |
| Sandbox cost per session | <$0.025 | 1a |

---

*Roadmap created: 2026-04-09*
*Based on specs: C:\Users\birju\.factory\specs\**
