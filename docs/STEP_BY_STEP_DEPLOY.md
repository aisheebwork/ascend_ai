# Step-by-Step Deployment (for a complete beginner)

Follow these in order. Each step says exactly what to click and what to copy.
You will use 3 free websites: **GitHub** (stores code), **Firebase** (login +
database), **Cloudflare Pages** (runs the website).

Estimated time: ~30–45 minutes the first time.

---

## PART A — Put the code on GitHub

The code is already committed on your computer. You just need to upload (push) it.

### A1. Sign in to GitHub as `aisheebwork` inside VSCode
1. In VSCode, look at the **bottom-left corner** — click the **person/account icon** (⚙️ is settings; the person icon is just above it).
2. Click **"Sign in to GitHub"** (or "Manage Trusted… → GitHub").
3. A browser opens → log in as **aisheebwork** → click **Authorize Visual Studio Code**.
4. Come back to VSCode.

### A2. Push the code
1. Open the terminal in VSCode: top menu **Terminal → New Terminal**.
2. Type this and press Enter:
   ```
   git push -u origin main
   ```
3. If a window/browser pops up asking you to sign in to GitHub, **sign in as aisheebwork** and approve.
4. When it finishes you'll see lines ending in `branch 'main' set up to track 'origin/main'`.

✅ **Check:** open <https://github.com/aisheebwork/ascend_ai> in a browser — you should see all the files.

> **If it says "denied to prjsab01"** (the wrong account): in the terminal run
> `git credential-manager github logout` then repeat A2. Sign in as aisheebwork when prompted.

---

## PART B — Set up Firebase (login + saved history)

### B1. Create the Firebase project
1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **"Create a project"** (or "Add project").
3. Name it e.g. **ascend-ai** → **Continue**.
4. Google Analytics: toggle **OFF** (not needed) → **Create project** → wait → **Continue**.

### B2. Turn on Google Sign-In
1. Left menu → **Build → Authentication** → **Get started**.
2. Tab **Sign-in method** → click **Google** in the list.
3. Toggle **Enable** ON → pick your email as "support email" → **Save**.

### B3. Create the database (Firestore)
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Choose a location (any close region) → **Next**.
3. Select **Start in production mode** → **Create**. (We add the security rules in B6.)

### B4. Register a Web App and copy the config
1. Click the **gear icon ⚙️ (top-left) → Project settings**.
2. Scroll to **"Your apps"** → click the **`</>` (web)** icon.
3. App nickname: **ascend-ai-web** → **Register app** (skip Hosting if asked).
4. You'll see a code block with `const firebaseConfig = { ... }`. **Keep this page open** — you'll copy 6 values from it in Part C. They look like:
   ```
   apiKey: "AIzaSy...."
   authDomain: "ascend-ai.firebaseapp.com"
   projectId: "ascend-ai"
   storageBucket: "ascend-ai.appspot.com"
   messagingSenderId: "1234567890"
   appId: "1:1234567890:web:abcdef..."
   ```

### B5. Note your Project ID
On the same **Project settings** page, near the top, copy **Project ID** (e.g. `ascend-ai`).
You'll need it twice (as `VITE_FIREBASE_PROJECT_ID` and `FIREBASE_PROJECT_ID`).

### B6. Apply the database security rules (so each user sees only their own data)
1. Left menu → **Build → Firestore Database** → tab **Rules**.
2. Delete everything in the box and paste exactly this:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/analyses/{analysisId} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
3. Click **Publish**.

> **Re-publish whenever `firestore.rules` changes.** The rules now also cover a
> shared **`sharedMetadata`** collection used by the "Add metadata" feature. If
> you deployed an earlier version, copy the latest contents of
> [`../firestore.rules`](../firestore.rules) into the Rules box and Publish
> again — otherwise adding metadata will fail with a permissions error.

---

## PART C — Deploy on Cloudflare Pages (the actual website)

### C1. Create a Cloudflare account
1. Go to <https://dash.cloudflare.com/sign-up> → create a free account → verify your email.

### C2. Connect the GitHub repo
1. In the Cloudflare dashboard, left menu → **Workers & Pages**.
2. Click **Create** → tab **Pages** → **Connect to Git**.
3. Click **Connect GitHub** → authorize → choose the **aisheebwork** account.
4. Pick the repository **`ascend_ai`** → **Begin setup**.

### C3. Build settings
Fill these exactly:
- **Project name:** `ascend-ai` (this becomes your URL: `ascend-ai.pages.dev`)
- **Production branch:** `main`
- **Framework preset:** `None` (or "Vite" if offered)
- **Build command:** `npm run build`
- **Build output directory:** `dist`

**Do NOT click Save yet** — first add the variables in C4 (there's an
"Environment variables (advanced)" section on this same page).

### C4. Add only the 2 SECRETS in the dashboard
The 6 public `VITE_FIREBASE_*` values are committed in `.env.production` and
baked into the build automatically — **you do NOT enter them in the dashboard.**
(That is why Cloudflare says *"variables are managed through wrangler.toml; only
Secrets can be managed via the Dashboard"* — perfect, secrets is all we need.)

Go to **Settings → Variables and Secrets** (or the "Environment variables
(advanced)" section during setup) → **Add → type: Secret** → add these two:

| Name | Value | Type |
|---|---|---|
| `GEMINI_API_KEY` | _the Gemini key you were given_ (it's also in your local `.dev.vars`) | Secret (encrypted) |
| `FIREBASE_PROJECT_ID` | `ascend-ai-acn` | Secret (encrypted) |

> The Gemini key is intentionally **not written in this file** — secrets must
> never be committed to the repo (GitHub blocks it). Copy it from your local
> `.dev.vars` file when pasting into the Cloudflare dashboard.

Set them for **Production** (and Preview if offered). Save.

> Note: if the Gemini key is invalid/expired, the app still works — it just
> shows rule-based suggestions instead of AI-written ones. Nothing breaks.

### C5. Deploy
1. Click **Save and Deploy**.
2. Wait 1–3 minutes for the build to finish (you'll see logs; it ends with "Success").
3. You get a URL like **`https://ascend-ai.pages.dev`**. Copy it.

---

## PART D — Let Google login work on your live site

1. Back in **Firebase Console → Build → Authentication → Settings** tab →
   **Authorized domains** → **Add domain**.
2. Paste your Cloudflare domain **without** `https://`, e.g. `ascend-ai.pages.dev` → **Add**.

---

## PART E — Try it!

1. Open your `https://ascend-ai.pages.dev` site.
2. Click **Sign in with Google** → choose your account.
3. Paste this test query and click **Analyze**:
   ```sql
   select cm15, amt_trans
   from `axp-lumi.dw.triumph_transactions`
   where code_trans = '0410'
   ```
4. You should see:
   - **PII column** `cm15` flagged (tag `NGBD-SDE-CM15`), and
   - a **partition warning**: add a filter on `date_stmt_yr`.
5. Refresh — your run appears under **Previous analyses** on the right.

🎉 Done. Every time you (as aisheebwork) push to GitHub `main`, Cloudflare
rebuilds and redeploys automatically.

---

## PART F — Add more metadata over time (no redeploy needed)

The tool ships with the `triumph_transactions` metadata built in. To teach it
about **more tables**, you (or any signed-in user) can add metadata JSON live:

1. On the site, find the **"Metadata library"** card at the top.
2. Click **Add metadata JSON** and pick one or more `.json` files in the **same
   format** as the bundled metadata (the Cornerstone dataset shape with
   `external_reference_details.table_name` and `schema.schema_attributes`).
3. They're parsed, saved to a **shared library** (Firestore `sharedMetadata`),
   and immediately merged into every future analysis — no rebuild/redeploy.
4. Click **View tables** to see everything currently available (built-in + added).

Notes:
- Multi-part files for one table are merged automatically (columns deduped).
- Re-uploading a table merges/updates it.
- The library is **shared across all users** of your deployment, so the metadata
  keeps improving for everyone.

---

## If something goes wrong
| Symptom | Fix |
|---|---|
| Cloudflare build fails | Open the build log; usually a typo in build command (`npm run build`) or output dir (`dist`). |
| "auth/unauthorized-domain" on login | You skipped **Part D** — add the `.pages.dev` domain in Firebase. |
| Login popup blocked | Allow popups for your site, try again. |
| Sign-in works but history empty | Re-check the Firestore **Rules** (Part B6) are published. |
| Push says "denied to prjsab01" | `git credential-manager github logout`, then `git push -u origin main` and sign in as aisheebwork. |
