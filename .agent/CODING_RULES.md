# CODING RULES

- TypeScript strict mode (see `tsconfig.json`); `tsc --noEmit` must pass.
- Keep the **analyzer deterministic and pure** — it must remain unit-testable
  without network/Firebase. All non-determinism (Gemini) lives in `gemini.ts`
  with a deterministic fallback.
- **Never expose secrets to the client.** Server secrets (`GEMINI_API_KEY`,
  `FIREBASE_PROJECT_ID`) must not be `VITE_`-prefixed.
- **Single source of truth for the API contract:** `functions/_lib/types.ts`.
  The frontend re-exports it via `src/types.ts`.
- The tool **suggests** only — never emit rewritten SQL (enforced in the Gemini
  prompt and by design).
- Regenerate metadata via `npm run build:metadata`; never hand-edit
  `metadata.bundle.json`.
- Styling via Tailwind utility classes; keep components small and focused.
