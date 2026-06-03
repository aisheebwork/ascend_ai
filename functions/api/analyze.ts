import { analyzeSql } from "../_lib/analyzer";
import { buildSuggestions } from "../_lib/gemini";
import { verifyFirebaseToken, bearerToken } from "../_lib/auth";
import { isTableMetadata } from "../_lib/parseMetadata";
import type { AnalysisResult, TableMetadata } from "../_lib/types";

// Cloudflare Pages Function environment bindings.
interface Env {
  GEMINI_API_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const MAX_SQL_BYTES = 200_000; // guard against huge payloads
const MAX_EXTRA_TABLES = 500; // cap user-supplied metadata tables per request

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(ctx: PagesContext): Promise<Response> {
  const { request, env } = ctx;

  // 1. Authn — require a valid Firebase ID token.
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return json({ error: "Server not configured (FIREBASE_PROJECT_ID missing)" }, 500);
  }
  const token = bearerToken(request);
  if (!token) {
    return json({ error: "Missing Authorization: Bearer <idToken>" }, 401);
  }
  try {
    await verifyFirebaseToken(token, projectId);
  } catch {
    return json({ error: "Invalid or expired token" }, 401);
  }

  // 2. Parse input.
  let sql: string;
  let extraTables: TableMetadata[] = [];
  try {
    const body: any = await request.json();
    sql = typeof body?.sql === "string" ? body.sql : "";
    if (Array.isArray(body?.extraTables)) {
      extraTables = body.extraTables.filter(isTableMetadata).slice(0, MAX_EXTRA_TABLES);
    }
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!sql.trim()) {
    return json({ error: "Provide non-empty `sql`" }, 400);
  }
  if (new Blob([sql]).size > MAX_SQL_BYTES) {
    return json({ error: "SQL too large" }, 413);
  }

  // 3. Deterministic analysis (both flows), merging any user-added metadata.
  const findings = analyzeSql(sql, extraTables);

  // 4. Suggestion text (Gemini with deterministic fallback).
  const { suggestions, geminiUsed } = await buildSuggestions(
    findings,
    env.GEMINI_API_KEY
  );

  const result: AnalysisResult = { ...findings, suggestions, geminiUsed };
  return json(result);
}

// Reject non-POST methods cleanly.
export async function onRequest(ctx: PagesContext): Promise<Response> {
  if (ctx.request.method === "POST") return onRequestPost(ctx);
  return json({ error: "Method not allowed" }, 405);
}
