# How the RAG Agent Works — End to End

**Purpose:** Explain the analysis/RAG workflow for every audience.
**Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [ARCHITECTURE](../.agent/ARCHITECTURE.md) · [PROMPT_LIBRARY.md](PROMPT_LIBRARY.md) · [DATA_MODEL.md](DATA_MODEL.md)

> **RAG = Retrieval-Augmented Generation:** *retrieve* the right facts first, then
> let the AI *generate* using those facts (instead of guessing from memory).

---

## 1. For a complete beginner (plain words)

Think of it like a **spell-checker for database queries**, with a smart assistant:

1. You paste a query and click **Analyze**.
2. The tool looks up a **rulebook** about your tables (which columns are secret/PII,
   which column the table is organized by).
3. It **highlights problems**: "this secret column is used unprotected", "you forgot
   the required filter".
4. It shows a **fixed version** of your query. If admins have added **good examples**,
   the assistant rewrites it to **match your team's style**; otherwise it uses a
   built-in safe rule.
5. You can tick which fixes you want and **download** the corrected query.

The "RAG" part = the assistant is shown your rulebook + your examples *before* it
writes anything, so it stays accurate and on-style.

---

## 2. For a non-technical stakeholder

- **Problem solved:** engineers sometimes expose sensitive (PII) data or run slow,
  costly queries by forgetting a required filter. Both are policy/cost risks.
- **What the tool does:** checks each query against governed **metadata**, flags
  PII + partition issues, and proposes corrected SQL.
- **Why it's trustworthy:** the *detection* is deterministic (rule-based, not guessed).
  The AI only writes the explanations and the styled corrected query, and is always
  shown the real facts + approved examples first.
- **It improves over time:** admins add more table metadata and more "reformed
  examples"; the tool gets broader coverage and better-styled fixes — no code change.
- **Safety net:** if the AI is unavailable, the tool still works with built-in rules.

---

## 3. For a technical reader (the pipeline)

```
User pastes SQL ─► /api/analyze (Cloudflare Pages Function)
   1. AUTH        verify Firebase ID token (jose + Google JWKS)
   2. RETRIEVE    merge built-in metadata bundle + shared metadata (Firestore)
                  + reformed examples (Firestore)  ← the "R" in RAG
   3. ANALYZE     deterministic engine:
                    • PII findings  (is_sensitive + pii_role_id, used-in-filter?)
                    • partition findings (require_partition_filter, present?)
                    • anomalies (SELECT *, no WHERE, CROSS JOIN, LIMIT w/o ORDER)
   4. AUGMENT+GEN Gemini is given findings + examples and:
                    • refines each suggestion's wording (+ may add anomalies)
                    • generates example-styled "reformed SQL"  ← the "AG" in RAG
   5. FALLBACK     no key / error → deterministic suggestions + rule-based reform
   ◄── returns { findings, suggestions, aiReformedSql }
Client renders findings + suggestions; reformed SQL panel toggles AI / rule-based;
the run is saved to Firestore history.
```

**Key point:** detection is **deterministic and testable**; the LLM is confined to
wording + the styled rewrite, and is grounded by retrieved metadata + examples.

---

## 4. For a developer (where the code lives)

| Stage | Code | Notes |
|---|---|---|
| Retrieve metadata | `functions/_lib/metadata.ts` (`createTableResolver`) + `src/lib/metadataStore.ts` | built-in bundle + Firestore `sharedMetadata`, sent as `extraTables` |
| Retrieve examples | `src/lib/reformedExamples.ts` | Firestore `reformedExamples`, sent as `examples` |
| Deterministic analysis | `functions/_lib/analyzer.ts` | `analyzeSql()`, `detectAnomalies()` |
| Suggestion wording (RAG) | `functions/_lib/gemini.ts` (`buildSuggestions`) | refines messages by id; adds anomalies |
| Reformed SQL (RAG) | `functions/_lib/gemini.ts` (`generateReformedSql`) | few-shot from `reformedExamples`; falls back to `reformer.ts` |
| Rule-based reform | `functions/_lib/reformer.ts` | `sde_decrypt('TAG', col)` + comment annotations |
| Endpoint | `functions/api/analyze.ts` | auth, caps, returns `aiReformedSql` |
| UI | `src/components/Results.tsx` | AI vs rule-based toggle, checkboxes, download |

### Make the RAG actually "learn" from examples — prerequisites
1. **A valid Gemini API key** in Cloudflare (`GEMINI_API_KEY`). A placeholder/invalid
   key makes every Gemini call fail → the tool silently falls back to the rule-based
   reform (the "old style"). Real AI Studio keys start with `AIza…`.
2. **Reformed examples added in `/admin`** (original → reformed pairs). These are sent
   as few-shot context to `generateReformedSql`.
3. With both present, the "Reformed BigQuery SQL" panel defaults to **AI (your
   examples)**; you can toggle to **Rule-based**.

> There is no offline "training" step — RAG is *in-context learning*: examples are
> injected into the prompt at request time. Add/curate examples → immediate effect
> on the next analysis (no retraining, no redeploy).

### Limits
- Reformed SQL (both AI and rule-based) is **best-effort** — review before running
  (DEBT-001). Confirm the `sde_decrypt(...)` UDF signature with a data SME.
- All metadata + examples are sent per request (DEBT-005) — fine at current scale.
