# SESSION LOG

## 2026-06-04 (later) — Add Metadata feature

### Contributor
Claude Code

### Completed
- Added a live "Add metadata" feature: shared Firestore `sharedMetadata`
  collection, `parseMetadata.ts` (raw Cornerstone JSON → normalized tables),
  analyzer/function accept `extraTables`, `MetadataManager` UI + `metadataStore.ts`.
- Updated Firestore rules (sharedMetadata). Added 4 tests (10 total, all pass).
- Docs: STEP_BY_STEP Part F, TECHNICAL_DEBT DEBT-005, CURRENT_STATE.

### Note
- Firestore rules must be re-published for the new collection.
- DEBT-005: client sends all shared metadata per request (fine at hackathon scale).

---

## 2026-06-04 — Initial build

### Contributor
Claude Code

### Completed
- Designed and built the BQ SQL Advisor end-to-end (greenfield).
- Metadata builder, deterministic analyzer (both flows), Gemini layer w/ fallback.
- CF Pages Function + Firebase ID-token verification.
- React+Vite+Tailwind SPA (login, uploader, results, history).
- Firestore rules, deployment guide, workflow docs (.agent + docs).
- Analyzer unit tests (6 passing) against the provided sample SQL.

### Modified / Created Files
- Config: package.json, vite.config.ts, tsconfig.json, tailwind/postcss configs, index.html, .env.example, .gitignore
- Backend: functions/api/analyze.ts, functions/_lib/{analyzer,metadata,gemini,auth,types}.ts, scripts/build-metadata.mjs
- Frontend: src/main.tsx, src/App.tsx, src/index.css, src/types.ts, src/vite-env.d.ts, src/lib/{firebase,api,analyses}.ts, src/components/{Login,SqlUploader,Results,HistoryPanel}.tsx
- Test: test/analyzer.test.ts
- Rules/docs: firestore.rules, README.md, docs/*, .agent/*

### Current Status
Build green (`tsc --noEmit`, `vite build`); tests pass. Not yet run end-to-end (needs Firebase + Gemini credentials).

### Next Recommended Step
Run locally with real credentials per .agent/HANDOFF.md and verify the sample-SQL flow + Firestore history.

### Risks
- Heuristic SQL parsing (DEBT-001). Gemini fallback path is deterministic by design.
