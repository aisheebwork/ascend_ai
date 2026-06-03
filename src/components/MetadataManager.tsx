import { useRef, useState } from "react";
import { parseDatasets, mergeTables } from "../../functions/_lib/parseMetadata";
import { addTables, type StoredTable } from "../lib/metadataStore";
import type { TableMetadata } from "../types";

interface Props {
  /** shared metadata loaded from Firestore */
  sharedTables: StoredTable[];
  /** built-in (bundled) table names, shown as read-only */
  builtinTableNames: string[];
  userEmail: string | null;
}

function countPii(t: TableMetadata) {
  return t.attributes.filter((a) => a.isSensitive).length;
}
function partitionCols(t: TableMetadata) {
  return t.attributes.filter((a) => a.isPartitioned).map((a) => a.name);
}

export default function MetadataManager({
  sharedTables,
  builtinTableNames,
  userEmail,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const parsedPerFile: TableMetadata[] = [];
      for (const file of Array.from(files)) {
        const text = await file.text();
        let raw: unknown;
        try {
          raw = JSON.parse(text);
        } catch {
          throw new Error(`${file.name}: not valid JSON`);
        }
        const tables = parseDatasets(raw);
        if (tables.length === 0) {
          throw new Error(
            `${file.name}: no tables found (expected Cornerstone metadata with external_reference_details.table_name)`
          );
        }
        parsedPerFile.push(...tables);
      }
      // Merge across all selected files first (handles multi-part uploads).
      const merged = mergeTables(parsedPerFile);
      const names = await addTables(merged, userEmail);
      setMsg(
        `Added/updated ${names.length} table(s): ${names.join(", ")}. They are now used in analyses.`
      );
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add metadata");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Metadata library</h2>
          <p className="text-xs text-slate-500">
            {builtinTableNames.length + sharedTables.length} table(s) available to the analyzer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            {open ? "Hide" : "View tables"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-lg bg-amex-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-amex-dark disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add metadata JSON"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {msg && (
        <p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-2 text-sm text-emerald-700">
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {err}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Upload one or more metadata JSON files in the standard Cornerstone format
        (same shape as the bundled <code>triumph_transactions</code> files). They
        are added to a shared library and merged with the built-in metadata for
        everyone.
      </p>

      {open && (
        <div className="mt-4 space-y-4">
          {builtinTableNames.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500">Built-in</h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {builtinTableNames.map((n) => (
                  <span key={n} className="rounded bg-slate-100 px-2 py-0.5 text-sm text-slate-600">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500">
              Added by the team
            </h4>
            {sharedTables.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">None yet.</p>
            ) : (
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="py-1 pr-3">Table</th>
                    <th className="py-1 pr-3">Cols</th>
                    <th className="py-1 pr-3">PII</th>
                    <th className="py-1 pr-3">Partition</th>
                    <th className="py-1 pr-3">Part. filter req.</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedTables.map((t) => (
                    <tr key={t.tableName} className="border-t border-slate-100">
                      <td className="py-1.5 pr-3 font-mono">{t.tableName}</td>
                      <td className="py-1.5 pr-3">{t.attributes.length}</td>
                      <td className="py-1.5 pr-3">{countPii(t)}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs">
                        {partitionCols(t).join(", ") || "—"}
                      </td>
                      <td className="py-1.5 pr-3">{t.requirePartitionFilter ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
