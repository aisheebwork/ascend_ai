import type {
  AnalysisResult,
  PartitionFinding,
  PiiFinding,
  ReformedExample,
  Suggestion,
} from "./types";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

type Findings = Omit<AnalysisResult, "suggestions" | "geminiUsed">;

/**
 * Canonical, deterministic suggestions with STABLE ids + decrypt metadata.
 * This is the source of truth for the reformer; Gemini only refines wording.
 */
function templateSuggestions(f: Findings): Suggestion[] {
  const out: Suggestion[] = [];

  for (const p of f.piiFindings) {
    const sde = p.piiRoleId ? ` (SDE tag ${p.piiRoleId})` : "";
    const cls = p.dataClassification ? ` Classification: ${p.dataClassification}.` : "";
    const decrypt = p.piiRoleId ? { column: p.column, tag: p.piiRoleId } : null;
    out.push({
      id: `pii:${p.table}.${p.column}`,
      severity: p.usedInFilter ? "high" : "medium",
      category: "pii",
      table: p.table,
      column: p.column,
      decrypt,
      message: p.usedInFilter
        ? `\`${p.column}\` in \`${p.table}\` is PII${sde} used in a filter/join. Wrap it with sde_decrypt before comparing.${cls}`
        : `\`${p.column}\` in \`${p.table}\` is PII${sde} referenced in the query. Ensure it is decrypted/handled per policy.${cls}`,
    });
  }

  for (const part of f.partitionFindings) {
    if (part.requirePartitionFilter && !part.presentInFilter) {
      out.push({
        id: `partition:${part.table}.${part.column}`,
        severity: "high",
        category: "partition",
        table: part.table,
        column: part.column,
        decrypt: null,
        message: `\`${part.table}\` requires a partition filter, but partition column \`${part.column}\` is not used in any WHERE/JOIN filter. Add a filter on \`${part.column}\` to avoid a full-table scan.`,
      });
    } else if (part.presentInFilter) {
      out.push({
        id: `partition:${part.table}.${part.column}`,
        severity: "info",
        category: "partition",
        table: part.table,
        column: part.column,
        decrypt: null,
        message: `Partition column \`${part.column}\` on \`${part.table}\` is already used in a filter. Good — no partition change needed.`,
      });
    }
  }

  for (const a of f.anomalies) {
    out.push({
      id: a.id,
      severity: a.severity,
      category: "anomaly",
      table: "",
      column: "",
      decrypt: null,
      message: a.message,
    });
  }

  return out;
}

const SYSTEM_INSTRUCTION = `You are a BigQuery governance advisor for American Express data engineers.
You are given a SQL query, DETERMINISTIC suggestions derived from governed metadata (each with a stable id), and optionally reformed-SQL EXAMPLES that show good corrected style.
Your job:
1. Rewrite each given suggestion's "message" to be concise and professional (1-2 sentences). Keep its id and category.
2. Optionally ADD extra suggestions for other BQ SQL anomalies you notice (category "anomaly"), each with a new id starting "anomaly:gemini:".
STRICT RULES:
- DO NOT output rewritten SQL or code blocks.
- DO NOT invent columns/tables/SDE tags not present in the inputs.
- Use the EXAMPLES only to inform your advice style, not to copy.
Return ONLY valid JSON. No markdown.`;

function buildPrompt(
  sql: string,
  canonical: Suggestion[],
  examples: ReformedExample[]
): string {
  return [
    SYSTEM_INSTRUCTION,
    "",
    "SQL:",
    sql.slice(0, 8000),
    "",
    "DETERMINISTIC SUGGESTIONS (refine each message; keep id+category):",
    JSON.stringify(
      canonical.map((s) => ({ id: s.id, category: s.category, message: s.message })),
      null,
      2
    ),
    examples.length
      ? "\nREFORMED EXAMPLES (style guidance):\n" +
        JSON.stringify(
          examples.slice(0, 5).map((e) => ({ title: e.title, reformedSql: e.reformedSql.slice(0, 1200) })),
          null,
          2
        )
      : "",
    "",
    'Respond with JSON: { "suggestions": [ { "id": string, "category": "pii|partition|anomaly", "message": string } ] }',
  ].join("\n");
}

/**
 * Produce suggestions. Deterministic suggestions are canonical (stable ids +
 * decrypt info for the reformer). When Gemini is available, it refines messages
 * (matched by id) and may append extra anomaly suggestions. Any failure falls
 * back to the canonical deterministic list.
 */
export async function buildSuggestions(
  f: Findings,
  apiKey: string | undefined,
  examples: ReformedExample[] = [],
  sql = ""
): Promise<{ suggestions: Suggestion[]; geminiUsed: boolean }> {
  const canonical = templateSuggestions(f);
  if (!apiKey || canonical.length === 0) {
    return { suggestions: canonical, geminiUsed: false };
  }

  try {
    const res = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(sql, canonical, examples) }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data: any = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini empty response");

    const parsed = JSON.parse(text);
    const raw: any[] = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const byId = new Map<string, string>();
    const extras: Suggestion[] = [];
    for (const s of raw) {
      if (!s || typeof s.message !== "string") continue;
      const id = String(s.id ?? "");
      if (id.startsWith("anomaly:gemini:")) {
        extras.push({
          id,
          severity: "medium",
          category: "anomaly",
          table: "",
          column: "",
          decrypt: null,
          message: String(s.message),
        });
      } else if (id) {
        byId.set(id, String(s.message));
      }
    }

    // Merge: keep canonical structure, swap in refined messages by id.
    const merged = canonical.map((s) =>
      byId.has(s.id) ? { ...s, message: byId.get(s.id)! } : s
    );
    return { suggestions: [...merged, ...extras], geminiUsed: true };
  } catch {
    return { suggestions: canonical, geminiUsed: false };
  }
}

// ===========================================================================
// AI reformed SQL — true example-driven RAG. Uses the admin's reformed examples
// as few-shot guidance to rewrite THIS query in the team's preferred style.
// Returns null if no key / no signal / on error (caller falls back to the
// deterministic reformer). AI output must be reviewed before running.
// ===========================================================================
const REFORM_INSTRUCTION = `You are a BigQuery SQL rewriter for American Express.
Rewrite the given SQL into a corrected ("reformed") version by:
- Wrapping PII columns with the decrypt UDF using their SDE tag (e.g. sde_decrypt('NGBD-SDE-CM15', cm15)) wherever the column is used.
- Adding partition filters where the metadata says they are required.
- Following the STYLE of the provided reformed EXAMPLES as closely as possible.
RULES:
- Preserve the query's intent and logic; only apply governance fixes + the example style.
- Output ONLY the reformed SQL. No explanations, no markdown fences.`;

function stripFences(s: string): string {
  return s.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function generateReformedSql(
  sql: string,
  f: Findings,
  examples: ReformedExample[],
  apiKey: string | undefined
): Promise<string | null> {
  const hasSignal =
    f.piiFindings.length > 0 ||
    f.partitionFindings.some((p) => p.requirePartitionFilter && !p.presentInFilter);
  if (!apiKey || (!hasSignal && examples.length === 0)) return null;

  const prompt = [
    REFORM_INSTRUCTION,
    "",
    "GOVERNANCE FINDINGS (JSON):",
    JSON.stringify(
      {
        piiColumns: f.piiFindings.map((p) => ({ column: p.column, sdeTag: p.piiRoleId })),
        partition: f.partitionFindings.map((p) => ({
          column: p.column,
          required: p.requirePartitionFilter,
          present: p.presentInFilter,
        })),
      },
      null,
      2
    ),
    examples.length
      ? "\nREFORMED EXAMPLES (match this style):\n" +
        examples
          .slice(0, 5)
          .map(
            (e, i) =>
              `Example ${i + 1}: ${e.title}\n-- original:\n${(e.originalSql || "").slice(0, 1500)}\n-- reformed:\n${e.reformedSql.slice(0, 1500)}`
          )
          .join("\n\n")
      : "",
    "",
    "SQL TO REFORM:",
    sql.slice(0, 12000),
    "",
    "Reformed SQL:",
  ].join("\n");

  try {
    const res = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data: any = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const out = stripFences(text);
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export { templateSuggestions };
export type { Findings, PiiFinding, PartitionFinding };
