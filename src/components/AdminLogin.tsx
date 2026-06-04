import { useEffect, useState } from "react";
import {
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

const EMAIL_KEY = "emailForSignIn";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Complete a passwordless email-link sign-in if we arrived via the email link.
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    let stored = window.localStorage.getItem(EMAIL_KEY);
    if (!stored) stored = window.prompt("Confirm your email to finish signing in") ?? "";
    if (!stored) return;
    setBusy(true);
    signInWithEmailLink(auth, stored, window.location.href)
      .then(() => {
        window.localStorage.removeItem(EMAIL_KEY);
        // strip the long sign-in query params from the URL
        window.history.replaceState({}, "", "/admin");
      })
      .catch((e) => setError(e?.message ?? "Email-link sign-in failed"))
      .finally(() => setBusy(false));
  }, []);

  async function google() {
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

  async function sendLink() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    setBusy(true);
    try {
      await sendSignInLinkToEmail(auth, email.trim(), {
        url: `${window.location.origin}/admin`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_KEY, email.trim());
      setInfo(`Sign-in link sent to ${email.trim()}. Open it on this device to continue.`);
    } catch (e: any) {
      setError(e?.message ?? "Could not send sign-in link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-amex-dark">Admin sign-in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Restricted area. Sign in with an authorized admin account.
        </p>

        <button
          onClick={google}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-amex-blue px-4 py-2.5 font-medium text-white hover:bg-amex-dark disabled:opacity-60"
        >
          Sign in with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> OR <span className="h-px flex-1 bg-slate-200" />
        </div>

        <label className="text-sm font-medium text-slate-700">Email sign-in link</label>
        <div className="mt-1 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@accenture.com"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={sendLink}
            disabled={busy}
            className="rounded-lg border border-amex-blue px-3 py-2 text-sm font-medium text-amex-blue hover:bg-amex-blue/10 disabled:opacity-60"
          >
            Send link
          </button>
        </div>

        {info && <p className="mt-4 text-sm text-emerald-700">{info}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <a href="/" className="mt-6 inline-block text-sm text-amex-blue hover:underline">
          ← Back to the tool
        </a>
      </div>
    </div>
  );
}
