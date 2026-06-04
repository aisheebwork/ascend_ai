# Product Vision

**Purpose:** Why the product exists and where it's headed.
**Audience:** all. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [FEATURE_CATALOG.md](FEATURE_CATALOG.md) · [USER_FLOWS.md](USER_FLOWS.md)

> Parts of this document reflect product judgment and are marked
> **[Needs Human Validation]**.

## Vision statement
Make governed-data best practices automatic for every BigQuery query an Amex
engineer writes — so PII is always handled correctly and partitioned tables are
always queried efficiently.

## Mission
Given a SQL/HQL query, instantly surface the PII and partition implications from
governed metadata and advise the exact edits to make — without rewriting the
engineer's query for them.

## Problem statement
Engineers frequently (1) use PII/SDE-tagged columns in filters without
decrypting them, and (2) query partition-required tables without a partition
filter (full scans, cost). Both are detectable from metadata but easy to miss.

## Target audience / personas
- **Data Engineer (primary):** writes BigQuery SQL against governed tables.
- **Data Steward / Governance [Needs Human Validation]:** may use it to spot-check compliance.

## Value proposition
- Catch compliance (PII) and cost (partition) issues *before* running a query.
- Advice, not automation — the engineer stays in control of their SQL.
- A metadata library that improves over time as the team adds tables.

## Product principles
- **Advise, don't rewrite** — suggestions only; the user owns their SQL.
- **Deterministic first** — exact metadata lookups; AI only phrases the advice.
- **Always works** — rule-based fallback if AI is unavailable.
- **Knowledge is shared and portable** — metadata grows with the team.
- **Minimize vendor lock-in** — analysis logic is provider-agnostic.

## Strategic goals [Needs Human Validation]
- Expand governed-metadata coverage across more Amex tables.
- Optionally integrate into CI / query editors.

## Non-goals
- Rewriting or executing SQL; reading row-level data; a chat assistant.

## Competitive landscape / differentiators [Needs Human Validation]
- Internal governance tooling; differentiator is metadata-driven, advise-only UX.

## Future direction [Needs Human Validation]
- Real BigQuery parser (DEBT-001), server-side metadata read (DEBT-005),
  export/share results, per-finding review state.
