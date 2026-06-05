# Tech Stack (as built)

**Purpose:** Inventory of the technology used.
**Audience:** all. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [RAG_WORKFLOW.md](RAG_WORKFLOW.md) · [ARCHITECTURE](../.agent/ARCHITECTURE.md) · [DEPENDENCY_NOTES](../.agent/DEPENDENCY_NOTES.md)

| Layer | Current tech stack |
|---|---|
| Language | TypeScript |
| Frontend | React + Vite + TailwindCSS (SPA) |
| Backend / API | Cloudflare Pages Function (`/api/analyze`), serverless TypeScript |
| LLM | Google Gemini 2.0 Flash via REST (`generativelanguage.googleapis.com`) |
| RAG / Retrieval | In-context (few-shot) RAG: deterministic metadata lookup + admin reformed-SQL examples injected into the prompt |
| Auth / Identity / RBAC | Firebase Auth (Google + passwordless email-link); admin allowlist (`functions/_lib/admins.ts` + `firestore.rules`) |
| Database (app data) | Firestore: analyses history, `sharedSql`, `reformedExamples`, `sharedMetadata` |
| Metadata storage | Built-in JSON bundle (compile-time, from `metadata/`) + Firestore `sharedMetadata` |
| Secrets | Cloudflare Pages env secrets (`GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`); local `.dev.vars`; public Firebase web config in `.env.production` |
| Hosting / Deploy | Cloudflare Pages with GitHub auto-deploy |
| Tests | `node:test` + `tsx` (analyzer, reformer, metadata parser) |

## Why these choices
- Cloudflare Pages: free, co-located frontend + serverless function; Gemini key stays server-side.
- Deterministic detection (testable, exact); the LLM handles wording + example-styled reform.
- Firestore: auth-scoped storage with no server to run. See [docs/adr/](adr/README.md).
