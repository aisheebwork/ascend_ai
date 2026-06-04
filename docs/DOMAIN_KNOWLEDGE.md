# Domain Knowledge

**Purpose:** Preserve the domain expertise needed to understand this project.
**Audience:** anyone new to Amex data governance / BigQuery. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [GLOSSARY.md](GLOSSARY.md) · [DATA_MODEL.md](DATA_MODEL.md)

> Some specifics below are inferred from the sample metadata and may need
> confirmation by a data governance SME — marked **[Needs Human Validation]**.

## 1. Governed metadata (Cornerstone)
Each table has a metadata document describing every column and governance
attributes. Key fields the tool relies on:
- `external_reference_details.table_name` — the table identifier.
- `dataset_source_details.require_partition_filter` — whether a partition filter is mandatory.
- per attribute: `attribute_details.is_partitioned` / `partition_position`,
  `sensitivity_details.is_sensitive` / `pii_role_id`, `cde_details.data_classification`.

## 2. PII & SDE (sensitive data encryption)
- Columns flagged `is_sensitive` carry a `pii_role_id` (an **SDE tag**, e.g.
  `NGBD-SDE-CM15`) indicating they are protected/encrypted.
- To compare/filter such a column correctly, it must be **decrypted** first.
- Example sensitive columns: `cm13` (Plastic Number), `cm15` (Transaction Plastic).
- `data_classification` (e.g. "AXP Restricted") indicates handling level.
- **Decrypt syntax** used by the reformer: `sde_decrypt('<pii_role_id>', <col>)`
  — e.g. `sde_decrypt('NGBD-SDE-CM15', cm15)`. **[Needs Human Validation]** confirm
  this matches the actual Amex UDF signature before relying on reformed SQL in production.

## 3. Partitioning in BigQuery
- Large tables are partitioned by a column (here `date_stmt_yr`, an integer year).
- When `require_partition_filter` is true, every query **must** filter on the
  partition column, or BigQuery rejects it / scans the whole table (slow, costly).
- Filtering on the partition column enables **partition pruning**.

## 4. The two flows (source of the algorithm)
- **Flow 1 (PII):** find tables → metadata lookup → find `is_sensitive` columns +
  SDE tags → if used in a filter, advise decrypt. (`architecture_resources/Flow_1.jpg`)
- **Flow 2 (Partition):** find tables → metadata lookup → find partition column →
  if not in a filter (and required), advise adding one. (`Flow_2.jpg`)

## 5. SQL/HQL specifics
- Queries reference tables as `project.dataset.table` (often backticked).
- "Filter" here means `WHERE`, `JOIN ... ON`, and `HAVING` regions.
- Comments (`--`, `/* */`) are stripped before analysis so commented clauses don't count.
