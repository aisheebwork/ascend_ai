# Technical Debt

| ID | Description | Reason | Impact | Risk | Priority | Proposed Resolution | Status |
|---|---|---|---|---|---|---|---|
| DEBT-001 | SQL analysis uses regex/token heuristics, not a real BigQuery parser (`functions/_lib/analyzer.ts`). | Fast to build; sufficient for governed-metadata advisory. | May miss exotic constructs (alias shadowing, dynamic SQL, CTE column renames). Never produces wrong rewrites (we never rewrite). | Medium | Medium | Integrate a real BigQuery grammar / SQL AST parser for filter-clause detection. | Open |
| DEBT-002 | ID-token verification uses `jose` + Google JWKS rather than the Firebase Admin SDK. | Admin SDK is heavy / needs a service account inside the Worker. | Must keep issuer/audience checks correct; no revocation check. | Low | Low | Revisit if session revocation becomes a requirement. | Accepted |
| DEBT-003 | Frontend JS bundle > 500 kB (Firebase SDK). | Hackathon scope. | Slightly slower first load. | Low | Low | Code-split Firestore/Auth, or use modular dynamic imports. | Open |
| DEBT-004 | Metadata currently covers a single built-in table (`triumph_transactions`). | Only sample provided. | Unknown tables reported as "unknown" (no findings). | Low | Low | Add more via the "Add metadata" feature (shared `sharedMetadata`) or bundled files. | Mitigated |
| DEBT-005 | The client sends ALL shared metadata tables in each `/api/analyze` request. | Keeps the Pages Function stateless (no Firestore credentials in the Worker). | Request grows with the library; fine for hundreds of tables, not thousands. | Low | Low | Move metadata read server-side (Function reads Firestore) or send only tables referenced by the SQL. | Open |
