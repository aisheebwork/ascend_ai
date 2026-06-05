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
import type { AnalysisRecord } from "../types";
import type { AnalysisResult } from "../types";

function userAnalysesCol(uid: string) {
  return collection(db, "users", uid, "analyses");
}

/** Persist a completed analysis run for the signed-in user. */
export async function saveAnalysis(
  uid: string,
  data: { fileName: string; sqlText: string; result: AnalysisResult }
): Promise<void> {
  await addDoc(userAnalysesCol(uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

/** Delete one of the user's saved analyses. */
export async function deleteAnalysis(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(userAnalysesCol(uid), id));
}

/** Rename one of the user's saved analyses. */
export async function renameAnalysis(
  uid: string,
  id: string,
  fileName: string
): Promise<void> {
  await updateDoc(doc(userAnalysesCol(uid), id), { fileName });
}

/**
 * Subscribe to the user's recent analyses (newest first). Returns an
 * unsubscribe function. Used by the History panel.
 */
export function subscribeAnalyses(
  uid: string,
  cb: (records: AnalysisRecord[]) => void,
  max = 50
): () => void {
  const q = query(userAnalysesCol(uid), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => {
    const records: AnalysisRecord[] = snap.docs.map((d) => {
      const v = d.data() as any;
      return {
        id: d.id,
        fileName: v.fileName ?? "untitled.sql",
        sqlText: v.sqlText ?? "",
        result: v.result as AnalysisResult,
        createdAt: v.createdAt?.toMillis?.() ?? Date.now(),
      };
    });
    cb(records);
  });
}
