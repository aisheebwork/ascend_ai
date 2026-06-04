import { useRef, useState } from "react";

interface Props {
  sql: string;
  fileName: string;
  busy: boolean;
  /** wasUploaded = true when the current SQL came from a file (vs pasted) */
  onChange: (sql: string, fileName: string, wasUploaded: boolean) => void;
  onAnalyze: () => void;
}

export default function SqlUploader({
  sql,
  fileName,
  busy,
  onChange,
  onAnalyze,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function readFile(file: File) {
    const text = await file.text();
    onChange(text, file.name, true);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Your BigQuery SQL</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Upload .sql
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".sql,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={onAnalyze}
            disabled={busy || !sql.trim()}
            className="rounded-lg bg-amex-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-amex-dark disabled:opacity-50"
          >
            {busy ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </div>

      {fileName && (
        <p className="mt-2 text-xs text-slate-500">Loaded: {fileName}</p>
      )}

      <textarea
        value={sql}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value, fileName, false)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        placeholder="Paste your BigQuery SQL here, or drop a .sql file…"
        className={`mt-3 h-72 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none ${
          dragOver ? "border-amex-blue ring-2 ring-amex-blue/30" : "border-slate-300"
        }`}
      />
    </div>
  );
}
