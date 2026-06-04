import { useEffect, useState } from "react";
import {
  addReformedExample,
  subscribeReformedExamples,
  type ReformedExampleDoc,
} from "../../lib/reformedExamples";

export default function ReformedExamplesSection({ userEmail }: { userEmail: string | null }) {
  const [docs, setDocs] = useState<ReformedExampleDoc[]>([]);
  const [title, setTitle] = useState("");
  const [originalSql, setOriginalSql] = useState("");
  const [reformedSql, setReformedSql] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => subscribeReformedExamples(setDocs), []);

  async function save() {
    setErr(null);
    setMsg(null);
    if (!reformedSql.trim()) {
      setErr("Reformed SQL is required");
      return;
    }
    setBusy(true);
    try {
      await addReformedExample(
        { title: title.trim() || "Example", originalSql, reformedSql, notes },
        userEmail
      );
      setTitle("");
      setOriginalSql("");
      setReformedSql("");
      setNotes("");
      setMsg("Example added — it will guide the analyzer's suggestions.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Reformed BQ SQL examples (for RAG)</h2>
      <p className="text-xs text-slate-500">
        Add corrected examples so the AI learns your preferred BigQuery style. {docs.length} example(s).
      </p>

      <div className="mt-3 grid gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Decrypt cm15 in join)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          value={originalSql}
          onChange={(e) => setOriginalSql(e.target.value)}
          placeholder="Original SQL (optional)"
          className="h-24 rounded-lg border border-slate-300 p-2 font-mono text-xs"
        />
        <textarea
          value={reformedSql}
          onChange={(e) => setReformedSql(e.target.value)}
          placeholder="Reformed / corrected SQL (required)"
          className="h-28 rounded-lg border border-slate-300 p-2 font-mono text-xs"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-amex-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-amex-dark disabled:opacity-50"
          >
            {busy ? "Saving…" : "Add example"}
          </button>
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

      {docs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="rounded-lg border border-slate-100 p-3">
              <div className="text-sm font-medium text-slate-800">{d.title}</div>
              {d.notes && <div className="text-xs text-slate-500">{d.notes}</div>}
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-900 p-2 font-mono text-xs text-slate-100">
                {d.reformedSql}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
