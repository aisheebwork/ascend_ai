# User Flows

**Purpose:** Describe how users interact with the product.
**Audience:** product, devs. **Last Updated:** 2026-06-04. **Owner:** project.
**Related:** [FEATURE_CATALOG.md](FEATURE_CATALOG.md) · [PRODUCT_VISION.md](PRODUCT_VISION.md)

## Flow A — Analyze a query
- **Goal:** Find PII/partition issues in a BigQuery query and get advice.
- **Start / Trigger:** Signed-in user on the main page.
- **Primary path:**
  1. Paste SQL or upload a `.sql`/`.hql` file (FEATURE-002).
  2. Click **Analyze** → `/api/analyze` (token attached) → findings + suggestions.
  3. Review detected tables, PII table, partition table, suggestions (FEATURE-003/004/005).
  4. Run is auto-saved to history (FEATURE-006).
- **Alternative paths:** Load a past run from the History panel; re-analyze after edits.
- **Failure paths:** Not signed in → blocked; Gemini down → rule-based suggestions; oversized SQL → 413.
- **Edge cases:** Unknown tables shown as "unknown"; commented-out filters ignored.
- **Personas:** Data Engineer (primary).

## Flow B — Sign in
- **Goal:** Access the tool.
- **Primary path:** Click **Sign in with Google** → choose account → tool loads.
- **Failure paths:** `auth/unauthorized-domain` → add the deployment domain in Firebase (see STEP_BY_STEP Part D); popup blocked → allow popups.

## Flow C — Add metadata (FEATURE-007)
- **Goal:** Teach the tool about more tables.
- **Primary path:**
  1. In the **Metadata library** card, click **Add metadata JSON**.
  2. Select one or more Cornerstone-format JSON files.
  3. Files are parsed, merged, and saved to the shared library; used in all future analyses.
- **Alternative:** **View tables** to inspect built-in + added metadata.
- **Failure paths:** Non-JSON / wrong shape → inline error; Firestore rules not published → permission error.

## UX traceability
Every feature maps to at least one flow and the Data Engineer persona. Features
without user value should be challenged (none currently).
