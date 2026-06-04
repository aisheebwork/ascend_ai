# AI AUDIT

Tracks AI-generated work, assumptions, and findings for transparency.

## Assumptions made by AI (and status)
| Assumption | Reason | Risk | Validation status |
|---|---|---|---|
| "Previous chats" → per-user saved analysis **history** | User removed chat; advise-only tool | Low | ✅ Confirmed by user |
| Analysis logic runs in Cloudflare Pages Functions (not Firebase Functions) | Free-tier, server-side key | Low | ✅ Confirmed by user |
| Deterministic metadata lookup, not vector RAG | Small structured metadata | Low | ✅ Confirmed by user |
| Shared (team-wide) metadata library, not per-user | "improve metadata for everyone" | Medium | ⚠️ Needs Human Validation (see RISK-003) |
| Gemini model `gemini-2.0-flash` via REST | Current flash model | Low | ⚠️ Confirm model id/availability |
| The provided Gemini key is a placeholder | Non-standard key format (`AQ.…` not `AIza…`) | Low | ⚠️ Tool falls back to rule-based if invalid |
| `sde_decrypt('<pii_role_id>', col)` is the correct decrypt UDF | User selected this option | Medium | ⚠️ Needs SME confirmation before relying on reformed SQL |
| Passwordless email-link is acceptable instead of password+forced-change | User chose email-link | Low | ✅ Confirmed (note: removes the password-change requirement) |
| Reformed SQL via text transform is "good enough" (best-effort) | No SQL parser | Medium | ⚠️ Review reformed SQL before running (DEBT-001) |

## AI-generated content governance
All code/docs here are AI-generated proposals; treat as drafts pending human
review. Accepted content is documented in `DECISIONS.md` / `docs/adr/`.

## Audit findings
| Finding | Impact | Recommendation | Status |
|---|---|---|---|
| Initial build skipped most `docs/` governance files | Reduced traceability | Create full governance set | ✅ Resolved 2026-06-04 |
| Secret (Gemini key) was committed into a doc once | Push blocked by GitHub | Removed; key only in `.dev.vars`/CF secret | ✅ Resolved |
| Client sends all shared metadata per request | Scales poorly at large size | Server-side read or scope by SQL | Open (DEBT-005) |

## Knowledge maturity (target: Level 4+)
Currently **Level 3 (Documented + Traceable)**; reaches Level 4 once a human
review/audit pass validates the flagged assumptions above.
