import type {
  AnalysisResult,
  PartitionFinding,
  PiiFinding,
  Severity,
  Suggestion,
} from "./types";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

type Findings = Omit<AnalysisResult, "suggestions" | "geminiUsed">;

/** Deterministic, always-available fallback suggestion text. */
function templateSuggestions(f: Findings): Suggestion[] {
  const out: Suggestion[] = [];

  for (const p of f.piiFindings) {
    const sde = p.piiRoleId ? ` (SDE tag ${p.piiRoleId})` : "";
    const cls = p.dataClassification ? ` Classification: ${p.dataClassification}.` : "";
    if (p.usedInFilter) {
      out.push({
        severity: "high",
        category: "pii",
        table: p.table,
        column: p.column,
        message: `\`${p.column}\` in \`${p.table}\` is a sensitive/PII column${sde} and is used in a filter or join condition. Apply the appropriate decrypt on \`${p.column}\` before comparing it in the filter.${cls}`,
      });
    } else {
      out.push({
        severity: "medium",
        category: "pii",
        table: p.table,
        column: p.column,
        message: `\`${p.column}\` in \`${p.table}\` is a sensitive/PII column${sde} and is referenced in the query. Ensure it is decrypted/handled per policy before it is exposed or compared.${cls}`,
      });
    }
  }

  for (const part of f.partitionFindings) {
    if (part.requirePartitionFilter && !part.presentInFilter) {
      out.push({
        severity: "high",
        category: "partition",
        table: part.table,
        column: part.column,
        message: `\`${part.table}\` requires a partition filter, but partition column \`${part.column}\` is not used in any WHERE/JOIN filter. Add a filter on \`${part.column}\` to avoid a full-table scan and satisfy the partition requirement.`,
      });
    } else if (part.presentInFilter) {
      out.push({
        severity: "info",
        category: "partition",
        table: part.table,
        column: part.column,
        message: `Partition column \`${part.column}\` on \`${part.table}\` is already used in a filter. Good — no partition change needed.`,
      });
    }
  }

  return out;
}

const SYSTEM_INSTRUCTION = `You are a BigQuery governance advisor for American Express data engineers.
You are given DETERMINISTIC findings derived from governed table metadata about a SQL query.
Your job is ONLY to write concise, professional, plain-language SUGGESTIONS for each finding.
STRICT RULES:
- DO NOT rewrite, regenerate, or output any SQL query or code blocks.
- DO NOT invent columns, tables, tags, or facts that are not in the findings.
- For PII columns used in a filter/join, advise applying the appropriate decrypt before the comparison.
- For tables that require a partition filter but lack one, advise adding a filter on the partition column.
- One suggestion object per finding. Keep each message to 1-2 sentences.
Return ONLY valid JSON matching the requested schema. No markdown, no commentary.`;

function buildPrompt(f: Findings): string {
  return [
    SYSTEM_INSTRUCTION,
    "",
    "FINDINGS (JSON):",
    JSON.stringify(
      { piiFindings: f.piiFindings, partitionFindings: f.partitionFindings },
      null,
      2
    ),
    "",
    'Respond with JSON of shape: { "suggestions": [ { "severity": "high|medium|info", "category": "pii|partition", "table": string, "column": string, "message": string } ] }',
  ].join("\n");
}

function coerceSeverity(s: unknown): Severity {
  return s === "high" || s === "medium" || s === "info" ? s : "info";
}

/**
 * Produce suggestion text. Calls Gemini when an API key is available; on any
 * error (or no key) falls back to deterministic templated suggestions so the
 * tool always returns useful output.
 */
export async function buildSuggestions(
  f: Findings,
  apiKey: string | undefined
): Promise<{ suggestions: Suggestion[]; geminiUsed: boolean }> {
  const hasFindings = f.piiFindings.length > 0 || f.partitionFindings.length > 0;
  if (!apiKey || !hasFindings) {
    return { suggestions: templateSuggestions(f), geminiUsed: false };
  }

  try {
    const res = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(f) }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data: any = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini empty response");

    const parsed = JSON.parse(text);
    const raw = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const suggestions: Suggestion[] = raw
      .filter((s: any) => s && typeof s.message === "string")
      .map((s: any) => ({
        severity: coerceSeverity(s.severity),
        category: s.category === "partition" ? "partition" : "pii",
        table: String(s.table ?? ""),
        column: String(s.column ?? ""),
        message: String(s.message),
      }));

    if (suggestions.length === 0) throw new Error("Gemini returned no suggestions");
    return { suggestions, geminiUsed: true };
  } catch {
    // Any failure → deterministic fallback. Never blocks the user.
    return { suggestions: templateSuggestions(f), geminiUsed: false };
  }
}

export { templateSuggestions };
export type { Findings, PiiFinding, PartitionFinding };
