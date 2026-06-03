import { getTable } from "./metadata";
import type {
  AnalysisResult,
  PartitionFinding,
  PiiFinding,
} from "./types";

// NOTE (DEBT-001): This is a heuristic regex/token analyzer, not a full
// BigQuery SQL parser. It is intentionally conservative — it can miss exotic
// constructs (column aliases shadowing real names, dynamic SQL, etc.). It is
// accurate enough for the governed-metadata advisory use case and degrades to
// "flag for review" rather than producing wrong rewrites (we never rewrite).

/** Strip line (`--`) and block comments so they don't pollute token matching. */
function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

/** Extract table references following FROM / JOIN. Handles backticked FQNs. */
export function extractTableRefs(sql: string): string[] {
  const clean = stripComments(sql);
  const refs = new Set<string>();
  // FROM/JOIN followed by an optional backticked or bare identifier path.
  const re = /\b(?:from|join)\s+(`[^`]+`|[A-Za-z0-9_$.\-]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const raw = m[1].replace(/`/g, "").trim();
    // Skip subquery openers like "from (" — those won't match the identifier
    // pattern, but guard anyway.
    if (raw && raw !== "(") refs.add(raw);
  }
  return [...refs];
}

/**
 * Extract the text of filter regions: WHERE ... and JOIN ... ON ... and
 * HAVING ... . Returns a single concatenated, lowercased blob used only for
 * "does this column appear in a filter" token checks.
 */
export function extractFilterText(sql: string): string {
  const clean = stripComments(sql).toLowerCase();
  const regions: string[] = [];

  // WHERE clause: from `where` up to the next major clause keyword.
  const whereRe =
    /\bwhere\b([\s\S]*?)(?=\b(?:group\s+by|order\s+by|having|window|qualify|limit|union|except|intersect)\b|\)\s*(?:as\b|,|select|$)|;|$)/gi;
  // ON clause (join predicates).
  const onRe = /\bon\b([\s\S]*?)(?=\b(?:left|right|inner|full|cross|join|where|group\s+by|order\s+by|having|limit|union)\b|\)|;|$)/gi;
  // HAVING clause.
  const havingRe = /\bhaving\b([\s\S]*?)(?=\b(?:order\s+by|window|qualify|limit|union)\b|\)|;|$)/gi;

  for (const re of [whereRe, onRe, havingRe]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(clean)) !== null) {
      if (m[1]) regions.push(m[1]);
    }
  }
  return regions.join(" \n ");
}

/** Whole-word, identifier-boundary match for a column name. */
function tokenPresent(haystack: string, column: string): boolean {
  const re = new RegExp(`(?<![A-Za-z0-9_])${escapeRe(column)}(?![A-Za-z0-9_])`, "i");
  return re.test(haystack);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Run the deterministic part of both flows (PII + partition) against a SQL
 * string. Produces structured findings; suggestion text is layered on later.
 */
export function analyzeSql(sql: string): Omit<AnalysisResult, "suggestions" | "geminiUsed"> {
  const clean = stripComments(sql);
  const cleanLower = clean.toLowerCase();
  const filterText = extractFilterText(sql);

  const refs = extractTableRefs(sql);
  const detectedTables: string[] = [];
  const unknownTables: string[] = [];
  const piiFindings: PiiFinding[] = [];
  const partitionFindings: PartitionFinding[] = [];

  const seenTables = new Set<string>();

  for (const ref of refs) {
    const meta = getTable(ref);
    if (!meta) {
      const segment = ref.replace(/`/g, "").split(".").pop() ?? ref;
      if (!unknownTables.includes(segment)) unknownTables.push(segment);
      continue;
    }
    if (seenTables.has(meta.tableName)) continue;
    seenTables.add(meta.tableName);
    detectedTables.push(meta.tableName);

    // --- Flow 1: PII / sensitive columns ---
    for (const attr of meta.attributes) {
      if (!attr.isSensitive) continue;
      const usedInQuery = tokenPresent(cleanLower, attr.name);
      if (!usedInQuery) continue; // only report sensitive cols actually touched
      piiFindings.push({
        table: meta.tableName,
        column: attr.name,
        piiRoleId: attr.piiRoleId,
        dataClassification: attr.dataClassification,
        businessName: attr.businessName,
        usedInQuery,
        usedInFilter: tokenPresent(filterText, attr.name),
      });
    }

    // --- Flow 2: partition filter requirement ---
    const partitionCols = meta.attributes.filter((a) => a.isPartitioned);
    for (const pcol of partitionCols) {
      partitionFindings.push({
        table: meta.tableName,
        column: pcol.name,
        requirePartitionFilter: meta.requirePartitionFilter,
        presentInFilter: tokenPresent(filterText, pcol.name),
      });
    }
  }

  return { detectedTables, unknownTables, piiFindings, partitionFindings };
}
