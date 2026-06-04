# ADR 004 — Verify Firebase ID tokens via jose + JWKS

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
The Pages Function must authorize requests but runs in a Worker without a
Firebase Admin SDK / service account.

## Problem
How to verify Firebase ID tokens server-side without heavy credentials?

## Decision
Verify the RS256 JWT with the `jose` library against Google's JWKS endpoint,
checking `issuer` and `audience` equal the Firebase project id.

## Alternatives
- Firebase Admin SDK — needs a service-account secret in the Worker; heavier. Rejected.
- No verification — insecure. Rejected.

## Consequences
- Lightweight, no service account.
- No token-revocation check (DEBT-002 / RISK-008).

## Risks
Revoked-but-unexpired tokens accepted until expiry (low; short lifetimes).

## Migration considerations
Adopt Admin SDK if revocation checks become required.

## References
`.agent/DECISIONS.md` D-004; `functions/_lib/auth.ts`.
