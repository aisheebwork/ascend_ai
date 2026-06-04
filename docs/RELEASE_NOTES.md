# Release Notes

**Purpose:** Track the evolution of the product.
**Audience:** all. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [../CHANGELOG.md](../CHANGELOG.md) · [FEATURE_CATALOG.md](FEATURE_CATALOG.md)

Versioning: `MAJOR.MINOR.PATCH` (see WORKFLOW_COMPANION_01.md).

---

## 0.2.0 — 2026-06-04
**Summary:** Live shared metadata library.
- **Features added:** FEATURE-007 — "Add metadata" (upload Cornerstone JSON →
  shared Firestore `sharedMetadata` → merged into every analysis).
- **Changed:** Analyzer and `/api/analyze` accept `extraTables`; SPA sends the shared library.
- **Security:** New Firestore rules for `sharedMetadata` (auth required; no delete) — **must be re-published**.
- **Known issues:** Client sends all shared metadata per request (DEBT-005); any user can contribute (RISK-003).
- **Migration notes:** Re-publish `firestore.rules`. No data migration.
- **Risks:** RISK-003, RISK-006. **Rollback:** revert to 0.1.0; existing `sharedMetadata` docs are ignored if the feature is removed.

## 0.1.0 — 2026-06-04
**Summary:** Initial BQ SQL PII & Partition Advisor.
- **Features added:** FEATURE-001..006 — Google sign-in, SQL upload/paste, PII
  detection (Flow 1), partition detection (Flow 2), suggestions (Gemini +
  fallback), per-user analysis history.
- **Security:** Firebase ID-token verification in the Pages Function; per-user Firestore rules.
- **Known issues:** Heuristic SQL parsing (DEBT-001); large JS bundle (DEBT-003).
- **Breaking changes:** none (initial). **Dependencies:** react, firebase, jose, vite, tailwind, wrangler.
- **Risks:** RISK-001, RISK-002. **Rollback:** n/a (first release).
