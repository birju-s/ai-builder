# SiteForge v2

## What This Is

AI-native development platform that generates, previews, iterates, and manages production-grade websites and full-stack applications through natural language. Combines patterns from v0 (self-healing pipeline), Emergent (5-agent coordination), and Lovable (plan/execute modes).

## Core Value

Users can generate fully functional websites from text prompts without writing code, with >95% reliability and <30s time to preview.

## Requirements

### Validated

(None yet — v2 is a rebuild)

### Active

- [ ] Implement 5-agent pipeline (Architect, Designer, Developer, Validator, PM)
- [ ] Support Website mode (React + Next.js + Tailwind + shadcn/ui)
- [ ] Support Full-Stack mode (adds Express/FastAPI + PostgreSQL)
- [ ] Implement Plan Mode for blueprint review before generation
- [ ] Implement self-healing pipeline with 3 validation layers
- [ ] Multi-provider LLM with Claude + Gemini fallback
- [ ] E2B sandbox for live previews
- [ ] SSE streaming for real-time progress
- [ ] Project versioning with rollback
- [ ] Chat-based iteration on generated sites
- [ ] User authentication (Clerk)
- [ ] Rate limiting on API routes

### Out of Scope

- Mobile app — web-first approach
- Custom template marketplace — future phase
- Real-time collaborative editing — future phase

## Context

**Build from specs at** `C:\Users\birju\.factory\specs\`:
- `2026-04-08-siteforge-v2-product-requirements-document.md` — Main PRD
- `2026-04-08-siteforge-v2-enhanced-prd-with-fr-nfr-architect-review.md` — Detailed FR/NFR with architect comments
- `2026-04-08-siteforge-v2-parallel-execution-strategies-customer-experience-architecture.md` — Performance optimization (10 strategies)
- `2026-04-08-siteforge-v2-contextually-aware-image-pipeline-nanobanana-kling.md` — Image generation pipeline

**Key v2 decisions from specs**:
- Reliability > Quality > Speed priority order
- Split Phase 1 into 1a (MVP) and 1b (full pipeline)
- Parallel file generation with dependency DAG is mandatory
- Use deterministic files (package.json, tailwind.config, etc.) to save LLM calls
- Sandbox pre-warming at T=0
- Two-phase generation: skeleton at T=15s, full quality at T=30s

## Constraints

- **Target Speed**: <30s for websites, <90s for full-stack
- **Target Reliability**: >95% working previews
- **Tech Stack**: Next.js 16, React 19, Tailwind v4, shadcn/ui
- **LLM Providers**: Claude Sonnet (primary), Gemini (fallback)
- **Sandbox**: E2B with pre-built template

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| YOLO mode | Faster execution | — Pending |
| Fine granularity | More focused phases (8-12) | — Pending |
| Parallel execution | Required to meet 30s target | — Pending |
| Reliability > Quality > Speed | Broken preview is worse than slow | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after spec review*
