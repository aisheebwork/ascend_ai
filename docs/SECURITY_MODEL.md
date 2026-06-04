# Security Model

**Purpose:** Document authentication, authorization, secrets, and trust boundaries.
**Audience:** devs, reviewers, security. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [DATA_MODEL.md](DATA_MODEL.md) · [RISK_REGISTER.md](RISK_REGISTER.md) · [ARCHITECTURE](../.agent/ARCHITECTURE.md)

## Authentication
- Firebase **Google Sign-In** in the SPA.
- The Pages Function requires a Firebase **ID token** (`Authorization: Bearer`).
- Tokens are verified server-side with **`jose`** against Google's **JWKS**, checking
  `issuer = https://securetoken.google.com/<project>` and `audience = <project>`
  (`functions/_lib/auth.ts`). No Firebase Admin SDK / service account in the Worker.

## Authorization
- **Admin allowlist:** `functions/_lib/admins.ts` (app/UI gating), mirrored in
  `firestore.rules` `isAdmin()` (DB enforcement). Keep the two in sync (DEBT-006).
- **Admin sign-in:** Google or passwordless **email link** (`sendSignInLinkToEmail` /
  `signInWithEmailLink`). No passwords (so no default-password/forced-change flow).
- Firestore rules (`firestore.rules`):
  - `users/{uid}/analyses/**` — read/write only when `request.auth.uid == uid`.
  - `sharedMetadata/**` — read: any signed-in user; create/update: **admins only**; no delete.
  - `sharedSql/**` — read & create: **admins only**; no update/delete.
  - `reformedExamples/**` — read: any signed-in user (RAG context); create: **admins only**; no delete.
- The analyze endpoint rejects unauthenticated calls (401) and non-POST (405).

## Secrets management
| Secret | Where | Never |
|---|---|---|
| `GEMINI_API_KEY` | CF Pages secret + local `.dev.vars` (gitignored) | committed; `VITE_`-prefixed |
| `FIREBASE_PROJECT_ID` | CF Pages secret + `.dev.vars` | committed |
| `VITE_FIREBASE_*` | `.env.production` (committed) | — public web config, safe by design |

- GitHub **push protection** is relied upon as a backstop (it already blocked one accidental key commit; resolved by history rewrite).

## Data protection
- The tool processes **SQL text and metadata only** — it does not read or move row-level data.
- Metadata may contain owner contact emails; stored in Firestore behind auth.

## Trust boundaries
```
Browser (untrusted input: SQL, metadata JSON)
  │  Firebase ID token
  ▼
Pages Function (trusted): verifies token, validates/caps input
  │  GEMINI_API_KEY (server-only)
  ▼
Gemini API (external)        Firestore (rules-enforced, client-side writes)
```

## Input validation
- `sql` capped at 200 KB; `extraTables` validated by shape and capped at 500 tables.
- Gemini is instructed not to emit SQL; output is parsed/validated before return.

## Threat model (summary — see RISK_REGISTER.md)
| Threat | Mitigation | Residual |
|---|---|---|
| Stolen/forged ID token | JWKS signature + iss/aud checks | No revocation check (DEBT-002) |
| Gemini key leak | server-only, gitignored, push protection | Low |
| Malicious/garbage shared metadata | auth required; no delete; shape validation | Any user can still add bad data (RISK-003) |
| Oversized request (DoS) | size/count caps | Low |

## Security-change rule
Any change to auth, rules, secrets, or providers must update this file and
`RISK_REGISTER.md` (per WORKFLOW_COMPANION_01.md).
