# ADR 008 — Reformed SQL generation (sde_decrypt), suggestions otherwise

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
Users want reformed BQ SQL with PII decryption applied, plus the ability to pick
which suggestions to apply and download the result.

## Problem
How to produce reformed SQL safely without a full SQL parser?

## Decision
Wrap PII columns with `sde_decrypt('<pii_role_id>', <col>)` via a careful
text transform (`functions/_lib/reformer.ts`). PII decrypts are applied inline;
other selected suggestions (partition, anomalies) are added as review comments,
not auto-rewritten. Users tick suggestions; the reformed SQL updates live and
can be downloaded.

## Alternatives
- Full AST rewrite — needs a real BigQuery parser (out of scope now).
- LLM-rewritten SQL — risky/non-deterministic; rejected (we keep Gemini to wording only).

## Consequences
- Deterministic, reviewable output; best-effort text matching (DEBT-001).
- Decrypt UDF signature must be confirmed by an SME.

## Risks
RISK-001 (heuristic parsing).

## Migration considerations
Swap the text transform for AST-based rewriting when a parser is adopted.

## References
`.agent/DECISIONS.md` D-008; `functions/_lib/reformer.ts`, `src/components/Results.tsx`.
