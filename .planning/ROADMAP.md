# Roadmap: SiteForge

**Created:** 2026-04-09
**Granularity:** Fine (8-12 phases)
**Mode:** YOLO

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Core Generation | User can generate sites from prompts | GEN-01 to GEN-05 | 5 criteria |
| 2 | Iteration & Projects | User can iterate on sites and save projects | GEN-05, PROJ-01 to PROJ-04 | 5 criteria |
| 3 | Authentication | User accounts with login/logout | AUTH-01 to AUTH-04 | 4 criteria |
| 4 | Quality & Polish | Tests, error handling, rate limiting | QUAL-01 to QUAL-03 | 3 criteria |
| 5 | Advanced Features | Templates, export, sharing | ADV-01 to ADV-04 | 4 criteria |
| 6 | Collaboration | Multi-user editing | COLL-01 to COLL-02 | 2 criteria |
| 7 | Database Migration | PostgreSQL storage | STOR-01 | 1 criterion |

**Total: 7 phases | 23 requirements | 20 success criteria**

---

## Phase 1: Core Generation

**Goal:** User can generate fully functional Next.js sites from text prompts with real-time progress feedback.

**Requirements:**
- GEN-01: User can enter a text prompt describing their desired website
- GEN-02: AI generates a complete Next.js site from the prompt
- GEN-03: User sees real-time progress via SSE streaming
- GEN-04: Generated site can be previewed in an iframe

**Success Criteria:**
1. User enters prompt → blueprint generated within 30 seconds
2. Blueprint shows structured plan (sections, styling, features)
3. Code generation completes → working Next.js site available
4. Preview iframe displays the generated site correctly
5. Progress events stream in real-time during all stages

**Canonical refs:**
- `.planning/codebase/ARCHITECTURE.md` — Pipeline architecture
- `.planning/codebase/STACK.md` — Tech stack details

**UI hint:** yes

---

## Phase 2: Iteration & Projects

**Goal:** User can refine generated sites with follow-up prompts and save their work for later.

**Requirements:**
- GEN-05: User can iterate on the generated site with follow-up prompts
- PROJ-01: User can save generated projects
- PROJ-02: User can view list of their saved projects
- PROJ-03: User can delete their projects
- PROJ-04: User can view individual project details

**Success Criteria:**
1. User types iteration prompt → changes applied via hot-patch
2. Changes reflect in preview without full rebuild
3. Projects persist to storage and appear in project list
4. User can delete project → removed from storage and list
5. Project detail view shows all versions/history

**UI hint:** yes

---

## Phase 3: Authentication

**Goal:** User accounts with secure login, signup, and session management.

**Requirements:**
- AUTH-01: User can sign up with email/password
- AUTH-02: User can log in and stay logged in
- AUTH-03: User can log out
- AUTH-04: User session persists across browser refresh

**Success Criteria:**
1. New user completes signup → account created, logged in
2. Returning user logs in → session established
3. User logs out → session terminated
4. Browser refresh → user remains logged in

---

## Phase 4: Quality & Polish

**Goal:** Production-ready with tests, error handling, and rate limiting.

**Requirements:**
- QUAL-01: Comprehensive test suite exists
- QUAL-02: Errors are properly handled and displayed to users
- QUAL-03: API routes have rate limiting

**Success Criteria:**
1. Test suite runs → all tests pass with >80% coverage
2. API errors return meaningful messages to users
3. Rate limited requests receive 429 response with retry-after

---

## Phase 5: Advanced Features

**Goal:** Enhanced capabilities for templates, export, and sharing.

**Requirements:**
- ADV-01: User can use custom design templates
- ADV-02: User can export generated code as ZIP
- ADV-03: User can share projects via public URL
- ADV-04: User can duplicate existing projects

**Success Criteria:**
1. User selects template → site generated with template applied
2. User clicks export → ZIP file downloads with all code
3. Shared URL loads → project viewable without login
4. User duplicates project → copy appears in project list

---

## Phase 6: Collaboration

**Goal:** Multiple users can work on the same project.

**Requirements:**
- COLL-01: User can invite others to collaborate on projects
- COLL-02: Multiple users can edit the same project

**Success Criteria:**
1. Owner invites user → collaborator receives access
2. Both users see real-time changes to project

---

## Phase 7: Database Migration

**Goal:** Scalable storage with proper database.

**Requirements:**
- STOR-01: Projects stored in proper database (PostgreSQL)

**Success Criteria:**
1. All CRUD operations work against PostgreSQL

---

## Requirements Traceability

| Requirement | Phase |
|-------------|-------|
| GEN-01 | Phase 1 |
| GEN-02 | Phase 1 |
| GEN-03 | Phase 1 |
| GEN-04 | Phase 1 |
| GEN-05 | Phase 2 |
| PROJ-01 | Phase 2 |
| PROJ-02 | Phase 2 |
| PROJ-03 | Phase 2 |
| PROJ-04 | Phase 2 |
| AUTH-01 | Phase 3 |
| AUTH-02 | Phase 3 |
| AUTH-03 | Phase 3 |
| AUTH-04 | Phase 3 |
| QUAL-01 | Phase 4 |
| QUAL-02 | Phase 4 |
| QUAL-03 | Phase 4 |
| ADV-01 | Phase 5 |
| ADV-02 | Phase 5 |
| ADV-03 | Phase 5 |
| ADV-04 | Phase 5 |
| COLL-01 | Phase 6 |
| COLL-02 | Phase 6 |
| STOR-01 | Phase 7 |

**Coverage:** 23/23 requirements mapped ✓

---

*Roadmap created: 2026-04-09*
