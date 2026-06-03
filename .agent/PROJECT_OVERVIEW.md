# PROJECT OVERVIEW

## Purpose
Web tool that analyzes BigQuery SQL/HQL against governed table metadata to flag
PII/sensitive columns and partition-filter gaps, and suggest edits. Built for
the Amex Ascend hackathon.

## Business goals
- Help engineers handle PII (decrypt SDE-tagged columns used in filters).
- Enforce partition-filter usage on partition-required tables.

## Tech stack
- Frontend: React + Vite + TailwindCSS (SPA) → Cloudflare Pages
- Backend logic: Cloudflare Pages Function (`/api/analyze`) + Gemini API
- Auth + storage: Firebase Google Sign-In + Firestore

## Major modules
- `functions/_lib/analyzer.ts` — deterministic SQL → findings (the two flows)
- `functions/_lib/metadata.ts` + `scripts/build-metadata.mjs` — governed metadata
- `functions/_lib/gemini.ts` — suggestion text (with rule-based fallback)
- `functions/_lib/auth.ts` — Firebase ID-token verification
- `src/` — SPA (login, uploader, results, history)

## Scope boundaries
- Suggestions only — no SQL rewriting, no execution.
- No chat UI (replaced by per-user analysis history).

## External integrations
Firebase (Auth, Firestore), Google Generative Language (Gemini), Cloudflare Pages.
