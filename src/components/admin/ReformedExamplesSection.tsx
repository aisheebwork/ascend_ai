import { useEffect, useState } from "react";
import {
  addReformedExample,
  updateReformedExample,
  subscribeReformedExamples,
  deleteReformedExample,
  type ReformedExampleDoc,
} from "../../lib/reformedExamples";

export default function ReformedExamplesSection({ userEmail }: { userEmail: string | null }) {
  const [docs, setDocs] = useState<ReformedExampleDoc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // null = add mode
  const [title, setTitle] = useState("");
  const [originalSql, setOriginalSql] = useState("");
  const [reformedSql, setReformedSql] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => subscribeReformedExamples(setDocs), []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setOriginalSql("");
    setReformedSql("");
    setNotes("");
  }

  function startEdit(d: ReformedExampleDoc) {
    setEditingId(d.id);
    setTitle(d.title);
    setOriginalSql(d.originalSql);
    setReformedSql(d.reformedSql);
    setNotes(d.notes ?? "");
    setMsg(null);
    setErr(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setErr(null);
    setMsg(null);
    if (!reformedSql.trim()) {
      setErr("Reformed SQL is required");
      return;
    }
    setBusy(true);
    try {
      const payload = { title: title.trim() || "Example", originalSql, reformedSql, notes };
      if (editingId) {
        await updateReformedExample(editingId, payload);
        setMsg("Example updated.");
      } else {
        await addReformedExample(payload, userEmail);
        setMsg("Example added — it will guide the analyzer's suggestions.");
      }
      resetForm();
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
        {editingId && <span className="ml-1 font-medium text-amex-blue">Editing an example…</span>}
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
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-amex-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-amex-dark disabled:opacity-50"
          >
            {busy ? "Saving…" : editingId ? "Update example" : "Add example"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

      {docs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium text-slate-800">{d.title}</div>
                <div className="flex shrink-0 gap-2">
                  <button
                    title="Edit example"
                    onClick={() => startEdit(d)}
                    className="rounded px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✎ Edit
                  </button>
                  <button
                    title="Delete example"
                    onClick={() => {
                      if (window.confirm(`Delete example "${d.title}"?`)) {
                        deleteReformedExample(d.id).catch((e) =>
                          setErr(e?.message ?? "Delete failed")
                        );
                      }
                    }}
                    className="rounded px-2 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕ Delete
                  </button>
                </div>
              </div>
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
