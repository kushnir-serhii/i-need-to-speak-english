# Tasks: Anonymous Access with Daily User Cap

> **Rule:** The application must remain buildable and runnable after every slice is completed.
> **Verification tools available:** `npm run build`, `npm run dev`, `curl` (API), manual browser.
> **No browser MCP installed** — UI verification steps are manual.

---

## Slice 1 — Remove Spec 001 Auth Artifacts + Environment Setup

> **Why first:** The auth artifacts from spec 001 conflict with this spec. The app must be clean before any new code is written. Env vars must exist before the API routes try to read them.

- [x] **1.1** Delete `src/app/api/auth/route.ts` (spec 001 auth handler, replaced by `/api/enroll`). **[Agent: general-purpose]**
- [x] **1.2** Delete `src/lib/db/models/User.ts` (replaced by `Visitor.ts` in Slice 2). **[Agent: general-purpose]**
- [x] **1.3** Delete `src/middleware.ts` if it exists (enrollment moves to client-side `EnrollmentGate`). **[Agent: general-purpose]**
- [x] **1.4** Delete `src/app/login/page.tsx` and the `src/app/login/` directory if they exist. **[Agent: general-purpose]**
- [x] **1.5** Add to `.env.local`:
  ```
  DAILY_VISITOR_CAP=100
  DAILY_REQUEST_LIMIT=20
  ```
  **[Agent: general-purpose]**
- [x] **1.6** Verify the build passes after removals:
  ```
  npm run build
  ```
  Expected: zero TypeScript errors, no "Module not found" errors. **[Agent: general-purpose]**

---

## Slice 2 — Visitor Model + `POST /api/enroll`

> **Why second:** The enrollment API is the foundation — the frontend depends on it. Verifiable entirely with `curl` before touching the browser.

- [x] **2.1** Create `src/lib/db/models/Visitor.ts` — Mongoose Visitor model:
  - Fields: `visitorId` (String, required, unique, trim), `enrolledAt` (Date, required, default `Date.now`), `dailyRequests` (Number, min 0, default 0), `dailyTokens` (Number, min 0, default 0), `lastResetAt` (Date, required, default `Date.now`)
  - Unique index on `visitorId`; standard index on `enrolledAt`
  - Collection name: `visitors`
  - Model registration guard: `mongoose.models.Visitor || mongoose.model(...)`
  **[Agent: mongodb-database]**

- [x] **2.2** Create `src/app/api/enroll/route.ts` — `POST /api/enroll`:
  - Call `connectDB()`
  - Read `DAILY_VISITOR_CAP` from env; default to `100` if missing
  - Count `visitors` where `enrolledAt >= start of today UTC`
  - If count >= cap → return `200 { enrolled: false, count, cap }`
  - Generate UUID v4 via `crypto.randomUUID()`
  - Create `Visitor` document: `{ visitorId, enrolledAt: now, dailyRequests: 0, dailyTokens: 0, lastResetAt: now }`
  - Re-count after insert → return `200 { enrolled: true, visitorId, count: newCount, cap }`
  - On DB error → return `500 { error: "server_error" }`
  **[Agent: nextjs-backend]**

- [x] **2.3** Verify with `curl` (run `npm run dev` first):
  ```bash
  # First enrollment — should succeed
  curl -s -X POST http://localhost:3000/api/enroll | cat
  # Expected: { enrolled: true, visitorId: "...", count: 1, cap: 100 }

  # Second enrollment — new UUID, should also succeed
  curl -s -X POST http://localhost:3000/api/enroll | cat
  # Expected: { enrolled: true, visitorId: "...", count: 2, cap: 100 }

  # Cap enforcement — set DAILY_VISITOR_CAP=2 in .env.local, restart dev server
  curl -s -X POST http://localhost:3000/api/enroll | cat
  # Expected: { enrolled: false, count: 2, cap: 2 }
  ```
  Restore `DAILY_VISITOR_CAP=100` after verification. **[Agent: general-purpose]**

---

## Slice 3 — `GET /api/stats` + Lazy Daily Reset

> **Why third:** Returning visitors need stats on each page load. The daily reset logic lives here. Verifiable with `curl` before touching the frontend.

- [x] **3.1** Create `src/app/api/stats/route.ts` — `GET /api/stats?visitorId=<id>`:
  - Call `connectDB()`
  - Read `DAILY_VISITOR_CAP` and `DAILY_REQUEST_LIMIT` from env; default to `100` / `20` if missing
  - Count visitors enrolled today (same start-of-today UTC query as enroll route)
  - Look up visitor's `dailyRequests` and `lastResetAt` by `visitorId`
  - **Lazy daily reset:** if `lastResetAt < start of today UTC` → `findOneAndUpdate` to set `dailyRequests = 0`, `dailyTokens = 0`, `lastResetAt = now`; use the reset values in the response
  - Return `200 { count, cap, dailyRequests, dailyRequestLimit }`
  - If `visitorId` not found → return `404 { error: "not_found" }`
  **[Agent: nextjs-backend]**

- [x] **3.2** Verify with `curl`:
  ```bash
  # Replace <id> with a visitorId returned from Slice 2.3
  curl -s "http://localhost:3000/api/stats?visitorId=<id>" | cat
  # Expected: { count: N, cap: 100, dailyRequests: 0, dailyRequestLimit: 20 }

  # Unknown visitorId
  curl -s "http://localhost:3000/api/stats?visitorId=nonexistent-id" | cat
  # Expected: 404 { error: "not_found" }
  ```
  **[Agent: general-purpose]**

---

## Slice 4 — Update Zustand Stores

> **Why fourth:** Both stores must be updated before the frontend enrollment flow can call them. Verified by a clean TypeScript build.

- [x] **4.1** Replace `src/store/useUserStore.ts` with the new anonymous-enrollment store:
  - Fields: `visitorId: string | null` (default `null`), `visitorCount: number` (default `0`), `dailyCap: number` (default `0`), `dailyRequests: number` (default `0`), `dailyRequestLimit: number` (default `0`)
  - Action `enroll(visitorId: string, count: number, cap: number)` — sets `visitorId`, `visitorCount`, `dailyCap`; writes cookie `intse-visitor=<visitorId>; max-age=31536000; path=/`
  - Action `updateStats(count: number, cap: number, dailyRequests: number, dailyRequestLimit: number)` — refreshes all counter fields
  - Action `incrementRequests()` — increments `dailyRequests` by 1
  - Action `reset()` — clears `visitorId` to `null`, resets all counts to `0`, expires `intse-visitor` cookie
  - Zustand `persist` middleware with localStorage key `intse-user`
  **[Agent: nextjs-frontend]**

- [x] **4.2** Update `src/store/useSettingsStore.ts` — add to the existing store (keep `theme`, `targetLanguage`, `toggleTheme`):
  - New field: `visitorName: string | null` (default `null`)
  - New field: `hasSeenNamePrompt: boolean` (default `false`)
  - New action: `setVisitorName(name: string | null)` — saves the name
  - New action: `markNamePromptSeen()` — sets `hasSeenNamePrompt` to `true`
  - Persistence key remains `intse-settings`
  **[Agent: nextjs-frontend]**

- [x] **4.3** Search the codebase for any remaining references to deleted `useUserStore` fields (`userId`, `userName`, `isLoggedIn`, `login`, `logout`) — update or remove them. **[Agent: nextjs-frontend]**

- [x] **4.4** Verify the build passes:
  ```
  npm run build
  ```
  Expected: zero TypeScript errors. **[Agent: general-purpose]**

---

## Slice 5 — `EnrollmentGate` + `DailyLimitScreen` (New Visitor Path)

> **Why fifth:** Gets the core enrollment flow visible in the browser. A new visitor either loads the app silently or sees the Daily Limit screen. NamePrompt is wired in Slice 6.

- [x] **5.1** Create `src/components/common/EnrollmentGate.tsx` (Client Component):
  - On mount, read `useUserStore.visitorId`
  - If `visitorId` is **not null** (returning visitor) → call `GET /api/stats?visitorId=<id>` → call `updateStats()` → render `children`
  - If `visitorId` is **null** (new visitor) → call `POST /api/enroll`:
    - `enrolled: true` → call `useUserStore.enroll()` → render `children` (NamePrompt added in Slice 6)
    - `enrolled: false` → render `DailyLimitScreen` inline
  - While API call is in-flight → render a centered loading spinner
  **[Agent: nextjs-frontend]**

- [x] **5.2** Create the `DailyLimitScreen` as an inline component at the bottom of `EnrollmentGate.tsx`:
  - Centered, full-viewport layout, dark theme default
  - INTSE logo/name (top, centered)
  - Message: "We've reached our daily visitor limit. Come back tomorrow!" — Inter 700, 24px
  - Counter: `{count} / {cap} visitors today` — JetBrains Mono, muted
  - No form, no input, no links
  **[Agent: nextjs-frontend]**

- [x] **5.3** Update `src/app/(admin)/layout.tsx` — wrap `{children}` with `<EnrollmentGate>`:
  ```tsx
  <EnrollmentGate>{children}</EnrollmentGate>
  ```
  **[Agent: nextjs-frontend]**

- [x] **5.4** Verify in the browser (manual):
  - `npm run dev` → open `http://localhost:3000` in a **fresh private window** (no localStorage).
  - Expected: brief loading spinner → dashboard loads (new visitor silently enrolled).
  - Set `DAILY_VISITOR_CAP=0` in `.env.local`, restart dev server.
  - Open another private window → Expected: Daily Limit screen — "0 / 0 visitors today".
  - Restore `DAILY_VISITOR_CAP=100` after verification.
  **[Agent: general-purpose]**

---

## Slice 6 — `NamePrompt` (New Visitor Onboarding)

> **Why sixth:** Completes the new-visitor flow. After enrollment succeeds, the name prompt appears once then never again.

- [x] **6.1** Create `src/components/ui/NamePrompt.tsx` (Client Component):
  - Props: `onDone: () => void`
  - Full-screen overlay, dark theme
  - Elements: heading "What's your name?" (Inter 700, 24px), subtext "We'll use it to greet you." (Inter 400, muted), full-width text input (placeholder "Your name"), "Let's go" button (full-width, accent, always enabled), "Skip" link (small, muted, below button)
  - "Let's go" → `setVisitorName(input.trim() || null)` + `markNamePromptSeen()` → call `onDone()`
  - "Skip" → `setVisitorName(null)` + `markNamePromptSeen()` → call `onDone()`
  **[Agent: nextjs-frontend]**

- [x] **6.2** Update `EnrollmentGate.tsx` to conditionally show `NamePrompt` after successful enrollment:
  - After `enrolled: true` and `enroll()` called → check `useSettingsStore.hasSeenNamePrompt`
  - If `!hasSeenNamePrompt` → render `<NamePrompt onDone={() => setShowPrompt(false)} />`
  - Once `onDone` fires (or `hasSeenNamePrompt` is already `true`) → render `children`
  **[Agent: nextjs-frontend]**

- [x] **6.3** Verify in the browser (manual):
  - Open `http://localhost:3000` in a fresh private window → loading → **name prompt appears**.
  - Type a name and tap "Let's go" → dashboard appears, no prompt visible.
  - Close and reopen the same private window → dashboard appears immediately, **no prompt**.
  - Open another fresh private window → tap "Skip" → dashboard appears without entering a name.
  **[Agent: general-purpose]**

---

## Slice 7 — Returning Visitor Recognition + Visitor Counter in Header

> **Why seventh:** Closes the returning-visitor loop and makes the daily counter visible in the header on every page.

- [x] **7.1** Verify the returning-visitor path (manual browser check):
  - With a `visitorId` in localStorage from the previous slice, reload the app.
  - Expected: no loading spinner flash, no enrollment call, dashboard appears immediately.
  - Check browser DevTools → Network → confirm `GET /api/stats` is called (not `POST /api/enroll`).
  **[Agent: general-purpose]**

- [x] **7.2** Update `src/layout/Header.tsx` — add the visitor counter:
  - Read `visitorCount` and `dailyCap` from `useUserStore`
  - Render:
    ```tsx
    <span className="font-mono text-muted text-sm">
      {visitorCount} / {dailyCap} visitors today
    </span>
    ```
  - Uses `--font-mono` (JetBrains Mono). Visible on all pages.
  **[Agent: nextjs-frontend]**

- [x] **7.3** Verify the counter in the browser (manual):
  - Confirm "X / Y visitors today" appears in the header on the dashboard.
  - Enroll a second visitor (fresh private window) → reload the first window → count increments.
  **[Agent: general-purpose]**

---

## Slice 8 — Final Build Verification + Architecture Doc Update

> **Why last:** Confirms the entire spec ships cleanly and the living architecture document reflects the pivot from name-based auth to anonymous enrollment.

- [x] **8.1** Final build verification:
  ```
  npm run build
  ```
  Expected: zero TypeScript errors, zero warnings about missing modules. **[Agent: general-purpose]**

- [x] **8.2** Update `context/product/architecture.md` — three sections:
  - **§4 External Services — Identity:** "No auth provider. Anonymous UUID assigned server-side at first visit, stored in browser localStorage and a 1-year cookie. Server tracks daily visitor count and per-visitor request counters in MongoDB."
  - **§2 Data & Persistence — collection:** rename `users` → `visitors`; update field list to `visitorId`, `enrolledAt`, `dailyRequests`, `dailyTokens`, `lastResetAt`.
  - **§1 Zustand stores — `useUserStore`:** update field names to `visitorId`, `visitorCount`, `dailyCap`, `dailyRequests`, `dailyRequestLimit`.
  **[Agent: general-purpose]**

---

## Subagent Coverage Notes

| Slice / Task | Agent Assigned | Note |
|---|---|---|
| All shell/npm commands, curl, file deletion | `general-purpose` | Build checks, env setup, curl verification |
| Mongoose Visitor model | `mongodb-database` | Schema design, indexes, model guard |
| API routes (`/api/enroll`, `/api/stats`) | `nextjs-backend` | Server-side logic, connectDB, env vars |
| Zustand stores, React components | `nextjs-frontend` | useUserStore, useSettingsStore, EnrollmentGate, NamePrompt, DailyLimitScreen, Header |

## Missing MCP / Tooling Note

| Verification Step | Issue | Recommendation |
|---|---|---|
| All browser UI checks (Slices 5, 6, 7) | No browser MCP installed | Verify manually in browser. Consider installing a Playwright/Puppeteer MCP before Phase 2 for automated UI testing. |
