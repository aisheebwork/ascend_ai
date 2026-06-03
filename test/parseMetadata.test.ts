import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseDatasets, mergeTables, isTableMetadata } from "../functions/_lib/parseMetadata.ts";
import { analyzeSql } from "../functions/_lib/analyzer.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const metaDir = join(__dirname, "..", "metadata");

test("parseDatasets parses the raw triumph_transactions metadata files", () => {
  const raw = JSON.parse(readFileSync(join(metaDir, "triumph_transactions_part1.json"), "utf8"));
  const tables = parseDatasets(raw);
  assert.equal(tables.length, 1);
  const t = tables[0];
  assert.equal(t.tableName, "triumph_transactions");
  assert.equal(t.requirePartitionFilter, true);
  const cm15 = t.attributes.find((a) => a.name === "cm15");
  assert.equal(cm15?.isSensitive, true);
  assert.equal(cm15?.piiRoleId, "NGBD-SDE-CM15");
});

test("mergeTables combines attributes across multi-part files (deduped)", () => {
  const p1 = parseDatasets(JSON.parse(readFileSync(join(metaDir, "triumph_transactions_part1.json"), "utf8")));
  const p3 = parseDatasets(JSON.parse(readFileSync(join(metaDir, "triumph_transactions_part3.json"), "utf8")));
  const merged = mergeTables([...p1, ...p3]);
  assert.equal(merged.length, 1);
  const t = merged[0];
  // part3 holds the partitioned column date_stmt_yr
  const part = t.attributes.find((a) => a.isPartitioned);
  assert.equal(part?.name, "date_stmt_yr");
  // no duplicate column names
  const names = t.attributes.map((a) => a.name);
  assert.equal(new Set(names).size, names.length);
});

test("isTableMetadata validates shape", () => {
  assert.equal(isTableMetadata({ tableName: "x", requirePartitionFilter: false, attributes: [] }), true);
  assert.equal(isTableMetadata({ tableName: "x" }), false);
  assert.equal(isTableMetadata(null), false);
});

test("analyzeSql uses user-supplied extra tables", () => {
  const extra = parseDatasets(
    JSON.parse(readFileSync(join(metaDir, "triumph_transactions_part1.json"), "utf8"))
  ).map((t) => ({ ...t, tableName: "my_new_table" }));

  const sql = "select cm15 from `proj.ds.my_new_table` where cm15 = 'x'";
  // Without extra tables: unknown table, no PII findings.
  const base = analyzeSql(sql);
  assert.ok(base.unknownTables.includes("my_new_table"));
  assert.equal(base.piiFindings.length, 0);

  // With extra tables: resolves and flags cm15 PII used in filter.
  const withExtra = analyzeSql(sql, extra);
  assert.ok(withExtra.detectedTables.includes("my_new_table"));
  const cm15 = withExtra.piiFindings.find((f) => f.column === "cm15");
  assert.equal(cm15?.usedInFilter, true);
});
