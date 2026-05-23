<!-- This document describes HOW to build the feature at an architectural level. -->

# Technical Specification: Identity & Access — Name-Based Login

- **Functional Specification:** [context/spec/001-identity-access/functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

This spec covers four parallel workstreams that must all land in Phase 1 before any subsequent feature work begins:

1. **Project cleanup** — remove all dead code, broken imports, and unused packages to leave the repo in a clean, public-ready state.
2. **Zustand stores + theme migration** — introduce `useUserStore` and `useSettingsStore`; migrate dark/light theme out of the legacy `ThemeContext`.
3. **Login page + route protection** — build the `/login` page and a `src/middleware.ts` that redirects unauthenticated users (identified by a session cookie) away from protected routes.
4. **Backend auth API + database** — create the `POST /api/auth` route, the Mongoose `User` model, and the MongoDB connection singleton.

**Systems affected:** frontend routing, UI component library, global state layer, a new Next.js API route, and the MongoDB Atlas database.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Project Cleanup

**Critical fix first:** `src/layout/Header.tsx` currently imports `UserMenu` from `@/components/common`, but that file was deleted. The build is broken. This import must be removed or replaced before any other work.

#### 2.1.1 Files to delete

| Path | Reason |
|---|---|
| `src/utils/generateMonthlySinusoid.ts` | Chart data generator — not used in INTSE |
| `src/utils/generateSinusoid.ts` | Chart data generator — not used in INTSE |
| `src/utils/generateWeeklyDates.ts` | Chart data generator — not used in INTSE |
| `src/utils/dynamicSize.ts` | CSS-variable scaler for chart animations — not used in INTSE |
| `src/types/interfaces.ts` | Contains only `ISinusoidOptions` — deleted with chart utils |
| `src/context/ThemeContext.tsx` | Replaced by `useSettingsStore` (see §2.2) |
| `src/assets/icons/forecasting/` _(entire folder)_ | Forecasting feature removed |
| `src/assets/icons/nav/marker-pin.svg` | Not relevant to INTSE |
| `src/assets/icons/nav/package.svg` | Not relevant to INTSE |
| `src/assets/icons/nav/receipt-check.svg` | Not relevant to INTSE |
| `src/assets/icons/nav/shopping-cart.svg` | Not relevant to INTSE |
| `src/assets/icons/nav/switch-vertical.svg` | Not relevant to INTSE |

#### 2.1.2 Packages to uninstall

| Package | Type | Reason |
|---|---|---|
| `recharts` | dependency | Charting library — charts removed |
| `react-dnd` | dependency | Drag-and-drop — not used |
| `react-dropzone` | dependency | File drop zone — not used |
| `flatpickr` | dependency | Date picker — not used |
| `@types/react-transition-group` | devDependency | No transition-group usage |
| `baseline-browser-mapping` | devDependency | No usage found |

#### 2.1.3 Packages to install

| Package | Type | Purpose |
|---|---|---|
| `zustand` | dependency | State management (all three stores) |
| `mongoose` | dependency | MongoDB ODM for User model |
| `idb-keyval` | dependency | Lightweight IndexedDB wrapper (browser storage — used in later phases) |

#### 2.1.4 Icons barrel update (`src/assets/icons/index.tsx`)

Remove all exports for deleted icons: `IconRobust`, `IconMultilocation`, `IconAvailable`, `IconRobustRate`, `IconLocation`, `IconManual`, `IconEye`, `IconMarkerPin`, `IconPackage`, `IconReceipt`, `IconSwitch`, `IconShop`, `IconMarker`.

Keep: `IconSun`, `IconMoon`, `IconBell`, `IconSearch`, `IconEraser`, `IconHome`, `IconLogout`, `IconEllipse`, `IconEllipse_12`.

#### 2.1.5 Components to rebuild/fix

| File | Action | Change |
|---|---|---|
| `src/layout/Header.tsx` | Modify | Remove broken `UserMenu` import; replace with a simple user name display + theme toggle |
| `src/components/common/Navigation.tsx` | Rebuild | Remove all INTSE-irrelevant nav items; keep only the items relevant to Phase 1 (home, logout) |
| `src/components/ui/Logo.tsx` | Modify | Replace `IconPackage` with an INTSE-appropriate mark (text logo or custom SVG) |
| `src/app/layout.tsx` | Modify | Replace `ThemeProvider` with no-op wrapper; swap fonts (see §2.1.6) |
| `src/components/ui/ThemeToggleButton.tsx` | Modify | Replace `useTheme` (ThemeContext) call with `useSettingsStore` |

#### 2.1.6 Font replacement (`src/app/layout.tsx`)

| Replace | With |
|---|---|
| `Open_Sans` from `next/font/google` | `Inter` from `next/font/google` — CSS variable `--font-inter` |
| Local `Fixel Display` | `JetBrains_Mono` from `next/font/google` — CSS variable `--font-mono` |

The `<html>` element receives both font CSS variables. Tailwind config references them as `font-sans` (Inter) and `font-mono` (JetBrains Mono). Default class on `<html>`: `dark`.

---

### 2.2 Zustand Stores

All stores live in `src/store/`. Each store uses Zustand's `persist` middleware to sync with `localStorage`.

#### `useUserStore` — `src/store/useUserStore.ts`

| Field / Action | Type | Description |
|---|---|---|
| `userId` | `string \| null` | MongoDB `_id` of the logged-in user |
| `userName` | `string \| null` | Display name |
| `isLoggedIn` | `boolean` | Derived: `userId !== null` |
| `login(userId, userName)` | action | Populate fields; sets the `intse-session` cookie via `document.cookie` |
| `logout()` | action | Clear fields; clears `intse-session` cookie; clears `localStorage` key `intse-user` |

- **Persistence key:** `intse-user`
- **Hydration:** Zustand `persist` middleware handles rehydration on mount automatically.

#### `useSettingsStore` — `src/store/useSettingsStore.ts`

| Field / Action | Type | Description |
|---|---|---|
| `theme` | `'dark' \| 'light'` | Current UI theme; default `'dark'` |
| `targetLanguage` | `string` | Language to practice; default `'English'` (used in later phases) |
| `toggleTheme()` | action | Flips `theme`; applies/removes `dark` class on `document.documentElement` |

- **Persistence key:** `intse-settings`
- **Side effect on hydration:** after rehydration, apply the stored `theme` class to `<html>`. This must happen inside a `useEffect` in the root layout to avoid SSR mismatch.
- `useChatStore` is introduced in Phase 2 and is out of scope here.

---

### 2.3 Route Protection — Middleware

**File:** `src/middleware.ts`

| Aspect | Detail |
|---|---|
| Protected path pattern | `/(admin)` group — matcher: `'/((?!login|_next|favicon.ico|api).*)'` |
| Auth signal | Cookie `intse-session` — set by `useUserStore.login()`, cleared by `logout()` |
| Unauthenticated behaviour | `NextResponse.redirect('/login')` |
| Authenticated behaviour | `NextResponse.next()` |
| Public paths (no redirect) | `/login`, `/api/*`, `/_next/*`, `/favicon.ico` |

The cookie value is the user's `userId` (MongoDB ObjectId string). It is a plain (non-HttpOnly) cookie because it must also be writable by client-side JavaScript in `useUserStore`. There is no security risk as this app has no passwords or sensitive session data.

---

### 2.4 Login Page

**File:** `src/app/login/page.tsx`

- **Route:** `/login` — outside the `(admin)` group; publicly accessible.
- **Rendering:** Client Component (`'use client'`).
- **On mount:** If `useUserStore.isLoggedIn` is `true` (Zustand rehydrated from localStorage), redirect immediately to `/` (dashboard).

#### Layout structure (mobile-first, dark theme by default)

| Element | Detail |
|---|---|
| Container | Full-viewport centered flex column |
| App logo mark | Text or SVG mark at top |
| Heading | `"INTSE"` — Inter 700, display size |
| Tagline | `"Your AI language practice partner"` — Inter 400, muted color |
| Name input | Full-width, controlled input, placeholder `"Enter your name"` |
| Inline error | Single line below input — `text-error`, visible only when validation fails |
| Continue button | Full-width, accent background, disabled when input is empty |
| Loading state | Button shows spinner while API request is in-flight |

#### Client-side validation (runs on submit, before API call)

| Rule | Error message |
|---|---|
| Length < 2 | `"Name must be at least 2 characters"` |
| Length > 32 | `"Name must be 32 characters or less"` |
| Contains invalid chars | `"Only letters, numbers, and spaces are allowed"` |
| Regex | `/^[a-zA-Z0-9 ]{2,32}$/` |

#### Submit flow

1. Run client-side validation → show inline error and stop if invalid.
2. Set loading state on button.
3. `POST /api/auth` with `{ name }`.
4. **Response `isNew: false`** → show inline error: `"This name is already taken. Please choose a different one."` Clear loading state.
5. **Response `isNew: true`** → call `useUserStore.login(userId, userName)` → redirect to `/`.
6. **Network/server error** → show inline error: `"Something went wrong. Please try again."` Clear loading state.

---

### 2.5 Backend — Auth API Route

**File:** `src/app/api/auth/route.ts`  
**Method:** `POST`  
**Path:** `/api/auth`

#### Request

```
Content-Type: application/json
Body: { "name": string }
```

#### Server-side validation

| Rule | Response on failure |
|---|---|
| `name` missing or not a string | `400 { error: "validation_error", message: "Name is required" }` |
| Length < 2 or > 32 | `400 { error: "validation_error", message: "Name must be 2–32 characters" }` |
| Fails `/^[a-zA-Z0-9 ]+$/` | `400 { error: "validation_error", message: "Only letters, numbers, and spaces are allowed" }` |

#### Logic (plain English)

1. Connect to MongoDB via the connection singleton.
2. Trim whitespace from `name`.
3. Run validation; return 400 if it fails.
4. Call `User.findOne({ name })`.
5. If a user is found → return `200 { user: { id, name, createdAt }, isNew: false }`.
6. If no user found → call `User.create({ name })` → return `200 { user: { id, name, createdAt }, isNew: true }`.
7. On any database error → return `500 { error: "server_error", message: "Internal server error" }`.

#### Success response shape

```
200 OK
{
  "user": {
    "id": string,       // MongoDB ObjectId as string
    "name": string,
    "createdAt": string // ISO 8601 date
  },
  "isNew": boolean
}
```

---

### 2.6 Database — MongoDB User Model

**File:** `src/lib/db/models/User.ts`

| Field | Type | Constraints | Default |
|---|---|---|---|
| `name` | String | required, unique, trim, minlength: 2, maxlength: 32 | — |
| `createdAt` | Date | — | `Date.now` |
| `dailyRequests` | Number | min: 0 | `0` |
| `dailyTokens` | Number | min: 0 | `0` |
| `lastResetAt` | Date | — | `Date.now` |

**Index:** unique index on `name`.  
**Collection name:** `users`.  
**Fields `dailyRequests`, `dailyTokens`, `lastResetAt`** are defined now (they belong to the schema) but only written/read by Phase 2 usage-limit logic.

---

### 2.7 MongoDB Connection Singleton

**File:** `src/lib/mongodb.ts`

| Aspect | Detail |
|---|---|
| Pattern | Module-level cached promise to avoid reconnecting on every serverless invocation |
| Environment variable read | `process.env.MONGODB_URI` |
| Export | A `connectDB()` function; each API route calls it at the top of the handler |
| Error behaviour | Throws if `MONGODB_URI` is not set — surfaces as a 500 in the API route |

---

## 3. Impact and Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| Broken build (missing `UserMenu`) | App cannot start | **Fix first**, in isolation, before any other work |
| Name-as-identity: user on new device is locked out of their name | Medium UX friction | Documented known limitation. Future mitigation: add a numeric suffix suggestion (Phase 3+) |
| Plain session cookie is not HttpOnly | Cookie readable by JS | Acceptable: no passwords exist, cookie only holds a non-sensitive userId |
| Mongoose cold-start on Vercel serverless | First request ~200–500 ms slower | Connection singleton caches across warm invocations; acceptable on free tier |
| `localStorage` not available (private browsing, some browsers) | Zustand persist fails silently | Zustand's `persist` middleware handles this gracefully — app still works, but session is not remembered |
| Removing unused packages may break an implicit import | Potential build error | Audit imports for each removed package before `npm uninstall` |

---

## 4. Testing Strategy

**Cleanup verification**
- `npm run build` must pass cleanly with zero TypeScript errors after cleanup.
- `npm ls recharts react-dnd react-dropzone flatpickr` must return "not found" after uninstall.
- No file in `src/` should import from deleted modules (verify with a grep).

**Login page**
- Manual test: open on a fresh browser profile (no localStorage) → login screen appears.
- Manual test: submit empty name → Continue button is disabled.
- Manual test: submit name with `@` → inline validation error, no API call fired.
- Manual test: submit a name that already exists in the DB → "already taken" error shown.
- Manual test: submit a valid unique name → redirected to dashboard.

**Middleware / route protection**
- Manual test: visit `/(admin)` URL with no `intse-session` cookie → redirected to `/login`.
- Manual test: log in → navigate to `/login` directly → redirected to dashboard.
- Manual test: log out → `/(admin)` URL → redirected to `/login`.

**Theme migration**
- Manual test: toggle theme → class on `<html>` switches between `dark` and `light`.
- Manual test: refresh page → theme is preserved (read from `intse-settings` in localStorage).

**Environment**
- `MONGODB_URI` — MongoDB Atlas connection string (required in Vercel and `.env.local`)
