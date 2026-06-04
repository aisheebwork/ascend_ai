# ADR 003 — Deterministic metadata lookup, not vector RAG

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
The metadata is small and highly structured (governance flags per column).

## Problem
Should retrieval use vector embeddings (RAG) or exact lookups?

## Decision
Use deterministic, exact metadata lookups (flags + SDE tags) to produce
findings; Gemini only phrases the advice.

## Alternatives
- Vector/embedding RAG — imprecise for exact flag lookups; more infra. Rejected.
- Hybrid — unnecessary at current scale.

## Consequences
- Precise, cheap, testable findings.
- Adding tables = adding metadata (no embedding pipeline).

## Risks
Heuristic SQL parsing for filter detection (RISK-001 / DEBT-001) — independent of this decision.

## Migration considerations
Could layer embeddings later for fuzzy column/business-term search.

## References
`.agent/DECISIONS.md` D-003; `functions/_lib/analyzer.ts`, `metadata.ts`.
