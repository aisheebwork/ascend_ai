import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { mergeTables } from "../../functions/_lib/parseMetadata";
import type { TableMetadata } from "../types";

// Shared, team-wide metadata knowledge base. Any signed-in user can read it and
// contribute new tables; analyses merge it with the built-in bundled metadata.
// Each document id is the lowercased table name so re-uploading a table merges
// into the existing entry rather than creating duplicates.

const COLLECTION = "sharedMetadata";

function metaCol() {
  return collection(db, COLLECTION);
}

function docIdFor(tableName: string): string {
  // Firestore doc ids can't contain "/" — table names are simple identifiers,
  // but sanitize defensively.
  return tableName.toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
}

export interface StoredTable extends TableMetadata {
  addedByEmail?: string | null;
  updatedAt?: number;
}

/**
 * Add/merge a set of parsed tables into the shared collection. For each table,
 * merges new attributes into any existing stored entry (deduped by column name).
 * Returns the table names written.
 */
export async function addTables(
  tables: TableMetadata[],
  addedByEmail: string | null
): Promise<string[]> {
  const written: string[] = [];
  for (const table of tables) {
    const ref = doc(metaCol(), docIdFor(table.tableName));
    const existing = await getDoc(ref);
    let merged = table;
    if (existing.exists()) {
      const prev = existing.data() as TableMetadata;
      merged = mergeTables([prev, table])[0];
    }
    await setDoc(ref, {
      tableName: merged.tableName,
      displayName: merged.displayName,
      dbName: merged.dbName ?? null,
      requirePartitionFilter: merged.requirePartitionFilter,
      attributes: merged.attributes,
      addedByEmail: addedByEmail ?? null,
      updatedAt: serverTimestamp(),
    });
    written.push(merged.tableName);
  }
  return written;
}

/** Subscribe to all shared metadata tables. Returns an unsubscribe function. */
export function subscribeMetadata(
  cb: (tables: StoredTable[]) => void
): () => void {
  return onSnapshot(metaCol(), (snap) => {
    const tables = snap.docs.map((d) => {
      const v = d.data() as any;
      return {
        tableName: v.tableName,
        displayName: v.displayName ?? v.tableName,
        dbName: v.dbName ?? null,
        requirePartitionFilter: v.requirePartitionFilter === true,
        attributes: Array.isArray(v.attributes) ? v.attributes : [],
        addedByEmail: v.addedByEmail ?? null,
        updatedAt: v.updatedAt?.toMillis?.() ?? 0,
      } as StoredTable;
    });
    cb(tables);
  });
}

/** Strip Firestore-only fields, returning plain TableMetadata for the analyzer. */
export function toTableMetadata(t: StoredTable): TableMetadata {
  return {
    tableName: t.tableName,
    displayName: t.displayName,
    dbName: t.dbName ?? null,
    requirePartitionFilter: t.requirePartitionFilter,
    attributes: t.attributes,
  };
}
