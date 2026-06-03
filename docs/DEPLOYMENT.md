# Deployment Guide

## Purpose
Deploy the BQ SQL Advisor: Cloudflare Pages (frontend + `/api/analyze` Function)
with Firebase (Auth + Firestore).

## Audience
Developers / operators deploying or running the project.

## 1. Firebase setup
1. Create a Firebase project (or reuse one).
2. **Authentication → Sign-in method →** enable **Google**.
3. **Firestore Database →** create a database (production mode).
4. Deploy security rules from [`firestore.rules`](../firestore.rules):
   ```bash
   firebase deploy --only firestore:rules
   ```
5. **Project settings → Your apps → Web app:** copy the SDK config into the
   `VITE_FIREBASE_*` variables.
6. **Authentication → Settings → Authorized domains:** add your Cloudflare Pages
   domain (e.g. `bq-sql-advisor.pages.dev`) so Google Sign-in popups work.

## 2. Cloudflare Pages setup — GitHub auto-deploy
Repo: <https://github.com/aisheebwork/ascend_ai>

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize Cloudflare's GitHub app and select **`aisheebwork/ascend_ai`**.
3. **Build settings:**
   - Framework preset: **None** (Vite) / or "Vite".
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
   - Functions are auto-detected from the [`functions/`](../functions/) directory.
4. **Environment variables** (Settings → Environment variables → Production **and** Preview):
   - Build-time (plaintext): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
     `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
     `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
   - Runtime **secrets** (encrypt): `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`.
5. **Save and Deploy.** Every push to the production branch (and PRs → preview
   deployments) now auto-builds and deploys. `npm run build` regenerates
   `functions/_lib/metadata.bundle.json` on every build, so the gitignored
   bundle does not need to be committed.

> `GEMINI_API_KEY` and `FIREBASE_PROJECT_ID` are **server-side only** — never
> commit them and never give them a `VITE_` prefix (that would ship them to the
> browser). Locally they live in `.dev.vars` (gitignored).

> `GEMINI_API_KEY` is **server-side only** — it is never exposed to the browser.
> If it is absent or Gemini errors, `/api/analyze` falls back to deterministic
> rule-based suggestions so the tool still works.

## 3. Local development
```bash
npm install
npm run build:metadata
# Terminal 1 — Pages Function (set secrets via .dev.vars or env):
npm run build && npx wrangler pages dev dist --port 8788
# Terminal 2 — Vite (proxies /api → 8788):
npm run dev
```
Create a `.dev.vars` file (gitignored) for local function secrets:
```
GEMINI_API_KEY=...
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## 4. Environments
| Environment | Purpose | Notes |
|---|---|---|
| Local | dev | Vite + wrangler pages dev |
| Preview | PR builds | CF Pages preview deployments |
| Production | live | CF Pages production branch |

## Related documents
- [MASTER_DOCUMENTATION.md](MASTER_DOCUMENTATION.md)
- [../README.md](../README.md)
