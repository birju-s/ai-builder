# SiteForge v2

## What This Is

AI-native development platform that generates, previews, iterates, and manages production-grade websites and full-stack applications through natural language. Combines patterns from v0 (self-healing pipeline), Emergent (5-agent coordination), and Lovable (plan/execute modes).

**Current state:** v1 code exists with MVP pipeline. v2 builds on top with enhancements.

## Core Value

Users can generate fully functional websites from text prompts without writing code, with >95% reliability and <30s time to preview.

## Requirements

### Validated (from existing v1 code)

- ✓ **GEN-01**: User can enter a natural language prompt describing a website
- ✓ **GEN-02**: AI generates React/Next.js components from the prompt
- ✓ **GEN-03**: SSE streaming for real-time progress updates
- ✓ **GEN-04**: Generated site preview in iframe
- ✓ **GEN-05**: Chat-based iteration on generated sites
- ✓ **Pipeline**: Multi-agent pipeline (Architect → Designer → Developer → Fixer → Iterator)
- ✓ **Sandbox**: E2B sandbox for live previews
- ✓ **Streaming**: Files stream to client as generated
- ✓ **Project persistence**: JSON file storage with versioning

### Active (v2 enhancements needed)

- [ ] **P1B-01**: AST-based validation (imports, use client, dependencies)
- [ ] **P1B-06**: Multi-provider fallback (Claude → Gemini) - partially done
- [ ] **P1B-07**: Circuit breaker for provider outages
- [ ] **P1B-08**: Ambiguous prompt detection with clarifying questions
- [ ] **P1B-09**: Sandbox auto-destroy after 15 min inactivity
- [ ] **P2-07**: Stream-time import corrections
- [ ] **P2-08**: Icon hallucination correction
- [ ] **P3-10**: User authentication via Clerk
- [ ] **P3-12**: Rate limiting per user
- [ ] **P4-01**: Full-stack mode (Express/FastAPI + PostgreSQL)

### Out of Scope

- Mobile app — web-first approach
- Custom template marketplace — future phase

## Context

**Existing codebase state (v1):**
- Next.js 16.2 + React 19 + TypeScript 5
- 5-agent pipeline implemented
- E2B sandbox integration working
- Project versioning exists
- SSE streaming working

**Build from specs at** `C:\Users\birju\.factory\specs\`:
- PRD, Enhanced PRD with FR/NFR, Parallel Execution, Image Pipeline

## Constraints

- **Target Speed**: <30s for websites, <90s for full-stack
- **Target Reliability**: >95% working previews
- **Tech Stack**: Next.js 16, React 19, Tailwind v4, shadcn/ui
- **LLM Providers**: Claude Sonnet (primary), Gemini (fallback)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| YOLO mode | Faster execution | — Pending |
| Fine granularity | More focused phases | — Pending |
| Parallel execution | Required for <30s target | Implemented in v1 |
| Reliability > Quality > Speed | Broken preview is worse than slow | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-09 after correction - v1 code already has MVP*
