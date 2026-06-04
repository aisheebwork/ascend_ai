# Glossary

**Purpose:** Define every domain, technical, and product term so any reader
(technical or not) can understand the project. **Audience:** all contributors.
**Last Updated:** 2026-06-04. **Owner:** project.

Each entry: **Term — Category — Definition — Simple explanation — Related.**

---

### PII (Personally Identifiable Information)
- **Category:** Domain / Security
- **Definition:** Data that can identify an individual.
- **Simple:** Info that points to a real person — here, things like a card/plastic number.
- **Related:** [[SDE]], [[sensitive column]], `is_sensitive`

### Sensitive column (`is_sensitive`)
- **Category:** Metadata
- **Definition:** A column flagged in metadata as sensitive (`sensitivity_details.is_sensitive = true`).
- **Simple:** A column the governance system says must be handled carefully.
- **Related:** [[PII]], [[pii_role_id]]

### SDE tag (`pii_role_id`)
- **Category:** Domain / Security
- **Definition:** The encryption/role identifier on a sensitive column (e.g. `NGBD-SDE-CM15`).
- **Simple:** A label saying "this column is encrypted/protected under this rule" — used to know how to decrypt it.
- **Related:** [[PII]], [[decrypt]]

### Decrypt
- **Category:** Domain
- **Definition:** Applying the appropriate function to read an SDE-protected column before comparing/filtering on it.
- **Simple:** Unlock the protected value so a `WHERE`/`JOIN` comparison is correct.
- **Related:** [[SDE]], [[filter clause]]

### Partition column (`is_partitioned`)
- **Category:** BigQuery
- **Definition:** The column BigQuery physically partitions a table by (e.g. `date_stmt_yr`).
- **Simple:** The column BigQuery uses to split a big table into chunks so queries can skip irrelevant data.
- **Related:** [[require_partition_filter]], [[partition pruning]]

### `require_partition_filter`
- **Category:** BigQuery
- **Definition:** A table setting requiring every query to filter on the partition column.
- **Simple:** "You must filter by the partition column, or the query is rejected / scans everything."
- **Related:** [[partition column]], [[full table scan]]

### Partition pruning / full table scan
- **Category:** BigQuery
- **Definition:** Pruning = reading only needed partitions; full scan = reading the whole table (slow/costly).
- **Simple:** Filtering on the partition column lets BigQuery read less data and cost less.
- **Related:** [[partition column]]

### Filter clause
- **Category:** SQL
- **Definition:** `WHERE`, `JOIN ... ON`, and `HAVING` regions of a query.
- **Simple:** The parts of the query that decide which rows are kept.
- **Related:** [[decrypt]], [[partition column]]

### HQL
- **Category:** Tech
- **Definition:** Hive Query Language; SQL-like. Here treated like BigQuery SQL for analysis.
- **Simple:** A SQL dialect; the tool accepts `.sql`/`.hql`.

### Metadata (Cornerstone metadata)
- **Category:** Data
- **Definition:** JSON describing a table's columns and governance flags (sensitivity, partitioning, ownership).
- **Simple:** A description of a table — its columns and which are sensitive/partitioned.
- **Related:** [[metadata bundle]], [[shared metadata library]]

### Metadata bundle (`metadata.bundle.json`)
- **Category:** Build artifact
- **Definition:** Built-in metadata merged at build time from `metadata/*.json`.
- **Simple:** The pre-packaged table knowledge shipped with the app.
- **Related:** [[metadata]]

### Shared metadata library (`sharedMetadata`)
- **Category:** Feature / Data
- **Definition:** A Firestore collection of user-added tables merged into analyses at runtime.
- **Simple:** Metadata the team keeps adding so the tool learns more tables over time.
- **Related:** [[metadata]], FEATURE-007

### RAG (Retrieval-Augmented Generation)
- **Category:** AI
- **Definition:** Retrieving relevant context and giving it to an LLM. Here: deterministic metadata lookup feeding Gemini suggestion text.
- **Simple:** Look up the facts first, then let the AI explain them. (We use exact lookups, not embeddings.)
- **Related:** [[Gemini]]

### Gemini
- **Category:** AI / Vendor
- **Definition:** Google's LLM, called via REST to write suggestion text. Falls back to rule-based text on error.
- **Related:** [[RAG]], [[rule-based fallback]]

### Rule-based fallback
- **Category:** AI
- **Definition:** Deterministic templated suggestions produced when Gemini is unavailable.
- **Simple:** Built-in wording so the tool always works even without AI.

### Cloudflare Pages / Pages Function
- **Category:** Infra
- **Definition:** Static hosting (Pages) + serverless API in `/functions` (Pages Function = `/api/analyze`).
- **Simple:** Where the website and its small backend run.

### Firebase Auth / Firestore
- **Category:** Infra
- **Definition:** Google sign-in (Auth) and a NoSQL database (Firestore) for history + shared metadata.

### ID token (JWT)
- **Category:** Security
- **Definition:** A signed token proving the user is logged in; verified server-side via Google JWKS.
- **Related:** [[JWKS]]

### JWKS
- **Category:** Security
- **Definition:** Google's public keys used to verify ID-token signatures (via the `jose` library).
- **Simple:** The public keys the server uses to check a login token is genuine.

### Finding vs Suggestion
- **Category:** Product
- **Definition:** A **finding** is a detected fact (e.g. "cm15 is PII used in a filter"); a **suggestion** is the plain-language advice about it.
- **Simple:** Finding = what's true; suggestion = what to do.
