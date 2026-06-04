import { test } from "node:test";
import assert from "node:assert/strict";
import { wrapPiiColumn, buildReformedSql } from "../functions/_lib/reformer.ts";
import { detectAnomalies } from "../functions/_lib/analyzer.ts";

test("wrapPiiColumn wraps a bare column with sde_decrypt + tag", () => {
  const out = wrapPiiColumn("select cm15 from t where cm15 = 'x'", "cm15", "NGBD-SDE-CM15");
  assert.equal(
    out,
    "select sde_decrypt('NGBD-SDE-CM15', cm15) from t where sde_decrypt('NGBD-SDE-CM15', cm15) = 'x'"
  );
});

test("wrapPiiColumn preserves table qualifier", () => {
  const out = wrapPiiColumn("select a.cm15 from t a", "cm15", "TAG");
  assert.equal(out, "select sde_decrypt('TAG', a.cm15) from t a");
});

test("wrapPiiColumn does not double-wrap or hit longer identifiers", () => {
  // cm155 must not match cm15; already-wrapped stays single.
  const once = wrapPiiColumn("select cm155, cm15 from t", "cm15", "TAG");
  assert.equal(once, "select cm155, sde_decrypt('TAG', cm15) from t");
  const twice = wrapPiiColumn(once, "cm15", "TAG");
  assert.equal(twice, once, "should not double-wrap");
});

test("buildReformedSql applies decrypts and prepends annotations", () => {
  const sql = "select cm15 from t where cm15 = 'x'";
  const out = buildReformedSql(sql, {
    piiDecrypts: [{ column: "cm15", tag: "NGBD-SDE-CM15" }],
    annotations: ["Add a partition filter on date_stmt_yr"],
  });
  assert.ok(out.includes("sde_decrypt('NGBD-SDE-CM15', cm15)"));
  assert.ok(out.includes("-- ===== Reformed by BQ SQL Advisor ====="));
  assert.ok(out.includes("Add a partition filter on date_stmt_yr"));
});

test("buildReformedSql with no annotations has no comment header", () => {
  const out = buildReformedSql("select cm15 from t", {
    piiDecrypts: [{ column: "cm15", tag: "T" }],
    annotations: [],
  });
  assert.ok(!out.includes("Reformed by"));
});

test("detectAnomalies flags SELECT * and missing WHERE", () => {
  const a = detectAnomalies("select * from t");
  const codes = a.map((x) => x.code);
  assert.ok(codes.includes("select_star"));
  assert.ok(codes.includes("no_where"));
});

test("detectAnomalies flags CROSS JOIN and LIMIT-without-ORDER", () => {
  const a = detectAnomalies("select x from t cross join u where t.id=u.id limit 10");
  const codes = a.map((x) => x.code);
  assert.ok(codes.includes("cross_join"));
  assert.ok(codes.includes("limit_no_order"));
});

test("detectAnomalies stays quiet on a clean query", () => {
  const a = detectAnomalies("select id from t where date_stmt_yr = 2024 order by id limit 5");
  assert.equal(a.length, 0);
});
