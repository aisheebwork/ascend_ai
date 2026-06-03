import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "./lib/firebase";
import { analyzeSql } from "./lib/api";
import { saveAnalysis, subscribeAnalyses } from "./lib/analyses";
import type { AnalysisResult, AnalysisRecord } from "./types";
import Login from "./components/Login";
import SqlUploader from "./components/SqlUploader";
import Results from "./components/Results";
import HistoryPanel from "./components/HistoryPanel";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [sql, setSql] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      return;
    }
    return subscribeAnalyses(user.uid, setRecords);
  }, [user]);

  async function handleAnalyze() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setActiveId(null);
    try {
      const res = await analyzeSql(sql);
      setResult(res);
      await saveAnalysis(user.uid, {
        fileName: fileName || "pasted.sql",
        sqlText: sql,
        result: res,
      });
    } catch (e: any) {
      setError(e?.message ?? "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  function handleSelectHistory(r: AnalysisRecord) {
    setActiveId(r.id);
    setSql(r.sqlText);
    setFileName(r.fileName);
    setResult(r.result);
    setError(null);
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-amex-dark">BQ SQL Advisor</h1>
            <p className="text-xs text-slate-500">PII &amp; partition checks from governed metadata</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.displayName ?? user.email}</span>
            <button
              onClick={() => signOut(auth)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <SqlUploader
            sql={sql}
            fileName={fileName}
            busy={busy}
            onChange={(s, f) => {
              setSql(s);
              setFileName(f);
            }}
            onAnalyze={handleAnalyze}
          />
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {result && <Results result={result} />}
        </div>

        <HistoryPanel
          records={records}
          activeId={activeId}
          onSelect={handleSelectHistory}
        />
      </main>
    </div>
  );
}
