# BQ SQL Advisor — PII & Partition

A web tool for American Express data engineers: sign in with Google, upload or
paste a BigQuery SQL/HQL query, and get back — from **governed table
metadata** — the PII/sensitive columns (with SDE tags) and partition columns
in your query, whether each is used in a filter, and **plain-language suggested
edits** (decrypt PII columns used in filters; add a partition filter where
required). Previous analyses are saved per user.

> It **suggests** changes — it never rewrites your SQL.

## Tech stack

- **Frontend:** React + Vite + TailwindCSS (SPA), hosted on **Cloudflare Pages**
- **Backend logic:** **Cloudflare Pages Function** (`/api/analyze`) — runs the
  deterministic metadata analyzer and calls the **Gemini API** for suggestion text
- **Auth + storage:** **Firebase** Google Sign-In + Firestore (per-user history)

## How it works

```
React SPA ──Google Sign-In──► Firebase Auth ──ID token──► /api/analyze (CF Pages Function)
                                                              │ verify JWT (jose + Google JWKS)
                                                              │ deterministic analysis (bundled metadata)
                                                              │ Gemini → suggestion text (fallback: rule-based)
                                                              ▼
SPA renders findings, then saves the run ──► Firestore users/{uid}/analyses
```

The analyzer implements the two architecture flows:
1. **PII (Flow 1):** find tables → look up `is_sensitive` columns + `pii_role_id`
   (SDE tag) → if used in a filter/join, suggest applying decrypt.
2. **Partition (Flow 2):** if `require_partition_filter` is true and the
   partition column isn't in any filter, suggest adding a partition filter.

Governed metadata lives in [`metadata/`](metadata/) and is merged into a compact
bundle by [`scripts/build-metadata.mjs`](scripts/build-metadata.mjs).

## Quick start

```bash
npm install
cp .env.example .env        # fill in VITE_FIREBASE_* from Firebase console
npm run build:metadata      # generate functions/_lib/metadata.bundle.json
npm test                    # analyzer unit tests against the sample SQL

# Run frontend + function locally (two terminals):
npm run build && npx wrangler pages dev dist --port 8788   # Pages Function (needs GEMINI_API_KEY, FIREBASE_PROJECT_ID)
npm run dev                                                 # Vite dev server (proxies /api → 8788)
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Cloudflare Pages + Firebase setup.

## Documentation

- [docs/index.md](docs/index.md) — documentation hub
- [docs/MASTER_DOCUMENTATION.md](docs/MASTER_DOCUMENTATION.md) — full system reference
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deployment guide
- [.agent/](.agent/) — operational memory (state, decisions, handoff)
- [agent_docs/AI_AGENT_WORKFLOW.md](agent_docs/AI_AGENT_WORKFLOW.md) — engineering workflow
