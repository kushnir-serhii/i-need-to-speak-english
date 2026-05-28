# Tasks: User Roles & Navigation

**Spec:** [functional-spec.md](./functional-spec.md) · [technical-considerations.md](./technical-considerations.md)
**Status:** Ready for implementation

---

## Slice 1 — Role Rename: normalize `'owner'` to `'admin'` throughout

_Goal: the app continues to work exactly as before, but the internal role name is consistently `'admin'`. No UI change visible to users._

- [x] **Backend: update `Admin` model** — remove `'owner'` from the `role` enum; set default to `'admin'`. **[Agent: mongodb-database]**
- [x] **Backend: update `/api/owner/login`** — always embed `role: 'admin'` in the JWT payload and response body (never read `admin.role` from the DB document). **[Agent: nextjs-backend]**
- [x] **Backend: update `/api/owner/me`** — change the fallback from `payload.role ?? 'owner'` to `payload.role ?? 'admin'`. **[Agent: nextjs-backend]**
- [x] **Backend: update `/api/owner/seed`** — create the document with `role: 'admin'`; return `{ role: 'admin' }`. **[Agent: nextjs-backend]**
- [ ] **Data migration** — ⚠️ MANUAL: run `db.admins.updateMany({}, { $set: { role: 'admin' } })` in MongoDB Atlas shell before deploying. **[Agent: mongodb-database]**
- [x] **Frontend: update `UserRole` type and add `setRoleFromApi` action in `useUserStore`** — change `UserRole` from `'user' | 'owner' | null` to `'user' | 'admin' | null`; add `setRoleFromApi(rawRole: string)` that maps `'owner'` or `'admin'` → `'admin'`, anything else → `'user'`, then calls `set`. **[Agent: nextjs-frontend]**
- [x] **Frontend: update `EnrollmentGate`** — replace `setRole(meData.role)` with `setRoleFromApi(meData.role)`. **[Agent: nextjs-frontend]**
- [x] **Frontend: update `LoginPage`** — replace `setRole(data.role)` with `setRoleFromApi(data.role)`; update the response type cast to accept `string`. **[Agent: nextjs-frontend]**
- [x] **Frontend: update all remaining `role === 'owner'` guards** — change to `role === 'admin'` in `Navigation.tsx`, `src/app/(admin)/page.tsx` (`isLimitReached`), and `src/app/(admin)/dashboard/page.tsx`. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 1** — TypeScript compilation passes with zero errors. Auto-accepted per user instruction. **[Agent: nextjs-frontend]**

---

## Slice 2 — Route Restructure & Navigation

_Goal: `/admin` hosts the admin stats panel; `/dashboard` is a new personal page for all users; navigation shows the correct items per role with no broken links._

- [x] **Create `/admin` page** — created `src/app/(admin)/admin/page.tsx`, component renamed `AdminPanelPage`, guard updated, standalone Logout removed. **[Agent: nextjs-frontend]**
- [x] **Create `/dashboard` personal page (shell)** — replaced with personal Dashboard placeholder (Usage + Settings sections). **[Agent: nextjs-frontend]**
- [x] **Delete old `/dashboard` page content** — replaced atomically in same operation. **[Agent: nextjs-frontend]**
- [x] **Update `Navigation`** — role-aware nav: Chat, Dashboard (all), Admin Panel (admin only), Sign out (role-aware async handler). History removed. **[Agent: nextjs-frontend]**
- [x] **Add soft guard to `/login` page** — redirects to `/` if role is already `'admin'`. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 2** — TypeScript compilation passes with zero errors. Auto-accepted per user instruction. **[Agent: nextjs-frontend]**

---

## Slice 3 — Shared `verifySession` + Stats Security Fix

_Goal: a shared auth utility exists; the previously unauthenticated `GET /api/owner/stats` now requires a valid admin session._

- [x] **Extract `verifySession` utility** — created `src/lib/auth/verifySession.ts` with `SessionPayload` interface and `verifySession(request)` function. **[Agent: nextjs-backend]**
- [x] **Migrate all `owner/` routes to use `verifySession`** — `me/route.ts` updated; `login/route.ts` and `seed/route.ts` correctly left unchanged (no verification needed). **[Agent: nextjs-backend]**
- [x] **Add auth guard to `GET /api/owner/stats`** — `verifySession` check added; returns `401` if session absent/invalid. **[Agent: nextjs-backend]**
- [x] **Verify Slice 3** — TypeScript compilation passes with zero errors. Auto-accepted per user instruction. **[Agent: nextjs-backend]**

---

## Slice 4 — Admin Limit Bypass in Chat

_Goal: an authenticated admin can send as many messages as they want without hitting the daily request or token limit._

- [x] **Update `/api/chat`** — `verifySession` called at top; `isAdmin` flag bypasses visitor lookup, `resetIfNeeded`, and all limit checks. Admins always use default OpenAI client. Counter increment preserved. **[Agent: nextjs-backend]**
- [x] **Verify Slice 4** — TypeScript compilation passes with zero errors. Auto-accepted per user instruction. **[Agent: nextjs-backend]**

---

## Slice 5 — Per-Visitor Usage List in Admin Panel

_Goal: the Admin Panel shows a paginated table of all visitors with their daily request and token counts._

- [x] **New API route `GET /api/owner/visitors`** — created `src/app/api/owner/visitors/route.ts` with auth guard, pagination, parallel find+count. **[Agent: nextjs-backend]**
- [x] **Add visitor table to `AdminPanelPage`** — visitors fetched on mount, table rendered with all columns, loading/empty states. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 5** — TypeScript compilation passes with zero errors. Auto-accepted per user instruction. **[Agent: nextjs-frontend]**

---

## Slice 6 — Reset Visitor Counters

_Goal: clicking Reset in the Admin Panel immediately zeroes a visitor's daily usage and the table row updates in place._

- [x] **New API route `POST /api/owner/visitors/[visitorId]/reset`** — created `src/app/api/owner/visitors/[visitorId]/reset/route.ts` with auth guard, findOneAndUpdate, 404 handling. **[Agent: nextjs-backend]**
- [x] **Wire up Reset button in `AdminPanelPage`** — per-row loading state via `Set<string>`, optimistic state update, toast on success/error. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 6** — TypeScript compilation passes with zero errors. Auto-accepted per user instruction. **[Agent: nextjs-frontend]**

---

## Gaps & Recommendations

| Task / Slice | Issue | Recommendation |
|---|---|---|
| Slice 1 — Data migration | Requires a direct MongoDB shell command against Atlas; no migration runner in this project | Run via MongoDB Atlas UI shell or `mongosh` before deploying backend changes. The `mongodb-database` agent can generate the exact command. |
| All Slices — Browser verification | Playwright MCP tools are available as deferred tools and must be loaded via `ToolSearch` before use | No installation needed — the MCP is already configured. Each implementing agent must call `ToolSearch` to load Playwright tool schemas before verifying. |
