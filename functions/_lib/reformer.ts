// Builds "reformed" BQ SQL from the original query plus the user's selected
// suggestions. The only structural change applied is wrapping PII columns with
// sde_decrypt('<SDE_TAG>', <col>); all other selected suggestions are added as
// review comments (we never silently rewrite logic). Best-effort, text-based
// (DEBT-001) — output is meant to be reviewed by the engineer.

export interface PiiDecrypt {
  column: string;
  tag: string;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wrap a single PII column with sde_decrypt('TAG', col), preserving an optional
 * table qualifier (a.cm15 -> sde_decrypt('TAG', a.cm15)). Skips occurrences that
 * are already wrapped with the same tag, and avoids matching longer identifiers
 * or function calls.
 */
export function wrapPiiColumn(sql: string, column: string, tag: string): string {
  const re = new RegExp(
    `(?<![\\w.'"\`])((?:[A-Za-z_]\\w*\\.)?)(${escapeRe(column)})(?![\\w(])`,
    "gi"
  );
  return sql.replace(re, (match, qualifier: string, name: string, offset: number, full: string) => {
    const before = full.slice(Math.max(0, offset - 60), offset).toLowerCase();
    // already wrapped with this tag immediately before?
    if (before.includes(`sde_decrypt('${tag.toLowerCase()}',`)) return match;
    return `sde_decrypt('${tag}', ${qualifier}${name})`;
  });
}

export interface ReformOptions {
  /** PII columns to decrypt (the selected pii suggestions) */
  piiDecrypts: PiiDecrypt[];
  /** review notes to prepend as comments (selected partition/anomaly suggestions) */
  annotations: string[];
}

/** Produce reformed SQL: apply PII decrypts + prepend selected review comments. */
export function buildReformedSql(originalSql: string, opts: ReformOptions): string {
  let sql = originalSql;
  // de-dupe columns (a column may appear in several findings)
  const seen = new Set<string>();
  for (const d of opts.piiDecrypts) {
    const key = d.column.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sql = wrapPiiColumn(sql, d.column, d.tag);
  }

  if (opts.annotations.length === 0) return sql;

  const header = [
    "-- ===== Reformed by BQ SQL Advisor =====",
    "-- Review the following suggestions (not auto-applied):",
    ...opts.annotations.map((a) => `--  - ${a}`),
    "-- =======================================",
    "",
  ].join("\n");
  return header + sql;
}
