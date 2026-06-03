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
