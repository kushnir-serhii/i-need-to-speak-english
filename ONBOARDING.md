# INTSE — Project Onboarding

**INTSE (I Need to Speak English)** is a browser-based AI language practice app. Visitors are enrolled anonymously (no login), can type or speak to an AI conversation partner, and hear responses read aloud via the browser's TTS. Deployed on Vercel free tier with MongoDB Atlas M0 as the only external service.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | ^16.0.8 |
| UI Runtime | React + TypeScript | ^19.2.0 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) | v4 |
| State | Zustand with `persist` middleware | ^5.0.13 |
| Database | MongoDB Atlas M0 + Mongoose ODM | ^9.6.2 |
| Browser storage | idb-keyval (IndexedDB, Phase 4) | installed |
| AI | OpenAI SDK — server-side only | installed |
| Fonts | Inter (`--font-inter`) + JetBrains Mono (`--font-mono`) | via `next/font/google` |

---

## Running the Project

```bash
npm run dev      # http://localhost:3000
npm run build    # production build + TypeScript check
```

**Required `.env.local`:**
```
MONGODB_URI=<MongoDB Atlas connection string>
DAILY_VISITOR_CAP=100
DAILY_REQUEST_LIMIT=20
```
`OPENAI_API_KEY` will be needed for Phase 2 chat.

---

## Design System

| Token | Value |
|---|---|
| Background | `#0D1117` |
| Surface | `#161B22` |
| Text | `#F0F6FC` |
| Muted | `#8B949E` |
| Accent (blue) | `#2F81F7` |
| Warning (amber) | `#D29922` |
| Error (red) | `#DA3633` |
| Border radius | 8–12 px |

Dark theme is default; light theme is toggleable via `useSettingsStore.toggleTheme()`. Theme class applied to `<html>`.

---

## Actual File Structure (current state)

```
src/
  app/
    (admin)/
      layout.tsx          ← EnrollmentGate + Sidebar + Header shell
      page.tsx            ← Dashboard home (greeting "Hi, [name]!" / "Hi there!")
    api/
      enroll/route.ts     ← POST /api/enroll — anonymous visitor enrollment
      stats/route.ts      ← GET /api/stats?visitorId=<id> — daily stats + lazy reset
    styles/
      globals.css / theme.css / components.css / utilities.css
    layout.tsx            ← Root layout (Inter + JetBrains Mono fonts, ThemeHydrator)
    not-found.tsx
  components/
    common/
      EnrollmentGate.tsx  ← 'use client' — enrollment logic, DailyLimitScreen inline
      Navigation.tsx
      index.ts
    ui/
      NamePrompt.tsx      ← 'use client' — one-time name prompt overlay
      Logo.tsx / ThemeToggleButton.tsx / ThemeHydrator.tsx
      ButtonOrLink.tsx / InputSearch.tsx
      index.ts
  layout/
    Header.tsx            ← visitor counter + visitor name display + reset button
    Sidebar.tsx
    index.ts
  lib/
    mongodb.ts            ← connectDB() singleton
    db/models/
      Visitor.ts          ← Mongoose model (visitorId, enrolledAt, dailyRequests, dailyTokens, lastResetAt)
  store/
    useUserStore.ts       ← visitorId, visitorCount, dailyCap, dailyRequests, dailyRequestLimit
    useSettingsStore.ts   ← theme, targetLanguage, visitorName, hasSeenNamePrompt
  assets/icons/           ← SVGs: header (bell, eraser, moon, sun, search), nav (home, log-out), bg
  types/svg.d.ts
  utils/cn.ts
  proxy.ts
```

**Not yet created** (planned in upcoming specs):
```
  store/useNotificationStore.ts   ← spec 003 — toast + modal state
  store/useChatStore.ts           ← spec Phase 2
  hooks/useNotification.ts        ← spec 003
  components/ui/Toast.tsx         ← spec 003
  components/ui/ToastContainer.tsx← spec 003
  components/ui/ConfirmModal.tsx  ← spec 003
  app/api/chat/route.ts           ← Phase 2 — AI proxy
```

---

## Zustand Stores

### `useUserStore` — `src/store/useUserStore.ts`
Persisted to `localStorage` key `intse-user`. Also writes cookie `intse-visitor` on `enroll()`.

| Field | Type | Notes |
|---|---|---|
| `visitorId` | `string \| null` | null = not enrolled |
| `visitorCount` | `number` | enrolled today (from last API call) |
| `dailyCap` | `number` | max visitors per day |
| `dailyRequests` | `number` | this visitor's requests today |
| `dailyRequestLimit` | `number` | per-visitor max |

Actions: `enroll(visitorId, count, cap)` · `updateStats(count, cap, dailyRequests, dailyRequestLimit)` · `incrementRequests()` · `reset()`

### `useSettingsStore` — `src/store/useSettingsStore.ts`
Persisted to `localStorage` key `intse-settings`.

| Field | Type | Notes |
|---|---|---|
| `theme` | `'dark' \| 'light'` | default `'dark'` |
| `targetLanguage` | `string` | default `'English'` |
| `visitorName` | `string \| null` | local-only, never sent to server |
| `hasSeenNamePrompt` | `boolean` | prevents re-showing prompt |

Actions: `toggleTheme()` · `setVisitorName(name)` · `markNamePromptSeen()`

### `useNotificationStore` — **NOT YET BUILT** (spec 003)
Will hold ephemeral toast queue + confirmation modal state. No persistence. See spec 003.

### `useChatStore` — **NOT YET BUILT** (Phase 2)
Will hold active session messages, streaming state, token counters.

---

## API Routes

### `POST /api/enroll`
No request body. Server generates UUID. Checks `DAILY_VISITOR_CAP`.

**Response:**
```json
{ "enrolled": true,  "visitorId": "uuid", "count": 4, "cap": 100 }
{ "enrolled": false, "count": 100, "cap": 100 }
```

### `GET /api/stats?visitorId=<id>`
Lazy daily reset: if `lastResetAt < today UTC`, resets `dailyRequests` + `dailyTokens` to 0.

**Response:**
```json
{ "count": 4, "cap": 100, "dailyRequests": 0, "dailyRequestLimit": 20 }
```
Errors: `400 { error: "missing_visitor_id" }` · `404 { error: "not_found" }` · `500 { error: "server_error" }`

---

## Enrollment Flow

`EnrollmentGate` (`src/components/common/EnrollmentGate.tsx`) runs on every page load:

```
visitorId in localStorage?
  YES  →  GET /api/stats  →  updateStats()  →  render app
  NO   →  POST /api/enroll
           enrolled:true   →  enroll()  →  hasSeenNamePrompt?
                                            NO  →  show NamePrompt  →  render app
                                            YES →  render app
           enrolled:false  →  render DailyLimitScreen (inline)
```

---

## AWOS Agent System

The project uses a command system at `.awos/commands/`. Run commands with `/awos:<name>`.

| Command | Purpose |
|---|---|
| `/awos:spec` | Write a functional spec for a feature |
| `/awos:tech` | Write the technical spec (how to build it) |
| `/awos:tasks` | Break the tech spec into vertical-slice tasks |
| `/awos:implement` | Execute tasks one-by-one, delegating to specialist agents |
| `/awos:verify` | Check acceptance criteria, mark spec Completed |
| `/awos:hire` | Add a new specialist agent to `.claude/agents/` |

Specialist agents (`.claude/agents/`):
- `nextjs-frontend` — React, Zustand, Tailwind, STT/TTS
- `nextjs-backend` — API routes, OpenAI streaming, usage limits
- `mongodb-database` — Mongoose models, indexes, IndexedDB design
- `vercel-infra` — Deployment, env vars, function limits

---

## Spec Status

| # | Spec | Status | What it covers |
|---|---|---|---|
| 001 | Identity & Access (name-based login) | ✅ Completed | Project cleanup, fonts, Zustand stores, MongoDB singleton. Auth sections superseded by 002. |
| 002 | Anonymous Access | ✅ Completed | Visitor model, `/api/enroll`, `/api/stats`, EnrollmentGate, NamePrompt, DailyLimitScreen, visitor counter |
| 003 | Universal Notification System | 🔄 **In progress** — tech spec written, tasks not yet generated | Toast (info/warning/error) + confirmation modal |

---

## Roadmap Summary

**Phase 1 — Foundation** (mostly done)
- [x] Anonymous enrollment + daily cap
- [x] Name prompt + visitor counter in header
- [x] MongoDB connection
- [ ] Universal notification component ← **spec 003, next to implement**
- [ ] AI proxy route skeleton ← Phase 2

**Phase 2 — Core Chat** (not started)
- Text chat with streaming AI responses
- Default key mode (per-visitor daily limits via MongoDB)
- BYO key mode (token counter, no limits)
- Limit-reached notification (uses spec 003 toast)

**Phase 3 — Voice** (not started)
- STT via browser Web Speech API
- TTS via browser Speech Synthesis API
- Per-message three-dot menu (speed, voice, repeat, copy, delete)

**Phase 4 — Dashboard & Persistence** (not started)
- Chat history in IndexedDB
- Language selector, custom system prompt toggle
- Usage indicator

---

## What To Do Next

1. **`/awos:tasks`** — generate task list for spec 003 (universal notification)
2. **`/awos:implement`** — implement spec 003 slice by slice
3. **`/awos:verify`** — verify spec 003, mark complete
4. **`/awos:spec`** — write spec for Phase 2 core chat experience

---

## Key Constraints

- `OPENAI_API_KEY` and `MONGODB_URI` are server-side only — never imported client-side
- `openai` npm package used exclusively inside `src/app/api/` routes
- Visitor name is stored in `localStorage` only — never sent to any server
- Chat history will be stored in IndexedDB only — never leaves the device
- Vercel Hobby free tier: 10-second serverless function limit (streaming supported)
- MongoDB Atlas M0: 512 MB shared cluster
