# Requirement Traceability

**Purpose:** Link requirements → features → implementation → tests → release.
**Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [FEATURE_CATALOG.md](FEATURE_CATALOG.md)

Requirements are derived from the original request and the two architecture
flows (`architecture_resources/Flow_1.jpg`, `Flow_2.jpg`).

| Req | Requirement | Feature | Implementation | Tests | Release |
|---|---|---|---|---|---|
| REQ-001 | Users log in via Google | FEATURE-001 | `Login.tsx`, `firebase.ts`, `auth.ts` | manual (auth) | 0.1.0 |
| REQ-002 | Upload HQL/SQL to analyze | FEATURE-002 | `SqlUploader.tsx` | manual | 0.1.0 |
| REQ-003 | Get PII column info from metadata + flag filter use | FEATURE-003 | `analyzer.ts`, `metadata.ts` | `analyzer.test.ts` (cm15) | 0.1.0 |
| REQ-004 | Get partition info; flag missing partition filter | FEATURE-004 | `analyzer.ts` | `analyzer.test.ts` (date_stmt_yr) | 0.1.0 |
| REQ-005 | Suggest edits (no rewriting) | FEATURE-005 | `gemini.ts` | covered via findings | 0.1.0 |
| REQ-006 | Refer to previous analyses ("previous chats") | FEATURE-006 | `analyses.ts`, `HistoryPanel.tsx` | manual | 0.1.0 |
| REQ-007 | Keep adding metadata over time | FEATURE-007 | `parseMetadata.ts`, `metadataStore.ts`, `MetadataManager.tsx` | `parseMetadata.test.ts` | 0.2.0 |

## Traceability chain
```
Requirement → Feature → Implementation → Tests → Release
```
Every implemented feature above traces to a requirement and a release entry in
[RELEASE_NOTES.md](RELEASE_NOTES.md).
