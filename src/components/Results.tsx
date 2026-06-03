import type { AnalysisResult, Severity } from "../types";

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

export default function Results({ result }: { result: AnalysisResult }) {
  const { detectedTables, unknownTables, piiFindings, partitionFindings, suggestions, geminiUsed } =
    result;

  return (
    <div className="space-y-5">
      {/* Detected tables */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">Detected tables</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {detectedTables.length === 0 && (
            <span className="text-sm text-slate-500">
              No governed tables matched in the SQL.
            </span>
          )}
          {detectedTables.map((t) => (
            <span
              key={t}
              className="rounded-lg bg-amex-blue/10 px-2.5 py-1 text-sm font-medium text-amex-dark"
            >
              {t}
            </span>
          ))}
          {unknownTables.map((t) => (
            <span
              key={t}
              title="Not found in governed metadata"
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-slate-500"
            >
              {t} (unknown)
            </span>
          ))}
        </div>
      </section>

      {/* PII columns */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">PII / sensitive columns</h3>
        {piiFindings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No sensitive columns from governed metadata are used in this query.
          </p>
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

      {/* Suggestions */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Suggested edits</h3>
          <span className="text-xs text-slate-400">
            {geminiUsed ? "AI-assisted (Gemini)" : "rule-based"}
          </span>
        </div>
        {suggestions.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700">
            No issues found. Nothing to change.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className={`rounded-lg border p-3 text-sm ${sevStyle[s.severity]}`}>
                <span className="mr-2 rounded px-1.5 py-0.5 text-xs font-bold uppercase">
                  {s.category}
                </span>
                {s.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
