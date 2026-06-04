// ============================================================================
// ADMIN ALLOWLIST — add admin email addresses here.
// ----------------------------------------------------------------------------
// This is the SINGLE place the app reads admin emails from (UI gating + checks).
// For Firestore DB-level enforcement, the SAME list is mirrored in
// `firestore.rules` (function isAdmin) — keep the two in sync.
// Emails are compared case-insensitively.
// ============================================================================
export const ADMIN_EMAILS: string[] = [
  // "your.name@accenture.com",
  // "another.admin@aexp.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((a) => a.trim().toLowerCase() === e);
}
