import { useEffect, useRef, useState } from "react";
import {
  addSharedSql,
  subscribeSharedSql,
  downloadSql,
  type SharedSqlDoc,
} from "../../lib/sharedSql";

export default function ShareSqlSection({ userEmail }: { userEmail: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<SharedSqlDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => subscribeSharedSql(setDocs), []);

  async function handleFiles(files: FileList) {
    setErr(null);
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const text = await f.text();
        await addSharedSql({ fileName: f.name, sqlText: text }, userEmail);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Share raw BQ SQL for testing</h2>
          <p className="text-xs text-slate-500">{docs.length} shared file(s) — visible to all admins</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-amex-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-amex-dark disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload .sql"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".sql,.txt"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      {docs.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No shared SQL yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {docs.map((d) => (
            <li key={d.id} className="py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm text-slate-800">{d.fileName}</div>
                  <div className="text-xs text-slate-400">
                    {d.uploadedByEmail ?? "unknown"} · {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setOpenId(openId === d.id ? null : d.id)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {openId === d.id ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => downloadSql(d)}
                    className="rounded bg-amex-blue px-2 py-1 text-xs font-medium text-white hover:bg-amex-dark"
                  >
                    Download
                  </button>
                </div>
              </div>
              {openId === d.id && (
                <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
                  {d.sqlText}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
