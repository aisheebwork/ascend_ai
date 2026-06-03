// Merges metadata/*.json (the multi-part triumph_transactions schema, and any
// future tables) into a single compact lookup bundle consumed by the analyzer.
//
// Output: functions/_lib/metadata.bundle.json
//   { tables: { <table_name>: { tableName, requirePartitionFilter, dbName,
//       displayName, attributes: [ { name, isPartitioned, partitionPosition,
//       isSensitive, piiRoleId, dataClassification, businessName, desc,
//       attributeType } ] } } }
//
// Multiple part files describing the same table are merged: their
// schema_attributes are concatenated and de-duplicated by attribute name.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const metaDir = join(root, "metadata");
const outFile = join(root, "functions", "_lib", "metadata.bundle.json");

/** @type {Record<string, any>} */
const tables = {};

function ingestDataset(ds) {
  const tableName =
    ds?.external_reference_details?.table_name ||
    ds?.dataset_source_details?.table_name ||
    ds?.display_name;
  if (!tableName) return;

  if (!tables[tableName]) {
    tables[tableName] = {
      tableName,
      displayName: ds.display_name ?? tableName,
      dbName: ds?.external_reference_details?.table_db_name ?? null,
      requirePartitionFilter:
        ds?.dataset_source_details?.require_partition_filter === true,
      _attrIndex: {}, // name -> attribute (deduped), stripped before write
    };
  }
  const t = tables[tableName];
  // require_partition_filter true wins if seen in any part
  if (ds?.dataset_source_details?.require_partition_filter === true) {
    t.requirePartitionFilter = true;
  }

  const attrs = ds?.schema?.schema_attributes ?? [];
  for (const a of attrs) {
    const det = a.attribute_details ?? {};
    const sens = a.sensitivity_details ?? {};
    const cde = a.cde_details ?? {};
    const name = (det.attribute_name ?? a.attribute_name ?? "").toLowerCase();
    if (!name) continue;
    // First occurrence wins; later parts only fill gaps.
    if (t._attrIndex[name]) continue;
    t._attrIndex[name] = {
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
}

const files = readdirSync(metaDir).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error(`No metadata JSON files found in ${metaDir}`);
  process.exit(1);
}

for (const f of files) {
  const raw = JSON.parse(readFileSync(join(metaDir, f), "utf8"));
  const datasets = Array.isArray(raw) ? raw : [raw];
  for (const ds of datasets) ingestDataset(ds);
}

// Finalize: convert _attrIndex maps to sorted arrays.
const bundle = { tables: {} };
for (const [name, t] of Object.entries(tables)) {
  const attributes = Object.values(t._attrIndex).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  delete t._attrIndex;
  bundle.tables[name] = { ...t, attributes };
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(bundle, null, 2));

// Report summary so the build log is useful.
for (const [name, t] of Object.entries(bundle.tables)) {
  const pii = t.attributes.filter((a) => a.isSensitive).map((a) => a.name);
  const part = t.attributes.filter((a) => a.isPartitioned).map((a) => a.name);
  console.log(
    `[metadata] ${name}: ${t.attributes.length} cols | requirePartitionFilter=${t.requirePartitionFilter} | partition=[${part.join(", ")}] | pii=[${pii.join(", ")}]`
  );
}
console.log(`[metadata] wrote ${outFile}`);
