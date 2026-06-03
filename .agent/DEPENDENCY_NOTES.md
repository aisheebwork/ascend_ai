# DEPENDENCY NOTES

| Dependency | Purpose | Notes |
|---|---|---|
| `react`, `react-dom` | SPA UI | v18 |
| `firebase` (web SDK) | Google Auth + Firestore (client) | Large bundle (DEBT-003) |
| `jose` | Verify Firebase ID tokens in the CF Function via Google JWKS | No Admin SDK / service account needed |
| `vite`, `@vitejs/plugin-react` | Build/dev server | Outputs to `dist/` |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling | |
| `wrangler` | Local CF Pages Functions dev / deploy | `wrangler pages dev dist` |
| `tsx` (dev) | Run TS unit tests + JSON imports under `node --test` | |
| `typescript` | Type checking (`tsc --noEmit`) | strict mode |

## External services
- **Google Generative Language (Gemini)** — REST, model `gemini-2.0-flash`. Server-side key only.
- **Firebase** — Auth (Google) + Firestore. Public web config in `VITE_*`.
- **Cloudflare Pages** — hosting + Functions.

## Adding a dependency
Justify necessity, prefer fewer deps, keep the analyzer dependency-free.
