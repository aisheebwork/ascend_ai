import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useState } from "react";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      setError(e?.message ?? "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-amex-dark">BQ SQL Advisor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload BigQuery SQL to detect PII columns and partition-filter issues
          using governed table metadata, and get suggested edits.
        </p>
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-amex-blue px-4 py-2.5 font-medium text-white hover:bg-amex-dark disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
