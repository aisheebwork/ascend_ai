import type { AnalysisRecord } from "../types";

interface Props {
  records: AnalysisRecord[];
  activeId: string | null;
  onSelect: (record: AnalysisRecord) => void;
}

function issueCount(r: AnalysisRecord): number {
  return r.result.suggestions.filter((s) => s.severity !== "info").length;
}

export default function HistoryPanel({ records, activeId, onSelect }: Props) {
  return (
    <aside className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Previous analyses
      </h3>
      {records.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No previous runs yet.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {records.map((r) => {
            const issues = issueCount(r);
            return (
              <li key={r.id}>
                <button
                  onClick={() => onSelect(r)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    activeId === r.id ? "bg-amex-blue/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-700">
                      {r.fileName}
                    </span>
                    {issues > 0 && (
                      <span className="shrink-0 rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">
                        {issues}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
