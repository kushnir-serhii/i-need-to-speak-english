# Technical Specification: User Roles & Navigation

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

This work touches three layers:

1. **Role normalization** — rename the `'owner'` role string to `'admin'` consistently across the Zustand store, JWT payload, Admin model, and all route handlers. The mapping logic is centralized inside the Zustand store action, so no caller needs to know about the raw API string.
2. **Route restructure** — create a shared personal `/dashboard` page accessible to both USER and ADMIN; move the existing admin stats page from `/dashboard` to `/admin`; keep `/settings` as a secondary route during transition.
3. **New backend endpoints** — three new admin-only API routes: per-visitor usage list, counter-reset action, and a security fix on the existing stats endpoint.

No new external services, no new infrastructure. All changes are confined to the existing Next.js / Zustand / MongoDB stack.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Role Naming Normalization

**Frontend type — `src/store/useUserStore.ts`**

- `UserRole` type changes from `'user' | 'owner' | null` to `'user' | 'admin' | null`.
- A new store action `setRoleFromApi(rawRole: string)` is added. It maps the raw network string to `UserRole` internally (rule: `'owner'` or `'admin'` → `'admin'`; anything else → `'user'`) and then calls `set`. This centralizes the mapping in one place inside the store.
- Both `EnrollmentGate` and `LoginPage` call `setRoleFromApi` instead of `setRole`. They never need to import a mapping utility or know about the API's string values.
- `setRole(role: UserRole)` remains for internal/typed use where the role is already known (e.g., `setRole(null)` on logout).

**Files to update (frontend)**

| File | Change |
|---|---|
| `src/store/useUserStore.ts` | `UserRole` type; add `setRoleFromApi` action |
| `src/components/common/EnrollmentGate.tsx` | Call `setRoleFromApi(meData.role)` on `/api/owner/me` response |
| `src/app/login/page.tsx` | Call `setRoleFromApi(data.role)` on login response |
| `src/app/(admin)/page.tsx` | `role !== 'owner'` → `role !== 'admin'` in `isLimitReached` |
| `src/components/common/Navigation.tsx` | `role === 'owner'` → `role === 'admin'` |

**Backend — role string normalization**

| File | Change |
|---|---|
| `src/lib/db/models/Admin.ts` | `role` enum: remove `'owner'`, keep only `'admin'`; default: `'admin'` |
| `src/app/api/owner/login/route.ts` | Always embed `role: 'admin'` in JWT and response body (not `admin.role` from DB) |
| `src/app/api/owner/me/route.ts` | Fallback `payload.role ?? 'owner'` → `payload.role ?? 'admin'` |
| `src/app/api/owner/seed/route.ts` | Create document with `role: 'admin'`; return `{ role: 'admin' }` |

**Data migration**

One-time MongoDB shell command before deploying backend changes:
`db.admins.updateMany({}, { $set: { role: 'admin' } })`

The `setRoleFromApi` mapping absorbs any brief mixed-state window where old JWTs still contain `'owner'`.

---

### 2.2 Route Restructure & Navigation

**Page inventory after the change**

| URL | File | Who can access |
|---|---|---|
| `/` | `src/app/(admin)/page.tsx` | All enrolled users (USER + ADMIN) |
| `/dashboard` | `src/app/(admin)/dashboard/page.tsx` | All enrolled users (USER + ADMIN) |
| `/admin` | `src/app/(admin)/admin/page.tsx` | ADMIN only |
| `/settings` | `src/app/(admin)/settings/page.tsx` | All enrolled users (secondary, not in primary nav) |
| `/login` | `src/app/login/page.tsx` | Unauthenticated only |

**`/dashboard` — personal Dashboard (new page)**

- `src/app/(admin)/dashboard/page.tsx` is created as the shared personal Dashboard.
- Both USER and ADMIN see identical content here; no role guard beyond being enrolled.
- Initial content (consistent with Phase 4 roadmap): API key input section, usage indicator (requests used / limit for default-key users; token counter for BYO-key users), language selector placeholder, custom system prompt placeholder.
- This page is listed in the primary navigation for both roles.

**`/admin` — Admin Panel (moved from `/dashboard`)**

- `src/app/(admin)/admin/page.tsx` is created by moving the existing `DashboardPage` content from `src/app/(admin)/dashboard/page.tsx`.
- The component is renamed `AdminPanelPage`.
- Route guard: fires only when `role !== null` to avoid a premature redirect during the `EnrollmentGate` loading window. Condition: `role !== 'admin'` → `router.replace('/')`.
- The redundant "Logout" button inside this page is removed; sign-out is handled by `Navigation`.
- Sections:
  - KPI summary cards (existing: total visitors, active today, messages today, tokens today)
  - Bar chart of top visitors by message count (existing)
  - Per-visitor usage table with reset action (new — backed by API in §2.3)
  - Global settings display — shows current env-var values as read-only; settings editor is **deferred to a future spec**
- `src/app/(admin)/dashboard/page.tsx` is deleted in the same commit that creates `/admin` to avoid a 404 gap or overwrite conflict.

**Navigation — `src/components/common/Navigation.tsx`**

| Item | Route | Shown when |
|---|---|---|
| Chat | `/` | `role !== null` |
| Dashboard | `/dashboard` | `role !== null` |
| Admin Panel | `/admin` | `role === 'admin'` |
| Sign out | — | `role !== null` |

- Items not permitted for a role are **absent from the DOM entirely** (not CSS-hidden).
- The existing `IconHistory` / `/history` nav link is removed from the primary nav. History content will live inside the personal Dashboard when Phase 4 is implemented.
- Sign-out behavior is role-aware:
  - `role === 'admin'`: async handler — calls `POST /api/owner/logout`, then `setRole(null)`, then `router.push('/login')`.
  - `role === 'user'`: calls `reset()` (existing behavior, no redirect).
- `useRouter` is imported into `Navigation` to support the admin redirect.

---

### 2.3 API Contracts

#### Existing endpoint — security fix

**`GET /api/owner/stats`** currently has no authentication check, exposing aggregate usage data to any unauthenticated caller.

Fix: add `verifySession` call at the top of the handler (same pattern as all other `owner/` routes). If the cookie is absent or the JWT is invalid, return `401 { error: 'unauthorized' }` immediately. No change to the response shape.

#### Shared auth utility — `src/lib/auth/verifySession.ts`

All `owner/` route handlers currently duplicate the JWT verify logic inline. Extract to a shared function:

- Input: `NextRequest`
- Reads the `intse-session` HTTP-only cookie
- Calls `jwtVerify` (jose) with `JWT_SECRET`
- Returns `SessionPayload | null`

**JWT payload shape going forward:**

| Field | Type | Value |
|---|---|---|
| `sub` | `string` | admin username |
| `role` | `string` | `'admin'` |
| `iat` | `number` | issue time |
| `exp` | `number` | issue time + 24 h |

All existing admin routes (`login`, `logout`, `me`, `stats`, `seed`) are updated to call `verifySession` from this shared utility instead of inlining the logic.

#### New endpoint — per-visitor usage list

**`GET /api/owner/visitors`**

- Auth: admin JWT required (via `verifySession`).
- Query params: `page` (integer ≥ 1, default `1`), `limit` (integer 1–200, default `50`).
- `Visitor.find` and `Visitor.countDocuments` run in parallel.
- Results ordered by `enrolledAt` descending.
- Response `200`:

```
{
  visitors: [{
    visitorId: string,
    enrolledAt: string,     // ISO 8601
    dailyRequests: number,
    dailyTokens: number,
    lastResetAt: string     // ISO 8601
  }],
  total: number,
  page: number,
  limit: number
}
```

- Error responses: `401` unauthorized, `400` invalid params, `500` server error.

#### New endpoint — reset visitor counters

**`POST /api/owner/visitors/[visitorId]/reset`**

- Auth: admin JWT required.
- No request body.
- Uses `Visitor.findOneAndUpdate({ visitorId }, { $set: { dailyRequests: 0, dailyTokens: 0, lastResetAt: new Date() } }, { new: true })`.
- Response `200`:

```
{
  ok: true,
  visitorId: string,
  dailyRequests: 0,
  dailyTokens: 0,
  lastResetAt: string    // ISO 8601
}
```

- Error responses: `401` unauthorized, `404` visitor not found, `500` server error.

#### Admin limit bypass in `/api/chat`

At the top of the chat handler, call `verifySession`. If `payload.role === 'admin'`:
- Skip the daily request and token limit checks entirely.
- Proceed directly to the OpenAI call.
- Still apply counter increments (`$inc dailyRequests`, `$inc dailyTokens`) after the response for observability — they do not gate access for admins.
- If `visitorId` is absent in the request body for an admin session, skip the counter update entirely.

---

### 2.4 Client-Side Route Protection

No Next.js `middleware.ts` is introduced (unnecessary complexity at this scale; Edge Runtime has friction with jose). All protection is `useEffect`-based inside the page component.

**Guard pattern for `/admin` page:**
```
useEffect(() => {
  if (role !== null && role !== 'admin') router.replace('/')
}, [role, router])
```
The `role !== null` pre-condition prevents a premature redirect during the brief `EnrollmentGate` loading window when `role` is always `null` before the async session check resolves.

**Soft guard for `/login` page:**
On mount, if the store already has `role === 'admin'` (set by a prior `EnrollmentGate` check), redirect immediately to `/`. This prevents a re-authenticated admin from seeing the login form.

---

### 2.5 Logout Behavior

- USER sign-out: calls `reset()` — unchanged.
- Admin sign-out: async handler in `Navigation` — calls `POST /api/owner/logout` → `setRole(null)` → `router.push('/login')`. On API failure, a toast notification is shown and the redirect does not fire.
- The standalone "Logout" button inside `AdminPanelPage` (currently in `DashboardPage`) is removed. Sign-out lives only in `Navigation`.
- After admin logout, the browser lands on `/login`, which is outside the `(admin)` route group and thus does not trigger `EnrollmentGate`. No additional changes needed.

---

## 3. Impact and Risk Analysis

**System Dependencies**

- All changes are self-contained within this app. No external services are modified.
- The MongoDB data migration (`updateMany`) must run before the backend deploy. The `setRoleFromApi` mapping in the store absorbs any brief mixed-state window where old JWTs still contain `'owner'`.
- The `/history` primary nav link is removed as part of the navigation restructure. The URL `/history` remains accessible directly; history content will be surfaced inside the personal Dashboard in the Phase 4 spec.

**Potential Risks & Mitigations**

| Risk | Severity | Mitigation |
|---|---|---|
| `role === null` briefly on hard refresh causes guard to fire | Medium | Guard condition requires `role !== null` before evaluating auth |
| `setRoleFromApi` not used in a new file added later | Low | The store action is the single entry point; `setRole` (typed) remains for internal use where role is already known |
| `/admin` and old `/dashboard` coexist during development | Low | Create `/admin` and delete `/dashboard` in the same commit |
| `GET /api/owner/stats` leaks data to unauthenticated callers | High | `verifySession` check added at top of handler as part of this work |
| JWT secret rotation logs out all admins | Low | No refresh token; document this — accept the trade-off |
| Admin resets counters while a chat request is in-flight | Low | MongoDB document-level atomicity handles concurrent `$set` + `$inc` correctly |
| Daily token budget not currently enforced in `/api/chat` | Medium | Noted as a follow-up; per-visitor usage list makes over-consumption visible to admin |

---

## 4. Testing Strategy

Manual verification against the functional spec acceptance criteria is the primary QA method.

**Key scenarios to verify:**

1. Log in as admin → Admin Panel link appears in nav, Dashboard link appears, Chat works with no daily limit.
2. Log out as admin → browser redirects to `/login`; revisiting `/admin` redirects to `/login`.
3. Enroll as a regular visitor → no Admin Panel link in nav, Dashboard link is visible.
4. Regular visitor hits daily limit → chat input disabled, notification shown.
5. Admin resets a visitor's counters → row in Admin Panel updates to zero immediately.
6. Regular visitor navigates to `/admin` directly → silently redirected to `/`.
7. Unauthenticated visitor navigates to `/admin` directly → redirected to `/login`.
8. Call `GET /api/owner/stats` without a session cookie → `401` returned.
