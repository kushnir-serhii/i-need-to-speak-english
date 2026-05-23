<!-- This document describes HOW to build the feature at an architectural level. -->

# Technical Specification: Anonymous Access with Daily User Cap

- **Functional Specification:** [context/spec/002-anonymous-access/functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

> **Context:** Spec 001 Slices 1–3 are already complete — cleanup, Zustand stores, fonts, MongoDB connection singleton, and the `User` Mongoose model exist. This spec replaces the auth mechanism: the `User` model becomes `Visitor`, the `POST /api/auth` route is replaced by `POST /api/enroll` and `GET /api/stats`, and `useUserStore` is updated for anonymous enrollment. No login page is built; enrollment happens silently in the root layout.

---

## 1. High-Level Technical Approach

On every app load, the root `(admin)` layout runs a client-side enrollment check:

1. Read `visitorId` from Zustand (`useUserStore`) — rehydrated automatically from `localStorage`.
2. **If `visitorId` exists** → visitor is returning. Call `GET /api/stats` to fetch the current visitor count for the header, then render the app.
3. **If `visitorId` is null** → visitor is new. Call `POST /api/enroll`:
   - **Cap not reached** → API creates a `Visitor` document, returns `{ enrolled: true, visitorId, count, cap }`. Store `visitorId` in `useUserStore`, set `intse-visitor` cookie for middleware future use, render name prompt then app.
   - **Cap reached** → API returns `{ enrolled: false, count, cap }`. Render the "Daily Limit Reached" screen instead of the app.

No redirect, no login page, no middleware for enrollment — the layout handles everything client-side. Middleware is removed entirely from this feature's scope.

**Systems affected:** `useUserStore`, `useSettingsStore`, `src/lib/db/models/Visitor.ts` (replaces `User.ts`), two API routes (`/api/enroll`, `/api/stats`), the root `(admin)/layout.tsx`, and the app header component.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Remove Spec 001 Auth Artifacts

The following files built in spec 001 Slice 3 must be replaced or removed before implementing this spec:

| File | Action | Reason |
|---|---|---|
| `src/app/api/auth/route.ts` | **Delete** | Name-based auth replaced by anonymous enrollment |
| `src/lib/db/models/User.ts` | **Replace** with `Visitor.ts` | Schema changes (name → visitorId UUID) |
| `src/middleware.ts` | **Delete** (if created) | Enrollment happens in layout, not middleware |
| `src/app/login/page.tsx` | **Delete** (if created) | No login page in anonymous model |

---

### 2.2 Database — Visitor Model

**File:** `src/lib/db/models/Visitor.ts`  
**Collection:** `visitors`

| Field | Type | Constraints | Default |
|---|---|---|---|
| `visitorId` | String | required, unique, trim | — |
| `enrolledAt` | Date | required | `Date.now` |
| `dailyRequests` | Number | min: 0 | `0` |
| `dailyTokens` | Number | min: 0 | `0` |
| `lastResetAt` | Date | required | `Date.now` |

**Indexes:**
- Unique index on `visitorId`
- Standard index on `enrolledAt` (used for daily count aggregation)

**Model registration guard:** `mongoose.models.Visitor || mongoose.model('Visitor', ...)` to survive Next.js hot-reload.

**Daily count query:** Count documents where `enrolledAt >= start of today UTC`. No separate stats collection needed.

---

### 2.3 Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes (already set from spec 001) |
| `DAILY_VISITOR_CAP` | Maximum new visitors allowed per day | Yes — set in Vercel dashboard and `.env.local` |
| `DAILY_REQUEST_LIMIT` | Maximum AI requests per visitor per day (default key only) | Yes — set in Vercel dashboard and `.env.local` |

Both limit variables are read server-side only inside the API routes. Never exposed to the browser bundle.

---

### 2.4 API Routes

#### `POST /api/enroll`

Called once by new visitors (no `visitorId` in storage).

**Request:** No body required. The server generates the `visitorId`.

**Logic (plain English):**
1. Call `connectDB()`.
2. Read `DAILY_VISITOR_CAP` from env; parse as integer.
3. Calculate start of today in UTC.
4. Count documents in `visitors` where `enrolledAt >= startOfToday`.
5. If count >= cap → return `200 { enrolled: false, count, cap }`.
6. Generate a new UUID v4 string as `visitorId`.
7. Create a `Visitor` document: `{ visitorId, enrolledAt: now, dailyRequests: 0, dailyTokens: 0, lastResetAt: now }`.
8. Re-count total enrolled today (after insert) for the response.
9. Return `200 { enrolled: true, visitorId, count: newCount, cap }`.
10. On any database error → return `500 { error: "server_error" }`.

**Success responses:**

```
// New visitor enrolled:
200 { enrolled: true, visitorId: string, count: number, cap: number }

// Cap reached:
200 { enrolled: false, count: number, cap: number }
```

**Note:** No `visitorId` is passed in the request. The server generates it. The client stores it after receiving the response.

---

#### `GET /api/stats`

Called by returning visitors on each app load to refresh the header counter.

**Request:** Visitor's `visitorId` passed as a query param: `GET /api/stats?visitorId=<id>`

**Logic (plain English):**
1. Call `connectDB()`.
2. Read `DAILY_VISITOR_CAP` from env.
3. Count visitors enrolled today (same query as enroll route).
4. Look up the visitor's `dailyRequests` and `lastResetAt` by `visitorId`.
5. Apply daily reset if needed (see §2.6).
6. Return `200 { count, cap, dailyRequests, dailyRequestLimit }`.

**Response:**
```
200 {
  count: number,          // visitors enrolled today
  cap: number,            // daily visitor cap
  dailyRequests: number,  // this visitor's requests today
  dailyRequestLimit: number
}
```

---

### 2.5 Zustand Store Updates

#### `useUserStore` — `src/store/useUserStore.ts` (replace existing)

| Field / Action | Type | Description |
|---|---|---|
| `visitorId` | `string \| null` | UUID assigned at enrollment; null = not yet enrolled |
| `visitorCount` | `number` | Today's enrolled visitor count (from last API response) |
| `dailyCap` | `number` | Daily visitor cap (from last API response) |
| `dailyRequests` | `number` | This visitor's request count today |
| `dailyRequestLimit` | `number` | Per-visitor request limit |
| `enroll(visitorId, count, cap)` | action | Set `visitorId`, `visitorCount`, `dailyCap`; write `intse-visitor` cookie |
| `updateStats(count, cap, dailyRequests, dailyRequestLimit)` | action | Refresh counter fields from API response |
| `incrementRequests()` | action | Increment `dailyRequests` locally after each successful chat message |
| `reset()` | action | Clear `visitorId`, reset all counts; expire `intse-visitor` cookie |

- **Persistence key:** `intse-user` (same key, already in localStorage — content structure changes)
- **Cookie written by `enroll()`:** `intse-visitor=<visitorId>; max-age=31536000; path=/` (1 year — visitor is permanent on this device)

#### `useSettingsStore` — `src/store/useSettingsStore.ts` (add one field)

Add to existing store (theme + targetLanguage already there):

| New Field / Action | Type | Description |
|---|---|---|
| `visitorName` | `string \| null` | Display name from the one-time prompt; null = skipped or not yet prompted |
| `setVisitorName(name)` | action | Save the name after the prompt; accepts null (skip) |
| `hasSeenNamePrompt` | `boolean` | Whether the name prompt has been shown; default `false` |
| `markNamePromptSeen()` | action | Sets `hasSeenNamePrompt` to true after prompt is shown |

- **Persistence key:** `intse-settings` (same key, already in localStorage)

---

### 2.6 Daily Counter Reset Logic

Applied server-side at the start of each `/api/stats` call (and pre-checked in the chat API in Phase 2):

1. Read the visitor's `lastResetAt` from the `Visitor` document.
2. Compare to the start of today UTC.
3. If `lastResetAt < startOfToday` → set `dailyRequests = 0`, `dailyTokens = 0`, `lastResetAt = now` via a `findOneAndUpdate`.
4. Return the freshly reset values.

No cron job or scheduled function is needed — resets happen lazily on first access each day.

---

### 2.7 Frontend — Enrollment Flow in Root Layout

**File:** `src/app/(admin)/layout.tsx`

This layout is a **Server Component** by default. The enrollment check requires client-side access (localStorage, cookie writing). Wrap the enrollment logic in a dedicated **Client Component** that is imported into the layout.

**New file:** `src/components/common/EnrollmentGate.tsx` (Client Component)

**Responsibilities:**
1. On mount, read `useUserStore.visitorId`.
2. If `visitorId` is present → call `GET /api/stats?visitorId=<id>` → call `updateStats()` → render children (the app).
3. If `visitorId` is null → call `POST /api/enroll`:
   - Response `enrolled: true` → call `useUserStore.enroll()` → render the **NamePrompt** component (§2.8).
   - Response `enrolled: false` → render the **DailyLimitScreen** component (§2.9).
4. While the API call is in-flight → render a minimal loading state (spinner or skeleton, no layout flash).

**Integration:** `(admin)/layout.tsx` wraps `children` with `<EnrollmentGate>{children}</EnrollmentGate>`.

---

### 2.8 Frontend — Name Prompt Component

**File:** `src/components/ui/NamePrompt.tsx` (Client Component)

Shown once to newly enrolled visitors, as an overlay or full-screen panel before the dashboard.

| Element | Detail |
|---|---|
| Heading | "What's your name?" — Inter 700, 24px |
| Subtext | "We'll use it to greet you." — Inter 400, muted |
| Text input | Full-width, placeholder "Your name", no validation required |
| "Let's go" button | Full-width, accent, always enabled |
| "Skip" link | Small, muted, below the button |

**Behaviour:**
- "Let's go" → calls `useSettingsStore.setVisitorName(input.trim() || null)` + `markNamePromptSeen()` → unmounts prompt, reveals dashboard.
- "Skip" → calls `setVisitorName(null)` + `markNamePromptSeen()` → unmounts prompt, reveals dashboard.
- Once `hasSeenNamePrompt` is `true` in the store (persisted) → never shown again.

**Triggering:** `EnrollmentGate` renders `<NamePrompt>` only when `enrolled: true` AND `!hasSeenNamePrompt`.

---

### 2.9 Frontend — Daily Limit Screen

**File:** `src/app/full/page.tsx` **or** rendered inline by `EnrollmentGate`

Recommendation: render inline within `EnrollmentGate` rather than a separate route — avoids a redirect and keeps the experience seamless.

| Element | Detail |
|---|---|
| INTSE logo + name | Centered, top |
| Message | "We've reached our daily visitor limit. Come back tomorrow!" — Inter 700, 24px |
| Counter | "X / Y visitors today" — JetBrains Mono, muted |
| Background | Full-viewport, dark theme default |

No navigation, no input, no links.

---

### 2.10 Frontend — Visitor Counter in Header

**File:** `src/layout/Header.tsx` (update existing)

Read `useUserStore.visitorCount` and `useUserStore.dailyCap` from the store. Render:

```
<span class="font-mono text-muted text-sm">
  {visitorCount} / {dailyCap} visitors today
</span>
```

- Uses JetBrains Mono (already loaded via `--font-mono` CSS variable).
- Updates reactively when `updateStats()` is called after each app load.
- Visible on all pages of the app.

---

### 2.11 Architecture Document Update

The following sections of `context/product/architecture.md` need updating to reflect the pivot:

| Section | Change |
|---|---|
| §4 External Services — Identity | Update: "No auth provider. Anonymous UUID assigned client-side, stored in browser. Server tracks daily visitor count and per-visitor request counters in MongoDB." |
| §2 Data & Persistence — `users` collection | Rename to `visitors` collection; update field list |
| §1 Zustand stores — `useUserStore` | Update field names: `visitorId`, `visitorCount`, `dailyCap`, `dailyRequests`, `dailyRequestLimit` |

---

## 3. Impact and Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| Visitor clears browser storage / uses incognito | Visitor gets a fresh ID — counts as a new visitor against the daily cap | Known and acceptable. Incognito users consuming cap slots is a minor edge case. |
| UUID collision | Practically impossible (UUID v4 has 2^122 unique values) | No mitigation needed. |
| Race condition: two simultaneous enrollments at the cap boundary | Both could be allowed, exceeding the cap by 1 | MongoDB's atomic `countDocuments` + `create` is not truly atomic. Use a MongoDB unique index + retry pattern in Phase 2 if over-cap is unacceptable. For now, cap + 1 is acceptable. |
| `DAILY_VISITOR_CAP` / `DAILY_REQUEST_LIMIT` not set | API throws on `parseInt(undefined)` | Default to safe fallback values (e.g., cap: 100, limit: 20) if env var is missing. |
| Cold-start latency on Vercel for `/api/enroll` | 200–500 ms on first request | Connection singleton caches across warm invocations. Loading state in `EnrollmentGate` covers the delay. |
| Visitor counter shows stale data | Count shown may lag behind reality by one page load | Acceptable — this is a display counter, not a billing system. Freshness at load time is sufficient. |

---

## 4. Testing Strategy

**API — `POST /api/enroll`**
```bash
# First enrollment — should succeed
curl -s -X POST http://localhost:3000/api/enroll | cat
# Expected: { enrolled: true, visitorId: "...", count: 1, cap: <DAILY_VISITOR_CAP> }

# Same request again (new UUID generated each time, always enrolls)
curl -s -X POST http://localhost:3000/api/enroll | cat
# Expected: { enrolled: true, visitorId: "...", count: 2, cap: <DAILY_VISITOR_CAP> }

# Set DAILY_VISITOR_CAP=1 in .env.local, restart, try a second enrollment
curl -s -X POST http://localhost:3000/api/enroll | cat
# Expected: { enrolled: false, count: 1, cap: 1 }
```

**API — `GET /api/stats`**
```bash
curl -s "http://localhost:3000/api/stats?visitorId=<id-from-enroll>" | cat
# Expected: { count: N, cap: N, dailyRequests: 0, dailyRequestLimit: <DAILY_REQUEST_LIMIT> }
```

**Enrollment flow — browser**
- Open app in a fresh private window (no localStorage) → brief loading state → name prompt appears.
- Type a name, tap "Let's go" → dashboard appears with "Hi, [name]!".
- Close and reopen the same private window → dashboard appears immediately, no name prompt.
- Set `DAILY_VISITOR_CAP=0` in env, restart, open in a new private window → Daily Limit screen appears.

**Header counter**
- Confirm "X / Y visitors today" is visible in the header on the dashboard.
- Enroll a second visitor → reload → count increments.

**Environment**
- `MONGODB_URI` (already set)
- `DAILY_VISITOR_CAP` — add to `.env.local` and Vercel dashboard
- `DAILY_REQUEST_LIMIT` — add to `.env.local` and Vercel dashboard
