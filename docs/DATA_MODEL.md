# Data Model

**Purpose:** Describe the important data structures and their lifecycle.
**Audience:** devs, AI agents. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [ARCHITECTURE](../.agent/ARCHITECTURE.md) · [SECURITY_MODEL.md](SECURITY_MODEL.md) · [GLOSSARY.md](GLOSSARY.md)

The canonical TypeScript types live in [`functions/_lib/types.ts`](../functions/_lib/types.ts).

## Entities

### TableMetadata (governed table)
Normalized from raw Cornerstone metadata by `parseMetadata.ts` / `build-metadata.mjs`.
- `tableName`, `displayName`, `dbName`
- `requirePartitionFilter: boolean`
- `attributes: ColumnAttribute[]`
- **Owner:** governance/source metadata. **Lifecycle:** built-in (compile-time bundle) or shared (Firestore, runtime). **Dedup:** by lowercased column name.

### ColumnAttribute
- `name`, `attributeType`, `isPartitioned`, `partitionPosition`
- `isSensitive`, `piiRoleId` (SDE tag), `isGdpr`, `isOncop`
- `dataClassification`, `businessName`, `desc`

### AnalysisResult (API output)
- `detectedTables[]`, `unknownTables[]`
- `piiFindings[]` (table, column, piiRoleId, dataClassification, usedInQuery, usedInFilter)
- `partitionFindings[]` (table, column, requirePartitionFilter, presentInFilter)
- `suggestions[]` (severity, category, table, column, message)
- `geminiUsed: boolean`

## Stores

### Built-in metadata bundle — `functions/_lib/metadata.bundle.json`
- Generated from `metadata/*.json` at build (`npm run build:metadata`). **Gitignored**, regenerated each build.
- Shape: `{ tables: Record<tableName, TableMetadata> }`.

### Firestore — `users/{uid}/analyses/{analysisId}`
- `{ fileName, sqlText, result: AnalysisResult, createdAt }`
- **Owner:** the user. **Access:** owner only (rules). **Retention:** until user/app deletes (no auto-expiry).

### Firestore — `sharedMetadata/{tableId}`
- `tableId` = sanitized lowercased table name (dedup key).
- `{ tableName, displayName, dbName, requirePartitionFilter, attributes, addedByEmail, updatedAt }`
- **Owner:** shared/team. **Access:** any signed-in user may read & create/update; **no delete** (rules). **Lifecycle:** grows over time; re-upload merges attributes.

## Relationships
```
metadata/*.json ──build──► metadata.bundle.json ──┐
                                                   ├─► analyzer (createTableResolver)
sharedMetadata (Firestore) ──client──► extraTables ┘
                                                   └─► AnalysisResult ──► users/{uid}/analyses
```

## Schema-change governance
Changing `TableMetadata`/`ColumnAttribute` affects `types.ts`, `parseMetadata.ts`,
`build-metadata.mjs`, the analyzer, and stored Firestore docs. Update all together,
and note migration impact for existing `sharedMetadata` docs.
