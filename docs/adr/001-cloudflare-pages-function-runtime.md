# ADR 001 — Run analysis logic in Cloudflare Pages Functions

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
The app needs server-side logic to run the analyzer and call Gemini with a
secret key, while the frontend is hosted on Cloudflare Pages and auth/storage is
Firebase.

## Problem
Where should the analysis + Gemini call run so the key stays server-side and
hosting stays simple/free?

## Decision
Run the logic in a Cloudflare Pages Function (`/api/analyze`). Use Firebase only
for Auth + Firestore.

## Alternatives
- Firebase Cloud Functions — needs the Blaze (paid) plan for outbound calls.
- Client-side Gemini call — would expose the API key. Rejected.

## Consequences
- Backend is split across two providers.
- ID tokens must be verified inside the Worker (see ADR 004).
- Free-tier friendly; co-located with the frontend deploy.

## Risks
Vendor lock-in (RISK-004, low).

## Migration considerations
Logic is provider-agnostic TypeScript; could move to another serverless runtime.

## References
`.agent/DECISIONS.md` D-001; `functions/api/analyze.ts`.
