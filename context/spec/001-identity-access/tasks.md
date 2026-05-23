# Tasks: Identity & Access — Name-Based Login

> **Rule:** The application must remain buildable and runnable after every slice is completed.
> **Verification tools available:** `npm run build`, `npm run dev`, `curl` (API), manual browser.
> **No browser MCP installed** — UI verification steps are manual.

---

## Slice 1 — Fix Broken Build + Project Cleanup

> **Why first:** `src/layout/Header.tsx` imports a deleted component (`UserMenu`). The app cannot start until this is fixed. All cleanup follows immediately so subsequent slices start from a clean baseline.

- [x] **1.1** Fix the broken `UserMenu` import in `src/layout/Header.tsx` — remove the import and replace the rendered `<UserMenu />` with a placeholder `<div>` (user display will be rebuilt in Slice 4). **[Agent: nextjs-frontend]**

- [x] **1.2** Verify the build passes after the fix:
  ```
  npm run build
  ```
  Expected: zero TypeScript errors, no "Module not found" errors. **[Agent: general-purpose]**

- [x] **1.3** Delete all unused utility files:
  - `src/utils/generateMonthlySinusoid.ts`
  - `src/utils/generateSinusoid.ts`
  - `src/utils/generateWeeklyDates.ts`
  - `src/utils/dynamicSize.ts`
  - `src/types/interfaces.ts`
  **[Agent: general-purpose]**

- [x] **1.4** Delete the legacy ThemeContext file (will be replaced in Slice 2):
  - `src/context/ThemeContext.tsx`
  **[Agent: general-purpose]**

- [x] **1.5** Delete unused icon assets:
  - `src/assets/icons/forecasting/` (entire folder)
  - `src/assets/icons/nav/marker-pin.svg`
  - `src/assets/icons/nav/package.svg`
  - `src/assets/icons/nav/receipt-check.svg`
  - `src/assets/icons/nav/shopping-cart.svg`
  - `src/assets/icons/nav/switch-vertical.svg`
  **[Agent: general-purpose]**

- [x] **1.6** Update `src/assets/icons/index.tsx` — remove all exports for deleted icons. Keep only: `IconSun`, `IconMoon`, `IconBell`, `IconSearch`, `IconEraser`, `IconHome`, `IconLogout`, `IconEllipse`, `IconEllipse_12`. **[Agent: nextjs-frontend]**

- [x] **1.7** Uninstall unused runtime dependencies:
  ```
  npm uninstall recharts react-dnd react-dropzone flatpickr
  ```
  **[Agent: general-purpose]**

- [x] **1.8** Uninstall unused dev dependencies:
  ```
  npm uninstall --save-dev @types/react-transition-group baseline-browser-mapping
  ```
  **[Agent: general-purpose]**

- [x] **1.9** Install required new packages:
  ```
  npm install zustand mongoose idb-keyval
  ```
  **[Agent: general-purpose]**

- [x] **1.10** Rebuild `src/components/common/Navigation.tsx` — remove all nav items irrelevant to INTSE (forecasting, marker, shop, switch, receipt). Keep only the structural shell with Home and Logout placeholders (these will be wired in Slice 7). **[Agent: nextjs-frontend]**

- [x] **1.11** Update `src/components/ui/Logo.tsx` — replace the `IconPackage` icon import (now deleted) with a simple text-based "INTSE" mark. **[Agent: nextjs-frontend]**

- [x] **1.12** Verify the build is still clean after all cleanup:
  ```
  npm run build
  ```
  Expected: zero errors. Confirm removed packages are gone:
  ```
  npm ls recharts react-dnd react-dropzone flatpickr
  ```
  Expected: each returns "not found". **[Agent: general-purpose]**

---

## Slice 2 — Zustand Settings Store + Font & Theme Migration

> **Why second:** Every subsequent slice depends on the design system fonts and on Zustand being available. The legacy `ThemeContext` must be replaced before any new component is built.

- [x] **2.1** Create the `src/store/` directory and create `src/store/useSettingsStore.ts` with:
  - `theme: 'dark' | 'light'` field, default `'dark'`
  - `targetLanguage: string` field, default `'English'`
  - `toggleTheme()` action — flips theme and applies/removes `dark` class on `document.documentElement`
  - Zustand `persist` middleware with localStorage key `intse-settings`
  **[Agent: nextjs-frontend]**

- [x] **2.2** Update `src/app/layout.tsx`:
  - Replace `Open_Sans` import with `Inter` from `next/font/google`, CSS variable `--font-inter`
  - Replace local `Fixel Display` with `JetBrains_Mono` from `next/font/google`, CSS variable `--font-mono`
  - Remove `ThemeProvider` wrapper (ThemeContext is deleted)
  - Add a `useEffect` that reads `useSettingsStore.theme` after hydration and applies the class to `<html>`
  - Set default `className="dark"` on `<html>` to prevent flash on first load
  **[Agent: nextjs-frontend]**

- [x] **2.3** Update `src/components/ui/ThemeToggleButton.tsx` — replace the `useTheme` hook (from deleted ThemeContext) with `useSettingsStore().toggleTheme` and `useSettingsStore().theme`. **[Agent: nextjs-frontend]**

- [x] **2.4** Verify theme migration end-to-end:
  ```
  npm run dev
  ```
  Open `http://localhost:3000` in the browser.
  - Confirm Inter font loads (check in DevTools → Elements → `<html>` font).
  - Click the theme toggle button → `<html>` class switches between `dark` and `light`.
  - Refresh the page → theme is preserved.
  **[Agent: general-purpose]**

---

## Slice 3 — MongoDB Connection + User Model + Auth API

> **Why third:** The backend data layer and API route are independent of the frontend. Getting the API verified with `curl` before building the login form prevents debugging two systems at once.

- [x] **3.1** Create `.env.local` in the project root with:
  ```
  MONGODB_URI=<your MongoDB Atlas connection string>
  ```
  Add `.env.local` to `.gitignore` if not already present. **[Agent: general-purpose]**

- [x] **3.2** Create `src/lib/mongodb.ts` — Mongoose connection singleton:
  - Module-level cached connection promise (survives serverless warm invocations on Vercel)
  - Reads `process.env.MONGODB_URI`; throws a clear error if it is not set
  - Exports a `connectDB()` async function
  **[Agent: nextjs-backend]**

- [x] **3.3** Create `src/lib/db/models/User.ts` — Mongoose User model:
  - Fields: `name` (String, required, unique, trim, minlength 2, maxlength 32), `createdAt` (Date, default now), `dailyRequests` (Number, default 0), `dailyTokens` (Number, default 0), `lastResetAt` (Date, default now)
  - Unique index on `name`
  - Collection name: `users`
  - Guards against Mongoose model re-registration in hot-reload environments (`mongoose.models.User || mongoose.model(...)`)
  **[Agent: mongodb-database]**

- [x] **3.4** Create `src/app/api/auth/route.ts` — POST /api/auth handler:
  - Call `connectDB()` at the top
  - Server-side validation: name required, 2–32 chars, `/^[a-zA-Z0-9 ]+$/`
  - Return `400 { error: "validation_error", message: "..." }` on invalid input
  - `User.findOne({ name })` → if found, return `200 { user: { id, name, createdAt }, isNew: false }`
  - If not found, `User.create({ name })` → return `200 { user: { id, name, createdAt }, isNew: true }`
  - Return `500 { error: "server_error" }` on any database exception
  **[Agent: nextjs-backend]**

- [x] **3.5** Verify the API with `curl` (run `npm run dev` first):

  New unique name → `isNew: true`:
  ```
  curl -s -X POST http://localhost:3000/api/auth \
    -H "Content-Type: application/json" \
    -d '{"name":"TestUser"}' | cat
  ```
  Expected: `{ "user": { "id": "...", "name": "TestUser", "createdAt": "..." }, "isNew": true }`

  Same name again → `isNew: false`:
  ```
  curl -s -X POST http://localhost:3000/api/auth \
    -H "Content-Type: application/json" \
    -d '{"name":"TestUser"}' | cat
  ```
  Expected: `{ "user": { ... }, "isNew": false }`

  Invalid name → 400:
  ```
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth \
    -H "Content-Type: application/json" \
    -d '{"name":"T@"}' 
  ```
  Expected: `400`
  **[Agent: general-purpose]**

---

## Slice 4 — Zustand User Store + Login Page (Static Shell + Client Validation)

> **Why fourth:** Build the login page UI and client-side logic first, verifiable in the browser before wiring the API. Keeps the scope of each slice small.

- [x] **4.1** Create `src/store/useUserStore.ts`:
  - Fields: `userId: string | null`, `userName: string | null`, `isLoggedIn: boolean` (derived from `userId !== null`)
  - Action `login(userId: string, userName: string)` — sets fields and writes cookie `intse-session=<userId>` via `document.cookie` (max-age: 30 days, path: /)
  - Action `logout()` — clears fields, expires the `intse-session` cookie, clears `localStorage` key `intse-user`
  - Zustand `persist` middleware with localStorage key `intse-user`
  **[Agent: nextjs-frontend]**

- [x] **4.2** Create `src/app/login/page.tsx` — login page (Client Component):
  - Full-viewport centered flex column, dark theme by default
  - Elements: INTSE logo mark, heading "INTSE" (Inter 700, 32px), tagline "Your AI language practice partner" (Inter 400, muted), name input (full-width, placeholder "Enter your name"), inline error area (hidden by default), Continue button (full-width, accent, disabled when input is empty)
  - On mount: if `useUserStore.isLoggedIn` is true → redirect to `/`
  - No API call yet — button click only runs client-side validation
  - Design tokens: background `#0D1117`, surface `#161B22`, text `#F0F6FC`, muted `#8B949E`, accent `#2F81F7`
  **[Agent: nextjs-frontend]**

- [x] **4.3** Add client-side validation to the login page submit handler:
  - Regex: `/^[a-zA-Z0-9 ]{2,32}$/`
  - Error messages per the spec: length < 2, length > 32, invalid characters
  - Validation fires on form submit, not on keystroke
  - On validation failure: show inline error, do not proceed to API call
  **[Agent: nextjs-frontend]**

- [x] **4.4** Verify the login page in the browser:
  - `npm run dev` → open `http://localhost:3000/login`
  - Confirm the welcome screen renders with correct fonts and dark theme.
  - Submit empty name → Continue button is disabled.
  - Type `T@` → submit → inline error "Only letters, numbers, and spaces are allowed" appears.
  - Type `T` → submit → inline error "Name must be at least 2 characters" appears.
  - Type a valid name → no error, button enabled (no redirect yet — API not wired).
  **[Agent: general-purpose]**

---

## Slice 5 — Login Page API Integration (Full Submit Flow)

> **Why fifth:** Wire the validated form to POST /api/auth and handle all response cases. After this slice, a user can complete the full login journey end-to-end.

- [x] **5.1** Update `src/app/login/page.tsx` — add API call to the submit handler (after client validation passes):
  - Set button to loading state (spinner, disabled)
  - `POST /api/auth` with `{ name }`
  - **`isNew: true`** → call `useUserStore.login(user.id, user.name)` → `router.push('/')`
  - **`isNew: false`** → show inline error: `"This name is already taken. Please choose a different one."` Clear loading state.
  - **Network or 4xx/5xx error** → show inline error: `"Something went wrong. Please try again."` Clear loading state.
  **[Agent: nextjs-frontend]**

- [x] **5.2** Verify the full login flow in the browser:
  - Open `http://localhost:3000/login` in a fresh private window (no localStorage).
  - Submit a brand-new name → button shows loading → redirected to `/` (dashboard).
  - Open browser DevTools → Application → localStorage → confirm `intse-user` key is set.
  - Open DevTools → Application → Cookies → confirm `intse-session` cookie is set.
  - Open a second private window → go to `/login` → submit the same name → error "This name is already taken" appears, no redirect.
  **[Agent: general-purpose]**

---

## Slice 6 — Next.js Middleware + Route Protection

> **Why sixth:** All admin routes must now be protected. Middleware is the last backend piece before the logout action closes the auth loop.

- [x] **6.1** Create `src/middleware.ts`:
  - Matcher config: `'/((?!login|_next|favicon.ico|api).*)'`
  - Read cookie `intse-session` from the request
  - If cookie is absent or empty → `NextResponse.redirect(new URL('/login', request.url))`
  - If cookie is present → `NextResponse.next()`
  **[Agent: nextjs-backend]**

- [x] **6.2** Verify route protection in the browser:
  - Clear all cookies and localStorage (DevTools → Application → Clear site data).
  - Navigate to `http://localhost:3000/` → should redirect to `/login`.
  - Log in with a valid name → redirected to `/`.
  - While logged in, navigate to `http://localhost:3000/login` directly → should redirect back to `/`.
  **[Agent: general-purpose]**

---

## Slice 7 — Logout + Switch User

> **Why last:** Completes the auth loop. After this slice, the full identity lifecycle (register → persist → protect → logout) is verified end-to-end.

- [x] **7.1** Update `src/layout/Header.tsx` — replace the placeholder `<div>` from Slice 1.1 with:
  - Display the logged-in user's name (read from `useUserStore.userName`)
  - A "Log out" button that calls `useUserStore.logout()`
  **[Agent: nextjs-frontend]**

- [x] **7.2** Update `src/components/common/Navigation.tsx` — wire the Logout nav item (placeholder from Slice 1.10) to `useUserStore.logout()`. **[Agent: nextjs-frontend]**

- [x] **7.3** Verify the full logout flow in the browser:
  - Log in → confirm username appears in the header.
  - Click "Log out" → redirected to `/login`.
  - Check DevTools → Cookies → `intse-session` cookie is gone.
  - Check DevTools → localStorage → `intse-user` key is cleared.
  - Navigate to `http://localhost:3000/` → redirected to `/login` (middleware is enforcing protection).
  - Log in again with the same name → works (isNew:false, existing user returned, redirected to dashboard).
  **[Agent: general-purpose]**

- [x] **7.4** Final build verification — confirm the entire Phase 1 feature ships cleanly:
  ```
  npm run build
  ```
  Expected: zero TypeScript errors, zero warnings about missing modules. **[Agent: general-purpose]**

---

## Subagent Coverage Notes

| Slice / Task | Agent Assigned | Note |
|---|---|---|
| All shell/npm commands | `general-purpose` | File deletion, package install/uninstall, curl verification |
| All React/UI/Zustand work | `nextjs-frontend` | Login page, stores, ThemeToggleButton, Navigation, Header, Logo |
| API route + middleware | `nextjs-backend` | `/api/auth`, `src/middleware.ts`, `src/lib/mongodb.ts` |
| Mongoose model | `mongodb-database` | `src/lib/db/models/User.ts` |

## Missing MCP / Tooling Note

| Verification Step | Issue | Recommendation |
|---|---|---|
| All browser UI checks (Slices 2, 4, 5, 6, 7) | No browser automation MCP installed | Verify manually in browser. Consider installing a browser MCP before Phase 2 for automated UI testing. |
