import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// Firebase ID tokens are RS256 JWTs signed by Google. We verify the signature
// against Google's published x509/JWKS certs and check issuer/audience match
// our Firebase project. This avoids needing the Firebase Admin SDK or a
// service-account credential inside the Cloudflare Pages Function.
//
// Firebase publishes signing keys as x509 certs here:
//   https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
// jose can consume the JWKS endpoint for the same keys:
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export interface VerifiedUser {
  uid: string;
  email?: string;
  name?: string;
}

/**
 * Verify a Firebase ID token. Throws if invalid/expired or project mismatch.
 * @param token  raw JWT from the Authorization: Bearer header
 * @param projectId  Firebase project id (FIREBASE_PROJECT_ID env)
 */
export async function verifyFirebaseToken(
  token: string,
  projectId: string
): Promise<VerifiedUser> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const p = payload as JWTPayload & {
    user_id?: string;
    sub?: string;
    email?: string;
    name?: string;
    auth_time?: number;
  };

  const uid = p.user_id || p.sub;
  if (!uid) throw new Error("token missing subject");
  // Firebase ID tokens must have auth_time in the past.
  if (p.auth_time && p.auth_time * 1000 > Date.now() + 5000) {
    throw new Error("token auth_time in the future");
  }

  return { uid, email: p.email, name: p.name };
}

/** Extract a Bearer token from an Authorization header, or null. */
export function bearerToken(req: Request): string | null {
  const h = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1] : null;
}
