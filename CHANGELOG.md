# Changelog

All notable changes to this project. Format groups: Added / Changed / Fixed /
Deprecated / Removed / Security. Versioning: `MAJOR.MINOR.PATCH`.
See [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md) for detailed release notes.

## [Unreleased]
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
