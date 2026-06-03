import bundle from "./metadata.bundle.json";
import type { MetadataBundle, TableMetadata } from "./types";

const metadata = bundle as MetadataBundle;

function lastSegment(ref: string): string {
  const cleaned = ref.replace(/`/g, "").trim().toLowerCase();
  return cleaned.split(".").pop() ?? cleaned;
}

/** Built-in (compile-time bundled) governed tables. */
export function builtinTables(): TableMetadata[] {
  return Object.values(metadata.tables);
}

/**
 * Build a table resolver from the built-in bundle plus any extra (user-added)
 * tables. Extra tables override built-in entries with the same name, so the
 * shared metadata collection can extend or correct the bundled metadata.
 */
export function createTableResolver(
  extra: TableMetadata[] = []
): (ref: string) => TableMetadata | undefined {
  const byName = new Map<string, TableMetadata>();
  for (const t of builtinTables()) byName.set(t.tableName.toLowerCase(), t);
  for (const t of extra) {
    if (t?.tableName) byName.set(t.tableName.toLowerCase(), t);
  }
  return (ref: string) => byName.get(lastSegment(ref));
}

const builtinResolver = createTableResolver();

/** Resolve against built-in metadata only (used by tests / simple callers). */
export function getTable(ref: string): TableMetadata | undefined {
  return builtinResolver(ref);
}
