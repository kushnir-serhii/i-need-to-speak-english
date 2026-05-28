# System Architecture Overview: INTSE (I Need to Speak English)

---

## 1. Application & Technology Stack

- **Framework:** Next.js 16 (App Router) — all pages live under `src/app/(admin)/`; server-side logic lives in `src/app/api/` route handlers.
- **UI Runtime:** React 19 + TypeScript.
- **Styling:** Tailwind CSS v4 (already configured via `@tailwindcss/postcss`).
- **State Management:** Zustand — three stores:
  - `useUserStore` — visitor identity and role (`visitorId: string | null`, `visitorCount: number`, `dailyCap: number`, `dailyRequests: number`, `dailyRequestLimit: number`, `role: 'user' | 'admin' | null`). The `role` field is intentionally excluded from localStorage persistence and is re-derived on every page load via `EnrollmentGate`. The `setRoleFromApi(rawRole: string)` action maps raw API strings to the typed role (e.g., maps legacy `'owner'` → `'admin'`).
  - `useChatStore` — active session messages, streaming state, token counters, `speakingMessageId` (transient — tracks which message is currently being read aloud by TTS).
  - `useSettingsStore` — target language, active system prompt (default vs. custom), `ttsEnabled`, `selectedVoiceURI`, TTS speed (future).
- **AI Client:** `openai` npm package — used exclusively inside Next.js API routes (never imported client-side). Supports streaming responses and token usage reporting.
- **Component Architecture:** Reusable components in `src/components/` (organised by domain: `chat/`, `dashboard/`, `common/`, `ui/`). Pages under `src/app/(admin)/` import and compose these components.

### Folder Structure

```
src/
  app/
    (admin)/
      layout.tsx          ← shared layout (sidebar, header, nav, enrollment gate)
      page.tsx            ← chat interface (home page, all enrolled users)
      admin/
        page.tsx          ← Admin Panel (admin role only): KPI stats, visitor list, reset controls
      dashboard/
        page.tsx          ← personal Dashboard (all enrolled users): usage, settings placeholders
      history/
        page.tsx          ← chat history browser
      settings/
        page.tsx          ← API key input, language, prompt settings
    login/
      page.tsx            ← single login page for all users (role determined by DB)
    api/
      chat/
        route.ts          ← proxy AI requests; bypass limits for admin role
      enroll/
        route.ts          ← anonymous visitor enrollment with daily cap
      stats/
        route.ts          ← per-visitor usage stats (header counter)
      history/
        route.ts          ← list / save chat sessions
        [sessionId]/
          route.ts        ← fetch / delete a specific session
      admin/
        login/
          route.ts        ← POST: bcrypt check, issue 24h JWT, set intse-session cookie
        logout/
          route.ts        ← POST: clear intse-session cookie
        me/
          route.ts        ← GET: verify JWT, return role
        stats/
          route.ts        ← GET: admin aggregate stats (auth required)
        seed/
          route.ts        ← POST: one-time admin account creation
        visitors/
          route.ts        ← GET: paginated visitor list (auth required)
          [visitorId]/
            reset/
              route.ts    ← POST: zero daily counters for a visitor (auth required)
  hooks/
    useSpeechToText.ts    ← STT via Web Speech API
    useTTS.ts             ← TTS via Speech Synthesis API (voice catalogue, playback queue)
  components/
    chat/                 ← MessageBubble, MessageMenu, ChatInput, STTButton, TTSButton
    dashboard/            ← HistoryList, UsageIndicator, LanguageSelector
    common/               ← Navigation (role-aware), Header, EnrollmentGate
    ui/                   ← Button, Popup, Input, ThemeToggle
  store/
    useUserStore.ts       ← role: 'user' | 'admin' | null; setRoleFromApi()
    useChatStore.ts
    useSettingsStore.ts
  lib/
    mongodb.ts            ← Mongoose connection singleton
    openai.ts             ← OpenAI client factory (server-only)
    systemPrompt.ts       ← Default language-learning system prompt
    auth/
      verifySession.ts    ← shared JWT verification utility (returns SessionPayload | null)
    db/
      models/
        Visitor.ts        ← Mongoose Visitor model (anonymous enrolled users)
        Admin.ts          ← Mongoose Admin model (named users with role field)
        ChatSession.ts    ← Mongoose ChatSession model (persisted conversation history)
      resetIfNeeded.ts    ← daily counter reset helper
  types/
  utils/
```

---

## 2. Data & Persistence

- **External Database (server-side):** MongoDB Atlas — free tier (M0). Accessed via `mongoose` ODM from Next.js API routes.
  - **`visitors` collection:** `{ visitorId (String, unique), enrolledAt (Date), dailyRequests (Number), dailyTokens (Number), lastResetAt (Date) }` — anonymous enrolled users; counters reset daily server-side.
  - **`admins` collection:** `{ username (String, unique), passwordHash (String), role ('admin'), createdAt (Date) }` — named users with assigned roles. Role determines access level: `'admin'` bypasses all daily limits and gains access to the Admin Panel. Seeded once via `POST /api/owner/seed` using `OWNER_SEED_SECRET`.
  - **`chat_sessions` collection:** `{ visitorId (String), messages ([{ role, content, createdAt }]), createdAt (Date), updatedAt (Date) }` — full conversation history per visitor, managed via the `ChatSession` Mongoose model. Created and fetched via `/api/history` routes.
- **Browser Storage — Active Session Buffer:** The current in-progress (unsaved) chat session is buffered in **localStorage** via the Zustand persist middleware (key: `intse-chat`). This survives page refreshes within the same browser but is not a permanent record — sessions are saved to MongoDB on completion.
- **Browser Storage — Settings:** Zustand persist middleware (localStorage) for custom system prompt, target language preference, and TTS settings (`useSettingsStore`). Falls back gracefully if storage is unavailable.
- **Note:** `idb-keyval` / IndexedDB is no longer used anywhere in the application.
- **Environment Secrets:** `OPENAI_API_KEY` and `MONGODB_URI` stored as Vercel Environment Variables. Never exposed to the browser bundle.

---

## 3. Infrastructure & Deployment

- **Hosting:** Vercel — free Hobby tier. All Next.js API routes run as serverless functions within Vercel's 10-second execution limit (streaming responses use Vercel's streaming support).
- **CI/CD:** Vercel GitHub integration — push to `main` triggers automatic production deployment. Pull requests receive preview URLs automatically.
- **Database Hosting:** MongoDB Atlas M0 (free tier) — 512 MB storage, shared cluster. Sufficient for user records and daily counters.
- **Static Assets:** Served from Vercel's CDN. SVG icons and fonts are bundled at build time.

---

## 4. External Services & APIs

- **AI Provider:** OpenAI API — GPT-4o (or configurable model). Default key is the owner's; BYO key users supply their own via the settings page. Token usage is read from the API response and stored/displayed per mode.
- **Speech-to-Text (STT):** Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). No external service, no cost. Language is set from `useSettingsStore.targetLanguage`.
- **Text-to-Speech (TTS):** Browser Speech Synthesis API (`speechSynthesis`). No external service, no cost. Voice list is populated from `speechSynthesis.getVoices()` filtered by the selected language.
- **Identity — two tiers:**
  - **Anonymous visitors:** UUID assigned server-side on first visit, stored in browser localStorage (`intse-user` key) and a 1-year `intse-visitor` cookie. Server tracks daily visitor count and per-visitor request counters in MongoDB (`visitors` collection). Role resolves to `'user'`.
  - **Named users (admin role):** Credentials stored in the `admins` MongoDB collection. A single `/login` page accepts username + password for all users. On success, the server issues a 24-hour HTTP-only JWT (`intse-session` cookie) via `POST /api/admin/login`. The JWT payload carries `{ sub, role, iat, exp }`. The shared `src/lib/auth/verifySession.ts` utility verifies this cookie in every protected route handler. If the verified role is `'admin'`, all daily limits are bypassed and the Admin Panel is unlocked. `EnrollmentGate` checks `GET /api/admin/me` on every page load to re-derive the role from the cookie without persisting it in localStorage.

---

## 5. Observability & Monitoring

- **Usage Monitoring:** The `visitors` MongoDB collection is the primary monitoring signal. Daily counters (`dailyRequests`, `dailyTokens`) per visitor provide visibility into consumption. Queried directly via MongoDB Atlas UI or a quick script.
- **Error Handling:** API routes return structured error responses; the universal `Popup` component surfaces limit warnings and errors to the user in-app.
- **Logging:** Vercel's built-in serverless function logs are available in the Vercel dashboard for debugging API route errors during development. No additional logging infrastructure.
