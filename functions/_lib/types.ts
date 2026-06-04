// Shared analysis contract between the Cloudflare Pages Function (producer)
// and the React frontend (consumer). Keep this the single source of truth.

export interface ColumnAttribute {
  name: string;
  attributeType: string | null;
  isPartitioned: boolean;
  partitionPosition: number;
  isSensitive: boolean;
  piiRoleId: string | null;
  isGdpr: boolean;
  isOncop: boolean;
  dataClassification: string | null;
  businessName: string | null;
  desc: string | null;
}

export interface TableMetadata {
  tableName: string;
  displayName: string;
  dbName: string | null;
  requirePartitionFilter: boolean;
  attributes: ColumnAttribute[];
}

export interface MetadataBundle {
  tables: Record<string, TableMetadata>;
}

/** A sensitive (PII) column finding for a detected table. */
export interface PiiFinding {
  table: string;
  column: string;
  piiRoleId: string | null;
  dataClassification: string | null;
  businessName: string | null;
  /** appears anywhere in the SQL body */
  usedInQuery: boolean;
  /** appears inside a WHERE / JOIN ON / HAVING filter region */
  usedInFilter: boolean;
}

/** A partition-filter finding for a detected table. */
export interface PartitionFinding {
  table: string;
  column: string;
  requirePartitionFilter: boolean;
  /** partition column present inside a filter region */
  presentInFilter: boolean;
}

export type Severity = "high" | "medium" | "info";

export type SuggestionCategory = "pii" | "partition" | "anomaly";

export interface Suggestion {
  /** stable id used for checkbox selection when building reformed SQL */
  id: string;
  severity: Severity;
  category: SuggestionCategory;
  table: string;
  column: string;
  /** plain-language guidance — suggestion only */
  message: string;
  /**
   * For PII suggestions: the column + SDE tag to wrap with sde_decrypt() when
   * this suggestion is selected for the reformed SQL. Absent for non-auto-fixes.
   */
  decrypt?: { column: string; tag: string } | null;
}

/** A non-PII, non-partition SQL anomaly (e.g. SELECT *, missing WHERE). */
export interface AnomalyFinding {
  id: string;
  code: string; // e.g. "select_star", "no_where", "cross_join"
  severity: Severity;
  message: string;
}

export interface AnalysisResult {
  detectedTables: string[];
  /** tables referenced in the SQL but missing from governed metadata */
  unknownTables: string[];
  piiFindings: PiiFinding[];
  partitionFindings: PartitionFinding[];
  anomalies: AnomalyFinding[];
  suggestions: Suggestion[];
  /** true when Gemini produced the suggestion text; false = templated fallback */
  geminiUsed: boolean;
  /**
   * Example-driven reformed SQL from Gemini (RAG over admin reformed examples).
   * null when no key / no signal / Gemini error — UI then uses the deterministic
   * rule-based reformer. AI output must be reviewed before running.
   */
  aiReformedSql?: string | null;
}

/** A reformed (corrected) BQ SQL example used to guide the RAG/Gemini layer. */
export interface ReformedExample {
  title: string;
  originalSql: string;
  reformedSql: string;
  notes?: string;
}
