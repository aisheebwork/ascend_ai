# ADR 005 — Frontend stack: React + Vite + Tailwind

- **Status:** Accepted
- **Date:** 2026-06-04

## Context
Need a fast SPA hostable on Cloudflare Pages with a simple results/forms UI.

## Problem
Which frontend stack?

## Decision
React + Vite + TailwindCSS, built to static `dist/` for Cloudflare Pages.

## Alternatives
- Next.js static export — heavier than needed.
- Plain React without Vite — slower DX.

## Consequences
- Fast builds; large JS bundle dominated by Firebase SDK (DEBT-003).

## Risks
Bundle size (low; cosmetic build warning).

## Migration considerations
Code-split Firebase or adopt a meta-framework later if needed.

## References
`.agent/DECISIONS.md` D-005; `vite.config.ts`, `src/`.
