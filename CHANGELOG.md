# Changelog

All notable changes to this project. Format groups: Added / Changed / Fixed /
Deprecated / Removed / Security. Versioning: `MAJOR.MINOR.PATCH`.
See [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md) for detailed release notes.

## [Unreleased]
### Added
- Rename a saved session (tool page) and edit a reformed example (admin).
- Delete a saved session (tool page) and delete/edit reformed examples (admin).
- Copy button for shared BQ SQL files (admin).
### Changed
- Reformed SQL output is now fixed-width with line wrapping; PII `sde_decrypt(...)`
  insertions and review comments are highlighted.
- `firestore.rules`: `reformedExamples` now allows admin create/update/delete.

## [0.4.0] - 2026-06-04
### Added
- Example-driven (RAG) reformed SQL: `generateReformedSql` few-shot over admin
  `reformedExamples`; `/api/analyze` returns `aiReformedSql`; Results AI/rule-based toggle.
- `docs/RAG_WORKFLOW.md` (end-to-end RAG explanation for all audiences).
### Notes
- RAG/example styling requires a valid `GEMINI_API_KEY`; placeholder keys fall back to rule-based.

## [0.3.0] - 2026-06-04
### Added
- Admin area `/admin` (Google + passwordless email-link, allowlist in `functions/_lib/admins.ts`).
- Share raw BQ SQL between admins (`sharedSql`); reformed-SQL examples for RAG (`reformedExamples`).
- Reformed BQ SQL output: PII columns wrapped with `sde_decrypt('TAG', col)`, checkbox-selected
  suggestions, download with smart filename. Deterministic + Gemini anomaly checks.
- `public/_redirects` for SPA routing; ADR 007/008.
### Changed
- BQ SQL only (HQL removed). "Add metadata" moved to `/admin`. `sharedMetadata` writes admin-only.
### Security
- Admin allowlist + Firestore rules for `sharedSql`/`reformedExamples` (re-publish required).

## [Unreleased - docs]
### Added
- Full documentation-governance set (GLOSSARY, FEATURE_CATALOG, DATA_MODEL,
  SECURITY_MODEL, USER_FLOWS, PRODUCT_VISION, DOMAIN_KNOWLEDGE, RISK_REGISTER,
  PROMPT_LIBRARY, RELEASE_NOTES, REQUIREMENT_TRACEABILITY, ADRs, CONTRIBUTION_JOURNAL,
  AI_AUDIT, snapshot).

## [0.2.0] - 2026-06-04
### Added
- "Add metadata" feature: shared Firestore `sharedMetadata` library merged into analyses (FEATURE-007).
### Changed
- Analyzer and `/api/analyze` accept `extraTables`; SPA sends the shared library.
### Security
- Firestore rules extended for `sharedMetadata` (auth required; no delete) — re-publish required.

## [0.1.0] - 2026-06-04
### Added
- BQ SQL PII & Partition Advisor: Google sign-in, SQL/HQL upload & paste, PII
  detection (Flow 1), partition detection (Flow 2), Gemini suggestions with
  rule-based fallback, per-user analysis history (FEATURE-001..006).
### Security
- Firebase ID-token verification (jose/JWKS) in the Pages Function; per-user Firestore rules.
