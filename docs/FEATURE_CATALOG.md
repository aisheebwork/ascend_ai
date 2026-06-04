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

## FEATURE-002 — BQ SQL upload & paste
- **Description:** Paste BigQuery SQL or upload/drag a `.sql` file for analysis. **BQ SQL only — HQL removed.**
- **Status:** Implemented · **Priority:** High
- **Dependencies:** — · **Related:** FEATURE-003/004/005/011
- **User value:** Flexible input. **Technical notes:** `src/components/SqlUploader.tsx` (tracks uploaded vs pasted for download naming).

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

## FEATURE-008 — Admin area (`/admin`)
- **Description:** Restricted admin page; admins sign in via Google or passwordless email link. Allowlist in `functions/_lib/admins.ts` (mirrored in `firestore.rules`).
- **Status:** Implemented · **Priority:** High
- **Dependencies:** Firebase Auth (Email link + Google) · **Technical notes:** `src/pages/Admin.tsx`, `src/components/AdminLogin.tsx`, `functions/_lib/admins.ts`.
- **Known risks:** allowlist lives in two files (DEBT-006); email-link replaces the password flow.

## FEATURE-009 — Share raw BQ SQL between admins
- **Description:** Admins upload `.sql` files; other admins view & download them.
- **Status:** Implemented · **Priority:** Medium
- **Dependencies:** Firestore `sharedSql` · **Technical notes:** `src/components/admin/ShareSqlSection.tsx`, `src/lib/sharedSql.ts`.

## FEATURE-010 — Reformed BQ SQL examples (RAG)
- **Description:** Admins add original→reformed SQL examples; sent to the analyzer as Gemini style guidance.
- **Status:** Implemented · **Priority:** Medium
- **Dependencies:** Firestore `reformedExamples` · **Technical notes:** `src/components/admin/ReformedExamplesSection.tsx`, `src/lib/reformedExamples.ts`.

## FEATURE-011 — Reformed SQL output + download
- **Description:** Generates reformed BQ SQL wrapping PII columns with `sde_decrypt('TAG', col)`; users tick which suggestions to apply (PII decrypts applied inline, other suggestions added as review comments) and download. Filename: `<base>_reformed.sql` for uploads, else editable default `bq_sql_reformed.sql`.
- **Status:** Implemented · **Priority:** High
- **Dependencies:** `functions/_lib/reformer.ts` · **Related:** FEATURE-003/004/005/012
- **Known risks:** text-based reform is best-effort (DEBT-001); decrypt UDF signature needs SME confirmation.

## FEATURE-012 — Example-driven (RAG) reformed SQL
- **Description:** When a valid Gemini key + admin reformed examples exist, the analyzer returns `aiReformedSql` generated by few-shot RAG over those examples, matching the team's style. UI toggles **AI (your examples)** vs **Rule-based**. Falls back to rule-based when key/examples absent or on error.
- **Status:** Implemented · **Priority:** High
- **Dependencies:** Gemini key, `reformedExamples` (FEATURE-010) · **Technical notes:** `functions/_lib/gemini.ts` (`generateReformedSql`), `src/components/Results.tsx`.
- **Known risks:** AI rewrite is non-deterministic — review before running (DEBT-001); requires a real key (placeholder → silent rule-based fallback). See [RAG_WORKFLOW.md](RAG_WORKFLOW.md).

---

## Future / not yet built
- Export an analysis (PDF/markdown) — *Proposed*
- Per-finding "reviewed" state — *Proposed*
- Real BigQuery SQL parser (replaces heuristic) — *Proposed* (DEBT-001)
