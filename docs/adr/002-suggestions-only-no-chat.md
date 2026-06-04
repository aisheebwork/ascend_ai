# ADR 002 — Suggestions only; no SQL rewriting; no chat

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
The original idea included a chat session and SQL editing. The user redirected
to a focused tool.

## Problem
Should the tool rewrite SQL and offer a chat, or just advise?

## Decision
The tool detects issues and gives plain-language **suggestions only**. No SQL
rewriting and no chat UI. "Previous chats" becomes per-user analysis history.

## Alternatives
- Auto-rewrite SQL — higher risk, lower trust; rejected.
- Chat assistant — out of scope; rejected.

## Consequences
- Gemini is instructed never to emit SQL.
- Simpler, lower-risk UX; engineer stays in control.

## Risks
None significant.

## Migration considerations
Rewriting could be added later as an opt-in without changing detection.

## References
`.agent/DECISIONS.md` D-002; `functions/_lib/gemini.ts`.
