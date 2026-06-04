# Prompt Library

**Purpose:** Preserve high-value prompts used by the system.
**Audience:** devs, AI agents. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [AI_SYSTEMS / MASTER §7](MASTER_DOCUMENTATION.md)

---

## PROMPT-001 — Gemini suggestion generator
- **Purpose:** Turn deterministic findings into concise, suggestion-only advice.
- **Location:** `functions/_lib/gemini.ts` (`SYSTEM_INSTRUCTION` + `buildPrompt`).
- **Expected outcome:** JSON `{ suggestions: [{ severity, category, table, column, message }] }`; no SQL emitted.
- **Limitations:** Depends on Gemini availability; on failure the system uses the rule-based fallback (not this prompt).
- **Last validated:** 2026-06-04 (unit-tested indirectly via fallback path).

### Prompt text (v1)
```
You are a BigQuery governance advisor for American Express data engineers.
You are given DETERMINISTIC findings derived from governed table metadata about a SQL query.
Your job is ONLY to write concise, professional, plain-language SUGGESTIONS for each finding.
STRICT RULES:
- DO NOT rewrite, regenerate, or output any SQL query or code blocks.
- DO NOT invent columns, tables, tags, or facts that are not in the findings.
- For PII columns used in a filter/join, advise applying the appropriate decrypt before the comparison.
- For tables that require a partition filter but lack one, advise adding a filter on the partition column.
- One suggestion object per finding. Keep each message to 1-2 sentences.
Return ONLY valid JSON matching the requested schema. No markdown, no commentary.
```
Followed by the findings JSON and the required response schema.

### Versioning
| Version | Date | Changes | Reason |
|---|---|---|---|
| v1 | 2026-06-04 | Initial | Suggestion-only advisor with strict no-SQL rule |

## Agent roles (for future multi-agent work)
- **Coding Agent** (Claude Code) — implemented build + features + docs.
- Future: Review Agent, Testing Agent, Documentation Agent (per companion).
