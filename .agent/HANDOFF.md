# HANDOFF

## Active task
Initial build complete. Next contributor should run it end-to-end with real credentials.

## Immediate next steps
1. `npm install` then `cp .env.example .env` and fill `VITE_FIREBASE_*` from the Firebase console.
2. Create `.dev.vars` with `GEMINI_API_KEY` and `FIREBASE_PROJECT_ID`.
3. `npm run build:metadata && npm test` (expect 6 passing).
4. Local run: `npm run build && npx wrangler pages dev dist --port 8788` (terminal 1) + `npm run dev` (terminal 2).
5. Sign in with Google, paste `sample_hql_sql/F295530_USDREE_V2.0.0_billed_only.sql`, click Analyze.
   - Expect: `cm15` PII finding (used in filter) + `date_stmt_yr` missing-partition-filter finding.
6. Confirm the run appears in the History panel (Firestore write).
7. Deploy per `docs/DEPLOYMENT.md`; add the Pages domain to Firebase authorized domains.

## Warnings / reminders
- `functions/_lib/metadata.bundle.json` is generated (gitignored) — run `build:metadata` before tests/build.
- `GEMINI_API_KEY` must never be `VITE_`-prefixed (would leak to the browser).
- If Gemini is unavailable, suggestions fall back to rule-based — this is expected, not a bug.

## Known risks
- Heuristic SQL parsing (DEBT-001) — see `docs/TECHNICAL_DEBT.md`.
