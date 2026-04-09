# Requirements: SiteForge

**Defined:** 2026-04-09
**Core Value:** Users can generate fully functional websites from text prompts without writing code.

## v1 Requirements

### Core Generation

- [ ] **GEN-01**: User can enter a text prompt describing their desired website
- [ ] **GEN-02**: AI generates a complete Next.js site from the prompt
- [ ] **GEN-03**: User sees real-time progress via SSE streaming
- [ ] **GEN-04**: Generated site can be previewed in an iframe
- [ ] **GEN-05**: User can iterate on the generated site with follow-up prompts

### User Accounts

- [ ] **AUTH-01**: User can sign up with email/password
- [ ] **AUTH-02**: User can log in and stay logged in
- [ ] **AUTH-03**: User can log out
- [ ] **AUTH-04**: User session persists across browser refresh

### Project Management

- [ ] **PROJ-01**: User can save generated projects
- [ ] **PROJ-02**: User can view list of their saved projects
- [ ] **PROJ-03**: User can delete their projects
- [ ] **PROJ-04**: User can view individual project details

### Quality

- [ ] **QUAL-01**: Comprehensive test suite exists
- [ ] **QUAL-02**: Errors are properly handled and displayed to users
- [ ] **QUAL-03**: API routes have rate limiting

## v2 Requirements

### Advanced Features

- **ADV-01**: User can use custom design templates
- **ADV-02**: User can export generated code as ZIP
- **ADV-03**: User can share projects via public URL
- **ADV-04**: User can duplicate existing projects

### Collaboration

- **COLL-01**: User can invite others to collaborate on projects
- **COLL-02**: Multiple users can edit the same project

### Storage

- **STOR-01**: Projects stored in proper database (PostgreSQL)
- **STOR-02**: File attachments (images, assets) stored in cloud storage

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first approach, mobile later |
| Real-time collaborative editing | High complexity, defer to v2+ |
| Custom template marketplace | Separate phase |
| Video generation | Consider as separate integration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEN-01 | Phase 1 | Pending |
| GEN-02 | Phase 1 | Pending |
| GEN-03 | Phase 1 | Pending |
| GEN-04 | Phase 1 | Pending |
| GEN-05 | Phase 2 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 2 | Pending |
| PROJ-03 | Phase 2 | Pending |
| PROJ-04 | Phase 2 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
