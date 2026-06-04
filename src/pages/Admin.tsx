import { signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { isAdmin } from "../../functions/_lib/admins";
import type { StoredTable } from "../lib/metadataStore";
import MetadataManager from "../components/MetadataManager";
import ShareSqlSection from "../components/admin/ShareSqlSection";
import ReformedExamplesSection from "../components/admin/ReformedExamplesSection";

interface Props {
  user: User;
  sharedTables: StoredTable[];
  builtinTableNames: string[];
}

export default function Admin({ user, sharedTables, builtinTableNames }: Props) {
  const admin = isAdmin(user.email);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-amex-dark">Admin</h1>
            <p className="text-xs text-slate-500">Metadata · shared SQL · reformed examples</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-amex-blue hover:underline">← Tool</a>
            <span className="text-sm text-slate-600">{user.email}</span>
            <button
              onClick={() => signOut(auth)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-6 py-6">
        {!admin ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-800">
            <h2 className="font-semibold">Not authorized</h2>
            <p className="mt-1 text-sm">
              <strong>{user.email}</strong> is not on the admin allowlist. Ask an existing admin to
              add your email to <code>functions/_lib/admins.ts</code> (and <code>firestore.rules</code>),
              then redeploy.
            </p>
          </div>
        ) : (
          <>
            <MetadataManager
              sharedTables={sharedTables}
              builtinTableNames={builtinTableNames}
              userEmail={user.email ?? null}
            />
            <ShareSqlSection userEmail={user.email ?? null} />
            <ReformedExamplesSection userEmail={user.email ?? null} />
          </>
        )}
      </main>
    </div>
  );
}
