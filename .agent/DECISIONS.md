# DECISIONS

## D-001 — Analysis logic runs in a Cloudflare Pages Function (not Firebase Functions)
- **Decision:** Run the analyzer + Gemini call in a CF Pages Function; use Firebase only for Auth + Firestore.
- **Reasoning:** Free-tier friendly (no Firebase Blaze required); keeps the Gemini key server-side; co-located with the frontend deploy.
- **Alternatives:** Firebase Cloud Functions (needs Blaze for egress); client-side Gemini (exposes key — rejected).
- **Consequences:** Backend split across two providers; ID tokens verified in the Worker via JWKS.

## D-002 — Suggestions only, no SQL rewriting; no chat UI
- **Decision:** The tool detects + advises; it does not rewrite or execute SQL, and has no chat.
- **Reasoning:** Explicit user direction. Lower risk, clearer value (governance advice).
- **Consequences:** "Previous chats" reinterpreted as per-user saved analysis history.

## D-003 — Deterministic metadata lookup, not vector RAG
- **Decision:** Exact metadata lookups (flags + SDE tags) feed Gemini; no embeddings.
- **Reasoning:** Metadata is small and structured (one table, ~45 cols); exact lookups are precise and cheap.
- **Consequences:** Adding tables = adding metadata JSON (builder already merges many tables).

## D-004 — Firebase ID-token verification via `jose` + JWKS
- **Decision:** Verify tokens against Google JWKS rather than the Admin SDK.
- **Reasoning:** No service-account secret in the Worker; lightweight.
- **Consequences:** No token-revocation check (DEBT-002).

## D-005 — Stack: React + Vite + Tailwind
- **Decision:** Vite SPA on Cloudflare Pages.
- **Reasoning:** Standard, fast, well-supported on CF Pages.

## D-006 — Shared (team-wide) metadata library in Firestore
- **Decision:** User-added metadata is stored in a shared `sharedMetadata` collection (any signed-in user can read & add; no delete) and sent to the function as `extraTables` per request.
- **Reasoning:** Goal is a collectively improving knowledge base; keeps the Function stateless (no Firebase credentials in the Worker).
- **Alternatives:** Per-user metadata (less useful); server-side Firestore read (needs Admin creds in Worker); rebuild bundle per upload (no live updates).
- **Consequences:** Any user can add imperfect metadata (RISK-003); request grows with library (DEBT-005).

## D-007 — Admin area with allowlist + passwordless email-link sign-in
- **Decision:** `/admin` route gated by an email allowlist in `functions/_lib/admins.ts` (mirrored in `firestore.rules`). Admins sign in via Google or Firebase passwordless email link.
- **Reasoning:** Simple, no extra user DB; email-link avoids password management. User chose email-link over email/password.
- **Consequences:** No password/forced-change flow (passwordless). Allowlist lives in two files (DEBT-006). Requires enabling the Email/Password + Email-link provider in Firebase.

## D-008 — Reformed SQL via text transform (sde_decrypt), suggestions only otherwise
- **Decision:** Generate reformed BQ SQL by wrapping PII columns with `sde_decrypt('<pii_role_id>', col)`; other selected suggestions are added as review comments, not auto-rewritten.
- **Reasoning:** PII decrypt is a safe, local transform; broader rewrites are risky without a real parser.
- **Consequences:** Best-effort, review-required (DEBT-001). Decrypt UDF signature needs SME confirmation.

> ADRs in `docs/adr/` mirror these decisions in the companion's ADR format.
