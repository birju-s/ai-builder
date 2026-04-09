# SiteForge

## What This Is

AI-powered site generation platform that uses a multi-agent pipeline to generate Next.js websites from natural language prompts. Users describe what they want, and AI agents (Architect → Designer → Developer → Fixer) build and preview the site in real-time.

## Core Value

Users can generate fully functional websites from text prompts without writing code.

## Requirements

### Validated

- ✓ AI site generation from prompts — existing
- ✓ Multi-agent pipeline (Architect, Designer, Developer, Fixer) — existing
- ✓ SSE streaming for real-time progress — existing
- ✓ Self-healing builds with automatic error correction — existing
- ✓ E2B sandbox for live previews — existing
- ✓ Project persistence (JSON file storage) — existing
- ✓ Blueprint/plan generation — existing

### Active

- [ ] Add user authentication to the platform
- [ ] Improve error handling and user feedback
- [ ] Add comprehensive test suite (HIGH priority)
- [ ] Implement proper database storage
- [ ] Rate limiting on API routes

### Out of Scope

- Mobile app — web-first approach
- Real-time collaborative editing — future phase
- Custom template marketplace — future phase

## Context

**Existing codebase state:**
- Next.js 16.2 + React 19 + TypeScript 5
- Tailwind CSS v4 + shadcn/ui
- Multi-agent LLM pipeline (Anthropic Claude primary, Gemini fallback)
- E2B sandbox for code execution
- File-based project storage

**Technical debt identified:**
- No test suite (HIGH priority)
- LLM JSON parsing is fragile
- Silent API failures
- No authentication on API routes
- Dual Next.js apps (code duplication)

## Constraints

- **Tech Stack**: Next.js + React + TypeScript + Tailwind — already established
- **AI Providers**: Anthropic Claude + Google Gemini — already integrated
- **Sandbox**: E2B — already configured

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| YOLO mode | User selected for faster execution | — Pending |
| Fine granularity | More focused phases (8-12) | — Pending |
| Parallel execution | Independent plans run simultaneously | — Pending |

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
*Last updated: 2026-04-09 after initialization*
