import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult, Severity } from "../types";
import { buildReformedSql } from "../../functions/_lib/reformer";

const sevStyle: Record<Severity, string> = {
  high: "border-red-300 bg-red-50 text-red-800",
  medium: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-sky-300 bg-sky-50 text-sky-800",
};

function Badge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {ok ? yes : no}
    </span>
  );
}

function defaultReformedName(fileName: string, wasUploaded: boolean): string {
  if (wasUploaded && fileName) {
    const base = fileName.replace(/\.[^.]+$/, "");
    return `${base}_reformed.sql`;
  }
  return "bq_sql_reformed.sql";
}

interface Props {
  result: AnalysisResult;
  sql: string;
  fileName: string;
  wasUploaded: boolean;
}

export default function Results({ result, sql, fileName, wasUploaded }: Props) {
  const { detectedTables, unknownTables, piiFindings, partitionFindings, suggestions, geminiUsed } =
    result;

  // Checkbox selection per suggestion id. Default: everything except pure "info".
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [downloadName, setDownloadName] = useState("");
  // Which reformed-SQL source to show/download.
  const [reformMode, setReformMode] = useState<"ai" | "rules">("rules");

  const hasAi = !!result.aiReformedSql && result.aiReformedSql.trim().length > 0;

  useEffect(() => {
    const init: Record<string, boolean> = {};
    for (const s of suggestions) init[s.id] = s.severity !== "info";
    setSelected(init);
    setDownloadName(defaultReformedName(fileName, wasUploaded));
    // Prefer the example-driven AI version when available.
    setReformMode(result.aiReformedSql ? "ai" : "rules");
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const ruleReformedSql = useMemo(() => {
    const piiDecrypts = suggestions
      .filter((s) => selected[s.id] && s.category === "pii" && s.decrypt)
      .map((s) => s.decrypt!) as { column: string; tag: string }[];
    const annotations = suggestions
      .filter((s) => selected[s.id] && (s.category === "partition" || s.category === "anomaly"))
      .map((s) => s.message);
    return buildReformedSql(sql, { piiDecrypts, annotations });
  }, [sql, suggestions, selected]);

  const reformedSql = reformMode === "ai" && hasAi ? result.aiReformedSql! : ruleReformedSql;

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function download() {
    const name = (downloadName.trim() || defaultReformedName(fileName, wasUploaded)).replace(
      /[^\w.\-]/g,
      "_"
    );
    const finalName = name.endsWith(".sql") ? name : `${name}.sql`;
    const blob = new Blob([reformedSql], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyReformed() {
    navigator.clipboard?.writeText(reformedSql).catch(() => {});
  }

  return (
    <div className="space-y-5">
      {/* Detected tables */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">Detected tables</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {detectedTables.length === 0 && (
            <span className="text-sm text-slate-500">No governed tables matched in the SQL.</span>
          )}
          {detectedTables.map((t) => (
            <span key={t} className="rounded-lg bg-amex-blue/10 px-2.5 py-1 text-sm font-medium text-amex-dark">
              {t}
            </span>
          ))}
          {unknownTables.map((t) => (
            <span key={t} title="Not found in governed metadata" className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-slate-500">
              {t} (unknown)
            </span>
          ))}
        </div>
      </section>

      {/* PII columns */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">PII / sensitive columns</h3>
        {piiFindings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No sensitive columns from governed metadata are used in this query.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-1 pr-3">Column</th>
                <th className="py-1 pr-3">Table</th>
                <th className="py-1 pr-3">SDE tag</th>
                <th className="py-1 pr-3">Classification</th>
                <th className="py-1 pr-3">In filter?</th>
              </tr>
            </thead>
            <tbody>
              {piiFindings.map((p) => (
                <tr key={`${p.table}.${p.column}`} className="border-t border-slate-100">
                  <td className="py-1.5 pr-3 font-mono">{p.column}</td>
                  <td className="py-1.5 pr-3">{p.table}</td>
                  <td className="py-1.5 pr-3 font-mono text-xs">{p.piiRoleId ?? "—"}</td>
                  <td className="py-1.5 pr-3">{p.dataClassification ?? "—"}</td>
                  <td className="py-1.5 pr-3">
                    <Badge ok={p.usedInFilter} yes="Used in filter" no="Not in filter" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Partition */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">Partition columns</h3>
        {partitionFindings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No partitioned columns detected.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-1 pr-3">Column</th>
                <th className="py-1 pr-3">Table</th>
                <th className="py-1 pr-3">Filter required?</th>
                <th className="py-1 pr-3">In filter?</th>
              </tr>
            </thead>
            <tbody>
              {partitionFindings.map((p) => (
                <tr key={`${p.table}.${p.column}`} className="border-t border-slate-100">
                  <td className="py-1.5 pr-3 font-mono">{p.column}</td>
                  <td className="py-1.5 pr-3">{p.table}</td>
                  <td className="py-1.5 pr-3">{p.requirePartitionFilter ? "Yes" : "No"}</td>
                  <td className="py-1.5 pr-3">
                    <Badge ok={!p.presentInFilter} yes="Missing" no="Present" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Suggestions with checkboxes */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">
            Suggested edits <span className="text-xs font-normal text-slate-400">(tick the ones to apply)</span>
          </h3>
          <span className="text-xs text-slate-400">{geminiUsed ? "AI-assisted (Gemini)" : "rule-based"}</span>
        </div>
        {suggestions.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700">No issues found. Nothing to change.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <li key={s.id} className={`flex gap-3 rounded-lg border p-3 text-sm ${sevStyle[s.severity]}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  checked={!!selected[s.id]}
                  onChange={() => toggle(s.id)}
                />
                <span>
                  <span className="mr-2 rounded bg-white/60 px-1.5 py-0.5 text-xs font-bold uppercase">
                    {s.category}
                  </span>
                  {s.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reformed SQL */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-slate-800">Reformed BigQuery SQL</h3>
            {hasAi && (
              <div className="flex overflow-hidden rounded-lg border border-slate-300 text-xs">
                <button
                  onClick={() => setReformMode("ai")}
                  className={reformMode === "ai" ? "bg-amex-blue px-2.5 py-1 text-white" : "px-2.5 py-1 text-slate-600"}
                >
                  AI (your examples)
                </button>
                <button
                  onClick={() => setReformMode("rules")}
                  className={reformMode === "rules" ? "bg-amex-blue px-2.5 py-1 text-white" : "px-2.5 py-1 text-slate-600"}
                >
                  Rule-based
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={downloadName}
              onChange={(e) => setDownloadName(e.target.value)}
              className="w-56 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              title={wasUploaded ? "Prefilled from your uploaded file" : "Set a file name for download"}
            />
            <button onClick={copyReformed} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              Copy
            </button>
            <button onClick={download} className="rounded-lg bg-amex-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-amex-dark">
              Download
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {reformMode === "ai" && hasAi ? (
            <>AI-generated using the admin&apos;s reformed examples (RAG). Review before running.</>
          ) : (
            <>
              Rule-based: PII columns wrapped with <code>sde_decrypt(&apos;SDE_TAG&apos;, col)</code>; ticked
              suggestions added as review comments.{" "}
              {hasAi ? "" : "Add reformed examples in /admin (and a valid Gemini key) to enable AI style."}
            </>
          )}
        </p>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
          {reformedSql}
        </pre>
      </section>
    </div>
  );
}
