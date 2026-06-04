# ADR 007 — Admin area, allowlist, passwordless email-link sign-in

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
Some capabilities (managing metadata, sharing test SQL, curating reformed
examples) should be restricted to admins.

## Problem
How to gate an admin area and authenticate admins?

## Decision
Add a `/admin` route. Maintain an email allowlist in `functions/_lib/admins.ts`
(app/UI gating) mirrored in `firestore.rules` `isAdmin()` (DB enforcement).
Admins sign in with Google or Firebase **passwordless email link**.

## Alternatives
- Email/password with default-password + forced change — more moving parts; user preferred email-link.
- Custom claims / roles via Admin SDK — heavier; needs server credentials.
- Single source allowlist in Firestore — possible, but user chose a committed file.

## Consequences
- No password flow (passwordless), so "default password / forced change" is N/A.
- Allowlist duplicated in two files (DEBT-006).
- Requires enabling Firebase Email/Password + Email-link sign-in and authorizing the domain.

## Risks
RISK-003 (admin-managed shared data quality).

## Migration considerations
Could move the allowlist to a Firestore doc referenced by both app and rules to
remove the duplication.

## References
`.agent/DECISIONS.md` D-007; `src/pages/Admin.tsx`, `src/components/AdminLogin.tsx`,
`functions/_lib/admins.ts`, `firestore.rules`.
