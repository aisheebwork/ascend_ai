# MASTER DOCUMENTATION — BQ SQL Advisor

**Purpose:** highest-level reference for the project.
**Audience:** developers, architects, reviewers, future AI agents.
**Last Updated:** 2026-06-04.

## 1. Executive Summary
A web tool that analyzes BigQuery SQL/HQL against governed table metadata to
surface PII/sensitive columns and partition-filter gaps, and produce
plain-language suggested edits. Auth via Firebase Google Sign-In; analysis logic
runs in a Cloudflare Pages Function using the Gemini API; per-user analysis
history persists in Firestore.

## 2. Problem Statement
Engineers writing BigQuery SQL routinely (a) use PII/SDE-tagged columns in
filters without decrypting them, and (b) query partition-required tables without
a partition filter (full scans, cost). Both are detectable from governed
metadata.

## 3. Goals / Non-Goals
- **Goals:** detect PII & partition columns in uploaded SQL; flag filter usage;
  suggest edits; keep history; secure Google login.
- **Non-Goals:** rewriting/executing SQL; a chat interface; vector RAG (the
  metadata is small and structured — exact lookups are used instead).

## 4. User Flow
Sign in → paste/upload SQL → **Analyze** → view detected tables, PII table,
partition table, and suggestions → run saved to history → revisit past runs.

## 5. Data Model
- **Governed metadata** (`metadata/*.json`): one table `triumph_transactions`,
  `require_partition_filter=true`, partition column `date_stmt_yr`, PII columns
  `cm13`/`cm15` (`pii_role_id` = SDE tag). Merged → `functions/_lib/metadata.bundle.json`.
- **Firestore:** `users/{uid}/analyses/{id}` = `{ fileName, sqlText, result, createdAt }`.
- **API contract:** `functions/_lib/types.ts` (`AnalysisResult`).

## 6. System Architecture
See [../.agent/ARCHITECTURE.md](../.agent/ARCHITECTURE.md). Summary:
React+Vite SPA (Cloudflare Pages) → `/api/analyze` Pages Function
(JWT verify via `jose`/JWKS → deterministic analyzer → Gemini w/ fallback) →
Firestore writes client-side.

## 7. AI Architecture
Gemini (`gemini-2.0-flash`, REST) receives deterministic findings and returns
**suggestion text only** (instructed not to emit SQL). Hard fallback to
rule-based templated suggestions on any error/missing key.

## 8. Security Model
- Gemini key server-side only (CF Function env).
- `/api/analyze` requires a valid Firebase ID token (RS256 verified against
  Google JWKS; issuer/audience must equal the Firebase project).
- Firestore rules restrict each user to their own `analyses` subcollection.

## 9. Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md).

## 10. Repository Structure
- `src/` — React SPA. `functions/` — CF Pages Function + analysis libs.
- `metadata/` — governed metadata. `scripts/build-metadata.mjs` — bundle builder.
- `test/` — analyzer unit tests. `docs/`, `.agent/` — knowledge/operational memory.

## 11. Technical Debt
See [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md). Key: DEBT-001 heuristic SQL parsing.

## Related Documents
- Product: [PRODUCT_VISION.md](PRODUCT_VISION.md) · [FEATURE_CATALOG.md](FEATURE_CATALOG.md) · [USER_FLOWS.md](USER_FLOWS.md) · [REQUIREMENT_TRACEABILITY.md](REQUIREMENT_TRACEABILITY.md)
- Technical: [DATA_MODEL.md](DATA_MODEL.md) · [SECURITY_MODEL.md](SECURITY_MODEL.md) · [DOMAIN_KNOWLEDGE.md](DOMAIN_KNOWLEDGE.md) · [GLOSSARY.md](GLOSSARY.md) · [PROMPT_LIBRARY.md](PROMPT_LIBRARY.md) · [adr/](adr/README.md)
- Governance: [RISK_REGISTER.md](RISK_REGISTER.md) · [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) · [RELEASE_NOTES.md](RELEASE_NOTES.md) · [../CHANGELOG.md](../CHANGELOG.md)
- Ops/Deploy: [index.md](index.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [STEP_BY_STEP_DEPLOY.md](STEP_BY_STEP_DEPLOY.md) · [../.agent/ARCHITECTURE.md](../.agent/ARCHITECTURE.md)
