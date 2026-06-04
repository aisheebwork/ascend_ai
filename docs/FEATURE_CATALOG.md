# Feature Catalog

**Purpose:** Authoritative inventory of product capabilities.
**Audience:** product, devs, AI agents. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [USER_FLOWS.md](USER_FLOWS.md) · [REQUIREMENT_TRACEABILITY.md](REQUIREMENT_TRACEABILITY.md) · [ARCHITECTURE](../.agent/ARCHITECTURE.md)

Status values: Proposed · Planned · In Progress · Implemented · Experimental · Deprecated · Removed.

---

## FEATURE-001 — Google Sign-In
- **Description:** Authenticate users via Firebase Google Sign-In; gate the tool behind auth.
- **Status:** Implemented · **Priority:** High · **Owner:** project
- **Dependencies:** Firebase Auth · **Related:** FEATURE-006, FEATURE-007
- **User value:** Secure, one-click access. **Business value:** Access control, attribution.
- **Technical notes:** `src/components/Login.tsx`, `src/lib/firebase.ts`. ID token verified server-side.
- **Known risks:** Authorized-domain config required (see USER_FLOWS failure paths).

## FEATURE-002 — SQL/HQL upload & paste
- **Description:** Paste SQL or upload/drag a `.sql`/`.hql` file for analysis.
- **Status:** Implemented · **Priority:** High
- **Dependencies:** — · **Related:** FEATURE-003/004/005
- **User value:** Flexible input. **Technical notes:** `src/components/SqlUploader.tsx`.

## FEATURE-003 — PII / sensitive column detection (Flow 1)
- **Description:** Detect `is_sensitive` columns (with SDE `pii_role_id`) used in the query, flag those used in filter clauses.
- **Status:** Implemented · **Priority:** High
- **Dependencies:** metadata · **Related:** FEATURE-005
- **Technical notes:** `functions/_lib/analyzer.ts`. Maps to `architecture_resources/Flow_1.jpg`.
- **Known risks:** Heuristic filter detection (DEBT-001 / RISK-001).

## FEATURE-004 — Partition-filter detection (Flow 2)
- **Description:** If a table has `require_partition_filter`, check the partition column is used in a filter; flag if missing.
- **Status:** Implemented · **Priority:** High
- **Dependencies:** metadata · **Related:** FEATURE-005
- **Technical notes:** `functions/_lib/analyzer.ts`. Maps to `architecture_resources/Flow_2.jpg`.

## FEATURE-005 — Suggestion generation (no rewriting)
- **Description:** Produce plain-language suggested edits per finding via Gemini, with a deterministic rule-based fallback. Never rewrites SQL.
- **Status:** Implemented · **Priority:** High
- **Dependencies:** Gemini API (optional) · **Related:** FEATURE-003/004
- **Technical notes:** `functions/_lib/gemini.ts`. **Known risks:** RISK-002 (Gemini availability).

## FEATURE-006 — Analysis history
- **Description:** Persist each run per user; revisit previous analyses from a side panel.
- **Status:** Implemented · **Priority:** Medium
- **Dependencies:** Firestore · **Technical notes:** `src/lib/analyses.ts`, `HistoryPanel.tsx`, `users/{uid}/analyses`.

## FEATURE-007 — Shared metadata library ("Add metadata")
- **Description:** Users upload Cornerstone-format metadata JSON; stored in a shared Firestore collection and merged into all analyses.
- **Status:** Implemented · **Priority:** High
- **Dependencies:** Firestore, `parseMetadata.ts` · **Related:** FEATURE-003/004
- **Technical notes:** `src/components/MetadataManager.tsx`, `src/lib/metadataStore.ts`, `sharedMetadata`.
- **Known risks:** Any user can contribute (RISK-003); request size grows (DEBT-005).
- **Future enhancements:** edit/remove tables, ownership, server-side metadata read.

---

## Future / not yet built
- Export an analysis (PDF/markdown) — *Proposed*
- Per-finding "reviewed" state — *Proposed*
- Real BigQuery SQL parser (replaces heuristic) — *Proposed* (DEBT-001)
