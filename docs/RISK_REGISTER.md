# Risk Register

**Purpose:** Track project risks. **Audience:** all. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [SECURITY_MODEL.md](SECURITY_MODEL.md) · [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md)

Categories: Product · Technical · Security · Operational · Legal · Vendor · Financial · AI.

| Risk | Description | Category | Likelihood | Impact | Severity | Mitigation | Contingency | Status |
|---|---|---|---|---|---|---|---|---|
| RISK-001 | Heuristic SQL parsing misses constructs (alias shadowing, dynamic SQL) | Technical | Medium | Medium | Medium | Deterministic; never rewrites; flags for review (DEBT-001) | Manual review; add real parser | Open |
| RISK-002 | Gemini key invalid / quota / outage | AI/Vendor | Medium | Low | Low | Rule-based fallback always available | None needed | Mitigated |
| RISK-003 | Any signed-in user can add/overwrite shared metadata | Operational/Security | Medium | Medium | Medium | Auth required; no delete; shape validation | Add ownership/validation; review entries | Open |
| RISK-004 | Vendor lock-in (Firebase, Cloudflare, Gemini) | Vendor | Low | Medium | Low | Analysis logic provider-agnostic; Gemini optional | Port to alt host/LLM | Accepted |
| RISK-005 | Metadata contains owner emails (mild PII) | Legal/Security | Low | Low | Low | Stored behind auth in Firestore | Restrict fields if required | Open [Needs Human Validation] |
| RISK-006 | Request grows as shared metadata grows | Technical | Low | Low | Low | Caps (500 tables); fine at current scale (DEBT-005) | Server-side metadata read | Open |
| RISK-007 | Accidental secret commit | Security | Low | High | Medium | gitignore + GitHub push protection (caught one) | Rotate key; history rewrite | Mitigated |
| RISK-008 | No token revocation check (JWKS-only verify) | Security | Low | Low | Low | Short token lifetimes; iss/aud checks (DEBT-002) | Adopt Admin SDK if needed | Accepted |

## Vendor risk note
Dependencies: Cloudflare Pages (host + Functions), Firebase (Auth + Firestore),
Google Gemini (suggestions, optional). No hidden lock-in beyond these; Gemini is
non-essential due to the fallback.
