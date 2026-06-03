import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  analyzeSql,
  extractTableRefs,
  extractFilterText,
} from "../functions/_lib/analyzer.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleSql = readFileSync(
  join(__dirname, "..", "sample_hql_sql", "F295530_USDREE_V2.0.0_billed_only.sql"),
  "utf8"
);

test("extracts the governed triumph_transactions table ref", () => {
  const refs = extractTableRefs(sampleSql);
  assert.ok(
    refs.some((r) => r.toLowerCase().endsWith("triumph_transactions")),
    `expected a triumph_transactions ref, got: ${refs.join(", ")}`
  );
});

test("sample SQL: detects triumph_transactions in governed metadata", () => {
  const r = analyzeSql(sampleSql);
  assert.ok(r.detectedTables.includes("triumph_transactions"));
});

test("sample SQL: flags cm15 as PII used in a filter", () => {
  const r = analyzeSql(sampleSql);
  const cm15 = r.piiFindings.find((f) => f.column === "cm15");
  assert.ok(cm15, "expected a cm15 PII finding");
  assert.equal(cm15!.piiRoleId, "NGBD-SDE-CM15");
  assert.equal(cm15!.usedInFilter, true);
});

test("sample SQL: flags missing partition filter on date_stmt_yr", () => {
  const r = analyzeSql(sampleSql);
  const part = r.partitionFindings.find((f) => f.column === "date_stmt_yr");
  assert.ok(part, "expected a date_stmt_yr partition finding");
  assert.equal(part!.requirePartitionFilter, true);
  // date_stmt_yr only appears in a comment in the sample → not in a real filter.
  assert.equal(part!.presentInFilter, false);
});

test("filter text excludes commented-out clauses", () => {
  const ft = extractFilterText(sampleSql);
  // `--date_stmt_yr >= lookback_year` is commented; must not be in filter text.
  assert.ok(!/date_stmt_yr/.test(ft));
});

test("a partition filter that IS present is detected", () => {
  const sql =
    "select cm15 from `axp-lumi.dw.triumph_transactions` where date_stmt_yr = 2024";
  const r = analyzeSql(sql);
  const part = r.partitionFindings.find((f) => f.column === "date_stmt_yr");
  assert.equal(part!.presentInFilter, true);
});
