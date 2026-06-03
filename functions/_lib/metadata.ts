import bundle from "./metadata.bundle.json";
import type { MetadataBundle, TableMetadata } from "./types";

const metadata = bundle as MetadataBundle;

// Index by lowercased table name for case-insensitive lookup.
const byName = new Map<string, TableMetadata>();
for (const [name, t] of Object.entries(metadata.tables)) {
  byName.set(name.toLowerCase(), t);
}

/**
 * Resolve a SQL table reference to governed metadata.
 * Accepts fully-qualified refs (`project.dataset.table`) and matches on the
 * final identifier segment, case-insensitively.
 */
export function getTable(ref: string): TableMetadata | undefined {
  const cleaned = ref.replace(/`/g, "").trim().toLowerCase();
  const segment = cleaned.split(".").pop() ?? cleaned;
  return byName.get(segment);
}

export function allTableNames(): string[] {
  return [...byName.keys()];
}
