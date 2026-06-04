# ADR 006 — Shared metadata library in Firestore

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
Built-in metadata covers one table. Users need to extend coverage over time
without redeploying.

## Problem
Where to store user-added metadata, and how to feed it to the analyzer?

## Decision
Store user-added tables in a shared Firestore `sharedMetadata` collection (any
signed-in user can read & create/update; delete denied). The SPA sends them as
`extraTables` on each `/api/analyze` request; the analyzer merges them over the
built-in bundle (extra overrides by table name).

## Alternatives
- Per-user metadata — less collectively useful.
- Server reads Firestore — needs Admin credentials in the Worker.
- Rebuild the bundle per upload — no live updates.

## Consequences
- Live, shared, growing knowledge base; Function stays stateless.
- Any user can add imperfect metadata (RISK-003).
- Request grows with library size (DEBT-005).

## Risks
RISK-003 (quality/abuse), RISK-006/DEBT-005 (payload size).

## Migration considerations
Move metadata read server-side or scope to tables referenced by the SQL; add
ownership/validation. Existing docs are forward-compatible.

## References
`.agent/DECISIONS.md` D-006; `src/lib/metadataStore.ts`, `functions/_lib/metadata.ts`, `firestore.rules`.
