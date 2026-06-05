import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ReformedExample } from "../types";

// Reformed BQ SQL examples (original -> corrected) that guide the RAG/Gemini
// layer. Admin-managed; read by any signed-in user so the analyzer can send a
// few as style guidance. Enforced by Firestore rules.

export interface ReformedExampleDoc extends ReformedExample {
  id: string;
  addedByEmail: string | null;
  createdAt: number;
}

function col() {
  return collection(db, "reformedExamples");
}

export async function addReformedExample(
  data: ReformedExample,
  addedByEmail: string | null
): Promise<void> {
  await addDoc(col(), {
    title: data.title || "Example",
    originalSql: data.originalSql ?? "",
    reformedSql: data.reformedSql,
    notes: data.notes ?? "",
    addedByEmail: addedByEmail ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function deleteReformedExample(id: string): Promise<void> {
  await deleteDoc(doc(col(), id));
}

export async function updateReformedExample(
  id: string,
  data: ReformedExample
): Promise<void> {
  await updateDoc(doc(col(), id), {
    title: data.title || "Example",
    originalSql: data.originalSql ?? "",
    reformedSql: data.reformedSql,
    notes: data.notes ?? "",
  });
}

export function subscribeReformedExamples(
  cb: (docs: ReformedExampleDoc[]) => void,
  max = 50
): () => void {
  const q = query(col(), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const v = d.data() as any;
        return {
          id: d.id,
          title: v.title ?? "Example",
          originalSql: v.originalSql ?? "",
          reformedSql: v.reformedSql ?? "",
          notes: v.notes ?? "",
          addedByEmail: v.addedByEmail ?? null,
          createdAt: v.createdAt?.toMillis?.() ?? 0,
        };
      })
    );
  });
}

/** Plain ReformedExample[] (for sending to the analyzer as RAG context). */
export function toExamples(docs: ReformedExampleDoc[]): ReformedExample[] {
  return docs.map((d) => ({
    title: d.title,
    originalSql: d.originalSql,
    reformedSql: d.reformedSql,
    notes: d.notes,
  }));
}
