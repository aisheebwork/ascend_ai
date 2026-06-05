import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "./lib/firebase";
import { analyzeSql } from "./lib/api";
import {
  saveAnalysis,
  subscribeAnalyses,
  deleteAnalysis,
  renameAnalysis,
} from "./lib/analyses";
import {
  subscribeMetadata,
  toTableMetadata,
  type StoredTable,
} from "./lib/metadataStore";
import {
  subscribeReformedExamples,
  toExamples,
  type ReformedExampleDoc,
} from "./lib/reformedExamples";
import { builtinTables } from "../functions/_lib/metadata";
import type { AnalysisResult, AnalysisRecord } from "./types";
import Login from "./components/Login";
import SqlUploader from "./components/SqlUploader";
import Results from "./components/Results";
import HistoryPanel from "./components/HistoryPanel";
import AdminLogin from "./components/AdminLogin";
import Admin from "./pages/Admin";

const BUILTIN_TABLE_NAMES = builtinTables().map((t) => t.tableName);

function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

export default function App() {
  const path = usePath();
  const isAdminRoute = path.replace(/\/+$/, "") === "/admin";

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [sql, setSql] = useState("");
  const [fileName, setFileName] = useState("");
  const [wasUploaded, setWasUploaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedSql, setAnalyzedSql] = useState("");
  const [analyzedName, setAnalyzedName] = useState("");
  const [analyzedUploaded, setAnalyzedUploaded] = useState(false);

  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sharedTables, setSharedTables] = useState<StoredTable[]>([]);
  const [examples, setExamples] = useState<ReformedExampleDoc[]>([]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setSharedTables([]);
      setExamples([]);
      return;
    }
    const unsubAnalyses = subscribeAnalyses(user.uid, setRecords);
    const unsubMeta = subscribeMetadata(setSharedTables);
    const unsubEx = subscribeReformedExamples(setExamples);
    return () => {
      unsubAnalyses();
      unsubMeta();
      unsubEx();
    };
  }, [user]);

  async function handleAnalyze() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setActiveId(null);
    try {
      const extraTables = sharedTables.map(toTableMetadata);
      const res = await analyzeSql(sql, extraTables, toExamples(examples));
      setResult(res);
      setAnalyzedSql(sql);
      setAnalyzedName(fileName);
      setAnalyzedUploaded(wasUploaded);
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

  async function handleDeleteHistory(id: string) {
    if (!user) return;
    try {
      await deleteAnalysis(user.uid, id);
      if (activeId === id) {
        setActiveId(null);
        setResult(null);
      }
    } catch (e: any) {
      setError(e?.message ?? "Could not delete session");
    }
  }

  async function handleRenameHistory(id: string, newName: string) {
    if (!user) return;
    try {
      await renameAnalysis(user.uid, id, newName);
      if (activeId === id) setAnalyzedName(newName);
    } catch (e: any) {
      setError(e?.message ?? "Could not rename session");
    }
  }

  function handleSelectHistory(r: AnalysisRecord) {
    setActiveId(r.id);
    setSql(r.sqlText);
    setFileName(r.fileName);
    setWasUploaded(true);
    setResult(r.result);
    setAnalyzedSql(r.sqlText);
    setAnalyzedName(r.fileName);
    setAnalyzedUploaded(true);
    setError(null);
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
    );
  }

  // ---- Admin route ----
  if (isAdminRoute) {
    if (!user) return <AdminLogin />;
    return <Admin user={user} sharedTables={sharedTables} builtinTableNames={BUILTIN_TABLE_NAMES} />;
  }

  // ---- Main tool ----
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
            <a href="/admin" className="text-sm text-amex-blue hover:underline">Admin</a>
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
            onChange={(s, f, uploaded) => {
              setSql(s);
              setFileName(f);
              setWasUploaded(uploaded);
            }}
            onAnalyze={handleAnalyze}
          />
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {result && (
            <Results
              result={result}
              sql={analyzedSql}
              fileName={analyzedName}
              wasUploaded={analyzedUploaded}
            />
          )}
        </div>

        <HistoryPanel
          records={records}
          activeId={activeId}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onRename={handleRenameHistory}
        />
      </main>
    </div>
  );
}
