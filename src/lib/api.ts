import { auth } from "./firebase";
import type { AnalysisResult, ReformedExample, TableMetadata } from "../types";

/**
 * Send SQL to the Cloudflare Pages Function for analysis. Attaches the current
 * user's Firebase ID token so the server can authorize the request, any
 * user-added metadata tables to merge with the built-in governed metadata, and
 * reformed-SQL examples used as RAG style guidance.
 */
export async function analyzeSql(
  sql: string,
  extraTables: TableMetadata[] = [],
  examples: ReformedExample[] = []
): Promise<AnalysisResult> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ sql, extraTables, examples }),
  });

  if (!res.ok) {
    let detail = `Analyze failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await res.json()) as AnalysisResult;
}
