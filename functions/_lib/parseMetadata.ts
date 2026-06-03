import type { ColumnAttribute, TableMetadata } from "./types";

// Parses the raw "Cornerstone" dataset JSON (the same shape as the files in
// /metadata) into normalized TableMetadata. This mirrors scripts/build-metadata.mjs
// so the frontend can accept user-uploaded metadata in the exact same format and
// produce records compatible with the built-in bundle.

function attrFromRaw(a: any): ColumnAttribute | null {
  const det = a?.attribute_details ?? {};
  const sens = a?.sensitivity_details ?? {};
  const cde = a?.cde_details ?? {};
  const name = String(det.attribute_name ?? a?.attribute_name ?? "").toLowerCase();
  if (!name) return null;
  return {
    name,
    attributeType: det.attribute_type ?? null,
    isPartitioned: det.is_partitioned === true,
    partitionPosition: det.partition_position ?? 0,
    isSensitive: sens.is_sensitive === true,
    piiRoleId: sens.pii_role_id ?? null,
    isGdpr: sens.is_gdpr === true,
    isOncop: sens.is_oncop === true,
    dataClassification: cde.data_classification ?? null,
    businessName: det.business_name ?? null,
    desc: det.attribute_desc ?? null,
  };
}

function tableNameOf(ds: any): string | null {
  return (
    ds?.external_reference_details?.table_name ||
    ds?.dataset_source_details?.table_name ||
    ds?.display_name ||
    null
  );
}

/**
 * Merge a list of tables, combining attributes for tables that share a name
 * (deduped by column name — first occurrence wins). `requirePartitionFilter`
 * is true if true in any contributing entry.
 */
export function mergeTables(tables: TableMetadata[]): TableMetadata[] {
  const byName = new Map<string, TableMetadata & { _seen: Set<string> }>();
  for (const t of tables) {
    const key = t.tableName.toLowerCase();
    let cur = byName.get(key);
    if (!cur) {
      cur = { ...t, attributes: [], _seen: new Set<string>() };
      byName.set(key, cur);
    }
    if (t.requirePartitionFilter) cur.requirePartitionFilter = true;
    for (const a of t.attributes) {
      if (cur._seen.has(a.name)) continue;
      cur._seen.add(a.name);
      cur.attributes.push(a);
    }
  }
  return [...byName.values()].map(({ _seen, ...rest }) => {
    void _seen;
    rest.attributes = rest.attributes.sort((a, b) => a.name.localeCompare(b.name));
    return rest;
  });
}

/**
 * Parse raw dataset JSON (array of datasets, or a single dataset object) into
 * normalized, merged TableMetadata entries.
 */
export function parseDatasets(raw: unknown): TableMetadata[] {
  const datasets = Array.isArray(raw) ? raw : [raw];
  const tables: TableMetadata[] = [];
  for (const ds of datasets) {
    const tableName = tableNameOf(ds);
    if (!tableName) continue;
    const rawAttrs = (ds as any)?.schema?.schema_attributes ?? [];
    const attributes = rawAttrs
      .map(attrFromRaw)
      .filter((x: ColumnAttribute | null): x is ColumnAttribute => x !== null);
    tables.push({
      tableName,
      displayName: (ds as any)?.display_name ?? tableName,
      dbName: (ds as any)?.external_reference_details?.table_db_name ?? null,
      requirePartitionFilter:
        (ds as any)?.dataset_source_details?.require_partition_filter === true,
      attributes,
    });
  }
  return mergeTables(tables);
}

/** Lightweight runtime validation of a TableMetadata object (for API input). */
export function isTableMetadata(x: unknown): x is TableMetadata {
  const t = x as any;
  return (
    !!t &&
    typeof t.tableName === "string" &&
    typeof t.requirePartitionFilter === "boolean" &&
    Array.isArray(t.attributes)
  );
}
