import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Admin-only collection: admins upload raw BQ SQL for other admins to review and
// download. Enforced by Firestore rules (admin emails) + UI gating.

export interface SharedSqlDoc {
  id: string;
  fileName: string;
  sqlText: string;
  uploadedByEmail: string | null;
  createdAt: number;
}

function col() {
  return collection(db, "sharedSql");
}

export async function addSharedSql(
  data: { fileName: string; sqlText: string },
  uploadedByEmail: string | null
): Promise<void> {
  await addDoc(col(), {
    fileName: data.fileName || "query.sql",
    sqlText: data.sqlText,
    uploadedByEmail: uploadedByEmail ?? null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeSharedSql(cb: (docs: SharedSqlDoc[]) => void): () => void {
  const q = query(col(), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const v = d.data() as any;
        return {
          id: d.id,
          fileName: v.fileName ?? "query.sql",
          sqlText: v.sqlText ?? "",
          uploadedByEmail: v.uploadedByEmail ?? null,
          createdAt: v.createdAt?.toMillis?.() ?? 0,
        };
      })
    );
  });
}

/** Trigger a browser download of a shared SQL document. */
export function downloadSql(doc: SharedSqlDoc): void {
  const blob = new Blob([doc.sqlText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.fileName.endsWith(".sql") ? doc.fileName : `${doc.fileName}.sql`;
  a.click();
  URL.revokeObjectURL(url);
}
