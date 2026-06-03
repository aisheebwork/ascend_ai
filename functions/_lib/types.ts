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

export interface Suggestion {
  severity: Severity;
  category: "pii" | "partition";
  table: string;
  column: string;
  /** plain-language guidance — suggestion only, never a rewritten query */
  message: string;
}

export interface AnalysisResult {
  detectedTables: string[];
  /** tables referenced in the SQL but missing from governed metadata */
  unknownTables: string[];
  piiFindings: PiiFinding[];
  partitionFindings: PartitionFinding[];
  suggestions: Suggestion[];
  /** true when Gemini produced the suggestion text; false = templated fallback */
  geminiUsed: boolean;
}
