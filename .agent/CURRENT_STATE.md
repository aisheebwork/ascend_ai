# CURRENT STATE

_Last updated: 2026-06-04_

## Completed
- Full project scaffold (Vite + React + Tailwind + TS).
- Metadata builder → `metadata.bundle.json` (triumph_transactions: 45 cols, partition `date_stmt_yr`, PII `cm13`/`cm15`).
- Deterministic analyzer implementing both flows; 6 unit tests passing against the sample SQL.
- Gemini suggestion layer with deterministic fallback.
- CF Pages Function `/api/analyze` with Firebase ID-token verification.
- Frontend: Google login, SQL uploader (paste/file/drag-drop), results tables, history panel.
- Firestore rules; deployment + workflow docs.
- `tsc --noEmit` clean; `vite build` succeeds.

## Recent additions
- **v0.3.0 — Admin area + reformed SQL + BQ-only.** `/admin` route (Google +
  passwordless email-link; allowlist `functions/_lib/admins.ts` mirrored in
  `firestore.rules`) with 3 sections: metadata (moved off main page), share raw
  BQ SQL between admins (`sharedSql`), reformed-SQL examples for RAG
  (`reformedExamples`). Analyzer now also emits deterministic anomalies; Gemini
  adds more + refines wording and uses examples as RAG context. Results page
  generates reformed BQ SQL (PII → `sde_decrypt('TAG', col)`), checkbox-select
  suggestions, download with smart filename. HQL removed (BQ SQL only).
  `public/_redirects` added for SPA routing. 18/18 tests pass; build clean.

## Earlier additions
- **Add Metadata feature**: users upload Cornerstone-format metadata JSON in the
  UI → parsed (`functions/_lib/parseMetadata.ts`) → stored in shared Firestore
  `sharedMetadata` collection → merged into every analysis. Analyzer + function
  now accept `extraTables`. New `MetadataManager` UI + `metadataStore.ts`.
  Firestore rules updated (must be re-published). 10/10 tests pass.

## Work in progress
- None — feature complete.

## Pending / not yet done
- Provide real Firebase config + `GEMINI_API_KEY` and run end-to-end (needs credentials).
- Live verification: sign in, analyze sample SQL, confirm Firestore write + history.
- Optional: more governed metadata tables.

## Blockers
- End-to-end run requires a Firebase project + Gemini key (not available in this environment).
