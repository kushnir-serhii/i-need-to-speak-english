# System Architecture Overview: INTSE (I Need to Speak English)

---

## 1. Application & Technology Stack

- **Framework:** Next.js 16 (App Router) — all pages live under `src/app/(admin)/`; server-side logic lives in `src/app/api/` route handlers.
- **UI Runtime:** React 19 + TypeScript.
- **Styling:** Tailwind CSS v4 (already configured via `@tailwindcss/postcss`).
- **State Management:** Zustand — three stores:
  - `useUserStore` — visitor identity (`visitorId: string | null`, `visitorCount: number`, `dailyCap: number`, `dailyRequests: number`, `dailyRequestLimit: number`).
  - `useChatStore` — active session messages, streaming state, token counters.
  - `useSettingsStore` — target language, active system prompt (default vs. custom), TTS speed, selected voice.
- **AI Client:** `openai` npm package — used exclusively inside Next.js API routes (never imported client-side). Supports streaming responses and token usage reporting.
- **Component Architecture:** Reusable components in `src/components/` (organised by domain: `chat/`, `dashboard/`, `common/`, `ui/`). Pages under `src/app/(admin)/` import and compose these components.

### Folder Structure

```
src/
  app/
    (admin)/
      layout.tsx          ← shared layout (sidebar, header, nav)
      page.tsx            ← dashboard home
      chat/
        page.tsx          ← chat interface
      history/
        page.tsx          ← chat history browser
      settings/
        page.tsx          ← API key input, language, prompt settings
    api/
      chat/
        route.ts          ← proxy AI requests, enforce limits
      auth/
        route.ts          ← name-based login / user lookup
      usage/
        route.ts          ← read current user limits
  components/
    chat/                 ← MessageBubble, MessageMenu, ChatInput, STTButton
    dashboard/            ← HistoryList, UsageIndicator, LanguageSelector
    common/               ← Navigation, Header (existing)
    ui/                   ← Button, Popup, Input, ThemeToggle (existing + new)
  store/
    useUserStore.ts
    useChatStore.ts
    useSettingsStore.ts
  lib/
    mongodb.ts            ← Mongoose connection singleton
    openai.ts             ← OpenAI client factory (server-only)
    db/
      models/
        User.ts           ← Mongoose User model
  types/
  utils/
```

---

## 2. Data & Persistence

- **External Database (server-side):** MongoDB Atlas — free tier (M0). Used exclusively for usage control. Accessed via `mongoose` ODM from Next.js API routes.
  - **`visitors` collection:** `{ visitorId (String, unique), enrolledAt (Date), dailyRequests (Number), dailyTokens (Number), lastResetAt (Date) }` — counters reset daily server-side.
- **Browser Storage — Chat History:** IndexedDB via `idb-keyval` (lightweight wrapper). Stores full conversation objects keyed by session ID. Never leaves the device.
- **Browser Storage — Settings:** Same `idb-keyval` store (different keys) for custom system prompt, target language preference, and TTS settings. Falls back gracefully if storage is unavailable.
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
- **Identity:** No auth provider. Anonymous UUID assigned server-side at first visit, stored in browser localStorage (`intse-user` key) and a 1-year `intse-visitor` cookie. Server tracks daily visitor count and per-visitor request counters in MongoDB (`visitors` collection).

---

## 5. Observability & Monitoring

- **Usage Monitoring:** The `visitors` MongoDB collection is the primary monitoring signal. Daily counters (`dailyRequests`, `dailyTokens`) per visitor provide visibility into consumption. Queried directly via MongoDB Atlas UI or a quick script.
- **Error Handling:** API routes return structured error responses; the universal `Popup` component surfaces limit warnings and errors to the user in-app.
- **Logging:** Vercel's built-in serverless function logs are available in the Vercel dashboard for debugging API route errors during development. No additional logging infrastructure.
